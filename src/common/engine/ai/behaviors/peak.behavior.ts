import { PseudoRandomEngine } from "@engine/pseudo-random.engine";
import {
  AiPerception,
  Behavior,
  Condition,
  Stance,
} from "@engine/state-ai.engine";
import { FindCoverSpotPipe } from "../pipes/find-cover-spot.pipe";
import { FindOutOfSightPointPipe } from "../pipes/find-out-of-sight-point.pipe";
import { IdlePipe } from "../pipes/idle.pipe";
import { GotoPipe } from "../pipes/goto.pipe";
import { ReloadPipe } from "../pipes/reload.pipe";
import { FindLineOfSightPointPipe } from "../pipes/find-line-of-sight-point.pipe";
import { AimPipe } from "../pipes/aim.pipe";
import { FirePipe } from "../pipes/fire.pipe";
import { sleep } from "@utils/time.util";

const randomizer = new PseudoRandomEngine();

export class PeakBehavior extends Behavior {
  constructor(
    minTime: number = 1000,
    stance: Stance,
    aiPerceptionProvider: () => AiPerception,
    private conditions: Condition[]
  ) {
    super("peak", minTime, stance, aiPerceptionProvider);
  }
  init(): void {}
  async execute(): Promise<void> {
    let perception = this.aiPerception;

    // reload if necessary
    await Behavior.runPipes(
      perception,
      new IdlePipe(this, 0.2, 0),
      new ReloadPipe(this)
    );

    // find line of sight with closest enemy
    const findLineOfSight = await Behavior.runPipes(
      perception,
      new FindLineOfSightPointPipe(this)
    );
    if (!findLineOfSight?.point) {
      await sleep(200);
      return;
    }

    // move into position
    await Behavior.runPipes(
      perception,
      new GotoPipe(() => findLineOfSight.point, this)
    );

    // update perception
    perception = this.aiPerception;

    // aim the enemy
    await Behavior.runPipes(
      perception,
      new AimPipe(this, "normal", () => perception.enemyClosest!.pos)
    );

    // fire
    await Behavior.runPipes(perception, new FirePipe(this));
  }
  evaluateNextState(): string | null {
    const perception = this.aiPerception;
    return (
      new PseudoRandomEngine().pick(
        this.conditions.filter((c) => c.evaluate(perception))
      )?.transition ?? null
    );
  }
}
