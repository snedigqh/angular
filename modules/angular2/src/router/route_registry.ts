import {ListWrapper, Map, MapWrapper, StringMapWrapper} from 'angular2/src/facade/collection';
import {Promise, PromiseWrapper} from 'angular2/src/facade/async';
import {
  isPresent,
  isArray,
  isBlank,
  isType,
  isString,
  isStringMap,
  isFunction,
  StringWrapper,
  Type,
  getTypeNameForDebugging
} from 'angular2/src/facade/lang';
import {BaseException, WrappedException} from 'angular2/src/facade/exceptions';
import {reflector} from 'angular2/src/core/reflection/reflection';
import {
  RouteConfig,
  AsyncRoute,
  Route,
  AuxRoute,
  Redirect,
  RouteDefinition
} from './route_config_impl';
import {PathMatch, RedirectMatch, RouteMatch} from './route_recognizer';
import {ComponentRecognizer} from './component_recognizer';
import {
  Instruction,
  ResolvedInstruction,
  RedirectInstruction,
  UnresolvedInstruction,
  DefaultInstruction
} from './instruction';

import {Injectable} from 'angular2/angular2';
import {normalizeRouteConfig, assertComponentExists} from './route_config_nomalizer';
import {parser, Url, pathSegmentsToUrl} from './url_parser';

var _resolveToNull = PromiseWrapper.resolve(null);

/**
 * The RouteRegistry holds route configurations for each component in an Angular app.
 * It is responsible for creating Instructions from URLs, and generating URLs based on route and
 * parameters.
 */
@Injectable()
export class RouteRegistry {
  private _rules = new Map<any, ComponentRecognizer>();

  /**
   * Given a component and a configuration object, add the route to this registry
   */
  config(parentComponent: any, config: RouteDefinition): void {
    config = normalizeRouteConfig(config, this);

    // this is here because Dart type guard reasons
    if (config instanceof Route) {
      assertComponentExists(config.component, config.path);
    } else if (config instanceof AuxRoute) {
      assertComponentExists(config.component, config.path);
    }

    var recognizer: ComponentRecognizer = this._rules.get(parentComponent);

    if (isBlank(recognizer)) {
      recognizer = new ComponentRecognizer();
      this._rules.set(parentComponent, recognizer);
    }

    var terminal = recognizer.config(config);

    if (config instanceof Route) {
      if (terminal) {
        assertTerminalComponent(config.component, config.path);
      } else {
        this.configFromComponent(config.component);
      }
    }
  }

  /**
   * Reads the annotations of a component and configures the registry based on them
   */
  configFromComponent(component: any): void {
    if (!isType(component)) {
      return;
    }

    // Don't read the annotations from a type more than once –
    // this prevents an infinite loop if a component routes recursively.
    if (this._rules.has(component)) {
      return;
    }
    var annotations = reflector.annotations(component);
    if (isPresent(annotations)) {
      for (var i = 0; i < annotations.length; i++) {
        var annotation = annotations[i];

        if (annotation instanceof RouteConfig) {
          let routeCfgs: RouteDefinition[] = annotation.configs;
          routeCfgs.forEach(config => this.config(component, config));
        }
      }
    }
  }


  /**
   * Given a URL and a parent component, return the most specific instruction for navigating
   * the application into the state specified by the url
   */
  recognize(url: string, ancestorComponents: any[]): Promise<Instruction> {
    var parsedUrl = parser.parse(url);
    return this._recognize(parsedUrl, ancestorComponents);
  }


  /**
   * Recognizes all parent-child routes, but creates unresolved auxiliary routes
   */

  private _recognize(parsedUrl: Url, ancestorComponents: any[],
                     _aux = false): Promise<Instruction> {
    var parentComponent = ancestorComponents[ancestorComponents.length - 1];
    var componentRecognizer = this._rules.get(parentComponent);
    if (isBlank(componentRecognizer)) {
      return _resolveToNull;
    }

    // Matches some beginning part of the given URL
    var possibleMatches: Promise<RouteMatch>[] =
        _aux ? componentRecognizer.recognizeAuxiliary(parsedUrl) :
               componentRecognizer.recognize(parsedUrl);

    var matchPromises: Promise<Instruction>[] = possibleMatches.map(
        (candidate: Promise<RouteMatch>) => candidate.then((candidate: RouteMatch) => {

          if (candidate instanceof PathMatch) {
            if (candidate.instruction.terminal) {
              var unresolvedAux =
                  this._auxRoutesToUnresolved(candidate.remainingAux, parentComponent);
              return new ResolvedInstruction(candidate.instruction, null, unresolvedAux);
            }

            var newAncestorComponents =
                ancestorComponents.concat([candidate.instruction.componentType]);

            return this._recognize(candidate.remaining, newAncestorComponents)
                .then((childInstruction) => {
                  if (isBlank(childInstruction)) {
                    return null;
                  }

                  // redirect instructions are already absolute
                  if (childInstruction instanceof RedirectInstruction) {
                    return childInstruction;
                  }
                  var unresolvedAux =
                      this._auxRoutesToUnresolved(candidate.remainingAux, parentComponent);
                  return new ResolvedInstruction(candidate.instruction, childInstruction,
                                                 unresolvedAux);
                });
          }

          if (candidate instanceof RedirectMatch) {
            var instruction = this.generate(candidate.redirectTo, ancestorComponents);
            return new RedirectInstruction(instruction.component, instruction.child,
                                           instruction.auxInstruction);
          }
        }));

    if ((isBlank(parsedUrl) || parsedUrl.path == '') && possibleMatches.length == 0) {
      return PromiseWrapper.resolve(this.generateDefault(parentComponent));
    }

    return PromiseWrapper.all(matchPromises).then(mostSpecific);
  }

