/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgForOfContext} from '@angular/common';

import {ΔdefineComponent} from '../../src/render3/definition';
import {RenderFlags, Δbind, ΔclassMap, Δelement, ΔelementAttribute, ΔelementEnd, ΔelementProperty, ΔelementStart, Δinterpolation1, Δproperty, Δselect, ΔstyleMap, ΔstyleProp, Δstyling, ΔstylingApply, Δtemplate, Δtext, ΔtextBinding} from '../../src/render3/index';
import {AttributeMarker} from '../../src/render3/interfaces/node';
import {bypassSanitizationTrustHtml, bypassSanitizationTrustResourceUrl, bypassSanitizationTrustScript, bypassSanitizationTrustStyle, bypassSanitizationTrustUrl} from '../../src/sanitization/bypass';
import {ΔdefaultStyleSanitizer, ΔsanitizeHtml, ΔsanitizeResourceUrl, ΔsanitizeScript, ΔsanitizeStyle, ΔsanitizeUrl} from '../../src/sanitization/sanitization';
import {Sanitizer, SecurityContext} from '../../src/sanitization/security';
import {StyleSanitizeFn} from '../../src/sanitization/style_sanitizer';

import {NgForOf} from './common_with_def';
import {ComponentFixture, TemplateFixture} from './render_util';

