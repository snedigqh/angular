/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AotCompiler, AotCompilerHost, AotCompilerOptions, EmitterVisitorContext, GeneratedFile, MessageBundle, NgAnalyzedFile, NgAnalyzedModules, ParseSourceSpan, Serializer, TypeScriptEmitter, Xliff, Xliff2, Xmb, core, createAotCompiler, getParseErrors, isSyntaxError} from '@angular/compiler';
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

import {TypeCheckHost, translateDiagnostics} from '../diagnostics/translate_diagnostics';
import {ModuleMetadata, createBundleIndexHost} from '../metadata/index';

import {CompilerHost, CompilerOptions, CustomTransformers, DEFAULT_ERROR_CODE, Diagnostic, EmitFlags, Program, SOURCE, TsEmitArguments, TsEmitCallback} from './api';
import {TsCompilerAotCompilerTypeCheckHostAdapter, getOriginalReferences} from './compiler_host';
import {LowerMetadataCache, getExpressionLoweringTransformFactory} from './lower_expressions';
import {getAngularEmitterTransformFactory} from './node_emitter_transform';
import {GENERATED_FILES, StructureIsReused, tsStructureIsReused} from './util';

const emptyModules: NgAnalyzedModules = {
  ngModules: [],
  ngModuleByPipeOrDirective: new Map(),
  files: []
};

const defaultEmitCallback: TsEmitCallback =
    ({program, targetSourceFile, writeFile, cancellationToken, emitOnlyDtsFiles,
      customTransformers}) =>
        program.emit(
            targetSourceFile, writeFile, cancellationToken, emitOnlyDtsFiles, customTransformers);


class AngularCompilerProgram implements Program {
  private metadataCache: LowerMetadataCache;
  private summariesFromPreviousCompilations = new Map<string, string>();
  // Note: This will be cleared out as soon as we create the _tsProgram
  private oldTsProgram: ts.Program|undefined;
  private _emittedGenFiles: GeneratedFile[]|undefined;

  // Lazily initialized fields
  private _typeCheckHost: TypeCheckHost;
  private _compiler: AotCompiler;
  private _tsProgram: ts.Program;
  private _analyzedModules: NgAnalyzedModules|undefined;
  private _structuralDiagnostics: Diagnostic[]|undefined;
  private _programWithStubs: ts.Program|undefined;
  private _semanticDiagnostics: {ts: ts.Diagnostic[], ng: Diagnostic[]}|undefined;
  private _optionsDiagnostics: Diagnostic[] = [];

  constructor(
      private rootNames: string[], private options: CompilerOptions, private host: CompilerHost,
      private oldProgram?: Program) {
    const [major, minor] = ts.version.split('.');
    if (Number(major) < 2 || (Number(major) === 2 && Number(minor) < 4)) {
      throw new Error('The Angular Compiler requires TypeScript >= 2.4.');
    }
    this.oldTsProgram = oldProgram ? oldProgram.getTsProgram() : undefined;
    if (oldProgram) {
      oldProgram.getLibrarySummaries().forEach(
          ({content, fileName}) => this.summariesFromPreviousCompilations.set(fileName, content));
    }

    if (options.flatModuleOutFile) {
      const {host: bundleHost, indexName, errors} = createBundleIndexHost(options, rootNames, host);
      if (errors) {
        // TODO(tbosch): once we move MetadataBundler from tsc_wrapped into compiler_cli,
        // directly create ng.Diagnostic instead of using ts.Diagnostic here.
        this._optionsDiagnostics.push(...errors.map(e => ({
                                                      category: e.category,
                                                      messageText: e.messageText as string,
                                                      source: SOURCE,
                                                      code: DEFAULT_ERROR_CODE
                                                    })));
      } else {
        rootNames.push(indexName !);
        this.host = bundleHost;
      }
    }
    this.metadataCache = new LowerMetadataCache({quotedNames: true}, !!options.strictMetadataEmit);
  }

