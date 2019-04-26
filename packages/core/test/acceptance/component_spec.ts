/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component, ComponentFactoryResolver, ComponentRef, InjectionToken, NgModule, Type, ViewChild, ViewContainerRef} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {expect} from '@angular/platform-browser/testing/src/matchers';


describe('component', () => {
  describe('view destruction', () => {
    it('should invoke onDestroy only once when a component is registered as a provider', () => {
      const testToken = new InjectionToken<ParentWithOnDestroy>('testToken');
      let destroyCalls = 0;

      @Component({
        selector: 'comp-with-on-destroy',
        template: '',
        providers: [{provide: testToken, useExisting: ParentWithOnDestroy}]
      })
      class ParentWithOnDestroy {
        ngOnDestroy() { destroyCalls++; }
      }

      @Component({selector: 'child', template: ''})
      class ChildComponent {
        // We need to inject the parent so the provider is instantiated.
        constructor(_parent: ParentWithOnDestroy) {}
      }

      @Component({
        template: `
          <comp-with-on-destroy>
            <child></child>
          </comp-with-on-destroy>
        `
      })
      class App {
      }

      TestBed.configureTestingModule({declarations: [App, ParentWithOnDestroy, ChildComponent]});
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      fixture.destroy();

      expect(destroyCalls).toBe(1, 'Expected `ngOnDestroy` to only be called once.');
    });
  });

  it('should support entry components from another module', () => {
    @Component({selector: 'other-component', template: `bar`})
    class OtherComponent {
    }

    @NgModule({
      declarations: [OtherComponent],
      exports: [OtherComponent],
      entryComponents: [OtherComponent]
    })
    class OtherModule {
    }

    @Component({
      selector: 'test_component',
      template: `foo|<ng-template #vc></ng-template>`,
      entryComponents: [OtherComponent]
    })
    class TestComponent {
      @ViewChild('vc', {read: ViewContainerRef}) vcref !: ViewContainerRef;

      constructor(private _cfr: ComponentFactoryResolver) {}

      createComponentView<T>(cmptType: Type<T>): ComponentRef<T> {
        const cf = this._cfr.resolveComponentFactory(cmptType);
        return this.vcref.createComponent(cf);
      }
    }

    TestBed.configureTestingModule({declarations: [TestComponent], imports: [OtherModule]});
    const fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();

    fixture.componentInstance.createComponentView(OtherComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement).toHaveText('foo|bar');
  });
});
