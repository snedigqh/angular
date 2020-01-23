/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {CompileSummaryKind, StaticSymbol} from '@angular/compiler';
import * as ts from 'typescript';

import {AstResult} from './common';
import {locateSymbols} from './locate_symbol';
import * as ng from './types';
import {TypeScriptServiceHost} from './typescript_host';
import {findTightestNode} from './utils';


// Reverse mappings of enum would generate strings
const SYMBOL_SPACE = ts.SymbolDisplayPartKind[ts.SymbolDisplayPartKind.space];
const SYMBOL_PUNC = ts.SymbolDisplayPartKind[ts.SymbolDisplayPartKind.punctuation];
const SYMBOL_CLASS = ts.SymbolDisplayPartKind[ts.SymbolDisplayPartKind.className];
const SYMBOL_TEXT = ts.SymbolDisplayPartKind[ts.SymbolDisplayPartKind.text];
const SYMBOL_INTERFACE = ts.SymbolDisplayPartKind[ts.SymbolDisplayPartKind.interfaceName];

/**
 * Traverse the template AST and look for the symbol located at `position`, then
 * return the corresponding quick info.
 * @param info template AST
 * @param position location of the symbol
 * @param host Language Service host to query
 */
export function getHover(info: AstResult, position: number, host: Readonly<TypeScriptServiceHost>):
    ts.QuickInfo|undefined {
  const symbolInfo = locateSymbols(info, position)[0];
  if (!symbolInfo) {
    return;
  }

  const {symbol, span, compileTypeSummary} = symbolInfo;
  const textSpan = {start: span.start, length: span.end - span.start};

  if (compileTypeSummary && compileTypeSummary.summaryKind === CompileSummaryKind.Directive) {
    return getDirectiveModule(compileTypeSummary.type.reference, textSpan, host, symbol);
  }

  const containerDisplayParts: ts.SymbolDisplayPart[] = symbol.container ?
      [
        {text: symbol.container.name, kind: symbol.container.kind},
        {text: '.', kind: SYMBOL_PUNC},
      ] :
      [];
  const typeDisplayParts: ts.SymbolDisplayPart[] = symbol.type ?
      [
        {text: ':', kind: SYMBOL_PUNC},
        {text: ' ', kind: SYMBOL_SPACE},
        {text: symbol.type.name, kind: SYMBOL_INTERFACE},
      ] :
      [];
  return {
    kind: symbol.kind as ts.ScriptElementKind,
    kindModifiers: '',  // kindModifier info not available on 'ng.Symbol'
    textSpan,
    documentation: symbol.documentation,
    // this would generate a string like '(property) ClassX.propY: type'
    // 'kind' in displayParts does not really matter because it's dropped when
    // displayParts get converted to string.
    displayParts: [
      {text: '(', kind: SYMBOL_PUNC},
      {text: symbol.kind, kind: symbol.kind},
      {text: ')', kind: SYMBOL_PUNC},
      {text: ' ', kind: SYMBOL_SPACE},
      ...containerDisplayParts,
      {text: symbol.name, kind: symbol.kind},
      ...typeDisplayParts,
    ],
  };
}

/**
 * Get quick info for Angular semantic entities in TypeScript files, like Directives.
 * @param sf TypeScript source file an Angular symbol is in
 * @param position location of the symbol in the source file
 * @param host Language Service host to query
 */
export function getTsHover(
    sf: ts.SourceFile, position: number, host: Readonly<TypeScriptServiceHost>): ts.QuickInfo|
    undefined {
  const node = findTightestNode(sf, position);
  if (!node) return;
  switch (node.kind) {
    case ts.SyntaxKind.Identifier:
      const directiveId = node as ts.Identifier;
      if (ts.isClassDeclaration(directiveId.parent)) {
        const directiveName = directiveId.text;
        const directiveSymbol = host.getStaticSymbol(node.getSourceFile().fileName, directiveName);
        if (!directiveSymbol) return;
        return getDirectiveModule(
            directiveSymbol,
            {start: directiveId.getStart(), length: directiveId.end - directiveId.getStart()},
            host);
      }
      break;
    default:
      break;
  }
  return undefined;
}

/**
 * Attempts to get quick info for the NgModule a Directive is declared in.
 * @param directive identifier on a potential Directive class declaration
 * @param textSpan span of the symbol
 * @param host Language Service host to query
 * @param symbol the internal symbol that represents the directive
 */
function getDirectiveModule(
    directive: StaticSymbol, textSpan: ts.TextSpan, host: Readonly<TypeScriptServiceHost>,
    symbol?: ng.Symbol): ts.QuickInfo|undefined {
  const analyzedModules = host.getAnalyzedModules(false);
  const ngModule = analyzedModules.ngModuleByPipeOrDirective.get(directive);
  if (!ngModule) return;

  const isComponent =
      host.getDeclarations(directive.filePath)
          .find(decl => decl.type === directive && decl.metadata && decl.metadata.isComponent);

  const moduleName = ngModule.type.reference.name;
  return {
    kind: ts.ScriptElementKind.classElement,
    kindModifiers:
        ts.ScriptElementKindModifier.none,  // kindModifier info not available on 'ng.Symbol'
    textSpan,
    documentation: symbol ? symbol.documentation : undefined,
    // This generates a string like '(directive) NgModule.Directive: class'
    // 'kind' in displayParts does not really matter because it's dropped when
    // displayParts get converted to string.
    displayParts: [
      {text: '(', kind: SYMBOL_PUNC},
      {text: isComponent ? 'component' : 'directive', kind: SYMBOL_TEXT},
      {text: ')', kind: SYMBOL_PUNC},
      {text: ' ', kind: SYMBOL_SPACE},
      {text: moduleName, kind: SYMBOL_CLASS},
      {text: '.', kind: SYMBOL_PUNC},
      {text: directive.name, kind: SYMBOL_CLASS},
      {text: ':', kind: SYMBOL_PUNC},
      {text: ' ', kind: SYMBOL_SPACE},
      {text: ts.ScriptElementKind.classElement, kind: SYMBOL_TEXT},
    ],
  };
}
