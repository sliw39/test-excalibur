import { HtmlScreen, newScreen } from "@engine/html-framework.engine";
import { Actor, ActorArgs } from "excalibur";
import template from "./hud.component.html?url";
import { Person } from "../person.component";
import firearmBurstImgUrl from "@art/weapons/firemode-burst.png?url";
import firearmSingleImgUrl from "@art/weapons/firemode-single.png?url";
import firearmAutoImgUrl from "@art/weapons/firemode-auto.png?url";
import { IconGroup } from "@ui/html/icon.component";
import { ChangingFireModeState } from "@utils/state-machines/firearm.state";

export interface HudComponentArgs extends ActorArgs {
  player: Person
}
export class HudComponent extends Actor {
  private _screen: Promise<HtmlScreen> | null = null;
  private _player: Person;
  private _weaponMode!: IconGroup;

  constructor(args: HudComponentArgs) {
    super(args);
    this._player = args.player;
    this._player.currentWeapon.events.on("transitioned", (e) => {
      if(e.from instanceof ChangingFireModeState) {
        this._weaponMode?.setSelected(this._player.currentWeapon.fireMode);
      }
    })
    this._player.currentWeapon.events.on("fire", () => this.updateAmmoCount());
    this._player.currentWeapon.events.on("reloading", () => this.updateAmmoCount());
    this.hide();
  }

  private updateUI() {
    if (!this._screen) {
      return;
    }
    this._screen!.then((s) => {
      s.q(
        ".current-weapon-firemode",
        (e) => {
          const fireModes = this._player.currentWeapon.firearm.fireModes.map(fm => {
            switch(fm) {
              case "burst":
                return { name: "burst", src: firearmBurstImgUrl }
              case "semi-auto":
                return { name: "semi-auto", src: firearmSingleImgUrl }
              case "auto":
                return { name: "auto", src: firearmAutoImgUrl }
            }
          })
          this._weaponMode = new IconGroup(e, fireModes);
          this._weaponMode.setSelected(this._player.currentWeapon.fireMode);
        });
      this.updateWeaponName();
      this.updateAmmoCount();
    });
  }

  updateWeaponName() {
    this._screen!.then((s) => {
      s.q(".current-weapon-name", (e) => {
        e.textContent = this._player.currentWeapon.firearm.name;
      });
      s.q(".current-weapon-img img", (e: HTMLImageElement) => {
        e.src = this._player.currentWeapon.firearm.image;
      })
    });
  }

  updateAmmoCount() {
    this._screen!.then((s) => {
      s.q(".current-weapon-ammo", (e) => {
        e.textContent = `${this._player.currentWeapon.bullets}/${this._player.currentWeapon.firearm.magsize}`;
      });
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
