/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AST, ASTWithSource, AstVisitor, Binary, BindingPipe, Chain, Conditional, FunctionCall, ImplicitReceiver, Interpolation, KeyedRead, KeyedWrite, LiteralArray, LiteralMap, LiteralPrimitive, MethodCall, NonNullAssert, PrefixNot, PropertyRead, PropertyWrite, Quote, SafeMethodCall, SafePropertyRead} from '@angular/compiler';
import * as ts from 'typescript';

import {TypeCheckingConfig} from './api';

const NULL_AS_ANY =
    ts.createAsExpression(ts.createNull(), ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));
const UNDEFINED = ts.createIdentifier('undefined');

const BINARY_OPS = new Map<string, ts.SyntaxKind>([
  ['+', ts.SyntaxKind.PlusToken],
  ['-', ts.SyntaxKind.MinusToken],
  ['<', ts.SyntaxKind.LessThanToken],
  ['>', ts.SyntaxKind.GreaterThanToken],
  ['<=', ts.SyntaxKind.LessThanEqualsToken],
  ['>=', ts.SyntaxKind.GreaterThanEqualsToken],
  ['==', ts.SyntaxKind.EqualsEqualsToken],
  ['===', ts.SyntaxKind.EqualsEqualsEqualsToken],
  ['*', ts.SyntaxKind.AsteriskToken],
  ['/', ts.SyntaxKind.SlashToken],
  ['%', ts.SyntaxKind.PercentToken],
  ['!=', ts.SyntaxKind.ExclamationEqualsToken],
  ['!==', ts.SyntaxKind.ExclamationEqualsEqualsToken],
  ['||', ts.SyntaxKind.BarBarToken],
  ['&&', ts.SyntaxKind.AmpersandAmpersandToken],
  ['&', ts.SyntaxKind.AmpersandToken],
  ['|', ts.SyntaxKind.BarToken],
]);

/**
 * Convert an `AST` to TypeScript code directly, without going through an intermediate `Expression`
 * AST.
 */
export function astToTypescript(
    ast: AST, maybeResolve: (ast: AST) => ts.Expression | null,
    config: TypeCheckingConfig): ts.Expression {
  const translator = new AstTranslator(maybeResolve, config);
  return translator.translate(ast);
}

class AstTranslator implements AstVisitor {
  constructor(
      private maybeResolve: (ast: AST) => ts.Expression | null,
      private config: TypeCheckingConfig) {}

  translate(ast: AST): ts.Expression {
    // Skip over an `ASTWithSource` as its `visit` method calls directly into its ast's `visit`,
    // which would prevent any custom resolution through `maybeResolve` for that node.
    if (ast instanceof ASTWithSource) {
      ast = ast.ast;
    }

    // First attempt to let any custom resolution logic provide a translation for the given node.
    const resolved = this.maybeResolve(ast);
    if (resolved !== null) {
      return resolved;
    }

    return ast.visit(this);
  }

  visitBinary(ast: Binary): ts.Expression {
    const lhs = this.translate(ast.left);
    const rhs = this.translate(ast.right);
    const op = BINARY_OPS.get(ast.operation);
    if (op === undefined) {
      throw new Error(`Unsupported Binary.operation: ${ast.operation}`);
    }
    return ts.createBinary(lhs, op as any, rhs);
  }

  visitChain(ast: Chain): never { throw new Error('Method not implemented.'); }

  visitConditional(ast: Conditional): ts.Expression {
    const condExpr = this.translate(ast.condition);
    const trueExpr = this.translate(ast.trueExp);
    const falseExpr = this.translate(ast.falseExp);
    return ts.createParen(ts.createConditional(condExpr, trueExpr, falseExpr));
  }

  visitFunctionCall(ast: FunctionCall): never { throw new Error('Method not implemented.'); }

  visitImplicitReceiver(ast: ImplicitReceiver): never {
    throw new Error('Method not implemented.');
  }

  visitInterpolation(ast: Interpolation): ts.Expression {
    return this.astArrayToExpression(ast.expressions);
  }

  visitKeyedRead(ast: KeyedRead): ts.Expression {
    const receiver = this.translate(ast.obj);
    const key = this.translate(ast.key);
    return ts.createElementAccess(receiver, key);
  }

  visitKeyedWrite(ast: KeyedWrite): never { throw new Error('Method not implemented.'); }

