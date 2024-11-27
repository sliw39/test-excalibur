import { Actor, Animation, AnimationStrategy, range, vec } from "excalibur";
import { trader1 } from "../../../art/player/playe_placehoder/Trader_1/trader1";
import { world } from "../../../utils/consts.util";
import { StrictEventEmitter } from "../../../utils/events.util";
import { IParty, IWorldLocation } from "../world.model";

export type WorldPlayerEvents = {
    move: {from: IWorldLocation, to: IWorldLocation}
    moveEnd: {from: IWorldLocation, to: IWorldLocation}
}
export class WorldPlayer extends Actor {
    public events = new StrictEventEmitter<WorldPlayerEvents>()
    private _moving = false;

    constructor(public data: IParty) {
        super({ pos: vec(data.location.coords.x, data.location.coords.y) });
        this.z = 101;
    }

    onInitialize() {
        this.graphics.anchor = vec(0.5, 1);
        this.pos = vec(this.data.location.coords.x, this.data.location.coords.y);
        this.graphics.use(Animation.fromSpriteSheet(trader1.idle, range(0,trader1.idle.columns-1), 100, AnimationStrategy.Loop));
    }

    move(location: IWorldLocation) {
        this._moving = true;
        this.events.emit("move", {from: this.data.location, to: location});
        
        this.data.location = location;
        this.actions.moveTo(vec(location.coords.x, location.coords.y), world.moveSpeed).toPromise().then(() => {
            this._moving = false;
            this.events.emit("moveEnd", {from: this.data.location, to: location});
        });
    }

    get moving() {
        return this._moving;
    }

}