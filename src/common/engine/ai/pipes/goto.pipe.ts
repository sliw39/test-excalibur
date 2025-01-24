import { AiPerception, Behavior, GenericPipe } from "@engine/state-ai.engine";
import { manhattanDistance } from "@utils/vectors.util";
import { vec, Vector } from "excalibur";

export class GotoPipe extends GenericPipe {
  constructor(
    private _targetProvider: () => Vector | null,
    behavior: Behavior
  ) {
    super("go_to", behavior);
  }

  probability(_ai: AiPerception): number {
    return 1;
  }
  execute(ai: AiPerception): Promise<void> {
    throw new Error("Method not implemented.");
  }
  interrupt(): void {
    throw new Error("Method not implemented.");
  }
}
