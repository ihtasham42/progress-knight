import { createRoot } from "react-dom/client"
import "./fonts.css"
import { advanceGameTime, initGameData, setSkillWithLowestMaxXp, update } from "./game/engine.ts"
import { loadGameData, saveGameData } from "./game/save.ts"
import { updateSpeed } from "./game/rules.ts"
import { App } from "./ui/App.tsx"
import { startRendering } from "./ui/gameStore.ts"
import { setBackgroundInterval } from "./backgroundTimer.ts"

initGameData()
loadGameData()
update()

// The one element outside React: where it renders the page
createRoot(document.getElementById("root") as HTMLElement).render(<App />)

// Runs the game steps for the real time that has passed since the last call.
// Timers can fire late or be throttled, so the time is measured.
let lastLoopTime = performance.now()

function gameLoop() {
    const now = performance.now()
    advanceGameTime(now - lastLoopTime)
    lastLoopTime = now
}

// The game keeps running in a background tab (see backgroundTimer.ts);
// rendering only happens while the page is shown
setBackgroundInterval(gameLoop, 1000 / updateSpeed)
startRendering()
setBackgroundInterval(saveGameData, 3000)
setBackgroundInterval(setSkillWithLowestMaxXp, 1000)
