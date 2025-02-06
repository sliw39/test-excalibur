import {
  AiPerception,
  Behavior,
  Condition,
  Stance,
} from "@engine/ai/state-ai.engine";
import { sleep } from "@utils/time.util";
import { AimPipe } from "../pipes/aim.pipe";
import { ChangeFireModePipe } from "../pipes/change-fire-mode.pipe";
import { FindLineOfSightPointPipe } from "../pipes/find-line-of-sight-point.pipe";
import { FirePipe } from "../pipes/fire.pipe";
import { GotoPipe } from "../pipes/goto.pipe";
import { IdlePipe } from "../pipes/idle.pipe";
import { ReloadPipe } from "../pipes/reload.pipe";

export class PeakBehavior extends Behavior {
  constructor(
    minTime: number = 1000,
    stance: Stance,
    aiPerceptionProvider: () => AiPerception,
    conditions: Condition[]
  ) {
    super("peak", minTime, stance, conditions, aiPerceptionProvider);
  }
  init(): void {}
  async execute(): Promise<void> {
    let perception = this.aiPerception;

    // reload if necessary
    await this.runPipes(
      perception,
      new IdlePipe(this, 0.2, 0),
      new ReloadPipe(this),
      new ChangeFireModePipe(this, () => perception.player.pos)
    );

    // find line of sight with closest enemy
    const findLineOfSight = await this.runPipes(
      perception,
      new FindLineOfSightPointPipe(this)
    );
    if (!findLineOfSight?.point) {
      await sleep(200);
      return;
    }

    // move into position
    await this.runPipes(
      perception,
      new GotoPipe(() => findLineOfSight.point, this)
    );

    // update perception
    perception = this.aiPerception;

    // aim the enemy
    await this.runPipes(
      perception,
      new AimPipe(this, "normal", () => perception.enemyClosest!.pos)
    );

    // fire
    await this.runPipes(perception, new FirePipe(this));
  }
}
