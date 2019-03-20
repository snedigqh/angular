/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {existsSync, readFileSync, readdirSync, statSync} from 'fs';
import * as mockFs from 'mock-fs';
import {join} from 'path';
const Module = require('module');

import {mainNgcc} from '../../src/main';
import {getAngularPackagesFromRunfiles, resolveNpmTreeArtifact} from '../../../test/runfile_helpers';

describe('ngcc main()', () => {
  beforeEach(createMockFileSystem);
  afterEach(restoreRealFileSystem);

  it('should run ngcc without errors for esm2015', () => {
    expect(() => mainNgcc({basePath: '/node_modules', propertiesToConsider: ['esm2015']}))
        .not.toThrow();
  });

  it('should run ngcc without errors for esm5', () => {
    expect(() => mainNgcc({basePath: '/node_modules', propertiesToConsider: ['esm5']}))
        .not.toThrow();
  });

  describe('with targetEntryPointPath', () => {
    it('should only compile the given package entry-point (and its dependencies).', () => {
      mainNgcc({basePath: '/node_modules', targetEntryPointPath: '@angular/common/http'});

      expect(loadPackage('@angular/common/http').__modified_by_ngcc__).toEqual({
        module: '0.0.0-PLACEHOLDER',
        es2015: '0.0.0-PLACEHOLDER',
        esm5: '0.0.0-PLACEHOLDER',
        esm2015: '0.0.0-PLACEHOLDER',
        fesm5: '0.0.0-PLACEHOLDER',
        fesm2015: '0.0.0-PLACEHOLDER',
      });
      // * `common` is a dependency of `common/http`, so is compiled.
      expect(loadPackage('@angular/common').__modified_by_ngcc__).toEqual({
        module: '0.0.0-PLACEHOLDER',
        es2015: '0.0.0-PLACEHOLDER',
        esm5: '0.0.0-PLACEHOLDER',
        esm2015: '0.0.0-PLACEHOLDER',
        fesm5: '0.0.0-PLACEHOLDER',
        fesm2015: '0.0.0-PLACEHOLDER',
      });
      // * `core` is a dependency of `common`, so is compiled.
      expect(loadPackage('@angular/core').__modified_by_ngcc__).toEqual({
        module: '0.0.0-PLACEHOLDER',
        es2015: '0.0.0-PLACEHOLDER',
        esm5: '0.0.0-PLACEHOLDER',
        esm2015: '0.0.0-PLACEHOLDER',
        fesm5: '0.0.0-PLACEHOLDER',
        fesm2015: '0.0.0-PLACEHOLDER',
      });

      // * `common/testing` is not a dependency of `common/http` so is not compiled.
      expect(loadPackage('@angular/common/testing').__modified_by_ngcc__).toBeUndefined();
    });
  });

  describe('with propertiesToConsider', () => {
    it('should only compile the entry-point formats given in the `propertiesToConsider` list',
       () => {
         mainNgcc({
           basePath: '/node_modules',
           propertiesToConsider: ['main', 'esm5', 'module', 'fesm5']
         });

         // * the `main` property is UMD, which is not yet supported.
         // * none of the ES2015 formats are compiled as they are not on the `propertiesToConsider`
         // list.
         expect(loadPackage('@angular/core').__modified_by_ngcc__).toEqual({
           esm5: '0.0.0-PLACEHOLDER',
           module: '0.0.0-PLACEHOLDER',
           fesm5: '0.0.0-PLACEHOLDER',
         });
         expect(loadPackage('@angular/common').__modified_by_ngcc__).toEqual({
           esm5: '0.0.0-PLACEHOLDER',
           module: '0.0.0-PLACEHOLDER',
           fesm5: '0.0.0-PLACEHOLDER',
         });
         expect(loadPackage('@angular/common/testing').__modified_by_ngcc__).toEqual({
           esm5: '0.0.0-PLACEHOLDER',
           module: '0.0.0-PLACEHOLDER',
           fesm5: '0.0.0-PLACEHOLDER',
         });
         expect(loadPackage('@angular/common/http').__modified_by_ngcc__).toEqual({
           esm5: '0.0.0-PLACEHOLDER',
           module: '0.0.0-PLACEHOLDER',
           fesm5: '0.0.0-PLACEHOLDER',
         });
       });
  });

  describe('with compileAllFormats set to false', () => {
    it('should only compile the first matching format', () => {
      mainNgcc({
        basePath: '/node_modules',
        propertiesToConsider: ['main', 'module', 'fesm5', 'esm5'],
        compileAllFormats: false
      });
      // * The `main` is UMD, which is not yet supported, and so is not compiled.
      // * In the Angular packages fesm5 and module have the same underlying format,
      //   so both are marked as compiled.
      // * The `esm5` is not compiled because we stopped after the `fesm5` format.
      expect(loadPackage('@angular/core').__modified_by_ngcc__).toEqual({
        fesm5: '0.0.0-PLACEHOLDER',
        module: '0.0.0-PLACEHOLDER',
      });
      expect(loadPackage('@angular/common').__modified_by_ngcc__).toEqual({
        fesm5: '0.0.0-PLACEHOLDER',
        module: '0.0.0-PLACEHOLDER',
      });
      expect(loadPackage('@angular/common/testing').__modified_by_ngcc__).toEqual({
        fesm5: '0.0.0-PLACEHOLDER',
        module: '0.0.0-PLACEHOLDER',
      });
      expect(loadPackage('@angular/common/http').__modified_by_ngcc__).toEqual({
        fesm5: '0.0.0-PLACEHOLDER',
        module: '0.0.0-PLACEHOLDER',
      });
    });
  });
});


