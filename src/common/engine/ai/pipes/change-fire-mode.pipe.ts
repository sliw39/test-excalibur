import { AiPerception, Behavior, GenericPipe } from "@engine/state-ai.engine";
import { FireMode } from "@models/weapons.model";
import { Vector } from "excalibur";

export class ChangeFireModePipe extends GenericPipe {
  constructor(behavior: Behavior, private _targetProvider: () => Vector) {
    super("change_fire_mode", behavior);
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

  private getAdequateMode(ai: AiPerception): FireMode {
    throw new Error("Method not implemented.");
  }
}
