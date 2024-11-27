import { Color, GraphicsGroup, Rectangle, Text, ScreenElement, vec } from "excalibur";
import { StrictEventEmitter } from "../../../utils/events.util";
import { IWorldLocation } from "../world.model";
import { colors, fonts, hoverColor, world } from "../../../utils/consts.util";

export type WorldLocationEvents = {
    click: WorldLocation,
    hover: WorldLocation,
    leave: WorldLocation
}
export class WorldLocation extends ScreenElement {
    public events = new StrictEventEmitter<WorldLocationEvents>()
    constructor(public data: IWorldLocation) {
        super({ pos: vec(data.coords.x, data.coords.y) });
        this.z = 100;
    }
    onInitialize() {
        this.graphics.add("idle", createGraphics(world.locations.kind[this.data.kind].color, this.data.name)); 
        this.graphics.add("hover", createGraphics(hoverColor(world.locations.kind[this.data.kind].color), this.data.name));
        this.on('pointerup', () => {
            this.events.emit("click", this);
        })
        this.on('pointerenter', () => {
            this.graphics.use('hover')
            this.events.emit("hover", this);
        })
        this.on('pointerleave', () => {
            this.graphics.use('idle')
            this.events.emit("leave", this);
        })
        this.graphics.use('idle')
    }
}

function createGraphics(color: string, text: string): GraphicsGroup {
    const width = world.locations.rect.width
    const height = world.locations.rect.height
    return new GraphicsGroup({
        useAnchor: false,
        members: [
            { graphic: new Rectangle({ width, height, color: Color.fromHex(color) }), offset: vec(-width/2, -height/2) },
            { graphic: new Text({ text: text, color: Color.fromHex(colors.text), font: fonts.base() }), offset: vec(width/2+5, height/2+5) }
        ]
    })
}