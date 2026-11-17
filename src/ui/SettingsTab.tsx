// The Settings tab: importing and exporting saves, the theme and amulet
// effects, the Discord link and a hard reset.

import { memo, useEffect, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import { clearSave, exportSave, secondsSinceSave, importSave } from "../game/save.ts"
import { classNames } from "./classNames.ts"
import { describeAge } from "./format.ts"
import { useGame } from "./gameStore.ts"
import { setPreferences, usePreferences } from "./preferences.ts"
import type { Theme } from "./preferences.ts"

const themes: {value: Theme, label: string, id?: string}[] = [
    {value: "dark", label: "Dark"},
    {value: "light", label: "Light", id: "lightDarkButton"},
    {value: "system", label: "System"},
]

// Renders with every frame (through useGame) so the age keeps counting; it's
// a few words, so that costs nothing
function SaveStatus() {
    useGame()
    const age = secondsSinceSave()
    const note = "Saved automatically every 3 seconds"
    return (
        <span className="settings-note">
            {age === null ? note : note + " · last saved " + describeAge(age)}
        </span>
    )
}

function ThemeSwitch() {
    const {theme} = usePreferences()
    // Arrow keys move between the options, as in any radio group
    function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        const step = event.key == "ArrowRight" || event.key == "ArrowDown" ? 1 : event.key == "ArrowLeft" || event.key == "ArrowUp" ? -1 : 0
        if (step == 0) return
        event.preventDefault()
        const index = themes.findIndex(option => option.value == theme)
        const next = themes[(index + step + themes.length) % themes.length]
        setPreferences({theme: next.value})
        const radios = event.currentTarget.querySelectorAll<HTMLElement>("[role=radio]")
        radios[themes.indexOf(next)].focus()
    }
    return (
        <div role="radiogroup" aria-label="Theme" className="segmented" onKeyDown={onKeyDown}>
            {themes.map(option => (
                <button key={option.value} type="button" role="radio" id={option.id} aria-checked={theme == option.value}
                    tabIndex={theme == option.value ? 0 : -1} onClick={() => setPreferences({theme: option.value})}>{option.label}</button>
            ))}
        </div>
    )
}

function EffectsToggle() {
    const {amuletEffects, reducedMotion} = usePreferences()
    return (
        <label className="settings-toggle">
            <input type="checkbox" id="amuletEffectsToggle" checked={amuletEffects && !reducedMotion} disabled={reducedMotion}
                onChange={event => setPreferences({amuletEffects: event.target.checked})} />
            <span className="settings-toggle-text">
                <span className="settings-toggle-name">Amulet effects</span>
                <span className="settings-note">
                    {reducedMotion ? "Off because your device asks for reduced motion" : "Off when your device asks for reduced motion"}
                </span>
            </span>
        </label>
    )
}

// It doesn't show the game state, so it doesn't render again with every
// frame (that would rewrite the save box each time)
export const SettingsTab = memo(function SettingsTab() {
    const [saveText, setSaveText] = useState("")
    // The last import error; hidden again by an export
    const [importError, setImportError] = useState("")
    const [showImportError, setShowImportError] = useState(false)
    // "Copied" (or why not) for a moment after pressing Copy
    const [copyNote, setCopyNote] = useState("")
    const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
    const boxRef = useRef<HTMLTextAreaElement>(null)
    const [confirmingReset, setConfirmingReset] = useState(false)
    const resetStartRef = useRef<HTMLButtonElement>(null)
    const cancelRef = useRef<HTMLButtonElement>(null)

    useEffect(() => () => clearTimeout(copyTimer.current), [])

    // The confirm swaps the reset button for new ones, so focus follows it
    const focusAfterSwap = useRef(false)
    useEffect(() => {
        if (!focusAfterSwap.current) return
        focusAfterSwap.current = false
        if (confirmingReset) cancelRef.current?.focus()
        else resetStartRef.current?.focus()
    }, [confirmingReset])

    function setConfirming(confirming: boolean) {
        focusAfterSwap.current = true
        setConfirmingReset(confirming)
    }

    function importGameData() {
        const error = importSave(saveText)
        if (error) {
            setImportError(error)
            setShowImportError(true)
            return
        }
        location.reload()
    }

    function exportGameData() {
        setShowImportError(false)
        setSaveText(exportSave())
    }

    function showCopyNote(note: string) {
        setCopyNote(note)
        clearTimeout(copyTimer.current)
        copyTimer.current = setTimeout(() => setCopyNote(""), 1500)
    }

    async function copySave() {
        // Not every browser or page (e.g. plain http) has the clipboard
        if (!navigator.clipboard) {
            boxRef.current?.select()
            showCopyNote("Not copied")
            return
        }
        try {
            await navigator.clipboard.writeText(saveText)
            showCopyNote("Copied")
        } catch {
            boxRef.current?.select()
            showCopyNote("Not copied")
        }
    }

    return (
        <div className="settings-grid">
            <section className="settings-card settings-wide">
                <div className="settings-line">
                    <h2>Your save</h2>
                    <SaveStatus />
                </div>
                <p className="settings-help">Export to back up or move your game. Paste a save here and import it to continue it.</p>
                {/* Pressing Enter in the box mustn't submit (and reload) the page */}
                <form id="importExportForm" className="settings-form" onSubmit={event => event.preventDefault()}>
                    <label htmlFor="importExportBox" className="settings-label">Save text</label>
                    <textarea id="importExportBox" ref={boxRef} rows={3} spellCheck={false} placeholder="Paste a save to import, or press Export"
                        value={saveText} onChange={event => setSaveText(event.target.value)} />
                </form>
                <div id="importError" role="alert" className={classNames("settings-error", !showImportError && "hidden")}>{importError}</div>
                <div className="settings-actions">
                    <button type="button" id="exportButton" className="quiet-button" onClick={exportGameData}>Export</button>
                    <button type="button" id="copyButton" className="quiet-button" disabled={saveText == ""} onClick={copySave}>{copyNote || "Copy"}</button>
                    <button type="button" id="importButton" className="quiet-button" onClick={importGameData}>Import</button>
                </div>
            </section>

            <section className="settings-card">
                <h2>Appearance</h2>
                <ThemeSwitch />
                <EffectsToggle />
            </section>

            <section className="settings-card">
                <h2>Community</h2>
                <p className="settings-help">Share strategies and report bugs with other players.</p>
                <a href="https://discord.gg/fTRS4pHGka" target="_blank" rel="noreferrer" className="quiet-button settings-link">
                    Join the Discord
                    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"></path></svg>
                </a>
            </section>

            <section className="settings-card settings-wide">
                <div className="settings-line">
                    <div className="settings-reset-text">
                        <h2 className="settings-danger">Hard reset</h2>
                        <p className="settings-help">Deletes your save: every life, max level and point of evil. Your appearance settings stay. This can&apos;t be undone.</p>
                    </div>
                    {confirmingReset ? (
                        <div className="settings-actions" role="group" aria-label="Confirm hard reset">
                            <span className="settings-confirm">Are you sure?</span>
                            <button type="button" id="resetButton" className="quiet-button settings-danger-button"
                                onClick={() => {clearSave(); location.reload()}}>Yes, reset</button>
                            <button type="button" ref={cancelRef} className="quiet-button" onClick={() => setConfirming(false)}>Cancel</button>
                        </div>
                    ) : (
                        <button type="button" ref={resetStartRef} className="quiet-button settings-danger-button"
                            onClick={() => setConfirming(true)}>Reset everything…</button>
                    )}
                </div>
            </section>
        </div>
    )
})
