/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ANALYZE_FOR_PRECOMPILE, AppModule, AppModuleMetadata, Compiler, Component, ComponentFactoryResolver, ComponentRef, ComponentResolver, DebugElement, Directive, Host, Inject, Injectable, Injector, Input, OpaqueToken, Optional, Pipe, Provider, ReflectiveInjector, SelfMetadata, SkipSelf, SkipSelfMetadata, forwardRef, getDebugNode, provide} from '@angular/core';
import {ComponentFixture, configureCompiler} from '@angular/core/testing';
import {AsyncTestCompleter, beforeEach, beforeEachProviders, ddescribe, describe, iit, inject, it, xdescribe, xit} from '@angular/core/testing/testing_internal';
import {expect} from '@angular/platform-browser/testing/matchers';

import {BaseException} from '../../src/facade/exceptions';
import {ConcreteType, IS_DART, Type, stringify} from '../../src/facade/lang';

class Engine {}

class BrokenEngine {
  constructor() { throw new BaseException('Broken Engine'); }
}

class DashboardSoftware {}

@Injectable()
class Dashboard {
  constructor(software: DashboardSoftware) {}
}

class TurboEngine extends Engine {}

@Injectable()
class Car {
  engine: Engine;
  constructor(engine: Engine) { this.engine = engine; }
}

@Injectable()
class CarWithOptionalEngine {
  engine: Engine;
  constructor(@Optional() engine: Engine) { this.engine = engine; }
}

@Injectable()
class CarWithDashboard {
  engine: Engine;
  dashboard: Dashboard;
  constructor(engine: Engine, dashboard: Dashboard) {
    this.engine = engine;
    this.dashboard = dashboard;
  }
}

@Injectable()
class SportsCar extends Car {
  engine: Engine;
  constructor(engine: Engine) { super(engine); }
}

@Injectable()
class CarWithInject {
  engine: Engine;
  constructor(@Inject(TurboEngine) engine: Engine) { this.engine = engine; }
}

@Injectable()
class CyclicEngine {
  constructor(car: Car) {}
}

class NoAnnotations {
  constructor(secretDependency: any) {}
}

function factoryFn(a: any) {}

@Injectable()
class SomeService {
}

@AppModule({})
class SomeModule {
}

@AppModule({providers: [{provide: 'someToken', useValue: 'someValue'}]})
class ModuleWithProvider {
}

@Component({selector: 'comp', template: ''})
class SomeComp {
}

@AppModule({precompile: [SomeComp]})
class ModuleWithPrecompile {
}

@AppModule({
  providers:
      [{provide: ANALYZE_FOR_PRECOMPILE, multi: true, useValue: [{a: 'b', component: SomeComp}]}]
})
class ModuleWithAnalyzePrecompileProvider {
}

@Directive({selector: '[someDir]', host: {'[title]': 'someDir'}})
class SomeDirective {
  @Input()
  someDir: string;
}

@Pipe({name: 'somePipe'})
class SomePipe {
  transform(value: string): any { return `transformed ${value}`; }
}

@Component({selector: 'comp', template: `<div  [someDir]="'someValue' | somePipe"></div>`})
class CompUsingModuleDirectiveAndPipe {
}

@Component(
    {selector: 'parent', template: `<comp></comp>`, directives: [CompUsingModuleDirectiveAndPipe]})
class ParentCompUsingModuleDirectiveAndPipe {
}

@AppModule(
    {directives: [SomeDirective], pipes: [SomePipe], precompile: [CompUsingModuleDirectiveAndPipe]})
class ModuleWithDirectivesAndPipes {
}

export function main() {
  if (IS_DART) {
    declareTests({useJit: false});
  } else {
    describe('jit', () => { declareTests({useJit: true}); });

    describe('no jit', () => { declareTests({useJit: false}); });
  }
}

