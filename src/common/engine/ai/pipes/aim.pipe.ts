import {
  AiPerception,
  Behavior,
  GenericPipe,
} from "@engine/ai/state-ai.engine";
import { sleep } from "@utils/time.util";
import { Vector } from "excalibur";

export class AimPipe extends GenericPipe {
  constructor(
    behavior: Behavior,
    private pace: "fast" | "assured" | "normal",
    private _targetProvider: () => Vector
  ) {
    super("aim", behavior);
  }

  probability(ai: AiPerception): number {
    throw new Error("Method not implemented.");
  }
  execute(ai: AiPerception): Promise<void> {
    throw new Error("Method not implemented.");
  }
  interrupt(): void {
    throw new Error("Method not implemented.");
  }
}
