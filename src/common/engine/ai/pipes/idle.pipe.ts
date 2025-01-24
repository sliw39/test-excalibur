import { AiPerception, Behavior, GenericPipe } from "@engine/state-ai.engine";
import { nap } from "@utils/time.util";

export class IdlePipe extends GenericPipe {
  private _interrupted = false;

  constructor(
    behavior: Behavior,
    private _probability: number,
    private _duration: number
  ) {
    super("idle", behavior);
  }

  probability(_ai: AiPerception): number {
    return this._probability;
  }
  execute(_ai: AiPerception): Promise<void> {
    return nap(this._duration, () => this._interrupted);
  }

  interrupt(): void {
    this._interrupted = true;
  }
}