  getLibrarySummaries(): {fileName: string, content: string}[] {
    const emittedLibSummaries: {fileName: string, content: string}[] = [];
    this.summariesFromPreviousCompilations.forEach(
        (content, fileName) => emittedLibSummaries.push({fileName, content}));
    if (this._emittedGenFiles) {
      this._emittedGenFiles.forEach(genFile => {
        if (genFile.srcFileUrl.endsWith('.d.ts') &&
            genFile.genFileUrl.endsWith('.ngsummary.json')) {
          // Note: ! is ok here as ngsummary.json files are always plain text, so genFile.source
          // is filled.
          emittedLibSummaries.push({fileName: genFile.genFileUrl, content: genFile.source !});
        }
      });
    }
    return emittedLibSummaries;
  }

  getTsProgram(): ts.Program { return this.tsProgram; }

  getTsOptionDiagnostics(cancellationToken?: ts.CancellationToken) {
    return this.tsProgram.getOptionsDiagnostics(cancellationToken);
  }

  getNgOptionDiagnostics(cancellationToken?: ts.CancellationToken): Diagnostic[] {
    return [...this._optionsDiagnostics, ...getNgOptionDiagnostics(this.options)];
  }

  getTsSyntacticDiagnostics(sourceFile?: ts.SourceFile, cancellationToken?: ts.CancellationToken):
      ts.Diagnostic[] {
    return this.tsProgram.getSyntacticDiagnostics(sourceFile, cancellationToken);
  }

  getNgStructuralDiagnostics(cancellationToken?: ts.CancellationToken): Diagnostic[] {
    return this.structuralDiagnostics;
  }

  getTsSemanticDiagnostics(sourceFile?: ts.SourceFile, cancellationToken?: ts.CancellationToken):
      ts.Diagnostic[] {
    return this.semanticDiagnostics.ts;
  }

  getNgSemanticDiagnostics(fileName?: string, cancellationToken?: ts.CancellationToken):
      Diagnostic[] {
    return this.semanticDiagnostics.ng;
  }

  loadNgStructureAsync(): Promise<void> {
    if (this._analyzedModules) {
      throw new Error('Angular structure already loaded');
    }
    const {tmpProgram, analyzedFiles, hostAdapter, rootNames} = this._createProgramWithBasicStubs();
    return this._compiler.loadFilesAsync(analyzedFiles)
        .catch(this.catchAnalysisError.bind(this))
        .then(analyzedModules => {
          if (this._analyzedModules) {
            throw new Error('Angular structure loaded both synchronously and asynchronsly');
          }
          this._updateProgramWithTypeCheckStubs(
              tmpProgram, analyzedModules, hostAdapter, rootNames);
        });
  }

