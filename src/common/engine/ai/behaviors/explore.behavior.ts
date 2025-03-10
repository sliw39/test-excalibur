import {
  AiPerception,
  Behavior,
  Condition,
  GenericPipe,
  Stance,
} from "@engine/ai/state-ai.engine";
import { FindObservationSpotPipe } from "../pipes/find-observation-spot.pipe";
import { GotoPipe } from "../pipes/goto.pipe";
import { IdlePipe } from "../pipes/idle.pipe";
import { ReloadPipe } from "../pipes/reload.pipe";

export class ExploreBehavior extends Behavior {
  constructor(
    minTime: number = 1000,
    stance: Stance,
    aiPerceptionProvider: () => AiPerception,
    conditions: Condition[]
  ) {
    super("explore", minTime, stance, conditions, aiPerceptionProvider);
  }
  init(): void {}
  async execute(): Promise<void> {
    const perception = this.aiPerception;

    const newPoi = await this.runPipes<FindObservationSpotPipe>(
      perception,
      new FindObservationSpotPipe(this, perception.player.pos, 32)
    );

    const action = this.runPipes<GenericPipe>(
      perception,
      new IdlePipe(this, 0.1, 4000),
      new ReloadPipe(this),
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
    return action.then(() => {
      clearInterval(awarenessInterval);
    });
  }
}
