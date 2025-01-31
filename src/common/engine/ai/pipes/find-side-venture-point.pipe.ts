import {
  AiPerception,
  Behavior,
  PointFinderPipe,
} from "@engine/ai/state-ai.engine";
import { sleep } from "@utils/time.util";
import { Vector } from "excalibur";

export class FindSideVenturePointPipe extends PointFinderPipe {
  constructor(
    behavior: Behavior,
    private target: Vector,
    private minDistance: number,
    private maxDistance: number
  ) {
    super("find_side_venture_point", behavior);
  }

  probability(_ai: AiPerception): number {
    return 1;
  }
  execute(ai: AiPerception): Promise<void> {
    this.point = null;
    let perpendicularVec = this.target
      .sub(ai.player.pos)
      .perpendicular()
      .normalize();

    let dist = this.minDistance;
    let currentPos = this.target.add(perpendicularVec.scale(this.minDistance));
    while (dist < this.maxDistance) {
      dist += 32;
      currentPos = currentPos.add(perpendicularVec.scale(32));
      if (!ai.guard.hasLineOfSight(currentPos, this.target)) {
        this.point = currentPos;
        break;
      }
    }
    if (!this.point) {
      perpendicularVec = perpendicularVec.scale(-1);
      dist = this.minDistance;
      currentPos = this.target.add(perpendicularVec.scale(this.minDistance));
      while (dist < this.maxDistance) {
        dist += 32;
        currentPos = currentPos.add(perpendicularVec.scale(32));
        if (!ai.guard.hasLineOfSight(currentPos, this.target)) {
          this.point = currentPos;
          break;
        }
      }
    }
    return sleep(200);
  }
  interrupt(): void {}
}
