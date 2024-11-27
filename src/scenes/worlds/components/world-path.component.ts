import { Color, Line, ScreenElement, vec, Vector } from "excalibur";
import { IWorldPath } from "../world.model";
import { world } from "../../../utils/consts.util";

export class WorldPath extends ScreenElement {
    private start: Vector;
    private end: Vector;

    constructor(public data: IWorldPath) {
        super();
        this.start = vec(data.from.coords.x, data.from.coords.y);
        this.end = vec(data.to.coords.x, data.to.coords.y);
        this.z = 99;
    }

    onInitialize() {
        this.graphics.anchor = Vector.Zero;
        this.graphics.add(new Line({
            start: this.start,
            end: this.end,
            color: Color.fromHex(world.paths.kind[this.data.kind].color),
            thickness: 2,
          }));
    }
}
