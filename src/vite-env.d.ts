/// <reference types="vite/client" />

import { Game } from "./main";

declare global {
  interface Window {
    game: Game;
  }

  interface ImportMetaEnv {
    readonly VITE_DEBUG_PERSON: string;
    readonly VITE_TEST_AREA_ENEMY_COUNT: string;
    readonly VITE_DEBUG_LOCATION: string;
    readonly VITE_DEBUG_GOTO_PIPE: string;
  }
}
