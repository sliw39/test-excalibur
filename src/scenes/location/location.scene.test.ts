import { TiledResource } from "@excaliburjs/plugin-tiled";
import { vec } from "excalibur";
import { describe, it, expect } from "vitest";
import { GuardImpl } from "./location.scene";

class GuardImplSpy extends GuardImpl {

  constructor() {
    super(new TiledResource(""));
  }
  _fakeGrid = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 0, 0, 0, 0], //2;2
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 0, 0, 0], //6;7
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],

  ]
  hasDecorAtCoordinate(x: number, y: number): boolean {
    return this._fakeGrid[y]?.[x] === 1
  }
}

describe("GuardImpl", () => {
  describe("getClosestDecors", () => {
    it("should return closest decors", () => {
      const guard = new GuardImplSpy();
      let decors = guard.getClosestDecors(vec(0, 0), 1000);
      expect(decors.length).toBeGreaterThan(0);
      expect(decors[0]).toEqual(vec(64, 64));

      decors = guard.getClosestDecors(vec(8*32, 8*32), 1000);
      expect(decors.length).toBeGreaterThan(0);
      expect(decors[0]).toEqual(vec(6*32, 7*32));
    });

    it("should exclude the center tile", () => {
      const guard = new GuardImplSpy();
      let decors = guard.getClosestDecors(vec(6*32+8, 7*32+8), 1000);
      expect(decors.length).toBeGreaterThan(0);
      expect(decors[0]).toEqual(vec(64, 64));
    })

    it("returns multiple equidistant decors", () => {
      const guard = new GuardImplSpy();
      let decors = guard.getClosestDecors(vec(7*32+8, 2*32+8), 1000);
      expect(decors.length).toBe(2);
      expect(decors).toContainEqual(vec(6*32, 7*32));
      expect(decors).toContainEqual(vec(64, 64));
    })
  });
});