function declareTests({useJit}: {useJit: boolean}) {
  describe('AppModule', () => {
    var compiler: Compiler;
    var injector: Injector;

    beforeEach(() => { configureCompiler({useJit: useJit}); });

    beforeEach(inject([Compiler, Injector], (_compiler: Compiler, _injector: Injector) => {
      compiler = _compiler;
      injector = _injector;
    }));

    describe('precompile', function() {
      it('should resolve ComponentFactories', () => {
        let appModule = compiler.compileAppModuleSync(ModuleWithPrecompile).create();
        expect(appModule.componentFactoryResolver.resolveComponentFactory(SomeComp).componentType)
            .toBe(SomeComp);
        expect(appModule.injector.get(ComponentFactoryResolver)
                   .resolveComponentFactory(SomeComp)
                   .componentType)
            .toBe(SomeComp);
      });

      it('should resolve ComponentFactories via ANALYZE_FOR_PRECOMPILE', () => {
        let appModule = compiler.compileAppModuleSync(ModuleWithAnalyzePrecompileProvider).create();
        expect(appModule.componentFactoryResolver.resolveComponentFactory(SomeComp).componentType)
            .toBe(SomeComp);
        expect(appModule.injector.get(ComponentFactoryResolver)
                   .resolveComponentFactory(SomeComp)
                   .componentType)
            .toBe(SomeComp);
      });

      it('should resolve ComponentFactories for nested modules', () => {
        let appModule =
            compiler
                .compileAppModuleSync(
                    SomeModule, new AppModuleMetadata({modules: [ModuleWithPrecompile]}))
                .create();
        expect(appModule.componentFactoryResolver.resolveComponentFactory(SomeComp).componentType)
            .toBe(SomeComp);
        expect(appModule.injector.get(ComponentFactoryResolver)
                   .resolveComponentFactory(SomeComp)
                   .componentType)
            .toBe(SomeComp);
      });
    });

    describe('directives and pipes', () => {
      function createComp<T>(
          compType: ConcreteType<T>, moduleType: ConcreteType<any>,
          moduleMeta: AppModuleMetadata = null): ComponentFixture<T> {
        let appModule = compiler.compileAppModuleSync(moduleType, moduleMeta).create();
        var cf = appModule.componentFactoryResolver.resolveComponentFactory(compType);
        return new ComponentFixture(cf.create(injector), null, false);
      }

      it('should support module directives and pipes', () => {
        let compFixture = createComp(CompUsingModuleDirectiveAndPipe, ModuleWithDirectivesAndPipes);
        compFixture.detectChanges();
        expect(compFixture.debugElement.children[0].properties['title'])
            .toBe('transformed someValue');
      });

      it('should support module directives and pipes for nested modules', () => {
        let compFixture = createComp(
            CompUsingModuleDirectiveAndPipe, SomeModule,
            new AppModuleMetadata({modules: [ModuleWithDirectivesAndPipes]}));
        compFixture.detectChanges();
        expect(compFixture.debugElement.children[0].properties['title'])
            .toBe('transformed someValue');
      });

      it('should support module directives and pipes in nested components', () => {
        let compFixture =
            createComp(ParentCompUsingModuleDirectiveAndPipe, SomeModule, new AppModuleMetadata({
                         directives: [SomeDirective],
                         pipes: [SomePipe],
                         precompile: [ParentCompUsingModuleDirectiveAndPipe]
                       }));
        compFixture.detectChanges();
        expect(compFixture.debugElement.children[0].children[0].properties['title'])
            .toBe('transformed someValue');
      });

      it('should provide a Compiler instance that uses the directives/pipes of the module', () => {
        let appModule = compiler.compileAppModuleSync(ModuleWithDirectivesAndPipes).create();
        let boundCompiler: Compiler = appModule.injector.get(Compiler);
        var cf = boundCompiler.compileComponentSync(CompUsingModuleDirectiveAndPipe);
        let compFixture = new ComponentFixture(cf.create(injector), null, false);
        compFixture.detectChanges();
        expect(compFixture.debugElement.children[0].properties['title'])
            .toBe('transformed someValue');
      });

      it('should provide a ComponentResolver instance that uses the directives/pipes of the module',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {

           let appModule = compiler.compileAppModuleSync(ModuleWithDirectivesAndPipes).create();
           let boundCompiler: ComponentResolver = appModule.injector.get(ComponentResolver);
           boundCompiler.resolveComponent(CompUsingModuleDirectiveAndPipe).then((cf) => {
             let compFixture = new ComponentFixture(cf.create(injector), null, false);
             compFixture.detectChanges();
             expect(compFixture.debugElement.children[0].properties['title'])
                 .toBe('transformed someValue');
             async.done();
           });
         }));

      it('should provide a ComponentResolver instance that delegates to the parent ComponentResolver for strings',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           let parentResolver: any =
               jasmine.createSpyObj('resolver', ['resolveComponent', 'clearCache']);
           let appModule = compiler.compileAppModuleSync(ModuleWithDirectivesAndPipes)
                               .create(ReflectiveInjector.resolveAndCreate(
                                   [{provide: ComponentResolver, useValue: parentResolver}]));
           parentResolver.resolveComponent.and.returnValue(
               Promise.resolve('someFactoryFromParent'));
           let boundCompiler: ComponentResolver = appModule.injector.get(ComponentResolver);
           boundCompiler.resolveComponent('someString').then((result) => {
             expect(parentResolver.resolveComponent).toHaveBeenCalledWith('someString');
             expect(result).toBe('someFactoryFromParent');
             async.done();
           });
         }));
    });

    describe('providers', function() {
      function createInjector(providers: any[], parent: Injector = null): Injector {
        return compiler
            .compileAppModuleSync(SomeModule, new AppModuleMetadata({providers: providers}))
            .create(parent)
            .injector;
      }

      it('should provide the module',
         () => { expect(createInjector([]).get(SomeModule)).toBeAnInstanceOf(SomeModule); });

      it('should instantiate a class without dependencies', () => {
        var injector = createInjector([Engine]);
        var engine = injector.get(Engine);

        expect(engine).toBeAnInstanceOf(Engine);
      });

      it('should resolve dependencies based on type information', () => {
        var injector = createInjector([Engine, Car]);
        var car = injector.get(Car);

        expect(car).toBeAnInstanceOf(Car);
        expect(car.engine).toBeAnInstanceOf(Engine);
      });

      it('should resolve dependencies based on @Inject annotation', () => {
        var injector = createInjector([TurboEngine, Engine, CarWithInject]);
        var car = injector.get(CarWithInject);

        expect(car).toBeAnInstanceOf(CarWithInject);
        expect(car.engine).toBeAnInstanceOf(TurboEngine);
      });

      it('should throw when no type and not @Inject (class case)', () => {
        expect(() => createInjector([NoAnnotations]))
            .toThrowError('Can\'t resolve all parameters for NoAnnotations: (?).');
      });

      it('should throw when no type and not @Inject (factory case)', () => {
        expect(() => createInjector([provide('someToken', {useFactory: factoryFn})]))
            .toThrowError('Can\'t resolve all parameters for factoryFn: (?).');
      });

      it('should cache instances', () => {
        var injector = createInjector([Engine]);

        var e1 = injector.get(Engine);
        var e2 = injector.get(Engine);

        expect(e1).toBe(e2);
      });

      it('should provide to a value', () => {
        var injector = createInjector([provide(Engine, {useValue: 'fake engine'})]);

        var engine = injector.get(Engine);
        expect(engine).toEqual('fake engine');
      });

      it('should provide to a factory', () => {
        function sportsCarFactory(e: Engine) { return new SportsCar(e); }

        var injector =
            createInjector([Engine, provide(Car, {useFactory: sportsCarFactory, deps: [Engine]})]);

        var car = injector.get(Car);
        expect(car).toBeAnInstanceOf(SportsCar);
        expect(car.engine).toBeAnInstanceOf(Engine);
      });

      it('should supporting provider to null', () => {
        var injector = createInjector([provide(Engine, {useValue: null})]);
        var engine = injector.get(Engine);
        expect(engine).toBeNull();
      });

      it('should provide to an alias', () => {
        var injector = createInjector([
          Engine, provide(SportsCar, {useClass: SportsCar}),
          provide(Car, {useExisting: SportsCar})
        ]);

        var car = injector.get(Car);
        var sportsCar = injector.get(SportsCar);
        expect(car).toBeAnInstanceOf(SportsCar);
        expect(car).toBe(sportsCar);
      });

      it('should support multiProviders', () => {
        var injector = createInjector([
          Engine, provide(Car, {useClass: SportsCar, multi: true}),
          provide(Car, {useClass: CarWithOptionalEngine, multi: true})
        ]);

        var cars = injector.get(Car);
        expect(cars.length).toEqual(2);
        expect(cars[0]).toBeAnInstanceOf(SportsCar);
        expect(cars[1]).toBeAnInstanceOf(CarWithOptionalEngine);
      });

      it('should support multiProviders that are created using useExisting', () => {
        var injector = createInjector(
            [Engine, SportsCar, provide(Car, {useExisting: SportsCar, multi: true})]);

        var cars = injector.get(Car);
        expect(cars.length).toEqual(1);
        expect(cars[0]).toBe(injector.get(SportsCar));
      });

      it('should throw when the aliased provider does not exist', () => {
        var injector = createInjector([provide('car', {useExisting: SportsCar})]);
        var e = `No provider for ${stringify(SportsCar)}!`;
        expect(() => injector.get('car')).toThrowError(e);
      });

      it('should handle forwardRef in useExisting', () => {
        var injector = createInjector([
          provide('originalEngine', {useClass: forwardRef(() => Engine)}),
          provide('aliasedEngine', {useExisting: <any>forwardRef(() => 'originalEngine')})
        ]);
        expect(injector.get('aliasedEngine')).toBeAnInstanceOf(Engine);
      });

      it('should support overriding factory dependencies', () => {
        var injector = createInjector(
            [Engine, provide(Car, {useFactory: (e: Engine) => new SportsCar(e), deps: [Engine]})]);

        var car = injector.get(Car);
        expect(car).toBeAnInstanceOf(SportsCar);
        expect(car.engine).toBeAnInstanceOf(Engine);
      });

      it('should support optional dependencies', () => {
        var injector = createInjector([CarWithOptionalEngine]);

        var car = injector.get(CarWithOptionalEngine);
        expect(car.engine).toEqual(null);
      });

      it('should flatten passed-in providers', () => {
        var injector = createInjector([[[Engine, Car]]]);

        var car = injector.get(Car);
        expect(car).toBeAnInstanceOf(Car);
      });

      it('should use the last provider when there are multiple providers for same token', () => {
        var injector = createInjector(
            [provide(Engine, {useClass: Engine}), provide(Engine, {useClass: TurboEngine})]);

        expect(injector.get(Engine)).toBeAnInstanceOf(TurboEngine);
      });

      it('should use non-type tokens', () => {
        var injector = createInjector([provide('token', {useValue: 'value'})]);

        expect(injector.get('token')).toEqual('value');
      });

      it('should throw when given invalid providers', () => {
        expect(() => createInjector(<any>['blah']))
            .toThrowError(
                'Invalid provider - only instances of Provider and Type are allowed, got: blah');
      });

      it('should provide itself', () => {
        var parent = createInjector([]);
        var child = createInjector([], parent);

        expect(child.get(Injector)).toBe(child);
      });

      it('should throw when no provider defined', () => {
        var injector = createInjector([]);
        expect(() => injector.get('NonExisting')).toThrowError('No provider for NonExisting!');
      });

      it('should throw when trying to instantiate a cyclic dependency', () => {
        expect(() => createInjector([Car, provide(Engine, {useClass: CyclicEngine})]))
            .toThrowError(/Cannot instantiate cyclic dependency! Car/g);
      });

      it('should support null values', () => {
        var injector = createInjector([provide('null', {useValue: null})]);
        expect(injector.get('null')).toBe(null);
      });


      describe('child', () => {
        it('should load instances from parent injector', () => {
          var parent = createInjector([Engine]);
          var child = createInjector([], parent);

          var engineFromParent = parent.get(Engine);
          var engineFromChild = child.get(Engine);

          expect(engineFromChild).toBe(engineFromParent);
        });

        it('should not use the child providers when resolving the dependencies of a parent provider',
           () => {
             var parent = createInjector([Car, Engine]);
             var child = createInjector([provide(Engine, {useClass: TurboEngine})], parent);

             var carFromChild = child.get(Car);
             expect(carFromChild.engine).toBeAnInstanceOf(Engine);
           });

        it('should create new instance in a child injector', () => {
          var parent = createInjector([Engine]);
          var child = createInjector([provide(Engine, {useClass: TurboEngine})], parent);

          var engineFromParent = parent.get(Engine);
          var engineFromChild = child.get(Engine);

          expect(engineFromParent).not.toBe(engineFromChild);
          expect(engineFromChild).toBeAnInstanceOf(TurboEngine);
        });

      });

      describe('depedency resolution', () => {
        describe('@Self()', () => {
          it('should return a dependency from self', () => {
            var inj = createInjector([
              Engine,
              provide(
                  Car,
                  {useFactory: (e: Engine) => new Car(e), deps: [[Engine, new SelfMetadata()]]})
            ]);

            expect(inj.get(Car)).toBeAnInstanceOf(Car);
          });

          it('should throw when not requested provider on self', () => {
            expect(() => createInjector([provide(Car, {
                     useFactory: (e: Engine) => new Car(e),
                     deps: [[Engine, new SelfMetadata()]]
                   })]))
                .toThrowError(/No provider for Engine/g);
          });
        });

        describe('default', () => {
          it('should not skip self', () => {
            var parent = createInjector([Engine]);
            var child = createInjector(
                [
                  provide(Engine, {useClass: TurboEngine}),
                  provide(Car, {useFactory: (e: Engine) => new Car(e), deps: [Engine]})
                ],
                parent);

            expect(child.get(Car).engine).toBeAnInstanceOf(TurboEngine);
          });
        });
      });

      describe('nested modules', () => {
        it('should merge the providers of nested modules', () => {
          var injector =
              compiler
                  .compileAppModuleSync(SomeModule, new AppModuleMetadata({
                                          providers: [{provide: 'a', useValue: 'aValue'}],
                                          modules: [ModuleWithProvider]
                                        }))
                  .create()
                  .injector;
          expect(injector.get(SomeModule)).toBeAnInstanceOf(SomeModule);
          expect(injector.get(ModuleWithProvider)).toBeAnInstanceOf(ModuleWithProvider);
          expect(injector.get('a')).toBe('aValue');
          expect(injector.get('someToken')).toBe('someValue');
        });

        it('should override the providers of nested modules', () => {
          var injector = compiler
                             .compileAppModuleSync(
                                 SomeModule, new AppModuleMetadata({
                                   providers: [{provide: 'someToken', useValue: 'someNewValue'}],
                                   modules: [ModuleWithProvider]
                                 }))
                             .create()
                             .injector;
          expect(injector.get('someToken')).toBe('someNewValue');

        });
      });

    });
  });
}