describe('instructions', () => {
  function createAnchor() {
    ΔelementStart(0, 'a');
    Δstyling();
    ΔelementEnd();
  }

  function createDiv(
      initialClasses?: string[] | null, classBindingNames?: string[] | null,
      initialStyles?: string[] | null, styleBindingNames?: string[] | null,
      styleSanitizer?: StyleSanitizeFn) {
    const attrs: any[] = [];
    if (initialClasses) {
      attrs.push(AttributeMarker.Classes, ...initialClasses);
    }
    if (initialStyles) {
      attrs.push(AttributeMarker.Styles, ...initialStyles);
    }
    ΔelementStart(0, 'div', attrs);
    Δstyling(classBindingNames || null, styleBindingNames || null, styleSanitizer);
    ΔelementEnd();
  }

  function createScript() { Δelement(0, 'script'); }

  describe('Δselect', () => {
    it('should error in DevMode if index is out of range', () => {
      // Only one constant added, meaning only index `0` is valid.
      const t = new TemplateFixture(createDiv, () => {}, 1, 0);
      expect(() => { t.update(() => { Δselect(-1); }); }).toThrow();
      expect(() => { t.update(() => { Δselect(1); }); }).toThrow();
      expect(() => { t.update(() => { Δselect(0); }); }).not.toThrow();
    });
  });

  describe('bind', () => {
    it('should update bindings when value changes with the correct perf counters', () => {
      const t = new TemplateFixture(createAnchor, () => {}, 1, 1);

      t.update(() => ΔelementProperty(0, 'title', Δbind('Hello')));
      expect(t.html).toEqual('<a title="Hello"></a>');

      t.update(() => ΔelementProperty(0, 'title', Δbind('World')));
      expect(t.html).toEqual('<a title="World"></a>');
      expect(ngDevMode).toHaveProperties({
        firstTemplatePass: 1,
        tNode: 2,  // 1 for hostElement + 1 for the template under test
        tView: 2,  // 1 for rootView + 1 for the template view
        rendererCreateElement: 1,
        rendererSetProperty: 2
      });
    });

    it('should not update bindings when value does not change, with the correct perf counters',
       () => {
         const idempotentUpdate = () => ΔelementProperty(0, 'title', Δbind('Hello'));
         const t = new TemplateFixture(createAnchor, idempotentUpdate, 1, 1);

         t.update();
         expect(t.html).toEqual('<a title="Hello"></a>');

         t.update();
         expect(t.html).toEqual('<a title="Hello"></a>');
         expect(ngDevMode).toHaveProperties({
           firstTemplatePass: 1,
           tNode: 2,  // 1 for hostElement + 1 for the template under test
           tView: 2,  // 1 for rootView + 1 for the template view
           rendererCreateElement: 1,
           rendererSetProperty: 1
         });
       });
  });

  describe('element', () => {
    it('should create an element with the correct perf counters', () => {
      const t = new TemplateFixture(() => {
        Δelement(0, 'div', ['id', 'test', 'title', 'Hello']);
      }, () => {}, 1);

      const div = (t.hostElement as HTMLElement).querySelector('div') !;
      expect(div.id).toEqual('test');
      expect(div.title).toEqual('Hello');
      expect(ngDevMode).toHaveProperties({
        firstTemplatePass: 1,
        tNode: 2,  // 1 for div, 1 for host element
        tView: 2,  // 1 for rootView + 1 for the template view
        rendererCreateElement: 1,
      });
    });
  });

  describe('elementAttribute', () => {
    it('should use sanitizer function', () => {
      const t = new TemplateFixture(createDiv, () => {}, 1);

      t.update(() => ΔelementAttribute(0, 'title', 'javascript:true', ΔsanitizeUrl));
      expect(t.html).toEqual('<div title="unsafe:javascript:true"></div>');

      t.update(
          () => ΔelementAttribute(
              0, 'title', bypassSanitizationTrustUrl('javascript:true'), ΔsanitizeUrl));
      expect(t.html).toEqual('<div title="javascript:true"></div>');
      expect(ngDevMode).toHaveProperties({
        firstTemplatePass: 1,
        tNode: 2,  // 1 for div, 1 for host element
        tView: 2,  // 1 for rootView + 1 for the template view
        rendererCreateElement: 1,
        rendererSetAttribute: 2
      });
    });
  });

  describe('property', () => {
    /**
     * TODO: We need to replace this with an acceptance test, but for right now,
     * this is the only test that ensures chaining works, since code generation
     * is not producing chained instructions yet.
     */
    it('should chain', () => {
      // <div [title]="title" [accesskey]="key"></div>
      const t = new TemplateFixture(createDiv, () => {}, 1, 2);
      t.update(() => {
        Δselect(0);
        Δproperty('title', 'one')('accessKey', 'A');
      });
      expect(t.html).toEqual('<div accesskey="A" title="one"></div>');
      t.update(() => {
        Δselect(0);
        Δproperty('title', 'two')('accessKey', 'B');
      });
      expect(t.html).toEqual('<div accesskey="B" title="two"></div>');
      expect(ngDevMode).toHaveProperties({
        firstTemplatePass: 1,
        tNode: 2,  // 1 for div, 1 for host element
        tView: 2,  // 1 for rootView + 1 for the template view
        rendererCreateElement: 1,
        rendererSetProperty: 4,
      });
    });

    it('should error in dev mode if Δselect was not called prior', () => {
      const t = new TemplateFixture(createDiv, () => {}, 1, 1);
      expect(() => { t.update(() => { Δproperty('title', 'test'); }); }).toThrow();
      expect(() => {
        t.update(() => {
          Δselect(0);
          Δproperty('title', 'test');
        });
      }).not.toThrow();
    });
  });

  describe('styleProp', () => {
    it('should automatically sanitize unless a bypass operation is applied', () => {
      const t = new TemplateFixture(() => {
        return createDiv(null, null, null, ['background-image'], ΔdefaultStyleSanitizer);
      }, () => {}, 1);
      t.update(() => {
        Δselect(0);
        ΔstyleProp(0, 'url("http://server")');
        ΔstylingApply();
      });
      // nothing is set because sanitizer suppresses it.
      expect(t.html).toEqual('<div></div>');

      t.update(() => {
        Δselect(0);
        ΔstyleProp(0, bypassSanitizationTrustStyle('url("http://server2")'));
        ΔstylingApply();
      });
      expect((t.hostElement.firstChild as HTMLElement).style.getPropertyValue('background-image'))
          .toEqual('url("http://server2")');
    });

    it('should not re-apply the style value even if it is a newly bypassed again', () => {
      const sanitizerInterceptor = new MockSanitizerInterceptor();
      const t = createTemplateFixtureWithSanitizer(
          () => createDiv(
              null, null, null, ['background-image'], sanitizerInterceptor.getStyleSanitizer()),
          1, sanitizerInterceptor);

      t.update(() => {
        Δselect(0);
        ΔstyleProp(0, bypassSanitizationTrustStyle('apple'));
        ΔstylingApply();
      });

      expect(sanitizerInterceptor.lastValue !).toEqual('apple');
      sanitizerInterceptor.lastValue = null;

      t.update(() => {
        Δselect(0);
        ΔstyleProp(0, bypassSanitizationTrustStyle('apple'));
        ΔstylingApply();
      });
      expect(sanitizerInterceptor.lastValue).toEqual(null);
    });
  });

  describe('styleMap', () => {
    function createDivWithStyle() {
      ΔelementStart(0, 'div', [AttributeMarker.Styles, 'height', '10px']);
      Δstyling([], ['height']);
      ΔelementEnd();
    }

    it('should add style', () => {
      const fixture = new TemplateFixture(createDivWithStyle, () => {}, 1);
      fixture.update(() => {
        Δselect(0);
        ΔstyleMap({'background-color': 'red'});
        ΔstylingApply();
      });
      expect(fixture.html).toEqual('<div style="background-color: red; height: 10px;"></div>');
    });

    it('should sanitize new styles that may contain `url` properties', () => {
      const detectedValues: string[] = [];
      const sanitizerInterceptor =
          new MockSanitizerInterceptor(value => { detectedValues.push(value); });
      const fixture = createTemplateFixtureWithSanitizer(
          () => createDiv(null, null, null, null, sanitizerInterceptor.getStyleSanitizer()), 1,
          sanitizerInterceptor);

      fixture.update(() => {
        Δselect(0);
        ΔstyleMap({
          'background-image': 'background-image',
          'background': 'background',
          'border-image': 'border-image',
          'list-style': 'list-style',
          'list-style-image': 'list-style-image',
          'filter': 'filter',
          'width': 'width'
        });
        ΔstylingApply();
      });

      const props = detectedValues.sort();
      expect(props).toEqual([
        'background', 'background-image', 'border-image', 'filter', 'list-style', 'list-style-image'
      ]);
    });
  });

  describe('elementClass', () => {
    function createDivWithStyling() {
      ΔelementStart(0, 'div');
      Δstyling();
      ΔelementEnd();
    }

    it('should add class', () => {
      const fixture = new TemplateFixture(createDivWithStyling, () => {}, 1);
      fixture.update(() => {
        Δselect(0);
        ΔclassMap('multiple classes');
        ΔstylingApply();
      });
      expect(fixture.html).toEqual('<div class="multiple classes"></div>');
    });
  });

  describe('performance counters', () => {
    it('should create tViews only once for each nested level', () => {
      const _c0 = [AttributeMarker.Template, 'ngFor', 'ngForOf'];
      const _c1 = [AttributeMarker.Template, 'ngFor', 'ngForOf'];

      function ToDoAppComponent_NgForOf_Template_0(rf: RenderFlags, ctx0: NgForOfContext<any>) {
        if (rf & RenderFlags.Create) {
          ΔelementStart(0, 'ul');
          Δtemplate(1, ToDoAppComponent_NgForOf_NgForOf_Template_1, 2, 1, 'li', _c1);
          ΔelementEnd();
        }
        if (rf & RenderFlags.Update) {
          const row_r2 = ctx0.$implicit;
          ΔelementProperty(1, 'ngForOf', Δbind(row_r2));
        }
      }

      function ToDoAppComponent_NgForOf_NgForOf_Template_1(
          rf: RenderFlags, ctx1: NgForOfContext<any>) {
        if (rf & RenderFlags.Create) {
          ΔelementStart(0, 'li');
          Δtext(1);
          ΔelementEnd();
        }
        if (rf & RenderFlags.Update) {
          const col_r3 = ctx1.$implicit;
          ΔtextBinding(1, Δinterpolation1('', col_r3, ''));
        }
      }

      /**
       * <ul *ngFor="let row of rows">
       *   <li *ngFor="let col of row.cols">{{col}}</li>
       * </ul>
       */
      class NestedLoops {
        rows = [['a', 'b'], ['A', 'B'], ['a', 'b'], ['A', 'B']];

        static ngComponentDef = ΔdefineComponent({
          type: NestedLoops,
          selectors: [['nested-loops']],
          factory: function ToDoAppComponent_Factory() { return new NestedLoops(); },
          consts: 1,
          vars: 1,
          template: function ToDoAppComponent_Template(rf: RenderFlags, ctx: NestedLoops) {
            if (rf & RenderFlags.Create) {
              Δtemplate(0, ToDoAppComponent_NgForOf_Template_0, 2, 1, 'ul', _c0);
            }
            if (rf & RenderFlags.Update) {
              ΔelementProperty(0, 'ngForOf', Δbind(ctx.rows));
            }
          },
          directives: [NgForOf]
        });
      }
      const fixture = new ComponentFixture(NestedLoops);
      expect(ngDevMode).toHaveProperties({
        // Expect: fixture view/Host view + component + ngForRow + ngForCol
        tView: 4,  // should be: 4,
      });

    });
  });

  describe('sanitization injection compatibility', () => {
    it('should work for url sanitization', () => {
      const s = new LocalMockSanitizer(value => `${value}-sanitized`);
      const t = new TemplateFixture(createAnchor, undefined, 1, 0, null, null, s);
      const inputValue = 'http://foo';
      const outputValue = 'http://foo-sanitized';

      t.update(() => ΔelementAttribute(0, 'href', inputValue, ΔsanitizeUrl));
      expect(t.html).toEqual(`<a href="${outputValue}"></a>`);
      expect(s.lastSanitizedValue).toEqual(outputValue);
    });

    it('should bypass url sanitization if marked by the service', () => {
      const s = new LocalMockSanitizer(value => '');
      const t = new TemplateFixture(createAnchor, undefined, 1, 0, null, null, s);
      const inputValue = s.bypassSecurityTrustUrl('http://foo');
      const outputValue = 'http://foo';

      t.update(() => ΔelementAttribute(0, 'href', inputValue, ΔsanitizeUrl));
      expect(t.html).toEqual(`<a href="${outputValue}"></a>`);
      expect(s.lastSanitizedValue).toBeFalsy();
    });

    it('should bypass ivy-level url sanitization if a custom sanitizer is used', () => {
      const s = new LocalMockSanitizer(value => '');
      const t = new TemplateFixture(createAnchor, undefined, 1, 0, null, null, s);
      const inputValue = bypassSanitizationTrustUrl('http://foo');
      const outputValue = 'http://foo-ivy';

      t.update(() => ΔelementAttribute(0, 'href', inputValue, ΔsanitizeUrl));
      expect(t.html).toEqual(`<a href="${outputValue}"></a>`);
      expect(s.lastSanitizedValue).toBeFalsy();
    });

    it('should work for style sanitization', () => {
      const s = new LocalMockSanitizer(value => `color:blue`);
      const t = new TemplateFixture(createDiv, undefined, 1, 0, null, null, s);
      const inputValue = 'color:red';
      const outputValue = 'color:blue';

      t.update(() => ΔelementAttribute(0, 'style', inputValue, ΔsanitizeStyle));
      expect(stripStyleWsCharacters(t.html)).toEqual(`<div style="${outputValue}"></div>`);
      expect(s.lastSanitizedValue).toEqual(outputValue);
    });

    it('should bypass style sanitization if marked by the service', () => {
      const s = new LocalMockSanitizer(value => '');
      const t = new TemplateFixture(createDiv, undefined, 1, 0, null, null, s);
      const inputValue = s.bypassSecurityTrustStyle('color:maroon');
      const outputValue = 'color:maroon';

      t.update(() => ΔelementAttribute(0, 'style', inputValue, ΔsanitizeStyle));
      expect(stripStyleWsCharacters(t.html)).toEqual(`<div style="${outputValue}"></div>`);
      expect(s.lastSanitizedValue).toBeFalsy();
    });

    it('should bypass ivy-level style sanitization if a custom sanitizer is used', () => {
      const s = new LocalMockSanitizer(value => '');
      const t = new TemplateFixture(createDiv, undefined, 1, 0, null, null, s);
      const inputValue = bypassSanitizationTrustStyle('font-family:foo');
      const outputValue = 'font-family:foo-ivy';

      t.update(() => ΔelementAttribute(0, 'style', inputValue, ΔsanitizeStyle));
      expect(stripStyleWsCharacters(t.html)).toEqual(`<div style="${outputValue}"></div>`);
      expect(s.lastSanitizedValue).toBeFalsy();
    });

    it('should work for resourceUrl sanitization', () => {
      const s = new LocalMockSanitizer(value => `${value}-sanitized`);
      const t = new TemplateFixture(createScript, undefined, 1, 0, null, null, s);
      const inputValue = 'http://resource';
      const outputValue = 'http://resource-sanitized';

      t.update(() => ΔelementAttribute(0, 'src', inputValue, ΔsanitizeResourceUrl));
      expect(t.html).toEqual(`<script src="${outputValue}"></script>`);
      expect(s.lastSanitizedValue).toEqual(outputValue);
    });

    it('should bypass resourceUrl sanitization if marked by the service', () => {
      const s = new LocalMockSanitizer(value => '');
      const t = new TemplateFixture(createScript, undefined, 1, 0, null, null, s);
      const inputValue = s.bypassSecurityTrustResourceUrl('file://all-my-secrets.pdf');
      const outputValue = 'file://all-my-secrets.pdf';

      t.update(() => ΔelementAttribute(0, 'src', inputValue, ΔsanitizeResourceUrl));
      expect(t.html).toEqual(`<script src="${outputValue}"></script>`);
      expect(s.lastSanitizedValue).toBeFalsy();
    });

    it('should bypass ivy-level resourceUrl sanitization if a custom sanitizer is used', () => {
      const s = new LocalMockSanitizer(value => '');
      const t = new TemplateFixture(createScript, undefined, 1, 0, null, null, s);
      const inputValue = bypassSanitizationTrustResourceUrl('file://all-my-secrets.pdf');
      const outputValue = 'file://all-my-secrets.pdf-ivy';

      t.update(() => ΔelementAttribute(0, 'src', inputValue, ΔsanitizeResourceUrl));
      expect(t.html).toEqual(`<script src="${outputValue}"></script>`);
      expect(s.lastSanitizedValue).toBeFalsy();
    });

    it('should work for script sanitization', () => {
      const s = new LocalMockSanitizer(value => `${value} //sanitized`);
      const t = new TemplateFixture(createScript, undefined, 1, 0, null, null, s);
      const inputValue = 'fn();';
      const outputValue = 'fn(); //sanitized';

      t.update(() => ΔelementProperty(0, 'innerHTML', inputValue, ΔsanitizeScript));
      expect(t.html).toEqual(`<script>${outputValue}</script>`);
      expect(s.lastSanitizedValue).toEqual(outputValue);
    });

    it('should bypass script sanitization if marked by the service', () => {
      const s = new LocalMockSanitizer(value => '');
      const t = new TemplateFixture(createScript, undefined, 1, 0, null, null, s);
      const inputValue = s.bypassSecurityTrustScript('alert("bar")');
      const outputValue = 'alert("bar")';

      t.update(() => ΔelementProperty(0, 'innerHTML', inputValue, ΔsanitizeScript));
      expect(t.html).toEqual(`<script>${outputValue}</script>`);
      expect(s.lastSanitizedValue).toBeFalsy();
    });

    it('should bypass ivy-level script sanitization if a custom sanitizer is used', () => {
      const s = new LocalMockSanitizer(value => '');
      const t = new TemplateFixture(createScript, undefined, 1, 0, null, null, s);
      const inputValue = bypassSanitizationTrustScript('alert("bar")');
      const outputValue = 'alert("bar")-ivy';

      t.update(() => ΔelementProperty(0, 'innerHTML', inputValue, ΔsanitizeScript));
      expect(t.html).toEqual(`<script>${outputValue}</script>`);
      expect(s.lastSanitizedValue).toBeFalsy();
    });

    it('should work for html sanitization', () => {
      const s = new LocalMockSanitizer(value => `${value} <!--sanitized-->`);
      const t = new TemplateFixture(createDiv, undefined, 1, 0, null, null, s);
      const inputValue = '<header></header>';
      const outputValue = '<header></header> <!--sanitized-->';

      t.update(() => ΔelementProperty(0, 'innerHTML', inputValue, ΔsanitizeHtml));
      expect(t.html).toEqual(`<div>${outputValue}</div>`);
      expect(s.lastSanitizedValue).toEqual(outputValue);
    });

    it('should bypass html sanitization if marked by the service', () => {
      const s = new LocalMockSanitizer(value => '');
      const t = new TemplateFixture(createDiv, undefined, 1, 0, null, null, s);
      const inputValue = s.bypassSecurityTrustHtml('<div onclick="alert(123)"></div>');
      const outputValue = '<div onclick="alert(123)"></div>';

      t.update(() => ΔelementProperty(0, 'innerHTML', inputValue, ΔsanitizeHtml));
      expect(t.html).toEqual(`<div>${outputValue}</div>`);
      expect(s.lastSanitizedValue).toBeFalsy();
    });

    it('should bypass ivy-level script sanitization if a custom sanitizer is used', () => {
      const s = new LocalMockSanitizer(value => '');
      const t = new TemplateFixture(createDiv, undefined, 1, 0, null, null, s);
      const inputValue = bypassSanitizationTrustHtml('<div onclick="alert(123)"></div>');
      const outputValue = '<div onclick="alert(123)"></div>-ivy';

      t.update(() => ΔelementProperty(0, 'innerHTML', inputValue, ΔsanitizeHtml));
      expect(t.html).toEqual(`<div>${outputValue}</div>`);
      expect(s.lastSanitizedValue).toBeFalsy();
    });
  });
});

