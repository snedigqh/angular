/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {CompileDirectiveMetadata} from '../compile_metadata';
import {EventHandlerVars, convertActionBinding} from '../compiler_util/expression_converter';
import {isPresent} from '../facade/lang';
import {identifierToken} from '../identifiers';
import * as o from '../output/output_ast';
import {BoundEventAst, DirectiveAst} from '../template_parser/template_ast';

import {CompileElement} from './compile_element';
import {CompileMethod} from './compile_method';
import {ViewProperties} from './constants';

export class CompileEventListener {
  private _method: CompileMethod;
  private _hasComponentHostListener: boolean = false;
  private _methodName: string;
  private _eventParam: o.FnParam;
  private _actionResultExprs: o.Expression[] = [];

  static getOrCreate(
      compileElement: CompileElement, eventTarget: string, eventName: string, eventPhase: string,
      targetEventListeners: CompileEventListener[]): CompileEventListener {
    var listener = targetEventListeners.find(
        listener => listener.eventTarget == eventTarget && listener.eventName == eventName &&
            listener.eventPhase == eventPhase);
    if (!listener) {
      listener = new CompileEventListener(
          compileElement, eventTarget, eventName, eventPhase, targetEventListeners.length);
      targetEventListeners.push(listener);
    }
    return listener;
  }

  get methodName() { return this._methodName; }
  get isAnimation() { return !!this.eventPhase; }

  constructor(
      public compileElement: CompileElement, public eventTarget: string, public eventName: string,
      public eventPhase: string, listenerIndex: number) {
    this._method = new CompileMethod(compileElement.view);
    this._methodName =
        `_handle_${sanitizeEventName(eventName)}_${compileElement.nodeIndex}_${listenerIndex}`;
    this._eventParam = new o.FnParam(
        EventHandlerVars.event.name,
        o.importType(this.compileElement.view.genConfig.renderTypes.renderEvent));
  }

  addAction(
      hostEvent: BoundEventAst, directive: CompileDirectiveMetadata,
      directiveInstance: o.Expression) {
    if (isPresent(directive) && directive.isComponent) {
      this._hasComponentHostListener = true;
    }
    this._method.resetDebugInfo(this.compileElement.nodeIndex, hostEvent);
    var context = directiveInstance || this.compileElement.view.componentContext;
    const view = this.compileElement.view;
    const evalResult = convertActionBinding(
        view, directive ? null : view, context, hostEvent.handler,
        `${this.compileElement.nodeIndex}_${this._actionResultExprs.length}`);
    if (evalResult.preventDefault) {
      this._actionResultExprs.push(evalResult.preventDefault);
    }
    this._method.addStmts(evalResult.stmts);
  }

  finishMethod() {
    var markPathToRootStart = this._hasComponentHostListener ?
        this.compileElement.appElement.prop('componentView') :
        o.THIS_EXPR;
    var resultExpr: o.Expression = o.literal(true);
    this._actionResultExprs.forEach((expr) => { resultExpr = resultExpr.and(expr); });
    var stmts =
        (<o.Statement[]>[markPathToRootStart.callMethod('markPathToRootAsCheckOnce', []).toStmt()])
            .concat(this._method.finish())
            .concat([new o.ReturnStatement(resultExpr)]);
    // private is fine here as no child view will reference the event handler...
    this.compileElement.view.methods.push(new o.ClassMethod(
        this._methodName, [this._eventParam], stmts, o.BOOL_TYPE, [o.StmtModifier.Private]));
  }

