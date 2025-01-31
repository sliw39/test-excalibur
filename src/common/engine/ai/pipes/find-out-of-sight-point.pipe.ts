import {
  AiPerception,
  Behavior,
  PointFinderPipe,
} from "@engine/ai/state-ai.engine";
import { sleep } from "@utils/time.util";

export class FindOutOfSightPointPipe extends PointFinderPipe {
  constructor(behavior: Behavior) {
    super("find_out_of_sight_point", behavior);
  }

  probability(ai: AiPerception): number {
    return ai.enemyClosest ? (ai.enemyCount > 1 ? 0.5 : 1) : 0;
  }
  execute(ai: AiPerception): Promise<void> {
    this.point = null;
    if (ai.enemyClosest) {
      let perpendicularVec = ai.player.pos
        .sub(ai.enemyClosest.pos)
        .perpendicular()
        .normalize();

      let dist = 0;
      let currentPos = ai.player.pos;
      while (dist < ai.enemyClosestKnownDistance) {
        dist += 32;
        currentPos = currentPos.add(perpendicularVec.scale(32));
        if (!ai.guard.hasLineOfSight(currentPos, ai.enemyClosest.pos)) {
          this.point = currentPos;
          break;
        }
      }
      if (!this.point) {
        perpendicularVec = perpendicularVec.scale(-1);
        dist = 0;
        currentPos = ai.player.pos;
        while (dist < ai.enemyClosestKnownDistance) {
          dist += 32;
          currentPos = currentPos.add(perpendicularVec.scale(32));
          if (!ai.guard.hasLineOfSight(currentPos, ai.enemyClosest.pos)) {
            this.point = currentPos;
            break;
          }
        }
      }
    }
    return sleep(200);
  }
  interrupt(): void {}
}
