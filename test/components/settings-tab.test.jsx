// @vitest-environment jsdom

// The Settings tab: import/export, light/dark mode and reset.

import { test, vi } from "vitest"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fireEvent, screen } from "@testing-library/react"
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
    assert.equal(save.version, 4)
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

test("the toggle switches between dark and light mode", async () => {
    await renderComponent("SettingsTab.tsx", "SettingsTab")
    document.body.classList.add("dark")
    fireEvent.click(screen.getByText("Toggle"))
    assert.ok(!document.body.classList.contains("dark"))
    fireEvent.click(screen.getByText("Toggle"))
    assert.ok(document.body.classList.contains("dark"))
})

test("reset deletes the save and reloads", async () => {
    await renderComponent("SettingsTab.tsx", "SettingsTab")
    localStorage.setItem("gameDataSave", "{}")
    const reload = stubReload()
    fireEvent.click(screen.getByText("Reset"))
    assert.equal(localStorage.getItem("gameDataSave"), null)
    assert.equal(reload.mock.calls.length, 1)
})
