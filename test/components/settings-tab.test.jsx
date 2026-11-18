// @vitest-environment jsdom

// The Settings tab: import/export, the theme switch, copy and reset.

import { test, vi } from "vitest"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { act, fireEvent, screen } from "@testing-library/react"
import { renderComponent } from "../helpers/react.js"

const legacyRaw = fs.readFileSync(path.join(import.meta.dirname, "..", "fixtures", "legacy-save.json"), "utf8")

const box = () => document.getElementById("importExportBox")
const error = () => document.getElementById("importError")

// Reloading isn't something jsdom does; count reloads instead
function stubReload() {
    const reload = vi.fn()
    vi.stubGlobal("location", { reload })
    return reload
}

function importText(text) {
    fireEvent.change(box(), { target: { value: text } })
    fireEvent.click(screen.getByText("Import"))
}

test("export puts the save in the box", async () => {
    await renderComponent("SettingsTab.tsx", "SettingsTab")
    fireEvent.click(screen.getByText("Export"))
    const save = JSON.parse(Buffer.from(box().value, "base64").toString())
    assert.equal(save.version, 7)
    assert.equal(save.currentJob, "beggar")
})

test("importing a save stores it and reloads the page", async () => {
    await renderComponent("SettingsTab.tsx", "SettingsTab")
    const reload = stubReload()
    importText(Buffer.from(legacyRaw).toString("base64"))
    assert.equal(reload.mock.calls.length, 1)
    assert.equal(JSON.parse(localStorage.getItem("gameDataSave")).currentJob, "fisherman")
    assert.ok(error().classList.contains("hidden"))
})

