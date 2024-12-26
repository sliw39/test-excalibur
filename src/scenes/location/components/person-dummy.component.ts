import { MutexChannel } from "@utils/mutex.util";
import { MovingState } from "@utils/state-machines/movement.state";
import { MovementDirection } from "@utils/vectors.util";
import { Vector } from "excalibur";
import { Person, PersonArgs } from "./person.component";

export class Dummy extends Person {
    private _movement: MutexChannel<MovementDirection> = new MutexChannel([
      "top",
      "bottom",
      "left",
      "right",
      "topLeft",
      "topRight",
      "bottomLeft",
      "bottomRight",
      "stop",
    ]);
  
    constructor(args: PersonArgs) {
      super(args);
      this._movement.request("stop");
      this._currentWeapon.changeFireMode();
    }
  
    aimAndfire(direction: Vector, precision: number = 0.5) {
      if (!this._mainAction.available) return;
      this._lookVector = direction;
      this.move("stop");
      this.aim();
      setTimeout(() => {
        this.fire();
      }, precision * 1000);
      setTimeout(() => {
        this.fire();
        this.holdFire();
      }, 2500);
    }
  
    move(direction: MovementDirection) {
      if (!this._movement.available)
        this._movement.release(this._movement.current!);
      this._movement.request(direction);
    }
  
    protected getMovement() {
      if (this._movement.current === "topLeft") {
        this._animations.currentState.up();
        return this.movements.upleft;
      }
      if (this._movement.current === "bottomLeft") {
        this._animations.currentState.down();
        return this.movements.downleft;
      }
      if (this._movement.current === "bottomRight") {
        this._animations.currentState.down();
        return this.movements.downright;
      }
      if (this._movement.current === "topRight") {
        this._animations.currentState.up();
        return this.movements.upright;
      }
      if (this._movement.current === "top") {
        this._animations.currentState.up();
        return this.movements.up;
      }
      if (this._movement.current === "bottom") {
        this._animations.currentState.down();
        return this.movements.down;
      }
      if (this._movement.current === "right") {
        this._animations.currentState.right();
        return this.movements.right;
      }
      if (this._movement.current === "left") {
        this._animations.currentState.left();
        return this.movements.left;
      }
      (this._animations.currentState as MovingState).stop?.();
      return Vector.Zero;
    }
  }
  