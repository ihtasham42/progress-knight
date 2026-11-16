"use strict"

//Init

initUI()
initGameData()
loadGameData()

update()
updateUI()
setInterval(update, 1000 / updateSpeed)
requestAnimationFrame(renderFrame)
setInterval(saveGameData, 3000)
setInterval(setSkillWithLowestMaxXp, 1000)