  emit(
      {emitFlags = EmitFlags.Default, cancellationToken, customTransformers,
       emitCallback = defaultEmitCallback}: {
        emitFlags?: EmitFlags,
        cancellationToken?: ts.CancellationToken,
        customTransformers?: CustomTransformers,
        emitCallback?: TsEmitCallback
      } = {}): ts.EmitResult {
    if (emitFlags & EmitFlags.I18nBundle) {
      const locale = this.options.i18nOutLocale || null;
      const file = this.options.i18nOutFile || null;
      const format = this.options.i18nOutFormat || null;
      const bundle = this.compiler.emitMessageBundle(this.analyzedModules, locale);
      i18nExtract(format, file, this.host, this.options, bundle);
    }
    const outSrcMapping: Array<{sourceFile: ts.SourceFile, outFileName: string}> = [];
    if ((emitFlags & (EmitFlags.JS | EmitFlags.DTS | EmitFlags.Metadata | EmitFlags.Codegen)) ===
        0) {
      return {emitSkipped: true, diagnostics: [], emittedFiles: []};
    }
    const {genFiles, genDiags} = this.generateFilesForEmit(emitFlags);
    if (genDiags.length) {
      return {
        diagnostics: genDiags,
        emitSkipped: true,
        emittedFiles: [],
      };
    }

    // Restore the original references before we emit so TypeScript doesn't emit
    // a reference to the .d.ts file.
    const augmentedReferences = new Map<ts.SourceFile, ts.FileReference[]>();
    for (const sourceFile of this.tsProgram.getSourceFiles()) {
      const originalReferences = getOriginalReferences(sourceFile);
      if (originalReferences) {
        augmentedReferences.set(sourceFile, sourceFile.referencedFiles);
        sourceFile.referencedFiles = originalReferences;
      }
    }

    let emitResult: ts.EmitResult;
    try {
      emitResult = emitCallback({
        program: this.tsProgram,
        host: this.host,
        options: this.options,
        writeFile: createWriteFileCallback(genFiles, this.host, outSrcMapping),
        emitOnlyDtsFiles: (emitFlags & (EmitFlags.DTS | EmitFlags.JS)) == EmitFlags.DTS,
        customTransformers: this.calculateTransforms(genFiles, customTransformers)
      });
    } finally {
      // Restore the references back to the augmented value to ensure that the
      // checks that TypeScript makes for project structure reuse will succeed.
      for (const [sourceFile, references] of Array.from(augmentedReferences)) {
        sourceFile.referencedFiles = references;
      }
    }

    if (!outSrcMapping.length) {
      // if no files were emitted by TypeScript, also don't emit .json files
      return emitResult;
    }

    const srcToOutPath = this.createSrcToOutPathMapper(outSrcMapping);
    if (emitFlags & EmitFlags.Codegen) {
      genFiles.forEach(gf => {
        if (gf.source) {
          this.host.writeFile(srcToOutPath(gf.genFileUrl), gf.source, false);
        }
      });
    }
    if (emitFlags & EmitFlags.Metadata) {
      this.tsProgram.getSourceFiles().forEach(sf => {
        if (!sf.isDeclarationFile && !GENERATED_FILES.test(sf.fileName)) {
          const metadata = this.metadataCache.getMetadata(sf);
          const metadataText = JSON.stringify([metadata]);
          this.host.writeFile(
              srcToOutPath(sf.fileName.replace(/\.ts$/, '.metadata.json')), metadataText, false);
        }
      });
    }
    return emitResult;
  }

  // Private members
  private get compiler(): AotCompiler {
    if (!this._compiler) {
      this.initSync();
    }
    return this._compiler !;
  }

  private get analyzedModules(): NgAnalyzedModules {
    if (!this._analyzedModules) {
      this.initSync();
    }
    return this._analyzedModules !;
  }

  private get structuralDiagnostics(): Diagnostic[] {
    if (!this._structuralDiagnostics) {
      this.initSync();
    }
    return this._structuralDiagnostics !;
  }

  private get tsProgram(): ts.Program {
    if (!this._tsProgram) {
      this.initSync();
    }
    return this._tsProgram !;
  }

  private get typeCheckHost(): TypeCheckHost {
    if (!this._typeCheckHost) {
      this.initSync();
    }
    return this._typeCheckHost !;
  }

  private get semanticDiagnostics(): {ts: ts.Diagnostic[], ng: Diagnostic[]} {
    return this._semanticDiagnostics ||
        (this._semanticDiagnostics = this.generateSemanticDiagnostics());
  }

  private calculateTransforms(genFiles: GeneratedFile[], customTransformers?: CustomTransformers):
      ts.CustomTransformers {
    const beforeTs: ts.TransformerFactory<ts.SourceFile>[] = [];
    if (!this.options.disableExpressionLowering) {
      beforeTs.push(getExpressionLoweringTransformFactory(this.metadataCache));
    }
    beforeTs.push(getAngularEmitterTransformFactory(genFiles));
    if (customTransformers && customTransformers.beforeTs) {
      beforeTs.push(...customTransformers.beforeTs);
    }
    const afterTs = customTransformers ? customTransformers.afterTs : undefined;
    return {before: beforeTs, after: afterTs};
  }

