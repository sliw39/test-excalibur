import { BulletModel, Firearm, FireMode } from "@models/weapons.model";
import { Bullet } from "@scenes/location/components/bullets.component";
import { Person } from "@scenes/location/components/person.component";
import { LayeredScene } from "@scenes/location/location.util";
import { ballistic } from "@utils/consts.util";
import { Functions } from "@utils/math.util";
import { Actor, Vector } from "excalibur";

export function energyDrop(bullet: BulletModel, distance: number) {
  const fallingFn = Functions.falling(
    bullet.energy,
    bullet.energy * bullet.energyDrop,
    bullet.maxRange * ballistic.distanceFactor,
    (bullet.maxRange * ballistic.distanceFactor) / 2
  );
  return fallingFn(distance);
}

export function deviation(accuracy: number, vector: Vector) {
  const maxAngle = ((1 - accuracy) * Math.PI) / 3;
  const angle = Math.random() * maxAngle - maxAngle / 2;
  return vector.rotate(angle);
}

export function aimingTime(fireMode: FireMode, handling: number) {
  switch (fireMode) {
    case "semi-auto":
      return handling;
    case "burst":
      return handling * 1.5;
    case "auto":
      return handling * 2;
  }
}

export function instanciateBullet(
  person: Person,
  model: BulletModel,
  accuracy: number,
  velocity: number
) {
  return new Bullet({
    pos: person.pos,
    accuracy: person.currentAccuracy * accuracy,
    velocity: velocity,
    direction: person.lookVector.normalize(),
    model: model,
    initiator: person,
  });
}

export function computeAimAcuracy(
  t: number,
  fireMode: FireMode,
  firearm: Firearm,
  accuracy: number
) {
  const aimingTimeMax = aimingTime(fireMode, firearm.handling);
  return Functions.sigmoid(accuracy, 0, aimingTimeMax)(t);
}

export function accuracy(fireMode: FireMode, accuracy: number) {
  switch (fireMode) {
    case "semi-auto":
      return (function* () {
        while (true) {
          yield accuracy;
        }
      })();
    case "burst":
      return (function* () {
        yield accuracy;
        yield accuracy * 0.99;
        yield accuracy * 0.96;
        while (true) {
          yield accuracy * 0.8;
        }
      })();
    case "auto":
      return (function* () {
        yield accuracy;
        yield accuracy * 0.96;
        yield accuracy * 0.93;
        while (true) {
          yield accuracy * 0.9;
        }
      })();
  }
}

export class BallisticEngine {
  private _updateLastTime = Date.now();
  private _interval: NodeJS.Timeout | null = null;
  constructor(private _scene: LayeredScene) {
    this._scene.entitiesLayer.events.on("added", ({ entity }) => {
      this.bindEntity(entity);
    });
    this._scene.entitiesLayer.getAll().forEach((e) => this.bindEntity(e));

    this._interval = setInterval(() => {
      this.update();
    }, 1000 / 60);
  }

  private bindEntity(entity: Actor) {
    if (entity instanceof Person) {
      entity.events.on("fire", (e) => {
        const bullet = e.bullet;
        bullet.direction = deviation(bullet.accuracy, bullet.direction);
        this.spawnBullet(e.bullet);
      });
    }
  }

  public cleanUp() {
    if (this._interval) {
      clearInterval(this._interval);
    }
  }

  public spawnBullet(bullet: Bullet) {
    this._scene.projectilesLayer.add(bullet);
    bullet.events.on("hit", ({ bullet, target }) => {
      if (target instanceof Person) {
        target.model.hit(
          energyDrop(bullet, Vector.distance(bullet.initialPos, target.pos))
        );
        this._scene.projectilesLayer.removeChild(bullet);
      }
    });
  }

  private update() {
    const now = Date.now();
    const delta = now - this._updateLastTime;
    this._updateLastTime = now;

    for (const b of this._scene.projectilesLayer.bullets) {
      b.pos = b.pos.add(
        b.direction.scale(b.velocity * ballistic.velocityFactor * delta)
      );

      const distance = b.pos.distance(b.initialPos);
      if (
        distance > b.maxRange * ballistic.distanceFactor ||
        this._scene.guard.checkDecorCollision(b.pos)
      ) {
        this._scene.projectilesLayer.removeChild(b);
      }
      this._scene.guard
        .checkEntitiesCollision(b.pos)
        .filter((e) => e !== b.initiator)
        .forEach((target) => {
          b.events.emit("hit", { bullet: b, target });
        });
    }
  }
}
