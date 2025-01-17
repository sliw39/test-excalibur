import { Actor, Vector } from "excalibur";

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

export interface Guard {
  checkDecorCollision(nextPos: Vector): boolean;
  checkEntitiesCollision(nextPos: Vector): Actor[];
  hasLineOfSight(a: Vector, b: Vector): boolean;
  getClosestDecors(pos: Vector): Vector[];
}
