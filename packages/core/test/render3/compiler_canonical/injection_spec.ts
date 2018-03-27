/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Attribute, ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChild, ContentChildren, Directive, HostBinding, HostListener, INJECTOR, Inject, InjectFlags, Injectable, InjectableDef, Injector, InjectorDef, Input, NgModule, OnDestroy, Optional, Pipe, PipeTransform, QueryList, SimpleChanges, SkipSelf, TemplateRef, ViewChild, ViewChildren, ViewContainerRef, defineInjectable, defineInjector, inject} from '../../../src/core';
import * as $r3$ from '../../../src/core_render3_private_export';
import {renderComponent, toHtml} from '../render_util';



/// See: `normative.md`
describe('injection', () => {
  type $boolean$ = boolean;

  describe('directives', () => {
    // Directives (and Components) should use `directiveInject`
    it('should inject ChangeDetectorRef', () => {
      type $MyComp$ = MyComp;
      type $MyApp$ = MyApp;

      @Component({selector: 'my-comp', template: `{{ value }}`})
      class MyComp {
        value: string;
        constructor(public cdr: ChangeDetectorRef) { this.value = (cdr.constructor as any).name; }

        // NORMATIVE
        static ngComponentDef = $r3$.ɵdefineComponent({
          type: MyComp,
          selector: [[['my-comp'], null]],
          factory: function MyComp_Factory() {
            return new MyComp($r3$.ɵinjectChangeDetectorRef());
          },
          template: function MyComp_Template(ctx: $MyComp$, cm: $boolean$) {
            if (cm) {
              $r3$.ɵT(0);
            }
            $r3$.ɵt(0, $r3$.ɵb(ctx.value));
          }
        });
        // /NORMATIVE
      }

      class MyApp {
        static ngComponentDef = $r3$.ɵdefineComponent({
          type: MyApp,
          selector: [[['my-app'], null]],
          factory: function MyApp_Factory() { return new MyApp(); },
          /** <my-comp></my-comp> */
          template: function MyApp_Template(ctx: $MyApp$, cm: $boolean$) {
            if (cm) {
              $r3$.ɵE(0, 'my-comp');
              $r3$.ɵe();
            }
          },
          directiveDefs: () => [MyComp.ngComponentDef]
        });
      }


      const app = renderComponent(MyApp);
      // ChangeDetectorRef is the token, ViewRef is historically the constructor
      expect(toHtml(app)).toEqual('<my-comp>ViewRef</my-comp>');
    });

    it('should inject attributes', () => {
      type $MyComp$ = MyComp;
      type $MyApp$ = MyApp;

      @Component({selector: 'my-comp', template: `{{ title }}`})
      class MyComp {
        constructor(@Attribute('title') public title: string|undefined) {}

        // NORMATIVE
        static ngComponentDef = $r3$.ɵdefineComponent({
          type: MyComp,
          selector: [[['my-comp'], null]],
          factory: function MyComp_Factory() { return new MyComp($r3$.ɵinjectAttribute('title')); },
          template: function MyComp_Template(ctx: $MyComp$, cm: $boolean$) {
            if (cm) {
              $r3$.ɵT(0);
            }
            $r3$.ɵt(0, $r3$.ɵb(ctx.title));
          }
        });
        // /NORMATIVE
      }

      class MyApp {
        static ngComponentDef = $r3$.ɵdefineComponent({
          type: MyApp,
          selector: [[['my-app'], null]],
          factory: function MyApp_Factory() { return new MyApp(); },
          /** <my-comp></my-comp> */
          template: function MyApp_Template(ctx: $MyApp$, cm: $boolean$) {
            if (cm) {
              $r3$.ɵE(0, 'my-comp', e0_attrs);
              $r3$.ɵe();
            }
          },
          directiveDefs: () => [MyComp.ngComponentDef]
        });
      }
      const e0_attrs = ['title', 'WORKS'];
      const app = renderComponent(MyApp);
      // ChangeDetectorRef is the token, ViewRef is historically the constructor
      expect(toHtml(app)).toEqual('<my-comp title="WORKS">WORKS</my-comp>');
    });

    // TODO(misko): enable once `providers` and `viewProvdires` are implemented.
    xit('should inject into an injectable', () => {
      type $MyApp$ = MyApp;

      @Injectable()
      class ServiceA {
        // NORMATIVE
        static ngInjectableDef = defineInjectable({
          factory: function ServiceA_Factory() { return new ServiceA(); },
        });
        // /NORMATIVE
      }

      @Injectable()
      class ServiceB {
        // NORMATIVE
        static ngInjectableDef = defineInjectable({
          factory: function ServiceA_Factory() { return new ServiceB(); },
        });
        // /NORMATIVE
      }

      @Component({
        template: '',
        providers: [ServiceA],
        viewProviders: [ServiceB],
      })
      class MyApp {
        constructor(serviceA: ServiceA, serviceB: ServiceB, injector: Injector) {}

        static ngComponentDef = $r3$.ɵdefineComponent({
          type: MyApp,
          selector: [[['my-app'], null]],
          factory: function MyApp_Factory() {
            return new MyApp(
                $r3$.ɵdirectiveInject(ServiceA), $r3$.ɵdirectiveInject(ServiceB), inject(INJECTOR));
          },
          /**  */
          template: function MyApp_Template(ctx: $MyApp$, cm: $boolean$) {},
          providers: [ServiceA],
          viewProviders: [ServiceB],
        });
      }
      const e0_attrs = ['title', 'WORKS'];
      const app = renderComponent(MyApp);
      // ChangeDetectorRef is the token, ViewRef is historically the constructor
      expect(toHtml(app)).toEqual('<my-comp title="WORKS">WORKS</my-comp>');
    });
  });

  describe('services', () => {
    // Services should use `inject`
    @Injectable()
    class ServiceA {
      constructor(@Inject(String) name: String, injector: Injector) {}

      // NORMATIVE
      static ngInjectableDef = defineInjectable({
        factory: function ServiceA_Factory() {
          return new ServiceA(inject(String), inject(INJECTOR));
        },
      });
      // /NORMATIVE
    }

    @Injectable()
    class ServiceB {
      constructor(serviceA: ServiceA, @SkipSelf() injector: Injector) {}
      // NORMATIVE
      static ngInjectableDef = defineInjectable({
        factory: function ServiceA_Factory() {
          return new ServiceB(inject(ServiceA), inject(INJECTOR, undefined, InjectFlags.SkipSelf));
        },
      });
      // /NORMATIVE
    }

  });

});