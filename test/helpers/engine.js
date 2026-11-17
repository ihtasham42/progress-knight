// Loads only the game logic (data, state, rules, classes and engine) with no
// page: no document, no window, no timers. If any of these modules touched
// the page, loading or playing would throw.

import { vi } from "vitest"
import { importModules, gameApi } from "./modules.js"

const ENGINE_MODULES = ["src/game/data.ts", "src/game/state.ts", "src/game/rules.ts", "src/game/classes.ts", "src/game/engine.ts"]

async function loadEngine() {
    // In case a test in the same file loaded a page
    for (const name of ["window", "document", "localStorage", "location"]) delete globalThis[name]

    vi.resetModules()
    const api = gameApi(await importModules(ENGINE_MODULES))

    // Start a new game the way the page does: build the state, then run
    // one game step.
    api.initGameData()
    api.update()

    return {
        api,
        get gameData() { return api.gameData },
        fastTicks(count) {
            for (let i = 0; i < count; i++) api.update()
        },
    }
}

export { loadEngine }
