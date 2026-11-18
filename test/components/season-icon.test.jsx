// @vitest-environment jsdom

// The season icons: a sun and a snowflake in the season's colour, hidden
// from screen readers because the season's name is written next to them.

import { test } from "vitest"
import assert from "node:assert/strict"
import { renderComponent } from "../helpers/react.js"

for (const season of ["summer", "winter"]) {
    test(season + " has its own icon in its colour", async () => {
        const { container } = await renderComponent("SeasonIcon.tsx", "SeasonIcon", { season, size: 14 })
        const icon = container.querySelector("svg")
        assert.equal(icon.getAttribute("aria-hidden"), "true")
        assert.equal(icon.getAttribute("data-season"), season)
        assert.equal(icon.getAttribute("width"), "14")
        assert.equal(icon.style.color, "var(--pk-season-" + season + ")")
    })
}

test("the two icons differ, and the size defaults to 16", async () => {
    const summer = (await renderComponent("SeasonIcon.tsx", "SeasonIcon", { season: "summer" })).container.innerHTML
    const winter = (await renderComponent("SeasonIcon.tsx", "SeasonIcon", { season: "winter" })).container.innerHTML
    assert.notEqual(summer.replace(/summer/g, ""), winter.replace(/winter/g, ""))
    assert.match(summer, /width="16"/)
})
