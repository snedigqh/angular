/** @experimental */
export declare abstract class AnimationDriver {
    abstract animate(element: any, startingStyles: AnimationStyles, keyframes: AnimationKeyframe[], duration: number, delay: number, easing: string): AnimationPlayer;
    static NOOP: AnimationDriver;
}

/** @stable */
export declare class BrowserModule {
    constructor(parentModule: BrowserModule);
}

/** @stable */
export declare class BrowserPlatformLocation extends PlatformLocation {
    hash: string;
    pathname: string;
    search: string;
    constructor();
    back(): void;
    forward(): void;
    getBaseHrefFromDOM(): string;
    onHashChange(fn: LocationChangeListener): void;
    onPopState(fn: LocationChangeListener): void;
    pushState(state: any, title: string, url: string): void;
    replaceState(state: any, title: string, url: string): void;
}

/** @experimental */
export declare class By {
    static all(): Predicate<DebugElement>;
    static css(selector: string): Predicate<DebugElement>;
    static directive(type: Type<any>): Predicate<DebugElement>;
}

/** @experimental */
export declare abstract class ClientMessageBroker {
    abstract runOnService(args: UiArguments, returnType: Type<any>): Promise<any>;
}

/** @experimental */
export declare abstract class ClientMessageBrokerFactory {
    abstract createMessageBroker(channel: string, runInZone?: boolean): ClientMessageBroker;
}

/** @experimental */
export declare function disableDebugTools(): void;

/** @stable */
export declare const DOCUMENT: OpaqueToken;

/** @stable */
export declare abstract class DomSanitizer implements Sanitizer {
    abstract bypassSecurityTrustHtml(value: string): SafeHtml;
    abstract bypassSecurityTrustResourceUrl(value: string): SafeResourceUrl;
    abstract bypassSecurityTrustScript(value: string): SafeScript;
    abstract bypassSecurityTrustStyle(value: string): SafeStyle;
    abstract bypassSecurityTrustUrl(value: string): SafeUrl;
    abstract sanitize(context: SecurityContext, value: any): string;
}

/** @experimental */
export declare function enableDebugTools<T>(ref: ComponentRef<T>): ComponentRef<T>;

/** @stable */
export declare const EVENT_MANAGER_PLUGINS: OpaqueToken;

/** @stable */
export declare class EventManager {
    constructor(plugins: EventManagerPlugin[], _zone: NgZone);
    addEventListener(element: HTMLElement, eventName: string, handler: Function): Function;
    addGlobalEventListener(target: string, eventName: string, handler: Function): Function;
    getZone(): NgZone;
}

/** @experimental */
export declare class FnArg {
    type: Type<any>;
    value: any;
    constructor(value: any, type: Type<any>);
}

/** @experimental */
export declare const HAMMER_GESTURE_CONFIG: OpaqueToken;

/** @experimental */
export declare class HammerGestureConfig {
    events: string[];
    overrides: {
        [key: string]: Object;
    };
    buildHammer(element: HTMLElement): HammerInstance;
}

/** @experimental */
export declare abstract class MessageBus implements MessageBusSource, MessageBusSink {
    abstract attachToZone(zone: NgZone): void;
    abstract from(channel: string): EventEmitter<any>;
    abstract initChannel(channel: string, runInZone?: boolean): void;
    abstract to(channel: string): EventEmitter<any>;
}

/** @experimental */
export interface MessageBusSink {
    attachToZone(zone: NgZone): void;
    initChannel(channel: string, runInZone: boolean): void;
    to(channel: string): EventEmitter<any>;
}

/** @experimental */
export interface MessageBusSource {
    attachToZone(zone: NgZone): void;
    from(channel: string): EventEmitter<any>;
    initChannel(channel: string, runInZone: boolean): void;
}

/** @experimental */
export declare class NgProbeToken {
    constructor(name: string, token: any);
}

/** @stable */
export declare const platformBrowser: (extraProviders?: (TypeProvider | ValueProvider | ClassProvider | ExistingProvider | FactoryProvider | any[])[]) => PlatformRef;

/** @experimental */
export declare const platformWorkerApp: (extraProviders?: (TypeProvider | ValueProvider | ClassProvider | ExistingProvider | FactoryProvider | any[])[]) => PlatformRef;

/** @experimental */
export declare const platformWorkerUi: (extraProviders?: (TypeProvider | ValueProvider | ClassProvider | ExistingProvider | FactoryProvider | any[])[]) => PlatformRef;

/** @experimental */
export declare const PRIMITIVE: Type<any>;

/** @experimental */
export declare class ReceivedMessage {
    args: any[];
    id: string;
    method: string;
    type: string;
    constructor(data: {
        [key: string]: any;
    });
}

/** @stable */
export interface SafeHtml extends SafeValue {
}

/** @stable */
export interface SafeResourceUrl extends SafeValue {
}

/** @stable */
export interface SafeScript extends SafeValue {
}

/** @stable */
export interface SafeStyle extends SafeValue {
}

/** @stable */
export interface SafeUrl extends SafeValue {
}

/** @experimental */
export declare abstract class ServiceMessageBroker {
    abstract registerMethod(methodName: string, signature: Type<any>[], method: Function, returnType?: Type<any>): void;
}

/** @experimental */
export declare abstract class ServiceMessageBrokerFactory {
    abstract createMessageBroker(channel: string, runInZone?: boolean): ServiceMessageBroker;
}

/** @experimental */
export declare class Title {
    getTitle(): string;
    setTitle(newTitle: string): void;
}

/** @experimental */
export declare class UiArguments {
    args: FnArg[];
    method: string;
    constructor(method: string, args?: FnArg[]);
}

/** @experimental */
export declare class WebWorkerInstance {
    bus: MessageBus;
    worker: Worker;
}

/** @experimental */
export declare const WORKER_APP_LOCATION_PROVIDERS: ({
    provide: typeof PlatformLocation;
    useClass: typeof WebWorkerPlatformLocation;
} | {
    provide: any;
    useFactory: (platformLocation: WebWorkerPlatformLocation, zone: NgZone) => () => Promise<boolean>;
    multi: boolean;
    deps: (typeof PlatformLocation | typeof NgZone)[];
})[];

/** @experimental */
export declare const WORKER_SCRIPT: OpaqueToken;

/** @experimental */
export declare const WORKER_UI_LOCATION_PROVIDERS: (typeof MessageBasedPlatformLocation | typeof BrowserPlatformLocation | {
    provide: any;
    useFactory: (injector: Injector) => () => void;
    multi: boolean;
    deps: typeof Injector[];
})[];

/** @experimental */
export declare const WORKER_UI_STARTABLE_MESSAGING_SERVICE: OpaqueToken;

/** @experimental */
export declare class WorkerAppModule {
}
