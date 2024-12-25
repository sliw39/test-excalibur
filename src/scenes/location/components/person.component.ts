import accuracyConeImgUrl from "@art/helpers/accuracy_cone.svg?url";
import { Player } from "@models/player.model";
import { cloneMovement, movements } from "@utils/consts.util";
import { StrictEventEmitter } from "@utils/events.util";
import { MutexChannel } from "@utils/mutex.util";
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
import {
  Actor,
  ActorArgs,
  Engine,
  Graphic,
  GraphicsGroup,
  GraphicsGrouping,
  ImageSource,
  Rectangle,
  Text,
  vec,
  Vector
} from "excalibur";
import { Bullet } from "./bullets.component";

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
  protected _mainAction = new MutexChannel(["attack", "pickup", "dead"]);
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
      if(this._mainAction.current)
        this._mainAction.release(this._mainAction.current);
      this._mainAction.request("dead")
      if (this._currentWeapon.currentState instanceof FireState)
        this._currentWeapon.currentState.interrupt();
      this.kill();
    });
  }

  update(_engine: Engine, _delta: number): void {
    if(this._mainAction.current !== "dead") {
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
    }

    const graphics: (Graphic | GraphicsGrouping)[] = [
      {
        graphic: (this._animations.currentState as MovingState)
          .graphic as unknown as Graphic,
        offset: vec(0, 0),
      }
    ];

    if(import.meta.env.VITE_DEBUG_PERSON === "true") {
      graphics.push({
        graphic: new Text({
          text: this._mainAction.current + '\n' + this._currentWeapon.currentState.name,
        }),
        offset: vec(0, 40),
        useBounds: false
      });
    }

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
    if(this._mainAction.request("attack") === null) return;
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
    if(this._mainAction.current !== "attack") return;
    const state = this._currentWeapon.currentState;
    if (this._currentWeapon.getTransitions().some((t) => t.name === "fire")) {
      (state as AimState).fire();
    }
  }

  holdFire() {
    const state = this._currentWeapon.currentState;
    if (this._currentWeapon.getTransitions().some((t) => t.name === "idle")) {
      (state as FireState).interrupt();
    }
    this._mainAction.release("attack");
  }
}