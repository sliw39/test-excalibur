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
      return new IdlePipe(this, 1, 1000).execute(perception);
    }

    // choose between cover and out of sight
    const lookForCover = new FindCoverSpotPipe(this);
    const lookForOutOfSight = new FindOutOfSightPointPipe(this);
    const action = randomizer.weightPick(
      [lookForCover, lookForOutOfSight],
      [
        lookForCover.probability(perception),
        lookForOutOfSight.probability(perception),
      ]
    );
    await action.execute(perception);

    // goto cover
    return new GotoPipe(() => action.point ?? null, this).execute(perception);
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
