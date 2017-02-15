/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {APP_ID, Inject, Injectable, NgZone, RenderComponentType, Renderer, RendererV2, RootRenderer, ViewEncapsulation} from '@angular/core';
import {AnimationDriver, DOCUMENT} from '@angular/platform-browser';

import {isBlank, isPresent, stringify} from './facade/lang';
import {AnimationKeyframe, AnimationPlayer, AnimationStyles, RenderDebugInfo} from './private_import_core';
import {NAMESPACE_URIS, SharedStylesHost, flattenStyles, getDOM, isNamespaced, shimContentAttribute, shimHostAttribute, splitNamespace} from './private_import_platform-browser';

const TEMPLATE_COMMENT_TEXT = 'template bindings={}';
const TEMPLATE_BINDINGS_EXP = /^template bindings=(.*)$/;

@Injectable()
export class ServerRootRenderer implements RootRenderer {
  protected registeredComponents: Map<string, ServerRenderer> = new Map<string, ServerRenderer>();
  constructor(
      @Inject(DOCUMENT) public document: any, public sharedStylesHost: SharedStylesHost,
      public animationDriver: AnimationDriver, @Inject(APP_ID) public appId: string,
      private _zone: NgZone) {}
  renderComponent(componentProto: RenderComponentType): Renderer {
    let renderer = this.registeredComponents.get(componentProto.id);
    if (!renderer) {
      renderer = new ServerRenderer(
          this, componentProto, this.animationDriver, `${this.appId}-${componentProto.id}`,
          this._zone);
      this.registeredComponents.set(componentProto.id, renderer);
    }
    return renderer;
  }
}

export class ServerRenderer implements Renderer {
  private _contentAttr: string;
  private _hostAttr: string;
  private _styles: string[];

  constructor(
      private _rootRenderer: ServerRootRenderer, private componentProto: RenderComponentType,
      private _animationDriver: AnimationDriver, styleShimId: string, private _zone: NgZone) {
    this._styles = flattenStyles(styleShimId, componentProto.styles, []);
    if (componentProto.encapsulation === ViewEncapsulation.Native) {
      throw new Error('Native encapsulation is not supported on the server!');
    }
    if (this.componentProto.encapsulation === ViewEncapsulation.Emulated) {
      this._contentAttr = shimContentAttribute(styleShimId);
      this._hostAttr = shimHostAttribute(styleShimId);
    } else {
      this._contentAttr = null;
      this._hostAttr = null;
    }
  }

  selectRootElement(selectorOrNode: string|any, debugInfo: RenderDebugInfo): Element {
    let el: any /** TODO #9100 */;
    if (typeof selectorOrNode === 'string') {
      el = getDOM().querySelector(this._rootRenderer.document, selectorOrNode);
      if (isBlank(el)) {
        throw new Error(`The selector "${selectorOrNode}" did not match any elements`);
      }
    } else {
      el = selectorOrNode;
    }
    getDOM().clearNodes(el);
    return el;
  }

  createElement(parent: Element, name: string, debugInfo: RenderDebugInfo): Node {
    let el: any;
    if (isNamespaced(name)) {
      const nsAndName = splitNamespace(name);
      el = getDOM().createElementNS(NAMESPACE_URIS[nsAndName[0]], nsAndName[1]);
    } else {
      el = getDOM().createElement(name);
    }
    if (isPresent(this._contentAttr)) {
      getDOM().setAttribute(el, this._contentAttr, '');
    }
    if (isPresent(parent)) {
      getDOM().appendChild(parent, el);
    }
    return el;
  }

  createViewRoot(hostElement: any): any {
    let nodesParent: any /** TODO #9100 */;
    if (isPresent(this._hostAttr)) {
      getDOM().setAttribute(hostElement, this._hostAttr, '');
    }
    nodesParent = hostElement;
    return nodesParent;
  }

  createTemplateAnchor(parentElement: any, debugInfo: RenderDebugInfo): any {
    const comment = getDOM().createComment(TEMPLATE_COMMENT_TEXT);
    if (isPresent(parentElement)) {
      getDOM().appendChild(parentElement, comment);
    }
    return comment;
  }

  createText(parentElement: any, value: string, debugInfo: RenderDebugInfo): any {
    const node = getDOM().createTextNode(value);
    if (isPresent(parentElement)) {
      getDOM().appendChild(parentElement, node);
    }
    return node;
  }

  projectNodes(parentElement: any, nodes: any[]) {
    if (isBlank(parentElement)) return;
    appendNodes(parentElement, nodes);
  }

