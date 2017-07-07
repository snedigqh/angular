/** @experimental */
export declare const HTTP_INTERCEPTORS: InjectionToken<HttpInterceptor[]>;

/** @experimental */
export declare abstract class HttpBackend implements HttpHandler {
    abstract handle(req: HttpRequest<any>): Observable<HttpEvent<any>>;
}

/** @experimental */
export declare class HttpClient {
    constructor(handler: HttpHandler);
    delete<T>(url: string, options?: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<T>;
    delete(url: string, options?: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<Object>;
    delete<T>(url: string, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpResponse<T>>;
    delete(url: string, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpResponse<Object>>;
    delete(url: string, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType: 'text';
        withCredentials?: boolean;
    }): Observable<HttpResponse<string>>;
    delete(url: string, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType: 'blob';
        withCredentials?: boolean;
    }): Observable<HttpResponse<Blob>>;
    delete(url: string, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType: 'arraybuffer';
        withCredentials?: boolean;
    }): Observable<HttpResponse<ArrayBuffer>>;
    delete<T>(url: string, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpEvent<T>>;
    delete(url: string, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpEvent<Object>>;
    delete(url: string, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType: 'text';
        withCredentials?: boolean;
    }): Observable<HttpEvent<string>>;
    delete(url: string, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType: 'blob';
        withCredentials?: boolean;
    }): Observable<HttpEvent<Blob>>;
    delete(url: string, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType: 'arraybuffer';
        withCredentials?: boolean;
    }): Observable<HttpEvent<ArrayBuffer>>;
    delete(url: string, options: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType: 'text';
        withCredentials?: boolean;
    }): Observable<string>;
    delete(url: string, options: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType: 'arraybuffer';
        withCredentials?: boolean;
    }): Observable<ArrayBuffer>;
    delete(url: string, options: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType: 'blob';
        withCredentials?: boolean;
    }): Observable<Blob>;
    get<T>(url: string, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpEvent<T>>;
    get(url: string, options: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType: 'text';
        withCredentials?: boolean;
    }): Observable<string>;
    get(url: string, options: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType: 'blob';
        withCredentials?: boolean;
    }): Observable<Blob>;
    get(url: string, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType: 'arraybuffer';
        withCredentials?: boolean;
    }): Observable<HttpEvent<ArrayBuffer>>;
    get(url: string, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType: 'blob';
        withCredentials?: boolean;
    }): Observable<HttpEvent<Blob>>;
    get(url: string, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType: 'text';
        withCredentials?: boolean;
    }): Observable<HttpEvent<string>>;
    get(url: string, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpEvent<Object>>;
    get(url: string, options: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType: 'arraybuffer';
        withCredentials?: boolean;
    }): Observable<ArrayBuffer>;
    get(url: string, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType: 'arraybuffer';
        withCredentials?: boolean;
    }): Observable<HttpResponse<ArrayBuffer>>;
    get(url: string, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType: 'blob';
        withCredentials?: boolean;
    }): Observable<HttpResponse<Blob>>;
    get(url: string, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType: 'text';
        withCredentials?: boolean;
    }): Observable<HttpResponse<string>>;
    get(url: string, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpResponse<Object>>;
    get<T>(url: string, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpResponse<T>>;
    get(url: string, options?: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<Object>;
    get<T>(url: string, options?: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<T>;
    head(url: string, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType: 'arraybuffer';
        withCredentials?: boolean;
    }): Observable<HttpEvent<ArrayBuffer>>;
    head(url: string, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType: 'text';
        withCredentials?: boolean;
    }): Observable<HttpEvent<string>>;
    head(url: string, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpEvent<Object>>;
    head<T>(url: string, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpEvent<T>>;
    head(url: string, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType: 'arraybuffer';
        withCredentials?: boolean;
    }): Observable<HttpResponse<ArrayBuffer>>;
    head(url: string, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType: 'blob';
        withCredentials?: boolean;
    }): Observable<HttpResponse<Blob>>;
    head(url: string, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType: 'text';
        withCredentials?: boolean;
    }): Observable<HttpResponse<string>>;
    head(url: string, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpResponse<Object>>;
    head<T>(url: string, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpResponse<T>>;
    head(url: string, options?: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<Object>;
    head<T>(url: string, options?: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<T>;
    head(url: string, options: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType: 'text';
        withCredentials?: boolean;
    }): Observable<string>;
    head(url: string, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType: 'blob';
        withCredentials?: boolean;
    }): Observable<HttpEvent<Blob>>;
    head(url: string, options: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType: 'arraybuffer';
        withCredentials?: boolean;
    }): Observable<ArrayBuffer>;
    head(url: string, options: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType: 'blob';
        withCredentials?: boolean;
    }): Observable<Blob>;
    jsonp(url: string): Observable<any>;
    jsonp<T>(url: string): Observable<T>;
    options(url: string, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType: 'arraybuffer';
        withCredentials?: boolean;
    }): Observable<HttpResponse<ArrayBuffer>>;
    options(url: string, options: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType: 'arraybuffer';
        withCredentials?: boolean;
    }): Observable<ArrayBuffer>;
    options(url: string, options: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType: 'text';
        withCredentials?: boolean;
    }): Observable<string>;
    options(url: string, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType: 'arraybuffer';
        withCredentials?: boolean;
    }): Observable<HttpEvent<ArrayBuffer>>;
    options(url: string, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType: 'blob';
        withCredentials?: boolean;
    }): Observable<HttpEvent<Blob>>;
    options(url: string, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType: 'text';
        withCredentials?: boolean;
    }): Observable<HttpEvent<string>>;
    options(url: string, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpEvent<Object>>;
    options<T>(url: string, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpEvent<T>>;
    options(url: string, options: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType: 'blob';
        withCredentials?: boolean;
    }): Observable<Blob>;
    options(url: string, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType: 'blob';
        withCredentials?: boolean;
    }): Observable<HttpResponse<Blob>>;
    options(url: string, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType: 'text';
        withCredentials?: boolean;
    }): Observable<HttpResponse<string>>;
    options(url: string, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpResponse<Object>>;
    options<T>(url: string, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpResponse<T>>;
    options(url: string, options?: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<Object>;
    options<T>(url: string, options?: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<T>;
    patch(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpEvent<Object>>;
    patch(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType: 'arraybuffer';
        withCredentials?: boolean;
    }): Observable<ArrayBuffer>;
    patch(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType: 'blob';
        withCredentials?: boolean;
    }): Observable<Blob>;
    patch(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType: 'text';
        withCredentials?: boolean;
    }): Observable<string>;
    patch(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType: 'arraybuffer';
        withCredentials?: boolean;
    }): Observable<HttpEvent<ArrayBuffer>>;
    patch(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType: 'blob';
        withCredentials?: boolean;
    }): Observable<HttpEvent<Blob>>;
    patch(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType: 'text';
        withCredentials?: boolean;
    }): Observable<HttpEvent<string>>;
    patch<T>(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpEvent<T>>;
    patch(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType: 'arraybuffer';
        withCredentials?: boolean;
    }): Observable<HttpResponse<ArrayBuffer>>;
    patch(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType: 'blob';
        withCredentials?: boolean;
    }): Observable<HttpResponse<Blob>>;
    patch(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType: 'text';
        withCredentials?: boolean;
    }): Observable<HttpResponse<string>>;
    patch(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpResponse<Object>>;
    patch<T>(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpResponse<T>>;
    patch(url: string, body: any | null, options?: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<Object>;
    patch<T>(url: string, body: any | null, options?: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<T>;
    post<T>(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpEvent<T>>;
    post(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType: 'arraybuffer';
        withCredentials?: boolean;
    }): Observable<ArrayBuffer>;
    post(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType: 'text';
        withCredentials?: boolean;
    }): Observable<string>;
    post(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType: 'arraybuffer';
        withCredentials?: boolean;
    }): Observable<HttpEvent<ArrayBuffer>>;
    post(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType: 'blob';
        withCredentials?: boolean;
    }): Observable<HttpEvent<Blob>>;
    post(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType: 'text';
        withCredentials?: boolean;
    }): Observable<HttpEvent<string>>;
    post(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpEvent<Object>>;
    post(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType: 'blob';
        withCredentials?: boolean;
    }): Observable<Blob>;
    post(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType: 'arraybuffer';
        withCredentials?: boolean;
    }): Observable<HttpResponse<ArrayBuffer>>;
    post(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType: 'blob';
        withCredentials?: boolean;
    }): Observable<HttpResponse<Blob>>;
    post(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType: 'text';
        withCredentials?: boolean;
    }): Observable<HttpResponse<string>>;
    post(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpResponse<Object>>;
    post<T>(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpResponse<T>>;
    post(url: string, body: any | null, options?: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<Object>;
    post<T>(url: string, body: any | null, options?: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<T>;
    put(url: string, body: any | null, options?: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<Object>;
    put<T>(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpResponse<T>>;
    put(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpResponse<Object>>;
    put(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType: 'text';
        withCredentials?: boolean;
    }): Observable<HttpResponse<string>>;
    put(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType: 'blob';
        withCredentials?: boolean;
    }): Observable<HttpResponse<Blob>>;
    put(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'response';
        responseType: 'arraybuffer';
        withCredentials?: boolean;
    }): Observable<HttpResponse<ArrayBuffer>>;
    put<T>(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpEvent<T>>;
    put(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType: 'arraybuffer';
        withCredentials?: boolean;
    }): Observable<ArrayBuffer>;
    put(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpEvent<Object>>;
    put(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType: 'text';
        withCredentials?: boolean;
    }): Observable<HttpEvent<string>>;
    put(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType: 'blob';
        withCredentials?: boolean;
    }): Observable<HttpEvent<Blob>>;
    put(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe: 'events';
        responseType: 'arraybuffer';
        withCredentials?: boolean;
    }): Observable<HttpEvent<ArrayBuffer>>;
    put(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType: 'text';
        withCredentials?: boolean;
    }): Observable<string>;
    put(url: string, body: any | null, options: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType: 'blob';
        withCredentials?: boolean;
    }): Observable<Blob>;
    put<T>(url: string, body: any | null, options?: {
        headers?: HttpHeaders;
        observe?: 'body';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<T>;
    request(method: string, url: string, options: {
        body?: any;
        headers?: HttpHeaders;
        observe: 'events';
        responseType: 'text';
        withCredentials?: boolean;
    }): Observable<HttpEvent<string>>;
    request<R>(method: string, url: string, options?: {
        body?: any;
        headers?: HttpHeaders;
        observe?: 'body';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<R>;
    request(method: string, url: string, options: {
        body?: any;
        headers?: HttpHeaders;
        observe?: 'body';
        responseType: 'arraybuffer';
        withCredentials?: boolean;
    }): Observable<ArrayBuffer>;
    request(method: string, url: string, options: {
        body?: any;
        headers?: HttpHeaders;
        observe?: 'body';
        responseType: 'blob';
        withCredentials?: boolean;
    }): Observable<Blob>;
    request(method: string, url: string, options: {
        body?: any;
        headers?: HttpHeaders;
        observe?: 'body';
        responseType: 'text';
        withCredentials?: boolean;
    }): Observable<string>;
    request(method: string, url: string, options: {
        body?: any;
        headers?: HttpHeaders;
        observe: 'events';
        responseType: 'arraybuffer';
        withCredentials?: boolean;
    }): Observable<HttpEvent<ArrayBuffer>>;
    request(method: string, url: string, options: {
        body?: any;
        headers?: HttpHeaders;
        observe: 'events';
        responseType: 'blob';
        withCredentials?: boolean;
    }): Observable<HttpEvent<Blob>>;
    request<R>(req: HttpRequest<any>): Observable<HttpEvent<R>>;
    request<R>(method: string, url: string, options: {
        body?: any;
        headers?: HttpHeaders;
        observe: 'events';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpEvent<R>>;
    request(method: string, url: string, options: {
        body?: any;
        headers?: HttpHeaders;
        observe: 'response';
        responseType: 'arraybuffer';
        withCredentials?: boolean;
    }): Observable<HttpResponse<ArrayBuffer>>;
    request(method: string, url: string, options: {
        body?: any;
        headers?: HttpHeaders;
        observe: 'response';
        responseType: 'blob';
        withCredentials?: boolean;
    }): Observable<HttpResponse<Blob>>;
    request(method: string, url: string, options: {
        body?: any;
        headers?: HttpHeaders;
        observe: 'response';
        responseType: 'text';
        withCredentials?: boolean;
    }): Observable<HttpResponse<string>>;
    request<R>(method: string, url: string, options: {
        body?: any;
        headers?: HttpHeaders;
        observe: 'response';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<HttpResponse<R>>;
    request(method: string, url: string, options?: {
        body?: any;
        headers?: HttpHeaders;
        observe?: 'body';
        responseType?: 'json';
        withCredentials?: boolean;
    }): Observable<Object>;
    request(method: string, url: string, options?: {
        body?: any;
        headers?: HttpHeaders;
        observe?: HttpObserve;
        responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
        withCredentials?: boolean;
    }): Observable<any>;
}

/** @experimental */
export declare class HttpClientJsonpModule {
}

/** @experimental */
export declare class HttpClientModule {
}

/** @experimental */
export interface HttpDownloadProgressEvent extends HttpProgressEvent {
    partialText?: string;
    type: HttpEventType.DownloadProgress;
}

/** @experimental */
export declare class HttpErrorResponse extends HttpResponseBase implements Error {
    readonly error: any | null;
    readonly message: string;
    readonly name: string;
    readonly ok: boolean;
    constructor(init: {
        error?: any;
        headers?: HttpHeaders;
        status?: number;
        statusText?: string;
        url?: string;
    });
}

/** @experimental */
export declare type HttpEvent<T> = HttpSentEvent | HttpHeaderResponse | HttpResponse<T> | HttpProgressEvent | HttpUserEvent<T>;

/** @experimental */
export declare enum HttpEventType {
    Sent = 0,
    UploadProgress = 1,
    ResponseHeader = 2,
    DownloadProgress = 3,
    Response = 4,
    User = 5,
}

/** @experimental */
export declare abstract class HttpHandler {
    abstract handle(req: HttpRequest<any>): Observable<HttpEvent<any>>;
}

/** @experimental */
export declare class HttpHeaderResponse extends HttpResponseBase {
    readonly type: HttpEventType.ResponseHeader;
    constructor(init?: {
        headers?: HttpHeaders;
        status?: number;
        statusText?: string;
        url?: string;
    });
    clone(update?: {
        headers?: HttpHeaders;
        status?: number;
        statusText?: string;
        url?: string;
    }): HttpHeaderResponse;
}

/** @experimental */
export declare class HttpHeaders {
    constructor(headers?: string | {
        [name: string]: string | string[];
    });
    append(name: string, value: string | string[]): HttpHeaders;
    delete(name: string, value?: string | string[]): HttpHeaders;
    get(name: string): string | null;
    getAll(name: string): string[] | null;
    has(name: string): boolean;
    keys(): string[];
    set(name: string, value: string | string[]): HttpHeaders;
}

/** @experimental */
export interface HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>;
}

/** @experimental */
export interface HttpProgressEvent {
    loaded: number;
    total?: number;
    type: HttpEventType.DownloadProgress | HttpEventType.UploadProgress;
}

/** @experimental */
export declare class HttpRequest<T> {
    readonly body: T | null;
    readonly headers: HttpHeaders;
    readonly method: string;
    readonly reportProgress: boolean;
    readonly responseType: 'arraybuffer' | 'blob' | 'json' | 'text';
    url: string;
    readonly withCredentials: boolean;
    constructor(method: 'DELETE' | 'GET' | 'HEAD' | 'JSONP' | 'OPTIONS', url: string, init?: {
        headers?: HttpHeaders;
        reportProgress?: boolean;
        responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
        withCredentials?: boolean;
    });
    constructor(method: 'POST' | 'PUT' | 'PATCH', url: string, body: T | null, init?: {
        headers?: HttpHeaders;
        reportProgress?: boolean;
        responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
        withCredentials?: boolean;
    });
    constructor(method: string, url: string, body: T | null, init?: {
        headers?: HttpHeaders;
        reportProgress?: boolean;
        responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
        withCredentials?: boolean;
    });
    clone(): HttpRequest<T>;
    clone(update: {
        headers?: HttpHeaders;
        reportProgress?: boolean;
        responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
        withCredentials?: boolean;
    }): HttpRequest<T>;
    clone<V>(update: {
        headers?: HttpHeaders;
        reportProgress?: boolean;
        responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
        withCredentials?: boolean;
        body?: V | null;
        method?: string;
        url?: string;
        setHeaders?: {
            [name: string]: string | string[];
        };
    }): HttpRequest<V>;
    detectContentTypeHeader(): string | null;
    serializeBody(): ArrayBuffer | Blob | FormData | string | null;
}

/** @experimental */
export declare class HttpResponse<T> extends HttpResponseBase {
    readonly body: T | null;
    readonly type: HttpEventType.Response;
    constructor(init?: {
        body?: T | null;
        headers?: HttpHeaders;
        status?: number;
        statusText?: string;
        url?: string;
    });
    clone(): HttpResponse<T>;
    clone(update: {
        headers?: HttpHeaders;
        status?: number;
        statusText?: string;
        url?: string;
    }): HttpResponse<T>;
    clone<V>(update: {
        body?: V | null;
        headers?: HttpHeaders;
        status?: number;
        statusText?: string;
        url?: string;
    }): HttpResponse<V>;
}

/** @experimental */
export declare abstract class HttpResponseBase {
    readonly headers: HttpHeaders;
    readonly ok: boolean;
    readonly status: number;
    readonly statusText: string;
    readonly type: HttpEventType.Response | HttpEventType.ResponseHeader;
    readonly url: string | null;
    constructor(init: {
        headers?: HttpHeaders;
        status?: number;
        statusText?: string;
        url?: string;
    }, defaultStatus?: number, defaultStatusText?: string);
}

/** @experimental */
export interface HttpSentEvent {
    type: HttpEventType.Sent;
}

/** @experimental */
export declare class HttpStandardUrlParameterCodec implements HttpUrlParameterCodec {
    decodeKey(k: string): string;
    decodeValue(v: string): string;
    encodeKey(k: string): string;
    encodeValue(v: string): string;
}

/** @experimental */
export declare class HttpUrlEncodedBody {
    constructor(options?: {
        fromString?: string;
        encoder?: HttpUrlParameterCodec;
    });
    append(param: string, value: string): HttpUrlEncodedBody;
    delete(param: string, value?: string): HttpUrlEncodedBody;
    get(param: string): string | null;
    getAll(param: string): string[] | null;
    has(param: string): boolean;
    params(): string[];
    set(param: string, value: string): HttpUrlEncodedBody;
    toString(): string;
}

/** @experimental */
export interface HttpUrlParameterCodec {
    decodeKey(key: string): string;
    decodeValue(value: string): string;
    encodeKey(key: string): string;
    encodeValue(value: string): string;
}

/** @experimental */
export interface HttpUserEvent<T> {
    type: HttpEventType.User;
}

/** @experimental */
export declare class HttpXhrBackend implements HttpBackend {
    constructor(xhrFactory: XhrFactory);
    handle(req: HttpRequest<any>): Observable<HttpEvent<any>>;
}

/** @experimental */
export declare class JsonpClientBackend implements HttpBackend {
    constructor(callbackMap: JsonpCallbackContext, document: any);
    handle(req: HttpRequest<never>): Observable<HttpEvent<any>>;
}

/** @experimental */
export declare class JsonpInterceptor {
    constructor(jsonp: JsonpClientBackend);
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>;
}

/** @experimental */
export declare abstract class XhrFactory {
    abstract build(): XMLHttpRequest;
}
