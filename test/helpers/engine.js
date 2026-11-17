"use strict"

// Loads only the game logic (classes.js, data.js and engine.js) into a plain
// Node vm context: no page, no document, no window, no timers. If any of
// these files touched the page, loading or playing would throw.

const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")

const ROOT = path.join(__dirname, "..", "..")
const ENGINE_SCRIPTS = ["js/classes.js", "js/data.js", "js/engine.js"]

function loadEngine() {
    const context = vm.createContext({})
    // Scripts run in one context share top-level let/const, like classic
    // <script> files on a page.
    for (const src of ENGINE_SCRIPTS) {
        const code = fs.readFileSync(path.join(ROOT, src), "utf8")
        vm.runInContext(code, context, { filename: src })
    }
    const run = code => vm.runInContext(code, context)

    // Start a new game the way the page does: build the state, then run
    // one game step.
    run("initGameData(); update()")

    return {
        context,
        run,
        get gameData() { return run("gameData") },
        fastTicks(count) {
            for (let i = 0; i < count; i++) run("update()")
        },
    }
}

module.exports = { loadEngine }
