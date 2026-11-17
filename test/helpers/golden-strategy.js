// The fixed strategy the golden run plays with. Shared so the same lives can
// be played with and without a page.
//
// A game here is anything with run(code), fastTicks(count) and gameData.

const SHOP_EVERY_TICKS = 100

// Buys the most expensive property, then any misc items, that keep total
// expenses within half of income.
function shop(game) {
    game.run(`(function() {
        const budget = getIncome() / 2
        const unlocked = name => gameData.requirements[name].isCompleted()
        let best = gameData.itemData["Homeless"]
        for (const name of itemCategories["Properties"]) {
            const item = gameData.itemData[name]
            if (unlocked(name) && item.getExpense() <= budget && item.getExpense() >= best.getExpense()) best = item
        }
        gameData.currentProperty = best
        gameData.currentMisc = []
        let spent = best.getExpense()
        for (const name of itemCategories["Misc"]) {
            const item = gameData.itemData[name]
            if (unlocked(name) && spent + item.getExpense() <= budget) {
                gameData.currentMisc.push(item)
                spent += item.getExpense()
            }
        }
    })()`)
}

function playLife(game) {
    let ticks = 0
    while (game.run("isAlive()")) {
        if (ticks % SHOP_EVERY_TICKS == 0) shop(game)
        if (ticks % 20 == 0) game.run("setSkillWithLowestMaxXp()")
        game.fastTicks(1)
        ticks++
    }
    const tasks = {}
    for (const [name, task] of Object.entries(game.gameData.taskData)) {
        if (task.level || task.maxLevel) tasks[name] = [task.level, task.maxLevel]
    }
    return {
        ticks,
        age: game.run("daysToYears(gameData.days)"),
        coins: Math.round(game.gameData.coins),
        job: game.gameData.currentJob.name,
        skill: game.gameData.currentSkill.name,
        property: game.gameData.currentProperty.name,
        misc: Array.from(game.gameData.currentMisc, item => item.name),
        tasks,
    }
}

export { shop, playLife }
