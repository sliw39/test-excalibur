import { PseudoRandomEngine } from "@engine/pseudo-random.engine";
import {
  AiPerception,
  Behavior,
  Condition,
  GenericPipe,
  Stance,
} from "@engine/ai/state-ai.engine";
import { IdlePipe } from "../pipes/idle.pipe";
import { GotoPipe } from "../pipes/goto.pipe";
import { ReloadPipe } from "../pipes/reload.pipe";
import { FindObservationSpotPipe } from "../pipes/find-observation-spot.pipe";
import { vec } from "excalibur";

export class PatrolBehavior extends Behavior {
  constructor(
    minTime: number = 1000,
    stance: Stance,
    aiPerceptionProvider: () => AiPerception,
    private conditions: Condition[]
  ) {
    super("patrol", minTime, stance, aiPerceptionProvider);
  }
  init(): void {}
  async execute(): Promise<void> {
    const perception = this.aiPerception;

    const newPoi = await this.runPipes<FindObservationSpotPipe>(
      perception,
      new FindObservationSpotPipe(
        this,
        perception.closestResource ?? perception.player.pos.add(vec(64, 64))
      )
    );

    const action = this.runPipes<GenericPipe>(
      perception,
      new IdlePipe(this, 0.3, 4000),
      new ReloadPipe(this),
      new GotoPipe(() => newPoi?.point!, this)
    );

    const awarenessInterval = setInterval(() => {
      if (this.aiPerception.enemyClosestLastSeen < 1000) {
        clearInterval(awarenessInterval);
        this.currentPipe?.interrupt();
      }
    }, 300);
    await action.then(() => {
      clearInterval(awarenessInterval);
    });
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
