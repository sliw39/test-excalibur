import { ActorArgs, Vector, Actor, Engine, Circle, Color } from "excalibur";
import { Guard } from "./person.component";
import { StrictEventEmitter } from "@utils/events.util";
import { BulletModel, energyDrop } from "@models/weapons.model";

export interface BulletArgs extends ActorArgs {
  model: BulletModel;
  initiator: Actor;
  velocity: Vector;
  accuracy: number;
  guard: Guard;
}
export interface BulletEvents {
  hit: { bullet: Bullet; target: Actor };
}
export class Bullet extends Actor implements BulletModel {
  public events = new StrictEventEmitter<BulletEvents>();

  private _initialPos: Vector;
  private _velocity: Vector;
  private _energy: number;
  private _guard: Guard;
  public readonly caliber: string;
  public readonly initiator: Actor;
  public readonly energyDrop: number;
  public readonly maxRange: number;

  constructor(args: BulletArgs) {
    super(args);
    this._initialPos = this.pos.clone();
    this._velocity = Bullet.deviation(args.accuracy, args.velocity);
    this._energy = args.model.energy;
    this._guard = args.guard;
    this.initiator = args.initiator;
    this.caliber = args.model.caliber;
    this.energyDrop = args.model.energyDrop;
    this.maxRange = args.model.maxRange;
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
    const distance = this.pos.distance(this._initialPos);
    this._energy = energyDrop(this, distance);
    if (
      this._energy <= 0 ||
      distance > this.maxRange ||
      this._guard.checkDecorCollision(this.pos)
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
