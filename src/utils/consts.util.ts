import { Color, Font } from "excalibur";
import { IWorldLocationKind, IWorldPathKind } from "../scenes/worlds/world.model";

export const scenes = {
    world: "world",
    gameover: "gameover"
} as const
export type SceneName = typeof scenes[keyof typeof scenes];

export const fonts = {
    base: (size = 16, color = Color.fromHex(colors.text), bold = false) => new Font({ size, bold: bold, color, family: "PopulationZero" })   
}

export const colors = {
    text: "#333333",
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
}

export const hoverColor = function(color: string) {
    const hex = {
        r: parseInt(color.substring(1, 3), 16),
        g: parseInt(color.substring(3, 5), 16),
        b: parseInt(color.substring(5, 7), 16)
    }
    //darken color
    hex.r = Math.max(0, Math.min(255, hex.r - 20));
    hex.g = Math.max(0, Math.min(255, hex.g - 20));
    hex.b = Math.max(0, Math.min(255, hex.b - 20));

    return `#${hex.r.toString(16).padStart(2, '0')}${hex.g.toString(16).padStart(2, '0')}${hex.b.toString(16).padStart(2, '0')}`;
}

export const world = {
    moveSpeed: 300,
    locations: {
        rect: {
            width: 20,
            height: 20
        },
        kind: {
            town: {
                color: colors.concrete
            },
            cave: {
                color: colors.dirt
            },
            factory: {
                color: colors.brick
            },
            farm: {
                color: colors.forest
            },
            shelter: {
                color: colors.lazuli
            }
        } as Record<IWorldLocationKind, { color: string }>
    },
    paths: {
        kind: {
            road: {
                color: colors.dirt
            },
            rail: {
                color: colors.metal
            },
            water: {
                color: colors.aqua
            }
        } as Record<IWorldPathKind, { color: string }>
    }
}