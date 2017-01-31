/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {PipeTransform, RenderComponentType, RootRenderer, Sanitizer, SecurityContext, ViewEncapsulation} from '@angular/core';
import {DefaultServices, NodeDef, NodeFlags, Services, ViewData, ViewDefinition, ViewFlags, ViewHandleEventFn, ViewUpdateFn, anchorDef, asProviderData, checkAndUpdateView, checkNoChangesView, checkNodeDynamic, checkNodeInline, createRootView, elementDef, providerDef, pureArrayDef, pureObjectDef, purePipeDef, rootRenderNodes, setCurrentNode, textDef, viewDef} from '@angular/core/src/view/index';
import {inject} from '@angular/core/testing';

import {INLINE_DYNAMIC_VALUES, InlineDynamic, checkNodeInlineOrDynamic} from './helper';

export function main() {
  describe(`View Pure Expressions`, () => {
    let services: Services;
    let renderComponentType: RenderComponentType;

    beforeEach(
        inject([RootRenderer, Sanitizer], (rootRenderer: RootRenderer, sanitizer: Sanitizer) => {
          services = new DefaultServices(rootRenderer, sanitizer);
          renderComponentType =
              new RenderComponentType('1', 'someUrl', 0, ViewEncapsulation.None, [], {});
        }));

    function compViewDef(
        nodes: NodeDef[], update?: ViewUpdateFn, handleEvent?: ViewHandleEventFn): ViewDefinition {
      return viewDef(ViewFlags.None, nodes, update, handleEvent, renderComponentType);
    }

    function createAndGetRootNodes(viewDef: ViewDefinition): {rootNodes: any[], view: ViewData} {
      const view = createRootView(services, () => viewDef);
      const rootNodes = rootRenderNodes(view);
      return {rootNodes, view};
    }

    class Service {
      data: any;
    }

    INLINE_DYNAMIC_VALUES.forEach((inlineDynamic) => {
      it(`should support pure arrays in ${InlineDynamic[inlineDynamic]} bindings`, () => {
        let values: any[];

        const {view, rootNodes} = createAndGetRootNodes(compViewDef(
            [
              elementDef(NodeFlags.None, null, 2, 'span'), pureArrayDef(2),
              providerDef(NodeFlags.None, null, 0, Service, [], {data: [0, 'data']})
            ],
            (view) => {
              setCurrentNode(view, 1);
              const pureValue = checkNodeInlineOrDynamic(inlineDynamic, values);
              setCurrentNode(view, 2);
              checkNodeInlineOrDynamic(inlineDynamic, [pureValue]);
            }));
        const service = asProviderData(view, 2).instance;

        values = [1, 2];
        checkAndUpdateView(view);
        const arr0 = service.data;
        expect(arr0).toEqual([1, 2]);

        // instance should not change
        // if the values don't change
        checkAndUpdateView(view);
        expect(service.data).toBe(arr0);

        values = [3, 2];
        checkAndUpdateView(view);
        const arr1 = service.data;
        expect(arr1).not.toBe(arr0);
        expect(arr1).toEqual([3, 2]);
      });
    });

    INLINE_DYNAMIC_VALUES.forEach((inlineDynamic) => {
      it(`should support pure objects in ${InlineDynamic[inlineDynamic]} bindings`, () => {
        let values: any[];

        const {view, rootNodes} = createAndGetRootNodes(compViewDef(
            [
              elementDef(NodeFlags.None, null, 2, 'span'), pureObjectDef(['a', 'b']),
              providerDef(NodeFlags.None, null, 0, Service, [], {data: [0, 'data']})
            ],
            (view) => {
              setCurrentNode(view, 1);
              const pureValue = checkNodeInlineOrDynamic(inlineDynamic, values);
              setCurrentNode(view, 2);
              checkNodeInlineOrDynamic(inlineDynamic, [pureValue]);
            }));
        const service = asProviderData(view, 2).instance;

        values = [1, 2];
        checkAndUpdateView(view);
        const obj0 = service.data;
        expect(obj0).toEqual({a: 1, b: 2});

        // instance should not change
        // if the values don't change
        checkAndUpdateView(view);
        expect(service.data).toBe(obj0);

        values = [3, 2];
        checkAndUpdateView(view);
        const obj1 = service.data;
        expect(obj1).not.toBe(obj0);
        expect(obj1).toEqual({a: 3, b: 2});
      });
    });

    INLINE_DYNAMIC_VALUES.forEach((inlineDynamic) => {
      it(`should support pure pipes in ${InlineDynamic[inlineDynamic]} bindings`, () => {
        class SomePipe implements PipeTransform {
          transform(v1: any, v2: any) { return [v1 + 10, v2 + 20]; }
        }

        let values: any[];

        const {view, rootNodes} = createAndGetRootNodes(compViewDef(
            [
              elementDef(NodeFlags.None, null, 3, 'span'),
              providerDef(NodeFlags.None, null, 0, SomePipe, []), purePipeDef(SomePipe, 2),
              providerDef(NodeFlags.None, null, 0, Service, [], {data: [0, 'data']})
            ],
            (view) => {
              setCurrentNode(view, 2);
              const pureValue = checkNodeInlineOrDynamic(inlineDynamic, values);
              setCurrentNode(view, 3);
              checkNodeInlineOrDynamic(inlineDynamic, [pureValue]);
            }));
        const service = asProviderData(view, 3).instance;

        values = [1, 2];
        checkAndUpdateView(view);
        const obj0 = service.data;
        expect(obj0).toEqual([11, 22]);

        // instance should not change
        // if the values don't change
        checkAndUpdateView(view);
        expect(service.data).toBe(obj0);

        values = [3, 2];
        checkAndUpdateView(view);
        const obj1 = service.data;
        expect(obj1).not.toBe(obj0);
        expect(obj1).toEqual([13, 22]);
      });
    });
  });
}
