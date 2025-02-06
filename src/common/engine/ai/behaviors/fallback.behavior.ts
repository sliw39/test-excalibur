import {
  AiPerception,
  Behavior,
  Condition,
  GenericPipe,
  PointFinderPipe,
  Stance,
} from "@engine/ai/state-ai.engine";
import { FindOutOfSightPointPipe } from "../pipes/find-out-of-sight-point.pipe";
import { FindRetreatSpotPipe } from "../pipes/find-retreat-spot.pipe";
import { GotoPipe } from "../pipes/goto.pipe";
import { IdlePipe } from "../pipes/idle.pipe";
import { ReloadPipe } from "../pipes/reload.pipe";

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
