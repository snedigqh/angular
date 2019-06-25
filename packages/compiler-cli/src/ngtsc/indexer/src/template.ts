/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AST, BoundTarget, DirectiveMeta, ImplicitReceiver, MethodCall, PropertyRead, RecursiveAstVisitor} from '@angular/compiler';
import {BoundText, Element, Node, RecursiveVisitor as RecursiveTemplateVisitor, Template} from '@angular/compiler/src/render3/r3_ast';
import {AbsoluteSourceSpan, IdentifierKind, TemplateIdentifier} from './api';

/**
 * A parsed node in a template, which may have a name (if it is a selector) or
 * be anonymous (like a text span).
 */
interface HTMLNode extends Node {
  tagName?: string;
  name?: string;
}

/**
 * Visits the AST of an Angular template syntax expression, finding interesting
 * entities (variable references, etc.). Creates an array of Entities found in
 * the expression, with the location of the Entities being relative to the
 * expression.
 *
 * Visiting `text {{prop}}` will return `[TemplateIdentifier {name: 'prop', span: {start: 7, end:
 * 11}}]`.
 */
class ExpressionVisitor extends RecursiveAstVisitor {
  readonly identifiers: TemplateIdentifier[] = [];

  private constructor(
      context: Node, private readonly boundTemplate: BoundTarget<DirectiveMeta>,
      private readonly expressionStr = context.sourceSpan.toString(),
      private readonly absoluteOffset = context.sourceSpan.start.offset) {
    super();
  }

  /**
   * Returns identifiers discovered in an expression.
   *
   * @param ast expression AST to visit
   * @param context HTML node expression is defined in
   * @param boundTemplate bound target of the entire template, which can be used to query for the
   * entities expressions target.
   */
  static getIdentifiers(ast: AST, context: Node, boundTemplate: BoundTarget<DirectiveMeta>):
      TemplateIdentifier[] {
    const visitor = new ExpressionVisitor(context, boundTemplate);
    visitor.visit(ast);
    return visitor.identifiers;
  }

  visit(ast: AST) { ast.visit(this); }

  visitMethodCall(ast: MethodCall, context: {}) {
    this.visitIdentifier(ast, IdentifierKind.Method);
    super.visitMethodCall(ast, context);
  }

  visitPropertyRead(ast: PropertyRead, context: {}) {
    this.visitIdentifier(ast, IdentifierKind.Property);
    super.visitPropertyRead(ast, context);
  }

  /**
   * Visits an identifier, adding it to the identifier store if it is useful for indexing.
   *
   * @param ast expression AST the identifier is in
   * @param kind identifier kind
   */
  private visitIdentifier(ast: AST&{name: string, receiver: AST}, kind: IdentifierKind) {
    // The definition of a non-top-level property such as `bar` in `{{foo.bar}}` is currently
    // impossible to determine by an indexer and unsupported by the indexing module.
    // The indexing module also does not currently support references to identifiers declared in the
    // template itself, which have a non-null expression target.
    if (!(ast.receiver instanceof ImplicitReceiver) ||
        this.boundTemplate.getExpressionTarget(ast) !== null) {
      return;
    }

    // Get the location of the identifier of real interest.
    // The compiler's expression parser records the location of some expressions in a manner not
    // useful to the indexer. For example, a `MethodCall` `foo(a, b)` will record the span of the
    // entire method call, but the indexer is interested only in the method identifier.
    const localExpression = this.expressionStr.substr(ast.span.start, ast.span.end);
    const identifierStart = ast.span.start + localExpression.indexOf(ast.name);

    // Join the relative position of the expression within a node with the absolute position
    // of the node to get the absolute position of the expression in the source code.
    const absoluteStart = this.absoluteOffset + identifierStart;
    const span = new AbsoluteSourceSpan(absoluteStart, absoluteStart + ast.name.length);

    this.identifiers.push({
      name: ast.name,
      span,
      kind,
    });
  }
}

/**
 * Visits the AST of a parsed Angular template. Discovers and stores
 * identifiers of interest, deferring to an `ExpressionVisitor` as needed.
 */
class TemplateVisitor extends RecursiveTemplateVisitor {
  // identifiers of interest found in the template
  readonly identifiers = new Set<TemplateIdentifier>();

  /**
   * Creates a template visitor for a bound template target. The bound target can be used when
   * deferred to the expression visitor to get information about the target of an expression.
   *
   * @param boundTemplate bound template target
   */
  constructor(private boundTemplate: BoundTarget<DirectiveMeta>) { super(); }

  /**
   * Visits a node in the template.
   *
   * @param node node to visit
   */
  visit(node: HTMLNode) { node.visit(this); }

  visitAll(nodes: Node[]) { nodes.forEach(node => this.visit(node)); }

  visitElement(element: Element) {
    this.visitAll(element.attributes);
    this.visitAll(element.children);
    this.visitAll(element.references);
  }
  visitTemplate(template: Template) {
    this.visitAll(template.attributes);
    this.visitAll(template.children);
    this.visitAll(template.references);
    this.visitAll(template.variables);
  }
  visitBoundText(text: BoundText) { this.visitExpression(text); }

  /**
   * Visits a node's expression and adds its identifiers, if any, to the visitor's state.
   *
   * @param curretNode node whose expression to visit
   */
  private visitExpression(node: Node&{value: AST}) {
    const identifiers = ExpressionVisitor.getIdentifiers(node.value, node, this.boundTemplate);
    identifiers.forEach(id => this.identifiers.add(id));
  }
}

/**
 * Traverses a template AST and builds identifiers discovered in it.
 *
 * @param boundTemplate bound template target, which can be used for querying expression targets.
 * @return identifiers in template
 */
export function getTemplateIdentifiers(boundTemplate: BoundTarget<DirectiveMeta>):
    Set<TemplateIdentifier> {
  const visitor = new TemplateVisitor(boundTemplate);
  if (boundTemplate.target.template !== undefined) {
    visitor.visitAll(boundTemplate.target.template);
  }
  return visitor.identifiers;
}
