import { ActorArgs, Color, GraphicsGroup, Rectangle, ScreenElement, Text, TextOptions, vec, Vector } from "excalibur";
import { StrictEventEmitter } from "../../../utils/events.util";
import { colors, fonts, hoverColor } from "../../../utils/consts.util";

export interface ButtonGroupEvents {
    select: Button
}
export class ButtonGroup {
    private _selected: Button | undefined;
    private _buttons: Button[] = [];

    public events = new StrictEventEmitter<ButtonGroupEvents>()

    constructor(btns: Button[] = []) {
        btns.forEach(b => b.group = this);
    }

    remove(button: Button) {
        const index = this._buttons.indexOf(button);
        if (index !== -1) {
            this._buttons.splice(index, 1);
        }
    }

    add(button: Button) {
        this._buttons.push(button);
        button.events.on("click", () => this.select(button));
    }

    select(button: Button, silent = false) {
        if(this.selected !== button) {
            this._selected = button;
            this._buttons.forEach(b => b.toggle(b === button, true));
            if(!silent) {
                this.events.emit("select", button);
            }
        }
    }

    get selected() {
        return this._selected;
    }

    get buttons() {
        return [...this._buttons];
    }
}

export type ButtonArgs = {
    text?: string,
    textOptions?: TextOptions,
    toggle?: boolean,
    group?: ButtonGroup
}
export interface ButtonEvents {
    click: Button
}
const groups = new WeakMap<Button, ButtonGroup>();
export class Button extends ScreenElement {

    public events = new StrictEventEmitter<ButtonEvents>()
    private _state: "idle" | "active" = "idle";
    private _hovered: boolean = false;
    private _textNode: Text
    private _rectNode: Rectangle

    constructor(private _params: ActorArgs & ButtonArgs) {
        super(_params);
        const {height = this.height || 36, width = this.width || 100, color = Color.fromHex(colors.lazuli)} = _params;
        this._textNode = new Text({ text: _params.text ?? "", color: Color.fromHex(colors.text), font: fonts.base(), ...(_params.textOptions ?? {})});
        this._rectNode = new Rectangle({ height, width, color, strokeColor: color, lineWidth: 5 });
        
        if(_params.group) {
            this.group = _params.group;
        }
    }

    onInitialize(): void {
        this.graphics.anchor = Vector.Zero;
        this.graphics.add(new GraphicsGroup({
            useAnchor: false,
            width: this.width,
            height: this.height,
            members: [
                { graphic: this._rectNode, offset: Vector.Zero },
                { graphic: this._textNode, offset: vec(this._rectNode.width/2, this._rectNode.height/2).add(vec(-this._textNode.width/2, -this._textNode.height/2)), useBounds: false }
            ]
        }));
        this.updateGraphics();

        this.on('pointerup', () => {
            if(this._params.toggle) {
                this.toggle(this._state !== "active");
            } else {
                this.emit("click", this);
            }
        })
        this.on('pointerenter', () => {
            this._hovered = true;
            this.updateGraphics();
        })
        this.on('pointerleave', () => {
            this._hovered = false;
            this.updateGraphics();
        })
    }

    set text(text: string) {
        this._textNode.text = text;
    }

    get text() {
        return this._textNode.text;
    }

    toggle(active: boolean, silent = false) {
        this._state = active ? "active" : "idle";
        this.updateGraphics();
        if(!silent) {
            this.emit("click", this);
        }
    }

    private updateGraphics() {
        const hoveredColor = this._hovered ? Color.fromHex(hoverColor(this.color.toHex(),-40)) : this.color;
        const color = this._state === "active" ? Color.fromHex(hoverColor(this.color.toHex(),-40)) : this.color;
        this._rectNode.color = hoveredColor;
        this._rectNode.strokeColor = color;
    }

    set group(group: ButtonGroup) {
        if (!groups.has(this)) {
            groups.set(this, group);
            group.add(this);
            this._params.toggle = true;
            if(this._state === "active") {
                group.select(this, true);
            }
        } else {
            console.warn("Button already has a group");
        }
    }

    get group(): ButtonGroup | undefined {
        return groups.get(this);
    }

}