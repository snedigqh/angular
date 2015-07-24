import {Inject, Injectable} from 'angular2/di';
import {isPresent} from 'angular2/src/facade/lang';
import {MapWrapper, ListWrapper, List, Map} from 'angular2/src/facade/collection';
import {PromiseWrapper, Promise} from 'angular2/src/facade/async';
import {DOM} from 'angular2/src/dom/dom_adapter';

import {DomRenderer, DOCUMENT_TOKEN} from 'angular2/src/render/dom/dom_renderer';
import {DefaultDomCompiler} from 'angular2/src/render/dom/compiler/compiler';
import {
  RenderViewWithFragments,
  RenderFragmentRef,
  RenderViewRef,
  ProtoViewDto,
  ViewDefinition,
  RenderEventDispatcher,
  DirectiveMetadata,
  RenderElementRef,
  RenderProtoViewMergeMapping,
  RenderProtoViewRef
} from 'angular2/src/render/api';
import {resolveInternalDomView} from 'angular2/src/render/dom/view/view';
import {resolveInternalDomFragment} from 'angular2/src/render/dom/view/fragment';
import {el, dispatchEvent} from 'angular2/test_lib';

export class TestRootView {
  viewRef: RenderViewRef;
  fragments: RenderFragmentRef[];
  hostElement: Element;
  events: List<List<any>>;

  constructor(viewWithFragments: RenderViewWithFragments) {
    this.viewRef = viewWithFragments.viewRef;
    this.fragments = viewWithFragments.fragmentRefs;
    this.hostElement = <Element>resolveInternalDomFragment(this.fragments[0])[0];
    this.events = [];
  }
}

export class TestRenderElementRef implements RenderElementRef {
  constructor(public renderView: RenderViewRef, public renderBoundElementIndex: number) {}
}

export function elRef(renderView: RenderViewRef, boundElementIndex: number) {
  return new TestRenderElementRef(renderView, boundElementIndex);
}

export function rootNodes(view: RenderViewRef) {}

class LoggingEventDispatcher implements RenderEventDispatcher {
  log: List<List<any>>;

  constructor(log: List<List<any>>) { this.log = log; }

  dispatchRenderEvent(elementIndex: number, eventName: string, locals: Map<string, any>) {
    this.log.push([elementIndex, eventName, locals]);
    return true;
  }
}


@Injectable()
export class DomTestbed {
  renderer: DomRenderer;
  compiler: DefaultDomCompiler;
  rootEl;

  constructor(renderer: DomRenderer, compiler: DefaultDomCompiler,
              @Inject(DOCUMENT_TOKEN) document) {
    this.renderer = renderer;
    this.compiler = compiler;
    this.rootEl = el('<div id="root" class="rootElem"></div>');
    var oldRoots = DOM.querySelectorAll(document, '#root');
    for (var i = 0; i < oldRoots.length; i++) {
      DOM.remove(oldRoots[i]);
    }
    DOM.appendChild(DOM.querySelector(document, 'body'), this.rootEl);
  }

  compile(host: DirectiveMetadata, componentViews: ViewDefinition[]): Promise<ProtoViewDto[]> {
    var promises = [this.compiler.compileHost(host)];
    componentViews.forEach(view => promises.push(this.compiler.compile(view)));
    return PromiseWrapper.all(promises);
  }

  merge(protoViews: List<ProtoViewDto | RenderProtoViewRef>): Promise<RenderProtoViewMergeMapping> {
    return this.compiler.mergeProtoViewsRecursively(collectMergeRenderProtoViewsRecurse(
        <ProtoViewDto>protoViews[0], ListWrapper.slice(protoViews, 1)));
  }

  compileAndMerge(host: DirectiveMetadata,
                  componentViews: ViewDefinition[]): Promise<RenderProtoViewMergeMapping> {
    return this.compile(host, componentViews).then(protoViewDtos => this.merge(protoViewDtos));
  }

  _createTestView(viewWithFragments: RenderViewWithFragments) {
    var testView = new TestRootView(viewWithFragments);
    this.renderer.setEventDispatcher(viewWithFragments.viewRef,
                                     new LoggingEventDispatcher(testView.events));
    return testView;
  }

  createView(protoView: RenderProtoViewMergeMapping): TestRootView {
    var viewWithFragments = this.renderer.createView(protoView.mergedProtoViewRef, 0);
    this.renderer.hydrateView(viewWithFragments.viewRef);
    return this._createTestView(viewWithFragments);
  }

  triggerEvent(elementRef: RenderElementRef, eventName: string) {
    var element = resolveInternalDomView(elementRef.renderView)
                      .boundElements[elementRef.renderBoundElementIndex];
    dispatchEvent(element, eventName);
  }
}

function collectMergeRenderProtoViewsRecurse(current: ProtoViewDto,
                                             components: List<ProtoViewDto | RenderProtoViewRef>):
    List<RenderProtoViewRef | List<any>> {
  var result = [current.render];
  current.elementBinders.forEach((elementBinder) => {
    if (isPresent(elementBinder.nestedProtoView)) {
      result.push(collectMergeRenderProtoViewsRecurse(elementBinder.nestedProtoView, components));
    } else if (elementBinder.directives.length > 0) {
      if (components.length > 0) {
        var comp = components.shift();
        if (comp instanceof ProtoViewDto) {
          result.push(collectMergeRenderProtoViewsRecurse(comp, components));
        } else {
          result.push(comp);
        }
      } else {
        result.push(null);
      }
    }
  });
  return result;
}