  private _auxRoutesToUnresolved(auxRoutes: Url[], parentComponent): {[key: string]: Instruction} {
    var unresolvedAuxInstructions: {[key: string]: Instruction} = {};

    auxRoutes.forEach((auxUrl: Url) => {
      unresolvedAuxInstructions[auxUrl.path] = new UnresolvedInstruction(
          () => { return this._recognize(auxUrl, [parentComponent], true); });
    });

    return unresolvedAuxInstructions;
  }


  /**
   * Given a normalized list with component names and params like: `['user', {id: 3 }]`
   * generates a url with a leading slash relative to the provided `parentComponent`.
   *
   * If the optional param `_aux` is `true`, then we generate starting at an auxiliary
   * route boundary.
   */
  generate(linkParams: any[], ancestorComponents: any[], _aux = false): Instruction {
    let parentComponent = ancestorComponents[ancestorComponents.length - 1];
    let grandparentComponent =
        ancestorComponents.length > 1 ? ancestorComponents[ancestorComponents.length - 2] : null;

    let normalizedLinkParams = splitAndFlattenLinkParams(linkParams);

    var first = ListWrapper.first(normalizedLinkParams);
    var rest = ListWrapper.slice(normalizedLinkParams, 1);

    // The first segment should be either '.' (generate from parent) or '' (generate from root).
    // When we normalize above, we strip all the slashes, './' becomes '.' and '/' becomes ''.
    if (first == '') {
      var firstComponent = ancestorComponents[0];
      ListWrapper.clear(ancestorComponents);
      ancestorComponents.push(firstComponent);
    } else if (first == '..') {
      // we already captured the first instance of "..", so we need to pop off an ancestor
      ancestorComponents.pop();
      while (ListWrapper.first(rest) == '..') {
        rest = ListWrapper.slice(rest, 1);
        ancestorComponents.pop();
        if (ancestorComponents.length <= 0) {
          throw new BaseException(
              `Link "${ListWrapper.toJSON(linkParams)}" has too many "../" segments.`);
        }
      }
    } else if (first != '.') {
      // For a link with no leading `./`, `/`, or `../`, we look for a sibling and child.
      // If both exist, we throw. Otherwise, we prefer whichever exists.
      var childRouteExists = this.hasRoute(first, parentComponent);
      var parentRouteExists =
          isPresent(grandparentComponent) && this.hasRoute(first, grandparentComponent);

      if (parentRouteExists && childRouteExists) {
        let msg =
            `Link "${ListWrapper.toJSON(linkParams)}" is ambiguous, use "./" or "../" to disambiguate.`;
        throw new BaseException(msg);
      }
      if (parentRouteExists) {
        ancestorComponents.pop();
      }
      rest = linkParams;
    }

    if (rest[rest.length - 1] == '') {
      rest.pop();
    }

    if (rest.length < 1) {
      let msg = `Link "${ListWrapper.toJSON(linkParams)}" must include a route name.`;
      throw new BaseException(msg);
    }

    return this._generate(rest, ancestorComponents, _aux);
  }


