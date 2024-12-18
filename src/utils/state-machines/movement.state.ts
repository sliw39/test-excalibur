import { State, StateManager } from "@utils/states.util";
import { Graphic, GraphicsGrouping } from "excalibur";

type MoveStates = keyof typeof states;
export class MoveStateManager extends StateManager<IdleState> {
  constructor(sprites: Record<MoveStates, Graphic | GraphicsGrouping>) {
    super();

    const statesImpl = Object.fromEntries(
      Object.entries(states).map(([key, value]) => [
        key,
        value(sprites[key as MoveStates]),
      ])
    );

    for (const state of Object.values(statesImpl)) {
      this.addState(state);
    }

    for (const srcDirection of ["Left", "Right", "Top", "Bottom"] as const) {
      for (const destDirection of ["Left", "Right", "Top", "Bottom"] as const) {
        // go to direction from idle
        this.mapStates(
          `moving${destDirection}`,
          statesImpl[`idle${srcDirection}`],
          statesImpl[`moving${destDirection}`]
        );
        if (srcDirection !== destDirection) {
          // change direction
          this.mapStates(
            `moving${destDirection}`,
            statesImpl[`moving${srcDirection}`],
            statesImpl[`moving${destDirection}`]
          );
        }
      }

      // stop
      this.mapStates(
        `stopping`,
        statesImpl[`moving${srcDirection}`],
        statesImpl[`idle${srcDirection}`]
      );
    }
  }
}

export abstract class IdleState implements State {
  constructor(public graphic: Graphic | GraphicsGrouping) {}
  init(): void {
    this._promise = new Promise<string>((resolve) => {
      this._resolve = resolve;
    });
  }
  private _promise!: Promise<string>;
  protected _resolve!: (value: string) => void;
  async runState(_stateManager: StateManager<any>) {
    return this._promise;
  }

  left() {
    this._resolve("movingLeft");
  }
  right() {
    this._resolve("movingRight");
  }
  down() {
    this._resolve("movingBottom");
  }
  up() {
    this._resolve("movingTop");
  }
}

export abstract class MovingState extends IdleState {
  stop() {
    this._resolve("stopping");
  }
}

export class IdleTopState extends IdleState {
  public readonly name = "idleTop";
}

export class IdleBottomState extends IdleState {
  public readonly name = "idleBottom";
}

export class IdleLeftState extends IdleState {
  public readonly name = "idleLeft";
}

export class IdleRightState extends IdleState {
  public readonly name = "idleRight";
}

export class MovingTopState extends MovingState {
  public readonly name = "movingTop";
  override up(): void {}
}

export class MovingBottomState extends MovingState {
  public readonly name = "movingBottom";
  override down(): void {}
}

export class MovingLeftState extends MovingState {
  public readonly name = "movingLeft";
  override left(): void {}
}

export class MovingRightState extends MovingState {
  public readonly name = "movingRight";
  override right(): void {}
}

const states = {
  idleBottom: (graphic: Graphic | GraphicsGrouping) =>
    new IdleBottomState(graphic),
  idleTop: (graphic: Graphic | GraphicsGrouping) => new IdleTopState(graphic),
  idleLeft: (graphic: Graphic | GraphicsGrouping) => new IdleLeftState(graphic),
  idleRight: (graphic: Graphic | GraphicsGrouping) =>
    new IdleRightState(graphic),
  movingTop: (graphic: Graphic | GraphicsGrouping) =>
    new MovingTopState(graphic),
  movingBottom: (graphic: Graphic | GraphicsGrouping) =>
    new MovingBottomState(graphic),
  movingLeft: (graphic: Graphic | GraphicsGrouping) =>
    new MovingLeftState(graphic),
  movingRight: (graphic: Graphic | GraphicsGrouping) =>
    new MovingRightState(graphic),
} as const;
