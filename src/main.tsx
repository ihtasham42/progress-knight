// HackTimer first: it keeps the timers below running in background tabs
import "./vendor/hacktimer.js"
import { createRoot } from "react-dom/client"
import { advanceGameTime, initGameData, setSkillWithLowestMaxXp, update } from "./game/engine.ts"
import { loadGameData, saveGameData } from "./game/save.ts"
import { updateSpeed } from "./game/rules.ts"
import { App } from "./ui/App.tsx"
import { startRendering } from "./ui/gameStore.ts"

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

setInterval(gameLoop, 1000 / updateSpeed)
startRendering()
setInterval(saveGameData, 3000)
setInterval(setSkillWithLowestMaxXp, 1000)
