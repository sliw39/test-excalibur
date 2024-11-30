import { Scene, vec } from "excalibur";
import { ProgressBar } from "../../common/components/progress-bar.component";
import { Player } from "../../common/models/player.model";
import { PlayerCardComponent } from "./components/player-card.component";
import { PlayerRoleComponent } from "./components/player-role.component";

export class ChooseRolesScene extends Scene {

    constructor() {
        super();
    }

    onInitialize(): void {
        const player = new Player("Player", { maxHealth: 100, strength: 100, agility: 100, accuracy: 100, resistance: 100, luck: 100 }, [], 100);
        const card = new PlayerCardComponent(player);
        const role = new PlayerRoleComponent({pos: vec(.5, 200), height: 100, width: card.width - 40}); 
        card.addChild(role);
        this.add(card);

        setInterval(() => {
            player.hit(5);
        }, 1000);
    }
}