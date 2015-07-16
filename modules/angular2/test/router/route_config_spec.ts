import {
  AsyncTestCompleter,
  beforeEach,
  ddescribe,
  describe,
  expect,
  iit,
  inject,
  it,
  xdescribe,
  xit,
} from 'angular2/test_lib';

import {bootstrap} from 'angular2/core';
import {Component, Directive, View} from 'angular2/annotations';
import {DOM} from 'angular2/src/dom/dom_adapter';
import {bind} from 'angular2/di';
import {DOCUMENT_TOKEN} from 'angular2/src/render/dom/dom_renderer';

import {
  routerInjectables,
  Router,
  RouteConfig,
  appBaseHrefToken,
  routerDirectives
} from 'angular2/router';

import {LocationStrategy} from 'angular2/src/router/location_strategy';
import {MockLocationStrategy} from 'angular2/src/mock/mock_location_strategy';

export function main() {
  describe('RouteConfig with POJO arguments', () => {
    var fakeDoc, el, testBindings;
    beforeEach(() => {
      fakeDoc = DOM.createHtmlDocument();
      el = DOM.createElement('app-cmp', fakeDoc);
      DOM.appendChild(fakeDoc.body, el);
      testBindings = [
        routerInjectables,
        bind(LocationStrategy).toClass(MockLocationStrategy),
        bind(DOCUMENT_TOKEN).toValue(fakeDoc)
      ];
    });

    it('should bootstrap an app with a hierarchy', inject([AsyncTestCompleter], (async) => {
         bootstrap(HierarchyAppCmp, testBindings)
             .then((applicationRef) => {
               var router = applicationRef.hostComponent.router;
               router.subscribe((_) => {
                 expect(el).toHaveText('root { parent { hello } }');
                 expect(applicationRef.hostComponent.location.path()).toEqual('/parent/child');
                 async.done();
               });
               router.navigate('/parent/child');
             });
       }));


    it('should work in an app with redirects', inject([AsyncTestCompleter], (async) => {
         bootstrap(RedirectAppCmp, testBindings)
             .then((applicationRef) => {
               var router = applicationRef.hostComponent.router;
               router.subscribe((_) => {
                 expect(el).toHaveText('root { hello }');
                 expect(applicationRef.hostComponent.location.path()).toEqual('/after');
                 async.done();
               });
               router.navigate('/before');
             });
       }));


    it('should work in an app with async components', inject([AsyncTestCompleter], (async) => {
         bootstrap(AsyncAppCmp, testBindings)
             .then((applicationRef) => {
               var router = applicationRef.hostComponent.router;
               router.subscribe((_) => {
                 expect(el).toHaveText('root { hello }');
                 expect(applicationRef.hostComponent.location.path()).toEqual('/hello');
                 async.done();
               });
               router.navigate('/hello');
             });
       }));


    it('should work in an app with a constructor component',
       inject([AsyncTestCompleter], (async) => {
         bootstrap(ExplicitConstructorAppCmp, testBindings)
             .then((applicationRef) => {
               var router = applicationRef.hostComponent.router;
               router.subscribe((_) => {
                 expect(el).toHaveText('root { hello }');
                 expect(applicationRef.hostComponent.location.path()).toEqual('/hello');
                 async.done();
               });
               router.navigate('/hello');
             });
       }));

    // TODO: test apps with wrong configs
  });
}


@Component({selector: 'hello-cmp'})
@View({template: 'hello'})
class HelloCmp {
}

@Component({selector: 'app-cmp'})
@View({template: `root { <router-outlet></router-outlet> }`, directives: routerDirectives})
@RouteConfig([{path: '/before', redirectTo: '/after'}, {path: '/after', component: HelloCmp}])
class RedirectAppCmp {
  constructor(public router: Router, public location: LocationStrategy) {}
}

function HelloLoader(): Promise<any> {
  return Promise.resolve(HelloCmp);
}

@Component({selector: 'app-cmp'})
@View({template: `root { <router-outlet></router-outlet> }`, directives: routerDirectives})
@RouteConfig([
  {path: '/hello', component: {type: 'loader', loader: HelloLoader}},
])
class AsyncAppCmp {
  constructor(public router: Router, public location: LocationStrategy) {}
}

@Component({selector: 'app-cmp'})
@View({template: `root { <router-outlet></router-outlet> }`, directives: routerDirectives})
@RouteConfig([
  {path: '/hello', component: {type: 'constructor', constructor: HelloCmp}},
])
class ExplicitConstructorAppCmp {
  constructor(public router: Router, public location: LocationStrategy) {}
}

@Component({selector: 'parent-cmp'})
@View({template: `parent { <router-outlet></router-outlet> }`, directives: routerDirectives})
@RouteConfig([{path: '/child', component: HelloCmp}])
class ParentCmp {
}

@Component({selector: 'app-cmp'})
@View({template: `root { <router-outlet></router-outlet> }`, directives: routerDirectives})
@RouteConfig([{path: '/parent/...', component: ParentCmp}])
class HierarchyAppCmp {
  constructor(public router: Router, public location: LocationStrategy) {}
}
