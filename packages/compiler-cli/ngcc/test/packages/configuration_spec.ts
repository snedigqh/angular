/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {FileSystem, absoluteFrom, getFileSystem} from '../../../src/ngtsc/file_system';
import {runInEachFileSystem} from '../../../src/ngtsc/file_system/testing';
import {loadTestFiles} from '../../../test/helpers';
import {DEFAULT_NGCC_CONFIG, NgccConfiguration} from '../../src/packages/configuration';


runInEachFileSystem(() => {
  let _Abs: typeof absoluteFrom;
  let fs: FileSystem;

  beforeEach(() => {
    _Abs = absoluteFrom;
    fs = getFileSystem();
  });

  describe('NgccConfiguration', () => {
    describe('constructor', () => {
      it('should error if a project level config file is badly formatted', () => {
        loadTestFiles([{name: _Abs('/project-1/ngcc.config.js'), contents: `bad js code`}]);
        expect(() => new NgccConfiguration(fs, _Abs('/project-1')))
            .toThrowError(
                `Invalid project configuration file at "${_Abs('/project-1/ngcc.config.js')}": Unexpected identifier`);
      });
    });

    describe('getConfig()', () => {
      describe('at the package level', () => {
        it('should return configuration for a package found in a package level file', () => {
          loadTestFiles([{
            name: _Abs('/project-1/node_modules/package-1/ngcc.config.js'),
            contents: `module.exports = {entryPoints: { './entry-point-1': {}}}`
          }]);
          const readFileSpy = spyOn(fs, 'readFile').and.callThrough();
          const configuration = new NgccConfiguration(fs, _Abs('/project-1'));
          const config = configuration.getConfig(_Abs('/project-1/node_modules/package-1'));

          expect(config).toEqual(
              {entryPoints: {[_Abs('/project-1/node_modules/package-1/entry-point-1')]: {}}});
          expect(readFileSpy)
              .toHaveBeenCalledWith(_Abs('/project-1/node_modules/package-1/ngcc.config.js'));
        });

        it('should used cached configuration for a package if available', () => {
          loadTestFiles([{
            name: _Abs('/project-1/node_modules/package-1/ngcc.config.js'),
            contents: `
          module.exports = {
            entryPoints: {
              './entry-point-1': {}
            },
          };`
          }]);
          const configuration = new NgccConfiguration(fs, _Abs('/project-1'));

          // Populate the cache
          configuration.getConfig(_Abs('/project-1/node_modules/package-1'));

          const readFileSpy = spyOn(fs, 'readFile').and.callThrough();
          const config = configuration.getConfig(_Abs('/project-1/node_modules/package-1'));

          expect(config).toEqual(
              {entryPoints: {[_Abs('/project-1/node_modules/package-1/entry-point-1')]: {}}});
          expect(readFileSpy).not.toHaveBeenCalled();
        });

        it('should return an empty configuration object if there is no matching configuration for the package',
           () => {
             const configuration = new NgccConfiguration(fs, _Abs('/project-1'));
             const config = configuration.getConfig(_Abs('/project-1/node_modules/package-1'));
             expect(config).toEqual({entryPoints: {}});
           });

        it('should error if a package level config file is badly formatted', () => {
          loadTestFiles([{
            name: _Abs('/project-1/node_modules/package-1/ngcc.config.js'),
            contents: `bad js code`
          }]);
          const configuration = new NgccConfiguration(fs, _Abs('/project-1'));
          expect(() => configuration.getConfig(_Abs('/project-1/node_modules/package-1')))
              .toThrowError(
                  `Invalid package configuration file at "${_Abs('/project-1/node_modules/package-1/ngcc.config.js')}": Unexpected identifier`);
        });
      });

      describe('at the project level', () => {
        it('should return configuration for a package found in a project level file', () => {
          loadTestFiles([{
            name: _Abs('/project-1/ngcc.config.js'),
            contents: `
          module.exports = {
            packages: {
              'package-1': {
                entryPoints: {
                  './entry-point-1': {}
                },
              },
            },
          };`
          }]);
          const readFileSpy = spyOn(fs, 'readFile').and.callThrough();
          const configuration = new NgccConfiguration(fs, _Abs('/project-1'));
          expect(readFileSpy).toHaveBeenCalledWith(_Abs('/project-1/ngcc.config.js'));

          const config = configuration.getConfig(_Abs('/project-1/node_modules/package-1'));
          expect(config).toEqual(
              {entryPoints: {[_Abs('/project-1/node_modules/package-1/entry-point-1')]: {}}});
        });

        it('should override package level config with project level config per package', () => {
          loadTestFiles([
            {
              name: _Abs('/project-1/ngcc.config.js'),
              contents: `
          module.exports = {
            packages: {
              'package-2': {
                entryPoints: {
                  './project-setting-entry-point': {}
                },
              },
            },
          };`,
            },
            {
              name: _Abs('/project-1/node_modules/package-1/ngcc.config.js'),
              contents: `
          module.exports = {
            entryPoints: {
              './package-setting-entry-point': {}
            },
          };`,
            },
            {
              name: _Abs('/project-1/node_modules/package-2/ngcc.config.js'),
              contents: `
          module.exports = {
            entryPoints: {
              './package-setting-entry-point': {}
            },
          };`,
            }
          ]);
          const readFileSpy = spyOn(fs, 'readFile').and.callThrough();
          const configuration = new NgccConfiguration(fs, _Abs('/project-1'));
          expect(readFileSpy).toHaveBeenCalledWith(_Abs('/project-1/ngcc.config.js'));

          const package1Config = configuration.getConfig(_Abs('/project-1/node_modules/package-1'));
          expect(package1Config).toEqual({
            entryPoints:
                {[_Abs('/project-1/node_modules/package-1/package-setting-entry-point')]: {}}
          });
          expect(readFileSpy)
              .toHaveBeenCalledWith(_Abs('/project-1/node_modules/package-1/ngcc.config.js'));

          // Note that for `package-2` only the project level entry-point is left.
          // This is because overriding happens for packages as a whole and there is no attempt to
          // merge entry-points.
          const package2Config = configuration.getConfig(_Abs('/project-1/node_modules/package-2'));
          expect(package2Config).toEqual({
            entryPoints:
                {[_Abs('/project-1/node_modules/package-2/project-setting-entry-point')]: {}}
          });
          expect(readFileSpy)
              .not.toHaveBeenCalledWith(_Abs('/project-1/node_modules/package-2/ngcc.config.js'));
        });
      });

      describe('at the default level', () => {
        const originalDefaultConfig = DEFAULT_NGCC_CONFIG.packages['package-1'];
        beforeEach(() => {
          DEFAULT_NGCC_CONFIG.packages['package-1'] = {
            entryPoints: {'./default-level-entry-point': {}},
          };
        });
        afterEach(() => { DEFAULT_NGCC_CONFIG.packages['package-1'] = originalDefaultConfig; });

        it('should return configuration for a package found in the default config', () => {

          const readFileSpy = spyOn(fs, 'readFile').and.callThrough();
          const configuration = new NgccConfiguration(fs, _Abs('/project-1'));
          expect(readFileSpy).not.toHaveBeenCalled();

          const config = configuration.getConfig(_Abs('/project-1/node_modules/package-1'));
          expect(config).toEqual({
            entryPoints:
                {[_Abs('/project-1/node_modules/package-1/default-level-entry-point')]: {}}
          });
        });

        it('should override default level config with package level config, if provided', () => {
          loadTestFiles([{
            name: _Abs('/project-1/node_modules/package-1/ngcc.config.js'),
            contents: `
            module.exports = {
              entryPoints: {'./package-level-entry-point': {}},
            };`,
          }]);
          const configuration = new NgccConfiguration(fs, _Abs('/project-1'));
          const config = configuration.getConfig(_Abs('/project-1/node_modules/package-1'));
          // Note that only the package-level-entry-point is left.
          // This is because overriding happens for packages as a whole and there is no attempt to
          // merge entry-points.
          expect(config).toEqual({
            entryPoints:
                {[_Abs('/project-1/node_modules/package-1/package-level-entry-point')]: {}}
          });
        });

        it('should override default level config with project level config, if provided', () => {
          loadTestFiles([
            {
              name: _Abs('/project-1/node_modules/package-1/ngcc.config.js'),
              contents: `
            module.exports = {
              entryPoints: {'./package-level-entry-point': {}},
            };`,
            },
            {
              name: _Abs('/project-1/ngcc.config.js'),
              contents: `
            module.exports = {
              packages: {
                'package-1': {
                  entryPoints: {
                    './project-level-entry-point': {}
                  },
                },
              },
            };`,
            },
          ]);

          const configuration = new NgccConfiguration(fs, _Abs('/project-1'));
          const config = configuration.getConfig(_Abs('/project-1/node_modules/package-1'));
          // Note that only the project-level-entry-point is left.
          // This is because overriding happens for packages as a whole and there is no attempt to
          // merge entry-points.
          expect(config).toEqual({
            entryPoints:
                {[_Abs('/project-1/node_modules/package-1/project-level-entry-point')]: {}}
          });
        });
      });
    });
  });
});
