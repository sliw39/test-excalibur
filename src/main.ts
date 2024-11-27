import { Engine, Loader, Scene } from "excalibur";
import { WorldScene } from "./scenes/worlds/world.scene";
import { fromYamlFile } from "./scenes/worlds/world.data";
import yamlFileMap0 from "./art/map/map0/map0.yaml?url";
import { resources } from "./utils/assets.util";
import { GameOverScene } from "./scenes/gameover/game-over.scene";
import { SceneName } from "./utils/consts.util";



class Game extends Engine {
  constructor(scenes: Record<string, Scene> = {}) {
    super({
      width: 1551, height: 1043, scenes
    });
  }
  initialize() {

  }
}

const loader = new Loader()
loader.addResources(Object.values(resources))

fromYamlFile(yamlFileMap0).then((world) => {
  const game = new Game({ "world": new WorldScene(world), "gameover": new GameOverScene() } as Record<SceneName, Scene>);
  game.initialize();
  game.start(loader).then(() => {
    // after player clicks start game, for example
    game.goToScene('world' as SceneName);
  });
})
