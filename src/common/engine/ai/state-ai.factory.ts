import { bullets } from "@models/weapons.model";
import { StateManager } from "@utils/states.util";
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
  Condition,
  defaultPerception,
  AiPerception,
  Behavior,
  Stance,
} from "./state-ai.engine";
import Yaml from "yaml";
import aiDesc from "./state-ai.model.yaml?raw";

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
          const transitionName = stanceRef.name + "." + behavior + "->" + t.to;
          t.conditions.map((c) => createCondition(transitionName, c));
          statesMappings.push({
            id: transitionName,
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
