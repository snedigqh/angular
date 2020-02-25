/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript';

import {createLanguageService} from '../src/language_service';
import {TypeScriptServiceHost} from '../src/typescript_host';

import {MockTypescriptHost} from './test_utils';

const TEST_TEMPLATE = '/app/test.ng';

describe('hover', () => {
  const mockHost = new MockTypescriptHost(['/app/main.ts']);
  const tsLS = ts.createLanguageService(mockHost);
  const ngLSHost = new TypeScriptServiceHost(mockHost, tsLS);
  const ngLS = createLanguageService(ngLSHost);

  beforeEach(() => { mockHost.reset(); });

  it('should be able to find field in an interpolation', () => {
    const fileName = mockHost.addCode(`
      @Component({
        template: '{{«name»}}'
      })
      export class MyComponent {
        name: string;
      }`);
    const marker = mockHost.getReferenceMarkerFor(fileName, 'name');
    const quickInfo = ngLS.getQuickInfoAtPosition(fileName, marker.start);
    expect(quickInfo).toBeTruthy();
    const {textSpan, displayParts} = quickInfo !;
    expect(textSpan).toEqual(marker);
    expect(toText(displayParts)).toBe('(property) MyComponent.name: string');
  });

  it('should be able to find an interpolated value in an attribute', () => {
    mockHost.override(TEST_TEMPLATE, `<div string-model model="{{«title»}}"></div>`);
    const marker = mockHost.getReferenceMarkerFor(TEST_TEMPLATE, 'title');
    const quickInfo = ngLS.getQuickInfoAtPosition(TEST_TEMPLATE, marker.start);
    expect(quickInfo).toBeTruthy();
    const {textSpan, displayParts} = quickInfo !;
    expect(textSpan).toEqual(marker);
    expect(toText(displayParts)).toBe('(property) TemplateReference.title: string');
  });

  it('should be able to find a field in a attribute reference', () => {
    const fileName = mockHost.addCode(`
      @Component({
        template: '<input [(ngModel)]="«name»">'
      })
      export class MyComponent {
        name: string;
      }`);
    const marker = mockHost.getReferenceMarkerFor(fileName, 'name');
    const quickInfo = ngLS.getQuickInfoAtPosition(fileName, marker.start);
    expect(quickInfo).toBeTruthy();
    const {textSpan, displayParts} = quickInfo !;
    expect(textSpan).toEqual(marker);
    expect(toText(displayParts)).toBe('(property) MyComponent.name: string');
  });

  it('should be able to find a method from a call', () => {
    const fileName = mockHost.addCode(`
      @Component({
        template: '<div (click)="«ᐱmyClickᐱ()»;"></div>'
      })
      export class MyComponent {
        myClick() { }
      }`);
    const marker = mockHost.getDefinitionMarkerFor(fileName, 'myClick');
    const quickInfo = ngLS.getQuickInfoAtPosition(fileName, marker.start);
    expect(quickInfo).toBeTruthy();
    const {textSpan, displayParts} = quickInfo !;
    expect(textSpan).toEqual(marker);
    expect(textSpan.length).toBe('myClick()'.length);
    expect(toText(displayParts)).toBe('(method) MyComponent.myClick: () => void');
  });

  it('should be able to find a field reference in an *ngIf', () => {
    const fileName = mockHost.addCode(`
      @Component({
        template: '<div *ngIf="«include»"></div>'
      })
      export class MyComponent {
        include = true;
      }`);
    const marker = mockHost.getReferenceMarkerFor(fileName, 'include');
    const quickInfo = ngLS.getQuickInfoAtPosition(fileName, marker.start);
    expect(quickInfo).toBeTruthy();
    const {textSpan, displayParts} = quickInfo !;
    expect(textSpan).toEqual(marker);
    expect(toText(displayParts)).toBe('(property) MyComponent.include: boolean');
  });

  it('should be able to find a reference to a component', () => {
    mockHost.override(TEST_TEMPLATE, '<~{cursor}test-comp></test-comp>');
    const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'cursor');
    const quickInfo = ngLS.getQuickInfoAtPosition(TEST_TEMPLATE, marker.start);
    expect(quickInfo).toBeDefined();
    const {displayParts, documentation} = quickInfo !;
    expect(toText(displayParts)).toBe('(component) AppModule.TestComponent: typeof TestComponent');
    expect(toText(documentation)).toBe('This Component provides the `test-comp` selector.');
  });

  it('should be able to find a reference to a directive', () => {
    const content =
        mockHost.override(TEST_TEMPLATE, `<div><div string-model~{cursor}></div></div>`);
    const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'cursor');
    const quickInfo = ngLS.getQuickInfoAtPosition(TEST_TEMPLATE, marker.start);
    expect(quickInfo).toBeDefined();
    const {displayParts, textSpan} = quickInfo !;
    expect(toText(displayParts)).toBe('(directive) AppModule.StringModel: typeof StringModel');
    expect(content.substring(textSpan.start, textSpan.start + textSpan.length))
        .toBe('string-model');
  });

  it('should be able to find an event provider', () => {
    const fileName = mockHost.addCode(`
      @Component({
        template: '<test-comp «(ᐱtestᐱ)="myHandler()"»></div>'
      })
      export class MyComponent {
        myHandler() {}
      }`);
    const marker = mockHost.getDefinitionMarkerFor(fileName, 'test');
    const quickInfo = ngLS.getQuickInfoAtPosition(fileName, marker.start);
    expect(quickInfo).toBeTruthy();
    const {textSpan, displayParts} = quickInfo !;
    expect(textSpan).toEqual(marker);
    expect(toText(displayParts)).toBe('(event) TestComponent.testEvent: EventEmitter<any>');
  });

  it('should be able to find an input provider', () => {
    const fileName = mockHost.addCode(`
      @Component({
        template: '<test-comp «[ᐱtcNameᐱ]="name"»></div>'
      })
      export class MyComponent {
        name = 'my name';
      }`);
    const marker = mockHost.getDefinitionMarkerFor(fileName, 'tcName');
    const quickInfo = ngLS.getQuickInfoAtPosition(fileName, marker.start);
    expect(quickInfo).toBeTruthy();
    const {textSpan, displayParts} = quickInfo !;
    expect(textSpan).toEqual(marker);
    expect(toText(displayParts)).toBe('(property) TestComponent.name: string');
  });

  describe('over structural directive', () => {
    it('should be able to find the directive', () => {
      mockHost.override(TEST_TEMPLATE, `<div «*ᐱngForᐱ="let item of heroes"»></div>`);
      const marker = mockHost.getDefinitionMarkerFor(TEST_TEMPLATE, 'ngFor');
      const quickInfo = ngLS.getQuickInfoAtPosition(TEST_TEMPLATE, marker.start);
      expect(quickInfo).toBeTruthy();
      const {textSpan, displayParts} = quickInfo !;
      expect(textSpan).toEqual(marker);
      expect(toText(displayParts)).toBe('(directive) NgForOf: typeof NgForOf');
    });

    it('should be able to find the directive property', () => {
      mockHost.override(
          TEST_TEMPLATE, `<div *ngFor="let item of heroes; «ᐱtrackByᐱ: test»;"></div>`);
      const marker = mockHost.getDefinitionMarkerFor(TEST_TEMPLATE, 'trackBy');
      const quickInfo = ngLS.getQuickInfoAtPosition(TEST_TEMPLATE, marker.start);
      expect(quickInfo).toBeTruthy();
      const {textSpan, displayParts} = quickInfo !;
      expect(textSpan).toEqual(marker);
      expect(toText(displayParts)).toBe('(method) NgForOf<T, U>.ngForTrackBy: TrackByFunction<T>');
    });

    it('should be able to find the property value', () => {
      mockHost.override(TEST_TEMPLATE, `<div *ngFor="let item of «heroes»; trackBy: test;"></div>`);
      const marker = mockHost.getReferenceMarkerFor(TEST_TEMPLATE, 'heroes');
      const quickInfo = ngLS.getQuickInfoAtPosition(TEST_TEMPLATE, marker.start);
      expect(quickInfo).toBeTruthy();
      const {textSpan, displayParts} = quickInfo !;
      expect(textSpan).toEqual(marker);
      expect(toText(displayParts)).toBe('(property) TemplateReference.heroes: Hero[]');
    });
  });

  it('should be able to find a reference to a two-way binding', () => {
    mockHost.override(TEST_TEMPLATE, `<test-comp string-model «[(ᐱmodelᐱ)]="title"»></test-comp>`);
    const marker = mockHost.getDefinitionMarkerFor(TEST_TEMPLATE, 'model');
    const quickInfo = ngLS.getQuickInfoAtPosition(TEST_TEMPLATE, marker.start);
    expect(quickInfo).toBeTruthy();
    const {textSpan, displayParts} = quickInfo !;
    expect(textSpan).toEqual(marker);
    expect(toText(displayParts)).toBe('(property) StringModel.model: string');
  });

  it('should be able to ignore a reference declaration', () => {
    const fileName = mockHost.addCode(`
      @Component({
        template: '<div #«chart»></div>'
      })
      export class MyComponent {  }`);
    const marker = mockHost.getReferenceMarkerFor(fileName, 'chart');
    const quickInfo = ngLS.getQuickInfoAtPosition(fileName, marker.start);
    expect(quickInfo).toBeUndefined();
  });

  it('should be able to find the NgModule of a component', () => {
    const fileName = '/app/app.component.ts';
    mockHost.override(fileName, `
      import {Component} from '@angular/core';

      @Component({
        template: '<div></div>'
      })
      export class «AppComponent» {
        name: string;
      }`);
    const marker = mockHost.getReferenceMarkerFor(fileName, 'AppComponent');
    const quickInfo = ngLS.getQuickInfoAtPosition(fileName, marker.start);
    expect(quickInfo).toBeTruthy();
    const {textSpan, displayParts} = quickInfo !;
    expect(textSpan).toEqual(marker);
    expect(toText(displayParts)).toBe('(component) AppModule.AppComponent: class');
  });

  it('should be able to find the NgModule of a directive', () => {
    const fileName = '/app/parsing-cases.ts';
    const content = mockHost.readFile(fileName) !;
    const position = content.indexOf('StringModel');
    expect(position).toBeGreaterThan(0);
    const quickInfo = ngLS.getQuickInfoAtPosition(fileName, position);
    expect(quickInfo).toBeTruthy();
    const {textSpan, displayParts} = quickInfo !;
    expect(textSpan).toEqual({
      start: position,
      length: 'StringModel'.length,
    });
    expect(toText(displayParts)).toBe('(directive) AppModule.StringModel: class');
  });

  it('should be able to provide quick info for $any() cast function', () => {
    const content = mockHost.override(TEST_TEMPLATE, '<div>{{$any(title)}}</div>');
    const position = content.indexOf('$any');
    const quickInfo = ngLS.getQuickInfoAtPosition(TEST_TEMPLATE, position);
    expect(quickInfo).toBeDefined();
    const {textSpan, displayParts} = quickInfo !;
    expect(textSpan).toEqual({
      start: position,
      length: '$any(title)'.length,
    });
    expect(toText(displayParts)).toBe('(method) $any: $any');
  });

  it('should provide documentation for a property', () => {
    mockHost.override(TEST_TEMPLATE, `<div>{{~{cursor}title}}</div>`);
    const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'cursor');
    const quickInfo = ngLS.getQuickInfoAtPosition(TEST_TEMPLATE, marker.start);
    expect(quickInfo).toBeDefined();
    const documentation = toText(quickInfo !.documentation);
    expect(documentation).toBe('This is the title of the `TemplateReference` Component.');
  });

  it('should provide documentation for a selector', () => {
    mockHost.override(TEST_TEMPLATE, `<~{cursor}test-comp></test-comp>`);
    const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'cursor');
    const quickInfo = ngLS.getQuickInfoAtPosition(TEST_TEMPLATE, marker.start);
    expect(quickInfo).toBeDefined();
    const documentation = toText(quickInfo !.documentation);
    expect(documentation).toBe('This Component provides the `test-comp` selector.');
  });

  it('should not expand i18n templates', () => {
    const fileName = mockHost.addCode(`
      @Component({
        template: '<div i18n="@@el">{{«name»}}</div>'
      })
      export class MyComponent {
        name: string;
      }`);
    const marker = mockHost.getReferenceMarkerFor(fileName, 'name');
    const quickInfo = ngLS.getQuickInfoAtPosition(fileName, marker.start);
    expect(quickInfo).toBeTruthy();
    const {textSpan, displayParts} = quickInfo !;
    expect(textSpan).toEqual(marker);
    expect(toText(displayParts)).toBe('(property) MyComponent.name: string');
  });
});

function toText(displayParts?: ts.SymbolDisplayPart[]): string {
  return (displayParts || []).map(p => p.text).join('');
}
