import { PseudoRandomEngine } from "@engine/pseudo-random.engine";
import {
  AiPerception,
  Behavior,
  GenericPipe,
  PointFinderPipe,
} from "@engine/ai/state-ai.engine";
import { sleep } from "@utils/time.util";
import {
  allDirections,
  directionStringToVector,
  MovementDirection,
} from "@utils/vectors.util";
import { Vector } from "excalibur";

const randomizer = new PseudoRandomEngine();

export class FindObservationSpotPipe extends PointFinderPipe {
  constructor(
    behavior: Behavior,
    private poi: Vector,
    private maxTileDistance: number = 16
  ) {
    super("find_observation_spot", behavior);
  }

  probability(ai: AiPerception): number {
    return ai.enemyClosestLastSeen > 1000 ? 1 : 0;
  }
  execute(_ai: AiPerception): Promise<void> {
    let direction = randomizer.pick<MovementDirection>(
      allDirections.filter((d) => d !== "stop") as any
    );
    this.point = this.poi!.add(
      directionStringToVector(direction).scale(
        randomizer.nextInt(2, this.maxTileDistance) * 32
      )
    );

    return sleep(200);
  }
  interrupt(): void {}
}
