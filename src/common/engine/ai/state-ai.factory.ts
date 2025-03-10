import { AI, Pipe } from "@engine/ai.engine";
import { bullets } from "@models/weapons.model";
import { Dummy } from "@scenes/location/components/person-dummy.component";
import { colors } from "@utils/consts.util";
import { addGraphic } from "@utils/debug-bus.util";
import { StateManager } from "@utils/states.util";
import { Guard } from "@utils/vectors.util";
import { Color, GraphicsGroup, Text, vec } from "excalibur";
import Yaml from "yaml";
import { ChillBehavior } from "./behaviors/chill.behavior";
import { CoverBehavior } from "./behaviors/cover.behavior";
import { ExploreBehavior } from "./behaviors/explore.behavior";
import { FallbackBehavior } from "./behaviors/fallback.behavior";
import { FlankBehavior } from "./behaviors/flank.behavior";
import { LootBehavior } from "./behaviors/loot.behavior";
import { PatrolBehavior } from "./behaviors/patrol.behavior";
import { PeakBehavior } from "./behaviors/peak.behavior";
import { RegroupBehavior } from "./behaviors/regroup.behavior";
import { SeekBehavior } from "./behaviors/seek.behavior";
import { SuppressBehavior } from "./behaviors/suppress.behavior";
import {
  AiPerception,
  Behavior,
  Condition,
  defaultPerception,
  Stance,
} from "./state-ai.engine";
import aiDesc from "./state-ai.model.yaml?raw";

export function createCondition(
  transition: string,
  condition: string
): Condition {
  return {
    transition,
    evaluate: (ai, startTime) =>
      new Function(
        "ai",
        "bullets",
        "startTime",
        `
          const {${Object.keys(defaultPerception()).join(",")}} = ai;
          return ${condition};
        `
      )(ai, bullets, startTime),
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
          const transitionName = stanceRef.name + "." + behavior + "->" + t.to;
          const conditions = t.conditions.map((c) =>
            createCondition(transitionName, c)
          );
          statesMappings.push({
            id: transitionName,
            from: stanceRef.name + "." + behavior,
            to: t.to,
          });
          return conditions;
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
  ): StateAI {
    const sm = new StateAI(aiPerceptionProvider);
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

export class StateAI extends StateManager<Behavior> implements AI {
  public readonly guard: Guard;
  public readonly player: Dummy;

  constructor(private perceptionProvider: () => AiPerception) {
    super();
    const pp = perceptionProvider();
    this.guard = pp.guard;
    this.player = pp.player;
    if (import.meta.env.VITE_DEBUG_PERSON) {
      const debugAi = () => {
        addGraphic(
          this,
          new GraphicsGroup({
            members: [
              {
                graphic: new Text({
                  text: this.toString(),
                  color: Color.fromHex(colors.crimson),
                }),
                offset: this.player.pos.add(vec(0, 40)),
              },
            ],
          })
        );
      };
      this.events.on("transitioned", ({ from, to }) => {
        (from as Behavior).events.off("pipeChanged", debugAi);
        (to as Behavior).events.on("pipeChanged", debugAi);
      });
    }
  }

  get pipes() {
    return [];
  }

  get currentPipe(): Pipe | null {
    return (this.currentState.currentPipe as any) ?? null;
  }

  get foes() {
    return this.perceptionProvider().foes;
  }

  wake() {
    this.run();
  }

  sleep() {
    this.currentState?.interrupt();
  }

  toString() {
    return this.currentState?.toString() ?? "sleep";
  }
}
