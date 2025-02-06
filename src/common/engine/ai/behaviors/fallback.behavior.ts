import { PseudoRandomEngine } from "@engine/pseudo-random.engine";
import {
  AiPerception,
  Behavior,
  Condition,
  GenericPipe,
  PointFinderPipe,
  Stance,
} from "@engine/ai/state-ai.engine";
import { IdlePipe } from "../pipes/idle.pipe";
import { GotoPipe } from "../pipes/goto.pipe";
import { ReloadPipe } from "../pipes/reload.pipe";
import { FindOutOfSightPointPipe } from "../pipes/find-out-of-sight-point.pipe";
import { FindRetreatSpotPipe } from "../pipes/find-retreat-spot.pipe";

export class FallbackBehavior extends Behavior {
  constructor(
    minTime: number = 1000,
    stance: Stance,
    aiPerceptionProvider: () => AiPerception,
    conditions: Condition[]
  ) {
    super("fallback", minTime, stance, conditions, aiPerceptionProvider);
  }
  init(): void {}
  async execute(): Promise<void> {
    const perception = this.aiPerception;

    const newPoi = await this.runPipes<PointFinderPipe>(
      perception,
      new FindOutOfSightPointPipe(this),
      new FindRetreatSpotPipe(this)
    );

    await this.runPipes<GenericPipe>(
      perception,
      new IdlePipe(this, 0.3, 4000),
      new ReloadPipe(this),
      new GotoPipe(() => newPoi?.point!, this)
    );
  }
}