  attachViewAfter(node: any, viewRootNodes: any[]) { moveNodesAfterSibling(node, viewRootNodes); }

  detachView(viewRootNodes: any[]) {
    for (let i = 0; i < viewRootNodes.length; i++) {
      getDOM().remove(viewRootNodes[i]);
    }
  }

  destroyView(hostElement: any, viewAllNodes: any[]) {}

  listen(renderElement: any, name: string, callback: Function): Function {
    // Note: We are not using the EventsPlugin here as this is not needed
    // to run our tests.
    const outsideHandler = (event: any) => this._zone.runGuarded(() => callback(event));
    return this._zone.runOutsideAngular(
        () => getDOM().onAndCancel(renderElement, name, outsideHandler));
  }

  listenGlobal(target: string, name: string, callback: Function): Function {
    const renderElement = getDOM().getGlobalEventTarget(this._rootRenderer.document, target);
    return this.listen(renderElement, name, callback);
  }

  setElementProperty(renderElement: any, propertyName: string, propertyValue: any): void {
    getDOM().setProperty(renderElement, propertyName, propertyValue);
  }

  setElementAttribute(renderElement: any, attributeName: string, attributeValue: string): void {
    let attrNs: string;
    let attrNameWithoutNs = attributeName;
    if (isNamespaced(attributeName)) {
      const nsAndName = splitNamespace(attributeName);
      attrNameWithoutNs = nsAndName[1];
      attributeName = nsAndName[0] + ':' + nsAndName[1];
      attrNs = NAMESPACE_URIS[nsAndName[0]];
    }
    if (isPresent(attributeValue)) {
      if (isPresent(attrNs)) {
        getDOM().setAttributeNS(renderElement, attrNs, attributeName, attributeValue);
      } else {
        getDOM().setAttribute(renderElement, attributeName, attributeValue);
      }
    } else {
      if (isPresent(attrNs)) {
        getDOM().removeAttributeNS(renderElement, attrNs, attrNameWithoutNs);
      } else {
        getDOM().removeAttribute(renderElement, attributeName);
      }
    }
  }

  setBindingDebugInfo(renderElement: any, propertyName: string, propertyValue: string): void {
    if (getDOM().isCommentNode(renderElement)) {
      const existingBindings =
          getDOM().getText(renderElement).replace(/\n/g, '').match(TEMPLATE_BINDINGS_EXP);
      const parsedBindings = JSON.parse(existingBindings[1]);
      (parsedBindings as any /** TODO #9100 */)[propertyName] = propertyValue;
      getDOM().setText(
          renderElement,
          TEMPLATE_COMMENT_TEXT.replace('{}', JSON.stringify(parsedBindings, null, 2)));
    } else {
      this.setElementAttribute(renderElement, propertyName, propertyValue);
    }
  }

  setElementClass(renderElement: any, className: string, isAdd: boolean): void {
    if (isAdd) {
      getDOM().addClass(renderElement, className);
    } else {
      getDOM().removeClass(renderElement, className);
    }
  }

  setElementStyle(renderElement: any, styleName: string, styleValue: string): void {
    if (isPresent(styleValue)) {
      getDOM().setStyle(renderElement, styleName, stringify(styleValue));
    } else {
      getDOM().removeStyle(renderElement, styleName);
    }
  }

  invokeElementMethod(renderElement: any, methodName: string, args: any[]): void {
    getDOM().invoke(renderElement, methodName, args);
  }

  setText(renderNode: any, text: string): void { getDOM().setText(renderNode, text); }

  animate(
      element: any, startingStyles: AnimationStyles, keyframes: AnimationKeyframe[],
      duration: number, delay: number, easing: string,
      previousPlayers: AnimationPlayer[] = []): AnimationPlayer {
    return this._animationDriver.animate(
        element, startingStyles, keyframes, duration, delay, easing, previousPlayers);
  }
}

function moveNodesAfterSibling(ref: any, nodes: any) {
  const parent = getDOM().parentElement(ref);
  if (nodes.length > 0 && parent) {
    const nextSibling = getDOM().nextSibling(ref);
    if (nextSibling) {
      for (let i = 0; i < nodes.length; i++) {
        getDOM().insertBefore(parent, nextSibling, nodes[i]);
      }
    } else {
      for (let i = 0; i < nodes.length; i++) {
        getDOM().appendChild(parent, nodes[i]);
      }
    }
  }
}

