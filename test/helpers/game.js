// Loads the game into a fresh jsdom page so tests can call its functions and
// use the page.
//
// Every game gets new copies of the game's modules (vi.resetModules), so no
// state is shared between games, and the page is the React app rendered into
// the page's #root. The modules use the page through globals (document,
// localStorage, location), which point at the game's own jsdom window while
// it loads and whenever one of its functions is called. Timers aren't
// started: tests drive the game by calling update() (one game step) and
// render() themselves.

import fs from "node:fs"
import path from "node:path"
import { vi } from "vitest"
import { JSDOM, VirtualConsole } from "jsdom"
import { createElement } from "react"
import { GAME_MODULES, PAGE_MODULES, importModules, gameApi } from "./modules.js"

const ROOT = path.join(import.meta.dirname, "..", "..")
const PAGE_GLOBALS = ["window", "document", "localStorage", "location"]

// console.error from the game (and from React) goes to the errors of the
// game that is running
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
    // Renders happen straight away with renderNow (flushSync), so there's no
    // need for act()
    globalThis.IS_REACT_ACT_ENVIRONMENT = false
    vi.resetModules()
    const modules = await importModules([...GAME_MODULES, ...PAGE_MODULES])
    const api = gameApi(modules, usePage)

    // Start the game the way main.tsx does, without the timers
    api.initGameData()
    api.loadGameData()
    api.update()
    const { App } = await import(path.join(ROOT, "src/ui/App.tsx"))
    const { createRoot } = await import("react-dom/client")
    const { flushSync } = await import("react-dom")
    const root = createRoot(window.document.getElementById("root"))
    flushSync(() => root.render(createElement(App)))

    const render = () => api.renderNow()
    const playerAction = action => {
        usePage()
        flushSync(action)
    }
    const byId = id => window.document.getElementById(id)
    return {
        window,
        errors,
        // The game's exported functions and data by name, e.g.
        // api.setTask("Farmer") or api.gameData.coins
        api,
        get gameData() { return api.gameData },
        task: name => api.gameData.taskData[name],
        item: name => api.gameData.itemData[name],
        // Shows the current game state on the page
        render,
        // Game steps, each followed by a render
        ticks(count) {
            for (let i = 0; i < count; i++) {
                api.update()
                render()
            }
        },
        // Game steps without rendering, for tests that need long runs
        fastTicks(count) {
            for (let i = 0; i < count; i++) api.update()
        },
        // What a player does on the page. React shows the result before
        // these return.
        click(element) {
            playerAction(() => element.click())
        },
        // Ticks or unticks a checkbox by clicking it, as a player would
        setChecked(element, checked) {
            if (element.checked !== checked) playerAction(() => element.click())
        },
        // Replaces the text in a text box, as a player typing would
        type(element, text) {
            // React watches the element's own setter, so use the native one (an input's or a text area's)
            const prototype = element instanceof window.HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype
            const setValue = Object.getOwnPropertyDescriptor(prototype, "value").set
            playerAction(() => {
                setValue.call(element, text)
                element.dispatchEvent(new window.Event("input", { bubbles: true }))
            })
        },
        byId,
    }
}

export { loadGame }
