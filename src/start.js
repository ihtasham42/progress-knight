// Builds the page and the game, loads the save and shows the first frame.
// main.js calls this and then starts the timers; tests call it without them.

import { initGameData, update } from "./game/engine.js"
import { loadGameData } from "./game/save.js"
import { initUI, updateUI } from "./ui/ui.js"

export function startGame() {
    initUI()
    initGameData()
    loadGameData()

    update()
    updateUI()
}
