import {
  AiPerception,
  Behavior,
  Condition,
  GenericPipe,
  Stance,
} from "@engine/ai/state-ai.engine";
import { sleep } from "@utils/time.util";
import { barycentric } from "@utils/vectors.util";
import { GotoPipe } from "../pipes/goto.pipe";
import { IdlePipe } from "../pipes/idle.pipe";
import { ReloadPipe } from "../pipes/reload.pipe";

export class RegroupBehavior extends Behavior {
  constructor(
    minTime: number = 1000,
    stance: Stance,
    aiPerceptionProvider: () => AiPerception,
    conditions: Condition[]
  ) {
    super("regroup", minTime, stance, conditions, aiPerceptionProvider);
  }
  init(): void {}
  async execute(): Promise<void> {
    const perception = this.aiPerception;

    if (
      perception.friendClosestKnownDistance > 1000 &&
      perception.friendClosest
    ) {
      await this.runPipes<GenericPipe>(
        perception,
        new IdlePipe(this, 0.3, 4000),
        new ReloadPipe(this),
        new GotoPipe(
          () =>
            barycentric([perception.friendClosest!.pos, perception.player.pos]),
          this
        )
      );
    } else {
      await sleep(200);
    }
  }
}
