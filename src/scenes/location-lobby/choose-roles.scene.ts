import { EventEmitter, Scene, SceneActivationContext, SceneEvents, vec } from "excalibur";
import { Player } from "@models/player.model";
import { PlayerCardComponent } from "./components/player-card.component";
import { PlayerRoleComponent } from "./components/player-role.component";

export class ChooseRolesScene extends Scene {

    declare events: EventEmitter<SceneEvents & { allRolesAssigned: WeakMap<Player, "defender" | "scavenger"> }> ;
    public playerRoles = new WeakMap<Player, "defender" | "scavenger">();
    constructor(private _players: Player[] = []) {
        super();
    }

    onActivate(context: SceneActivationContext<{ players: Player[] }>): void {
        this._players = context.data!.players;
        this.clear(false);
        
        let i = 1;
        for (const player of this._players) {
            const card = new PlayerCardComponent({pos: vec(this.engine.canvas.width * i/(this._players.length+1), this.engine.canvas.height/2).add(vec(-150, -150))}, player);
            const role = new PlayerRoleComponent({pos: vec(.5, 200), height: 100, width: card.width - 40}); 
            role.events.on("roleAssigned", (role: "defender" | "scavenger") => {
                this.onPlayerRoleAssigned(player, role);
            })
            card.addChild(role);
            this.add(card);
            i++;
        }
    }

    onPlayerRoleAssigned(player: Player, role: "defender" | "scavenger") {
        this.playerRoles.set(player, role);
        
        if(this._players.every(p => this.playerRoles.has(p))) {
            this.onAllRolesAssigned();
        }
    }

    onAllRolesAssigned() {
        this.events.emit("allRolesAssigned", this.playerRoles);
    }
}