  private createSrcToOutPathMapper(outSrcMappings:
                                       Array<{sourceFile: ts.SourceFile, outFileName: string}>):
      (srcFileName: string) => string {
    let srcToOutPath: (srcFileName: string) => string;
    if (this.options.outDir) {
      // TODO(tbosch): talk to TypeScript team to expose their logic for calculating the `rootDir`
      // if none was specified.
      if (outSrcMappings.length === 0) {
        throw new Error(`Can't calculate the rootDir without at least one outSrcMapping. `);
      }
      const firstEntry = outSrcMappings[0];
      const entrySrcDir = path.dirname(firstEntry.sourceFile.fileName);
      const entryOutDir = path.dirname(firstEntry.outFileName);
      const commonSuffix = longestCommonSuffix(entrySrcDir, entryOutDir);
      const rootDir = entrySrcDir.substring(0, entrySrcDir.length - commonSuffix.length);
      srcToOutPath = (srcFileName) =>
          path.resolve(this.options.outDir, path.relative(rootDir, srcFileName));
    } else {
      srcToOutPath = (srcFileName) => srcFileName;
    }
    return srcToOutPath;
  }

  private initSync() {
    if (this._analyzedModules) {
      return;
    }
    const {tmpProgram, analyzedFiles, hostAdapter, rootNames} = this._createProgramWithBasicStubs();
    let analyzedModules: NgAnalyzedModules;
    try {
      analyzedModules = this._compiler.loadFilesSync(analyzedFiles);
    } catch (e) {
      analyzedModules = this.catchAnalysisError(e);
    }
    this._updateProgramWithTypeCheckStubs(tmpProgram, analyzedModules, hostAdapter, rootNames);
  }

  private _createProgramWithBasicStubs(): {
    tmpProgram: ts.Program,
    analyzedFiles: NgAnalyzedFile[],
    hostAdapter: TsCompilerAotCompilerTypeCheckHostAdapter,
    rootNames: string[],
  } {
    if (this._analyzedModules) {
      throw new Error(`Internal Error: already initalized!`);
    }
    // Note: This is important to not produce a memory leak!
    const oldTsProgram = this.oldTsProgram;
    this.oldTsProgram = undefined;
    const analyzedFiles: NgAnalyzedFile[] = [];
    const codegen = (fileName: string) => {
      if (this._analyzedModules) {
        throw new Error(`Internal Error: already initalized!`);
      }
      const analyzedFile = this._compiler.analyzeFile(fileName);
      analyzedFiles.push(analyzedFile);
      const debug = fileName.endsWith('application_ref.ts');
      return this._compiler.emitBasicStubs(analyzedFile);
    };
    const hostAdapter = new TsCompilerAotCompilerTypeCheckHostAdapter(
        this.rootNames, this.options, this.host, this.metadataCache, codegen,
        this.summariesFromPreviousCompilations);
    const aotOptions = getAotCompilerOptions(this.options);
    this._compiler = createAotCompiler(hostAdapter, aotOptions).compiler;
    this._typeCheckHost = hostAdapter;
    this._structuralDiagnostics = [];

    let rootNames =
        this.rootNames.filter(fn => !GENERATED_FILES.test(fn) || !hostAdapter.isSourceFile(fn));
    if (this.options.noResolve) {
      this.rootNames.forEach(rootName => {
        const sf =
            hostAdapter.getSourceFile(rootName, this.options.target || ts.ScriptTarget.Latest);
        sf.referencedFiles.forEach((fileRef) => {
          if (GENERATED_FILES.test(fileRef.fileName)) {
            rootNames.push(fileRef.fileName);
          }
        });
      });
    }

    const tmpProgram = ts.createProgram(rootNames, this.options, hostAdapter, oldTsProgram);
    return {tmpProgram, analyzedFiles, hostAdapter, rootNames};
  }