  visitLiteralArray(ast: LiteralArray): ts.Expression {
    const elements = ast.expressions.map(expr => this.translate(expr));
    return ts.createArrayLiteral(elements);
  }

  visitLiteralMap(ast: LiteralMap): ts.Expression {
    const properties = ast.keys.map(({key}, idx) => {
      const value = this.translate(ast.values[idx]);
      return ts.createPropertyAssignment(ts.createStringLiteral(key), value);
    });
    return ts.createObjectLiteral(properties, true);
  }

  visitLiteralPrimitive(ast: LiteralPrimitive): ts.Expression {
    if (ast.value === undefined) {
      return ts.createIdentifier('undefined');
    } else if (ast.value === null) {
      return ts.createNull();
    } else {
      return ts.createLiteral(ast.value);
    }
  }

  visitMethodCall(ast: MethodCall): ts.Expression {
    const receiver = this.translate(ast.receiver);
    const method = ts.createPropertyAccess(receiver, ast.name);
    const args = ast.args.map(expr => this.translate(expr));
    return ts.createCall(method, undefined, args);
  }

  visitNonNullAssert(ast: NonNullAssert): ts.Expression {
    const expr = this.translate(ast.expression);
    return ts.createNonNullExpression(expr);
  }

  visitPipe(ast: BindingPipe): never { throw new Error('Method not implemented.'); }

  visitPrefixNot(ast: PrefixNot): ts.Expression {
    return ts.createLogicalNot(this.translate(ast.expression));
  }

  visitPropertyRead(ast: PropertyRead): ts.Expression {
    // This is a normal property read - convert the receiver to an expression and emit the correct
    // TypeScript expression to read the property.
    const receiver = this.translate(ast.receiver);
    return ts.createPropertyAccess(receiver, ast.name);
  }

  visitPropertyWrite(ast: PropertyWrite): never { throw new Error('Method not implemented.'); }

  visitQuote(ast: Quote): never { throw new Error('Method not implemented.'); }

  visitSafeMethodCall(ast: SafeMethodCall): ts.Expression {
    // See the comment in SafePropertyRead above for an explanation of the need for the non-null
    // assertion here.
    const receiver = this.translate(ast.receiver);
    const method = ts.createPropertyAccess(ts.createNonNullExpression(receiver), ast.name);
    const args = ast.args.map(expr => this.translate(expr));
    const expr = ts.createCall(method, undefined, args);
    const whenNull = this.config.strictSafeNavigationTypes ? UNDEFINED : NULL_AS_ANY;
    return safeTernary(receiver, expr, whenNull);
  }

  visitSafePropertyRead(ast: SafePropertyRead): ts.Expression {
    // A safe property expression a?.b takes the form `(a != null ? a!.b : whenNull)`, where
    // whenNull is either of type 'any' or or 'undefined' depending on strictness. The non-null
    // assertion is necessary because in practice 'a' may be a method call expression, which won't
    // have a narrowed type when repeated in the ternary true branch.
    const receiver = this.translate(ast.receiver);
    const expr = ts.createPropertyAccess(ts.createNonNullExpression(receiver), ast.name);
    const whenNull = this.config.strictSafeNavigationTypes ? UNDEFINED : NULL_AS_ANY;
    return safeTernary(receiver, expr, whenNull);
  }

  /**
   * Convert an array of `AST` expressions into a single `ts.Expression`, by converting them all
   * and separating them with commas.
   */
  private astArrayToExpression(astArray: AST[]): ts.Expression {
    // Reduce the `asts` array into a `ts.Expression`. Multiple expressions are combined into a
    // `ts.BinaryExpression` with a comma separator. First make a copy of the input array, as
    // it will be modified during the reduction.
    const asts = astArray.slice();
    return asts.reduce(
        (lhs, ast) => ts.createBinary(lhs, ts.SyntaxKind.CommaToken, this.translate(ast)),
        this.translate(asts.pop() !));
  }
}

function safeTernary(
    lhs: ts.Expression, whenNotNull: ts.Expression, whenNull: ts.Expression): ts.Expression {
  const notNullComp = ts.createBinary(lhs, ts.SyntaxKind.ExclamationEqualsToken, ts.createNull());
  const ternary = ts.createConditional(notNullComp, whenNotNull, whenNull);
  return ts.createParen(ternary);
}
