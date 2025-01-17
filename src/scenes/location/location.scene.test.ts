import { TiledResource } from "@excaliburjs/plugin-tiled";
import { vec } from "excalibur";
import { describe, it, expect } from "vitest";
import { GuardImpl } from "./location.scene";

describe("GuardImpl", () => {
  describe("getClosestDecors", () => {
    it("should return closest decors", () => {
      const guard = new GuardImpl(
        new TiledResource("/maps/map_tiled_farm/IceTilemap.tmx")
      );
      const decors = guard.getClosestDecors(vec(100, 100), 1000);
      expect(decors.length).toBeGreaterThan(0);
    });
  });
});
