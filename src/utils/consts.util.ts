import { Color, Font, vec, Vector } from "excalibur";
import { IWorldLocationKind, IWorldPathKind } from "@models/world.model";
import { ItemRef } from "@models/inventory.model";
import { Player } from "@models/player.model";
import { energyDrop } from "@engine/ballistic.engine";

export const scenes = {
  world: "world",
  gameover: "gameover",
  chooseRoles: "chooseRoles",
} as const;
export type SceneName = (typeof scenes)[keyof typeof scenes];

export const fonts = {
  base: (size = 16, color = Color.fromHex(colors.text), bold = false) =>
    new Font({ size, bold: bold, color, family: "PopulationZero" }),
  baseLight: (
    size = 16,
    color = Color.fromHex(colors.textLight),
    bold = false
  ) => new Font({ size, bold: bold, color, family: "PopulationZero" }),
};

export const items = {
  food: { name: "Food", description: "Food", maxStack: 200 } as ItemRef,
};

export const colors = {
  text: "#333333",
  textLight: "#eeeeee",
  black: "#000000",
  white: "#ffffff",
  concrete: "#7a745e",
  dirt: "#481905",
  brick: "#a64a22",
  forest: "#356d26",
  lazuli: "#213f56",
  aqua: "#007f7f",
  metal: "#c9c9c9",
  crimson: "#7f0000",
  sand: "#eebf75",
} as const;

export const hoverColor = function (color: string, amount: number = 40) {
  const hex = {
    r: parseInt(color.substring(1, 3), 16),
    g: parseInt(color.substring(3, 5), 16),
    b: parseInt(color.substring(5, 7), 16),
  };
  //darken color
  hex.r = Math.max(0, Math.min(255, hex.r - amount));
  hex.g = Math.max(0, Math.min(255, hex.g - amount));
  hex.b = Math.max(0, Math.min(255, hex.b - amount));

  return `#${hex.r.toString(16).padStart(2, "0")}${hex.g
    .toString(16)
    .padStart(2, "0")}${hex.b.toString(16).padStart(2, "0")}`;
};

export const world = {
  moveSpeed: 300,
  locations: {
    rect: {
      width: 20,
      height: 20,
    },
    kind: {
      town: {
        color: colors.concrete,
      },
      cave: {
        color: colors.dirt,
      },
      factory: {
        color: colors.brick,
      },
      farm: {
        color: colors.forest,
      },
      shelter: {
        color: colors.lazuli,
      },
    } as Record<IWorldLocationKind, { color: string }>,
  },
  paths: {
    kind: {
      road: {
        color: colors.dirt,
      },
      rail: {
        color: colors.metal,
      },
      water: {
        color: colors.aqua,
      },
    } as Record<IWorldPathKind, { color: string }>,
  },
};

export const ballistic = {
  /** conversion factor from m/s to pix/ms */
  velocityFactor: 0.75 / 1000,
  /** conversion factor from m to pix */
  distanceFactor: 3,
} as const;

export const movements = {
  human: 2,
} as const;
export const baseMovement = {
  up: vec(0, -1),
  upleft: vec(-0.7, -0.7),
  left: vec(-1, 0),
  downleft: vec(-0.7, 0.7),
  down: vec(0, 1),
  downright: vec(0.7, 0.7),
  right: vec(1, 0),
  upright: vec(0.7, -0.7),
} as const;
export function cloneMovement(speedScale: number = 1) {
  return Object.fromEntries(
    Object.entries(baseMovement).map(([key, value]) => [
      key,
      value.scale(speedScale),
    ])
  ) as typeof baseMovement;
}

export const dummyPlayer = () =>
  new Player(
    "Player1",
    {
      maxHealth: 100,
      strength: 100,
      agility: 100,
      accuracy: 100,
      resistance: 100,
      luck: 100,
    },
    [],
    100
  );
