import {
  AiPerception,
  Behavior,
  GenericPipe,
} from "@engine/ai/state-ai.engine";
import { IdleState } from "@utils/state-machines/firearm.state";
import { nap } from "@utils/time.util";

export class FirePipe extends GenericPipe {
  private _interrupted = false;
  constructor(behavior: Behavior) {
    super("fire", behavior);
  }

  probability(_ai: AiPerception): number {
    return 1;
  }
  async execute(ai: AiPerception): Promise<void> {
    ai.player.fire();
    await nap(10000, () => {
      return (
        this._interrupted ||
        ai.player.currentWeapon.currentState instanceof IdleState ||
        ai.player.currentWeapon.bullets <= 0
      );
    });
  }
  interrupt(): void {
    this._interrupted = true;
  }
}
