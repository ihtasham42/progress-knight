// The player's display preferences: the theme and the amulet's animations.
// They're kept in localStorage under their own key, not in the game save, so
// importing a save or hard resetting the game leaves them alone.

import { useSyncExternalStore } from "react"

export type Theme = "dark" | "light" | "system"

export interface Preferences {
    theme: Theme
    amuletEffects: boolean
}

// index.html reads this key too, to avoid a flash of the wrong theme: keep them the same
export const PREFERENCES_KEY = "pk-preferences"

const defaults: Preferences = {theme: "dark", amuletEffects: true}

// localStorage can be missing or refuse to be read (private modes, blocked
// cookies), and what's in it can be anything, so every value is checked
export function loadPreferences(): Preferences {
    const preferences = {...defaults}
    try {
        const parsed: unknown = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? "null")
        if (parsed === null || typeof parsed !== "object") return preferences
        const {theme, amuletEffects} = parsed as Record<string, unknown>
        if (theme === "dark" || theme === "light" || theme === "system") preferences.theme = theme
        if (typeof amuletEffects === "boolean") preferences.amuletEffects = amuletEffects
    } catch {
        // Unreadable: the defaults do
    }
    return preferences
}

function savePreferences(preferences: Preferences): void {
    try {
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
    } catch {
        // The choice still applies until the page is closed
    }
}

// What the hook returns; a new object only when something changed, so the
// store's snapshot stays the same between renders
export interface PreferencesView extends Preferences {
    // The device asks for less motion, so effects are off whatever was chosen
    reducedMotion: boolean
}

function mediaQuery(query: string): MediaQueryList | undefined {
    return typeof matchMedia == "function" ? matchMedia(query) : undefined
}

let preferences = loadPreferences()
let view: PreferencesView | undefined
const listeners = new Set<() => void>()
let watching = false

function getView(): PreferencesView {
    const reducedMotion = mediaQuery("(prefers-reduced-motion: reduce)")?.matches ?? false
    if (!view || view.theme != preferences.theme || view.amuletEffects != preferences.amuletEffects || view.reducedMotion != reducedMotion) {
        view = {...preferences, reducedMotion}
    }
    return view
}

// Puts the preferences on the page as classes on the body
export function applyPreferences(): void {
    const current = getView()
    const dark = current.theme == "system"
        ? mediaQuery("(prefers-color-scheme: dark)")?.matches ?? true
        : current.theme == "dark"
    document.body.classList.toggle("dark", dark)
    document.body.classList.toggle("effects-off", !current.amuletEffects || current.reducedMotion)
    watchDevice()
}

// The page follows the device's colour scheme and motion setting live
function watchDevice(): void {
    if (watching) return
    const colour = mediaQuery("(prefers-color-scheme: dark)")
    const motion = mediaQuery("(prefers-reduced-motion: reduce)")
    if (!colour || !motion) return
    watching = true
    for (const query of [colour, motion]) {
        query.addEventListener("change", () => {
            applyPreferences()
            for (const listener of listeners) listener()
        })
    }
}

export function getPreferences(): PreferencesView {
    return getView()
}

export function setPreferences(change: Partial<Preferences>): void {
    preferences = {...preferences, ...change}
    savePreferences(preferences)
    applyPreferences()
    for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => {listeners.delete(listener)}
}

export function usePreferences(): PreferencesView {
    return useSyncExternalStore(subscribe, getView)
}
