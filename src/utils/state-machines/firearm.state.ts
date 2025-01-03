import { accuracy } from "@engine/ballistic.engine";
import { BulletModel, FireMode, Firearm, bullets } from "@models/weapons.model";
import { StrictEventEmitter } from "@utils/events.util";
import { State, StateManager, StateManagerEvents } from "@utils/states.util";
import { nap, sleep } from "@utils/time.util";

export interface FirearmEvents extends StateManagerEvents {
  fire: { velocity: number; accuracy: number; bulletModel: BulletModel };
  firing: undefined;
  changeFireMode: undefined;
  idle: undefined;
  empty: undefined;
  reloading: undefined;
  aiming: undefined;
}

export class FirearmStateManager extends StateManager<State> {
  public events = new StrictEventEmitter<FirearmEvents>();
  public fireMode: FireMode;
  public bullets: number;
  constructor(public firearm: Firearm) {
    super();
    const idleState = this.addState(new IdleState());
    const aimingState = this.addState(new AimingState());
    const changingFireModeState = this.addState(new ChangingFireModeState());
    const firingState = this.addState(new FiringState());
    const reloadingState = this.addState(new ReloadingState());
    const emptyState = this.addState(new EmptyState());

    this.bullets = this.firearm.magsize;
    this.fireMode = this.firearm.fireModes[0];

    // from idle
    this.mapStates("aim", idleState, aimingState);
    this.mapStates("changeFireMode", idleState, changingFireModeState);
    this.mapStates("reload", idleState, reloadingState);

    // from fire
    this.mapStates("idle", firingState, idleState);
    this.mapStates("empty", firingState, emptyState);

    // from aim
    this.mapStates("fire", aimingState, firingState);

    // from changeFireMode
    this.mapStates("idle", changingFireModeState, idleState);
    this.mapStates("empty", changingFireModeState, emptyState);

    // from empty
    this.mapStates("reload", emptyState, reloadingState);
    this.mapStates("changeFireMode", emptyState, changingFireModeState);

    // from reloading
    this.mapStates("idle", reloadingState, idleState);

    this.events.on("transitioned", (e) => {
      switch (e.name) {
        case "idle":
          this.events.emit("idle", void 0);
          break;
        case "empty":
          this.events.emit("empty", void 0);
          break;
        case "reload":
          this.events.emit("reloading", void 0);
          break;
        case "aim":
          this.events.emit("aiming", void 0);
          break;
        case "changeFireMode":
          this.events.emit("changeFireMode", void 0);
          break;
      }
    });
  }

  changeFireMode() {
    this.fireMode =
      this.firearm.fireModes[
        (this.firearm.fireModes.indexOf(this.fireMode) + 1) %
          this.firearm.fireModes.length
      ];
  }

  get magEmptiness() {
    return Math.ceil((this.bullets * 10) / this.firearm.magsize) / 10;
  }

  toString() {
    return `${this.firearm.name} ${this.bullets}/${this.firearm.magsize} - ${this.currentState.name}`;
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

  reload() {
    this._resolve("reload");
  }

  changeFireMode() {
    this._resolve("changeFireMode");
  }
}

export class AimingState implements State {
  public readonly name = "aiming";
  private _resolve!: (value: string) => void;
  init() {}
  async runState(_stateManager: StateManager<any>) {
    return new Promise<string>((resolve) => (this._resolve = resolve));
  }

  fire() {
    this._resolve("fire");
  }
}

export class ChangingFireModeState implements State {
  public readonly name = "changingFireMode";
  init() {}
  async runState(_stateManager: FirearmStateManager) {
    _stateManager.changeFireMode();
    await sleep(200);
    return _stateManager.bullets > 0 ? "idle" : "empty";
  }
}

export class ReloadingState implements State {
  public readonly name = "reloading";
  init() {}
  async runState(_stateManager: FirearmStateManager) {
    await sleep(_stateManager.firearm.reloadTime);
    _stateManager.bullets = _stateManager.firearm.magsize;
    return "idle";
  }
}

export class EmptyState implements State {
  public readonly name = "empty";
  private _promise!: Promise<string>;
  private _resolve!: (value: string) => void;

  init() {
    this._promise = new Promise<string>((resolve) => (this._resolve = resolve));
  }

  async runState(_stateManager: FirearmStateManager) {
    return this._promise;
  }

  reload() {
    this._resolve("reload");
  }
}

export class FiringState implements State {
  public readonly name = "firing";
  private _interrupted = false;

  init() {
    this._interrupted = false;
  }

  async runState(_stateManager: FirearmStateManager) {
    const rpmDelay = Math.round(60000 / _stateManager.firearm.rpm);
    const accuracies = accuracy(
      _stateManager.fireMode,
      _stateManager.firearm.accuracy
    );
    switch (_stateManager.fireMode) {
      case "auto":
        while (!this._interrupted) {
          this.doFire(_stateManager, accuracies.next().value);
          await nap(rpmDelay, () => this._interrupted);
          if (_stateManager.bullets <= 0) return "empty";
        }
        break;
      case "burst":
        for (let i = 0; i < 3; i++) {
          this.doFire(_stateManager, accuracies.next().value);
          await sleep(rpmDelay);
          if (_stateManager.bullets <= 0) return "empty";
        }
        break;
      case "semi-auto":
      default:
        this.doFire(_stateManager, accuracies.next().value);
        await sleep(rpmDelay);
        if (_stateManager.bullets <= 0) return "empty";
        break;
    }
    return "idle";
  }

  private doFire(_stateManager: FirearmStateManager, accuracy: number) {
    _stateManager.bullets--;
    const bullet = bullets[_stateManager.firearm.caliber];
    for (let i = 0; i < (bullet.submunitions ?? 1); i++) {
      _stateManager.events.emit("fire", {
        accuracy,
        velocity: _stateManager.firearm.velocity,
        bulletModel: bullets[_stateManager.firearm.caliber],
      });
    }
  }

  interrupt() {
    this._interrupted = true;
  }
}
