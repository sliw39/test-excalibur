import { PseudoRandomEngine } from "@engine/pseudo-random.engine";
import {
  AiPerception,
  Behavior,
  Condition,
  Stance,
} from "@engine/state-ai.engine";

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
  execute(): Promise<void> {
    // OR
    //  find out of sight point from closest enemy
    //  find nearest cover from closest enemy
    //    find cover spot from cover
    // THEN
    //  move to cover spot
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
