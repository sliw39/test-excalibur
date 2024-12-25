import { ActorArgs, Vector, Actor, Engine, Circle, Color } from "excalibur";
import { Guard } from "./person.component";
import { StrictEventEmitter } from "@utils/events.util";
import { bullets } from "@utils/consts.util";

export interface BulletArgs extends ActorArgs {
  initiator: Actor;
  velocity: Vector;
  accuracy: number;
  energy: number;
  guard: Guard;
}
export interface BulletEvents {
  hit: { bullet: Bullet; target: Actor };
}
export class Bullet extends Actor {
  public events = new StrictEventEmitter<BulletEvents>();

  private _initialPos: Vector;
  private _velocity: Vector;
  private _energy: number;
  private _guard: Guard;
  public readonly initiator: Actor;

  constructor(args: BulletArgs) {
    super(args);
    this._initialPos = this.pos.clone();
    this._velocity = Bullet.deviation(args.accuracy, args.velocity);
    this._energy = args.energy;
    this._guard = args.guard;
    this.initiator = args.initiator;
  }

  get energy() {
    return this._energy;
  }

  private static deviation(accuracy: number, velocity: Vector) {
    const maxAngle = ((1 - accuracy) * Math.PI) / 3;
    const angle = Math.random() * maxAngle - maxAngle / 2;
    return velocity.rotate(angle);
  }

  onInitialize(_engine: Engine): void {
    this.graphics.use(
      new Circle({
        radius: 2,
        color: Color.Black,
      })
    );
  }

  update(_engine: Engine, _delta: number): void {
    this.pos = this.pos.add(this._velocity);
    this._energy -= bullets.energyDrop;
    if (
      this.pos.distance(this._initialPos) > bullets.maxRange ||
      this._guard.checkDecorCollision(this.pos) ||
      this._energy <= 0
    ) {
      this.kill();
    }
    this._guard
      .checkEntitiesCollision(this.pos)
      .filter((e) => e !== this.initiator)
      .forEach((target) => {
        this.kill();
        this.events.emit("hit", { bullet: this, target });
      });
  }
}
