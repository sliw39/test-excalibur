import { Animation, ImageSource, range, SpriteSheet } from "excalibur";
import personSpriteSheetImgUrl from "./RPG_Character_Template.png?url";
import { MoveStateManager } from "@utils/state-machines/movement.state";

export const resources = {
  rpgCharacterTemplate: new ImageSource(personSpriteSheetImgUrl),
};

const rows = 11;
const columns = 4;
const charactersRowOffset = [0, 6];
export const spriteSheet = SpriteSheet.fromImageSource({
  image: resources.rpgCharacterTemplate,
  grid: {
    rows: 11,
    columns: 4,
    spriteWidth: 32,
    spriteHeight: 32,
  },
  spacing: {
    originOffset: { x: 0, y: 1 },
  },
});
export const characters = charactersRowOffset.map((offset) => {
  return (speed = 100) =>
    new MoveStateManager({
      idleBottom: spriteSheet.getSprite(0, offset),
      idleRight: spriteSheet.getSprite(3, offset),
      idleTop: spriteSheet.getSprite(2, offset),
      idleLeft: spriteSheet.getSprite(1, offset),
      movingBottom: Animation.fromSpriteSheet(
        spriteSheet,
        range((offset + 1) * columns, (offset + 2) * columns - 1),
        speed
      ),
      movingLeft: Animation.fromSpriteSheet(
        spriteSheet,
        range((offset + 2) * columns, (offset + 3) * columns - 1),
        speed
      ),
      movingRight: Animation.fromSpriteSheet(
        spriteSheet,
        range((offset + 3) * columns, (offset + 4) * columns - 1),
        speed
      ),
      movingTop: Animation.fromSpriteSheet(
        spriteSheet,
        range((offset + 4) * columns, (offset + 5) * columns - 1),
        speed
      ),
    });
});
