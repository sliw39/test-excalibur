import { AiPerception, Behavior, GenericPipe } from "@engine/state-ai.engine";
import { manhattanDistance } from "@utils/vectors.util";
import { vec, Vector } from "excalibur";

export class GotoPipe extends GenericPipe {
    constructor(private _targetProvider: () => Vector | null, behavior: Behavior) {
        super("go_to", behavior);
    }

    probability(_ai: AiPerception): number {
        return 1;
    }
    execute(ai: AiPerception): Promise<void> {
        throw new Error("Method not implemented.");
    }
    interrupt(): void {
        throw new Error("Method not implemented.");
    }


}

class AstarGrid {
    private _grid: number[][]
    private _offset: Vector;
    private _width: number
    private _height: number

    constructor(pos1: Vector, pos2: Vector, margin: number) {
        this._grid = []
        const minx = Math.floor((Math.min(pos1.x, pos2.x) - margin) / 32)
        const maxx = Math.floor((Math.max(pos1.x, pos2.x) + margin) / 32)
        const miny = Math.floor((Math.min(pos1.y, pos2.y) - margin) / 32)
        const maxy = Math.floor((Math.max(pos1.y, pos2.y) + margin) / 32)
        this._offset = vec(minx, miny)
        this._width = maxx - minx + 1
        this._height = maxy - miny + 1
        for (let x = 0; x < this._width; x++) {
            this._grid[x] = []
            for (let y = 0; y < this._height; y++) {
                this._grid[x][y] = 0
            }
        }
    }

    addObstacle(pos: Vector) {
        const x = Math.floor((pos.x / 32 - this._offset.x))
        const y = Math.floor((pos.y / 32 - this._offset.y))
        this._grid[x][y] = Infinity
    }

    findPath(start: Vector, end: Vector) {
        start = vec(Math.floor((start.x / 32 - this._offset.x)), Math.floor((start.y / 32 - this._offset.y)))
        end = vec(Math.floor((end.x / 32 - this._offset.x)), Math.floor((end.y / 32 - this._offset.y)))
        
        const queue: Vector[] = [start]
        const visited: Vector[] = [start]
        const head = start

        while (queue.length > 0) {
            const current = queue.shift()!
            if (current.x === end.x && current.y === end.y) {
                return visited
            }

            const neighbors = this.getNeighbors(current).filter(n => !visited.includes(n)).toSorted((a, b) => manhattanDistance(a, end) - manhattanDistance(b, end))

            for (const neighbor of neighbors) {
                queue.push(neighbor)
                visited.push(neighbor)
            }
        }

    }

    getNeighbors(pos: Vector) {
        const neighbors: Vector[] = []
        for(let x = -1; x <= 1; x++) {
            for(let y = -1; y <= 1; y++) {
                // exclude same or obstable
                if(x === 0 && y === 0 || this._grid[pos.x + x][pos.y + y] === Infinity) continue
                // exclude diagonal if adjacent to an obstacle
                if(x*y !== 0 && this._grid[0][pos.y + y] === Infinity && this._grid[pos.x + x][0] === Infinity) continue

                neighbors.push(vec(pos.x + x, pos.y + y))
            }
        } 
        return neighbors
    }
}