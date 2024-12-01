import { IWorldLocation } from "@models/world.model";
import { Button } from "@ui/button.component";
import { colors, fonts } from "@utils/consts.util";
import { Actor, Color, EventEmitter, Scene, SceneEvents, Text, vec } from "excalibur";

export type ChooseActionSceneEvents = SceneEvents & {
    choice: "explore" | "leave"
}
export class ChooseActionScene extends Scene {

    declare events: EventEmitter<ChooseActionSceneEvents>

    constructor(private _location?: IWorldLocation) { super()}

    onInitialize(): void {

        const title = new Actor();
        title.graphics.use(new Text({ text: "You arrived at " + this._location!.name + "!", color: Color.fromHex(colors.crimson), font: fonts.base(128) }));
        title.pos = vec(this.engine.drawWidth / 2, 64);
        this.add(title);

        const text = new Actor();
        text.graphics.use(new Text({ text: "What would you like to do?", color: Color.fromHex(colors.crimson), font: fonts.base(64) }));
        text.pos = vec(this.engine.drawWidth / 2, 256);
        this.add(text);

        const goButton = new Button({ text: "Explore", color: Color.fromHex(colors.forest) });
        this.add(goButton);
        
        const leaveButton = new Button({ text: "Leave", color: Color.fromHex(colors.crimson) });
        this.add(leaveButton);
    }

    onExplore() {
        this.events.emit("choice", "explore");
    }

    onLeave() {
        this.events.emit("choice", "leave");
    }
}
    