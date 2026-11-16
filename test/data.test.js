"use strict"

// Checks the game data definitions in data.js are consistent.

const test = require("node:test")
const assert = require("node:assert/strict")
const { loadGame } = require("./helpers/game")

const game = loadGame()
const jobs = Array.from(game.run("jobs"))
const skills = Array.from(game.run("skills"))
const items = Array.from(game.run("items"))
const unlocks = Array.from(game.run("unlocks"))
const all = [...jobs, ...skills, ...items, ...unlocks]

test("ids are unique, stable-looking and every definition has a name", () => {
    const ids = all.map(definition => definition.id)
    assert.equal(new Set(ids).size, ids.length, "duplicate id")
    for (const id of ids) assert.match(id, /^[a-z0-9_]+$/)
    const names = all.map(definition => definition.name)
    assert.equal(new Set(names).size, names.length, "duplicate name")
})

test("every job, skill and item has a category with a header colour and a tooltip", () => {
    const colors = game.run("headerRowColors")
    for (const definition of [...jobs, ...skills, ...items]) {
        assert.ok(colors[definition.category], definition.name + " category colour")
        assert.ok(definition.tooltip, definition.name + " tooltip")
    }
})

test("requirements only refer to tasks that exist", () => {
    const taskIds = new Set([...jobs, ...skills].map(definition => definition.id))
    for (const definition of all) {
        for (const spec of definition.requires) {
            if ("task" in spec) assert.ok(taskIds.has(spec.task), `${definition.name} requires unknown task ${spec.task}`)
        }
    }
})

test("unlocks reveal something that exists on the page", () => {
    const categories = new Set([...jobs, ...skills, ...items].map(definition => definition.category))
    for (const unlock of unlocks) {
        if (unlock.category) assert.ok(categories.has(unlock.category), unlock.name)
        else assert.ok(game.window.document.getElementById(unlock.elementId), unlock.name)
    }
})
