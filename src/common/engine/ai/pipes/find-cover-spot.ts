import { AiPerception, GenericPipe } from "@engine/state-ai.engine";
import { sleep } from "@utils/time.util";
import { Vector } from "excalibur";

export class FindCoverSpotPipe extends GenericPipe {
  public point: Vector | undefined;
  probability(ai: AiPerception): number {
    return ai.enemyClosest ? 1 : 0;
  }
  execute(ai: AiPerception): Promise<void> {
    this.point = undefined;
    // get nearest cover
    // get nearest cover spot
    return sleep(200);
  }
  interrupt(): void {}
}
