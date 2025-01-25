import { AstarGrid } from "@engine/pathfinder.engine";
import { AiPerception, Behavior, GenericPipe } from "@engine/state-ai.engine";
import { AimingState, FiringState } from "@utils/state-machines/firearm.state";
import { sleep } from "@utils/time.util";
import { barycentric, globalDirection } from "@utils/vectors.util";
import { vec, Vector } from "excalibur";

export class FindRetreatSpotPipe extends GenericPipe {
    public point: Vector | null = null;

    constructor(behavior: Behavior, private _distance: number = 500) {
        super("move_away", behavior);
    }

    probability(ai: AiPerception): number {
        const aggFoes = ai.foes.filter(foe => foe.currentWeapon.currentState instanceof AimingState || foe.currentWeapon.currentState instanceof FiringState).length
        if(aggFoes === 0) {
            return 1;
        } else if(aggFoes === 1) {
            return 0.3;
        } else {
            return 0.1;
        }
    }
    execute(ai: AiPerception): Promise<void> {
        const enemiesAvgPosition = barycentric(ai.foes.map(foe => foe.pos))
        const awayDirection = enemiesAvgPosition.sub(ai.player.pos).normalize().scale(-1);
        let pointAway = awayDirection.scale(this._distance);
        while(ai.guard.checkDecorCollision(pointAway)) {
            pointAway = pointAway.add(awayDirection.scale(32));
            if(pointAway.distance(enemiesAvgPosition) > this._distance*1.5) {
                break;
            }
        }
        this.point = pointAway;
        return sleep(200);
    }
    interrupt(): void {
    }


}
