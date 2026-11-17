// Loads the game into a fresh jsdom page so tests can call its functions.
//
// Every game gets new copies of the game's modules (vi.resetModules), so no
// state is shared between games. The modules use the page through globals
// (document, localStorage, location), which point at the game's own jsdom
// window while it loads and whenever one of its functions is called. Timers
// aren't started: tests drive the game by calling update() (one game step)
// and updateUI() (one render) themselves.

import fs from "node:fs"
import path from "node:path"
import { vi } from "vitest"
import { JSDOM, VirtualConsole } from "jsdom"
import { GAME_MODULES, PAGE_MODULES, importModules, gameApi } from "./modules.js"

const ROOT = path.join(import.meta.dirname, "..", "..")
const PAGE_GLOBALS = ["window", "document", "localStorage", "location"]

// console.error from the game goes to the errors of the game that is running
let activeErrors = null
const consoleError = console.error
console.error = (...args) => activeErrors ? activeErrors.push(args.join(" ")) : consoleError(...args)

async function loadGame(options = {}) {
    const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8")

    const errors = []
    const virtualConsole = new VirtualConsole()
    virtualConsole.on("jsdomError", error => {
        // jsdom doesn't implement navigation; the game reloads after import/reset
        if (!/Not implemented: navigation/.test(error.message)) errors.push(error)
    })
    virtualConsole.on("error", (...args) => errors.push(args.join(" ")))

    // jsdom doesn't run the page's scripts; the modules are imported below
    const dom = new JSDOM(html, { url: "https://progress-knight.test/", virtualConsole })
    const window = dom.window

    fireChangeWhenCheckboxesAreSet(window)
    if (options.localStorage) {
        for (const [key, value] of Object.entries(options.localStorage)) {
            window.localStorage.setItem(key, value)
        }
    }

    const usePage = () => {
        for (const name of PAGE_GLOBALS) globalThis[name] = window[name]
        activeErrors = errors
    }

    usePage()
    vi.resetModules()
    const modules = await importModules([...GAME_MODULES, ...PAGE_MODULES])
    const { startGame } = await import(path.join(ROOT, "src/start.js"))
    startGame()

    const api = gameApi(modules, usePage)
    return {
        window,
        errors,
        // The game's exported functions and data by name, e.g.
        // api.setTask("Farmer") or api.gameData.coins
        api,
        get gameData() { return api.gameData },
        task: name => api.gameData.taskData[name],
        item: name => api.gameData.itemData[name],
        // Game steps, each followed by a render
        ticks(count) {
            for (let i = 0; i < count; i++) {
                api.update()
                api.updateUI()
            }
        },
        // Game steps without rendering, for tests that need long runs
        fastTicks(count) {
            for (let i = 0; i < count; i++) api.update()
        },
    }
}

// Tests tick checkboxes by setting `checked`. A player clicking a checkbox
// also fires a "change" event, which the game listens for, so do the same.
function fireChangeWhenCheckboxesAreSet(window) {
    const checked = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "checked")
    Object.defineProperty(window.HTMLInputElement.prototype, "checked", {
        configurable: true,
        enumerable: checked.enumerable,
        get() { return checked.get.call(this) },
        set(value) {
            const changed = checked.get.call(this) !== Boolean(value)
            checked.set.call(this, value)
            if (changed && this.type == "checkbox") {
                this.dispatchEvent(new window.Event("change", { bubbles: true }))
            }
        },
    })
}

export { loadGame }
