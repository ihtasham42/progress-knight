"use strict"

// Loads the game into a fresh jsdom window so tests can call its functions.
//
// The game is written as classic browser scripts that share globals, so each
// script listed in index.html is added to the page in order. Timers are
// disabled: tests drive the game by calling update() themselves.

const fs = require("node:fs")
const path = require("node:path")
const { JSDOM, VirtualConsole } = require("jsdom")

const ROOT = path.join(__dirname, "..", "..")
const SKIPPED_SCRIPTS = new Set(["js/HackTimer.js"])

function loadGame(options = {}) {
    const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8")
    const scriptSources = [...html.matchAll(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g)]
        .map(match => match[1])
        .filter(src => !SKIPPED_SCRIPTS.has(src))

    const errors = []
    const virtualConsole = new VirtualConsole()
    virtualConsole.on("jsdomError", error => {
        // jsdom doesn't implement navigation; the game reloads after import/reset
        if (!/Not implemented: navigation/.test(error.message)) errors.push(error)
    })
    virtualConsole.on("error", (...args) => errors.push(args.join(" ")))

    const dom = new JSDOM(html.replace(/<script[^>]*src="[^"]+"[^>]*><\/script>/g, ""), {
        url: "https://progress-knight.test/",
        runScripts: "dangerously",
        virtualConsole,
    })
    const window = dom.window

    window.setInterval = () => 0
    window.reloads = 0
    if (options.localStorage) {
        for (const [key, value] of Object.entries(options.localStorage)) {
            window.localStorage.setItem(key, value)
        }
    }

    // Inline <script> elements share one global scope, like the real page.
    // (Evaluating with window.eval would keep each file's let/const/class private.)
    for (const src of scriptSources) {
        const script = window.document.createElement("script")
        script.textContent = fs.readFileSync(path.join(ROOT, src), "utf8") + "\n//# sourceURL=" + src
        window.document.body.appendChild(script)
    }

    return {
        window,
        errors,
        // Evaluates an expression in the game's global scope. Needed because
        // top-level let/const (e.g. gameData) aren't properties of window.
        run: code => window.eval(code),
        get gameData() { return window.eval("gameData") },
        task: name => window.eval("gameData.taskData")[name],
        item: name => window.eval("gameData.itemData")[name],
        ticks(count) {
            for (let i = 0; i < count; i++) window.update()
        },
        // Advances time without rendering, for tests that need long runs
        fastTicks(count) {
            const updateUI = window.updateUI
            window.eval("updateUI = function() {}")
            try {
                for (let i = 0; i < count; i++) window.update()
            } finally {
                window.updateUI = updateUI
            }
        },
    }
}

module.exports = { loadGame }
