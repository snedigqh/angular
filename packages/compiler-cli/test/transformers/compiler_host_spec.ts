/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as compiler from '@angular/compiler';
import * as ts from 'typescript';

import {MetadataCollector} from '../../src/metadata/collector';
import {CompilerHost, CompilerOptions} from '../../src/transformers/api';
import {TsCompilerAotCompilerTypeCheckHostAdapter, createCompilerHost} from '../../src/transformers/compiler_host';
import {Directory, Entry, MockAotContext, MockCompilerHost} from '../mocks';

const dummyModule = 'export let foo: any[];';
const aGeneratedFile = new compiler.GeneratedFile(
    '/tmp/src/index.ts', '/tmp/src/index.ngfactory.ts',
    [new compiler.DeclareVarStmt('x', new compiler.LiteralExpr(1))]);
const aGeneratedFileText = `var x:any = 1;\n`;

describe('NgCompilerHost', () => {
  let codeGenerator: jasmine.Spy;

  beforeEach(() => { codeGenerator = jasmine.createSpy('codeGenerator').and.returnValue([]); });

  function createNgHost({files = {}}: {files?: Directory} = {}): CompilerHost {
    const context = new MockAotContext('/tmp/', files);
    return new MockCompilerHost(context) as ts.CompilerHost;
  }

  function createHost({
    files = {},
    options = {
      basePath: '/tmp',
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
    },
    ngHost = createNgHost({files}),
    summariesFromPreviousCompilations = new Map<string, string>(),
  }: {
    files?: Directory,
    options?: CompilerOptions,
    ngHost?: CompilerHost,
    summariesFromPreviousCompilations?: Map<string, string>
  } = {}) {
    return new TsCompilerAotCompilerTypeCheckHostAdapter(
        ['/tmp/index.ts'], options, ngHost, new MetadataCollector(), codeGenerator,
        summariesFromPreviousCompilations);
  }

  describe('fileNameToModuleName', () => {
    let host: TsCompilerAotCompilerTypeCheckHostAdapter;
    beforeEach(() => { host = createHost(); });

    it('should use a package import when accessing a package from a source file', () => {
      expect(host.fileNameToModuleName('/tmp/node_modules/@angular/core.d.ts', '/tmp/main.ts'))
          .toBe('@angular/core');
    });

    it('should use a package import when accessing a package from another package', () => {
      expect(host.fileNameToModuleName(
                 '/tmp/node_modules/mod1/index.d.ts', '/tmp/node_modules/mod2/index.d.ts'))
          .toBe('mod1/index');
      expect(host.fileNameToModuleName(
                 '/tmp/node_modules/@angular/core/index.d.ts',
                 '/tmp/node_modules/@angular/common/index.d.ts'))
          .toBe('@angular/core/index');
    });

    it('should use a relative import when accessing a file in the same package', () => {
      expect(host.fileNameToModuleName(
                 '/tmp/node_modules/mod/a/child.d.ts', '/tmp/node_modules/mod/index.d.ts'))
          .toBe('./a/child');
      expect(host.fileNameToModuleName(
                 '/tmp/node_modules/@angular/core/src/core.d.ts',
                 '/tmp/node_modules/@angular/core/index.d.ts'))
          .toBe('./src/core');
    });

    it('should use a relative import when accessing a source file from a source file', () => {
      expect(host.fileNameToModuleName('/tmp/src/a/child.ts', '/tmp/src/index.ts'))
          .toBe('./a/child');
    });

    it('should support multiple rootDirs when accessing a source file form a source file', () => {
      const hostWithMultipleRoots = createHost({
        options: {
          basePath: '/tmp/',
          rootDirs: [
            'src/a',
            'src/b',
          ]
        }
      });
      // both files are in the rootDirs
      expect(hostWithMultipleRoots.fileNameToModuleName('/tmp/src/b/b.ts', '/tmp/src/a/a.ts'))
          .toBe('./b');

      // one file is not in the rootDirs
      expect(hostWithMultipleRoots.fileNameToModuleName('/tmp/src/c/c.ts', '/tmp/src/a/a.ts'))
          .toBe('../c/c');
    });

    it('should error if accessing a source file from a package', () => {
      expect(
          () => host.fileNameToModuleName(
              '/tmp/src/a/child.ts', '/tmp/node_modules/@angular/core.d.ts'))
          .toThrowError(
              'Trying to import a source file from a node_modules package: ' +
              'import /tmp/src/a/child.ts from /tmp/node_modules/@angular/core.d.ts');
    });

    it('should use the provided implementation if any', () => {
      const ngHost = createNgHost();
      ngHost.fileNameToModuleName = () => 'someResult';
      const host = createHost({ngHost});
      expect(host.fileNameToModuleName('a', 'b')).toBe('someResult');
    });
  });

  describe('moduleNameToFileName', () => {
    it('should resolve an import using the containing file', () => {
      const host = createHost({files: {'tmp': {'src': {'a': {'child.d.ts': dummyModule}}}}});
      expect(host.moduleNameToFileName('./a/child', '/tmp/src/index.ts'))
          .toBe('/tmp/src/a/child.d.ts');
    });

    it('should allow to skip the containg file for package imports', () => {
      const host =
          createHost({files: {'tmp': {'node_modules': {'@core': {'index.d.ts': dummyModule}}}}});
      expect(host.moduleNameToFileName('@core/index')).toBe('/tmp/node_modules/@core/index.d.ts');
    });

    it('should use the provided implementation if any', () => {
      const ngHost = createNgHost();
      ngHost.moduleNameToFileName = () => 'someResult';
      const host = createHost({ngHost});
      expect(host.moduleNameToFileName('a', 'b')).toBe('someResult');
    });
  });

  describe('resourceNameToFileName', () => {
    it('should resolve a relative import', () => {
      const host = createHost({files: {'tmp': {'src': {'a': {'child.html': '<div>'}}}}});
      expect(host.resourceNameToFileName('./a/child.html', '/tmp/src/index.ts'))
          .toBe('/tmp/src/a/child.html');

      expect(host.resourceNameToFileName('./a/non-existing.html', '/tmp/src/index.ts')).toBe(null);
    });

    it('should resolve package paths as relative paths', () => {
      const host = createHost({files: {'tmp': {'src': {'a': {'child.html': '<div>'}}}}});
      expect(host.resourceNameToFileName('a/child.html', '/tmp/src/index.ts'))
          .toBe('/tmp/src/a/child.html');
    });

    it('should resolve absolute paths as package paths', () => {
      const host = createHost({files: {'tmp': {'node_modules': {'a': {'child.html': '<div>'}}}}});
      expect(host.resourceNameToFileName('/a/child.html', ''))
          .toBe('/tmp/node_modules/a/child.html');
    });

    it('should use the provided implementation if any', () => {
      const ngHost = createNgHost();
      ngHost.resourceNameToFileName = () => 'someResult';
      const host = createHost({ngHost});
      expect(host.resourceNameToFileName('a', 'b')).toBe('someResult');
    });

  });

  describe('getSourceFile', () => {
    it('should cache source files by name', () => {
      const host = createHost({files: {'tmp': {'src': {'index.ts': ``}}}});

      const sf1 = host.getSourceFile('/tmp/src/index.ts', ts.ScriptTarget.Latest);
      const sf2 = host.getSourceFile('/tmp/src/index.ts', ts.ScriptTarget.Latest);
      expect(sf1).toBe(sf2);
    });

    it('should generate code when asking for the base name and add it as referencedFiles', () => {
      codeGenerator.and.returnValue([aGeneratedFile]);
      const host = createHost({
        files: {
          'tmp': {
            'src': {
              'index.ts': `
              /// <reference path="main.ts"/>
            `
            }
          }
        }
      });

      const sf = host.getSourceFile('/tmp/src/index.ts', ts.ScriptTarget.Latest);
      expect(sf.referencedFiles[0].fileName).toBe('main.ts');
      expect(sf.referencedFiles[1].fileName).toBe('/tmp/src/index.ngfactory.ts');

      const genSf = host.getSourceFile('/tmp/src/index.ngfactory.ts', ts.ScriptTarget.Latest);
      expect(genSf.text).toBe(aGeneratedFileText);

      // the codegen should have been cached
      expect(codeGenerator).toHaveBeenCalledTimes(1);
    });

    it('should generate code when asking for the generated name first', () => {
      codeGenerator.and.returnValue([aGeneratedFile]);
      const host = createHost({
        files: {
          'tmp': {
            'src': {
              'index.ts': `
              /// <reference path="main.ts"/>
            `
            }
          }
        }
      });

      const genSf = host.getSourceFile('/tmp/src/index.ngfactory.ts', ts.ScriptTarget.Latest);
      expect(genSf.text).toBe(aGeneratedFileText);

      const sf = host.getSourceFile('/tmp/src/index.ts', ts.ScriptTarget.Latest);
      expect(sf.referencedFiles[0].fileName).toBe('main.ts');
      expect(sf.referencedFiles[1].fileName).toBe('/tmp/src/index.ngfactory.ts');

      // the codegen should have been cached
      expect(codeGenerator).toHaveBeenCalledTimes(1);
    });

    it('should clear old generated references if the original host cached them', () => {
      const ngHost = createNgHost();
      const sfText = `
          /// <reference path="main.ts"/>
      `;
      const sf = ts.createSourceFile('/tmp/src/index.ts', sfText, ts.ScriptTarget.Latest);
      ngHost.getSourceFile = () => sf;

      codeGenerator.and.returnValue(
          [new compiler.GeneratedFile('/tmp/src/index.ts', '/tmp/src/index.ngfactory.ts', [])]);
      const host1 = createHost({ngHost});

      host1.getSourceFile('/tmp/src/index.ts', ts.ScriptTarget.Latest);
      expect(sf.referencedFiles.length).toBe(2);
      expect(sf.referencedFiles[0].fileName).toBe('main.ts');
      expect(sf.referencedFiles[1].fileName).toBe('/tmp/src/index.ngfactory.ts');

      codeGenerator.and.returnValue([]);
      const host2 = createHost({ngHost});

      host2.getSourceFile('/tmp/src/index.ts', ts.ScriptTarget.Latest);
      expect(sf.referencedFiles.length).toBe(1);
      expect(sf.referencedFiles[0].fileName).toBe('main.ts');
    });
  });

  describe('updateSourceFile', () => {
    it('should update source files', () => {
      codeGenerator.and.returnValue([aGeneratedFile]);
      const host = createHost({files: {'tmp': {'src': {'index.ts': ''}}}});

      let genSf = host.getSourceFile('/tmp/src/index.ngfactory.ts', ts.ScriptTarget.Latest);
      expect(genSf.text).toBe(aGeneratedFileText);

      host.updateGeneratedFile(new compiler.GeneratedFile(
          '/tmp/src/index.ts', '/tmp/src/index.ngfactory.ts',
          [new compiler.DeclareVarStmt('x', new compiler.LiteralExpr(2))]));
      genSf = host.getSourceFile('/tmp/src/index.ngfactory.ts', ts.ScriptTarget.Latest);
      expect(genSf.text).toBe(`var x:any = 2;\n`);
    });

    it('should error if the imports changed', () => {
      codeGenerator.and.returnValue(
          [new compiler.GeneratedFile('/tmp/src/index.ts', '/tmp/src/index.ngfactory.ts', [
            new compiler.DeclareVarStmt(
                'x', new compiler.ExternalExpr(new compiler.ExternalReference('aModule', 'aName')))
          ])]);
      const host = createHost({files: {'tmp': {'src': {'index.ts': ''}}}});

      host.getSourceFile('/tmp/src/index.ngfactory.ts', ts.ScriptTarget.Latest);

      expect(
          () => host.updateGeneratedFile(new compiler.GeneratedFile(
              '/tmp/src/index.ts', '/tmp/src/index.ngfactory.ts',
              [new compiler.DeclareVarStmt(
                  'x', new compiler.ExternalExpr(
                           new compiler.ExternalReference('otherModule', 'aName')))])))
          .toThrowError([
            `Illegal State: external references changed in /tmp/src/index.ngfactory.ts.`,
            `Old: aModule.`, `New: otherModule`
          ].join('\n'));
    });
  });

  describe('fileExists', () => {
    it('should cache calls', () => {
      const ngHost = createNgHost({files: {'tmp': {'src': {'index.ts': ``}}}});
      spyOn(ngHost, 'fileExists').and.callThrough();
      const host = createHost({ngHost});

      expect(host.fileExists('/tmp/src/index.ts')).toBe(true);
      expect(host.fileExists('/tmp/src/index.ts')).toBe(true);

      expect(ngHost.fileExists).toHaveBeenCalledTimes(1);
    });

    it(`should not derive the existence of generated files baesd on summaries on disc`, () => {
      const host = createHost({files: {'tmp': {'lib': {'module.ngsummary.json': ``}}}});
      expect(host.fileExists('/tmp/lib/module.ngfactory.ts')).toBe(false);
      expect(host.fileExists('/tmp/lib/module.ngfactory.d.ts')).toBe(false);
    });

    it(`should derive the existence of generated .d.ts files based on the summaries from an old program`,
       () => {
         const summariesFromPreviousCompilations = new Map<string, string>();
         summariesFromPreviousCompilations.set('/tmp/lib/module.ngsummary.json', `{}`);
         const host = createHost({summariesFromPreviousCompilations});
         expect(host.fileExists('/tmp/lib/module.ngfactory.ts')).toBe(false);
         expect(host.fileExists('/tmp/lib/module.ngfactory.d.ts')).toBe(true);
       });
  });
});
