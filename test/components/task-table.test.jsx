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

test("each category has a header row in its colour", async () => {
    await renderComponent("TaskTable.tsx", "TaskTable", { kind: "jobs" })
    const commonWork = header("Common work")
    assert.equal(commonWork.style.backgroundColor, "var(--pk-cat-common-work)")
    assert.equal(commonWork.style.color, "var(--pk-on-category)")
    assert.deepEqual([...commonWork.children].map(th => th.textContent).slice(0, 5), ["Common work", "Level", "Income/day", "Xp/day", "Xp left"])
})

test("the skills table shows effects instead of income", async () => {
    await renderComponent("TaskTable.tsx", "TaskTable", { kind: "skills" })
    assert.equal(header("Fundamentals").querySelector(".valueType").textContent, "Effect")
    assert.equal(text(cell("Concentration", "effect")), "x1.00 Skill xp")
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

test("a locked category's header and required rows are hidden", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "skills" })
    assert.ok(header("Dark magic").classList.contains("hidden"))
    assert.ok(requiredRow("Dark magic").classList.contains("hidden"))
    game.engine.rebirthTwo()
    game.ticks(1)
    assert.ok(!header("Dark magic").classList.contains("hidden"))
})

test("the progress bar shows xp towards the next level and highlights the current task", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "jobs" })
    const fill = cell("Beggar", "progressFill")
    assert.equal(fill.style.width, 2 / 50 * 100 + "%")
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
    assert.equal(cell("Strength", "skipSkill").style.display, "block")
    assert.equal(header("Combat").querySelector(".skipSkill").style.display, "block")

    fireEvent.click(cell("Strength", "checkbox"))
    assert.deepEqual([...game.gameData.automation.skippedSkills], ["strength"])
    assert.equal(cell("Strength", "checkbox").checked, true)
    fireEvent.click(cell("Strength", "checkbox"))
    assert.equal(game.gameData.automation.skippedSkills.size, 0)
})

test("the required row says what the next job needs", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "jobs" })
    assert.equal(text(requiredRow("Common work")), "Required: Beggar level 0/10")
    game.task("Beggar").level = 10
    game.task("Farmer").level = 10
    game.task("Fisherman").level = 10
    game.ticks(1)
    assert.equal(text(requiredRow("Common work").querySelector(".levels")), "Strength level 0/10")
})

test("the required row shows evil for dark magic", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "skills" })
    game.engine.rebirthTwo()
    game.ticks(1)
    const required = requiredRow("Dark magic")
    assert.ok(required.querySelector(".levels").classList.contains("hiddenTask"))
    assert.equal(text(required.querySelector(".evil")), "25 evil")
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
