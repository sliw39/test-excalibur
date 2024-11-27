import { Actor, ImageSource, Scene, vec } from "excalibur";
import background_map_0 from "../../art/map/map0/map0.png?url";
import { HUD } from "./components/hud.component";
import { WorldLocation } from "./components/world-location.component";
import { WorldPath } from "./components/world-path.component";
import { graph, IWorld } from "./world.model";
import { registerResource } from "../../utils/assets.util";
import { WorldPlayer } from "./components/world-party.component";
import { SceneName } from "../../utils/consts.util";

const resources = {
    background_map_0: new ImageSource(background_map_0)
}
Object.values(resources).forEach(r => registerResource(r))

export class WorldScene extends Scene {

    private locations: WorldLocation[] = [];
    private paths: WorldPath[] = [];
    private party: WorldPlayer

    constructor(public data: IWorld) {
        super();

        const bg = new Actor({ pos: vec(1551 / 2, 1043 / 2) });
        bg.graphics.use(resources[data.map as any as keyof typeof resources].toSprite());
        this.add(bg);


        this.party = new WorldPlayer({
            location: data.start,
            name: "Player",
            sprite: "trader1"
        });
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
            location.events.on("click", (l) => {
                if(!this.party.moving && graph.areLinked(this.party.data.location, l.data)) {
                    this.party.move(l.data);
                    this.checkGameOver();
                }
            })
            this.locations.push(location);
        })

        const hud = new HUD(1551, 1043);
        this.add(hud);
    }

    checkGameOver() {
        if(this.party.data.location.kind === "shelter") {
            this.engine.goToScene<{ success: boolean }>("gameover" as SceneName, { sceneActivationData: {success: true }});
        } else if(false /* dead or no food left */) {
            this.engine.goToScene<{ success: boolean }>("gameover" as SceneName, { sceneActivationData: {success: true }});
        }
    }
}
