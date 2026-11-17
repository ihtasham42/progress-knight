// @vitest-environment jsdom

// The Jobs and Skills tables.

import { test } from "vitest"
import assert from "node:assert/strict"
import { fireEvent } from "@testing-library/react"
import { renderComponent } from "../helpers/react.js"

const row = name => document.getElementById("row " + name)
const cell = (name, className) => row(name).querySelector("." + className)
const text = element => element.textContent.replace(/\s+/g, " ").trim()
const header = category => document.querySelector(".headerRow." + category.replace(/ /g, ""))
const requiredRow = category => document.getElementById(category)

test("each category has a flat header row that carries its colour", async () => {
    await renderComponent("TaskTable.tsx", "TaskTable", { kind: "jobs" })
    const commonWork = header("Common work")
    assert.equal(commonWork.style.getPropertyValue("--cat"), "var(--pk-cat-common-work)")
    assert.equal(commonWork.style.backgroundColor, "")
    assert.deepEqual([...commonWork.children].map(th => th.textContent).slice(0, 6), ["Common work", "Level", "Income / day", "XP / day", "XP left", "Max lvl"])
    assert.equal(row("Beggar").style.getPropertyValue("--cat"), "var(--pk-cat-common-work)")
})

test("the skills table shows effects instead of income", async () => {
    await renderComponent("TaskTable.tsx", "TaskTable", { kind: "skills" })
    assert.equal(header("Fundamentals").querySelector(".valueType").textContent, "Effect")
    assert.equal(text(cell("Concentration", "effect")), "×1.00 skill xp")
    assert.equal(text(cell("Concentration", "effect").querySelector("strong")), "×1.00")
    assert.equal(text(cell("Concentration", "income")), "")
})

test("job rows show level, income, xp per day and xp left", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "jobs" })
    game.task("Beggar").level = 9
    game.rerender()
    assert.equal(text(cell("Beggar", "level")), "9")
    assert.equal(text(cell("Beggar", "income")), "10c")
    assert.equal(text(cell("Beggar", "xpGain")), "10")
    assert.equal(text(cell("Beggar", "xpLeft")), String(game.task("Beggar").getXpLeft()))
    assert.equal(cell("Beggar", "tooltipText").textContent, game.task("Beggar").baseData.tooltip)
})

test("rows are hidden until unlocked", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "jobs" })
    assert.ok(!row("Beggar").classList.contains("hidden"))
    assert.ok(row("Farmer").classList.contains("hidden"))
    game.task("Beggar").level = 10
    game.ticks(1)
    assert.ok(!row("Farmer").classList.contains("hidden"))
})

test("magic and the Arcane Association stay out of sight until Concentration 100 and Meditation 100", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "jobs" })
    assert.ok(header("The Arcane Association").classList.contains("hidden"))
    assert.equal(requiredRow("The Arcane Association"), null)
    game.task("Concentration").level = 100
    game.task("Meditation").level = 99
    game.ticks(1)
    assert.ok(header("The Arcane Association").classList.contains("hidden"))
    game.task("Meditation").level = 100
    game.ticks(1)
    assert.ok(!header("The Arcane Association").classList.contains("hidden"))
    assert.ok(row("Student").classList.contains("hidden"))
})

test("the magic skills appear with the Arcane Association, showing what mana control needs", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "skills" })
    assert.ok(header("Magic").classList.contains("hidden"))
    assert.equal(requiredRow("Magic"), null)
    game.task("Concentration").level = 100
    game.task("Meditation").level = 100
    game.ticks(1)
    assert.ok(!header("Magic").classList.contains("hidden"))
    assert.equal(text(requiredRow("Magic")), "Next: Mana control Concentration 100 / 200 Meditation 100 / 200")
})

test("once glimpsed, magic and the Arcane Association stay in sight through rebirths", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "jobs" })
    game.task("Concentration").level = 100
    game.task("Meditation").level = 100
    game.ticks(1)
    game.engine.rebirthOne()
    game.engine.rebirthTwo()
    game.ticks(1)
    assert.ok(!header("The Arcane Association").classList.contains("hidden"))
    assert.equal(text(requiredRow("The Arcane Association")), "Unlocks with Concentration 0 / 200 Meditation 0 / 200")
})

test("dark magic stays out of sight until the amulet offers evil, then shows what unlocks it", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "skills" })
    assert.ok(header("Dark magic").classList.contains("hidden"))
    assert.equal(requiredRow("Dark magic"), null)
    assert.ok(row("Dark influence").classList.contains("hidden"))
    game.task("Immortality").level = 33 ** 3 - 1 // lifespan x4, so 200 can be reached
    game.gameData.days = 365 * 200
    game.ticks(1)
    assert.ok(!header("Dark magic").classList.contains("hidden"))
    assert.ok(requiredRow("Dark magic").classList.contains("locked"))
    assert.equal(text(requiredRow("Dark magic")), "Embrace evil at the Amulet to unlock Evil 0 / 1")
    assert.ok(row("Dark influence").classList.contains("hidden"))
    game.engine.rebirthTwo()
    game.ticks(1)
    assert.ok(!requiredRow("Dark magic").classList.contains("locked"))
    assert.ok(!row("Dark influence").classList.contains("hidden"))
})

