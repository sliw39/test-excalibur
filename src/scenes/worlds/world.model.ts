import { Inventory } from "../../common/models/inventory.model";

/**
 * World model
 */
export interface IWorld {
    /**
     * List of locations on the map
     */
    locations: IWorldLocation[];
    /**
     * List of paths on the map
     */
    paths: IWorldPath[];
    /**
     * Path to the map image
     */
    map: string;
    /**
     * Name of the map
     */
    name: string;
    /**
     * Name of the starting location
     */
    start: IWorldLocation;
}

/**
 * Kind of location
 */
export type IWorldLocationKind = "town" | "factory" | "cave" | "shelter" | "farm";
/**
 * Location model
 */
export interface IWorldLocation {
    /**
     * Name of the location
     */
    name: string;
    /**
     * Kind of location
     */
    kind: IWorldLocationKind;
    /**
     * Coordinates of the location
     */
    coords: {x: number, y: number};
    /**
     * Location description
     */
    description: string;
    /**
     * Hazard level of the location
     */
    hazard: number;
    /**
     * Resources level of the location
     */
    resources: number;
    /**
     * List of connected paths
     */
    paths?: IWorldPath[];
}

/**
 * Kind of path
 */
export type IWorldPathKind = "road" | "rail" | "water";
/**
 * Path model
 */
export interface IWorldPath {
    /**
     * Start of the path
     */
    from: IWorldLocation;
    /**
     * End of the path
     */
    to: IWorldLocation;
    /**
     * Kind of path
     */
    kind: IWorldPathKind;
}

export interface IParty {
    name: string;
    location: IWorldLocation;
    inventory: Inventory;
    sprite: string;
}

export const graph = {
    areLinked: (from: IWorldLocation, to: IWorldLocation) => {
        return !!from.paths?.find((p) => graph.walk(p, from) === to);
    },
    walk(path: IWorldPath, from: IWorldLocation) {
        return path.from === from ? path.to : path.to === from ? path.from : null;
    }
}