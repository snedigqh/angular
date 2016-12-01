/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {Injectable} from '@angular/core';
import {CompileSummary} from './compile_metadata';

@Injectable()
export class SummaryResolver {
  resolveSummary(reference: any): CompileSummary { return null; }
}
