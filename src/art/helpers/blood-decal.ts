import { ImageSource, SpriteSheet } from "excalibur";
import bloodDecalsImgUrl from "./blood-decal-160x32.png?url";
import { PseudoRandomEngine } from "@engine/pseudo-random.engine";

export const resources = {
  bloodDecals: new ImageSource(bloodDecalsImgUrl),
};
const random = new PseudoRandomEngine();

export const spriteSheet = SpriteSheet.fromImageSource({
  image: resources.bloodDecals,
  grid: {
    rows: 1,
    columns: 5,
    spriteWidth: 32,
    spriteHeight: 32,
  },
});
export function randomBloodDecal() {
  return random.pick(spriteSheet.sprites).clone();
}