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

export const resources = {
  accuracyCone: new ImageSource(accuracyConeImgUrl),
};

export interface Guard {
  checkDecorCollision(nextPos: Vector): boolean;
  checkEntitiesCollision(nextPos: Vector): Actor[];
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
  }

  update(_engine: Engine, _delta: number): void {
    let pos = this.pos.add(
      this.getMovement().scale(this._mainAction.current ? 0.5 : 1)
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
      if (this._fireAccuracy < 1) this._fireAccuracy += 0.01;
      let vector = _engine.input.pointers.primary.lastScreenPos.add(
        this.pos.scale(-1)
      );
      vector = vector.scale(1 + 0.5 * (1 - this._fireAccuracy));
      this._lookVector = vector;
      const accuracyCone = resources.accuracyCone.toSprite();
      accuracyCone.height = Math.max(vector.size * (1 - this._fireAccuracy), 2);
      accuracyCone.width = vector.size;
      accuracyCone.opacity = this._fireAccuracy;
      accuracyCone.origin = vec(
        accuracyCone.width / 2,
        accuracyCone.height / 2
      );
      const angle = vector.toAngle();
      accuracyCone.rotation = angle;
      graphics.push({
        graphic: accuracyCone,
        offset: vec(
          -accuracyCone.width / 2 + 16,
          -accuracyCone.height / 2 + 16
        ).add(vector.scale(0.5)),
        useBounds: false,
      });
    }

    this.graphics.use(new GraphicsGroup({ members: graphics }));
  }

  protected getMovement() {
    (this._animations.currentState as MovingState).stop?.();
    return Vector.Zero;
  }

  attack(event: ActionType) {
    const state = this._currentWeapon.currentState;
    if (event === "press" && state instanceof FireState) {
      state.interrupt();
      return;
    }
    if (
      event === "toogle_on" &&
      this._mainAction.available &&
      state instanceof IdleState
    ) {
      this._mainAction.request("attack");
      this.color = Color.Red;
      this._fireAccuracy = 0;
      state.aim();
      this.events.emit("aim", void 0);
    }
    if (
      event === "toogle_off" &&
      this._mainAction.current === "attack" &&
      state instanceof AimState
    ) {
      this._mainAction.release("attack");
      this.color = Color.Blue;
      state.fire();
    }
  }
}

export class PlayerPlaceholder extends Person implements ActionReadyBinder {
  constructor(args: PersonArgs, public binderName = "player") {
    super(args);
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

  protected getMovement() {
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