function createMockFileSystem() {
  mockFs({
    '/node_modules/@angular': loadAngularPackages(),
    '/node_modules/rxjs': loadDirectory(resolveNpmTreeArtifact('rxjs', 'index.js')),
    '/node_modules/tslib': loadDirectory(resolveNpmTreeArtifact('tslib', 'tslib.js')),
  });
  spyOn(Module, '_resolveFilename').and.callFake(mockResolve);
}

function restoreRealFileSystem() {
  mockFs.restore();
}


/** Load the built Angular packages into an in-memory structure. */
function loadAngularPackages(): Directory {
  const packagesDirectory: Directory = {};

  getAngularPackagesFromRunfiles().forEach(
      ({name, pkgPath}) => { packagesDirectory[name] = loadDirectory(pkgPath); });

  return packagesDirectory;
}

/**
 * Load real files from the filesystem into an "in-memory" structure,
 * which can be used with `mock-fs`.
 * @param directoryPath the path to the directory we want to load.
 */
function loadDirectory(directoryPath: string): Directory {
  const directory: Directory = {};

  readdirSync(directoryPath).forEach(item => {
    const itemPath = join(directoryPath, item);
    if (statSync(itemPath).isDirectory()) {
      directory[item] = loadDirectory(itemPath);
    } else {
      directory[item] = readFileSync(itemPath, 'utf-8');
    }
  });

  return directory;
}

interface Directory {
  [pathSegment: string]: string|Directory;
}

/**
 * A mock implementation of the node.js Module._resolveFilename function,
 * which we are spying on to support mocking out the file-system in these tests.
 *
 * @param request the path to a module that needs resolving.
 */
function mockResolve(request: string): string|null {
  if (existsSync(request)) {
    const stat = statSync(request);
    if (stat.isFile()) {
      return request;
    } else if (stat.isDirectory()) {
      const pIndex = mockResolve(request + '/index');
      if (pIndex && existsSync(pIndex)) {
        return pIndex;
      }
    }
  }
  for (const ext of ['.js', '.d.ts']) {
    if (existsSync(request + ext)) {
      return request + ext;
    }
  }
  if (request.indexOf('/node_modules') === 0) {
    // We already tried adding node_modules so give up.
    return null;
  } else {
    return mockResolve(join('/node_modules', request));
  }
}

function loadPackage(packageName: string): any {
  return JSON.parse(readFileSync(`/node_modules/${packageName}/package.json`, 'utf8'));
}