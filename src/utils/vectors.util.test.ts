import { describe, it, expect } from "vitest";
import {
  closest,
  globalDirection,
  rotateGlobalDirection,
  splitSegment,
} from "./vectors.util";
import { vec, Vector } from "excalibur";

describe("direction()", () => {
  it.each([
    { a: vec(0, 0), b: vec(1, 1), expected: "bottomRight" },
    { a: vec(0, 0), b: vec(-1, 1), expected: "bottomLeft" },
    { a: vec(0, 0), b: vec(1, -1), expected: "topRight" },
    { a: vec(0, 0), b: vec(-1, -1), expected: "topLeft" },
    { a: vec(0, 0), b: vec(1, 0), expected: "right" },
    { a: vec(0, 0), b: vec(-1, 0), expected: "left" },
    { a: vec(0, 0), b: vec(0, 1), expected: "bottom" },
    { a: vec(0, 0), b: vec(0, -1), expected: "top" },
    { a: vec(20, -50), b: vec(-25, 10), expected: "bottomLeft" },
  ])(
    "should return the correct direction v($a, $b) : $expected",
    ({ a, b, expected }) => {
      expect(globalDirection(a, b)).toBe(expected);
    }
  );
});

describe("closest()", () => {
  it("should return the closest point", () => {
    const origin = vec(0, 0);
    const points = [vec(2, 1), vec(-1, 1), vec(1, -2), vec(-5, -1)];
    expect(closest<Vector>(origin, points, (t) => t)).toEqual(vec(-1, 1));
  });
});

describe("splitSegment()", () => {
  it("should return the correct points", () => {
    const start = vec(0, 0);
    const end = vec(5, 0);
    const stepLen = 1;
    expect(splitSegment(start, end, stepLen)).toEqual([
      vec(0, 0),
      vec(1, 0),
      vec(2, 0),
      vec(3, 0),
      vec(4, 0),
      vec(5, 0),
    ]);
  });

  it("should return same sized segment (except for last point)", () => {
    const start = vec(12, 53);
    const end = vec(213, -425);
    const stepLen = 32;
    const result = splitSegment(start, end, stepLen);
    expect(result.length).toBe(
      Math.floor(Vector.distance(start, end) / stepLen) + 2
    );

    for (let i = 1; i < result.length - 2; i++) {
      const a = result[i - 1];
      const b = result[i];
      expect(Math.round(Vector.distance(a, b))).toBe(stepLen);
    }
  });
});

describe("rotateGlobalDirection()", () => {
  it.each([
    { direction: "right", amount: 90, expected: "bottom" },
    { direction: "right", amount: 180, expected: "left" },
    { direction: "right", amount: 45, expected: "bottomRight" },
    { direction: "right", amount: -90, expected: "top" },
    { direction: "right", amount: -45, expected: "topRight" },
    { direction: "bottomLeft", amount: 90, expected: "topLeft" },
    { direction: "bottomLeft", amount: 180, expected: "topRight" },
    { direction: "bottomLeft", amount: 45, expected: "left" },
    { direction: "bottomLeft", amount: -90, expected: "bottomRight" },
    { direction: "bottomLeft", amount: -45, expected: "bottom" },
  ])(
    "should rotate $direction by $amount degrees to $expected",
    ({ direction, amount, expected }) => {
      expect(rotateGlobalDirection(direction, amount as any)).toBe(expected);
    }
  );
});
