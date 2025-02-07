import { firearms } from "@models/weapons.model";
import { FirearmStateManager } from "@utils/state-machines/firearm.state";
import { State, StateManager } from "@utils/states.util";
import { Vector } from "excalibur";
import { AIContext, Pipe } from "../ai.engine";

import { Person } from "@scenes/location/components/person.component";
import { StrictEventEmitter } from "@utils/events.util";
import { sleep } from "@utils/time.util";
import { PseudoRandomEngine } from "../pseudo-random.engine";

type Behaviors =
  | "patrol"
  | "chill"
  | "cover"
  | "peak"
  | "suppress"
  | "seek"
  | "fallback"
  | "flank"
  | "explore"
  | "regroup"
  | "loot";

export interface AiPerception extends AIContext {
  enemyCount: number;
  enemyClosest?: Person;
  enemyClosestKnownDistance: number;
  enemyClosestLastSeen: number;
  enemyClosestWeapon?: FirearmStateManager;
  friendClosest?: Person;
  friendClosestKnownDistance: number;
  friendClosestLastSeen: number;
  friendCount: number;
  friendsBehavior: Behaviors[];
  currentWeapon: FirearmStateManager;
  currentHealth: number;
  closestResource?: Vector;
  closestResourceDistance?: number;
}
export function defaultPerception(
  ai: Partial<AiPerception> = {}
): AiPerception {
  return {
    enemyCount: 0,
    enemyClosest: undefined,
    enemyClosestKnownDistance: Infinity,
    enemyClosestLastSeen: Infinity,
    enemyClosestWeapon: undefined,
    friendClosest: undefined,
    friendClosestKnownDistance: Infinity,
    friendClosestLastSeen: Infinity,
    friendCount: 0,
    friendsBehavior: [],
    currentWeapon: new FirearmStateManager(firearms["AK-47"]()),
    currentHealth: 100,
    closestResource: undefined,
    closestResourceDistance: undefined,
    foes: [],
    guard: undefined as any,
    player: undefined as any,
    ...ai,
  };
}

export type BehaviorEvents = {
  pipeChanged: GenericPipe | null;
};

export abstract class Behavior implements State {
  public readonly events = new StrictEventEmitter<BehaviorEvents>();
  private _startDate: number = 0;
  private _interrupted: boolean = false;
  private _currentPipe: GenericPipe | null = null;

  protected constructor(
    public readonly name: Behaviors,
    public readonly minTime: number = 1000,
    public readonly stance: Stance,
    private conditions: Condition[],
    private _aiPerceptionProvider: () => AiPerception
  ) {}

  abstract init(): void;
  abstract execute(): Promise<void>;

  get currentPipe(): GenericPipe | null {
    return this._currentPipe;
  }

  set currentPipe(pipe: GenericPipe | null) {
    this._currentPipe = pipe;
    this.events.emit("pipeChanged", pipe);
  }

  evaluateNextState(): string | null {
    const perception = this.aiPerception;
    return (
      new PseudoRandomEngine().pick(
        this.conditions.filter((c) => c.evaluate(perception, this._startDate))
      )?.transition ?? null
    );
  }

  interrupt() {
    this._interrupted = true;
    this.currentPipe?.interrupt();
    this.aiPerception.player.move("stop");
  }

  async runState(_stateManager: StateManager<State>): Promise<string> {
    this._startDate = Date.now();
    let nextState: string | null = null;

    do {
      await this.execute();
      if (this._interrupted) {
        return Promise.reject();
      }
    } while (
      null === (nextState = this.evaluateNextState()) ||
      Date.now() - this._startDate < this.minTime
    );

    return nextState;
  }
  protected get aiPerception() {
    return this._aiPerceptionProvider();
  }

  protected async runPipes<T extends GenericPipe>(
    ai: AiPerception,
    ...pipes: T[]
  ): Promise<T | null> {
    let selectedPipe: T | null = null;
    if (
      pipes.length === 1 &&
      (pipes[0].probability(ai) === 1 ||
        randomizer.next() <= pipes[0].probability(ai))
    ) {
      selectedPipe = pipes[0];
    }

    if (pipes.length > 1) {
      const probabilities = pipes.map((pipe) => pipe.probability(ai));
      selectedPipe = randomizer.weightPick(pipes, probabilities);
    }

    if (selectedPipe) {
      this.currentPipe = selectedPipe;
      await selectedPipe.execute(ai);
      return selectedPipe;
    } else {
      await sleep(200);
      return null;
    }
  }

  toString() {
    return this.stance.name + " >> " + this.name + " >> " + this.currentPipe;
  }
}

export class Stance {
  constructor(public readonly name: string) {}
}

const randomizer = new PseudoRandomEngine();

export abstract class GenericPipe implements Pipe<AiPerception> {
  constructor(
    public readonly name: string,
    public readonly behavior: Behavior
  ) {}
  abstract probability(ai: AiPerception): number;
  abstract execute(ai: AiPerception): Promise<void>;
  abstract interrupt(): void;
  toString() {
    return this.name;
  }
}

export abstract class PointFinderPipe extends GenericPipe {
  public point: Vector | null = null;

  constructor(...args: ConstructorParameters<typeof GenericPipe>) {
    super(...args);
  }
}

export interface Condition {
  transition: string;
  evaluate(ai: AiPerception, startTime: number): boolean;
}
