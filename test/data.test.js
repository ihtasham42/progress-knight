// Checks the game data definitions in data.ts are consistent.

import { test } from "vitest"
import assert from "node:assert/strict"
import { loadGame } from "./helpers/game.js"

const game = await loadGame()
const jobs = Array.from(game.api.jobs)
const skills = Array.from(game.api.skills)
const items = Array.from(game.api.items)
const unlocks = Array.from(game.api.unlocks)
const all = [...jobs, ...skills, ...items, ...unlocks]

test("ids are unique, stable-looking and every definition has a name", async () => {
    const ids = all.map(definition => definition.id)
    assert.equal(new Set(ids).size, ids.length, "duplicate id")
    for (const id of ids) assert.match(id, /^[a-z0-9_]+$/)
    const names = all.map(definition => definition.name)
    assert.equal(new Set(names).size, names.length, "duplicate name")
})

test("every job, skill and item has a category with a header colour and a tooltip", async () => {
    const colors = game.api.headerRowColors
    for (const definition of [...jobs, ...skills, ...items]) {
        assert.ok(colors[definition.category], definition.name + " category colour")
        assert.ok(definition.tooltip, definition.name + " tooltip")
    }
})

test("requirements only refer to tasks that exist", async () => {
    const taskIds = new Set([...jobs, ...skills].map(definition => definition.id))
    for (const definition of all) {
        for (const spec of definition.requires) {
            if ("task" in spec) assert.ok(taskIds.has(spec.task), `${definition.name} requires unknown task ${spec.task}`)
        }
    }
})

test("category unlocks reveal a category that exists", async () => {
    const categories = new Set([...jobs, ...skills, ...items].map(definition => definition.category))
    for (const unlock of unlocks.filter(unlock => unlock.category)) {
        assert.ok(categories.has(unlock.category), unlock.name)
    }
})

test("reveals unlocks only reveal categories that exist", async () => {
    const categories = new Set([...jobs, ...skills, ...items].map(definition => definition.category))
    for (const unlock of unlocks.filter(unlock => unlock.reveals)) {
        assert.ok(unlock.reveals.length > 0, unlock.name)
        for (const category of unlock.reveals) assert.ok(categories.has(category), unlock.name + " reveals " + category)
    }
})

test("boosts use known stats and only target things that exist", async () => {
    const stats = new Set(["xp", "income", "expense", "happiness", "lifespan", "gameSpeed", "evilGain"])
    const targets = new Set(["all", "jobs", "skills", "items",
        ...[...jobs, ...skills, ...items].map(definition => definition.category),
        ...[...jobs, ...skills].map(definition => definition.id)])
    for (const definition of [...skills, ...items]) {
        for (const boost of definition.boosts || []) {
            assert.ok(stats.has(boost.stat), `${definition.name} boosts unknown stat ${boost.stat}`)
            const needsTarget = ["xp", "income", "expense"].includes(boost.stat)
            assert.equal("of" in boost, needsTarget, `${definition.name} ${boost.stat} target`)
            if (needsTarget) assert.ok(targets.has(boost.of), `${definition.name} boosts unknown target ${boost.of}`)
        }
    }
})

test("effect curves are complete", async () => {
    for (const skill of skills.filter(definition => definition.effectCurve)) {
        const curve = skill.effectCurve
        assert.ok(["log", "logReduction"].includes(curve.type), skill.name)
        assert.ok(curve.base > 1, skill.name + " base")
        if (curve.type == "logReduction") assert.ok(curve.divisor > 0 && curve.minimum > 0, skill.name)
    }
})

test("a new life starts with a job, a skill and a property that exist", async () => {
    const starting = game.api.startingItems
    assert.ok(jobs.some(definition => definition.id == starting.job))
    assert.ok(skills.some(definition => definition.id == starting.skill))
    assert.ok(items.some(definition => definition.id == starting.property && definition.category == "Properties"))
})
