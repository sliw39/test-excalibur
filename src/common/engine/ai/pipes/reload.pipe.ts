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
    return ai.player.currentWeapon.currentState instanceof EmptyState
      ? 1
      : (1 - ai.player.currentWeapon.magEmptiness) * 0.8;
  }

  execute(ai: AiPerception) {
    ai.player.reload();
    return new Promise<void>(async (resolve) => {
      ai.player.currentWeapon.events.once("idle", resolve);
    });
  }
  interrupt = () => {};
}
