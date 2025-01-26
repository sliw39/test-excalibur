import { Dummy } from "@scenes/location/components/person-dummy.component";
import { Person } from "@scenes/location/components/person.component";
import { Guard } from "@utils/vectors.util";

export interface Pipe<T extends AIContext = AIContext> {
  name: string;
  probability: (ai: T) => number;
  execute: (ai: T) => Promise<void>;
  interrupt: () => void;
}

export interface AIContext {
  player: Dummy;
  guard: Guard;
  foes: Person[];
}

export interface AI extends AIContext {
  pipes: Pipe[];
  wake: () => void;
  sleep: () => void;
  currentPipe: Pipe | null;
}
