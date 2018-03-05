/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChild, ContentChildren, Directive, HostBinding, HostListener, Injectable, Input, NgModule, OnDestroy, Optional, Pipe, PipeTransform, QueryList, SimpleChanges, TemplateRef, ViewChild, ViewChildren, ViewContainerRef} from '../../../src/core';
import * as $r3$ from '../../../src/core_render3_private_export';
import {renderComponent, toHtml} from '../render_util';

/// See: `normative.md`
describe('content projection', () => {
  type $boolean$ = boolean;

  it('should support content projection', () => {
    type $SimpleComponent$ = SimpleComponent;
    type $ComplexComponent$ = ComplexComponent;
    type $MyApp$ = MyApp;

    @Component({selector: 'simple', template: `<div><ng-content></ng-content></div>`})
    class SimpleComponent {
      // NORMATIVE
      static ngComponentDef = $r3$.ɵdefineComponent({
        type: SimpleComponent,
        tag: 'simple',
        factory: () => new SimpleComponent(),
        template: function(ctx: $SimpleComponent$, cm: $boolean$) {
          if (cm) {
            $r3$.ɵpD(0);
            $r3$.ɵE(1, 'div');
            $r3$.ɵP(2, 0);
            $r3$.ɵe();
          }
        }
      });
      // /NORMATIVE
    }

    // NORMATIVE
    const $pD_0$: $r3$.ɵCssSelector[] =
        [[[['span', 'title', 'toFirst'], null]], [[['span', 'title', 'toSecond'], null]]];
    // /NORMATIVE

    @Component({
      selector: 'complex',
      template: `
      <div id="first"><ng-content select="span[title=toFirst]"></ng-content></div>
      <div id="second"><ng-content select="span[title=toSecond]"></ng-content></div>`
    })
    class ComplexComponent {
      // NORMATIVE
      static ngComponentDef = $r3$.ɵdefineComponent({
        type: ComplexComponent,
        tag: 'complex',
        factory: () => new ComplexComponent(),
        template: function(ctx: $ComplexComponent$, cm: $boolean$) {
          if (cm) {
            $r3$.ɵpD(0, $pD_0$);
            $r3$.ɵE(1, 'div', ['id', 'first']);
            $r3$.ɵP(2, 0, 1);
            $r3$.ɵe();
            $r3$.ɵE(3, 'div', ['id', 'second']);
            $r3$.ɵP(4, 0, 2);
            $r3$.ɵe();
          }
        }
      });
      // /NORMATIVE
    }

    @Component({
      selector: 'my-app',
      template: `<simple>content</simple>
      <complex></complex>`
    })
    class MyApp {
      static ngComponentDef = $r3$.ɵdefineComponent({
        type: MyApp,
        tag: 'my-app',
        factory: () => new MyApp(),
        template: function(ctx: $MyApp$, cm: $boolean$) {
          if (cm) {
            $r3$.ɵE(0, SimpleComponent);
            $r3$.ɵT(2, 'content');
            $r3$.ɵe();
          }
        }
      });
    }
  });

});