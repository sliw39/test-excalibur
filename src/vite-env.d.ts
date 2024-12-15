/// <reference types="vite/client" />

import { Game } from "./main";

declare global {
    interface Window {
        game: Game
    }
}