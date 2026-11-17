// HackTimer first: it keeps the timers below running in background tabs
import "./vendor/hacktimer.js"
import { advanceGameTime, setSkillWithLowestMaxXp } from "./game/engine.ts"
import { updateSpeed } from "./game/rules.ts"
import { saveGameData } from "./game/save.ts"
import { renderFrame } from "./ui/ui.js"
import { startGame } from "./start.js"

// Runs the game steps for the real time that has passed since the last call.
// Timers can fire late or be throttled, so the time is measured.
let lastLoopTime = 0

function gameLoop() {
    const now = performance.now()
    advanceGameTime(now - lastLoopTime)
    lastLoopTime = now
}

//Init

startGame()
lastLoopTime = performance.now()
setInterval(gameLoop, 1000 / updateSpeed)
requestAnimationFrame(renderFrame)
setInterval(saveGameData, 3000)
setInterval(setSkillWithLowestMaxXp, 1000)
