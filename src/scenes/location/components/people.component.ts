import { StrictEventEmitter } from "@utils/events.util";
import {
  ActionReadyBinder,
  ActionType,
  isActive,
  listen,
} from "@utils/keyboard.util";
import { MutexChannel } from "@utils/mutex.util";
import {
  Actor,
  vec,
  ActorArgs,
  Color,
  Engine,
  Graphic,
  GraphicsGrouping,
  Rectangle,
  GraphicsGroup,
  Vector,
  ImageSource,
} from "excalibur";
import { Bullet } from "./bullets.component";
import { Player } from "@models/player.model";
import { cloneMovement, movements } from "@utils/consts.util";
import accuracyConeImgUrl from "@art/helpers/accuracy_cone.svg?url";
import {
  AimState,
  FirearmStateManager,
  FireState,
  IdleState,
} from "@utils/state-machines/firearm.state";
import {
  MoveStateManager,
  MovingState,
} from "@utils/state-machines/movement.state";
import { MovementDirection } from "@utils/vectors.util";

export const resources = {
  accuracyCone: new ImageSource(accuracyConeImgUrl),
};

export interface Guard {
  checkDecorCollision(nextPos: Vector): boolean;
  checkEntitiesCollision(nextPos: Vector): Actor[];
  hasLineOfSight(a: Vector, b: Vector): boolean;
}

export interface PersonEvents {
  aim: undefined;
  fire: { bullet: Bullet };
}
export interface PersonArgs extends ActorArgs {
  model: Player;
  guard: Guard;
  animations: MoveStateManager;
  defaultWeapon: FirearmStateManager;
}
export class Person extends Actor {
  public events = new StrictEventEmitter<PersonEvents>();

  public readonly movements;
  protected _lookVector = vec(1, 0);
  protected _fireAccuracy = 1;
  protected _mainAction = new MutexChannel(["attack", "pickup"]);
  protected _currentWeapon: FirearmStateManager;
  protected _model: Player;
  protected _animations: MoveStateManager;
  protected _guard: Guard;
  protected _interrupted = false;

  constructor(args: PersonArgs) {
    super(args);
    this._model = args.model;
    this._animations = args.animations;
    this._guard = args.guard;
    this._currentWeapon = args.defaultWeapon;
    this.movements = cloneMovement(
      (this._model.agility / 100) * movements.human
    );
  }

  get currentAccuracy() {
    return this._fireAccuracy;
  }

  get lookVector() {
    return this._lookVector;
  }

  get model() {
    return this._model;
  }

  onInitialize(_engine: Engine): void {
    this.graphics.use(
      new Rectangle({
        width: 16,
        height: 16,
        color: this.color,
      })
    );
    this._animations.run();
    this._currentWeapon.run();
    this._currentWeapon.events.on("fire", () => {
      this.events.emit("fire", {
        bullet: new Bullet({
          pos: this.pos,
          accuracy: this._fireAccuracy,
          velocity: this._lookVector.normalize().scale(10),
          energy: 100,
          guard: this._guard,
          initiator: this,
        }),
      });
    });
    this.model.events.on("dead", () => {
      if (this._currentWeapon.currentState instanceof FireState)
        this._currentWeapon.currentState.interrupt();
      this.kill();
    });
  }

  update(_engine: Engine, _delta: number): void {
    let pos = this.pos.add(
      this.getMovement(_engine).scale(this._mainAction.current ? 0.5 : 1)
    );

    if (
      pos != this.pos &&
      !this._guard.checkDecorCollision(pos) &&
      !this._guard.checkEntitiesCollision(pos).filter((e) => e !== this).length
    ) {
      this.pos = pos;
    }

    const graphics: (Graphic | GraphicsGrouping)[] = [
      {
        graphic: (this._animations.currentState as MovingState)
          .graphic as unknown as Graphic,
        offset: vec(0, 0),
      },
    ];

    if (this._mainAction.current === "attack") {
      const accuracyCone = resources.accuracyCone.toSprite();
      accuracyCone.height = Math.max(
        this._lookVector.size * (1 - this._fireAccuracy),
        2
      );
      accuracyCone.width = this._lookVector.size;
      accuracyCone.opacity = this._fireAccuracy;
      accuracyCone.origin = vec(
        accuracyCone.width / 2,
        accuracyCone.height / 2
      );
      const angle = this._lookVector.toAngle();
      accuracyCone.rotation = angle;
      graphics.push({
        graphic: accuracyCone,
        offset: vec(
          -accuracyCone.width / 2 + 16,
          -accuracyCone.height / 2 + 16
        ).add(this._lookVector.scale(0.5)),
        useBounds: false,
      });
    }

    this.graphics.use(new GraphicsGroup({ members: graphics }));
  }

  protected getMovement(_engine: Engine) {
    (this._animations.currentState as MovingState).stop?.();
    return Vector.Zero;
  }

  aim() {
    this._mainAction.request("attack");
    const state = this._currentWeapon.currentState;
    if (this._currentWeapon.getTransitions().some((t) => t.name === "aim")) {
      (state as IdleState).aim();
      this._fireAccuracy = 0;
      this.events.emit("aim", void 0);
      const aiming = setInterval(() => {
        if (this._currentWeapon.currentState instanceof AimState) {
          if (this._fireAccuracy < 1) this._fireAccuracy += 0.01;
        } else {
          clearInterval(aiming);
        }
      }, 20);
    }
  }

