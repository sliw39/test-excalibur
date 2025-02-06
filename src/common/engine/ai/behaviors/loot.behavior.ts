import { PseudoRandomEngine } from "@engine/pseudo-random.engine";
import {
  AiPerception,
  Behavior,
  Condition,
  GenericPipe,
  Stance,
} from "@engine/ai/state-ai.engine";
import { GotoPipe } from "../pipes/goto.pipe";
import { randomPointAround } from "@utils/vectors.util";

export class LootBehavior extends Behavior {
  constructor(
    minTime: number = 1000,
    stance: Stance,
    aiPerceptionProvider: () => AiPerception,
    conditions: Condition[]
  ) {
    super("loot", minTime, stance, conditions, aiPerceptionProvider);
  }
  init(): void {}
  async execute(): Promise<any> {
    const perception = this.aiPerception;

    const action = this.runPipes<GenericPipe>(
      perception,
      new GotoPipe(
        () => randomPointAround(perception.closestResource!, 200),
        this
      )
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
