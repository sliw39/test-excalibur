import { EventEmitter, EventMap } from "excalibur";

type StrictEventKey<TEventMap> = keyof TEventMap;
export class StrictEventEmitter<TEventMap extends EventMap> extends EventEmitter<TEventMap> {
  emit<TEventName extends StrictEventKey<TEventMap>>(eventName: TEventName, event: TEventMap[TEventName]): void;
  emit<TEventName extends StrictEventKey<TEventMap> | string>(eventName: TEventName, event?: TEventMap[TEventName]): void {
    super.emit(eventName as any, event as any);
  }
}

export type SimpleEventName<T extends string> = {
    [key in T]: void;
};