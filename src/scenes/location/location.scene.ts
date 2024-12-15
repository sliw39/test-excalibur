import { FactoryProps, TiledResource } from "@excaliburjs/plugin-tiled";
import {
  Actor,
  ActorArgs,
  DefaultLoader,
  Engine,
  Scene,
  vec,
  Vector,
} from "excalibur";
import { Bullet } from "./components/bullets.component";
import {
  Guard,
  Person,
  PlayerPlaceholder,
  resources as peopleResources,
} from "./components/people.component";
import { dummyPlayer } from "@utils/consts.util";

export const resources = {
  map: new TiledResource("/maps/map_tiled_farm/IceTilemap.tmx", {
    entityClassNameFactories: {
      entities: (_props: FactoryProps) => {
        return new EntitiesLayer({
          pos: Vector.Zero,
        });
      },
      projectiles: (_props: FactoryProps) => {
        return new ProjectilesLayer({
          pos: Vector.Zero,
        });
      },
    },
  }),
  ...peopleResources,
};

export class LocationScene extends Scene {
  private _tileMap!: TiledResource;
  private _guard!: Guard;
  private _entitiesLayer!: EntitiesLayer;
  private _projectilesLayer!: ProjectilesLayer;

  override onPreLoad(loader: DefaultLoader) {
    this._tileMap = resources.map;
    loader.addResources(Object.values(resources));
  }

  onInitialize(_engine: Engine): void {
    this._tileMap.addToScene(this);

    this._entitiesLayer = this._tileMap.getEntityByObject(
      this._tileMap.getObjectsByName("entities")[0]
    ) as EntitiesLayer;

    this._projectilesLayer = this._tileMap.getEntityByObject(
      this._tileMap.getObjectsByName("projectiles")[0]
    ) as ProjectilesLayer;

    this._guard = new GuardImpl(this._tileMap);

    const spawns = this._tileMap.getObjectsByName("player_start");
    const playerSpawn = spawns[Math.floor(Math.random() * spawns.length)];
    const mainPlayer = new PlayerPlaceholder(
      {
        pos: vec(playerSpawn.x, playerSpawn.y),
      },
      dummyPlayer,
      this._guard
    );
    mainPlayer.bindEngine(_engine);
    this._entitiesLayer.add(mainPlayer);

    const enemyspawns = this._tileMap.getObjectsByName("enemy_start");
    const enemySpawn =
      enemyspawns[Math.floor(Math.random() * enemyspawns.length)];
    const enemyPlayer = new Person(
      {
        pos: vec(enemySpawn.x, enemySpawn.y),
      },
      dummyPlayer,
      this._guard
    );
    this._entitiesLayer.add(enemyPlayer);

    mainPlayer.events.on("fire", (e) => {
      this._projectilesLayer.add(e.bullet);
      e.bullet.events.on("hit", ({ bullet, target }) => {
        if (target instanceof Person) {
          target.model.hit(bullet.energy);
          if (target.model.dead) {
            this._entitiesLayer.removeChild(target);
          }
        }
      });
    });
  }
}

export class GuardImpl implements Guard {
  private _entitiesLayer: EntitiesLayer;
  constructor(private _tileMap: TiledResource) {
    this._entitiesLayer = this._tileMap.getEntityByObject(
      this._tileMap.getObjectsByName("entities")[0]
    )! as EntitiesLayer;
  }

  checkDecorCollision(nextPos: Vector) {
    return this._tileMap.getTileByPoint("collisions", nextPos) !== null;
  }

  checkEntitiesCollision(nextPos: Vector) {
    return this._entitiesLayer
      .getAll()
      .filter((e) => e.graphics.bounds.contains(nextPos));
  }
}

class EntitiesLayer extends Actor {
  constructor(args: ActorArgs) {
    super(args);
  }

  add(entity: Actor) {
    this.addChild(entity);
  }

  getAll() {
    return this.children.filter((e) => e instanceof Actor);
  }
}

class ProjectilesLayer extends Actor {
  constructor(args: ActorArgs) {
    super(args);
  }

  add(bullet: Bullet) {
    this.addChild(bullet);
  }
}
