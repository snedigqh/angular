/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AST, AstPath, Attribute, BoundDirectivePropertyAst, BoundElementPropertyAst, BoundEventAst, BoundTextAst, CompileDirectiveSummary, CompileTypeMetadata, DirectiveAst, ElementAst, EmbeddedTemplateAst, Node, ParseSourceSpan, RecursiveTemplateAstVisitor, ReferenceAst, TemplateAst, TemplateAstPath, VariableAst, identifierName, templateVisitAll, tokenReference} from '@angular/compiler';
import * as ts from 'typescript';

import {AstType, ExpressionDiagnosticsContext, TypeDiagnostic} from './expression_type';
import {BuiltinType, Definition, Span, Symbol, SymbolDeclaration, SymbolQuery, SymbolTable} from './symbols';
import {Diagnostic} from './types';
import {findOutputBinding, getPathToNodeAtPosition} from './utils';

export interface DiagnosticTemplateInfo {
  fileName?: string;
  offset: number;
  query: SymbolQuery;
  members: SymbolTable;
  htmlAst: Node[];
  templateAst: TemplateAst[];
}

export function getTemplateExpressionDiagnostics(info: DiagnosticTemplateInfo): Diagnostic[] {
  const visitor = new ExpressionDiagnosticsVisitor(
      info, (path: TemplateAstPath) => getExpressionScope(info, path));
  templateVisitAll(visitor, info.templateAst);
  return visitor.diagnostics;
}

export function getExpressionDiagnostics(
    scope: SymbolTable, ast: AST, query: SymbolQuery,
    context: ExpressionDiagnosticsContext = {}): TypeDiagnostic[] {
  const analyzer = new AstType(scope, query, context);
  analyzer.getDiagnostics(ast);
  return analyzer.diagnostics;
}

function getReferences(info: DiagnosticTemplateInfo): SymbolDeclaration[] {
  const result: SymbolDeclaration[] = [];

  function processReferences(references: ReferenceAst[]) {
    for (const reference of references) {
      let type: Symbol|undefined = undefined;
      if (reference.value) {
        type = info.query.getTypeSymbol(tokenReference(reference.value));
      }
      result.push({
        name: reference.name,
        kind: 'reference',
        type: type || info.query.getBuiltinType(BuiltinType.Any),
        get definition() { return getDefinitionOf(info, reference); }
      });
    }
  }

  const visitor = new class extends RecursiveTemplateAstVisitor {
    visitEmbeddedTemplate(ast: EmbeddedTemplateAst, context: any): any {
      super.visitEmbeddedTemplate(ast, context);
      processReferences(ast.references);
    }
    visitElement(ast: ElementAst, context: any): any {
      super.visitElement(ast, context);
      processReferences(ast.references);
    }
  };

  templateVisitAll(visitor, info.templateAst);

  return result;
}

function getDefinitionOf(info: DiagnosticTemplateInfo, ast: TemplateAst): Definition|undefined {
  if (info.fileName) {
    const templateOffset = info.offset;
    return [{
      fileName: info.fileName,
      span: {
        start: ast.sourceSpan.start.offset + templateOffset,
        end: ast.sourceSpan.end.offset + templateOffset
      }
    }];
  }
}

/**
 * Resolve all variable declarations in a template by traversing the specified
 * `path`.
 * @param info
 * @param path template AST path
 */
function getVarDeclarations(
    info: DiagnosticTemplateInfo, path: TemplateAstPath): SymbolDeclaration[] {
  const results: SymbolDeclaration[] = [];
  for (let current = path.head; current; current = path.childOf(current)) {
    if (!(current instanceof EmbeddedTemplateAst)) {
      continue;
    }
    for (const variable of current.variables) {
      let symbol = info.members.get(variable.value) || info.query.getBuiltinType(BuiltinType.Any);
      const kind = info.query.getTypeKind(symbol);
      if (kind === BuiltinType.Any || kind === BuiltinType.Unbound) {
        // For special cases such as ngFor and ngIf, the any type is not very useful.
        // We can do better by resolving the binding value.
        const symbolsInScope = info.query.mergeSymbolTable([
          info.members,
          // Since we are traversing the AST path from head to tail, any variables
          // that have been declared so far are also in scope.
          info.query.createSymbolTable(results),
        ]);
        symbol = refinedVariableType(variable.value, symbolsInScope, info.query, current);
      }
      results.push({
        name: variable.name,
        kind: 'variable',
        type: symbol, get definition() { return getDefinitionOf(info, variable); },
      });
    }
  }
  return results;
}

