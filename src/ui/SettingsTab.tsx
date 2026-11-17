// The Settings tab: importing and exporting saves, light/dark mode, the
// Discord link and a hard reset.

import { memo, useEffect, useRef, useState } from "react"
import { clearSave, exportSave, importSave } from "../game/save.ts"
import { classNames } from "./classNames.ts"

type Theme = "dark" | "light"

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
    // The theme is the page's dark class; it isn't saved
    const [theme, setThemeState] = useState<Theme>(() => document.body.classList.contains("dark") ? "dark" : "light")
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

    function setTheme(next: Theme) {
        document.body.classList.toggle("dark", next == "dark")
        setThemeState(next)
    }

    return (
        <div className="settings-grid">
            <section className="settings-card settings-wide">
                <div className="settings-line">
                    <h2>Your save</h2>
                    <span className="settings-note">Saved automatically every 3 seconds</span>
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
                <div role="radiogroup" aria-label="Theme" className="segmented">
                    <button type="button" role="radio" aria-checked={theme == "dark"} onClick={() => setTheme("dark")}>Dark</button>
                    <button type="button" role="radio" id="lightDarkButton" aria-checked={theme == "light"} onClick={() => setTheme("light")}>Light</button>
                </div>
            </section>

            <section className="settings-card">
                <h2>Community</h2>
                <p className="settings-help">Share strategies and report bugs with other players.</p>
                <a href="https://discord.gg/7QrW7AWRa" target="_blank" rel="noreferrer" className="quiet-button settings-link">
                    Join the Discord
                    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"></path></svg>
                </a>
            </section>

            <section className="settings-card settings-wide">
                <div className="settings-line">
                    <div className="settings-reset-text">
                        <h2 className="settings-danger">Hard reset</h2>
                        <p className="settings-help">Deletes your save: every life, max level and point of evil. This can&apos;t be undone.</p>
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
