/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {devModeEqual} from '../change_detection/change_detection';
import {SimpleChange} from '../change_detection/change_detection_util';
import {looseIdentical} from '../facade/lang';
import {ExpressionChangedAfterItHasBeenCheckedError} from '../linker/errors';
import {Renderer} from '../render/api';

import {ElementData, NodeData, NodeDef, NodeFlags, NodeType, ViewData, ViewDefinition, asElementData, asTextData} from './types';

export function setBindingDebugInfo(
    renderer: Renderer, renderNode: any, propName: string, value: any) {
  try {
    renderer.setBindingDebugInfo(
        renderNode, `ng-reflect-${camelCaseToDashCase(propName)}`, value ? value.toString() : null);
  } catch (e) {
    renderer.setBindingDebugInfo(
        renderNode, `ng-reflect-${camelCaseToDashCase(propName)}`,
        '[ERROR] Exception while trying to serialize the value');
  }
}

const CAMEL_CASE_REGEXP = /([A-Z])/g;

function camelCaseToDashCase(input: string): string {
  return input.replace(CAMEL_CASE_REGEXP, (...m: any[]) => '-' + m[1].toLowerCase());
}

export function checkBindingNoChanges(
    view: ViewData, def: NodeDef, bindingIdx: number, value: any) {
  const oldValue = view.oldValues[def.bindingIndex + bindingIdx];
  if (view.firstChange || !devModeEqual(oldValue, value)) {
    throw new ExpressionChangedAfterItHasBeenCheckedError(oldValue, value, view.firstChange);
  }
}

export function checkAndUpdateBinding(
    view: ViewData, def: NodeDef, bindingIdx: number, value: any): boolean {
  const oldValues = view.oldValues;
  if (view.firstChange || !looseIdentical(oldValues[def.bindingIndex + bindingIdx], value)) {
    oldValues[def.bindingIndex + bindingIdx] = value;
    return true;
  }
  return false;
}

export function checkAndUpdateBindingWithChange(
    view: ViewData, def: NodeDef, bindingIdx: number, value: any): SimpleChange {
  const oldValues = view.oldValues;
  const oldValue = oldValues[def.bindingIndex + bindingIdx];
  if (view.firstChange || !looseIdentical(oldValue, value)) {
    oldValues[def.bindingIndex + bindingIdx] = value;
    return new SimpleChange(oldValue, value, view.firstChange);
  }
  return null;
}

export function declaredViewContainer(view: ViewData): ElementData {
  if (view.parent) {
    const parentView = view.parent;
    return asElementData(parentView, view.parentIndex);
  }
  return undefined;
}

export function renderNode(view: ViewData, def: NodeDef): any {
  switch (def.type) {
    case NodeType.Element:
      return asElementData(view, def.index).renderElement;
    case NodeType.Text:
      return asTextData(view, def.index).renderText;
  }
}