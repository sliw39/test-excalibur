import { PseudoRandomEngine } from "@engine/pseudo-random.engine";
import {
  AiPerception,
  Behavior,
  Condition,
  GenericPipe,
  Stance,
} from "@engine/ai/state-ai.engine";
import { GotoPipe } from "../pipes/goto.pipe";
import { barycentric, randomPointAround } from "@utils/vectors.util";
import { FindSideVenturePointPipe } from "../pipes/find-side-venture-point.pipe";

export class FlankBehavior extends Behavior {
  constructor(
    minTime: number = 1000,
    stance: Stance,
    aiPerceptionProvider: () => AiPerception,
    conditions: Condition[]
  ) {
    super("flank", minTime, stance, conditions, aiPerceptionProvider);
  }
  init(): void {}
  async execute(): Promise<any> {
    const perception = this.aiPerception;

    const newPoi = await this.runPipes<FindSideVenturePointPipe>(
      perception,
      new FindSideVenturePointPipe(
        this,
        barycentric(perception.foes.map((f) => f.pos)),
        500,
        1000
      )
    );
    const action = this.runPipes<GenericPipe>(
      perception,
      new GotoPipe(() => newPoi?.point!, this)
    );

    const awarenessInterval = setInterval(() => {
      const perception = this.aiPerception;
      if (perception.enemyClosestLastSeen < 1000) {
        clearInterval(awarenessInterval);
        this.currentPipe?.interrupt();
      }
      if (
        perception.closestResource &&
        perception.closestResource.distance(perception.player.pos) < 500
      ) {
        clearInterval(awarenessInterval);
        this.currentPipe?.interrupt();
      }
    }, 300);

    return await action;
  }
}
