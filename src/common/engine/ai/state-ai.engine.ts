import { FirearmStateManager } from "@utils/state-machines/firearm.state";
import { State, StateManager } from "@utils/states.util";
import { Vector } from "excalibur";
import { AIContext, Pipe } from "../ai.engine";
import { bullets, firearms } from "@models/weapons.model";
import Yaml from "yaml";
import aiDesc from "./state-ai.model.yaml?raw";
import { Person } from "@scenes/location/components/person.component";
import { PseudoRandomEngine } from "../pseudo-random.engine";
import { sleep } from "@utils/time.util";
import { CoverBehavior } from "./behaviors/cover.behavior";
import { PeakBehavior } from "./behaviors/peak.behavior";
import { SuppressBehavior } from "./behaviors/suppress.behavior";
import { FlankBehavior } from "./behaviors/flank.behavior";
import { ChillBehavior } from "./behaviors/chill.behavior";
import { PatrolBehavior } from "./behaviors/patrol.behavior";
import { ExploreBehavior } from "./behaviors/explore.behavior";
import { FallbackBehavior } from "./behaviors/fallback.behavior";
import { RegroupBehavior } from "./behaviors/regroup.behavior";
import { SeekBehavior } from "./behaviors/seek.behavior";
import { LootBehavior } from "./behaviors/loot.behavior";

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
const ac = new AbortController();
ac.signal.addEventListener("abort", () => {});
export abstract class Behavior implements State {
  private startDate: number = 0;
  public currentPipe: GenericPipe | null = null;
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
    return this.stance.name + " >> " + this.name;
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
    return this.behavior.toString() + " >> " + this.name;
  }
}

export abstract class PointFinderPipe extends GenericPipe {
  public point: Vector | null = null;
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

export function parseAi() {
  const data = Yaml.parse(aiDesc);
  const behaviors: {
    [id: string]: { [id: string]: (pp: () => AiPerception) => Behavior };
  } = {};
  const statesMappings: { id: string; from: string; to: string }[] = [];
  for (const stance in data.stances) {
    const stanceRef = new Stance(stance);
    for (const behavior in data.stances[stance].nodes) {
      const node = data.stances[stance].nodes[behavior];
      const conditions = node.transitions
        .map((t: { to: string; conditions: string[] }) => {
          t.conditions.map((c, i) => createCondition(t.to + "#" + i, c));
          statesMappings.push({
            id: behavior + "->" + t.to,
            from: stanceRef.name + "." + behavior,
            to: t.to,
          });
        })
        .flat();
      let bhClass: any;
      switch (behavior) {
        case "cover":
          bhClass = CoverBehavior;
          break;
        case "peak":
          bhClass = PeakBehavior;
          break;
        case "suppress":
          bhClass = SuppressBehavior;
          break;
        case "flank":
          bhClass = FlankBehavior;
          break;
        case "chill":
          bhClass = ChillBehavior;
          break;
        case "patrol":
          bhClass = PatrolBehavior;
          break;
        case "regroup":
          bhClass = RegroupBehavior;
          break;
        case "explore":
          bhClass = ExploreBehavior;
          break;
        case "loot":
          bhClass = LootBehavior;
          break;
        case "seek":
          bhClass = SeekBehavior;
          break;
        case "fallback":
          bhClass = FallbackBehavior;
          break;
        default:
          break;
      }
      behaviors[stanceRef.name] ??= {};
      behaviors[stanceRef.name][behavior] = (pp: () => AiPerception) =>
        new bhClass(node.minTime, stanceRef, pp, conditions);
    }
  }

  return function aiStateFactory(
    aiPerceptionProvider: () => AiPerception
  ): StateManager<Behavior> {
    const sm = new StateManager<Behavior>();
    const states = Object.fromEntries(
      Object.entries(behaviors).map(([stanceName, stance]) => [
        stanceName,
        Object.fromEntries(
          Object.entries(stance).map(([bName, b]) => {
            const behavior = b(aiPerceptionProvider);
            sm.addState(behavior);
            return [bName, behavior];
          })
        ),
      ])
    );
    statesMappings.forEach((m) => {
      const [fromstance, frombehavior] = m.from.split(".");
      const [tostance, tobehavior] = m.to.split(".");
      sm.mapStates(
        m.id,
        states[fromstance][frombehavior],
        states[tostance][tobehavior]
      );
    });
    return sm;
  };
}
