import { StrictEventEmitter } from "../../utils/events.util";
import { Inventory } from "./inventory.model";

export interface Stats {
    maxHealth: number
    strength: number
    agility: number
    accuracy: number
    resistance: number
    luck: number
}
function composeModifiers(modifiers: number[]) {
    return modifiers.reduce((prev, curr) => prev * curr, 1);
}

export interface PlayerEvents {
    healthChanged: { before: number, after: number, delta: number }
    maxHealthChanged: { before: number, after: number, delta: number }
    strengthChanged: { before: number, after: number, delta: number }
    agilityChanged: { before: number, after: number, delta: number }
    accuracyChanged: { before: number, after: number, delta: number }
    resistanceChanged: { before: number, after: number, delta: number }
    luckChanged: { before: number, after: number, delta: number }
    hit: { damage: number }
    heal: { amount: number }
    dead: void
}
export class Player implements Stats {

    public readonly events = new StrictEventEmitter<PlayerEvents>()
    public readonly inventory = new Inventory()

    constructor(private _name: string, private _skills: Stats, private _modifiers: Partial<Stats>[], private _currentLife: number) {

    }

    get maxHealth() {
        return Math.round(this._skills.maxHealth * composeModifiers(this._modifiers.map(mod => mod.maxHealth ?? 1)));
    }

    get strength() {
        return Math.round(this._skills.strength * composeModifiers(this._modifiers.map(mod => mod.strength ?? 1)));
    }

    get agility() {
        return Math.round(this._skills.agility * composeModifiers(this._modifiers.map(mod => mod.agility ?? 1)));
    }

    get accuracy() {
        return Math.round(this._skills.accuracy * composeModifiers(this._modifiers.map(mod => mod.accuracy ?? 1)));
    }

    get resistance() {
        return Math.round(this._skills.resistance * composeModifiers(this._modifiers.map(mod => mod.resistance ?? 1)));
    }

    get luck() {
        return Math.round(this._skills.luck * composeModifiers(this._modifiers.map(mod => mod.luck ?? 1)));
    }

    get name() {
        return this._name;
    }

    get currentLife() {
        return this._currentLife;
    }

    get dead() {
        return this._currentLife <= 0;
    }

    get alive() {
        return this._currentLife > 0;
    }

    hit(damage: number) {
        if(damage) {
            const before = this._currentLife;
            this._currentLife = Math.max(0, this._currentLife - damage);
            this.events.emit("healthChanged", { before, after: this._currentLife, delta: before - this._currentLife });
        }
        this.events.emit("hit", { damage });
        if(this._currentLife <= 0) {
            this.kill();
        }
    }

    heal(amount: number) {
        if(amount && this.alive) {
            const before = this._currentLife;
            this._currentLife = Math.min(this.maxHealth, this._currentLife + amount);
            this.events.emit("healthChanged", { before, after: this._currentLife, delta: this._currentLife - before });
        }
        this.events.emit("heal", { amount });
    }

    kill() {
        this._currentLife = 0;
        this.events.emit("dead", void 0);
    }

    getStatsSnapshot() {
        return {
            maxHealth: this.maxHealth,
            strength: this.strength,
            agility: this.agility,
            accuracy: this.accuracy,
            resistance: this.resistance,
            luck: this.luck
        } as const
    }

    get skills() {
        return Object.assign({}, this._skills);
    }

    addModifier(mod: Partial<Stats>) {
        const before = this.getStatsSnapshot();
        this._modifiers.push(mod);
        const after = this.getStatsSnapshot();

        const keys: (keyof Stats)[] = Object.keys(before) as any;
        for (const key of keys) {
            if (before[key] !== after[key]) {
                this.events.emit(`${key}Changed`, { before: before[key], after: after[key], delta: after[key] - before[key] });
            }
        }
    }

}