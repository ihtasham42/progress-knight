// The game's modules, and a way to reach everything they export by name.

import path from "node:path"

const ROOT = path.join(import.meta.dirname, "..", "..")

// The game's modules, in the order they depend on each other
const GAME_MODULES = ["src/game/data.ts", "src/game/state.ts", "src/game/rules.ts", "src/game/classes.ts",
    "src/game/engine.ts", "src/game/save.ts"]
const PAGE_MODULES = ["src/ui/gameStore.ts"]

// Imports the files, in order. Call vi.resetModules() first for new copies.
async function importModules(files) {
    const modules = []
    for (const file of files) modules.push(await import(path.join(ROOT, file)))
    return modules
}

// An object whose properties are everything the modules export. Exports are
// read each time, so they are always current. Functions first call before(),
// if given.
function gameApi(modules, before) {
    return new Proxy({}, {
        get(target, name) {
            if (typeof name != "string") return undefined
            const module = modules.find(module => name in module)
            if (!module) return undefined
            const value = module[name]
            if (!before || typeof value != "function" || /^class\b/.test(Function.prototype.toString.call(value))) return value
            return function(...args) {
                before()
                return value.apply(this, args)
            }
        },
    })
}

export { GAME_MODULES, PAGE_MODULES, importModules, gameApi }
