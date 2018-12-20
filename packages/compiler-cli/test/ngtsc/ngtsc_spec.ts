/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgtscTestEnvironment} from './env';

const trim = (input: string): string => input.replace(/\s+/g, ' ').trim();

describe('ngtsc behavioral tests', () => {
  if (!NgtscTestEnvironment.supported) {
    // These tests should be excluded from the non-Bazel build.
    return;
  }

  let env !: NgtscTestEnvironment;

  beforeEach(() => { env = NgtscTestEnvironment.setup(); });

  it('should compile Injectables without errors', () => {
    env.tsconfig();
    env.write('test.ts', `
        import {Injectable} from '@angular/core';

        @Injectable()
        export class Dep {}

        @Injectable()
        export class Service {
          constructor(dep: Dep) {}
        }
    `);

    env.driveMain();


    const jsContents = env.getContents('test.js');
    expect(jsContents).toContain('Dep.ngInjectableDef =');
    expect(jsContents).toContain('Service.ngInjectableDef =');
    expect(jsContents).not.toContain('__decorate');
    const dtsContents = env.getContents('test.d.ts');
    expect(dtsContents).toContain('static ngInjectableDef: i0.ɵInjectableDef<Dep>;');
    expect(dtsContents).toContain('static ngInjectableDef: i0.ɵInjectableDef<Service>;');
  });

  it('should compile Injectables with a generic service', () => {
    env.tsconfig();
    env.write('test.ts', `
        import {Injectable} from '@angular/core';

        @Injectable()
        export class Store<T> {}
    `);

    env.driveMain();


    const jsContents = env.getContents('test.js');
    expect(jsContents).toContain('Store.ngInjectableDef =');
    const dtsContents = env.getContents('test.d.ts');
    expect(dtsContents).toContain('static ngInjectableDef: i0.ɵInjectableDef<Store<any>>;');
  });

  it('should compile Components without errors', () => {
    env.tsconfig();
    env.write('test.ts', `
        import {Component} from '@angular/core';

        @Component({
          selector: 'test-cmp',
          template: 'this is a test',
        })
        export class TestCmp {}
    `);

    env.driveMain();

    const jsContents = env.getContents('test.js');
    expect(jsContents).toContain('TestCmp.ngComponentDef = i0.ɵdefineComponent');
    expect(jsContents).not.toContain('__decorate');

    const dtsContents = env.getContents('test.d.ts');
    expect(dtsContents)
        .toContain(
            'static ngComponentDef: i0.ɵComponentDefWithMeta<TestCmp, \'test-cmp\', never, {}, {}, never>');
  });

  it('should compile Components without errors', () => {
    env.tsconfig();
    env.write('test.ts', `
        import {Component} from '@angular/core';

        @Component({
          selector: 'test-cmp',
          templateUrl: './dir/test.html',
        })
        export class TestCmp {}
    `);
    env.write('dir/test.html', '<p>Hello World</p>');

    env.driveMain();

    const jsContents = env.getContents('test.js');
    expect(jsContents).toContain('Hello World');
  });

  it('should compile Components with a templateUrl in a different rootDir', () => {
    env.tsconfig({}, ['./extraRootDir']);
    env.write('extraRootDir/test.html', '<p>Hello World</p>');
    env.write('test.ts', `
        import {Component} from '@angular/core';

        @Component({
          selector: 'test-cmp',
          templateUrl: 'test.html',
        })
        export class TestCmp {}
    `);

    env.driveMain();

    const jsContents = env.getContents('test.js');
    expect(jsContents).toContain('Hello World');
  });

  it('should compile components with styleUrls', () => {
    env.tsconfig();
    env.write('test.ts', `
        import {Component} from '@angular/core';

        @Component({
          selector: 'test-cmp',
          styleUrls: ['./dir/style.css'],
          template: '',
        })
        export class TestCmp {}
    `);
    env.write('dir/style.css', ':host { background-color: blue; }');

    env.driveMain();

    const jsContents = env.getContents('test.js');
    expect(jsContents).toContain('background-color: blue');
  });

  it('should compile NgModules without errors', () => {
    env.tsconfig();
    env.write('test.ts', `
        import {Component, NgModule} from '@angular/core';

        @Component({
          selector: 'test-cmp',
          template: 'this is a test',
        })
        export class TestCmp {}

        @NgModule({
          declarations: [TestCmp],
          bootstrap: [TestCmp],
        })
        export class TestModule {}
    `);

    env.driveMain();

    const jsContents = env.getContents('test.js');
    expect(jsContents)
        .toContain(
            'i0.ɵdefineNgModule({ type: TestModule, bootstrap: [TestCmp], ' +
            'declarations: [TestCmp], imports: [], exports: [] })');

    const dtsContents = env.getContents('test.d.ts');
    expect(dtsContents)
        .toContain(
            'static ngComponentDef: i0.ɵComponentDefWithMeta<TestCmp, \'test-cmp\', never, {}, {}, never>');
    expect(dtsContents)
        .toContain(
            'static ngModuleDef: i0.ɵNgModuleDefWithMeta<TestModule, [typeof TestCmp], never, never>');
    expect(dtsContents).not.toContain('__decorate');
  });

  it('should compile NgModules with services without errors', () => {
    env.tsconfig();
    env.write('test.ts', `
        import {Component, NgModule} from '@angular/core';

        export class Token {}

        @NgModule({})
        export class OtherModule {}

        @Component({
          selector: 'test-cmp',
          template: 'this is a test',
        })
        export class TestCmp {}

        @NgModule({
          declarations: [TestCmp],
          providers: [{provide: Token, useValue: 'test'}],
          imports: [OtherModule],
        })
        export class TestModule {}
    `);

    env.driveMain();

    const jsContents = env.getContents('test.js');
    expect(jsContents).toContain('i0.ɵdefineNgModule({ type: TestModule,');
    expect(jsContents)
        .toContain(
            `TestModule.ngInjectorDef = i0.defineInjector({ factory: ` +
            `function TestModule_Factory(t) { return new (t || TestModule)(); }, providers: [{ provide: ` +
            `Token, useValue: 'test' }], imports: [[OtherModule]] });`);

    const dtsContents = env.getContents('test.d.ts');
    expect(dtsContents)
        .toContain(
            'static ngModuleDef: i0.ɵNgModuleDefWithMeta<TestModule, [typeof TestCmp], [typeof OtherModule], never>');
    expect(dtsContents).toContain('static ngInjectorDef: i0.ɵInjectorDef');
  });

  it('should compile NgModules with references to local components', () => {
    env.tsconfig();
    env.write('test.ts', `
      import {NgModule} from '@angular/core';
      import {Foo} from './foo';

      @NgModule({
        declarations: [Foo],
      })
      export class FooModule {}
    `);
    env.write('foo.ts', `
      import {Component} from '@angular/core';
      @Component({selector: 'foo', template: ''})
      export class Foo {}
    `);

    env.driveMain();

    const jsContents = env.getContents('test.js');
    const dtsContents = env.getContents('test.d.ts');

    expect(jsContents).toContain('import { Foo } from \'./foo\';');
    expect(jsContents).not.toMatch(/as i[0-9] from '.\/foo'/);
    expect(dtsContents).toContain('as i1 from \'./foo\';');
  });

  it('should compile NgModules with references to absolute components', () => {
    env.tsconfig();
    env.write('test.ts', `
      import {NgModule} from '@angular/core';
      import {Foo} from 'foo';

      @NgModule({
        declarations: [Foo],
      })
      export class FooModule {}
    `);
    env.write('node_modules/foo/index.d.ts', `
      import * as i0 from '@angular/core';
      export class Foo {
        static ngComponentDef: i0.ɵComponentDef<Foo, 'foo'>;
      }
    `);

    env.driveMain();

    const jsContents = env.getContents('test.js');
    const dtsContents = env.getContents('test.d.ts');

    expect(jsContents).toContain('import { Foo } from \'foo\';');
    expect(jsContents).not.toMatch(/as i[0-9] from 'foo'/);
    expect(dtsContents).toContain('as i1 from \'foo\';');
  });

  it('should compile Pipes without errors', () => {
    env.tsconfig();
    env.write('test.ts', `
        import {Pipe} from '@angular/core';

        @Pipe({
          name: 'test-pipe',
          pure: false,
        })
        export class TestPipe {}
    `);

    env.driveMain();

    const jsContents = env.getContents('test.js');
    const dtsContents = env.getContents('test.d.ts');

    expect(jsContents)
        .toContain(
            'TestPipe.ngPipeDef = i0.ɵdefinePipe({ name: "test-pipe", type: TestPipe, ' +
            'factory: function TestPipe_Factory(t) { return new (t || TestPipe)(); }, pure: false })');
    expect(dtsContents)
        .toContain('static ngPipeDef: i0.ɵPipeDefWithMeta<TestPipe, \'test-pipe\'>;');
  });

  it('should compile pure Pipes without errors', () => {
    env.tsconfig();
    env.write('test.ts', `
        import {Pipe} from '@angular/core';

        @Pipe({
          name: 'test-pipe',
        })
        export class TestPipe {}
    `);

    env.driveMain();

    const jsContents = env.getContents('test.js');
    const dtsContents = env.getContents('test.d.ts');

    expect(jsContents)
        .toContain(
            'TestPipe.ngPipeDef = i0.ɵdefinePipe({ name: "test-pipe", type: TestPipe, ' +
            'factory: function TestPipe_Factory(t) { return new (t || TestPipe)(); }, pure: true })');
    expect(dtsContents)
        .toContain('static ngPipeDef: i0.ɵPipeDefWithMeta<TestPipe, \'test-pipe\'>;');
  });

  it('should compile Pipes with dependencies', () => {
    env.tsconfig();
    env.write('test.ts', `
        import {Pipe} from '@angular/core';

        export class Dep {}

        @Pipe({
          name: 'test-pipe',
          pure: false,
        })
        export class TestPipe {
          constructor(dep: Dep) {}
        }
    `);

    env.driveMain();

    const jsContents = env.getContents('test.js');
    expect(jsContents).toContain('return new (t || TestPipe)(i0.ɵdirectiveInject(Dep));');
  });

  it('should include @Pipes in @NgModule scopes', () => {
    env.tsconfig();
    env.write('test.ts', `
        import {Component, NgModule, Pipe} from '@angular/core';

        @Pipe({name: 'test'})
        export class TestPipe {}

        @Component({selector: 'test-cmp', template: '{{value | test}}'})
        export class TestCmp {}

        @NgModule({declarations: [TestPipe, TestCmp]})
        export class TestModule {}
    `);

    env.driveMain();

    const jsContents = env.getContents('test.js');
    expect(jsContents).toContain('pipes: [TestPipe]');

    const dtsContents = env.getContents('test.d.ts');
    expect(dtsContents)
        .toContain(
            'i0.ɵNgModuleDefWithMeta<TestModule, [typeof TestPipe, typeof TestCmp], never, never>');
  });

  describe('unwrapping ModuleWithProviders functions', () => {
    it('should extract the generic type and include it in the module\'s declaration', () => {
      env.tsconfig();
      env.write(`test.ts`, `
        import {NgModule} from '@angular/core';
        import {RouterModule} from 'router';

        @NgModule({imports: [RouterModule.forRoot()]})
        export class TestModule {}
    `);

      env.write('node_modules/router/index.d.ts', `
        import {ModuleWithProviders} from '@angular/core';

        declare class RouterModule {
          static forRoot(): ModuleWithProviders<RouterModule>;
        }
    `);

      env.driveMain();

      const jsContents = env.getContents('test.js');
      expect(jsContents).toContain('imports: [[RouterModule.forRoot()]]');

      const dtsContents = env.getContents('test.d.ts');
      expect(dtsContents).toContain(`import * as i1 from 'router';`);
      expect(dtsContents)
          .toContain('i0.ɵNgModuleDefWithMeta<TestModule, never, [typeof i1.RouterModule], never>');
    });

    it('should extract the generic type if it is provided as qualified type name', () => {
      env.tsconfig();
      env.write(`test.ts`, `
        import {NgModule} from '@angular/core';
        import {RouterModule} from 'router';

        @NgModule({imports: [RouterModule.forRoot()]})
        export class TestModule {}
    `);

      env.write('node_modules/router/index.d.ts', `
        import {ModuleWithProviders} from '@angular/core';
        import * as internal from './internal';

        declare class RouterModule {
          static forRoot(): ModuleWithProviders<internal.InternalRouterModule>;
        }
    `);

      env.write('node_modules/router/internal.d.ts', `
        export declare class InternalRouterModule {}
    `);

      env.driveMain();

      const jsContents = env.getContents('test.js');
      expect(jsContents).toContain('imports: [[RouterModule.forRoot()]]');

      const dtsContents = env.getContents('test.d.ts');
      expect(dtsContents).toContain(`import * as i1 from 'router';`);
      expect(dtsContents)
          .toContain(
              'i0.ɵNgModuleDefWithMeta<TestModule, never, [typeof i1.InternalRouterModule], never>');
    });
  });

  it('should unwrap a ModuleWithProviders-like function if a matching literal type is provided for it',
     () => {
       env.tsconfig();
       env.write(`test.ts`, `
        import {NgModule} from '@angular/core';
        import {RouterModule} from 'router';

        @NgModule({imports: [RouterModule.forRoot()]})
        export class TestModule {}
    `);

       env.write('node_modules/router/index.d.ts', `
        import {ModuleWithProviders} from '@angular/core';

        export interface MyType extends ModuleWithProviders {}

        declare class RouterModule {
          static forRoot(): (MyType)&{ngModule:RouterModule};
        }
    `);

       env.driveMain();

       const jsContents = env.getContents('test.js');
       expect(jsContents).toContain('imports: [[RouterModule.forRoot()]]');

       const dtsContents = env.getContents('test.d.ts');
       expect(dtsContents).toContain(`import * as i1 from 'router';`);
       expect(dtsContents)
           .toContain(
               'i0.ɵNgModuleDefWithMeta<TestModule, never, [typeof i1.RouterModule], never>');
     });

  it('should inject special types according to the metadata', () => {
    env.tsconfig();
    env.write(`test.ts`, `
        import {
          Attribute,
          ChangeDetectorRef,
          Component,
          ElementRef,
          Injector,
          Renderer2,
          TemplateRef,
          ViewContainerRef,
        } from '@angular/core';

        @Component({
          selector: 'test',
          template: 'Test',
        })
        class FooCmp {
          constructor(
            @Attribute("test") attr: string,
            cdr: ChangeDetectorRef,
            er: ElementRef,
            i: Injector,
            r2: Renderer2,
            tr: TemplateRef,
            vcr: ViewContainerRef,
          ) {}
        }
    `);

    env.driveMain();
    const jsContents = env.getContents('test.js');
    expect(jsContents)
        .toContain(
            `factory: function FooCmp_Factory(t) { return new (t || FooCmp)(i0.ɵinjectAttribute("test"), i0.ɵdirectiveInject(ChangeDetectorRef), i0.ɵdirectiveInject(ElementRef), i0.ɵdirectiveInject(Injector), i0.ɵdirectiveInject(Renderer2), i0.ɵdirectiveInject(TemplateRef), i0.ɵdirectiveInject(ViewContainerRef)); }`);
  });

  it('should generate queries for components', () => {

    // Helper functions to construct RegExps for output validation
    const varRegExp = (name: string): RegExp => new RegExp(`var \\w+ = \\[\"${name}\"\\];`);
    const queryRegExp = (id: number | null, descend: boolean, ref?: string): RegExp => {
      const maybeRef = ref ? `, ${ref}` : ``;
      return new RegExp(`i0\\.ɵquery\\(${id}, \\w+, ${descend}${maybeRef}\\)`);
    };

    env.tsconfig();
    env.write(`test.ts`, `
        import {Component, ContentChild, ContentChildren, TemplateRef, ViewChild} from '@angular/core';

        @Component({
          selector: 'test',
          template: '<div #foo></div>',
          queries: {
            'mview': new ViewChild('test1'),
            'mcontent': new ContentChild('test2'),
          }
        })
        class FooCmp {
          @ContentChild('bar', {read: TemplateRef}) child: any;
          @ContentChildren(TemplateRef) children: any;
          get aview(): any { return null; }
          @ViewChild('accessor') set aview(value: any) {}
        }
    `);

    env.driveMain();
    const jsContents = env.getContents('test.js');
    expect(jsContents).toMatch(varRegExp('bar'));
    expect(jsContents).toMatch(varRegExp('test1'));
    expect(jsContents).toMatch(varRegExp('test2'));
    expect(jsContents).toMatch(varRegExp('accessor'));
    expect(jsContents).toContain(`i0.ɵquery(null, TemplateRef, false)`);
    expect(jsContents)
        .toMatch(queryRegExp(
            null, true, 'TemplateRef'));  // match `i0.ɵquery(null, _c0, true, TemplateRef)`
    expect(jsContents).toMatch(queryRegExp(null, true));  // match `i0.ɵquery(null, _c0, true)`
    expect(jsContents).toMatch(queryRegExp(0, true));     // match `i0.ɵquery(0, _c0, true)`
    expect(jsContents).toMatch(queryRegExp(1, true));     // match `i0.ɵquery(1, _c0, true)`
  });

  it('should handle queries that use forwardRef', () => {
    env.tsconfig();
    env.write(`test.ts`, `
        import {Component, ContentChild, TemplateRef, ViewContainerRef, forwardRef} from '@angular/core';

        @Component({
          selector: 'test',
          template: '<div #foo></div>',
        })
        class FooCmp {
          @ContentChild(forwardRef(() => TemplateRef)) child: any;

          @ContentChild(forwardRef(function() { return ViewContainerRef; })) child2: any;
        }
    `);

    env.driveMain();
    const jsContents = env.getContents('test.js');
    expect(jsContents).toContain(`i0.ɵquery(null, TemplateRef, true)`);
    expect(jsContents).toContain(`i0.ɵquery(null, ViewContainerRef, true)`);
  });

  it('should generate host listeners for components', () => {
    env.tsconfig();
    env.write(`test.ts`, `
        import {Component, HostListener} from '@angular/core';

        @Component({
          selector: 'test',
          template: 'Test'
        })
        class FooCmp {
          @HostListener('document:click', ['$event.target'])
          onClick(eventTarget: HTMLElement): void {}

          @HostListener('window:scroll')
          onScroll(event: any): void {}
        }
    `);

    env.driveMain();
    const jsContents = env.getContents('test.js');
    const hostBindingsFn = `
      hostBindings: function FooCmp_HostBindings(rf, ctx, elIndex) {
        if (rf & 1) {
          i0.ɵlistener("click", function FooCmp_click_HostBindingHandler($event) { return ctx.onClick($event.target); });
          i0.ɵlistener("scroll", function FooCmp_scroll_HostBindingHandler($event) { return ctx.onScroll(); });
        }
      }
    `;
    expect(trim(jsContents)).toContain(trim(hostBindingsFn));
  });

  it('should generate host bindings for directives', () => {
    env.tsconfig();
    env.write(`test.ts`, `
        import {Component, HostBinding, HostListener, TemplateRef} from '@angular/core';

        @Component({
          selector: 'test',
          template: 'Test',
          host: {
            '[attr.hello]': 'foo',
            '(click)': 'onClick($event)',
            '[prop]': 'bar',
          },
        })
        class FooCmp {
          onClick(event: any): void {}

          @HostBinding('class.someclass')
          get someClass(): boolean { return false; }

          @HostListener('change', ['arg1', 'arg2', 'arg3'])
          onChange(event: any, arg: any): void {}
        }
    `);

    env.driveMain();
    const jsContents = env.getContents('test.js');
    const hostBindingsFn = `
      hostBindings: function FooCmp_HostBindings(rf, ctx, elIndex) {
        if (rf & 1) {
          i0.ɵallocHostVars(2);
          i0.ɵlistener("click", function FooCmp_click_HostBindingHandler($event) { return ctx.onClick($event); });
          i0.ɵlistener("change", function FooCmp_change_HostBindingHandler($event) { return ctx.onChange(ctx.arg1, ctx.arg2, ctx.arg3); });
          i0.ɵelementStyling(_c0, null, null, ctx);
        }
        if (rf & 2) {
          i0.ɵelementAttribute(elIndex, "hello", i0.ɵbind(ctx.foo));
          i0.ɵelementProperty(elIndex, "prop", i0.ɵbind(ctx.bar), null, true);
          i0.ɵelementClassProp(elIndex, 0, ctx.someClass, ctx);
          i0.ɵelementStylingApply(elIndex, ctx);
        }
      }
    `;
    expect(trim(jsContents)).toContain(trim(hostBindingsFn));
  });

  it('should generate host listeners for directives within hostBindings section', () => {
    env.tsconfig();
    env.write(`test.ts`, `
        import {Directive, HostListener} from '@angular/core';

        @Directive({
          selector: '[test]',
        })
        class Dir {
          @HostListener('change', ['arg'])
          onChange(event: any, arg: any): void {}
        }
    `);

    env.driveMain();
    const jsContents = env.getContents('test.js');
    const hostBindingsFn = `
      hostBindings: function Dir_HostBindings(rf, ctx, elIndex) {
        if (rf & 1) {
          i0.ɵlistener("change", function Dir_change_HostBindingHandler($event) { return ctx.onChange(ctx.arg); });
        }
      }
    `;
    expect(trim(jsContents)).toContain(trim(hostBindingsFn));
  });

  it('should use proper default value for preserveWhitespaces config param', () => {
    env.tsconfig();  // default is `false`
    env.write(`test.ts`, `
      import {Component} from '@angular/core';
       @Component({
        selector: 'test',
        preserveWhitespaces: false,
        template: \`
          <div>
            Template with whitespaces
          </div>
        \`
      })
      class FooCmp {}
    `);
    env.driveMain();
    const jsContents = env.getContents('test.js');
    expect(jsContents).toContain('text(1, " Template with whitespaces ");');
  });

  it('should take preserveWhitespaces config option into account', () => {
    env.tsconfig({preserveWhitespaces: true});
    env.write(`test.ts`, `
      import {Component} from '@angular/core';
       @Component({
        selector: 'test',
        template: \`
          <div>
            Template with whitespaces
          </div>
        \`
      })
      class FooCmp {}
    `);
    env.driveMain();
    const jsContents = env.getContents('test.js');
    expect(jsContents)
        .toContain('text(2, "\\n            Template with whitespaces\\n          ");');
  });

  it('@Component\'s preserveWhitespaces should override the one defined in config', () => {
    env.tsconfig({preserveWhitespaces: true});
    env.write(`test.ts`, `
      import {Component} from '@angular/core';
       @Component({
        selector: 'test',
        preserveWhitespaces: false,
        template: \`
          <div>
            Template with whitespaces
          </div>
        \`
      })
      class FooCmp {}
    `);
    env.driveMain();
    const jsContents = env.getContents('test.js');
    expect(jsContents).toContain('text(1, " Template with whitespaces ");');
  });

  it('should use proper default value for i18nUseExternalIds config param', () => {
    env.tsconfig();  // default is `true`
    env.write(`test.ts`, `
      import {Component} from '@angular/core';
       @Component({
        selector: 'test',
        template: '<div i18n>Some text</div>'
      })
      class FooCmp {}
    `);
    env.driveMain();
    const jsContents = env.getContents('test.js');
    expect(jsContents).toContain('i18n(1, MSG_EXTERNAL_8321000940098097247$$TEST_TS_0);');
  });

  it('should take i18nUseExternalIds config option into account', () => {
    env.tsconfig({i18nUseExternalIds: false});
    env.write(`test.ts`, `
      import {Component} from '@angular/core';
       @Component({
        selector: 'test',
        template: '<div i18n>Some text</div>'
      })
      class FooCmp {}
    `);
    env.driveMain();
    const jsContents = env.getContents('test.js');
    expect(jsContents).toContain('i18n(1, MSG_TEST_TS_0);');
  });

  it('@Component\'s `interpolation` should override default interpolation config', () => {
    env.tsconfig();
    env.write(`test.ts`, `
      import {Component} from '@angular/core';
      @Component({
        selector: 'cmp-with-custom-interpolation-a',
        template: \`<div>{%text%}</div>\`,
        interpolation: ['{%', '%}']
      })
      class ComponentWithCustomInterpolationA {
        text = 'Custom Interpolation A';
      }
    `);

    env.driveMain();
    const jsContents = env.getContents('test.js');
    expect(jsContents).toContain('interpolation1("", ctx.text, "")');
  });

  it('should correctly recognize local symbols', () => {
    env.tsconfig();
    env.write('module.ts', `
        import {NgModule} from '@angular/core';
        import {Dir, Comp} from './test';

        @NgModule({
          declarations: [Dir, Comp],
          exports: [Dir, Comp],
        })
        class Module {}
    `);
    env.write(`test.ts`, `
        import {Component, Directive} from '@angular/core';

        @Directive({
          selector: '[dir]',
        })
        export class Dir {}

        @Component({
          selector: 'test',
          template: '<div dir>Test</div>',
        })
        export class Comp {}
    `);

    env.driveMain();
    const jsContents = env.getContents('test.js');
    expect(jsContents).not.toMatch(/import \* as i[0-9] from ['"].\/test['"]/);
  });

  it('should generate exportAs declarations', () => {
    env.tsconfig();
    env.write('test.ts', `
        import {Component, Directive} from '@angular/core';

        @Directive({
          selector: '[test]',
          exportAs: 'foo',
        })
        class Dir {}
    `);

    env.driveMain();

    const jsContents = env.getContents('test.js');
    expect(jsContents).toContain(`exportAs: "foo"`);
  });

  it('should generate correct factory stubs for a test module', () => {
    env.tsconfig({'allowEmptyCodegenFiles': true});

    env.write('test.ts', `
        import {Injectable, NgModule} from '@angular/core';

        @Injectable()
        export class NotAModule {}

        @NgModule({})
        export class TestModule {}
    `);

    env.write('empty.ts', `
        import {Injectable} from '@angular/core';

        @Injectable()
        export class NotAModule {}
    `);

    env.driveMain();

    const factoryContents = env.getContents('test.ngfactory.js');
    expect(factoryContents).toContain(`import * as i0 from '@angular/core';`);
    expect(factoryContents).toContain(`import { NotAModule, TestModule } from './test';`);
    expect(factoryContents)
        .toContain(`export var TestModuleNgFactory = new i0.ɵNgModuleFactory(TestModule);`);
    expect(factoryContents).not.toContain(`NotAModuleNgFactory`);
    expect(factoryContents).not.toContain('ɵNonEmptyModule');

    const emptyFactory = env.getContents('empty.ngfactory.js');
    expect(emptyFactory).toContain(`import * as i0 from '@angular/core';`);
    expect(emptyFactory).toContain(`export var ɵNonEmptyModule = true;`);
  });

  it('should generate a summary stub for decorated classes in the input file only', () => {
    env.tsconfig({'allowEmptyCodegenFiles': true});

    env.write('test.ts', `
        import {Injectable, NgModule} from '@angular/core';

        export class NotAModule {}

        @NgModule({})
        export class TestModule {}
    `);

    env.driveMain();

    const summaryContents = env.getContents('test.ngsummary.js');
    expect(summaryContents).toEqual(`export var TestModuleNgSummary = null;\n`);
  });

  it('it should generate empty export when there are no other summary symbols, to ensure the output is a valid ES module',
     () => {
       env.tsconfig({'allowEmptyCodegenFiles': true});
       env.write('empty.ts', `
        export class NotAModule {}
    `);

       env.driveMain();

       const emptySummary = env.getContents('empty.ngsummary.js');
       // The empty export ensures this js file is still an ES module.
       expect(emptySummary).toEqual(`export var ɵempty = null;\n`);
     });

  it('should compile a banana-in-a-box inside of a template', () => {
    env.tsconfig();
    env.write('test.ts', `
        import {Component} from '@angular/core';

        @Component({
          template: '<div *tmpl [(bananaInABox)]="prop"></div>',
          selector: 'test'
        })
        class TestCmp {}
    `);

    env.driveMain();
  });

  it('generates inherited factory definitions', () => {
    env.tsconfig();
    env.write(`test.ts`, `
        import {Injectable} from '@angular/core';

        class Dep {}

        @Injectable()
        class Base {
          constructor(dep: Dep) {}
        }

        @Injectable()
        class Child extends Base {}

        @Injectable()
        class GrandChild extends Child {
          constructor() {
            super(null!);
          }
        }
    `);


    env.driveMain();
    const jsContents = env.getContents('test.js');

    expect(jsContents)
        .toContain('function Base_Factory(t) { return new (t || Base)(i0.inject(Dep)); }');
    expect(jsContents).toContain('var ɵChild_BaseFactory = i0.ɵgetInheritedFactory(Child)');
    expect(jsContents)
        .toContain('function Child_Factory(t) { return ɵChild_BaseFactory((t || Child)); }');
    expect(jsContents)
        .toContain('function GrandChild_Factory(t) { return new (t || GrandChild)(); }');
  });

  it('generates base factories for directives', () => {
    env.tsconfig();
    env.write(`test.ts`, `
        import {Directive} from '@angular/core';

        class Base {}

        @Directive({
          selector: '[test]',
        })
        class Dir extends Base {
        }
    `);


    env.driveMain();
    const jsContents = env.getContents('test.js');

    expect(jsContents).toContain('var ɵDir_BaseFactory = i0.ɵgetInheritedFactory(Dir)');
  });

  it('should wrap "directives" in component metadata in a closure when forward references are present',
     () => {
       env.tsconfig();
       env.write('test.ts', `
        import {Component, NgModule} from '@angular/core';

        @Component({
          selector: 'cmp-a',
          template: '<cmp-b></cmp-b>',
        })
        class CmpA {}

        @Component({
          selector: 'cmp-b',
          template: 'This is B',
        })
        class CmpB {}

        @NgModule({
          declarations: [CmpA, CmpB],
        })
        class Module {}
    `);

       env.driveMain();

       const jsContents = env.getContents('test.js');
       expect(jsContents).toContain('directives: function () { return [CmpB]; }');
     });

  it('should emit setClassMetadata calls for all types', () => {
    env.tsconfig();
    env.write('test.ts', `
      import {Component, Directive, Injectable, NgModule, Pipe} from '@angular/core';

      @Component({selector: 'cmp', template: 'I am a component!'}) class TestComponent {}
      @Directive({selector: 'dir'}) class TestDirective {}
      @Injectable() class TestInjectable {}
      @NgModule({declarations: [TestComponent, TestDirective]}) class TestNgModule {}
      @Pipe({name: 'pipe'}) class TestPipe {}
    `);

    env.driveMain();
    const jsContents = env.getContents('test.js');
    expect(jsContents).toContain('ɵsetClassMetadata(TestComponent, ');
    expect(jsContents).toContain('ɵsetClassMetadata(TestDirective, ');
    expect(jsContents).toContain('ɵsetClassMetadata(TestInjectable, ');
    expect(jsContents).toContain('ɵsetClassMetadata(TestNgModule, ');
    expect(jsContents).toContain('ɵsetClassMetadata(TestPipe, ');
  });

  it('should compile a template using multiple directives with the same selector', () => {
    env.tsconfig();
    env.write('test.ts', `
      import {Component, Directive, NgModule} from '@angular/core';

      @Directive({selector: '[test]'})
      class DirA {}

      @Directive({selector: '[test]'})
      class DirB {}

      @Component({
        template: '<div test></div>',
      })
      class Cmp {}

      @NgModule({
        declarations: [Cmp, DirA, DirB],
      })
      class Module {}
    `);

    env.driveMain();
    const jsContents = env.getContents('test.js');
    expect(jsContents).toMatch(/directives: \[DirA,\s+DirB\]/);
  });

  describe('duplicate local refs', () => {
    const getComponentScript = (template: string): string => `
      import {Component, Directive, NgModule} from '@angular/core';

      @Component({selector: 'my-cmp', template: \`${template}\`})
      class Cmp {}

      @NgModule({declarations: [Cmp]})
      class Module {}
    `;

    // Components with templates listed below should
    // throw the "ref is already defined" error
    const invalidCases = [
      `
        <div #ref></div>
        <div #ref></div>
      `,
      `
        <div #ref>
          <div #ref></div>
        </div>
      `,
      `
        <div>
          <div #ref></div>
        </div>
        <div>
          <div #ref></div>
        </div>
      `,
      `
        <ng-container>
          <div #ref></div>
        </ng-container>
        <div #ref></div>
      `
    ];

    // Components with templates listed below should not throw
    // the error, since refs are located in different scopes
    const validCases = [
      `
        <ng-template>
          <div #ref></div>
        </ng-template>
        <div #ref></div>
      `,
      `
        <div *ngIf="visible" #ref></div>
        <div #ref></div>
      `,
      `
        <div *ngFor="let item of items" #ref></div>
        <div #ref></div>
      `
    ];

    invalidCases.forEach(template => {
      it('should throw in case of duplicate refs', () => {
        env.tsconfig();
        env.write('test.ts', getComponentScript(template));
        const errors = env.driveDiagnostics();
        expect(errors[0].messageText)
            .toContain('Internal Error: The name ref is already defined in scope');
      });
    });

    validCases.forEach(template => {
      it('should not throw in case refs are in different scopes', () => {
        env.tsconfig();
        env.write('test.ts', getComponentScript(template));
        const errors = env.driveDiagnostics();
        expect(errors.length).toBe(0);
      });
    });
  });

  it('should compile programs with typeRoots', () => {
    // Write out a custom tsconfig.json that includes 'typeRoots' and 'files'. 'files' is necessary
    // because otherwise TS picks up the testTypeRoot/test/index.d.ts file into the program
    // automatically. Shims are also turned on (via allowEmptyCodegenFiles) because the shim
    // ts.CompilerHost wrapper can break typeRoot functionality (which this test is meant to
    // detect).
    env.write('tsconfig.json', `{
      "extends": "./tsconfig-base.json",
      "angularCompilerOptions": {
        "allowEmptyCodegenFiles": true
      },
      "compilerOptions": {
        "typeRoots": ["./testTypeRoot"],
      },
      "files": ["./test.ts"]
    }`);
    env.write('test.ts', `
      import {Test} from 'ambient';
      console.log(Test);
    `);
    env.write('testTypeRoot/.exists', '');
    env.write('testTypeRoot/test/index.d.ts', `
      declare module 'ambient' {
        export const Test = 'This is a test';
      }
    `);

    env.driveMain();

    // Success is enough to indicate that this passes.
  });

  it('should not emit multiple references to the same directive', () => {
    env.tsconfig();
    env.write('node_modules/external/index.d.ts', `
      import {ɵDirectiveDefWithMeta, ɵNgModuleDefWithMeta} from '@angular/core';

      export declare class ExternalDir {
        static ngDirectiveDef: ɵDirectiveDefWithMeta<ExternalDir, '[test]', never, never, never, never>;
      }

      export declare class ExternalModule {
        static ngModuleDef: ɵNgModuleDefWithMeta<ExternalModule, [typeof ExternalDir], never, [typeof ExternalDir]>;
      }
    `);
    env.write('test.ts', `
      import {Component, Directive, NgModule} from '@angular/core';
      import {ExternalModule} from 'external';

      @Component({
        template: '<div test></div>',
      })
      class Cmp {}

      @NgModule({
        declarations: [Cmp],
        // Multiple imports of the same module used to result in duplicate directive references
        // in the output.
        imports: [ExternalModule, ExternalModule],
      })
      class Module {}
    `);

    env.driveMain();
    const jsContents = env.getContents('test.js');
    expect(jsContents).toMatch(/directives: \[i1\.ExternalDir\]/);
  });

  describe('flat module indices', () => {
    it('should generate a basic flat module index', () => {
      env.tsconfig({
        'flatModuleOutFile': 'flat.js',
      });
      env.write('test.ts', 'export const TEST = "this is a test";');

      env.driveMain();
      const jsContents = env.getContents('flat.js');
      expect(jsContents).toContain('export * from \'./test\';');
    });

    it('should generate a flat module with an id', () => {
      env.tsconfig({
        'flatModuleOutFile': 'flat.js',
        'flatModuleId': '@mymodule',
      });
      env.write('test.ts', 'export const TEST = "this is a test";');

      env.driveMain();
      const dtsContents = env.getContents('flat.d.ts');
      expect(dtsContents).toContain('/// <amd-module name="@mymodule" />');
    });
  });
});
