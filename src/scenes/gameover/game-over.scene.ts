import { Actor, Color, ImageSource, Scene, SceneActivationContext, Text, vec, Vector } from "excalibur";
import failureImgUrl from "../../art/scenes/game_over.webp?url";
import successImgUrl from "../../art/scenes/the_end_bg.webp?url";
import { registerResource } from "../../utils/assets.util";
import { colors, fonts } from "../../utils/consts.util";

const resources = {
    success: new ImageSource(successImgUrl),
    failure: new ImageSource(failureImgUrl)
} as const
Object.values(resources).forEach(r => registerResource(r))

export class GameOverScene extends Scene {
    constructor() {
        super();
    }

    onActivate(context: SceneActivationContext<unknown>): void {
        const { success } = context.data as { success: boolean };
        const bg = new Actor();
        bg.graphics.anchor = Vector.Zero;
        bg.graphics.use(resources[success ? "success" : "failure"].toSprite());
        this.add(bg);

        const title = new Actor();
        title.graphics.anchor = vec(0.5, 0.5);
        title.graphics.use(new Text({ text: success ? "You Win!" : "Game Over", color: Color.fromHex(colors.crimson), font: fonts.base(128) }));
        title.pos = vec(this.engine.drawWidth / 2, 64);
        this.add(title);

        const text = new Actor();
        text.graphics.anchor = vec(0.5, 0.5);
        text.graphics.use(new Text({ text: success ? "You have beaten the game!" : "You have died!", color: Color.fromHex(colors.crimson), font: fonts.base(64) }));
        text.pos = vec(this.engine.drawWidth / 2, 256);
        this.add(text);
    }
}