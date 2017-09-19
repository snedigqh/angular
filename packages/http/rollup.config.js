/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import resolve from 'rollup-plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';

const globals = {
  '@angular/core': 'ng.core',
  '@angular/compiler': 'ng.compiler',
  '@angular/platform-browser': 'ng.platformBrowser',
  'rxjs/Observable': 'Rx',
  'rxjs/Subject': 'Rx'
};

export default {
  entry: '../../dist/packages-dist/http/esm5/http.js',
  dest: '../../dist/packages-dist/http/bundles/http.umd.js',
  format: 'umd',
  exports: 'named',
  moduleName: 'ng.http',
  plugins: [resolve(), sourcemaps()],
  external: Object.keys(globals),
  globals: globals
};
