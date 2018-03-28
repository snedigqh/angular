/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {stringifyElement} from '@angular/platform-browser/testing/src/browser_util';

import {CreateComponentOptions} from '../../src/render3/component';
import {ComponentDef, ComponentTemplate, ComponentType, DirectiveDef, DirectiveType, PublicFeature, defineComponent, defineDirective, renderComponent as _renderComponent, tick} from '../../src/render3/index';
import {NG_HOST_SYMBOL, renderTemplate} from '../../src/render3/instructions';
import {DirectiveDefListOrFactory, PipeDefListOrFactory} from '../../src/render3/interfaces/definition';
import {LElementNode} from '../../src/render3/interfaces/node';
import {RElement, RText, Renderer3, RendererFactory3, domRendererFactory3} from '../../src/render3/interfaces/renderer';

import {getRendererFactory2} from './imported_renderer2';

export abstract class BaseFixture {
  hostElement: HTMLElement;

  constructor() {
    this.hostElement = document.createElement('div');
    this.hostElement.setAttribute('fixture', 'mark');
  }

  /**
   * Current state of rendered HTML.
   */
  get html(): string {
    return (this.hostElement as any as Element)
        .innerHTML.replace(/ style=""/g, '')
        .replace(/ class=""/g, '');
  }
}

function noop() {}
/**
 * Fixture for testing template functions in a convenient way.
 *
 * This fixture allows:
 * - specifying the creation block and update block as two separate functions,
 * - maintaining the template state between invocations,
 * - access to the render `html`.
 */
export class TemplateFixture extends BaseFixture {
  hostNode: LElementNode;
  /**
   *
   * @param createBlock Instructions which go into the creation block:
   *          `if (creationMode) { __here__ }`.
   * @param updateBlock Optional instructions which go after the creation block:
   *          `if (creationMode) { ... } __here__`.
   */
  constructor(private createBlock: () => void, private updateBlock: () => void = noop) {
    super();
    this.updateBlock = updateBlock || function() {};
    this.hostNode = renderTemplate(this.hostElement, (ctx: any, cm: boolean) => {
      if (cm) {
        this.createBlock();
      }
      this.updateBlock();
    }, null !, domRendererFactory3, null);
  }

  /**
   * Update the existing template
   *
   * @param updateBlock Optional update block.
   */
  update(updateBlock?: () => void): void {
    renderTemplate(
        this.hostNode.native, updateBlock || this.updateBlock, null !, domRendererFactory3,
        this.hostNode);
  }
}


/**
 * Fixture for testing Components in a convenient way.
 */
export class ComponentFixture<T> extends BaseFixture {
  component: T;
  requestAnimationFrame: {(fn: () => void): void; flush(): void; queue: (() => void)[];};

  constructor(private componentType: ComponentType<T>) {
    super();
    this.requestAnimationFrame = function(fn: () => void) {
      requestAnimationFrame.queue.push(fn);
    } as any;
    this.requestAnimationFrame.queue = [];
    this.requestAnimationFrame.flush = function() {
      while (requestAnimationFrame.queue.length) {
        requestAnimationFrame.queue.shift() !();
      }
    };

    this.component = _renderComponent(componentType, {
      host: this.hostElement,
      scheduler: this.requestAnimationFrame,
    });
  }

  update(): void {
    tick(this.component);
    this.requestAnimationFrame.flush();
  }
}

///////////////////////////////////////////////////////////////////////////////////
// The methods below use global state and we should stop using them.
// Fixtures above are preferred way of testing Components and Templates
///////////////////////////////////////////////////////////////////////////////////

export const document = ((global || window) as any).document;
export let containerEl: HTMLElement = null !;
let host: LElementNode|null;
const isRenderer2 =
    typeof process == 'object' && process.argv[3] && process.argv[3] === '--r=renderer2';
// tslint:disable-next-line:no-console
console.log(`Running tests with ${!isRenderer2 ? 'document' : 'Renderer2'} renderer...`);
const testRendererFactory: RendererFactory3 =
    isRenderer2 ? getRendererFactory2(document) : domRendererFactory3;

export const requestAnimationFrame:
    {(fn: () => void): void; flush(): void; queue: (() => void)[];} = function(fn: () => void) {
      requestAnimationFrame.queue.push(fn);
    } as any;
requestAnimationFrame.flush = function() {
  while (requestAnimationFrame.queue.length) {
    requestAnimationFrame.queue.shift() !();
  }
};

export function resetDOM() {
  requestAnimationFrame.queue = [];
  if (containerEl) {
    try {
      document.body.removeChild(containerEl);
    } catch (e) {
    }
  }
  containerEl = document.createElement('div');
  containerEl.setAttribute('host', '');
  document.body.appendChild(containerEl);
  host = null;
  // TODO: assert that the global state is clean (e.g. ngData, previousOrParentNode, etc)
}

/**
 * @deprecated use `TemplateFixture` or `ComponentFixture`
 */
export function renderToHtml(
    template: ComponentTemplate<any>, ctx: any, directives?: DirectiveDefListOrFactory | null,
    pipes?: PipeDefListOrFactory | null, providedRendererFactory?: RendererFactory3 | null) {
  host = renderTemplate(
      containerEl, template, ctx, providedRendererFactory || testRendererFactory, host,
      directives || null, pipes || null);
  return toHtml(containerEl);
}

beforeEach(resetDOM);

/**
 * @deprecated use `TemplateFixture` or `ComponentFixture`
 */
export function renderComponent<T>(type: ComponentType<T>, opts?: CreateComponentOptions): T {
  return _renderComponent(type, {
    rendererFactory: opts && opts.rendererFactory || testRendererFactory,
    host: containerEl,
    scheduler: requestAnimationFrame,
    hostFeatures: opts && opts.hostFeatures
  });
}

/**
 * @deprecated use `TemplateFixture` or `ComponentFixture`
 */
export function toHtml<T>(componentOrElement: T | RElement): string {
  const node = (componentOrElement as any)[NG_HOST_SYMBOL] as LElementNode;
  if (node) {
    return toHtml(node.native);
  } else {
    return stringifyElement(componentOrElement)
        .replace(/^<div host="">/, '')
        .replace(/<\/div>$/, '')
        .replace(' style=""', '')
        .replace(/<!--[\w]*-->/g, '');
  }
}

export function createComponent(
    name: string, template: ComponentTemplate<any>, directives: DirectiveDefListOrFactory = [],
    pipes: PipeDefListOrFactory = []): ComponentType<any> {
  return class Component {
    value: any;
    static ngComponentDef = defineComponent({
      type: Component,
      selector: [[[name], null]],
      factory: () => new Component,
      template: template,
      features: [PublicFeature],
      directiveDefs: directives,
      pipeDefs: pipes
    });
  };
}

export function createDirective(
    name: string, {exportAs}: {exportAs?: string} = {}): DirectiveType<any> {
  return class Directive {
    static ngDirectiveDef = defineDirective({
      type: Directive,
      selector: [[['', name, ''], null]],
      factory: () => new Directive(),
      features: [PublicFeature],
      exportAs: exportAs,
    });
  };
}


// Verify that DOM is a type of render. This is here for error checking only and has no use.
export const renderer: Renderer3 = null as any as Document;
export const element: RElement = null as any as HTMLElement;
export const text: RText = null as any as Text;
