import { AiPerception, Behavior, GenericPipe } from "@engine/state-ai.engine";

export class ReloadPipe extends GenericPipe {
  constructor(behavior: Behavior) {
    super("reload", behavior);
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