  private _updateProgramWithTypeCheckStubs(
      tmpProgram: ts.Program, analyzedModules: NgAnalyzedModules,
      hostAdapter: TsCompilerAotCompilerTypeCheckHostAdapter, rootNames: string[]) {
    this._analyzedModules = analyzedModules;
    const genFiles = this._compiler.emitTypeCheckStubs(analyzedModules);
    genFiles.forEach(gf => hostAdapter.updateGeneratedFile(gf));
    this._tsProgram = ts.createProgram(rootNames, this.options, hostAdapter, tmpProgram);
    // Note: the new ts program should be completely reusable by TypeScript as:
    // - we cache all the files in the hostAdapter
    // - new new stubs use the exactly same imports/exports as the old once (we assert that in
    // hostAdapter.updateGeneratedFile).
    if (tsStructureIsReused(tmpProgram) !== StructureIsReused.Completely) {
      throw new Error(`Internal Error: The structure of the program changed during codegen.`);
    }
  }

  private catchAnalysisError(e: any): NgAnalyzedModules {
    if (isSyntaxError(e)) {
      const parserErrors = getParseErrors(e);
      if (parserErrors && parserErrors.length) {
        this._structuralDiagnostics =
            parserErrors.map<Diagnostic>(e => ({
                                           messageText: e.contextualMessage(),
                                           category: ts.DiagnosticCategory.Error,
                                           span: e.span,
                                           source: SOURCE,
                                           code: DEFAULT_ERROR_CODE
                                         }));
      } else {
        this._structuralDiagnostics = [{
          messageText: e.message,
          category: ts.DiagnosticCategory.Error,
          source: SOURCE,
          code: DEFAULT_ERROR_CODE
        }];
      }
      return emptyModules;
    }
    throw e;
  }

  // Note: this returns a ts.Diagnostic so that we
  // can return errors in a ts.EmitResult
  private generateFilesForEmit(emitFlags: EmitFlags):
      {genFiles: GeneratedFile[], genDiags: ts.Diagnostic[]} {
    try {
      if (!(emitFlags & EmitFlags.Codegen)) {
        return {genFiles: [], genDiags: []};
      }
      const genFiles = this._emittedGenFiles = this.compiler.emitAllImpls(this.analyzedModules);
      return {genFiles, genDiags: []};
    } catch (e) {
      // TODO(tbosch): check whether we can actually have syntax errors here,
      // as we already parsed the metadata and templates before to create the type check block.
      if (isSyntaxError(e)) {
        const genDiags: ts.Diagnostic[] = [{
          file: undefined,
          start: undefined,
          length: undefined,
          messageText: e.message,
          category: ts.DiagnosticCategory.Error,
          source: SOURCE,
          code: DEFAULT_ERROR_CODE
        }];
        return {genFiles: [], genDiags};
      }
      throw e;
    }
  }

  private generateSemanticDiagnostics(): {ts: ts.Diagnostic[], ng: Diagnostic[]} {
    return translateDiagnostics(this.typeCheckHost, this.tsProgram.getSemanticDiagnostics());
  }
}

export function createProgram(
    {rootNames, options, host, oldProgram}:
        {rootNames: string[], options: CompilerOptions, host: CompilerHost, oldProgram?: Program}):
    Program {
  return new AngularCompilerProgram(rootNames, options, host, oldProgram);
}

// Compute the AotCompiler options
function getAotCompilerOptions(options: CompilerOptions): AotCompilerOptions {
  let missingTranslation = core.MissingTranslationStrategy.Warning;

  switch (options.i18nInMissingTranslations) {
    case 'ignore':
      missingTranslation = core.MissingTranslationStrategy.Ignore;
      break;
    case 'error':
      missingTranslation = core.MissingTranslationStrategy.Error;
      break;
  }

  let translations: string = '';

  if (options.i18nInFile) {
    if (!options.i18nInLocale) {
      throw new Error(`The translation file (${options.i18nInFile}) locale must be provided.`);
    }
    translations = fs.readFileSync(options.i18nInFile, 'utf8');
  } else {
    // No translations are provided, ignore any errors
    // We still go through i18n to remove i18n attributes
    missingTranslation = core.MissingTranslationStrategy.Ignore;
  }

  return {
    locale: options.i18nInLocale,
    i18nFormat: options.i18nInFormat || options.i18nOutFormat, translations, missingTranslation,
    enableLegacyTemplate: options.enableLegacyTemplate,
    enableSummariesForJit: true,
    preserveWhitespaces: options.preserveWhitespaces,
    fullTemplateTypeCheck: options.fullTemplateTypeCheck,
    rootDir: options.rootDir,
  };
}

