/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {AbsoluteFsPath} from '../../../src/ngtsc/path';
import {DependencyResolver, SortedEntryPointsInfo} from '../../src/dependencies/dependency_resolver';
import {EsmDependencyHost} from '../../src/dependencies/esm_dependency_host';
import {ModuleResolver} from '../../src/dependencies/module_resolver';
import {FileSystem} from '../../src/file_system/file_system';
import {EntryPoint} from '../../src/packages/entry_point';
import {MockFileSystem} from '../helpers/mock_file_system';
import {MockLogger} from '../helpers/mock_logger';

const _ = AbsoluteFsPath.from;

describe('DependencyResolver', () => {
  let host: EsmDependencyHost;
  let resolver: DependencyResolver;
  let fs: FileSystem;
  let moduleResolver: ModuleResolver;
  beforeEach(() => {
    fs = new MockFileSystem();
    moduleResolver = new ModuleResolver(fs);
    host = new EsmDependencyHost(fs, moduleResolver);
    resolver = new DependencyResolver(fs, new MockLogger(), {esm5: host, esm2015: host});
  });
  describe('sortEntryPointsByDependency()', () => {
    const first = {
      path: _('/first'),
      packageJson: {esm5: './index.js'},
      compiledByAngular: true
    } as EntryPoint;
    const second = {
      path: _('/second'),
      packageJson: {esm2015: './sub/index.js'},
      compiledByAngular: true
    } as EntryPoint;
    const third = {
      path: _('/third'),
      packageJson: {fesm5: './index.js'},
      compiledByAngular: true
    } as EntryPoint;
    const fourth = {
      path: _('/fourth'),
      packageJson: {fesm2015: './sub2/index.js'},
      compiledByAngular: true
    } as EntryPoint;
    const fifth = {
      path: _('/fifth'),
      packageJson: {module: './index.js'},
      compiledByAngular: true
    } as EntryPoint;

    const dependencies = {
      [_('/first/index.js')]: {resolved: [second.path, third.path, '/ignored-1'], missing: []},
      [_('/second/sub/index.js')]: {resolved: [third.path, fifth.path], missing: []},
      [_('/third/index.js')]: {resolved: [fourth.path, '/ignored-2'], missing: []},
      [_('/fourth/sub2/index.js')]: {resolved: [fifth.path], missing: []},
      [_('/fifth/index.js')]: {resolved: [], missing: []},
    };

    it('should order the entry points by their dependency on each other', () => {
      spyOn(host, 'findDependencies').and.callFake(createFakeComputeDependencies(dependencies));
      const result = resolver.sortEntryPointsByDependency([fifth, first, fourth, second, third]);
      expect(result.entryPoints).toEqual([fifth, fourth, third, second, first]);
    });

    it('should remove entry-points that have missing direct dependencies', () => {
      spyOn(host, 'findDependencies').and.callFake(createFakeComputeDependencies({
        [_('/first/index.js')]: {resolved: [], missing: ['/missing']},
        [_('/second/sub/index.js')]: {resolved: [], missing: []},
      }));
      const result = resolver.sortEntryPointsByDependency([first, second]);
      expect(result.entryPoints).toEqual([second]);
      expect(result.invalidEntryPoints).toEqual([
        {entryPoint: first, missingDependencies: ['/missing']},
      ]);
    });

    it('should remove entry points that depended upon an invalid entry-point', () => {
      spyOn(host, 'findDependencies').and.callFake(createFakeComputeDependencies({
        [_('/first/index.js')]: {resolved: [second.path, third.path], missing: []},
        [_('/second/sub/index.js')]: {resolved: [], missing: ['/missing']},
        [_('/third/index.js')]: {resolved: [], missing: []},
      }));
      // Note that we will process `first` before `second`, which has the missing dependency.
      const result = resolver.sortEntryPointsByDependency([first, second, third]);
      expect(result.entryPoints).toEqual([third]);
      expect(result.invalidEntryPoints).toEqual([
        {entryPoint: second, missingDependencies: ['/missing']},
        {entryPoint: first, missingDependencies: ['/missing']},
      ]);
    });

    it('should remove entry points that will depend upon an invalid entry-point', () => {
      spyOn(host, 'findDependencies').and.callFake(createFakeComputeDependencies({
        [_('/first/index.js')]: {resolved: [second.path, third.path], missing: []},
        [_('/second/sub/index.js')]: {resolved: [], missing: ['/missing']},
        [_('/third/index.js')]: {resolved: [], missing: []},
      }));
      // Note that we will process `first` after `second`, which has the missing dependency.
      const result = resolver.sortEntryPointsByDependency([second, first, third]);
      expect(result.entryPoints).toEqual([third]);
      expect(result.invalidEntryPoints).toEqual([
        {entryPoint: second, missingDependencies: ['/missing']},
        {entryPoint: first, missingDependencies: [second.path]},
      ]);
    });

    it('should error if the entry point does not have a suitable format', () => {
      expect(() => resolver.sortEntryPointsByDependency([
        { path: '/first', packageJson: {}, compiledByAngular: true } as EntryPoint
      ])).toThrowError(`There is no appropriate source code format in '/first' entry-point.`);
    });

    it('should error if there is no appropriate DependencyHost for the given formats', () => {
      resolver = new DependencyResolver(fs, new MockLogger(), {esm2015: host});
      expect(() => resolver.sortEntryPointsByDependency([first]))
          .toThrowError(
              `Could not find a suitable format for computing dependencies of entry-point: '${first.path}'.`);
    });

    it('should capture any dependencies that were ignored', () => {
      spyOn(host, 'findDependencies').and.callFake(createFakeComputeDependencies(dependencies));
      const result = resolver.sortEntryPointsByDependency([fifth, first, fourth, second, third]);
      expect(result.ignoredDependencies).toEqual([
        {entryPoint: first, dependencyPath: '/ignored-1'},
        {entryPoint: third, dependencyPath: '/ignored-2'},
      ]);
    });

    it('should only return dependencies of the target, if provided', () => {
      spyOn(host, 'findDependencies').and.callFake(createFakeComputeDependencies(dependencies));
      const entryPoints = [fifth, first, fourth, second, third];
      let sorted: SortedEntryPointsInfo;

      sorted = resolver.sortEntryPointsByDependency(entryPoints, first);
      expect(sorted.entryPoints).toEqual([fifth, fourth, third, second, first]);
      sorted = resolver.sortEntryPointsByDependency(entryPoints, second);
      expect(sorted.entryPoints).toEqual([fifth, fourth, third, second]);
      sorted = resolver.sortEntryPointsByDependency(entryPoints, third);
      expect(sorted.entryPoints).toEqual([fifth, fourth, third]);
      sorted = resolver.sortEntryPointsByDependency(entryPoints, fourth);
      expect(sorted.entryPoints).toEqual([fifth, fourth]);
      sorted = resolver.sortEntryPointsByDependency(entryPoints, fifth);
      expect(sorted.entryPoints).toEqual([fifth]);
    });

    it('should use the appropriate DependencyHost for each entry-point', () => {
      const esm5Host = new EsmDependencyHost(fs, moduleResolver);
      const esm2015Host = new EsmDependencyHost(fs, moduleResolver);
      resolver =
          new DependencyResolver(fs, new MockLogger(), {esm5: esm5Host, esm2015: esm2015Host});
      spyOn(esm5Host, 'findDependencies').and.callFake(createFakeComputeDependencies(dependencies));
      spyOn(esm2015Host, 'findDependencies')
          .and.callFake(createFakeComputeDependencies(dependencies));
      const result = resolver.sortEntryPointsByDependency([fifth, first, fourth, second, third]);
      expect(result.entryPoints).toEqual([fifth, fourth, third, second, first]);

      expect(esm5Host.findDependencies).toHaveBeenCalledWith(`${first.path}/index.js`);
      expect(esm5Host.findDependencies).not.toHaveBeenCalledWith(`${second.path}/sub/index.js`);
      expect(esm5Host.findDependencies).toHaveBeenCalledWith(`${third.path}/index.js`);
      expect(esm5Host.findDependencies).not.toHaveBeenCalledWith(`${fourth.path}/sub2/index.js`);
      expect(esm5Host.findDependencies).toHaveBeenCalledWith(`${fifth.path}/index.js`);

      expect(esm2015Host.findDependencies).not.toHaveBeenCalledWith(`${first.path}/index.js`);
      expect(esm2015Host.findDependencies).toHaveBeenCalledWith(`${second.path}/sub/index.js`);
      expect(esm2015Host.findDependencies).not.toHaveBeenCalledWith(`${third.path}/index.js`);
      expect(esm2015Host.findDependencies).toHaveBeenCalledWith(`${fourth.path}/sub2/index.js`);
      expect(esm2015Host.findDependencies).not.toHaveBeenCalledWith(`${fifth.path}/index.js`);
    });

    interface DepMap {
      [path: string]: {resolved: string[], missing: string[]};
    }

    function createFakeComputeDependencies(deps: DepMap) {
      return (entryPoint: string) => {
        const dependencies = new Set();
        const missing = new Set();
        const deepImports = new Set();
        deps[entryPoint].resolved.forEach(dep => dependencies.add(dep));
        deps[entryPoint].missing.forEach(dep => missing.add(dep));
        return {dependencies, missing, deepImports};
      };
    }
  });
});
