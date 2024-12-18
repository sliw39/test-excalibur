import { StrictEventEmitter } from "./events.util";

export interface StateManagerEvents {
  changed: State;
  transitioned: { name: string; from: State; to: State };
}
export class StateManager<T extends State> {
  public events = new StrictEventEmitter<StateManagerEvents>();

  private _currentState!: T;
  private _states: T[] = [];
  private _transitions: { name: string; from: T; to: T }[] = [];

  addState(state: T) {
    this._states.push(state);
    if (!this._currentState) {
      this._currentState = state;
      state.init();
    }
  }

  mapStates(name: string, from: T, to: T) {
    this._transitions.push({ name, from, to });
  }

  getTransitions(state: T) {
    return this._transitions.filter((t) => t.from === state);
  }

  getSources(state: T) {
    return this._transitions.filter((t) => t.to === state);
  }

  async run(): Promise<void> {
    while (true) {
      const requestedTransition = await this._currentState.runState(this);
      const targetState = this.getTransitions(this._currentState).find(
        (s) => s.name === requestedTransition
      );
      if (targetState) {
        const oldState = this._currentState;
        this._currentState = targetState.to;
        this._currentState.init();
        this.events.emit("transitioned", {
          name: requestedTransition,
          from: oldState,
          to: this._currentState,
        });
        this.events.emit("changed", this._currentState);
      } else {
        console.warn(
          "No transition found for",
          requestedTransition,
          this._currentState
        );
        this._currentState.init(); //rearm
      }
    }
  }

  get currentState() {
    return this._currentState;
  }
}

export interface State {
  init(): void;
  runState(stateManager: StateManager<State>): Promise<string>;
}
