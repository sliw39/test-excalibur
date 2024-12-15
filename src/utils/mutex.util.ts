export class MutexElement<T> {
  constructor(private _mutex: MutexChannel<T>, private _action: T) {}
  release() {
    this._mutex.release(this._action);
  }
}

export class MutexChannel<T> {
  private _current: T | null = null;
  constructor(private _avalableActions: T[]) {}

  get avalableActions() {
    return [...this._avalableActions];
  }

  get current() {
    return this._current;
  }

  get available() {
    return this._current === null;
  }

  request(action: T) {
    if (this._avalableActions.includes(action) && !this._current) {
      this._current = action;
      return new MutexElement(this, action);
    }
    return null;
  }

  release(action: T) {
    if (this._current === action) {
      this._current = null;
    }
  }
}
