/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as path from 'path';
import * as ts from 'typescript';

import {relativePathBetween} from '../../util/src/path';

import {ShimGenerator} from './host';
import {generatedModuleName, isNonDeclarationTsFile} from './util';

const TS_DTS_SUFFIX = /(\.d)?\.ts$/;
const STRIP_NG_FACTORY = /(.*)NgFactory$/;

/**
 * Generates ts.SourceFiles which contain variable declarations for NgFactories for every exported
 * class of an input ts.SourceFile.
 */
export class FactoryGenerator implements ShimGenerator {
  private constructor(private map: Map<string, string>) {}

  get factoryFileMap(): Map<string, string> { return this.map; }

  recognize(fileName: string): boolean { return this.map.has(fileName); }

  generate(genFilePath: string, readFile: (fileName: string) => ts.SourceFile | null): ts.SourceFile
      |null {
    const originalPath = this.map.get(genFilePath) !;
    const original = readFile(originalPath);
    if (original === null) {
      return null;
    }

    const relativePathToSource =
        './' + path.posix.basename(original.fileName).replace(TS_DTS_SUFFIX, '');
    // Collect a list of classes that need to have factory types emitted for them. This list is
    // overly broad as at this point the ts.TypeChecker hasn't been created, and can't be used to
    // semantically understand which decorated types are actually decorated with Angular decorators.
    //
    // The exports generated here are pruned in the factory transform during emit.
    const symbolNames = original
                            .statements
                            // Pick out top level class declarations...
                            .filter(ts.isClassDeclaration)
                            // which are named, exported, and have decorators.
                            .filter(
                                decl => isExported(decl) && decl.decorators !== undefined &&
                                    decl.name !== undefined)
                            // Grab the symbol name.
                            .map(decl => decl.name !.text);

    let sourceText = '';
    if (symbolNames.length > 0) {
      // For each symbol name, generate a constant export of the corresponding NgFactory.
      // This will encompass a lot of symbols which don't need factories, but that's okay
      // because it won't miss any that do.
      const varLines = symbolNames.map(
          name => `export const ${name}NgFactory = new i0.ɵNgModuleFactory(${name});`);
      sourceText = [
        // This might be incorrect if the current package being compiled is Angular core, but it's
        // okay to leave in at type checking time. TypeScript can handle this reference via its path
        // mapping, but downstream bundlers can't. If the current package is core itself, this will
        // be replaced in the factory transformer before emit.
        `import * as i0 from '@angular/core';`,
        `import {${symbolNames.join(', ')}} from '${relativePathToSource}';`,
        ...varLines,
      ].join('\n');
    }

    // Add an extra export to ensure this module has at least one. It'll be removed later in the
    // factory transformer if it ends up not being needed.
    sourceText += '\nexport const ɵNonEmptyModule = true;';

    const genFile = ts.createSourceFile(
        genFilePath, sourceText, original.languageVersion, true, ts.ScriptKind.TS);
    if (original.moduleName !== undefined) {
      genFile.moduleName =
          generatedModuleName(original.moduleName, original.fileName, '.ngfactory');
    }
    return genFile;
  }

  static forRootFiles(files: ReadonlyArray<string>): FactoryGenerator {
    const map = new Map<string, string>();
    files.filter(sourceFile => isNonDeclarationTsFile(sourceFile))
        .forEach(sourceFile => map.set(sourceFile.replace(/\.ts$/, '.ngfactory.ts'), sourceFile));
    return new FactoryGenerator(map);
  }
}

function isExported(decl: ts.Declaration): boolean {
  return decl.modifiers !== undefined &&
      decl.modifiers.some(mod => mod.kind == ts.SyntaxKind.ExportKeyword);
}

export interface FactoryInfo {
  sourceFilePath: string;
  moduleSymbolNames: Set<string>;
}

export function generatedFactoryTransform(
    factoryMap: Map<string, FactoryInfo>,
    coreImportsFrom: ts.SourceFile | null): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
    return (file: ts.SourceFile): ts.SourceFile => {
      return transformFactorySourceFile(factoryMap, context, coreImportsFrom, file);
    };
  };
}

function transformFactorySourceFile(
    factoryMap: Map<string, FactoryInfo>, context: ts.TransformationContext,
    coreImportsFrom: ts.SourceFile | null, file: ts.SourceFile): ts.SourceFile {
  // If this is not a generated file, it won't have factory info associated with it.
  if (!factoryMap.has(file.fileName)) {
    // Don't transform non-generated code.
    return file;
  }

  const {moduleSymbolNames, sourceFilePath} = factoryMap.get(file.fileName) !;

  const clone = ts.getMutableClone(file);

  // Not every exported factory statement is valid. They were generated before the program was
  // analyzed, and before ngtsc knew which symbols were actually NgModules. factoryMap contains
  // that knowledge now, so this transform filters the statement list and removes exported factories
  // that aren't actually factories.
  //
  // This could leave the generated factory file empty. To prevent this (it causes issues with
  // closure compiler) a 'ɵNonEmptyModule' export was added when the factory shim was created.
  // Preserve that export if needed, and remove it otherwise.
  //
  // Additionally, an import to @angular/core is generated, but the current compilation unit could
  // actually be @angular/core, in which case such an import is invalid and should be replaced with
  // the proper path to access Ivy symbols in core.

  // The filtered set of statements.
  const transformedStatements: ts.Statement[] = [];

  // The statement identified as the ɵNonEmptyModule export.
  let nonEmptyExport: ts.Statement|null = null;

  // Consider all the statements.
  for (const stmt of file.statements) {
    // Look for imports to @angular/core.
    if (coreImportsFrom !== null && ts.isImportDeclaration(stmt) &&
        ts.isStringLiteral(stmt.moduleSpecifier) && stmt.moduleSpecifier.text === '@angular/core') {
      // Update the import path to point to the correct file (coreImportsFrom).
      const path = relativePathBetween(sourceFilePath, coreImportsFrom.fileName);
      if (path !== null) {
        transformedStatements.push(ts.updateImportDeclaration(
            stmt, stmt.decorators, stmt.modifiers, stmt.importClause,
            ts.createStringLiteral(path)));
      }
    } else if (ts.isVariableStatement(stmt) && stmt.declarationList.declarations.length === 1) {
      const decl = stmt.declarationList.declarations[0];

      // If this is the ɵNonEmptyModule export, then save it for later.
      if (ts.isIdentifier(decl.name)) {
        if (decl.name.text === 'ɵNonEmptyModule') {
          nonEmptyExport = stmt;
          continue;
        }

        // Otherwise, check if this export is a factory for a known NgModule, and retain it if so.
        const match = STRIP_NG_FACTORY.exec(decl.name.text);
        if (match !== null && moduleSymbolNames.has(match[1])) {
          transformedStatements.push(stmt);
        }
      } else {
        // Leave the statement alone, as it can't be understood.
        transformedStatements.push(stmt);
      }
    } else {
      // Include non-variable statements (imports, etc).
      transformedStatements.push(stmt);
    }
  }

  // Check whether the empty module export is still needed.
  if (!transformedStatements.some(ts.isVariableStatement) && nonEmptyExport !== null) {
    // If the resulting file has no factories, include an empty export to
    // satisfy closure compiler.
    transformedStatements.push(nonEmptyExport);
  }
  clone.statements = ts.createNodeArray(transformedStatements);
  return clone;
}
