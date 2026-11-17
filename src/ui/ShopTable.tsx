// The Shop: properties and misc items, each with whether it's in use, its
// effect and its daily upkeep, and what the next one needs.

import { Fragment } from "react"
import type { CSSProperties } from "react"
import { headerRowColors, itemCategories, tooltips } from "../game/data.ts"
import type { Item } from "../game/classes.ts"
import { setMisc, setProperty } from "../game/engine.ts"
import { requestRender, useGame } from "./gameStore.ts"
import { CoinParts } from "./CoinParts.tsx"
import { RequiredRow, isCategoryHidden } from "./RequiredRow.tsx"
import { classNames, removeSpaces } from "./classNames.ts"
import { splitEffect } from "./format.ts"

const categoryHints: Record<string, string> = {
    "Properties": "one at a time",
    "Misc": "any number",
}

export function ShopTable() {
    const game = useGame()
    // Every item shares the same expense multipliers (Bargaining, Intimidation)
    const discount = Number(game.itemData["Tent"].expenseMultipliers.reduce((product, multiplier) => product * multiplier(), 1).toFixed(2))
    return (
        <>
            <div className="table-scroll">
                <table id="itemTable" className="w3-table w3-bordered task-table shop-table">
                    <tbody>
                        {Object.entries(itemCategories).map(([categoryName, names]) => (
                            <Fragment key={categoryName}>
                                <tr className={classNames(removeSpaces(categoryName), "headerRow", isCategoryHidden(categoryName) && "locked-header")}
                                    style={{"--cat": headerRowColors[categoryName as keyof typeof headerRowColors]} as CSSProperties}>
                                    <th className="category">
                                        {categoryName}
                                        <span className="category-hint">{categoryHints[categoryName]}</span>
                                    </th>
                                    <th className="col-active">In use</th>
                                    <th className="col-effect">Effect</th>
                                    <th className="col-upkeep">Upkeep / day</th>
                                </tr>
                                {names.map(name => <ItemRow key={name} item={game.itemData[name]} isProperty={categoryName == "Properties"} categoryName={categoryName} />)}
                                <RequiredRow categoryName={categoryName} category={names} items={true} />
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="shop-note">
                Upkeep includes your Bargaining discount{discount != 1 && " (×" + discount + ")"}. Running out of coins makes you homeless and sells every item.
            </p>
        </>
    )
}

// Labelled where it stands alone; the phone tick sits in a button whose
// aria-pressed already says it
function CheckIcon({className, label}: {className: string, label?: string}) {
    return (
        <svg className={className} {...(label ? {role: "img", "aria-label": label} : {"aria-hidden": true})} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
    )
}

function ItemRow({item, isProperty, categoryName}: {item: Item, isProperty: boolean, categoryName: string}) {
    const game = useGame()
    const name = item.name
    const isActive = game.currentMisc.includes(item) || item == game.currentProperty
    const expense = item.getExpense()
    // "x2.0 Happiness" -> "×2" and "happiness"
    const effect = splitEffect(item.getEffectDescription())
    const tooltipId = "tip-" + removeSpaces(name)
    return (
        <tr id={"row " + name} className={classNames(!game.requirements[name].completed && "hidden")}
            style={{"--cat": headerRowColors[categoryName as keyof typeof headerRowColors]} as CSSProperties}>
            <td>
                <button type="button" className="item-button tooltip" disabled={game.coins < expense} aria-pressed={isActive} aria-describedby={tooltipId}
                    onClick={() => {isProperty ? setProperty(name) : setMisc(name); requestRender()}}>
                    <span className="name">{name}</span>
                    {/* Phones show the tick inside the button (hidden from 640px) */}
                    {isActive && <CheckIcon className="item-tick" />}
                    <span className="tooltipText" id={tooltipId} aria-hidden="true">{tooltips[name]}</span>
                </button>
            </td>
            <td className="in-use">
                {isActive
                    ? <CheckIcon className="active" label="In use" />
                    : <span className="not-in-use" role="img" aria-label="Not in use">—</span>}
            </td>
            <td className="effect"><strong>{effect.multiplier.replace(/\.0$/, "")}</strong> <span>{effect.what}</span></td>
            <td className={classNames("expense", expense == 0 && "free")}>{expense == 0 ? "Free" : <CoinParts coins={expense} />}</td>
        </tr>
    )
}
