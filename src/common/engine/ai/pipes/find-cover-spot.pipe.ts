import {
  AiPerception,
  Behavior,
  PointFinderPipe,
} from "@engine/ai/state-ai.engine";
import { sleep } from "@utils/time.util";
import { Vector } from "excalibur";

export class FindCoverSpotPipe extends PointFinderPipe {
  constructor(behavior: Behavior) {
    super("find_cover_spot", behavior);
  }

  probability(ai: AiPerception): number {
    return ai.enemyClosest ? 1 : 0;
  }
  execute(ai: AiPerception): Promise<void> {
    this.point = null;
    const covers = (ai.guard.getClosestDecors(ai.player.pos) ?? []).map(
      (cover) => {
        const coverDirection = cover.sub(ai.enemyClosest!.pos).normalize();
        return cover.add(coverDirection.scale(64));
      }
    );

    let currentDistance = Infinity;
    let closestCover = -1;
    for (let i = 0; i < covers.length; i++) {
      const cover = covers[i];
      const distance = Vector.distance(ai.player.pos, cover);
      if (distance < currentDistance) {
        currentDistance = distance;
        closestCover = i;
      }
    }
    if (closestCover !== -1) {
      this.point = covers[closestCover];
    }

    return sleep(200);
  }
  interrupt(): void {}
}
