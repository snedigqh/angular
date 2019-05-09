/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {By, DomSanitizer, SafeUrl} from '@angular/platform-browser';

describe('attribute creation', () => {
  it('should create an element', () => {
    @Component({
      template: `<div id="test" title="Hello"></div>`,
    })
    class Comp {
    }

    TestBed.configureTestingModule({declarations: [Comp]});
    const fixture = TestBed.createComponent(Comp);
    fixture.detectChanges();
    const div = fixture.debugElement.query(By.css('div')).nativeElement;
    expect(div.id).toEqual('test');
    expect(div.title).toEqual('Hello');
  });

  it('should allow for setting xlink namespaced attributes', () => {
    @Component({
      template: `<div id="test" xlink:href="bar" title="Hello"></div>`,
    })
    class Comp {
    }

    TestBed.configureTestingModule({declarations: [Comp]});
    const fixture = TestBed.createComponent(Comp);
    fixture.detectChanges();


    const div = fixture.debugElement.query(By.css('div')).nativeElement;
    const attrs = div.attributes;

    expect(attrs['id'].name).toEqual('id');
    expect(attrs['id'].namespaceURI).toEqual(null);
    expect(attrs['id'].value).toEqual('test');

    expect(attrs['xlink:href'].name).toEqual('xlink:href');
    expect(attrs['xlink:href'].namespaceURI).toEqual('http://www.w3.org/1999/xlink');
    expect(attrs['xlink:href'].value).toEqual('bar');

    expect(attrs['title'].name).toEqual('title');
    expect(attrs['title'].namespaceURI).toEqual(null);
    expect(attrs['title'].value).toEqual('Hello');
  });
});

describe('attribute binding', () => {
  it('should set attribute values', () => {
    @Component({
      template: `<a [attr.href]="url"></a>`,
    })
    class Comp {
      url = 'https://angular.io/robots.txt';
    }

    TestBed.configureTestingModule({declarations: [Comp]});
    const fixture = TestBed.createComponent(Comp);
    fixture.detectChanges();

    const a = fixture.debugElement.query(By.css('a')).nativeElement;
    // NOTE: different browsers will add `//` into the URI.
    expect(a.href).toEqual('https://angular.io/robots.txt');
  });

  it('should sanitize attribute values', () => {
    @Component({
      template: `<a [attr.href]="badUrl"></a>`,
    })
    class Comp {
      badUrl: string|SafeUrl = 'javascript:true';
    }

    TestBed.configureTestingModule({declarations: [Comp]});
    const fixture = TestBed.createComponent(Comp);
    fixture.detectChanges();

    const a = fixture.debugElement.query(By.css('a')).nativeElement;
    // NOTE: different browsers will add `//` into the URI.
    expect(a.href.indexOf('unsafe:')).toBe(0);

    const domSanitizer: DomSanitizer = TestBed.get(DomSanitizer);
    fixture.componentInstance.badUrl =
        domSanitizer.bypassSecurityTrustUrl('javascript:alert("this is fine")');
    fixture.detectChanges();

    // should not start with `unsafe:`.
    expect(a.href.indexOf('unsafe:')).toBe(-1);
  });
});
