import { Player } from "@models/player.model";
import { IWorldLocation } from "@models/world.model";
import { Engine } from "excalibur";
import { ChooseActionScene } from "./choose-action.scene";
import { SceneName } from "@utils/consts.util";
import { StrictEventEmitter } from "@utils/events.util";
import { ChooseRolesScene } from "./choose-roles.scene";

interface State {}

export interface LocationLobbyStateArgs { location: IWorldLocation, players: Player[], engine: Engine }
interface LocationLobbyResult {
  action: "explore" | "leave";
  roles?: WeakMap<Player, "defender" | "scavenger">;
}

export type LocationLobbyStateEvents = {
  "finished": LocationLobbyResult
}
export class LocationLobbyState {

  public events = new StrictEventEmitter<LocationLobbyStateEvents>()

  private _states: State[] = [];
  private _currentState?: State;

  constructor(public args: LocationLobbyStateArgs) {}

  set currentState(state: State | undefined) {
    if (this._currentState) {
      this._states.push(this._currentState);
    }
    this._currentState = state;
  }

  finish() {
    this.currentState = undefined;
    let result = {
      action: this.action,
      roles: this.roles
    }
    this.events.emit("finished", result);
  }

  async execute() {
    this.currentState = new ChooseActionState(this.args, this);
    return new Promise<LocationLobbyResult>((resolve) => this.events.once("finished", resolve))
  }

  get action() {
    return this._states.find(state => state instanceof ChooseActionState)?.choice ?? "leave";
  }

  get roles() {
    return this._states.find(state => state instanceof ChooseRolesState)?.playerRoles;
  }
}


class ChooseActionState implements State {
  public choice?: "explore" | "leave"
  constructor(public args: LocationLobbyStateArgs, public parent: LocationLobbyState) {
    this.loadScene();
  }

  private async loadScene() {
    await this.args.engine.goToScene("chooseAction" as SceneName, { sceneActivationData: { location: this.args.location } });
    (this.args.engine.currentScene as ChooseActionScene).events.on("choice", (choice: "explore" | "leave") => {
      this.onFinish(choice);
    })
  }

  private onFinish(choice: "explore" | "leave") {
    this.choice = choice;
    switch (choice) {
      case "explore":
        this.parent.currentState = new ChooseRolesState(this.args, this.parent);
        break;
      case "leave":
        this.args.engine.goToScene("world" as SceneName);
        break;
    }
  }

}

class ChooseRolesState implements State {
  public playerRoles = new WeakMap<Player, "defender" | "scavenger">
  constructor(public args: LocationLobbyStateArgs, public parent: LocationLobbyState) {
    this.loadScene();
  }

  async loadScene() {
    await this.args.engine.goToScene("chooseRoles" as SceneName, { sceneActivationData: { location: this.args.location, players: this.args.players } });
    (this.args.engine.currentScene as ChooseRolesScene).events.on("allRolesAssigned", (roles: WeakMap<Player, "defender" | "scavenger">) => {
      this.playerRoles = roles;
      this.parent.finish();
    })
  }
}
