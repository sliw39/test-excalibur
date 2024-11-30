import { Actor, ActorArgs, Color, Graphic, vec } from "excalibur";
import { Button, ButtonGroup } from "../../../common/components/button.component";
import { colors } from "../../../utils/consts.util";

export class PlayerRoleComponent extends Actor {
    public role: "defender" | "scavenger" | undefined;
    private _group: ButtonGroup | undefined;

    constructor(params: ActorArgs) {
        super({ ...params, width: params.width ?? 200, height: params.height ?? 200 });
    }

    onInitialize() {
        const buttons = [
            { text: "Defender", color: Color.fromHex(colors.aqua) },
            { text: "Scavenger", color: Color.fromHex(colors.brick) }
        ]

        const padding = 10;
        const width = this.width - padding*2;
        const height = this.height / buttons.length - padding*2;

        this._group = new ButtonGroup(buttons.map(b => new Button({...b, height, width})));

        let i=0;
        for(const button of this._group.buttons) {
            button.pos = vec(padding*2, (padding*2 + height)*i);
            this.addChild(button);
            i++;
        }
    }
}