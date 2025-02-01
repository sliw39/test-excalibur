import {
  AiPerception,
  Behavior,
  GenericPipe,
} from "@engine/ai/state-ai.engine";
import { bullets, FireMode } from "@models/weapons.model";
import { ballistic } from "@utils/consts.util";
import { sleep } from "@utils/time.util";
import { Vector } from "excalibur";

export class ChangeFireModePipe extends GenericPipe {
  constructor(behavior: Behavior, private _targetProvider: () => Vector) {
    super("change_fire_mode", behavior);
  }

  probability(ai: AiPerception): number {
    if(ai.player.currentWeapon.firearm.fireModes.length <= 1) {
      return 0;
    }
    const target = this._targetProvider();
    const d = ai.player.pos.distance(target);
    if (d > bullets[ai.player.currentWeapon.firearm.caliber].maxRange * ballistic.distanceFactor) {
      return 0;
    }
    if(d < 200 && ai.player.currentWeapon.fireMode === "semi-auto") {
      return 1;
    } else if(d > 800 && ai.player.currentWeapon.fireMode === "auto") {
      return 1;
    }
    return 0.5;
  }
  async execute(ai: AiPerception): Promise<void> {
    ai.player.changeFireMode();
    await sleep(500);
  }
  interrupt(): void {
    
  }

}