function appendNodes(parent: any, nodes: any) {
  for (let i = 0; i < nodes.length; i++) {
    getDOM().appendChild(parent, nodes[i]);
  }
}

@Injectable()
export class ServerRendererV2 implements RendererV2 {
  constructor(private ngZone: NgZone, @Inject(DOCUMENT) private document: any) {}

  createElement(name: string, namespace?: string, debugInfo?: any): any {
    if (namespace) {
      return getDOM().createElementNS(NAMESPACE_URIS[namespace], name);
    }

    return getDOM().createElement(name);
  }

  createComment(value: string, debugInfo?: any): any { return getDOM().createComment(value); }

  createText(value: string, debugInfo?: any): any { return getDOM().createTextNode(value); }

  appendChild(parent: any, newChild: any): void { getDOM().appendChild(parent, newChild); }

  insertBefore(parent: any, newChild: any, refChild: any): void {
    if (parent) {
      getDOM().insertBefore(parent, refChild, newChild);
    }
  }

  removeChild(parent: any, oldChild: any): void {
    if (parent) {
      getDOM().removeChild(parent, oldChild);
    }
  }

  selectRootElement(selectorOrNode: string|any, debugInfo?: any): any {
    let el: any;
    if (typeof selectorOrNode === 'string') {
      el = getDOM().querySelector(this.document, selectorOrNode);
      if (!el) {
        throw new Error(`The selector "${selectorOrNode}" did not match any elements`);
      }
    } else {
      el = selectorOrNode;
    }
    getDOM().clearNodes(el);
    return el;
  }

  parentNode(node: any): any { return getDOM().parentElement(node); }

  nextSibling(node: any): any { return getDOM().nextSibling(node); }

  setAttribute(el: any, name: string, value: string, namespace?: string): void {
    if (namespace) {
      getDOM().setAttributeNS(el, NAMESPACE_URIS[namespace], namespace + ':' + name, value);
    } else {
      getDOM().setAttribute(el, name, value);
    }
  }

  removeAttribute(el: any, name: string, namespace?: string): void {
    if (namespace) {
      getDOM().removeAttributeNS(el, NAMESPACE_URIS[namespace], name);
    } else {
      getDOM().removeAttribute(el, name);
    }
  }

  setBindingDebugInfo(el: any, propertyName: string, propertyValue: string): void {
    if (getDOM().isCommentNode(el)) {
      const m = getDOM().getText(el).replace(/\n/g, '').match(TEMPLATE_BINDINGS_EXP);
      const obj = m === null ? {} : JSON.parse(m[1]);
      obj[propertyName] = propertyValue;
      getDOM().setText(el, TEMPLATE_COMMENT_TEXT.replace('{}', JSON.stringify(obj, null, 2)));
    } else {
      this.setAttribute(el, propertyName, propertyValue);
    }
  }

  removeBindingDebugInfo(el: any, propertyName: string): void {
    if (getDOM().isCommentNode(el)) {
      const m = getDOM().getText(el).replace(/\n/g, '').match(TEMPLATE_BINDINGS_EXP);
      const obj = m === null ? {} : JSON.parse(m[1]);
      delete obj[propertyName];
      getDOM().setText(el, TEMPLATE_COMMENT_TEXT.replace('{}', JSON.stringify(obj, null, 2)));
    } else {
      this.removeAttribute(el, propertyName);
    }
  }

  addClass(el: any, name: string): void { getDOM().addClass(el, name); }

  removeClass(el: any, name: string): void { getDOM().removeClass(el, name); }

  setStyle(el: any, style: string, value: any, hasVendorPrefix: boolean, hasImportant: boolean):
      void {
    getDOM().setStyle(el, style, value);
  }

  removeStyle(el: any, style: string, hasVendorPrefix: boolean): void {
    getDOM().removeStyle(el, style);
  }

  setProperty(el: any, name: string, value: any): void { getDOM().setProperty(el, name, value); }

  setText(node: any, value: string): void { getDOM().setText(node, value); }

  listen(
      target: 'document'|'window'|'body'|any, eventName: string,
      callback: (event: any) => boolean): () => void {
    // Note: We are not using the EventsPlugin here as this is not needed
    // to run our tests.
    const el =
        typeof target === 'string' ? getDOM().getGlobalEventTarget(this.document, target) : target;
    const outsideHandler = (event: any) => this.ngZone.runGuarded(() => callback(event));
    return this.ngZone.runOutsideAngular(() => getDOM().onAndCancel(el, eventName, outsideHandler));
  }
}
