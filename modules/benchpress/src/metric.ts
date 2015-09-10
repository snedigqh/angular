import {bind, Binding} from 'angular2/src/core/di';
import {Promise, PromiseWrapper} from 'angular2/src/core/facade/async';
import {ABSTRACT} from 'angular2/src/core/facade/lang';
import {BaseException, WrappedException} from 'angular2/src/core/facade/exceptions';
import {StringMap} from 'angular2/src/core/facade/collection';

/**
 * A metric is measures values
 */
@ABSTRACT()
export class Metric {
  static bindTo(delegateToken): Binding[] {
    return [bind(Metric).toFactory((delegate) => delegate, [delegateToken])];
  }

  /**
   * Starts measuring
   */
  beginMeasure(): Promise<any> { throw new BaseException('NYI'); }

  /**
   * Ends measuring and reports the data
   * since the begin call.
   * @param restart: Whether to restart right after this.
   */
  endMeasure(restart: boolean): Promise<StringMap<string, any>> { throw new BaseException('NYI'); }

  /**
   * Describes the metrics provided by this metric implementation.
   * (e.g. units, ...)
   */
  describe(): StringMap<string, any> { throw new BaseException('NYI'); }
}
