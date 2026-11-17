// @vitest-environment jsdom

// The preferences store: defaults, bad stored values and a round trip.

import { test, vi, beforeEach, afterEach } from "vitest"
import assert from "node:assert/strict"

const KEY = "pk-preferences"

beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
})

afterEach(() => {
    vi.unstubAllGlobals()
})

const load = () => import("../src/ui/preferences.ts")

test("starts dark with effects on when nothing is stored", async () => {
    const { loadPreferences } = await load()
    assert.deepEqual(loadPreferences(), { theme: "dark", amuletEffects: true })
})

test("bad stored values fall back to the defaults", async () => {
    const { loadPreferences } = await load()
    for (const raw of ["{not json", "null", "5", "[]", "{\"theme\":\"blue\",\"amuletEffects\":\"yes\"}"]) {
        localStorage.setItem(KEY, raw)
        assert.deepEqual(loadPreferences(), { theme: "dark", amuletEffects: true }, raw)
    }
    // Each value is checked on its own
    localStorage.setItem(KEY, "{\"theme\":\"system\",\"amuletEffects\":3}")
    assert.deepEqual(loadPreferences(), { theme: "system", amuletEffects: true })
})

test("a choice survives a reload", async () => {
    const first = await load()
    first.setPreferences({ theme: "light", amuletEffects: false })
    vi.resetModules()
    const second = await load()
    assert.deepEqual(second.loadPreferences(), { theme: "light", amuletEffects: false })
    assert.equal(second.getPreferences().theme, "light")
    second.applyPreferences()
    assert.ok(!globalThis.document.body.classList.contains("dark"))
    assert.ok(globalThis.document.body.classList.contains("effects-off"))
})

test("works when localStorage is unavailable", async () => {
    vi.stubGlobal("localStorage", {
        getItem() { throw new Error("blocked") },
        setItem() { throw new Error("blocked") },
    })
    const { loadPreferences, setPreferences, getPreferences } = await load()
    assert.deepEqual(loadPreferences(), { theme: "dark", amuletEffects: true })
    setPreferences({ theme: "light" })
    assert.equal(getPreferences().theme, "light")
})
