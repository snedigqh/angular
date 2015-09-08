import {EventEmitter} from 'angular2/src/core/facade/async';
import {BaseException} from 'angular2/src/core/facade/lang';
import {NgZone} from 'angular2/src/core/zone/ng_zone';
export {EventEmitter, Observable} from 'angular2/src/core/facade/async';

function _abstract() {
  throw new BaseException("This method is abstract");
}

/**
 * Message Bus is a low level API used to communicate between the UI and the background.
 * Communication is based on a channel abstraction. Messages published in a
 * given channel to one MessageBusSink are received on the same channel
 * by the corresponding MessageBusSource.
 */
export /* abstract (with TS 1.6) */ class MessageBus implements MessageBusSource, MessageBusSink {
  /**
   * Sets up a new channel on the MessageBus.
   * MUST be called before calling from or to on the channel.
   * If runInZone is true then the source will emit events inside the angular zone
   * and the sink will buffer messages and send only once the zone exits.
   * if runInZone is false then the source will emit events inside the global zone
   * and the sink will send messages immediatly.
   */
  initChannel(channel: string, runInZone: boolean = true): void { throw _abstract(); }

  /**
   * Assigns this bus to the given zone.
   * Any callbacks attached to channels where runInZone was set to true on initialization
   * will be executed in the given zone.
   */
  attachToZone(zone: NgZone): void { throw _abstract(); }

  /**
   * Returns an {@link EventEmitter} that emits every time a messsage
   * is received on the given channel.
   */
  from(channel: string): EventEmitter { throw _abstract(); }


  /**
   * Returns an {@link EventEmitter} for the given channel
   * To publish methods to that channel just call next (or add in dart) on the returned emitter
   */
  to(channel: string): EventEmitter { throw _abstract(); }
}

export interface MessageBusSource {
  /**
   * Sets up a new channel on the MessageBusSource.
   * MUST be called before calling from on the channel.
   * If runInZone is true then the source will emit events inside the angular zone.
   * if runInZone is false then the source will emit events inside the global zone.
   */
  initChannel(channel: string, runInZone: boolean): void;

  /**
   * Assigns this source to the given zone.
   * Any channels which are initialized with runInZone set to true will emit events that will be
   * executed within the given zone.
   */
  attachToZone(zone: NgZone): void;

  /**
   * Returns an {@link EventEmitter} that emits every time a messsage
   * is received on the given channel.
   */
  from(channel: string): EventEmitter;
}

export interface MessageBusSink {
  /**
   * Sets up a new channel on the MessageBusSink.
   * MUST be called before calling to on the channel.
   * If runInZone is true the sink will buffer messages and send only once the zone exits.
   * if runInZone is false the sink will send messages immediatly.
   */
  initChannel(channel: string, runInZone: boolean): void;

  /**
   * Assigns this sink to the given zone.
   * Any channels which are initilialized with runInZone set to true will wait for the given zone
   * to exit before sending messages.
   */
  attachToZone(zone: NgZone): void;

  /**
   * Returns an {@link EventEmitter} for the given channel
   * To publish methods to that channel just call next (or add in dart) on the returned emitter
   */
  to(channel: string): EventEmitter;
}
