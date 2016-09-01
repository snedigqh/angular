import {ApplicationRef, NgModule, enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {bindAction, profile} from '../../util';
import {TreeNode, buildTree, emptyTree} from '../util';

import {AppModule, TreeComponent} from './tree';

export function main() {
  var tree: TreeComponent;
  var appRef: ApplicationRef;

  function destroyDom() {
    tree.data = emptyTree;
    appRef.tick();
  }

  function createDom() {
    tree.data = buildTree();
    appRef.tick();
  }

  function noop() {}

  function init() {
    enableProdMode();
    platformBrowserDynamic().bootstrapModule(AppModule).then((ref) => {
      var injector = ref.injector;
      appRef = injector.get(ApplicationRef);

      tree = appRef.components[0].instance;
      bindAction('#destroyDom', destroyDom);
      bindAction('#createDom', createDom);
      bindAction('#updateDomProfile', profile(createDom, noop, 'update'));
      bindAction('#createDomProfile', profile(createDom, destroyDom, 'create'));
    });
  }

  init();
}
