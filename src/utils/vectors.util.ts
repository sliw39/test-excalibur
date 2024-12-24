import { Vector } from "excalibur";

export const allDirections = [
  "top",
  "bottom",
  "left",
  "right",
  "topLeft",
  "topRight",
  "bottomLeft",
  "bottomRight",
  "stop",
] as const;
export type MovementDirection = (typeof allDirections)[number];

export function direction(a: Vector, b: Vector): MovementDirection {
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
