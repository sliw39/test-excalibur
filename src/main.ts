import { DefaultLoader, Engine, Loader, PointerScope, Scene } from "excalibur";
import { fromYamlFile } from "@models/world.data";
import yamlFileMap0 from "@art/map/map0/map0.yaml?url";
import { resources } from "@utils/assets.util";
import { SceneName } from "@utils/consts.util";
import { WorldScene } from "@scenes/worlds/world.scene";
import { GameOverScene } from "@scenes/gameover/game-over.scene";
import { ChooseRolesScene } from "@scenes/location-lobby/choose-roles.scene";
import { ChooseActionScene } from "@scenes/location-lobby/choose-action.scene";
import { LocationScene } from "@scenes/location/location.scene";

import azerty from "@utils/controls/keyboard/azerty";
import { setupBindings } from "@utils/keyboard.util";
setupBindings(azerty);

class Game extends Engine {
  constructor(scenes: Record<string, Scene> = {}) {
    super({
      canvasElementId: "game",
      pointerScope: PointerScope.Canvas,
      width: 1551,
      height: 1043,
      scenes,
    });
  }
  initialize() {}
}

const loader = new Loader();
loader.addResources(Object.values(resources));

fromYamlFile(yamlFileMap0).then((world) => {
  const game = new Game({
    world: new WorldScene(world),
    gameover: new GameOverScene(),
    chooseRoles: new ChooseRolesScene(),
    chooseAction: new ChooseActionScene(),
    location: {
      scene: new LocationScene(),
      loader: new DefaultLoader(),
    },
  } as Record<SceneName, Scene>);
  game.initialize();
  game.start(loader).then(() => {
    // after player clicks start game, for example
    game.goToScene("location" as SceneName);
  });
  window.game = game;
});
