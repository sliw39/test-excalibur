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

export const resources = {
  accuracyCone: new ImageSource(accuracyConeImgUrl),
};

export interface Guard {
  checkDecorCollision(nextPos: Vector): boolean;
  checkEntitiesCollision(nextPos: Vector): Actor[];
}

export interface PersonEvents {
  fire: { bullet: Bullet };
}
export class Person extends Actor {
  public events = new StrictEventEmitter<PersonEvents>();

  public readonly movements;
  protected _lookVector = vec(1, 0);
  protected _fireAccuracy = 1;
  protected _mainAction = new MutexChannel(["attack", "pickup"]);

  constructor(args: ActorArgs, public model: Player, protected guard: Guard) {
    super(args);
    this.movements = cloneMovement(
      (this.model.agility / 100) * movements.human
    );
  }

  onInitialize(_engine: Engine): void {
    this.graphics.use(
      new Rectangle({
        width: 16,
        height: 16,
        color: this.color,
      })
    );
  }

  attack(event: ActionType) {
    if (event === "toogle_on" && this._mainAction.available) {
      this._mainAction.request("attack");
      this.color = Color.Red;
      this._fireAccuracy = 0;
    }
    if (event === "toogle_off" && this._mainAction.current === "attack") {
      this._mainAction.release("attack");
      this.color = Color.Blue;
      const accuracy = this._fireAccuracy;
      this._fireAccuracy = 0;

      // TODO Delegate to a weapon
      this.events.emit("fire", {
        bullet: new Bullet({
          pos: this.pos,
          accuracy,
          velocity: this._lookVector.normalize().scale(10),
          energy: 100,
          guard: this.guard,
          initiator: this,
        }),
      });
    }
  }
}

export class PlayerPlaceholder extends Person implements ActionReadyBinder {
  constructor(
    args: ActorArgs,
    model: Player,
    guard: Guard,
    public binderName = "player"
  ) {
    super(args, model, guard);
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

  onPreUpdate(_engine: Engine, _delta: number): void {
    let pos = this.pos.add(
      this.getMovement().scale(this._mainAction.current ? 0.5 : 1)
    );

    if (
      pos != this.pos &&
      !this.guard.checkDecorCollision(pos) &&
      !this.guard.checkEntitiesCollision(pos).filter((e) => e !== this).length
    ) {
      this.pos = pos;
    }

    const graphics: (Graphic | GraphicsGrouping)[] = [
      {
        graphic: new Rectangle({
          width: 16,
          height: 16,
          color: this.color,
        }),
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
          -accuracyCone.width / 2 + 8,
          -accuracyCone.height / 2 + 8
        ).add(vector.scale(0.5)),
        useBounds: false,
      });
    }

    this.graphics.use(new GraphicsGroup({ members: graphics }));
  }

  private getMovement() {
    if (isActive("moveUp") && isActive("moveLeft") && !isActive("moveRight"))
      return this.movements.upleft;
    if (isActive("moveDown") && isActive("moveLeft") && !isActive("moveRight"))
      return this.movements.downleft;
    if (isActive("moveDown") && isActive("moveRight") && !isActive("moveLeft"))
      return this.movements.downright;
    if (isActive("moveUp") && isActive("moveRight") && !isActive("moveLeft"))
      return this.movements.upright;
    if (isActive("moveUp")) return this.movements.up;
    if (isActive("moveDown")) return this.movements.down;
    if (isActive("moveRight")) return this.movements.right;
    if (isActive("moveLeft")) return this.movements.left;
    return Vector.Zero;
  }

  bindEngine(engine: Engine) {
    listen(engine, this);
  }
}
