import {
  getRectFromCorners,
  manhattanDistance,
  snapToGrid,
} from "@utils/vectors.util";
import { Vector, vec } from "excalibur";

export class AstarGrid {
  private _grid: number[][];
  private _offset: Vector;
  private _width: number;
  private _height: number;
  private _start: Vector;
  private _end: Vector;

  /**
   * @param start the starting position in px
   * @param end this end position in px
   * @param margin margin expands the sub-grid (in px) that will be searched. start and end points are the corners of the sub-grid.
   * @param cellSize the cell size in px
   */
  constructor(
    start: Vector,
    end: Vector,
    margin: number = 512,
    private cellSize: number = 32
  ) {
    this._grid = [];
    this._start = snapToGrid(start, this.cellSize).scale(1 / this.cellSize);
    this._end = snapToGrid(end, this.cellSize).scale(1 / this.cellSize);
    let [tl, _tr, br, _bl] = getRectFromCorners(this._start, this._end);
    const vmargin = snapToGrid(vec(margin, margin), this.cellSize).scale(
      1 / this.cellSize
    );

    this._offset = tl = tl.sub(vmargin);
    br = br.add(vmargin);

    this._start = this._start.sub(this._offset);
    this._end = this._end.sub(this._offset);

    this._width = br.x - tl.x + 1;
    this._height = br.y - tl.y + 1;
    for (let x = 0; x < this._width; x++) {
      this._grid[x] = [];
      for (let y = 0; y < this._height; y++) {
        this._grid[x][y] = 0;
      }
    }
  }

  addObstacle(pos: Vector) {
    const x = Math.floor(pos.x / this.cellSize - this._offset.x);
    const y = Math.floor(pos.y / this.cellSize - this._offset.y);
    if (this.checkOutOfBounds(x, y)) return;
    this._grid[x][y] = Infinity;
  }

  private checkOutOfBounds(x: number, y: number) {
    return x < 0 || y < 0 || x >= this._width || y >= this._height;
  }

  findPath() {
    const uniqVecs: VNode[][] = [];
    function uvec(
      loc: Vector,
      cost: number,
      end: Vector,
      parent = null
    ): VNode {
      if (!uniqVecs[loc.x]) uniqVecs[loc.x] = [];
      if (!uniqVecs[loc.x][loc.y]) {
        const heuristic = manhattanDistance(loc, end) * 10;
        uniqVecs[loc.x][loc.y] = {
          loc: vec(loc.x, loc.y),
          heuristic,
          cost,
          total: cost + heuristic,
        };
      }
      return uniqVecs[loc.x][loc.y];
    }

    const start = uvec(this._start, 0, this._end);
    const end = uvec(this._end, Infinity, this._end);
    const queue: VNode[] = [start];
    const visited: VNode[] = [];

    while (queue.length > 0) {
      const current = this.findAndRemoveLowestCostNode(queue);

      if (current === end) {
        return this.reconstructPath(current);
      }

      visited.push(current);

      const neighbors = this.getNeighbors(current.loc)
        .map((n) => uvec(n, Infinity, this._end))
        .filter((n) => !visited.includes(n));

      for (const neighbor of neighbors) {
        const cost =
          current.cost + (this.isDiagonal(current.loc, neighbor.loc) ? 14 : 10);
        if (!queue.includes(neighbor)) {
          queue.push(neighbor);
        } else if (cost >= neighbor.cost) {
          continue;
        }

        neighbor.parent = current;
        neighbor.cost = cost;
        neighbor.total = neighbor.cost + neighbor.heuristic;
      }
    }

    return [];
  }

  private reconstructPath(head: VNode) {
    const path: Vector[] = [];
    let killswitch = 1000;
    do {
      path.push(head.loc);
      head = head.parent!;
    } while (head && killswitch-- > 0);
    if (killswitch < 0) {
      console.error("reconstructPath failed : too long");
      return [];
    }
    return path.map((v) => v.add(this._offset).scale(this.cellSize)).reverse();
  }

  private getNeighbors(pos: Vector) {
    const neighbors: Vector[] = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        // exclude oob
        if (
          pos.x + x < 0 ||
          pos.y + y < 0 ||
          pos.x + x >= this._width ||
          pos.y + y >= this._height
        )
          continue;

        // exclude same or obstacle
        if (
          (x === 0 && y === 0) ||
          this._grid[pos.x + x][pos.y + y] === Infinity
        )
          continue;
        // exclude diagonal if adjacent to an obstacle
        if (
          x * y !== 0 &&
          (this._grid[pos.x][pos.y + y] === Infinity ||
            this._grid[pos.x + x][pos.y] === Infinity)
        )
          continue;

        neighbors.push(vec(pos.x + x, pos.y + y));
      }
    }
    return neighbors;
  }

  private isDiagonal(pos1: Vector, pos2: Vector) {
    return Math.abs(pos1.x - pos2.x) === 1 && Math.abs(pos1.y - pos2.y) === 1;
  }

  private findAndRemoveLowestCostNode(nodes: VNode[]) {
    let min = Infinity;
    let idx = -1;
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].total < min) {
        min = nodes[i].total;
        idx = i;
      }
    }
    return nodes.splice(idx, 1)[0];
  }
}

interface VNode {
  loc: Vector;
  heuristic: number;
  cost: number;
  total: number;
  parent?: VNode;
}
