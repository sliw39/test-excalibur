import { ActorArgs, Vector, Actor, Engine, Circle, Color } from "excalibur";
import { StrictEventEmitter } from "@utils/events.util";
import { BulletModel } from "@models/weapons.model";

export interface BulletArgs extends ActorArgs {
  model: BulletModel;
  initiator: Actor;
  direction: Vector;
  velocity: number;
  accuracy: number;
}
export interface BulletEvents {
  hit: { bullet: Bullet; target: Actor };
}
export class Bullet extends Actor implements BulletModel {
  public events = new StrictEventEmitter<BulletEvents>();

  private _initialPos: Vector;
  private _direction: Vector;
  private _energy: number;
  public readonly caliber: string;
  public readonly initiator: Actor;
  public readonly energyDrop: number;
  public readonly maxRange: number;
  public readonly velocity: number;
  public readonly accuracy: number;

  constructor(args: BulletArgs) {
    super(args);
    this._initialPos = this.pos.clone();
    this._direction = args.direction;
    this._energy = args.model.energy;
    this.velocity = args.velocity;
    this.accuracy = args.accuracy;
    this.initiator = args.initiator;
    this.caliber = args.model.caliber;
    this.energyDrop = args.model.energyDrop;
    this.maxRange = args.model.maxRange;
  }

  get energy() {
    return this._energy;
  }

  set energy(energy: number) {
    this._energy = energy;
  }

  get initialPos() {
    return this._initialPos;
  }

  get direction() {
    return this._direction;
  }

  set direction(direction: Vector) {
    this._direction = direction;
  }

  onInitialize(_engine: Engine): void {
    this.graphics.use(
      new Circle({
        radius: 2,
        color: Color.Black,
      })
    );
  }
}
