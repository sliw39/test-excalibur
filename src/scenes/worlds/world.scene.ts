import { Actor, ImageSource, Scene, vec } from "excalibur";
import background_map_0 from "@art/map/map0/map0.png?url";
import { HUD } from "./components/hud.component";
import { WorldLocation } from "./components/world-location.component";
import { WorldPath } from "./components/world-path.component";
import { graph, IWorld, IWorldLocation } from "@models/world.model";
import { registerResource } from "@utils/assets.util";
import { WorldParty } from "./components/world-party.component";
import { items, SceneName } from "@utils/consts.util";
import { Inventory, Item } from "@models/inventory.model";
import { LocationLobbyState } from "../location-lobby/location-loby.state";
import { Player } from "@models/player.model";

const player1 = new Player("Player1", { maxHealth: 100, strength: 100, agility: 100, accuracy: 100, resistance: 100, luck: 100 }, [], 100);
const player2 = new Player("Player2", { maxHealth: 100, strength: 100, agility: 100, accuracy: 100, resistance: 100, luck: 100 }, [], 100);
const player3 = new Player("Player3", { maxHealth: 100, strength: 100, agility: 100, accuracy: 100, resistance: 100, luck: 100 }, [], 100);

const resources = {
    background_map_0: new ImageSource(background_map_0)
}
Object.values(resources).forEach(r => registerResource(r))

export class WorldScene extends Scene {

    private locations: WorldLocation[] = [];
    private paths: WorldPath[] = [];
    private party: WorldParty

    constructor(public data: IWorld) {
        super();

        const bg = new Actor({ pos: vec(1551 / 2, 1043 / 2) });
        bg.graphics.use(resources[data.map as any as keyof typeof resources].toSprite());
        this.add(bg);

        this.party = new WorldParty({
            location: data.start,
            inventory: new Inventory(),
            name: "Player",
            sprite: "trader1"
        });
        this.party.data.inventory.add(new Item(items.food, 100));
        this.add(this.party);

        data.paths.forEach(path => {
            const p = new WorldPath(path);
            this.add(p);
            this.paths.push(p);
        })
        data.locations.forEach(loc => {
            const location = new WorldLocation(loc);
            this.add(location); 
            location.events.on("hover", (l) => hud.currentLocation = l.data.name)
            location.events.on("leave", () => hud.currentLocation = "");
            location.events.on("click", (l) => this.moveToLocation(l.data))
            this.locations.push(location);
        })

        const hud = new HUD(1551, 1043);
        this.add(hud);
    }

    async moveToLocation(location: IWorldLocation) {
        if(this.party.moving || !graph.areLinked(this.party.data.location, location)) {
            return;
        }
        await this.party.move(location);
        this.party.data.inventory.removeByRef(items.food, 25);
        if(!this.checkGameOver()) {
            const preparation = await this.prepareCurrentLocation();
            
        }
    }

    async prepareCurrentLocation() {
        return new LocationLobbyState({
            engine: this.engine,
            players: [player1, player2, player3],
            location: this.party.data.location
        }).execute();
    }

    checkGameOver() {
        if(this.party.data.location.kind === "shelter") {
            this.engine.goToScene<{ success: boolean }>("gameover" as SceneName, { sceneActivationData: {success: true }});
            return true;
        } else if(this.party.data.inventory.count(items.food) <= 0) {
            this.engine.goToScene<{ success: boolean }>("gameover" as SceneName, { sceneActivationData: {success: true }});
            return true;
        }
        return false;
    }
}