  /*
   * Internal helper that does not make any assertions about the beginning of the link DSL
   */
  private _generate(linkParams: any[], ancestorComponents: any[], _aux = false): Instruction {
    let parentComponent = ancestorComponents[ancestorComponents.length - 1];

    if (linkParams.length == 0) {
      return this.generateDefault(parentComponent);
    }
    let linkIndex = 0;
    let routeName = linkParams[linkIndex];

    if (!isString(routeName)) {
      throw new BaseException(`Unexpected segment "${routeName}" in link DSL. Expected a string.`);
    } else if (routeName == '' || routeName == '.' || routeName == '..') {
      throw new BaseException(`"${routeName}/" is only allowed at the beginning of a link DSL.`);
    }

    let params = {};
    if (linkIndex + 1 < linkParams.length) {
      let nextSegment = linkParams[linkIndex + 1];
      if (isStringMap(nextSegment) && !isArray(nextSegment)) {
        params = nextSegment;
        linkIndex += 1;
      }
    }

    let auxInstructions: {[key: string]: Instruction} = {};
    var nextSegment;
    while (linkIndex + 1 < linkParams.length && isArray(nextSegment = linkParams[linkIndex + 1])) {
      let auxInstruction = this._generate(nextSegment, [parentComponent], true);

      // TODO: this will not work for aux routes with parameters or multiple segments
      auxInstructions[auxInstruction.component.urlPath] = auxInstruction;
      linkIndex += 1;
    }

    var componentRecognizer = this._rules.get(parentComponent);
    if (isBlank(componentRecognizer)) {
      throw new BaseException(
          `Component "${getTypeNameForDebugging(parentComponent)}" has no route config.`);
    }

    var routeRecognizer =
        (_aux ? componentRecognizer.auxNames : componentRecognizer.names).get(routeName);

    if (!isPresent(routeRecognizer)) {
      throw new BaseException(
          `Component "${getTypeNameForDebugging(parentComponent)}" has no route named "${routeName}".`);
    }

    if (!isPresent(routeRecognizer.handler.componentType)) {
      var compInstruction = routeRecognizer.generateComponentPathValues(params);
      return new UnresolvedInstruction(() => {
        return routeRecognizer.handler.resolveComponentType().then(
            (_) => { return this._generate(linkParams, ancestorComponents, _aux); });
      }, compInstruction['urlPath'], compInstruction['urlParams']);
    }

    var componentInstruction = _aux ? componentRecognizer.generateAuxiliary(routeName, params) :
                                      componentRecognizer.generate(routeName, params);


    var childInstruction: Instruction = null;

    var remaining = linkParams.slice(linkIndex + 1);

    // the component is sync
    if (isPresent(componentInstruction.componentType)) {
      if (linkIndex + 1 < linkParams.length) {
        let childAncestorComponents =
            ancestorComponents.concat([componentInstruction.componentType]);
        childInstruction = this._generate(remaining, childAncestorComponents);
      } else if (!componentInstruction.terminal) {
        // ... look for defaults
        childInstruction = this.generateDefault(componentInstruction.componentType);

        if (isBlank(childInstruction)) {
          throw new BaseException(
              `Link "${ListWrapper.toJSON(linkParams)}" does not resolve to a terminal instruction.`);
        }
      }
    }

    return new ResolvedInstruction(componentInstruction, childInstruction, auxInstructions);
  }

  public hasRoute(name: string, parentComponent: any): boolean {
    var componentRecognizer: ComponentRecognizer = this._rules.get(parentComponent);
    if (isBlank(componentRecognizer)) {
      return false;
    }
    return componentRecognizer.hasRoute(name);
  }

  public generateDefault(componentCursor: Type): Instruction {
    if (isBlank(componentCursor)) {
      return null;
    }

    var componentRecognizer = this._rules.get(componentCursor);
    if (isBlank(componentRecognizer) || isBlank(componentRecognizer.defaultRoute)) {
      return null;
    }


    var defaultChild = null;
    if (isPresent(componentRecognizer.defaultRoute.handler.componentType)) {
      var componentInstruction = componentRecognizer.defaultRoute.generate({});
      if (!componentRecognizer.defaultRoute.terminal) {
        defaultChild = this.generateDefault(componentRecognizer.defaultRoute.handler.componentType);
      }
      return new DefaultInstruction(componentInstruction, defaultChild);
    }

    return new UnresolvedInstruction(() => {
      return componentRecognizer.defaultRoute.handler.resolveComponentType().then(
          () => this.generateDefault(componentCursor));
    });
  }
}

/*
 * Given: ['/a/b', {c: 2}]
 * Returns: ['', 'a', 'b', {c: 2}]
 */
function splitAndFlattenLinkParams(linkParams: any[]): any[] {
  return linkParams.reduce((accumulation: any[], item) => {
    if (isString(item)) {
      let strItem: string = item;
      return accumulation.concat(strItem.split('/'));
    }
    accumulation.push(item);
    return accumulation;
  }, []);
}

/*
 * Given a list of instructions, returns the most specific instruction
 */
function mostSpecific(instructions: Instruction[]): Instruction {
  return ListWrapper.maximum(instructions, (instruction: Instruction) => instruction.specificity);
}

function assertTerminalComponent(component, path) {
  if (!isType(component)) {
    return;
  }

  var annotations = reflector.annotations(component);
  if (isPresent(annotations)) {
    for (var i = 0; i < annotations.length; i++) {
      var annotation = annotations[i];

      if (annotation instanceof RouteConfig) {
        throw new BaseException(
            `Child routes are not allowed for "${path}". Use "..." on the parent's route path.`);
      }
    }
  }
}
