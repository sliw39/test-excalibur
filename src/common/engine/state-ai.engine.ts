import { FirearmStateManager } from "@utils/state-machines/firearm.state";
import { State, StateManager } from "@utils/states.util";
import { Vector } from "excalibur";
import { AIContext, Pipe } from "./ai.engine";
import { bullets, firearms } from "@models/weapons.model";
import Yaml from "yaml";
import aiDesc from "./state-ai.model.yaml?raw";
import { Person } from "@scenes/location/components/person.component";

type Behaviors =
  | "patrol"
  | "chill"
  | "cover"
  | "peak"
  | "suppress"
  | "seek"
  | "flank"
  | "explore"
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
    foes: [],
    guard: undefined as any,
    player: undefined as any,
    ...ai,
  };
}

export abstract class Behavior implements State {
  private startDate: number = 0;
  protected constructor(
    public readonly name: Behaviors,
    public readonly minTime: number = 1000,
    public readonly stance: Stance,
    private _aiPerceptionProvider: () => AiPerception
  ) {}

  abstract init(): void;
  abstract execute(): Promise<void>;
  abstract evaluateNextState(): string | null;

  async runState(_stateManager: StateManager<State>): Promise<string> {
    this.startDate = Date.now();
    let nextState: string | null = null;

    do {
      await this.execute();
    } while (
      null === (nextState = this.evaluateNextState()) ||
      Date.now() - this.startDate < this.minTime
    );

    return nextState;
  }
  protected get aiPerception() {
    return this._aiPerceptionProvider();
  }

  toString() {
    return this.stance.name + " >> " + this.name;
  }
}

export class Stance {
  constructor(public readonly name: string) {}
}

export abstract class GenericPipe implements Pipe<AiPerception> {
  constructor(
    public readonly name: string,
    public readonly behavior: Behavior
  ) {}
  abstract probability(ai: AiPerception): number;
  abstract execute(ai: AiPerception): Promise<void>;
  abstract interrupt(): void;
  toString() {
    return this.behavior.toString() + " >> " + this.name;
  }
}

export interface Condition {
  transition: string;
  evaluate(ai: AiPerception): boolean;
}
export function createCondition(
  transition: string,
  condition: string
): Condition {
  return {
    transition,
    evaluate: (ai) =>
      new Function(
        "ai",
        "bullets",
        `
          const {${Object.keys(defaultPerception()).join(",")}} = ai;
          return ${condition};
        `
      )(ai, bullets),
  };
}

function parseAi(ai: string) {
  const data = Yaml.parse(aiDesc);
  for (const stance in data.stances) {
    const stanceRef = new Stance(stance);
    for (const behavior in data.stances[stance]) {
    }
  }
}
