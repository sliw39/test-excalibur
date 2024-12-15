import { HtmlScreen, newScreen } from "@engine/html-framework.engine";
import { IWorldLocation } from "@models/world.model";
import { Actor, ActorArgs } from "excalibur";
import template from "./hud.component.html?url";

export class HudComponent extends Actor {
  private _screen: Promise<HtmlScreen> | null = null;
  private _food: number = 0;
  private _location: IWorldLocation | null = null;

  constructor(args: ActorArgs) {
    super(args);
    this.hide();
  }

  set currentLocation(location: IWorldLocation | null) {
    this._location = location;
    this.updateUI();
  }

  set food(food: number) {
    this._food = food;
    this.updateUI();
  }

  private updateUI() {
    if (!this._screen) {
      return;
    }
    this._screen!.then((s) => {
      s.q(
        "#location-info",
        (e) => (e.style.visibility = this._location ? "visible" : "hidden")
      );
      if (this._location) {
        s.q("#name span", (e) => (e.textContent = this._location!.name));
        s.q(
          "#hazard span",
          (e) =>
            (e.textContent = Math.round(this._location!.hazard * 100) + "%")
        );
        s.q(
          "#resources span",
          (e) =>
            (e.textContent = Math.round(this._location!.resources * 100) + "%")
        );
      }
      s.q("#food span", (e) => (e.textContent = this._food + ""));
    });
  }

  async show() {
    const s = newScreen();
    return (this._screen = s
      .load(template)
      .then(() => this.updateUI())
      .then(() => s));
  }

  hide() {
    newScreen();
    this._screen = new Promise<HtmlScreen>((r) =>
      r(new HtmlScreen(document.createElement("div")))
    );
  }
}
