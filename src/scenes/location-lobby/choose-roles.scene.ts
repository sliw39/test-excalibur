import { Scene, vec } from "excalibur";
import { Player } from "@models/player.model";
import { PlayerCardComponent } from "./components/player-card.component";
import { PlayerRoleComponent } from "./components/player-role.component";

const player1 = new Player("Player1", { maxHealth: 100, strength: 100, agility: 100, accuracy: 100, resistance: 100, luck: 100 }, [], 100);
const player2 = new Player("Player2", { maxHealth: 100, strength: 100, agility: 100, accuracy: 100, resistance: 100, luck: 100 }, [], 100);
const player3 = new Player("Player3", { maxHealth: 100, strength: 100, agility: 100, accuracy: 100, resistance: 100, luck: 100 }, [], 100);

export class ChooseRolesScene extends Scene {

    constructor(private _players: Player[] = [player1, player2, player3]) {
        super();
    }

    onInitialize(): void {
        let i = 1;
        for (const player of this._players) {
            const card = new PlayerCardComponent({pos: vec(this.engine.canvas.width * i/(this._players.length+1), this.engine.canvas.height/2).add(vec(-150, -150))}, player);
            const role = new PlayerRoleComponent({pos: vec(.5, 200), height: 100, width: card.width - 40}); 
            card.addChild(role);
            this.add(card);
            i++;
        }
    }
}