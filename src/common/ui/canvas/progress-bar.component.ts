import { Actor, ActorArgs, Color, GraphicsGroup, Rectangle, Text, vec } from "excalibur"
import { colors, fonts } from "../../../utils/consts.util"

export interface ProgressBarOptions {
    initValue?: number
    max?: number
    barColor?: Color
    step?: number
    textPrefix?: string
    textSuffix?: string
    showText?: boolean
}
export class ProgressBar extends Actor {
    private _value: number
    private _step: number
    private _max: number
    private _barColor: Color
    private _textPrefix: string
    private _textSuffix: string
    private _showText: boolean

    private _textNode: Text | undefined
    private _barNode: Rectangle | undefined

    private _animationValue = 0
    private _animationSpeed = 1

    constructor(options: ProgressBarOptions & ActorArgs) {
        super(options);
        this._value = options.initValue ?? 0;
        this._step = options.step ?? 1;
        this._max = options.max ?? 100;
        this._barColor = options.barColor ?? Color.fromHex(colors.forest);
        this._textPrefix = options.textPrefix ?? "";
        this._textSuffix = options.textSuffix ?? "";
        this._showText = options.showText ?? true;   
    }

    onInitialize(): void {
        this.graphics.add(new GraphicsGroup({
            useAnchor: false,
            members: [
                { graphic: new Rectangle({ width: this.width, height: this.height, strokeColor: Color.fromHex(colors.text), lineWidth: 1 }), offset: vec(0.5, 0.5) },
                { graphic: this.updateBarNode(), offset: vec(0, 0.5) },
                { graphic: this.updateTextNode(), offset: vec(0.5, 0.5), useBounds: false }
            ]
        }));
    }

    private get animationSpeed() {
        return this._animationSpeed * this.width / this._max;
    }

    onPreUpdate(): void {
        const delta = this._value - this._animationValue;
        if(Math.abs(delta) > this.animationSpeed) {
            this._animationValue += Math.sign(delta) * this.animationSpeed;
        } else {
            this._animationValue = this._value;
        }
        this.updateAll();
    }

    private updateAll() {
        if(this._showText) {
            this.updateTextNode();    
        }
        this.updateBarNode();
    }

    private updateTextNode() {
        if(!this._textNode) {
            this._textNode = new Text({
                text: "",
                color: Color.fromHex(colors.text),
                font: fonts.base(),
            });
        }
        this._textNode.text = this._showText ? this._textPrefix + this._animationValue.toFixed(0) + "/" + this._max.toFixed(0) + this._textSuffix : "";
        return this._textNode;
    }

    private updateBarNode() {
        if(!this._barNode) {
            this._barNode = new Rectangle({ width: 0, height: this.height, strokeColor: Color.Transparent, color: this._barColor, lineWidth: 1 });
        }
        this._barNode.width = this.width * (this._animationValue / this._max);
        this._barNode.color = this._barColor;
        return this._barNode;
    }

    set value(value: number) {
        if(value > this._max) {
            this._value = this._max;
        } else if (value < 0) {
            this._value = 0;
        } else {
            this._value = value;
        }
    }

    get value() {
        return this._value;
    }

    set step(step: number) {
        this._step = step;
        this.updateAll();
    }

    get step() {
        return this._step;
    }   

    set max(max: number) {
        this._max = max;
        this.updateAll();
    }

    get max() {
        return this._max;
    }

    set barColor(color: Color) {
        this._barColor = color;
        this.updateBarNode();
    }

    get barColor() {
        return this._barColor;
    }

    set textPrefix(prefix: string) {
        this._textPrefix = prefix;
        this.updateTextNode();
    }

    get textPrefix() {
        return this._textPrefix;
    }

    set textSuffix(suffix: string) {
        this._textSuffix = suffix;
        this.updateTextNode();
    }

    get textSuffix() {
        return this._textSuffix;
    }

    set showText(show: boolean) {
        this._showText = show;
        this.updateTextNode();
    }

    get showText() {
        return this._showText;
    }
}