function createWriteFileCallback(
    generatedFiles: GeneratedFile[], host: ts.CompilerHost,
    outSrcMapping: Array<{sourceFile: ts.SourceFile, outFileName: string}>) {
  const genFileByFileName = new Map<string, GeneratedFile>();
  generatedFiles.forEach(genFile => genFileByFileName.set(genFile.genFileUrl, genFile));
  return (fileName: string, data: string, writeByteOrderMark: boolean,
          onError?: (message: string) => void, sourceFiles?: ts.SourceFile[]) => {
    const sourceFile = sourceFiles && sourceFiles.length == 1 ? sourceFiles[0] : null;
    if (sourceFile) {
      outSrcMapping.push({outFileName: fileName, sourceFile});
    }
    const isGenerated = GENERATED_FILES.test(fileName);
    if (isGenerated && sourceFile) {
      // Filter out generated files for which we didn't generate code.
      // This can happen as the stub caclulation is not completely exact.
      const genFile = genFileByFileName.get(sourceFile.fileName);
      if (!genFile || !genFile.stmts || genFile.stmts.length === 0) {
        return;
      }
    }
    host.writeFile(fileName, data, writeByteOrderMark, onError, sourceFiles);
  };
}

function getNgOptionDiagnostics(options: CompilerOptions): Diagnostic[] {
  if (options.annotationsAs) {
    switch (options.annotationsAs) {
      case 'decorators':
      case 'static fields':
        break;
      default:
        return [{
          messageText:
              'Angular compiler options "annotationsAs" only supports "static fields" and "decorators"',
          category: ts.DiagnosticCategory.Error,
          source: SOURCE,
          code: DEFAULT_ERROR_CODE
        }];
    }
  }
  return [];
}

function longestCommonSuffix(a: string, b: string): string {
  let len = 0;
  while (a.charCodeAt(a.length - 1 - len) === b.charCodeAt(b.length - 1 - len)) {
    len++;
  }
  return a.substring(a.length - len);
}

export function i18nExtract(
    formatName: string | null, outFile: string | null, host: ts.CompilerHost,
    options: CompilerOptions, bundle: MessageBundle): string[] {
  formatName = formatName || 'null';
  // Checks the format and returns the extension
  const ext = i18nGetExtension(formatName);
  const content = i18nSerialize(bundle, formatName, options);
  const dstFile = outFile || `messages.${ext}`;
  const dstPath = path.resolve(options.outDir || options.basePath, dstFile);
  host.writeFile(dstPath, content, false);
  return [dstPath];
}

export function i18nSerialize(
    bundle: MessageBundle, formatName: string, options: CompilerOptions): string {
  const format = formatName.toLowerCase();
  let serializer: Serializer;

  switch (format) {
    case 'xmb':
      serializer = new Xmb();
      break;
    case 'xliff2':
    case 'xlf2':
      serializer = new Xliff2();
      break;
    case 'xlf':
    case 'xliff':
    default:
      serializer = new Xliff();
  }
  return bundle.write(
      serializer, (sourcePath: string) =>
                      options.basePath ? path.relative(options.basePath, sourcePath) : sourcePath);
}

export function i18nGetExtension(formatName: string): string {
  const format = (formatName || 'xlf').toLowerCase();

  switch (format) {
    case 'xmb':
      return 'xmb';
    case 'xlf':
    case 'xlif':
    case 'xliff':
    case 'xlf2':
    case 'xliff2':
      return 'xlf';
  }

  throw new Error(`Unsupported format "${formatName}"`);
}