/**
 * Gets the type of an ngFor exported value, as enumerated in
 * https://angular.io/api/common/NgForOfContext
 * @param value exported value name
 * @param query type symbol query
 */
function getNgForExportedValueType(value: string, query: SymbolQuery): Symbol|undefined {
  switch (value) {
    case 'index':
    case 'count':
      return query.getBuiltinType(BuiltinType.Number);
    case 'first':
    case 'last':
    case 'even':
    case 'odd':
      return query.getBuiltinType(BuiltinType.Boolean);
  }
}

/**
 * Resolve a more specific type for the variable in `templateElement` by inspecting
 * all variables that are in scope in the `mergedTable`. This function is a special
 * case for `ngFor` and `ngIf`. If resolution fails, return the `any` type.
 * @param value variable value name
 * @param mergedTable symbol table for all variables in scope
 * @param query
 * @param templateElement
 */
function refinedVariableType(
    value: string, mergedTable: SymbolTable, query: SymbolQuery,
    templateElement: EmbeddedTemplateAst): Symbol {
  // Special case the ngFor directive
  const ngForDirective = templateElement.directives.find(d => {
    const name = identifierName(d.directive.type);
    return name == 'NgFor' || name == 'NgForOf';
  });
  if (ngForDirective) {
    const ngForOfBinding = ngForDirective.inputs.find(i => i.directiveName == 'ngForOf');
    if (ngForOfBinding) {
      // Check if the variable value is a type exported by the ngFor statement.
      let result = getNgForExportedValueType(value, query);

      // Otherwise, check if there is a known type for the ngFor binding.
      const bindingType = new AstType(mergedTable, query, {}).getType(ngForOfBinding.value);
      if (!result && bindingType) {
        result = query.getElementType(bindingType);
      }

      if (result) {
        return result;
      }
    }
  }

  // Special case the ngIf directive ( *ngIf="data$ | async as variable" )
  const ngIfDirective =
      templateElement.directives.find(d => identifierName(d.directive.type) === 'NgIf');
  if (ngIfDirective) {
    const ngIfBinding = ngIfDirective.inputs.find(i => i.directiveName === 'ngIf');
    if (ngIfBinding) {
      const bindingType = new AstType(mergedTable, query, {}).getType(ngIfBinding.value);
      if (bindingType) {
        return bindingType;
      }
    }
  }

  // We can't do better, return any
  return query.getBuiltinType(BuiltinType.Any);
}

function getEventDeclaration(
    info: DiagnosticTemplateInfo, path: TemplateAstPath): SymbolDeclaration|undefined {
  const event = path.tail;
  if (!(event instanceof BoundEventAst)) {
    // No event available in this context.
    return;
  }

  const genericEvent: SymbolDeclaration = {
    name: '$event',
    kind: 'variable',
    type: info.query.getBuiltinType(BuiltinType.Any),
  };

  const outputSymbol = findOutputBinding(event, path, info.query);
  if (!outputSymbol) {
    // The `$event` variable doesn't belong to an output, so its type can't be refined.
    // TODO: type `$event` variables in bindings to DOM events.
    return genericEvent;
  }

  // The raw event type is wrapped in a generic, like EventEmitter<T> or Observable<T>.
  const ta = outputSymbol.typeArguments();
  if (!ta || ta.length !== 1) return genericEvent;
  const eventType = ta[0];

  return {...genericEvent, type: eventType};
}

/**
 * Returns the symbols available in a particular scope of a template.
 * @param info parsed template information
 * @param path path of template nodes narrowing to the context the expression scope should be
 * derived for.
 */
export function getExpressionScope(
    info: DiagnosticTemplateInfo, path: TemplateAstPath): SymbolTable {
  let result = info.members;
  const references = getReferences(info);
  const variables = getVarDeclarations(info, path);
  const event = getEventDeclaration(info, path);
  if (references.length || variables.length || event) {
    const referenceTable = info.query.createSymbolTable(references);
    const variableTable = info.query.createSymbolTable(variables);
    const eventsTable = info.query.createSymbolTable(event ? [event] : []);
    result = info.query.mergeSymbolTable([result, referenceTable, variableTable, eventsTable]);
  }
  return result;
}

class ExpressionDiagnosticsVisitor extends RecursiveTemplateAstVisitor {
  private path: TemplateAstPath;
  private directiveSummary: CompileDirectiveSummary|undefined;

