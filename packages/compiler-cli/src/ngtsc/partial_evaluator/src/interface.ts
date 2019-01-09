/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript';

import {Reference} from '../../imports';
import {ReflectionHost} from '../../reflection';

import {StaticInterpreter} from './interpreter';
import {ResolvedValue} from './result';

export type ForeignFunctionResolver =
    (node: Reference<ts.FunctionDeclaration|ts.MethodDeclaration>, args: ts.Expression[]) =>
        ts.Expression | null;

export class PartialEvaluator {
  constructor(private host: ReflectionHost, private checker: ts.TypeChecker) {}

  evaluate(expr: ts.Expression, foreignFunctionResolver?: ForeignFunctionResolver): ResolvedValue {
    const interpreter = new StaticInterpreter(this.host, this.checker);
    return interpreter.visit(expr, {
      absoluteModuleName: null,
      scope: new Map<ts.ParameterDeclaration, ResolvedValue>(), foreignFunctionResolver,
    });
  }
}
