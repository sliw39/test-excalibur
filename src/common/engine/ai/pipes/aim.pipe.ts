import {
  AiPerception,
  Behavior,
  GenericPipe,
} from "@engine/ai/state-ai.engine";
import { bullets } from "@models/weapons.model";
import { ballistic } from "@utils/consts.util";
import { EmptyState } from "@utils/state-machines/firearm.state";
import { nap } from "@utils/time.util";
import { Vector } from "excalibur";

const aimPaceToTime = (pace: "fast" | "assured" | "normal") => {
  switch (pace) {
    case "fast":
      return 300;
    case "assured":
      return 1500;
    case "normal":
    default:
      return 800;
  }
}

export class AimPipe extends GenericPipe {
  private _interrupted = false
  constructor(
    behavior: Behavior,
    private pace: "fast" | "assured" | "normal",
    private _targetProvider: () => Vector
  ) {
    super("aim", behavior);
  }

  probability(ai: AiPerception): number {
    let p = ai.player.currentWeapon.currentState instanceof EmptyState ? 0 : 1;
    const foe = this._targetProvider();

    const d = ai.player.pos.distance(foe);
    if (
      d >
      bullets[ai.player.currentWeapon.firearm.caliber].maxRange *
        ballistic.distanceFactor
    ) {
      return 0;
    }
    if (d < 200 || d > 800) {
      p *= 0.5;
    }

    if (!ai.guard.hasLineOfSight(ai.player.pos, foe)) {
      p *= 0.1;
    }
    return p;
  }
  async execute(ai: AiPerception): Promise<void> {
    const foe = this._targetProvider();
    if (foe) {
      ai.player.lookAt(foe);
      ai.player.aim();
      await nap(aimPaceToTime(this.pace), () => this._interrupted);
    }
    return Promise.resolve();
  }
  interrupt(): void {
    this._interrupted = true;
  }
}
