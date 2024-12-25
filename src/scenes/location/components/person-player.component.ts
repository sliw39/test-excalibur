import { ActionReadyBinder, ActionType, isActive, listen } from "@utils/keyboard.util";
import { Person, PersonArgs } from "./person.component";
import { FireState, IdleState, AimState } from "@utils/state-machines/firearm.state";
import { MovingState } from "@utils/state-machines/movement.state";
import { Color, Engine, Vector } from "excalibur";

export class PlayerPlaceholder extends Person implements ActionReadyBinder {
    constructor(args: PersonArgs, public binderName = "player") {
      super(args);
    }
  
    attack(event: ActionType) {
      if(this.model.dead) return;
      
      const state = this._currentWeapon.currentState;
      if (event === "press" && state instanceof FireState) {
        this.holdFire();
        return;
      }
      if (
        event === "toogle_on" &&
        this._mainAction.available &&
        state instanceof IdleState
      ) {
        this.aim();
      }
      if (
        event === "toogle_off" &&
        this._mainAction.current === "attack" &&
        state instanceof AimState
      ) {
        this.fire();
      }
    }
  
    pickup(event: ActionType) {
      if(this.model.dead) return;

      if (event === "press" && this._mainAction.available) {
        const action = this._mainAction.request("pickup");
        if (!action) return;
        this.color = Color.Green;
        setTimeout(() => {
          action.release();
          this.color = Color.Blue;
        }, 300);
      }
    }
  
    changeFireMode(actionType: ActionType): void {
      if(this.model.dead) return;

      const state = this._currentWeapon.currentState;
      if (
        actionType === "press" &&
        this._mainAction.available &&
        state instanceof IdleState
      ) {
        state.changeFireMode();
      }
    }
  
    protected getMovement(_engine: Engine) {
      if(this.model.dead) return Vector.Zero;

      let vector = _engine.input.pointers.primary.lastScreenPos.add(
        this.pos.scale(-1)
      );
      vector = vector.scale(1 + 0.5 * (1 - this._fireAccuracy));
      this._lookVector = vector;
  
      if (isActive("moveUp") && isActive("moveLeft") && !isActive("moveRight")) {
        this._animations.currentState.up();
        return this.movements.upleft;
      }
      if (
        isActive("moveDown") &&
        isActive("moveLeft") &&
        !isActive("moveRight")
      ) {
        this._animations.currentState.down();
        return this.movements.downleft;
      }
      if (
        isActive("moveDown") &&
        isActive("moveRight") &&
        !isActive("moveLeft")
      ) {
        this._animations.currentState.down();
        return this.movements.downright;
      }
      if (isActive("moveUp") && isActive("moveRight") && !isActive("moveLeft")) {
        this._animations.currentState.up();
        return this.movements.upright;
      }
      if (isActive("moveUp")) {
        this._animations.currentState.up();
        return this.movements.up;
      }
      if (isActive("moveDown")) {
        this._animations.currentState.down();
        return this.movements.down;
      }
      if (isActive("moveRight")) {
        this._animations.currentState.right();
        return this.movements.right;
      }
      if (isActive("moveLeft")) {
        this._animations.currentState.left();
        return this.movements.left;
      }
      (this._animations.currentState as MovingState).stop?.();
      return Vector.Zero;
    }
  
    bindEngine(engine: Engine) {
      listen(engine, this);

    }
  }
  