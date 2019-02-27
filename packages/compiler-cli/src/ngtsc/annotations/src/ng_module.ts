/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Expression, ExternalExpr, InvokeFunctionExpr, LiteralArrayExpr, R3Identifiers, R3InjectorMetadata, R3NgModuleMetadata, R3Reference, Statement, WrappedNodeExpr, compileInjector, compileNgModule} from '@angular/compiler';
import * as ts from 'typescript';

import {ErrorCode, FatalDiagnosticError} from '../../diagnostics';
import {Reference, ReferenceEmitter} from '../../imports';
import {PartialEvaluator, ResolvedValue} from '../../partial_evaluator';
import {Decorator, ReflectionHost, reflectObjectLiteral, typeNodeToValueExpr} from '../../reflection';
import {NgModuleRouteAnalyzer} from '../../routing';
import {LocalModuleScopeRegistry} from '../../scope';
import {AnalysisOutput, CompileResult, DecoratorHandler, DetectResult, HandlerPrecedence, ResolveResult} from '../../transform';
import {getSourceFile} from '../../util/src/typescript';

import {generateSetClassMetadataCall} from './metadata';
import {ReferencesRegistry} from './references_registry';
import {combineResolvers, forwardRefResolver, getValidConstructorDependencies, isAngularCore, toR3Reference, unwrapExpression} from './util';

export interface NgModuleAnalysis {
  ngModuleDef: R3NgModuleMetadata;
  ngInjectorDef: R3InjectorMetadata;
  metadataStmt: Statement|null;
  declarations: Reference<ts.Declaration>[];
}

/**
 * Compiles @NgModule annotations to ngModuleDef fields.
 *
 * TODO(alxhub): handle injector side of things as well.
 */
export class NgModuleDecoratorHandler implements DecoratorHandler<NgModuleAnalysis, Decorator> {
  constructor(
      private reflector: ReflectionHost, private evaluator: PartialEvaluator,
      private scopeRegistry: LocalModuleScopeRegistry,
      private referencesRegistry: ReferencesRegistry, private isCore: boolean,
      private routeAnalyzer: NgModuleRouteAnalyzer|null, private refEmitter: ReferenceEmitter) {}

  readonly precedence = HandlerPrecedence.PRIMARY;

  detect(node: ts.Declaration, decorators: Decorator[]|null): DetectResult<Decorator>|undefined {
    if (!decorators) {
      return undefined;
    }
    const decorator = decorators.find(
        decorator => decorator.name === 'NgModule' && (this.isCore || isAngularCore(decorator)));
    if (decorator !== undefined) {
      return {
        trigger: decorator.node,
        metadata: decorator,
      };
    } else {
      return undefined;
    }
  }

