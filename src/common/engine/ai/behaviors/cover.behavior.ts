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

const randomizer = new PseudoRandomEngine();

export class CoverBehavior extends Behavior {
  constructor(
    minTime: number = 1000,
    stance: Stance,
    aiPerceptionProvider: () => AiPerception,
    private conditions: Condition[]
  ) {
    super("cover", minTime, stance, aiPerceptionProvider);
  }
  init(): void {}
  async execute(): Promise<void> {
    const perception = this.aiPerception;

    // if safe, idle
    if (
      !perception.guard.hasLineOfSight(
        perception.player.pos,
        perception.enemyClosest!.pos
      )
    ) {
      return Behavior.runPipes<any>(
        perception,
        new IdlePipe(this, 0.2, 1000),
        new ReloadPipe(this)
      );
    }

    // choose between cover and out of sight
    const action = await Behavior.runPipes(
      perception,
      new FindCoverSpotPipe(this),
      new FindOutOfSightPointPipe(this)
    );

    // goto cover
    return Behavior.runPipes<any>(
      perception,
      new GotoPipe(() => action?.point ?? null, this)
    );
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
