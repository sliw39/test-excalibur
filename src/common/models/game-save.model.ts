import { IParty, IWorld } from "./world.model";

export interface IGameSave {
    id: string;
    date: Date;
    world: IWorld;
    party: IParty
}

