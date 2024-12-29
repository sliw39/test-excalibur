import { bullets } from "@models/weapons.model";
import { Dummy } from "@scenes/location/components/person-dummy.component";
import {
  Guard,
  Person,
} from "@scenes/location/components/person.component";
import { EmptyState } from "@utils/state-machines/firearm.state";
import { closest, direction, distances } from "@utils/vectors.util";
import { Actor } from "excalibur";

interface Pipe {
  name: string;
  probability: (ai: AIContext) => number;
  execute: (ai: AIContext) => Promise<void>;
  interrupt: () => void;
}

interface AIContext {
  player: Dummy;
  guard: Guard;
  foes: Person[];
}

interface AI extends AIContext {
  pipes: Pipe[];
  wake: () => void;
  sleep: () => void;
  currentPipe: Pipe | null;
}

class FleePipe implements Pipe {
  name = "flee";

  probability(ai: AIContext) {
    let p = 1;
    if (ai.player.model.currentLife < ai.player.model.maxHealth / 2) {
      p *= 0.5;
    }

    const ds = distances(
      ai.player.pos,
      ai.foes.map((foe) => foe.pos)
    ).filter((d) => d > 1000);

    if (ds.length > 2) {
      p *= 0.5;
    }

    if (ds.some((d) => d < 500)) {
      p *= 0.5;
    }

    return 1 - p;
  }

  execute(ai: AIContext) {
    // closest foe
    const foe = closest<Actor>(ai.player, ai.foes, (foe) => foe.pos);

    if (foe) {
      const directionString = direction(foe.pos, ai.player.pos);
      ai.player.move(directionString);
    }
    return Promise.resolve();
  }
  interrupt = () => {};
}

class IdlePipe implements Pipe {
  name = "idle";

  probability(ai: AIContext) {
    return ai.foes.length === 0 ? 1 : 0;
  }

  execute(ai: AIContext) {
    ai.player.move("stop");
    return Promise.resolve();
  }
  interrupt = () => {};
}

class LookFoePipe implements Pipe {
  name = "lookFoe";

  probability(ai: AIContext) {
    const closestFoe = closest<Actor>(ai.player, ai.foes, (foe) => foe.pos);
    if (!closestFoe) {
      return 0;
    }
    return ai.player.pos.distance(closestFoe.pos) > 500 ? 0.8 : 0.2;
  }

  execute(ai: AIContext) {
    const foe = closest<Actor>(ai.player, ai.foes, (foe) => foe.pos);

    if (foe) {
      const directionString = direction(ai.player.pos, foe.pos);
      ai.player.move(directionString);
    }
    return Promise.resolve();
  }
  interrupt = () => {};
}

class ReloadPipe implements Pipe {
  name = "reload";

  probability(ai: AIContext) {
    return ai.player.currentWeapon.currentState instanceof EmptyState ? 1 : (1 - ai.player.currentWeapon.magEmptiness) * 0.8;
  }

  execute(ai: AIContext) {
    ai.player.reload();
    return new Promise<void>(async (resolve) => {
      ai.player.currentWeapon.events.once("idle", resolve);
    });
  }
  interrupt = () => {};
}

class FirePipe implements Pipe {
  name = "fire";

  probability(ai: AIContext) {
    let p = ai.player.currentWeapon.currentState instanceof EmptyState ? 0 : 1;
    const foe = closest<Actor>(ai.player, ai.foes, (foe) => foe.pos);

    if (!foe) {
      return 0;
    }
    const d = ai.player.pos.distance(foe!.pos);
    if(d > bullets[ai.player.currentWeapon.firearm.caliber].maxRange) {
      return 0;
    }
    if (d < 200 || d > 800) {
      p *= 0.5;
    }

    if (!ai.guard.hasLineOfSight(ai.player.pos, foe!.pos)) {
      p *= 0.1;
    }
    return p;
  }

  execute(ai: AIContext) {
    const foe = closest<Actor>(ai.player, ai.foes, (foe) => foe.pos);
    if (foe) {
      ai.player.aimAndfire(foe!.pos.sub(ai.player.pos), 0.7);
    }
    return Promise.resolve();
  }
  interrupt = () => {};
}

export class DumbAI implements AI {
  private _interval: NodeJS.Timeout | null = null;
  constructor(
    public player: Dummy,
    public guard: Guard,
    public foes: Person[],
    public pipes: Pipe[] = [
      new FleePipe(),
      new LookFoePipe(),
      new FirePipe(),
      new IdlePipe(),
      new ReloadPipe(),
    ],
    public currentPipe: Pipe | null = null
  ) {
    this.currentPipe = this.pipes[0];
  }

  wake() {
    if (this._interval) {
      clearInterval(this._interval);
    }
    this._interval = setInterval(() => {
      this.foes = this.foes.filter((foe) => foe.model.alive);
      let pipeIndex = 0;
      while (true) {
        const pipe = this.pipes[pipeIndex];
        if (Math.random() < pipe.probability(this)) {
          this.currentPipe = pipe;
          break;
        }
        pipeIndex = (pipeIndex + 1) % this.pipes.length;
      }
      this.currentPipe.execute(this);
    }, 500);
  }

  sleep() {
    if (this._interval) {
      clearInterval(this._interval);
    }
  }
}
