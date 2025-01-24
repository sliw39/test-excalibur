const MAX_SEED = 100000;
const FACTOR = 9301;
const OFFSET = 49297;

export class PseudoRandomEngine {
  private _seed: number;

  constructor(seed: number = Math.random() * MAX_SEED) {
    this._seed = seed % MAX_SEED;
  }

  next() {
    this._seed = (this._seed * FACTOR + OFFSET) % MAX_SEED;
    return this._seed / MAX_SEED;
  }

  nextInt(min: number, max: number) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number) {
    return this.next() * (max - min) + min;
  }

  nextBool() {
    return this.next() > 0.5;
  }

  pick<T>(array: T[]) {
    return array[this.nextInt(0, array.length - 1)];
  }

  weightPick<T>(array: T[], weights: number[]) {
    const total = weights.reduce((a, b) => a + b, 0);
    const random = this.nextInt(0, total);
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (random < sum) {
        return array[i];
      }
    }
    return array[array.length - 1];
  }
}

export class Die {
  private _history: number[] = [];

  constructor(
    public readonly sides: number,
    private _engine: PseudoRandomEngine
  ) {}

  static coin(engine = new PseudoRandomEngine()) {
    return new Die(2, engine);
  }
  static d4(engine = new PseudoRandomEngine()) {
    return new Die(4, engine);
  }
  static d6(engine = new PseudoRandomEngine()) {
    return new Die(6, engine);
  }
  static d8(engine = new PseudoRandomEngine()) {
    return new Die(8, engine);
  }
  static d10(engine = new PseudoRandomEngine()) {
    return new Die(10, engine);
  }
  static d12(engine = new PseudoRandomEngine()) {
    return new Die(12, engine);
  }
  static d20(engine = new PseudoRandomEngine()) {
    return new Die(20, engine);
  }
  static d100(engine = new PseudoRandomEngine()) {
    return new Die(100, engine);
  }

  roll() {
    const result = this._engine.nextInt(1, this.sides);
    this._history.push(result);
    return result;
  }

  history() {
    return [...this._history.toReversed()];
  }
}