  analyze(node: ts.ClassDeclaration, decorator: Decorator): AnalysisOutput<NgModuleAnalysis> {
    if (decorator.args === null || decorator.args.length > 1) {
      throw new FatalDiagnosticError(
          ErrorCode.DECORATOR_ARITY_WRONG, decorator.node,
          `Incorrect number of arguments to @NgModule decorator`);
    }

    // @NgModule can be invoked without arguments. In case it is, pretend as if a blank object
    // literal was specified. This simplifies the code below.
    const meta = decorator.args.length === 1 ? unwrapExpression(decorator.args[0]) :
                                               ts.createObjectLiteral([]);

    if (!ts.isObjectLiteralExpression(meta)) {
      throw new FatalDiagnosticError(
          ErrorCode.DECORATOR_ARG_NOT_LITERAL, meta,
          '@NgModule argument must be an object literal');
    }
    const ngModule = reflectObjectLiteral(meta);

    if (ngModule.has('jit')) {
      // The only allowed value is true, so there's no need to expand further.
      return {};
    }

    const moduleResolvers = combineResolvers([
      ref => this._extractModuleFromModuleWithProvidersFn(ref.node),
      forwardRefResolver,
    ]);

    // Extract the module declarations, imports, and exports.
    let declarations: Reference<ts.Declaration>[] = [];
    if (ngModule.has('declarations')) {
      const expr = ngModule.get('declarations') !;
      const declarationMeta = this.evaluator.evaluate(expr, forwardRefResolver);
      declarations = this.resolveTypeList(expr, declarationMeta, 'declarations');
    }
    let imports: Reference<ts.Declaration>[] = [];
    let rawImports: ts.Expression|null = null;
    if (ngModule.has('imports')) {
      rawImports = ngModule.get('imports') !;
      const importsMeta = this.evaluator.evaluate(rawImports, moduleResolvers);
      imports = this.resolveTypeList(rawImports, importsMeta, 'imports');
    }
    let exports: Reference<ts.Declaration>[] = [];
    let rawExports: ts.Expression|null = null;
    if (ngModule.has('exports')) {
      rawExports = ngModule.get('exports') !;
      const exportsMeta = this.evaluator.evaluate(rawExports, moduleResolvers);
      exports = this.resolveTypeList(rawExports, exportsMeta, 'exports');
      this.referencesRegistry.add(node, ...exports);
    }
    let bootstrap: Reference<ts.Declaration>[] = [];
    if (ngModule.has('bootstrap')) {
      const expr = ngModule.get('bootstrap') !;
      const bootstrapMeta = this.evaluator.evaluate(expr, forwardRefResolver);
      bootstrap = this.resolveTypeList(expr, bootstrapMeta, 'bootstrap');
    }

    // Register this module's information with the LocalModuleScopeRegistry. This ensures that
    // during the compile() phase, the module's metadata is available for selector scope
    // computation.
    this.scopeRegistry.registerNgModule(node, {declarations, imports, exports});

    const valueContext = node.getSourceFile();

    let typeContext = valueContext;
    const typeNode = this.reflector.getDtsDeclaration(node);
    if (typeNode !== null) {
      typeContext = typeNode.getSourceFile();
    }

    const ngModuleDef: R3NgModuleMetadata = {
      type: new WrappedNodeExpr(node.name !),
      bootstrap:
          bootstrap.map(bootstrap => this._toR3Reference(bootstrap, valueContext, typeContext)),
      declarations: declarations.map(decl => this._toR3Reference(decl, valueContext, typeContext)),
      exports: exports.map(exp => this._toR3Reference(exp, valueContext, typeContext)),
      imports: imports.map(imp => this._toR3Reference(imp, valueContext, typeContext)),
      emitInline: false,
      // TODO: to be implemented as a part of FW-1004.
      schemas: [],
    };

    const providers: Expression = ngModule.has('providers') ?
        new WrappedNodeExpr(ngModule.get('providers') !) :
        new LiteralArrayExpr([]);
    const rawProviders = ngModule.has('providers') ? ngModule.get('providers') ! : null;

    const injectorImports: WrappedNodeExpr<ts.Expression>[] = [];
    if (ngModule.has('imports')) {
      injectorImports.push(new WrappedNodeExpr(ngModule.get('imports') !));
    }
    if (ngModule.has('exports')) {
      injectorImports.push(new WrappedNodeExpr(ngModule.get('exports') !));
    }

    if (this.routeAnalyzer !== null) {
      this.routeAnalyzer.add(
          node.getSourceFile(), node.name !.text, rawImports, rawExports, rawProviders);
    }

    const ngInjectorDef: R3InjectorMetadata = {
      name: node.name !.text,
      type: new WrappedNodeExpr(node.name !),
      deps: getValidConstructorDependencies(node, this.reflector, this.isCore), providers,
      imports: new LiteralArrayExpr(injectorImports),
    };

    return {
      analysis: {
        ngModuleDef,
        ngInjectorDef,
        declarations,
        metadataStmt: generateSetClassMetadataCall(node, this.reflector, this.isCore),
      },
      factorySymbolName: node.name !== undefined ? node.name.text : undefined,
    };
  }

  resolve(node: ts.Declaration, analysis: NgModuleAnalysis): ResolveResult {
    const scope = this.scopeRegistry.getScopeOfModule(node);
    if (scope === null || scope.reexports === null) {
      return {};
    } else {
      return {
        reexports: scope.reexports,
      };
    }
  }

  compile(node: ts.ClassDeclaration, analysis: NgModuleAnalysis): CompileResult[] {
    const ngInjectorDef = compileInjector(analysis.ngInjectorDef);
    const ngModuleDef = compileNgModule(analysis.ngModuleDef);
    const ngModuleStatements = ngModuleDef.additionalStatements;
    if (analysis.metadataStmt !== null) {
      ngModuleStatements.push(analysis.metadataStmt);
    }
    const context = getSourceFile(node);
    for (const decl of analysis.declarations) {
      if (this.scopeRegistry.getRequiresRemoteScope(decl.node)) {
        const scope =
            this.scopeRegistry.getScopeOfModule(ts.getOriginalNode(node) as ts.Declaration);
        if (scope === null) {
          continue;
        }
        const directives = scope.compilation.directives.map(
            directive => this.refEmitter.emit(directive.ref, context));
        const pipes = scope.compilation.pipes.map(pipe => this.refEmitter.emit(pipe.ref, context));
        const directiveArray = new LiteralArrayExpr(directives);
        const pipesArray = new LiteralArrayExpr(pipes);
        const declExpr = this.refEmitter.emit(decl, context) !;
        const setComponentScope = new ExternalExpr(R3Identifiers.setComponentScope);
        const callExpr =
            new InvokeFunctionExpr(setComponentScope, [declExpr, directiveArray, pipesArray]);

        ngModuleStatements.push(callExpr.toStmt());
      }
    }
    return [
      {
        name: 'ngModuleDef',
        initializer: ngModuleDef.expression,
        statements: ngModuleStatements,
        type: ngModuleDef.type,
      },
      {
        name: 'ngInjectorDef',
        initializer: ngInjectorDef.expression,
        statements: ngInjectorDef.statements,
        type: ngInjectorDef.type,
      },
    ];
  }