  fire() {
    const state = this._currentWeapon.currentState;
    if (this._currentWeapon.getTransitions().some((t) => t.name === "fire")) {
      (state as AimState).fire();
    }
  }

  holdFire() {
    const state = this._currentWeapon.currentState;
    if (this._currentWeapon.getTransitions().some((t) => t.name === "idle")) {
      (state as FireState).interrupt();
      this._mainAction.release("attack");
    }
  }
}

export class PlayerPlaceholder extends Person implements ActionReadyBinder {
  constructor(args: PersonArgs, public binderName = "player") {
    super(args);
  }

  attack(event: ActionType) {
    const state = this._currentWeapon.currentState;
    if (event === "press" && state instanceof FireState) {
      this.holdFire();
      return;
    }
    if (
      event === "toogle_on" &&
      this._mainAction.available &&
      state instanceof IdleState
    ) {
      this.aim();
    }
    if (
      event === "toogle_off" &&
      this._mainAction.current === "attack" &&
      state instanceof AimState
    ) {
      this.fire();
    }
  }

  pickup(event: ActionType) {
    if (event === "press" && this._mainAction.available) {
      const action = this._mainAction.request("pickup");
      if (!action) return;
      this.color = Color.Green;
      setTimeout(() => {
        action.release();
        this.color = Color.Blue;
      }, 300);
    }
  }

  changeFireMode(actionType: ActionType): void {
    const state = this._currentWeapon.currentState;
    if (
      actionType === "press" &&
      this._mainAction.available &&
      state instanceof IdleState
    ) {
      state.changeFireMode();
    }
  }

  protected getMovement(_engine: Engine) {
    let vector = _engine.input.pointers.primary.lastScreenPos.add(
      this.pos.scale(-1)
    );
    vector = vector.scale(1 + 0.5 * (1 - this._fireAccuracy));
    this._lookVector = vector;

    if (isActive("moveUp") && isActive("moveLeft") && !isActive("moveRight")) {
      this._animations.currentState.up();
      return this.movements.upleft;
    }
    if (
      isActive("moveDown") &&
      isActive("moveLeft") &&
      !isActive("moveRight")
    ) {
      this._animations.currentState.down();
      return this.movements.downleft;
    }
    if (
      isActive("moveDown") &&
      isActive("moveRight") &&
      !isActive("moveLeft")
    ) {
      this._animations.currentState.down();
      return this.movements.downright;
    }
    if (isActive("moveUp") && isActive("moveRight") && !isActive("moveLeft")) {
      this._animations.currentState.up();
      return this.movements.upright;
    }
    if (isActive("moveUp")) {
      this._animations.currentState.up();
      return this.movements.up;
    }
    if (isActive("moveDown")) {
      this._animations.currentState.down();
      return this.movements.down;
    }
    if (isActive("moveRight")) {
      this._animations.currentState.right();
      return this.movements.right;
    }
    if (isActive("moveLeft")) {
      this._animations.currentState.left();
      return this.movements.left;
    }
    (this._animations.currentState as MovingState).stop?.();
    return Vector.Zero;
  }

  bindEngine(engine: Engine) {
    listen(engine, this);
  }
}

export class Dummy extends Person {
  private _movement: MutexChannel<MovementDirection> = new MutexChannel([
    "top",
    "bottom",
    "left",
    "right",
    "topLeft",
    "topRight",
    "bottomLeft",
    "bottomRight",
    "stop",
  ]);

  constructor(args: PersonArgs) {
    super(args);
    this._movement.request("stop");
    this._currentWeapon.changeFireMode();
  }

  aimAndfire(direction: Vector, precision: number = 0.5) {
    if (!this._mainAction.available) return;
    this._lookVector = direction;
    this.move("stop");
    this.aim();
    setTimeout(() => {
      this.fire();
    }, precision * 1000);
    setTimeout(() => {
      this.holdFire();
    }, 2500);
  }

  move(direction: MovementDirection) {
    if (!this._movement.available)
      this._movement.release(this._movement.current!);
    this._movement.request(direction);
  }

  protected getMovement() {
    if (this._movement.current === "topLeft") {
      this._animations.currentState.up();
      return this.movements.upleft;
    }
    if (this._movement.current === "bottomLeft") {
      this._animations.currentState.down();
      return this.movements.downleft;
    }
    if (this._movement.current === "bottomRight") {
      this._animations.currentState.down();
      return this.movements.downright;
    }
    if (this._movement.current === "topRight") {
      this._animations.currentState.up();
      return this.movements.upright;
    }
    if (this._movement.current === "top") {
      this._animations.currentState.up();
      return this.movements.up;
    }
    if (this._movement.current === "bottom") {
      this._animations.currentState.down();
      return this.movements.down;
    }
    if (this._movement.current === "right") {
      this._animations.currentState.right();
      return this.movements.right;
    }
    if (this._movement.current === "left") {
      this._animations.currentState.left();
      return this.movements.left;
    }
    (this._animations.currentState as MovingState).stop?.();
    return Vector.Zero;
  }
}
