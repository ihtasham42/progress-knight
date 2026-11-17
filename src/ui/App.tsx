// The whole page: the sidebar, the tab bar and the selected tab.

import { useState } from "react"
import type { ReactNode } from "react"
import { isUnlocked } from "../game/engine.ts"
import { useGame } from "./gameStore.ts"
import { Sidebar } from "./Sidebar.tsx"
import { TaskTable } from "./TaskTable.tsx"
import { ShopTable } from "./ShopTable.tsx"
import { AmuletTab } from "./AmuletTab.tsx"
import { SettingsTab } from "./SettingsTab.tsx"
import { classNames } from "./classNames.ts"

export type TabName = "jobs" | "skills" | "shop" | "rebirth" | "settings"

const tabs: {name: TabName, label: string, id?: string, unlock?: string, end?: boolean}[] = [
    {name: "jobs", label: "Jobs", id: "jobTabButton"},
    {name: "skills", label: "Skills"},
    {name: "shop", label: "Shop", id: "shopTabButton", unlock: "shop"},
    {name: "rebirth", label: "Amulet", id: "rebirthTabButton", unlock: "rebirth_tab"},
    {name: "settings", label: "Settings", end: true},
]

export function App() {
    const game = useGame()
    const [selectedTab, setSelectedTab] = useState<TabName>("jobs")

    // After a rebirth the page goes back to the Jobs tab
    const rebirths = game.rebirthOneCount + game.rebirthTwoCount
    const [shownRebirths, setShownRebirths] = useState(rebirths)
    if (rebirths != shownRebirths) {
        setShownRebirths(rebirths)
        setSelectedTab("jobs")
    }

    return (
        <div className="page">
            {" "}
            <h1>Progress Knight</h1>
            {" "}
            <div className="layout">
                {" "}
                <Sidebar />
                {" "}
                <div className="main">
                    <div className="panel tab-bar" style={{"--tab-count": tabs.filter(tab => !tab.unlock || isUnlocked(tab.unlock)).length} as React.CSSProperties}>
                        {" "}
                        {tabs.map(tab => (
                            <TabButton key={tab.name} tab={tab} selected={tab.name == selectedTab} onSelect={() => setSelectedTab(tab.name)} />
                        ))}
                    </div>
                    {" "}
                    <div className="panel tab-panel">
                        {" "}
                        <Tab name="jobs" selected={selectedTab}><TaskTable kind="jobs" /></Tab>
                        {" "}
                        <Tab name="skills" selected={selectedTab}><TaskTable kind="skills" /></Tab>
                        {" "}
                        <Tab name="shop" selected={selectedTab}><ShopTable /></Tab>
                        {" "}
                        <Tab name="rebirth" selected={selectedTab}><AmuletTab /></Tab>
                        {" "}
                        <Tab name="settings" selected={selectedTab}><SettingsTab /></Tab>
                        {" "}
                    </div>
                </div>
                {" "}
            </div>
            {" "}
        </div>
    )
}

function TabButton({tab, selected, onSelect}: {tab: typeof tabs[number], selected: boolean, onSelect: () => void}) {
    return (
        <>
            <div id={tab.id} data-tab={tab.name} onClick={onSelect}
                className={classNames("w3-button w3-bar-item tabButton", tab.end && "tab-end", tab.unlock && !isUnlocked(tab.unlock) && "hidden", selected && "w3-blue-gray")}>
                {tab.label}
            </div>
            {" "}
        </>
    )
}

function Tab({name, selected, children}: {name: TabName, selected: TabName, children: ReactNode}) {
    return (
        <div className="tab" id={name} style={{display: name == selected ? "block" : "none"}}>
            {" "}
            {children}
            {" "}
        </div>
    )
}
