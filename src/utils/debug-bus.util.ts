import {
  Actor,
  Color,
  Engine,
  Graphic,
  GraphicsGroup,
  Text,
  Vector,
} from "excalibur";
import { colors, fonts } from "./consts.util";

const holders = new WeakSet<object>();
const graphicsHolders = new WeakMap<Graphic | GraphicsGroup, object>();
const graphics: (Graphic | GraphicsGroup)[] = [];

export class DebugActor extends Actor {
  constructor() {
    super({
      pos: Vector.Zero,
      anchor: Vector.Zero,
    });
  }

  onPreUpdate(engine: Engine, delta: number): void {
    super.onPreUpdate(engine, delta);
    this.graphics.use(new GraphicsGroup({ members: graphics }));
  }
}

export function addGraphic(holder: object, info: Graphic | GraphicsGroup) {
  if (holders.has(holder)) {
    holders.delete(holder);
    cleanup();
  }

  graphics.push(info);
  graphicsHolders.set(info, holder);
  holders.add(holder);
}

export function removeGraphic(holder: object) {
  if (holders.has(holder)) {
    holders.delete(holder);
    cleanup();
  }
}

export function showText(text: string, pos: Vector, duration: number = 1000) {
  const g = new GraphicsGroup({
    useAnchor: false,
    members: [
      {
        graphic: new Text({
          text,
          color: Color.fromHex(colors.black),
          font: fonts.base(),
        }),
        offset: pos,
      },
    ],
  });
  showGraphic(g, duration);
}

export function showGraphic(
  graphics: Graphic | GraphicsGroup,
  duration: number = 1000
) {
  const holder = {};
  addGraphic(holder, graphics);
  setTimeout(() => {
    removeGraphic(holder);
  }, duration);
}

function cleanup() {
  let ng = graphics.splice(0, graphics.length).filter((g) => {
    if (graphicsHolders.has(g) && !holders.has(graphicsHolders.get(g)!)) {
      graphicsHolders.delete(g);
      return false;
    }
    return true;
  });
  graphics.push(...ng);
}
