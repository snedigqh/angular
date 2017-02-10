/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as url from 'url';

import {Injectable} from '@angular/core';
import {LocationChangeEvent, LocationChangeListener, PlatformLocation} from '@angular/common';
import {getDOM} from './private_import_platform-browser';
import {scheduleMicroTask} from './facade/lang';

import {Subject} from 'rxjs/Subject';


/**
 * Server-side implementation of URL state. Implements `pathname`, `search`, and `hash`
 * but not the state stack.
 */
@Injectable()
export class ServerPlatformLocation implements PlatformLocation {
  private _path: string = '/';
  private _search: string = '';
  private _hash: string = '';
  private _hashUpdate = new Subject<LocationChangeEvent>();

  getBaseHrefFromDOM(): string {
    return getDOM().getBaseHref();
  }
  
  onPopState(fn: LocationChangeListener): void {
    // No-op: a state stack is not implemented, so
    // no events will ever come.
  }
  
  onHashChange(fn: LocationChangeListener): void {
    this._hashUpdate.subscribe(fn);
  }

  get pathname(): string { return this._path; }
  get search(): string { return this._search; }
  get hash(): string { return this._hash; }

  get url(): string {
    return `${this.pathname}${this.search}${this.hash}`;
  }

  private setHash(value: string, oldUrl: string) {
    if (this._hash === value) {
      // Don't fire events if the hash has not changed.
      return;
    }
    this._hash = value;
    const newUrl = this.url;
    scheduleMicroTask(() => this._hashUpdate.next(
        {type: 'hashchange', oldUrl, newUrl} as LocationChangeEvent));
  }

  replaceState(state: any, title: string, newUrl: string): void {
    const oldUrl = this.url;
    const parsedUrl = url.parse(newUrl, true);
    this._path = parsedUrl.path;
    this._search = parsedUrl.search;
    this.setHash(parsedUrl.hash, oldUrl);
  }

  pushState(state: any, title: string, newUrl: string): void {
    this.replaceState(state, title, newUrl);
  }

  forward(): void {
    throw new Error('Not implemented');
  }

  back(): void {
    throw new Error('Not implemented');
  }
}
