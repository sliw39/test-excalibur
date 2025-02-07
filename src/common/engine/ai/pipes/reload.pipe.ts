import {
  AiPerception,
  Behavior,
  GenericPipe,
} from "@engine/ai/state-ai.engine";
import { EmptyState } from "@utils/state-machines/firearm.state";

export class ReloadPipe extends GenericPipe {
  constructor(behavior: Behavior) {
    super("reload", behavior);
  }

  probability(ai: AiPerception) {
    if (
      ai.player.currentWeapon.bullets ===
      ai.player.currentWeapon.firearm.magsize
    ) {
      return 0;
    }
    if (ai.player.currentWeapon.currentState instanceof EmptyState) {
      return 1;
    }
    if (
      ai.enemyClosest &&
      ai.guard.hasLineOfSight(ai.player.pos, ai.enemyClosest.pos)
    ) {
      return 0;
    }
    return (1 - ai.player.currentWeapon.magEmptiness) * 0.8;
  }

  execute(ai: AiPerception) {
    ai.player.reload();
    return new Promise<void>(async (resolve) => {
      ai.player.currentWeapon.events.once("idle", resolve);
    });
  }
  interrupt = () => {};
}
