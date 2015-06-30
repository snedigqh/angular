import {
  AsyncTestCompleter,
  afterEach,
  beforeEach,
  ddescribe,
  describe,
  expect,
  iit,
  inject,
  it,
  xit,
  SpyObject
} from 'angular2/test_lib';
import {ObservableWrapper} from 'angular2/src/facade/async';
import {BrowserXhr} from 'angular2/src/http/backends/browser_xhr';
import {XHRConnection, XHRBackend} from 'angular2/src/http/backends/xhr_backend';
import {bind, Injector} from 'angular2/di';
import {Request} from 'angular2/src/http/static_request';
import {Map} from 'angular2/src/facade/collection';
import {RequestOptions, BaseRequestOptions} from 'angular2/src/http/base_request_options';
import {BaseResponseOptions, ResponseOptions} from 'angular2/src/http/base_response_options';
import {ResponseTypes} from 'angular2/src/http/enums';

var abortSpy;
var sendSpy;
var openSpy;
var addEventListenerSpy;
var existingXHRs = [];

class MockBrowserXHR extends BrowserXhr {
  abort: any;
  send: any;
  open: any;
  response: any;
  responseText: string;
  callbacks: Map<string, Function>;
  constructor() {
    super();
    var spy = new SpyObject();
    this.abort = abortSpy = spy.spy('abort');
    this.send = sendSpy = spy.spy('send');
    this.open = openSpy = spy.spy('open');
    this.callbacks = new Map();
  }

  addEventListener(type: string, cb: Function) { this.callbacks.set(type, cb); }

  dispatchEvent(type: string) { this.callbacks.get(type)({}); }

  build() {
    var xhr = new MockBrowserXHR();
    existingXHRs.push(xhr);
    return xhr;
  }
}

export function main() {
  describe('XHRBackend', () => {
    var backend;
    var sampleRequest;

    beforeEach(() => {
      var injector = Injector.resolveAndCreate([
        bind(ResponseOptions)
            .toClass(BaseResponseOptions),
        bind(BrowserXhr).toClass(MockBrowserXHR),
        XHRBackend
      ]);
      backend = injector.get(XHRBackend);
      var base = new BaseRequestOptions();
      sampleRequest = new Request(base.merge(new RequestOptions({url: 'https://google.com'})));
    });

    afterEach(() => { existingXHRs = []; });

    it('should create a connection',
       () => { expect(() => backend.createConnection(sampleRequest)).not.toThrow(); });


    describe('XHRConnection', () => {
      it('should use the injected BaseResponseOptions to create the response',
         inject([AsyncTestCompleter], async => {
           var connection = new XHRConnection(sampleRequest, new MockBrowserXHR(),
                                              new ResponseOptions({type: ResponseTypes.Error}));
           ObservableWrapper.subscribe(connection.response, res => {
             expect(res.type).toBe(ResponseTypes.Error);
             async.done();
           });
           existingXHRs[0].dispatchEvent('load');
         }));

      it('should call abort when disposed', () => {
        var connection = new XHRConnection(sampleRequest, new MockBrowserXHR());
        connection.dispose();
        expect(abortSpy).toHaveBeenCalled();
      });


      it('should automatically call open with method and url', () => {
        new XHRConnection(sampleRequest, new MockBrowserXHR());
        expect(openSpy).toHaveBeenCalledWith('GET', sampleRequest.url);
      });


      it('should automatically call send on the backend with request body', () => {
        var body = 'Some body to love';
        var base = new BaseRequestOptions();
        new XHRConnection(new Request(base.merge(new RequestOptions({body: body}))),
                          new MockBrowserXHR());
        expect(sendSpy).toHaveBeenCalledWith(body);
      });
    });
  });
}
