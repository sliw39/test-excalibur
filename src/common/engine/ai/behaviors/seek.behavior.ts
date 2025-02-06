import {
  AiPerception,
  Behavior,
  Condition,
  GenericPipe,
  Stance,
} from "@engine/ai/state-ai.engine";
import { randomPointAround } from "@utils/vectors.util";
import { GotoPipe } from "../pipes/goto.pipe";
import { IdlePipe } from "../pipes/idle.pipe";
import { ReloadPipe } from "../pipes/reload.pipe";

export class SeekBehavior extends Behavior {
  constructor(
    minTime: number = 1000,
    stance: Stance,
    aiPerceptionProvider: () => AiPerception,
    conditions: Condition[]
  ) {
    super("seek", minTime, stance, conditions, aiPerceptionProvider);
  }
  init(): void {}
  async execute(): Promise<any> {
    const perception = this.aiPerception;

    if (!perception.enemyClosest) {
      await this.runPipes<GenericPipe>(
        perception,
        new ReloadPipe(this),
        new IdlePipe(this, 0.8, 1000)
      );
      return;
    }

    const action = this.runPipes<GenericPipe>(
      perception,
      new GotoPipe(
        () => randomPointAround(perception.enemyClosest!.pos, 500, 200),
        this
      )
    );

    const awarenessInterval = setInterval(() => {
      const perception = this.aiPerception;
      if (perception.enemyClosestLastSeen < 1000) {
        clearInterval(awarenessInterval);
        this.currentPipe?.interrupt();
      }
    }, 300);

    return await action;
  }
}
