// The Settings tab: importing and exporting saves, light/dark mode and a
// hard reset.

import { useState } from "react"
import { clearSave, exportSave, importSave } from "../game/save.ts"
import { classNames } from "./classNames.ts"

export function SettingsTab() {
    const [saveText, setSaveText] = useState("")
    // The last import error; hidden again by an export
    const [importError, setImportError] = useState("")
    const [showImportError, setShowImportError] = useState(false)

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

    return (
        <ul>
            {" "}
            <li>
                {" "}
                <h2>Import/export save</h2>
                {" "}
                <button id="importButton" className="w3-button button" onClick={importGameData}>Import</button>
                {" "}
                <button id="exportButton" className="w3-button button" onClick={exportGameData}>Export</button>
                {" "}
                {/* Pressing Enter in the box mustn't submit (and reload) the page */}
                <form id="importExportForm" style={{marginTop: "16px"}} onSubmit={event => event.preventDefault()}>
                    {" "}
                    <input id="importExportBox" type="text" style={{width: "300px", height: "30px"}}
                        value={saveText} onChange={event => setSaveText(event.target.value)} />
                    {" "}
                </form>
                {" "}
                <div id="importError" className={classNames(!showImportError && "hidden")} style={{color: "rgb(200, 0, 0)", marginTop: "8px"}}>{importError}</div>
                {" "}
            </li>
            {" "}
            <li>
                {" "}
                <h2>Toggle light/dark mode</h2>
                {" "}
                <button id="lightDarkButton" className="w3-button button" onClick={() => document.body.classList.toggle("dark")}>Toggle</button>
                {" "}
            </li>
            {" "}
            <li>
                {" "}
                <h2>Join the discord community!</h2>
                {" "}
                <a href="https://discord.gg/fTRS4pHGka" target="_blank" rel="noreferrer">
                    {" "}
                    <img src="https://cdn.icon-icons.com/icons2/2108/PNG/512/discord_icon_130958.png" width="100" height="100" />
                    {" "}
                </a>
                {" "}
            </li>
            {" "}
            <li>
                {" "}
                <h2>Hard reset game</h2>
                {" "}
                <button id="resetButton" className="w3-button button w3-red" onClick={() => {clearSave(); location.reload()}}>Reset</button>
                {" "}
            </li>
            {" "}
        </ul>
    )
}
