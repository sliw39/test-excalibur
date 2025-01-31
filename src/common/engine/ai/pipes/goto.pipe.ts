import { AstarGrid } from "@engine/pathfinder.engine";
import {
  AiPerception,
  Behavior,
  GenericPipe,
} from "@engine/ai/state-ai.engine";
import { sleep } from "@utils/time.util";
import { globalDirection, manhattanDistance } from "@utils/vectors.util";
import { vec, Vector } from "excalibur";

export class GotoPipe extends GenericPipe {
  private _interrupted = false;
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
    const target = this._targetProvider();
    if (!target) {
      return sleep(1000);
    }

    const path = new AstarGrid(ai.player.pos, target).findPath();
    let current = path.shift();

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (!current || this._interrupted) {
          ai.player.move("stop");
          clearInterval(interval);
          resolve();
          return;
        }
        ai.player.move(globalDirection(ai.player.pos, current));
        if (ai.player.pos.distance(current) < 16) {
          current = path.shift();
        }
      }, 100);
    });
  }
  interrupt(): void {
    this._interrupted = true;
  }
}
