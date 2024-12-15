import { Engine, Keys } from "excalibur";

const keyToAction: { [key in Keys]?: BindableAction } = {};
const actionToKeys: { [action in BindableAction]?: Keys[] } = {};

export function setupBindings(bindings: Record<BindableAction, Keys[]>) {
  for (const [action, keys] of Object.entries(bindings)) {
    for (const key of keys) {
      keyToAction[key] = action as BindableAction;
      actionToKeys[action as BindableAction] ??= [];
      actionToKeys[action as BindableAction]?.push(key);
    }
  }
}

export const actions = [
  "moveUp",
  "moveDown",
  "moveLeft",
  "moveRight",
  "attack",
  "pickup",
] as const;
export type BindableAction = (typeof actions)[number];

export type ActionType = "toogle_on" | "toogle_off" | "press";

export interface Binder {
  binderName: string;
}

export interface MovableBinder extends Binder {
  moveUp(actionType: ActionType): void;
  moveDown(actionType: ActionType): void;
  moveLeft(actionType: ActionType): void;
  moveRight(actionType: ActionType): void;
}

export interface ActionReadyBinder extends Binder {
  attack(actionType: ActionType): void;
  pickup(actionType: ActionType): void;
}

type AnyBinder = MovableBinder | ActionReadyBinder;
type AllBinder = MovableBinder & ActionReadyBinder;

const listeners: {
  [action in BindableAction]?: AllBinder;
} = {};

export function listen(engine: Engine, callback: AnyBinder) {
  setupEngineListeners(engine);
  for (const action of actions) {
    const key = actionToKeys[action] ?? [];
    if (key.length === 0) {
      console.warn(`No key bound to action ${action}`);
      return;
    }

    if (action in callback) {
      listeners[action] = callback as unknown as AllBinder;
    }
  }
}

export function isActive(action: BindableAction) {
  const keys = actionToKeys[action] ?? [];
  return keys.some((key) => _engine?.input.keyboard.isHeld(key));
}

let _engine: Engine | null = null;
function setupEngineListeners(engine: Engine) {
  if (_engine) return;
  _engine = engine;
  engine.input.keyboard.on("press", (event) => {
    const action = keyToAction[event.key];
    if (!action) return;
    listeners[action]?.[action]("press");
    listeners[action]?.[action]("toogle_on");
  });
  engine.input.keyboard.on("release", (event) => {
    const action = keyToAction[event.key];
    if (!action) return;
    listeners[action]?.[action]("toogle_off");
  });
}
