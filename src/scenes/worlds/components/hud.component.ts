import { Color, ScreenElement, Text, vec } from "excalibur";
import { fonts } from "../../../utils/consts.util";

export class HUD extends ScreenElement {
    public currentLocation: string = "";
    constructor(ewidth: number, eheight: number) {
        super({ pos: vec(ewidth - 200, eheight - 50) });
    }
    onPreUpdate() {
        this.graphics.add(new Text({
            text: this.currentLocation,
            color: Color.Blue,
            font: fonts.base(),
          }));
    }
}