  private _toR3Reference(
      valueRef: Reference<ts.Declaration>, valueContext: ts.SourceFile,
      typeContext: ts.SourceFile): R3Reference {
    if (valueRef.hasOwningModuleGuess) {
      return toR3Reference(valueRef, valueRef, valueContext, valueContext, this.refEmitter);
    } else {
      let typeRef = valueRef;
      let typeNode = this.reflector.getDtsDeclaration(typeRef.node);
      if (typeNode !== null && ts.isClassDeclaration(typeNode)) {
        typeRef = new Reference(typeNode);
      }
      return toR3Reference(valueRef, typeRef, valueContext, typeContext, this.refEmitter);
    }
  }

  /**
   * Given a `FunctionDeclaration`, `MethodDeclaration` or `FunctionExpression`, check if it is
   * typed as a `ModuleWithProviders` and return an expression referencing the module if available.
   */
  private _extractModuleFromModuleWithProvidersFn(node: ts.FunctionDeclaration|
                                                  ts.MethodDeclaration|
                                                  ts.FunctionExpression): ts.Expression|null {
    const type = node.type || null;
    return type &&
        (this._reflectModuleFromTypeParam(type) || this._reflectModuleFromLiteralType(type));
  }

  /**
   * Retrieve an `NgModule` identifier (T) from the specified `type`, if it is of the form:
   * `ModuleWithProviders<T>`
   * @param type The type to reflect on.
   * @returns the identifier of the NgModule type if found, or null otherwise.
   */
  private _reflectModuleFromTypeParam(type: ts.TypeNode): ts.Expression|null {
    // Examine the type of the function to see if it's a ModuleWithProviders reference.
    if (!ts.isTypeReferenceNode(type) || !ts.isIdentifier(type.typeName)) {
      return null;
    }

    // Look at the type itself to see where it comes from.
    const id = this.reflector.getImportOfIdentifier(type.typeName);

    // If it's not named ModuleWithProviders, bail.
    if (id === null || id.name !== 'ModuleWithProviders') {
      return null;
    }

    // If it's not from @angular/core, bail.
    if (!this.isCore && id.from !== '@angular/core') {
      return null;
    }

    // If there's no type parameter specified, bail.
    if (type.typeArguments === undefined || type.typeArguments.length !== 1) {
      return null;
    }

    const arg = type.typeArguments[0];

    return typeNodeToValueExpr(arg);
  }

  /**
   * Retrieve an `NgModule` identifier (T) from the specified `type`, if it is of the form:
   * `A|B|{ngModule: T}|C`.
   * @param type The type to reflect on.
   * @returns the identifier of the NgModule type if found, or null otherwise.
   */
  private _reflectModuleFromLiteralType(type: ts.TypeNode): ts.Expression|null {
    if (!ts.isIntersectionTypeNode(type)) {
      return null;
    }
    for (const t of type.types) {
      if (ts.isTypeLiteralNode(t)) {
        for (const m of t.members) {
          const ngModuleType = ts.isPropertySignature(m) && ts.isIdentifier(m.name) &&
                  m.name.text === 'ngModule' && m.type ||
              null;
          const ngModuleExpression = ngModuleType && typeNodeToValueExpr(ngModuleType);
          if (ngModuleExpression) {
            return ngModuleExpression;
          }
        }
      }
    }
    return null;
  }

  /**
   * Compute a list of `Reference`s from a resolved metadata value.
   */
  private resolveTypeList(expr: ts.Node, resolvedList: ResolvedValue, name: string):
      Reference<ts.Declaration>[] {
    const refList: Reference<ts.Declaration>[] = [];
    if (!Array.isArray(resolvedList)) {
      throw new FatalDiagnosticError(
          ErrorCode.VALUE_HAS_WRONG_TYPE, expr, `Expected array when reading property ${name}`);
    }

    resolvedList.forEach((entry, idx) => {
      // Unwrap ModuleWithProviders for modules that are locally declared (and thus static
      // resolution was able to descend into the function and return an object literal, a Map).
      if (entry instanceof Map && entry.has('ngModule')) {
        entry = entry.get('ngModule') !;
      }

      if (Array.isArray(entry)) {
        // Recurse into nested arrays.
        refList.push(...this.resolveTypeList(expr, entry, name));
      } else if (isDeclarationReference(entry)) {
        if (!this.reflector.isClass(entry.node)) {
          throw new FatalDiagnosticError(
              ErrorCode.VALUE_HAS_WRONG_TYPE, entry.node,
              `Entry is not a type, but is used as such in ${name} array`);
        }
        refList.push(entry);
      } else {
        // TODO(alxhub): expand ModuleWithProviders.
        throw new Error(`Value at position ${idx} in ${name} array is not a reference: ${entry}`);
      }
    });

    return refList;
  }
}

function isDeclarationReference(ref: any): ref is Reference<ts.Declaration> {
  return ref instanceof Reference &&
      (ts.isClassDeclaration(ref.node) || ts.isFunctionDeclaration(ref.node) ||
       ts.isVariableDeclaration(ref.node));
}