class LocalSanitizedValue {
  constructor(public value: any) {}

  toString() { return this.value; }
}

class LocalMockSanitizer implements Sanitizer {
  // TODO(issue/24571): remove '!'.
  public lastSanitizedValue !: string | null;

  constructor(private _interceptor: (value: string|null|any) => string) {}

  sanitize(context: SecurityContext, value: LocalSanitizedValue|string|null|any): string|null {
    if (value instanceof String) {
      return value.toString() + '-ivy';
    }

    if (value instanceof LocalSanitizedValue) {
      return value.toString();
    }

    return this.lastSanitizedValue = this._interceptor(value);
  }

  bypassSecurityTrustHtml(value: string) { return new LocalSanitizedValue(value); }

  bypassSecurityTrustStyle(value: string) { return new LocalSanitizedValue(value); }

  bypassSecurityTrustScript(value: string) { return new LocalSanitizedValue(value); }

  bypassSecurityTrustUrl(value: string) { return new LocalSanitizedValue(value); }

  bypassSecurityTrustResourceUrl(value: string) { return new LocalSanitizedValue(value); }
}

class MockSanitizerInterceptor {
  public lastValue: string|null = null;
  constructor(private _interceptorFn?: ((value: any) => any)|null) {}
  getStyleSanitizer() { return ΔdefaultStyleSanitizer; }
  sanitize(context: SecurityContext, value: LocalSanitizedValue|string|null|any): string|null {
    if (this._interceptorFn) {
      this._interceptorFn(value);
    }
    return this.lastValue = value;
  }
}

function stripStyleWsCharacters(value: string): string {
  // color: blue; => color:blue
  return value.replace(/;/g, '').replace(/:\s+/g, ':');
}

function createTemplateFixtureWithSanitizer(
    buildFn: () => any, consts: number, sanitizer: Sanitizer) {
  return new TemplateFixture(buildFn, () => {}, consts, 0, null, null, sanitizer);
}
