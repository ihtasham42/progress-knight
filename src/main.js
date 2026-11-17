"use strict"

// Runs the game steps for the real time that has passed since the last call.
// Timers can fire late or be throttled, so the time is measured.
let lastLoopTime = 0

function gameLoop() {
    const now = performance.now()
    advanceGameTime(now - lastLoopTime)
    lastLoopTime = now
}

//Init

initUI()
initGameData()
loadGameData()

update()
updateUI()
lastLoopTime = performance.now()
setInterval(gameLoop, 1000 / updateSpeed)
requestAnimationFrame(renderFrame)
setInterval(saveGameData, 3000)
setInterval(setSkillWithLowestMaxXp, 1000)