// The whole page: the sidebar, the tab bar and the selected tab.

import { useState } from "react"
import type { ReactNode } from "react"
import { isUnlocked } from "../game/engine.ts"
import { useGame } from "./gameStore.ts"
import { Sidebar } from "./Sidebar.tsx"
import { TaskTable } from "./TaskTable.tsx"
import { ShopTable } from "./ShopTable.tsx"
import { classNames } from "./classNames.ts"

export type TabName = "jobs" | "skills" | "shop" | "rebirth" | "settings"

const tabs: {name: TabName, label: string, id?: string, unlock?: string, style?: React.CSSProperties}[] = [
    {name: "jobs", label: "Jobs", id: "jobTabButton"},
    {name: "skills", label: "Skills"},
    {name: "shop", label: "Shop", id: "shopTabButton", unlock: "shop"},
    {name: "rebirth", label: "Amulet", id: "rebirthTabButton", unlock: "rebirth_tab"},
    {name: "settings", label: "Settings", style: {float: "right"}},
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
        <div className="w3-margin">
            {" "}
            <h1>Progress Knight</h1>
            {" "}
            <div style={{width: "1220px", height: "600px"}}>
                {" "}
                <Sidebar />
                {" "}
                <div className="panel w3-margin-left" style={{width: "900px", height: "40px", float: "left"}}>
                    {" "}
                    {tabs.map(tab => (
                        <TabButton key={tab.name} tab={tab} selected={tab.name == selectedTab} onSelect={() => setSelectedTab(tab.name)} />
                    ))}
                </div>
                {" "}
                <div className="panel w3-margin-left w3-margin-top w3-padding" style={{width: "900px", height: "auto", float: "left"}}>
                    {" "}
                    <Tab name="jobs" selected={selectedTab}><TaskTable kind="jobs" /></Tab>
                    {" "}
                    <Tab name="skills" selected={selectedTab}><TaskTable kind="skills" /></Tab>
                    {" "}
                    <Tab name="shop" selected={selectedTab}><ShopTable /></Tab>
                    {" "}
                    <Tab name="rebirth" selected={selectedTab}>{null}</Tab>
                    {" "}
                    <Tab name="settings" selected={selectedTab}>{null}</Tab>
                    {" "}
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
            <div id={tab.id} data-tab={tab.name} style={tab.style} onClick={onSelect}
                className={classNames("w3-button w3-bar-item tabButton", tab.unlock && !isUnlocked(tab.unlock) && "hidden", selected && "w3-blue-gray")}>
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
