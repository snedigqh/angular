/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {RenderComponentType, RootRenderer, Sanitizer, SecurityContext, ViewEncapsulation, getDebugNode} from '@angular/core';
import {DebugContext, DefaultServices, NodeDef, NodeFlags, Services, ViewData, ViewDefinition, ViewFlags, ViewHandleEventFn, ViewUpdateFn, anchorDef, asElementData, checkAndUpdateView, checkNoChangesView, checkNodeDynamic, checkNodeInline, createRootView, elementDef, rootRenderNodes, setCurrentNode, textDef, viewDef} from '@angular/core/src/view/index';
import {inject} from '@angular/core/testing';
import {getDOM} from '@angular/platform-browser/src/dom/dom_adapter';

import {isBrowser, setupAndCheckRenderer} from './helper';

export function main() {
  if (isBrowser()) {
    defineTests({directDom: true, viewFlags: ViewFlags.DirectDom});
  }
  defineTests({directDom: false, viewFlags: 0});
}

function defineTests(config: {directDom: boolean, viewFlags: number}) {
  describe(`View Anchor, directDom: ${config.directDom}`, () => {
    setupAndCheckRenderer(config);

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
      return viewDef(config.viewFlags, nodes, update, handleEvent, renderComponentType);
    }

    function createAndGetRootNodes(
        viewDef: ViewDefinition, ctx?: any): {rootNodes: any[], view: ViewData} {
      const view = createRootView(services, () => viewDef, ctx);
      const rootNodes = rootRenderNodes(view);
      return {rootNodes, view};
    }

    describe('create', () => {
      it('should create anchor nodes without parents', () => {
        const rootNodes =
            createAndGetRootNodes(compViewDef([anchorDef(NodeFlags.None, null, 0)])).rootNodes;
        expect(rootNodes.length).toBe(1);
      });

      it('should create views with multiple root anchor nodes', () => {
        const rootNodes = createAndGetRootNodes(compViewDef([
                            anchorDef(NodeFlags.None, null, 0), anchorDef(NodeFlags.None, null, 0)
                          ])).rootNodes;
        expect(rootNodes.length).toBe(2);
      });

      it('should create anchor nodes with parents', () => {
        const rootNodes = createAndGetRootNodes(compViewDef([
                            elementDef(NodeFlags.None, null, 1, 'div'),
                            anchorDef(NodeFlags.None, null, 0),
                          ])).rootNodes;
        expect(getDOM().childNodes(rootNodes[0]).length).toBe(1);
      });

      if (!config.directDom) {
        it('should add debug information to the renderer', () => {
          const someContext = new Object();
          const {view, rootNodes} =
              createAndGetRootNodes(compViewDef([anchorDef(NodeFlags.None, null, 0)]), someContext);
          expect(getDebugNode(rootNodes[0]).nativeNode).toBe(asElementData(view, 0).renderElement);
        });
      }
    });
  });
}
