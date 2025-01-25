import { AiPerception, Behavior, GenericPipe } from "@engine/state-ai.engine";

export class FirePipe extends GenericPipe {
  constructor(behavior: Behavior) {
    super("fire", behavior);
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
