import { StrictEventEmitter } from "@utils/events.util";
import { State, StateManager, StateManagerEvents } from "@utils/states.util";
import { nap, sleep } from "@utils/time.util";

export type FireMode = "auto" | "semi-auto" | "burst";
export interface Firearm {
  name: string;
  rpm: number;
  fireModes: FireMode[];
  accuracy: number;
}

export interface FirearmEvents extends StateManagerEvents {
  fire: undefined;
  changeFireMode: undefined;
  idle: undefined;
}

export class FirearmStateManager extends StateManager<State> {
  public events = new StrictEventEmitter<FirearmEvents>();
  public fireMode: FireMode = "auto";
  constructor(public firearm: Firearm) {
    super();
    const idleState = new IdleState();
    const aimState = new AimState();
    const changeFireModeState = new ChangeFireModeState();
    const fireState = new FireState();

    this.addState(idleState);
    this.addState(aimState);
    this.addState(changeFireModeState);
    this.addState(fireState);

    this.mapStates("aim", idleState, aimState);
    this.mapStates("fire", aimState, fireState);
    this.mapStates("changeFireMode", idleState, changeFireModeState);
    this.mapStates("idle", changeFireModeState, idleState);
    this.mapStates("idle", fireState, idleState);
  }

  changeFireMode() {
    this.fireMode =
      this.firearm.fireModes[
        (this.firearm.fireModes.indexOf(this.fireMode) + 1) %
          this.firearm.fireModes.length
      ];
  }
}

export class IdleState implements State {
  public readonly name = "idle";
  private _promise!: Promise<string>;
  private _resolve!: (value: string) => void;

  init() {
    this._promise = new Promise<string>((resolve) => (this._resolve = resolve));
  }

  async runState(_stateManager: StateManager<any>) {
    return this._promise;
  }

  aim() {
    this._resolve("aim");
  }

  changeFireMode() {
    this._resolve("changeFireMode");
  }
}

export class AimState implements State {
  public readonly name = "aim";
  private _resolve!: (value: string) => void;
  init() {}
  async runState(_stateManager: StateManager<any>) {
    return new Promise<string>((resolve) => (this._resolve = resolve));
  }

  fire() {
    this._resolve("fire");
  }
}

export class ChangeFireModeState implements State {
  public readonly name = "changeFireMode";
  init() {}
  async runState(_stateManager: FirearmStateManager) {
    _stateManager.changeFireMode();
    await sleep(200);
    return "idle";
  }
}

export class FireState implements State {
  public readonly name = "fire";
  private _interrupted = false;
  init() {
    this._interrupted = false;
  }

  async runState(_stateManager: FirearmStateManager) {
    const rpmDelay = Math.round(60000 / _stateManager.firearm.rpm);
    switch (_stateManager.fireMode) {
      case "auto":
        while (!this._interrupted) {
          _stateManager.events.emit("fire", void 0);
          await nap(rpmDelay, () => this._interrupted);
        }
        break;
      case "burst":
        for (let i = 0; i < 3; i++) {
          _stateManager.events.emit("fire", void 0);
          await sleep(rpmDelay);
        }
        break;
      case "semi-auto":
      default:
        _stateManager.events.emit("fire", void 0);
        await sleep(rpmDelay);
        break;
    }
    return "idle";
  }

  interrupt() {
    this._interrupted = true;
  }
}