test("a locked job category lists the levels that unlock it", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "jobs" })
    game.task("Concentration").level = 100
    game.task("Meditation").level = 100
    game.ticks(1)
    const arcane = requiredRow("The Arcane Association")
    assert.ok(arcane.classList.contains("locked"))
    assert.equal(text(arcane), "Unlocks with Concentration 100 / 200 Meditation 100 / 200")
    game.task("Concentration").level = 200
    game.ticks(1)
    assert.equal(text(requiredRow("The Arcane Association")), "Unlocks with Concentration 200 / 200 Meditation 100 / 200")
    assert.ok(requiredRow("The Arcane Association").querySelector(".need-chip").classList.contains("met"))
})

test("the progress bar shows xp towards the next level and highlights the current task", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "jobs" })
    const fill = cell("Beggar", "progressFill")
    assert.equal(fill.style.getPropertyValue("--fill"), String(2 / 50))
    assert.ok(fill.classList.contains("current"))
    game.task("Farmer").level = 0
    game.engine.setTask("Farmer")
    game.rerender()
    assert.ok(!fill.classList.contains("current"))
    assert.ok(cell("Farmer", "progressFill").classList.contains("current"))
})

test("clicking a job or skill works on it", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "skills" })
    fireEvent.click(cell("Strength", "progressBar"))
    assert.equal(game.gameData.currentSkill.name, "Strength")
    assert.ok(cell("Strength", "progressFill").classList.contains("current"))
})

test("max levels are shown after the first rebirth", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "jobs" })
    assert.ok(cell("Beggar", "maxLevel").classList.contains("hidden"))
    assert.ok(header("Common work").querySelector(".maxLevel").classList.contains("hidden"))
    game.task("Beggar").level = 20
    game.engine.rebirthOne()
    game.rerender()
    assert.ok(!cell("Beggar", "maxLevel").classList.contains("hidden"))
    assert.equal(text(cell("Beggar", "maxLevel")), "20")
})

test("skip checkboxes appear with auto-learn and change which skills are skipped", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "skills" })
    assert.equal(cell("Strength", "skipSkill").style.display, "none")
    game.engine.setAutoLearn(true)
    game.rerender()
    assert.equal(cell("Strength", "skipSkill").style.display, "table-cell")
    assert.equal(header("Combat").querySelector(".skipSkill").style.display, "table-cell")

    fireEvent.click(cell("Strength", "checkbox"))
    assert.deepEqual([...game.gameData.automation.skippedSkills], ["strength"])
    assert.equal(cell("Strength", "checkbox").checked, true)
    fireEvent.click(cell("Strength", "checkbox"))
    assert.equal(game.gameData.automation.skippedSkills.size, 0)
})

test("the next row says what the next job needs", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "jobs" })
    assert.equal(text(requiredRow("Common work")), "Next: Farmer Beggar 0 / 10")
    game.task("Beggar").level = 10
    game.task("Farmer").level = 10
    game.task("Fisherman").level = 10
    game.ticks(1)
    assert.equal(text(requiredRow("Common work")), "Next: Miner Strength 0 / 10 Fisherman 10 / 10")
})

test("dark magic keeps its next skill a surprise", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "skills" })
    game.engine.rebirthTwo()
    game.ticks(1)
    assert.ok(requiredRow("Dark magic").classList.contains("hiddenTask"))
    assert.ok(row("Demon training").classList.contains("hidden"))
    game.gameData.evil = 25
    game.ticks(1)
    assert.ok(!row("Demon training").classList.contains("hidden"))
    assert.ok(requiredRow("Dark magic").classList.contains("hiddenTask"))
})

test("the locked dark magic row shows evil", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "skills" })
    game.task("Immortality").level = 33 ** 3 - 1 // lifespan x4, so 200 can be reached
    game.gameData.days = 365 * 200
    game.ticks(1)
    assert.ok(requiredRow("Dark magic").querySelector(".need-chip").classList.contains("need-evil"))
})

test("the Military stays out of sight until Strength has been trained", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "jobs" })
    assert.ok(header("Military").classList.contains("hidden"))
    assert.equal(requiredRow("Military"), null)
    game.task("Strength").level = 1
    game.ticks(1)
    assert.ok(!header("Military").classList.contains("hidden"))
    assert.equal(text(requiredRow("Military")), "Next: Squire Strength 1 / 5")
})

test("the current task gets an Active badge", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "jobs" })
    assert.equal(text(cell("Beggar", "active-badge")), "Active")
    game.task("Farmer").level = 0
    game.engine.setTask("Farmer")
    game.rerender()
    assert.equal(cell("Beggar", "active-badge"), null)
    assert.equal(text(cell("Farmer", "active-badge")), "Active")
})

test("the required row is hidden when everything in the category is unlocked", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "skills" })
    for (const name of ["Concentration", "Productivity", "Bargaining", "Meditation"]) game.task(name).level = 100
    game.ticks(1)
    assert.ok(requiredRow("Fundamentals").classList.contains("hiddenTask"))
})

test("phones get the level inside the bar and a labelled skip checkbox", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "skills" })
    game.task("Strength").level = 7
    game.rerender()
    assert.equal(text(cell("Strength", "phone-level")), "lvl 7")
    assert.equal(cell("Strength", "progressBar").contains(cell("Strength", "phone-level")), true)
    assert.equal(cell("Strength", "checkbox").getAttribute("aria-label"), "Skip Strength")
})
