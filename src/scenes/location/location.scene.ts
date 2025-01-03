import * as dummies from "@art/player/32x32/RPGCharacterTemplate/RPG_Character_Template";
import * as bloodSprites from "@art/helpers/blood-decal";
import { DumbAI } from "@engine/dumb-ai.engine";
import { FactoryProps, TiledResource } from "@excaliburjs/plugin-tiled";
import { dummyPlayer } from "@utils/consts.util";
import { FirearmStateManager } from "@utils/state-machines/firearm.state";
import { Guard, splitSegment } from "@utils/vectors.util";
import { DefaultLoader, Engine, Scene, vec, Vector } from "excalibur";
import { Bullet } from "./components/bullets.component";
import { Dummy } from "./components/person-dummy.component";
import { PlayerPlaceholder } from "./components/person-player.component";
import {
  resources as peopleResources,
  Person,
} from "./components/person.component";
import { firearms } from "@models/weapons.model";
import { PseudoRandomEngine } from "@engine/pseudo-random.engine";
import { HudComponent } from "./components/hud/hud.component";
import {
  EntitiesLayer,
  ProjectilesLayer,
  DecalsLayer,
  LayeredScene,
} from "./location.util";
import { BallisticEngine } from "@engine/ballistic.engine";

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
      decals: (_props: FactoryProps) => {
        return new DecalsLayer({
          pos: Vector.Zero,
        });
      },
    },
  }),
  ...peopleResources,
  ...dummies.resources,
  ...bloodSprites.resources,
};

export class LocationScene extends Scene implements LayeredScene {
  private _tileMap!: TiledResource;
  private _guard!: Guard;
  private _entitiesLayer!: EntitiesLayer;
  private _projectilesLayer!: ProjectilesLayer;
  private _decalsLayer!: DecalsLayer;
  private hud!: HudComponent;
  private ballisticEngine!: BallisticEngine;

  get guard(): Guard {
    return this._guard;
  }
  get projectilesLayer(): ProjectilesLayer {
    return this._projectilesLayer;
  }
  get entitiesLayer(): EntitiesLayer {
    return this._entitiesLayer;
  }
  get decalsLayer(): DecalsLayer {
    return this._decalsLayer;
  }

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

    this._decalsLayer = this._tileMap.getEntityByObject(
      this._tileMap.getObjectsByName("decals")[0]
    ) as DecalsLayer;

    this._guard = new GuardImpl(this._tileMap);
    const rng = new PseudoRandomEngine();

    const mainPlayer = new PlayerPlaceholder({
      pos: this.getSpawnPoint("player_start"),
      model: dummyPlayer(),
      defaultWeapon: new FirearmStateManager(firearms["AK-47"]()),
      guard: this._guard,
      animations: dummies.characters[0](150),
    });
    mainPlayer.bindEngine(_engine);
    this.addPerson(mainPlayer);
    this.camera.strategy.lockToActor(mainPlayer);
    mainPlayer.model.events.on("hit", () => this.camera.shake(5, 0, 250));

    for (let i = 0; i < import.meta.env.VITE_TEST_AREA_ENEMY_COUNT; i++) {
      const enemyPlayer = new Dummy({
        pos: this.getSpawnPoint("enemy_start"),
        model: dummyPlayer(),
        defaultWeapon: new FirearmStateManager(
          rng.pick(Object.values(firearms))()
        ),
        guard: this._guard,
        animations: dummies.characters[1](150),
      });

      const ai = new DumbAI(enemyPlayer, this._guard, [mainPlayer]);
      ai.wake();
      enemyPlayer.model.events.on("dead", () => ai.sleep());
      this.addPerson(enemyPlayer);
    }

    this.hud = new HudComponent({
      player: mainPlayer,
    });
    this.add(this.hud);
  }

  onActivate(): void {
    this.hud.show();
    this.ballisticEngine = new BallisticEngine(this);
  }

  onDeactivate(): void {
    this.hud.hide();
    this.ballisticEngine.cleanUp();
  }

  addPerson(person: Person) {
    this._entitiesLayer.add(person);
    person.model.events.once("dead", () => {
      person.rotation = Math.PI / 2;
    });
    person.events.on("bleed", (_e) => {
      this.decalsLayer.add(bloodSprites.randomBloodDecal(), person.pos);
    });
  }

  getSpawnPoint(name: "enemy_start" | "player_start") {
    const spawns = this._tileMap
      .getObjectsByName(name)
      .filter(
        (s) => this._guard.checkEntitiesCollision(vec(s.x, s.y)).length === 0
      );
    const spawn = spawns[Math.floor(Math.random() * spawns.length)];
    return vec(spawn.x, spawn.y) ?? null;
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

  hasLineOfSight(a: Vector, b: Vector) {
    return !splitSegment(a, b, 32).some((p) => this.checkDecorCollision(p));
  }
}