  diagnostics: Diagnostic[] = [];

  constructor(
      private info: DiagnosticTemplateInfo,
      private getExpressionScope: (path: TemplateAstPath, includeEvent: boolean) => SymbolTable) {
    super();
    this.path = new AstPath<TemplateAst>([]);
  }

  visitDirective(ast: DirectiveAst, context: any): any {
    // Override the default child visitor to ignore the host properties of a directive.
    if (ast.inputs && ast.inputs.length) {
      templateVisitAll(this, ast.inputs, context);
    }
  }

  visitBoundText(ast: BoundTextAst): void {
    this.push(ast);
    this.diagnoseExpression(ast.value, ast.sourceSpan.start.offset, false);
    this.pop();
  }

  visitDirectiveProperty(ast: BoundDirectivePropertyAst): void {
    this.push(ast);
    this.diagnoseExpression(ast.value, this.attributeValueLocation(ast), false);
    this.pop();
  }

  visitElementProperty(ast: BoundElementPropertyAst): void {
    this.push(ast);
    this.diagnoseExpression(ast.value, this.attributeValueLocation(ast), false);
    this.pop();
  }

  visitEvent(ast: BoundEventAst): void {
    this.push(ast);
    this.diagnoseExpression(ast.handler, this.attributeValueLocation(ast), true);
    this.pop();
  }

  visitVariable(ast: VariableAst): void {
    const directive = this.directiveSummary;
    if (directive && ast.value) {
      const context = this.info.query.getTemplateContext(directive.type.reference) !;
      if (context && !context.has(ast.value)) {
        if (ast.value === '$implicit') {
          this.reportError(
              `The template context of '${directive.type.reference.name}' does not define an implicit value.\n` +
                  `If the context type is a base type, consider refining it to a more specific type.`,
              spanOf(ast.sourceSpan));
        } else {
          this.reportError(
              `The template context of '${directive.type.reference.name}' does not define a member called '${ast.value}'`,
              spanOf(ast.sourceSpan));
        }
      }
    }
  }

  visitElement(ast: ElementAst, context: any): void {
    this.push(ast);
    super.visitElement(ast, context);
    this.pop();
  }

  visitEmbeddedTemplate(ast: EmbeddedTemplateAst, context: any): any {
    const previousDirectiveSummary = this.directiveSummary;

    this.push(ast);

    // Find directive that references this template
    this.directiveSummary =
        ast.directives.map(d => d.directive).find(d => hasTemplateReference(d.type)) !;

    // Process children
    super.visitEmbeddedTemplate(ast, context);

    this.pop();

    this.directiveSummary = previousDirectiveSummary;
  }

  private attributeValueLocation(ast: TemplateAst) {
    const path = getPathToNodeAtPosition(this.info.htmlAst, ast.sourceSpan.start.offset);
    const last = path.tail;
    if (last instanceof Attribute && last.valueSpan) {
      return last.valueSpan.start.offset;
    }
    return ast.sourceSpan.start.offset;
  }

  private diagnoseExpression(ast: AST, offset: number, includeEvent: boolean) {
    const scope = this.getExpressionScope(this.path, includeEvent);
    this.diagnostics.push(...getExpressionDiagnostics(scope, ast, this.info.query, {
                            event: includeEvent
                          }).map(d => ({
                                   span: offsetSpan(d.ast.span, offset + this.info.offset),
                                   kind: d.kind,
                                   message: d.message
                                 })));
  }

  private push(ast: TemplateAst) { this.path.push(ast); }

  private pop() { this.path.pop(); }

  private reportError(message: string, span: Span|undefined) {
    if (span) {
      this.diagnostics.push(
          {span: offsetSpan(span, this.info.offset), kind: ts.DiagnosticCategory.Error, message});
    }
  }
}

function hasTemplateReference(type: CompileTypeMetadata): boolean {
  if (type.diDeps) {
    for (let diDep of type.diDeps) {
      if (diDep.token && diDep.token.identifier &&
          identifierName(diDep.token !.identifier !) == 'TemplateRef')
        return true;
    }
  }
  return false;
}

function offsetSpan(span: Span, amount: number): Span {
  return {start: span.start + amount, end: span.end + amount};
}

function spanOf(sourceSpan: ParseSourceSpan): Span {
  return {start: sourceSpan.start.offset, end: sourceSpan.end.offset};
}
