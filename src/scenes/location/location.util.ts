import { Actor, ActorArgs, Engine, Sprite, Vector } from "excalibur";
import { Bullet } from "./components/bullets.component";
import { Guard } from "@utils/vectors.util";
import { StrictEventEmitter } from "@utils/events.util";

export interface LayeredScene {
  guard: Guard;
  engine: Engine;
  projectilesLayer: ProjectilesLayer;
  entitiesLayer: EntitiesLayer;
  decalsLayer: DecalsLayer;
}

export interface EntitiesLayerEvents {
  added: { entity: Actor };
}
export class EntitiesLayer extends Actor {
  public readonly events = new StrictEventEmitter<EntitiesLayerEvents>();

  constructor(args: ActorArgs) {
    super(args);
  }

  add(entity: Actor) {
    this.addChild(entity);
    this.events.emit("added", { entity });
  }

  getAll() {
    return this.children.filter((e) => e instanceof Actor);
  }
}

export class ProjectilesLayer extends Actor {
  private _bullets: Bullet[] = [];
  constructor(args: ActorArgs) {
    super(args);
  }

  add(bullet: Bullet) {
    this.addChild(bullet);
    this._bullets.push(bullet);
  }

  get bullets() {
    return [...this._bullets];
  }
}

export class DecalsLayer extends Actor {
  constructor(args: ActorArgs) {
    super(args);
  }

  add(decal: Sprite, pos: Vector) {
    this.addChild(new Decal({ sprite: decal, pos }));
  }
}

export class Decal extends Actor {
  constructor(args: ActorArgs & { sprite: Sprite }) {
    super(args);
    this.graphics.use(args.sprite);
    this.z = 50;
  }
}