test("bad imports show a message and leave the save alone; export hides it", async () => {
    await renderComponent("SettingsTab.tsx", "SettingsTab")
    const reload = stubReload()
    importText("not a save!!")
    assert.ok(!error().classList.contains("hidden"))
    assert.match(error().textContent, /doesn't look like a Progress Knight save/)
    importText(Buffer.from(JSON.stringify({ version: 99, coins: 1, days: 1, tasks: {} })).toString("base64"))
    assert.match(error().textContent, /newer version of the game/)
    assert.equal(reload.mock.calls.length, 0)
    assert.equal(localStorage.getItem("gameDataSave"), null)

    fireEvent.click(screen.getByText("Export"))
    assert.ok(error().classList.contains("hidden"))
})

test("pressing Enter in the box doesn't submit the page", async () => {
    await renderComponent("SettingsTab.tsx", "SettingsTab")
    const event = new Event("submit", { bubbles: true, cancelable: true })
    document.getElementById("importExportForm").dispatchEvent(event)
    assert.equal(event.defaultPrevented, true)
})

// A stand-in for matchMedia whose answers the test can change
function mockMedia(initial = {}) {
    const state = { "(prefers-color-scheme: dark)": false, "(prefers-reduced-motion: reduce)": false, ...initial }
    const listeners = []
    vi.stubGlobal("matchMedia", query => ({
        get matches() { return state[query] },
        addEventListener: (type, listener) => listeners.push({ query, listener }),
        removeEventListener() {},
    }))
    return {
        set(query, matches) {
            state[query] = matches
            act(() => listeners.filter(entry => entry.query == query).forEach(entry => entry.listener({ matches })))
        },
    }
}

const radio = name => screen.getByRole("radio", { name })

test("the theme switch sets dark, light or system mode and remembers it", async () => {
    document.body.classList.add("dark")
    const media = mockMedia()
    await renderComponent("SettingsTab.tsx", "SettingsTab")
    assert.equal(radio("Dark").getAttribute("aria-checked"), "true")
    fireEvent.click(radio("Light"))
    assert.ok(!document.body.classList.contains("dark"))
    assert.equal(radio("Light").getAttribute("aria-checked"), "true")
    assert.equal(radio("Dark").getAttribute("aria-checked"), "false")
    assert.equal(JSON.parse(localStorage.getItem("pk-preferences")).theme, "light")
    fireEvent.click(radio("Light"))
    assert.ok(!document.body.classList.contains("dark"), "choosing the same theme again keeps it")
    fireEvent.click(radio("Dark"))
    assert.ok(document.body.classList.contains("dark"))
    assert.equal(document.getElementById("lightDarkButton").textContent, "Light")

    fireEvent.click(radio("System"))
    assert.equal(radio("System").getAttribute("aria-checked"), "true")
    assert.ok(!document.body.classList.contains("dark"), "the device is light")
    media.set("(prefers-color-scheme: dark)", true)
    assert.ok(document.body.classList.contains("dark"), "follows the device live")
    media.set("(prefers-color-scheme: dark)", false)
    assert.ok(!document.body.classList.contains("dark"))
    // A fixed choice ignores the device
    fireEvent.click(radio("Dark"))
    media.set("(prefers-color-scheme: dark)", false)
    assert.ok(document.body.classList.contains("dark"))
})

test("arrow keys move between themes", async () => {
    document.body.classList.add("dark")
    mockMedia()
    await renderComponent("SettingsTab.tsx", "SettingsTab")
    fireEvent.keyDown(radio("Dark"), { key: "ArrowRight" })
    assert.equal(radio("Light").getAttribute("aria-checked"), "true")
    fireEvent.keyDown(radio("Light"), { key: "ArrowLeft" })
    assert.equal(radio("Dark").getAttribute("aria-checked"), "true")
})

test("the amulet effects toggle sets a class on the page and remembers it", async () => {
    mockMedia()
    await renderComponent("SettingsTab.tsx", "SettingsTab")
    const toggle = screen.getByLabelText(/Amulet effects/)
    assert.equal(toggle.checked, true)
    assert.ok(screen.getByText("Off when your device asks for reduced motion"))
    fireEvent.click(toggle)
    assert.ok(document.body.classList.contains("effects-off"))
    assert.equal(JSON.parse(localStorage.getItem("pk-preferences")).amuletEffects, false)
    fireEvent.click(toggle)
    assert.ok(!document.body.classList.contains("effects-off"))
})

test("with reduced motion the toggle is off and disabled, and effects stay off", async () => {
    document.body.classList.remove("effects-off")
    const media = mockMedia({ "(prefers-reduced-motion: reduce)": true })
    await renderComponent("SettingsTab.tsx", "SettingsTab")
    const toggle = screen.getByLabelText(/Amulet effects/)
    assert.equal(toggle.checked, false)
    assert.equal(toggle.disabled, true)
    assert.ok(screen.getByText(/because your device asks for reduced motion/))
    fireEvent.click(radio("Light"))
    assert.ok(document.body.classList.contains("effects-off"))
    media.set("(prefers-reduced-motion: reduce)", false)
    assert.equal(toggle.disabled, false)
    assert.equal(toggle.checked, true)
    assert.ok(!document.body.classList.contains("effects-off"))
})

test("the save card says when the game was last saved", async () => {
    vi.useFakeTimers()
    try {
        vi.setSystemTime(new Date("2026-01-01T00:00:00Z"))
        const view = await renderComponent("SettingsTab.tsx", "SettingsTab")
        const save = await import("../../src/game/save.ts")
        assert.ok(screen.getByText("Saved automatically every 3 seconds"), "nothing saved yet")
        save.saveGameData()
        view.rerender()
        assert.ok(screen.getByText("Saved automatically every 3 seconds · last saved just now"))
        vi.setSystemTime(new Date("2026-01-01T00:00:07Z"))
        view.rerender()
        assert.ok(screen.getByText(/last saved 7 seconds ago$/))
        vi.setSystemTime(new Date("2026-01-01T00:01:10Z"))
        view.rerender()
        assert.ok(screen.getByText(/last saved 1 minute ago$/))
    } finally {
        vi.useRealTimers()
    }
})

test("a hard reset keeps the appearance settings", async () => {
    await renderComponent("SettingsTab.tsx", "SettingsTab")
    stubReload()
    fireEvent.click(radio("Light"))
    localStorage.setItem("gameDataSave", "{}")
    fireEvent.click(screen.getByText("Reset everything…"))
    fireEvent.click(screen.getByText("Yes, reset"))
    assert.equal(localStorage.getItem("gameDataSave"), null)
    assert.equal(JSON.parse(localStorage.getItem("pk-preferences")).theme, "light")
})

test("copy puts the save on the clipboard, and is off while the box is empty", async () => {
    await renderComponent("SettingsTab.tsx", "SettingsTab")
    const writeText = vi.fn(async () => {})
    vi.stubGlobal("navigator", { clipboard: { writeText } })
    const copy = document.getElementById("copyButton")
    assert.equal(copy.disabled, true)
    fireEvent.click(screen.getByText("Export"))
    assert.equal(copy.disabled, false)
    fireEvent.click(copy)
    assert.deepEqual(writeText.mock.calls, [[box().value]])
    await screen.findByText("Copied")
})

test("copy doesn't break without a clipboard", async () => {
    await renderComponent("SettingsTab.tsx", "SettingsTab")
    vi.stubGlobal("navigator", {})
    fireEvent.click(screen.getByText("Export"))
    fireEvent.click(document.getElementById("copyButton"))
    await screen.findByText("Not copied")
})

test("reset asks first, and cancel keeps the save", async () => {
    await renderComponent("SettingsTab.tsx", "SettingsTab")
    localStorage.setItem("gameDataSave", "{}")
    const reload = stubReload()
    assert.equal(document.getElementById("resetButton"), null)
    fireEvent.click(screen.getByText("Reset everything…"))
    assert.ok(screen.getByText("Are you sure?"))
    fireEvent.click(screen.getByText("Cancel"))
    assert.equal(document.getElementById("resetButton"), null)
    assert.equal(localStorage.getItem("gameDataSave"), "{}")
    assert.equal(reload.mock.calls.length, 0)
})

test("confirmed reset deletes the save and reloads", async () => {
    await renderComponent("SettingsTab.tsx", "SettingsTab")
    localStorage.setItem("gameDataSave", "{}")
    const reload = stubReload()
    fireEvent.click(screen.getByText("Reset everything…"))
    fireEvent.click(screen.getByText("Yes, reset"))
    assert.equal(localStorage.getItem("gameDataSave"), null)
    assert.equal(reload.mock.calls.length, 1)
})