  listenToRenderer() {
    var listenExpr: o.Expression;
    var eventListener = o.THIS_EXPR.callMethod(
        'eventHandler',
        [o.THIS_EXPR.prop(this._methodName).callMethod(o.BuiltinMethod.Bind, [o.THIS_EXPR])]);
    if (isPresent(this.eventTarget)) {
      listenExpr = ViewProperties.renderer.callMethod(
          'listenGlobal', [o.literal(this.eventTarget), o.literal(this.eventName), eventListener]);
    } else {
      listenExpr = ViewProperties.renderer.callMethod(
          'listen', [this.compileElement.renderNode, o.literal(this.eventName), eventListener]);
    }
    var disposable = o.variable(`disposable_${this.compileElement.view.disposables.length}`);
    this.compileElement.view.disposables.push(disposable);
    // private is fine here as no child view will reference the event handler...
    this.compileElement.view.createMethod.addStmt(
        disposable.set(listenExpr).toDeclStmt(o.FUNCTION_TYPE, [o.StmtModifier.Private]));
  }

  listenToAnimation(animationTransitionVar: o.ReadVarExpr): o.Statement {
    const callbackMethod = this.eventPhase == 'start' ? 'onStart' : 'onDone';
    return animationTransitionVar
        .callMethod(
            callbackMethod,
            [o.THIS_EXPR.prop(this.methodName).callMethod(o.BuiltinMethod.Bind, [o.THIS_EXPR])])
        .toStmt();
  }

  listenToDirective(directiveInstance: o.Expression, observablePropName: string) {
    var subscription = o.variable(`subscription_${this.compileElement.view.subscriptions.length}`);
    this.compileElement.view.subscriptions.push(subscription);
    var eventListener = o.THIS_EXPR.callMethod(
        'eventHandler',
        [o.THIS_EXPR.prop(this._methodName).callMethod(o.BuiltinMethod.Bind, [o.THIS_EXPR])]);
    this.compileElement.view.createMethod.addStmt(
        subscription
            .set(directiveInstance.prop(observablePropName)
                     .callMethod(o.BuiltinMethod.SubscribeObservable, [eventListener]))
            .toDeclStmt(null, [o.StmtModifier.Final]));
  }
}

export function collectEventListeners(
    hostEvents: BoundEventAst[], dirs: DirectiveAst[],
    compileElement: CompileElement): CompileEventListener[] {
  const eventListeners: CompileEventListener[] = [];

  hostEvents.forEach((hostEvent) => {
    var listener = CompileEventListener.getOrCreate(
        compileElement, hostEvent.target, hostEvent.name, hostEvent.phase, eventListeners);
    listener.addAction(hostEvent, null, null);
  });

  dirs.forEach((directiveAst) => {
    var directiveInstance =
        compileElement.instances.get(identifierToken(directiveAst.directive.type).reference);
    directiveAst.hostEvents.forEach((hostEvent) => {
      var listener = CompileEventListener.getOrCreate(
          compileElement, hostEvent.target, hostEvent.name, hostEvent.phase, eventListeners);
      listener.addAction(hostEvent, directiveAst.directive, directiveInstance);
    });
  });

  eventListeners.forEach((listener) => listener.finishMethod());
  return eventListeners;
}

export function bindDirectiveOutputs(
    directiveAst: DirectiveAst, directiveInstance: o.Expression,
    eventListeners: CompileEventListener[]) {
  Object.keys(directiveAst.directive.outputs).forEach(observablePropName => {
    const eventName = directiveAst.directive.outputs[observablePropName];

    eventListeners.filter(listener => listener.eventName == eventName).forEach((listener) => {
      listener.listenToDirective(directiveInstance, observablePropName);
    });
  });
}

export function bindRenderOutputs(eventListeners: CompileEventListener[]) {
  eventListeners.forEach(listener => {
    // the animation listeners are handled within property_binder.ts to
    // allow them to be placed next to the animation factory statements
    if (!listener.isAnimation) {
      listener.listenToRenderer();
    }
  });
}

function convertStmtIntoExpression(stmt: o.Statement): o.Expression {
  if (stmt instanceof o.ExpressionStatement) {
    return stmt.expr;
  } else if (stmt instanceof o.ReturnStatement) {
    return stmt.value;
  }
  return null;
}

function sanitizeEventName(name: string): string {
  return name.replace(/[^a-zA-Z_]/g, '_');
}
