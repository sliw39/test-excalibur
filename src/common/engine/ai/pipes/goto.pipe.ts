import { AstarGrid } from "@engine/pathfinder.engine";
import {
  AiPerception,
  Behavior,
  GenericPipe,
} from "@engine/ai/state-ai.engine";
import { sleep } from "@utils/time.util";
import { globalDirection, manhattanDistance } from "@utils/vectors.util";
import {
  Circle,
  Color,
  Graphic,
  GraphicsGroup,
  GraphicsGrouping,
  Line,
  vec,
  Vector,
} from "excalibur";
import { addGraphic, removeGraphic } from "@utils/debug-bus.util";

export class GotoPipe extends GenericPipe {
  private _interrupted = false;
  public path: Vector[] = [];
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
    const d = manhattanDistance(ai.player.pos, target);

    const astar = new AstarGrid(ai.player.pos, target);
    const decors = ai.guard.getAllDecors(ai.player.pos, d);
    decors.forEach((obstacle) => astar.addObstacle(obstacle));
    this.path = astar.findPath().map((v) => v.add(vec(16, 16)));
    let current = this.path.shift();

    if (import.meta.env.VITE_DEBUG_GOTO_PIPE) {
      const graphics: (Graphic | GraphicsGrouping)[] = [];
      decors.forEach((decor) => {
        graphics.push({
          graphic: new Circle({ radius: 2, color: Color.Red }),
          offset: decor.add(vec(16, 16)),
        });
      });
      for (let i = 1; i < this.path.length; i++) {
        const start = this.path[i - 1];
        const end = this.path[i];
        graphics.push({
          graphic: new Line({ start, end, color: Color.Orange, thickness: 1 }),
          offset: vec(0, 0),
        });
      }
      addGraphic(
        this,
        new GraphicsGroup({ members: graphics, useAnchor: false })
      );
    }

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (!current || this._interrupted) {
          ai.player.move("stop");
          clearInterval(interval);
          if (import.meta.env.VITE_DEBUG_GOTO_PIPE) {
            removeGraphic(this);
          }
          resolve();
          return;
        }
        ai.player.move(globalDirection(ai.player.pos, current));
        if (ai.player.pos.distance(current) < 16) {
          current = this.path.shift();
        }
      }, 100);
    });
  }
  interrupt(): void {
    this._interrupted = true;
  }
}
