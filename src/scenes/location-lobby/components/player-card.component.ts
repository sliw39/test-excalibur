import { Actor, ActorArgs, Animation, AnimationStrategy, Color, range, Rectangle, Text, vec, Vector } from "excalibur";
import { Player, Stats } from "@models/player.model";
import { ProgressBar } from "@ui/progress-bar.component";
import { colors, fonts } from "@utils/consts.util";
import { trader1 } from "@art/player/playe_placehoder/Trader_1/trader1";

const BARS_WIDTH = 140
const BARS_HEIGHT = 18
const BARS_MARGIN = 2
const BARS_CONTAINER_POS = new Vector(140, 20)

export class PlayerCardComponent extends Actor {
    constructor(_config: ActorArgs, public data: Player) {
        super({ ..._config, height: 300, width: 300 });
    }

    onInitialize(): void {
        this.graphics.anchor = Vector.Zero;
        this.graphics.add(new Rectangle({
            width: 300,
            height: 300,
            color: Color.fromRGB(0, 0, 0, 0.8),
        }))

        const nameTag = new Actor({pos: vec(20, 20)});
        nameTag.graphics.anchor = Vector.Zero;
        nameTag.graphics.add(new Text({ text: this.data.name, color: Color.fromHex(colors.textLight), font: fonts.baseLight() }));
        this.addChild(nameTag);

        const sprite = new Actor({ pos: vec(20 + 100/2, 20 + 128/2) });
        sprite.graphics.use(Animation.fromSpriteSheet(trader1.idle, range(0,trader1.idle.columns-1), 100, AnimationStrategy.Loop));
        this.addChild(sprite);

        const stats = this.data.getStatsSnapshot();
        const keys: (keyof Stats)[] = Object.keys(stats) as any

        const lifeBar = new ProgressBar({ pos: BARS_CONTAINER_POS, height: BARS_HEIGHT, width: BARS_WIDTH, initValue: this.data.currentLife, step: 25, max: this.data.maxHealth, textPrefix: "HP: " });
        this.data.events.on("healthChanged", (v) => {
            if(v.after > 50) {
                lifeBar.barColor = Color.fromHex(colors.forest);
            } else if (v.after > 25) {
                lifeBar.barColor = Color.fromHex(colors.brick);
            } else {
                lifeBar.barColor = Color.fromHex(colors.crimson);
            }
            lifeBar.value = v.after
        });
        this.addChild(lifeBar);

        let i=1
        for(const key of keys) {
            const statComponent = new ProgressBar({ pos: BARS_CONTAINER_POS.add(vec(0, i * (BARS_HEIGHT + BARS_MARGIN))), height: BARS_HEIGHT, width: BARS_WIDTH, initValue: stats[key], step: 25, max: this.data.skills[key], textPrefix: key + ": ", barColor: Color.fromHex(colors.aqua) });
            this.data.events.on(`${key}Changed`, (v) => statComponent.value = v.after);
            this.addChild(statComponent);
            i++
        }
    }
}