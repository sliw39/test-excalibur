import { Dummy } from "@scenes/location/components/person-dummy.component";
import { Guard } from "@utils/vectors.util";
import { Actor, Vector } from "excalibur";
import { AiPerception } from "./state-ai.engine";

interface CacheItem {
  lastUpdate: Date;
  entitiesMemo: WeakMap<
    Actor,
    { lastSeen: Date; pos: Vector; estimatedDistance: number }
  >;
}
const cache = new WeakMap<Dummy, CacheItem>();

export function buildPerception(dummy: Dummy, guard: Guard): AiPerception {
  if (!cache.has(dummy)) {
    cache.set(dummy, {
      lastUpdate: new Date(),
      entitiesMemo: new WeakMap(),
    });
  }
  const lastInfo = cache.get(dummy)!;
  const now = new Date();
  const entities = guard
    .getClosestEntities(dummy.pos, 1500)
    .filter((e) => e !== dummy && e instanceof Dummy)
    .map((entity) => {
      const canSee = guard.hasLineOfSight(dummy.pos, entity.pos);
      const estimatedDistance = dummy.pos.distance(entity.pos);
      if (canSee && estimatedDistance < 1500) {
        const data = {
          lastSeen: now,
          pos: entity.pos,
          estimatedDistance,
        };
        lastInfo.entitiesMemo.set(entity, data);
      }
      return entity as Dummy;
    })
    .filter(lastInfo.entitiesMemo.has)
    .toSorted((e1, e2) => {
      const d1 = lastInfo.entitiesMemo.get(e1)!;
      const d2 = lastInfo.entitiesMemo.get(e2)!;
      let diff = Math.round(
        (d2.lastSeen.getTime() - d1.lastSeen.getTime()) / 1000
      );
      if (diff === 0) {
        diff = d1.estimatedDistance - d2.estimatedDistance;
      }
      return diff;
    });
  const closest = entities[0];
  const closestInfo = lastInfo.entitiesMemo.get(closest);
  return {
    player: dummy,
    guard,
    foes: entities,
    currentHealth: dummy.model.currentLife,
    currentWeapon: dummy.currentWeapon,
    enemyClosestKnownDistance:
      entities.length > 0 ? closestInfo!.estimatedDistance : Infinity,
    enemyClosestLastSeen:
      entities.length > 0
        ? now.getTime() - closestInfo!.lastSeen.getTime()
        : Infinity,
    enemyClosest: closest,
    enemyClosestWeapon: closest?.currentWeapon,
    enemyCount: entities.length,
    friendsBehavior: [],
    friendClosestKnownDistance: Infinity,
    friendClosestLastSeen: Infinity,
    friendCount: 0,
    friendClosest: undefined,
    closestResource: undefined,
  };
}
