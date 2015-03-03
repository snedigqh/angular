import {describe, it, iit, xit, expect, beforeEach, afterEach} from 'angular2/test_lib';
import {
  Runner, Sampler, SampleDescription,
  Validator, bind, Injector, Metric,
  Options, WebDriverAdapter
} from 'benchpress/common';
import { isBlank } from 'angular2/src/facade/lang';
import { Promise, PromiseWrapper } from 'angular2/src/facade/async';

export function main() {
  describe('runner', () => {
    var injector;
    var runner;

    function createRunner(defaultBindings = null) {
      if (isBlank(defaultBindings)) {
        defaultBindings = [];
      }
      runner = new Runner([
        defaultBindings,
        bind(Sampler).toFactory(
          (_injector) => {
            injector = _injector;
            return new MockSampler();
          }, [Injector]
        ),
        bind(Metric).toFactory( () => new MockMetric(), []),
        bind(Validator).toFactory( () => new MockValidator(), []),
        bind(WebDriverAdapter).toFactory( () => new MockWebDriverAdapter(), [])
      ]);
      return runner;
    }

    it('should set SampleDescription.id', (done) => {
      createRunner().sample({id: 'someId'})
        .then( (_) => injector.asyncGet(SampleDescription) )
        .then( (desc) => {
          expect(desc.id).toBe('someId');
          done();
        });
    });

    it('should merge SampleDescription.description', (done) => {
      createRunner([
        bind(Options.DEFAULT_DESCRIPTION).toValue({'a': 1})
      ]).sample({id: 'someId', bindings: [
        bind(Options.SAMPLE_DESCRIPTION).toValue({'b': 2})
      ]}).then( (_) => injector.asyncGet(SampleDescription) )
         .then( (desc) => {

        expect(desc.description).toEqual({
          'forceGc': false,
          'userAgent': 'someUserAgent',
          'a': 1,
          'b': 2,
          'v': 11
        });
        done();
      });
    });

    it('should fill SampleDescription.metrics from the Metric', (done) => {
      createRunner().sample({id: 'someId'})
        .then( (_) => injector.asyncGet(SampleDescription) )
        .then( (desc) => {

        expect(desc.metrics).toEqual({ 'm1': 'some metric' });
        done();
      });
    });

    it('should bind Options.EXECUTE', (done) => {
      var execute = () => {};
      createRunner().sample({id: 'someId', execute: execute}).then( (_) => {
        expect(injector.get(Options.EXECUTE)).toEqual(execute);
        done();
      });
    });

    it('should bind Options.PREPARE', (done) => {
      var prepare = () => {};
      createRunner().sample({id: 'someId', prepare: prepare}).then( (_) => {
        expect(injector.get(Options.PREPARE)).toEqual(prepare);
        done();
      });
    });

    it('should bind Options.MICRO_ITERATIONS', (done) => {
      createRunner().sample({id: 'someId', microIterations: 23}).then( (_) => {
        expect(injector.get(Options.MICRO_ITERATIONS)).toEqual(23);
        done();
      });
    });

    it('should overwrite bindings per sample call', (done) => {
      createRunner([
        bind(Options.DEFAULT_DESCRIPTION).toValue({'a': 1}),
      ]).sample({id: 'someId', bindings: [
        bind(Options.DEFAULT_DESCRIPTION).toValue({'a': 2}),
      ]}).then( (_) => injector.asyncGet(SampleDescription) )
         .then( (desc) => {

        expect(injector.get(SampleDescription).description['a']).toBe(2);
        done();
      });

    });

  });
}

class MockWebDriverAdapter extends WebDriverAdapter {
  executeScript(script):Promise {
    return PromiseWrapper.resolve('someUserAgent');
  }
}

class MockValidator extends Validator {
  constructor() {
    super();
  }
  describe() {
    return { 'v': 11 };
  }
}

class MockMetric extends Metric {
  constructor() {
    super();
  }
  describe() {
    return { 'm1': 'some metric' };
  }
}

class MockSampler extends Sampler {
  constructor() {
    super();
  }
  sample():Promise {
    return PromiseWrapper.resolve(23);
  }
}
