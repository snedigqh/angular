/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {PipeTransform} from '../change_detection/pipe_transform';

import {getTView, load, store} from './instructions';
import {PipeDef} from './interfaces/definition';
import {pureFunction1, pureFunction2, pureFunction3, pureFunction4, pureFunctionV} from './pure_function';


/**
 * Create a pipe.
 *
 * @param index Pipe index where the pipe will be stored.
 * @param pipeDef Pipe definition object for registering life cycle hooks.
 * @param firstInstance (optional) The first instance of the pipe that can be reused for pure pipes.
 * @returns T the instance of the pipe.
 */
export function pipe<T>(index: number, pipeDef: PipeDef<T>, firstInstance?: T): T {
  const tView = getTView();
  if (tView.firstTemplatePass) {
    tView.data[index] = pipeDef;
    if (pipeDef.onDestroy) {
      (tView.pipeDestroyHooks || (tView.pipeDestroyHooks = [])).push(index, pipeDef.onDestroy);
    }
  }
  const pipeInstance = pipeDef.pure && firstInstance ? firstInstance : pipeDef.n();
  store(index, pipeInstance);
  return pipeInstance;
}

/**
 * Invokes a pipe with 1 arguments.
 *
 * This instruction acts as a guard to {@link PipeTransform#transform} invoking
 * the pipe only when an input to the pipe changes.
 *
 * @param index Pipe index where the pipe was stored on creation.
 * @param v1 1st argument to {@link PipeTransform#transform}.
 */
export function pipeBind1(index: number, v1: any): any {
  const pipeInstance = load<PipeTransform>(index);
  return isPure(index) ? pureFunction1(pipeInstance.transform, v1, pipeInstance) :
                         pipeInstance.transform(v1);
}

/**
 * Invokes a pipe with 2 arguments.
 *
 * This instruction acts as a guard to {@link PipeTransform#transform} invoking
 * the pipe only when an input to the pipe changes.
 *
 * @param index Pipe index where the pipe was stored on creation.
 * @param v1 1st argument to {@link PipeTransform#transform}.
 * @param v2 2nd argument to {@link PipeTransform#transform}.
 */
export function pipeBind2(index: number, v1: any, v2: any): any {
  const pipeInstance = load<PipeTransform>(index);
  return isPure(index) ? pureFunction2(pipeInstance.transform, v1, v2, pipeInstance) :
                         pipeInstance.transform(v1, v2);
}

/**
 * Invokes a pipe with 3 arguments.
 *
 * This instruction acts as a guard to {@link PipeTransform#transform} invoking
 * the pipe only when an input to the pipe changes.
 *
 * @param index Pipe index where the pipe was stored on creation.
 * @param v1 1st argument to {@link PipeTransform#transform}.
 * @param v2 2nd argument to {@link PipeTransform#transform}.
 * @param v3 4rd argument to {@link PipeTransform#transform}.
 */
export function pipeBind3(index: number, v1: any, v2: any, v3: any): any {
  const pipeInstance = load<PipeTransform>(index);
  return isPure(index) ? pureFunction3(pipeInstance.transform.bind(pipeInstance), v1, v2, v3) :
                         pipeInstance.transform(v1, v2, v3);
}

/**
 * Invokes a pipe with 4 arguments.
 *
 * This instruction acts as a guard to {@link PipeTransform#transform} invoking
 * the pipe only when an input to the pipe changes.
 *
 * @param index Pipe index where the pipe was stored on creation.
 * @param v1 1st argument to {@link PipeTransform#transform}.
 * @param v2 2nd argument to {@link PipeTransform#transform}.
 * @param v3 3rd argument to {@link PipeTransform#transform}.
 * @param v4 4th argument to {@link PipeTransform#transform}.
 */
export function pipeBind4(index: number, v1: any, v2: any, v3: any, v4: any): any {
  const pipeInstance = load<PipeTransform>(index);
  return isPure(index) ? pureFunction4(pipeInstance.transform, v1, v2, v3, v4, pipeInstance) :
                         pipeInstance.transform(v1, v2, v3, v4);
}

/**
 * Invokes a pipe with variable number of arguments.
 *
 * This instruction acts as a guard to {@link PipeTransform#transform} invoking
 * the pipe only when an input to the pipe changes.
 *
 * @param index Pipe index where the pipe was stored on creation.
 * @param values Array of arguments to pass to {@link PipeTransform#transform} method.
 */
export function pipeBindV(index: number, values: any[]): any {
  const pipeInstance = load<PipeTransform>(index);
  return isPure(index) ? pureFunctionV(pipeInstance.transform, values, pipeInstance) :
                         pipeInstance.transform.apply(pipeInstance, values);
}

function isPure(index: number): boolean {
  return (<PipeDef<any>>getTView().data[index]).pure;
}
