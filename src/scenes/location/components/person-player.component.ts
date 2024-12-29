import { ActionReadyBinder, ActionType, allActive, isActive, listen } from "@utils/keyboard.util";
import { Person, PersonArgs } from "./person.component";
import { FiringState, IdleState, AimingState } from "@utils/state-machines/firearm.state";
import { MovingState } from "@utils/state-machines/movement.state";
import { Color, Engine, Vector } from "excalibur";

export class PlayerPlaceholder extends Person implements ActionReadyBinder {
    constructor(args: PersonArgs, public binderName = "player") {
      super(args);
    }
  
    onAttack(event: ActionType) {
      switch (event) {
        case "press":
          this.holdFire();
          break;
        case "toogle_on":
          this.aim();
          break;
        case "toogle_off":
          this.fire();
          break;
      }
    }
  
    onPickup(event: ActionType) {
      if (event === "press") {
        this.pickup();
      }
    }
  
    onChangeFireMode(actionType: ActionType): void {
      if (actionType === "press") {
        this.changeFireMode();
      }
    }

    onReload(actionType: ActionType): void {
      if (actionType === "press") {
        this.reload();
      }
    }
  
    protected getMovement(_engine: Engine) {
      if(this.model.dead) return Vector.Zero;

      let vector = _engine.input.pointers.primary.lastWorldPos.sub(this.pos);
      vector = vector.scale(1 + 0.5 * (1 - this._fireAccuracy));
      this._lookVector = vector;
  
      if (allActive(["onMoveUp", "onMoveLeft"]) && !isActive("onMoveRight")) {
        this._animations.currentState.up();
        return this.movements.upleft;
      }
      if (
        allActive(["onMoveDown", "onMoveLeft"]) &&
        !isActive("onMoveRight")
      ) {
        this._animations.currentState.down();
        return this.movements.downleft;
      }
      if (
        allActive(["onMoveDown", "onMoveRight"]) &&
        !isActive("onMoveLeft")
      ) {
        this._animations.currentState.down();
        return this.movements.downright;
      }
      if (allActive(["onMoveUp", "onMoveRight"]) && !isActive("onMoveLeft")) {
        this._animations.currentState.up();
        return this.movements.upright;
      }
      if (isActive("onMoveUp")) {
        this._animations.currentState.up();
        return this.movements.up;
      }
      if (isActive("onMoveDown")) {
        this._animations.currentState.down();
        return this.movements.down;
      }
      if (isActive("onMoveRight")) {
        this._animations.currentState.right();
        return this.movements.right;
      }
      if (isActive("onMoveLeft")) {
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
  