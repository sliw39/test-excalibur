import { vec, Vector } from "excalibur";
import { AstarGrid } from "./pathfinder.engine";
import { describe, expect, it } from "vitest";

describe("AstarGrid", () => {
  it("should find a very simple path", () => {
    const grid = new AstarGrid(vec(0, 5), vec(9, 5), 10, 1);

    const expectedPath: Vector[] = [];
    for (let i = 0; i < 10; i++) {
      expectedPath.push(vec(i, 5));
    }
    const result = grid.findPath();
    expect(result).toEqual(expectedPath);
  });

  it("should avoid obstacles", () => {
    const grid = new AstarGrid(vec(0, 5), vec(9, 5), 10, 1);
    grid.addObstacle(vec(3, 5));
    grid.addObstacle(vec(6, 4));
    grid.addObstacle(vec(6, 6));

    const expectedPath: Vector[] = [
      vec(0, 5),
      vec(1, 5),
      vec(2, 4), // avoid obstacle (3,5)
      vec(3, 4),
      vec(4, 4),
      vec(5, 5), // return to path
      vec(6, 5),
      vec(7, 5),
      vec(8, 5),
      vec(9, 5),
    ];
    const result = grid.findPath();
    expect(result).toEqual(expectedPath);
  });

  it("can offsets negative positions", () => {
    const grid = new AstarGrid(vec(5, 5), vec(-5, -5), 10, 1);

    const expectedPath: Vector[] = [];
    for (let i = 5; i >= -5; i--) {
      expectedPath.push(vec(i, i));
    }
    const result = grid.findPath();
    expect(result).toEqual(expectedPath);
  });

  it("can resolve path with pixel grids", () => {
    const grid = new AstarGrid(vec(-23, 12), vec(27, -16), 20, 10);

    const expectedPath: Vector[] = [
      vec(-30, 10),
      vec(-20, 0),
      vec(-10, -10),
      vec(0, -20),
      vec(10, -20),
      vec(20, -20),
    ];

    const result = grid.findPath();
    expect(result).toEqual(expectedPath);
  });

  it("returns nothing when there is no path", () => {
    const grid = new AstarGrid(vec(0, 2), vec(9, 2), 0, 1);
    grid.addObstacle(vec(5, 0));
    grid.addObstacle(vec(5, 1));
    grid.addObstacle(vec(5, 2));
    grid.addObstacle(vec(5, 3));
    grid.addObstacle(vec(5, 4));
    const result = grid.findPath();
    expect(result).toEqual([]);
  });

  it("doesn't teleport on equidistant paths", () => {
    const grid = new AstarGrid(vec(0, 2), vec(9, 2), 2, 1);
    grid.addObstacle(vec(5, 1));
    grid.addObstacle(vec(5, 2));
    grid.addObstacle(vec(5, 3));
    const result = grid.findPath();
    expect(result).toEqual([
      vec(0, 2),
      vec(1, 2),
      vec(2, 2),
      vec(3, 1),
      vec(4, 0),
      vec(5, 0),
      vec(6, 0),
      vec(7, 1),
      vec(8, 2),
      vec(9, 2),
    ]);
  });
});
