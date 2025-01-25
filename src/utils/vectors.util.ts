import { Actor, vec, Vector } from "excalibur";

export const allDirections = [
  "top",
  "topRight",
  "right",
  "bottomRight",
  "bottom",
  "bottomLeft",
  "left",
  "topLeft",
  "stop",
] as const;
export type MovementDirection = (typeof allDirections)[number];

export function globalDirection(a: Vector, b: Vector): MovementDirection {
  const fleeVector = b.sub(a);
  // warning: top and bottom are reversed because the y axis is reversed in excalibur
  const direction = Math.round((fleeVector.toAngle() * 8) / (2 * Math.PI));
  let directionString: MovementDirection = "stop";
  switch (direction) {
    case 0:
      directionString = "right";
      break;
    case 1:
      directionString = "bottomRight";
      break;
    case 2:
      directionString = "bottom";
      break;
    case 3:
      directionString = "bottomLeft";
      break;
    case 4:
      directionString = "left";
      break;
    case 5:
      directionString = "topLeft";
      break;
    case 6:
      directionString = "top";
      break;
    case 7:
      directionString = "topRight";
      break;
  }
  return directionString;
}

export function rotateGlobalDirection(
  direction: Omit<MovementDirection, "stop">,
  amount: -45 | -90 | 180 | 90 | 45
): MovementDirection {
  const directions = [...allDirections].filter((d) => d !== "stop");
  const index =
    (directions.indexOf(direction as any) + amount / 45) % directions.length;
  return directions[index];
}

export function direction(a: Vector, b: Vector): Vector {
  return b.sub(a).normalize();
}

export function closest<T>(origin: T, points: T[], mapper: (v: T) => Vector) {
  const allDistances = distances(mapper(origin), points.map(mapper));
  const closest = allDistances.reduce((a, b) => (a < b ? a : b), Infinity);
  return points[allDistances.indexOf(closest)];
}

export function distances(origin: Vector, points: Vector[]) {
  return points.map((point) => Vector.distance(origin, point));
}

export function manhattanDistance(a: Vector, b: Vector) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function splitSegment(
  start: Vector,
  end: Vector,
  stepLen: number
): Vector[] {
  const result: Vector[] = [start];
  let distance = Vector.distance(start, end);
  const stepVector = end.sub(start).normalize().scale(stepLen);

  while (distance > 0) {
    result.push(start.add(stepVector));
    start = start.add(stepVector);
    distance -= stepLen;
  }

  return result;
}

export function getRectFromCorners(a: Vector, b: Vector) {
  const minx = Math.min(a.x, b.x);
  const miny = Math.min(a.y, b.y);
  const maxx = Math.max(a.x, b.x);
  const maxy = Math.max(a.y, b.y);
  return [vec(minx, miny), vec(maxx, miny), vec(maxx, maxy), vec(minx, maxy)];
}

export function snapToGrid(pos: Vector, cellSize: number) {
  return vec(
    Math.floor(pos.x / cellSize) * cellSize,
    Math.floor(pos.y / cellSize) * cellSize
  );
}

export function barycentric(points: Vector[], weights?: number[]) {
  if (!weights) {
    weights = [];
    points.forEach(() => weights!.push(1));
  }
  
  return points.map((v, i) => v.scale(weights![i])).reduce((a, b) => a.add(b), vec(0, 0)).scale(1 / weights!.reduce((a, b) => a + b, 0));
}

export interface Guard {
  checkDecorCollision(nextPos: Vector): boolean;
  checkEntitiesCollision(nextPos: Vector): Actor[];
  hasLineOfSight(a: Vector, b: Vector): boolean;
  getClosestDecors(pos: Vector): Vector[];
}
