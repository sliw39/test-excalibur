import { PseudoRandomEngine } from "@engine/pseudo-random.engine";
import {
  AiPerception,
  Behavior,
  Condition,
  GenericPipe,
  Stance,
} from "@engine/ai/state-ai.engine";
import { IdlePipe } from "../pipes/idle.pipe";
import { ReloadPipe } from "../pipes/reload.pipe";

export class ChillBehavior extends Behavior {
  constructor(
    minTime: number = 1000,
    stance: Stance,
    aiPerceptionProvider: () => AiPerception,
    conditions: Condition[]
  ) {
    super("chill", minTime, stance, conditions, aiPerceptionProvider);
  }
  init(): void {}
  async execute(): Promise<void> {
    const perception = this.aiPerception;

    const action = this.runPipes<GenericPipe>(
      perception,
      new IdlePipe(this, 0.9, 4000),
      new ReloadPipe(this)
    );

    const awarenessInterval = setInterval(() => {
      if (this.aiPerception.enemyClosestLastSeen < 1000) {
        clearInterval(awarenessInterval);
        this.currentPipe?.interrupt();
      }
    }, 300);
    return action.then(() => {
      clearInterval(awarenessInterval);
    });
  }
}
