// The Shop: properties and misc items, each with whether it's active, its
// effect and its daily expense, and what the next one needs.

import { Fragment } from "react"
import type { CSSProperties } from "react"
import { headerRowColors, itemCategories, tooltips } from "../game/data.ts"
import type { Item } from "../game/classes.ts"
import { setMisc, setProperty } from "../game/engine.ts"
import { requestRender, useGame } from "./gameStore.ts"
import { CoinParts } from "./CoinParts.tsx"
import { RequiredRow, isCategoryHidden } from "./RequiredRow.tsx"
import { classNames, removeSpaces } from "./classNames.ts"

export function ShopTable() {
    const game = useGame()
    return (
        <div className="table-scroll">
            <table id="itemTable" className="w3-table w3-bordered">
                <tbody>
                    {Object.entries(itemCategories).map(([categoryName, names]) => (
                        <Fragment key={categoryName}>
                            <tr className={classNames(removeSpaces(categoryName), "headerRow", isCategoryHidden(categoryName) && "hidden")}
                                style={{"--cat": headerRowColors[categoryName as keyof typeof headerRowColors], backgroundColor: headerRowColors[categoryName as keyof typeof headerRowColors], color: "var(--pk-on-category)"} as CSSProperties}>
                                <th className="category">{categoryName}</th>
                                <th className="col-active">Active</th>
                                <th className="col-effect">Effect</th>
                                <th>Expense/day</th>
                            </tr>
                            {names.map(name => <ItemRow key={name} item={game.itemData[name]} isProperty={categoryName == "Properties"} />)}
                            <RequiredRow categoryName={categoryName} category={names} items={true} />
                        </Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function ItemRow({item, isProperty}: {item: Item, isProperty: boolean}) {
    const game = useGame()
    const name = item.name
    const isActive = game.currentMisc.includes(item) || item == game.currentProperty
    const color = isProperty ? headerRowColors["Properties"] : headerRowColors["Misc"]
    return (
        <tr id={"row " + name} className={classNames(!game.requirements[name].completed && "hidden")}>
            <td>
                {" "}
                <button className="button item-button tooltip" disabled={game.coins < item.getExpense()} aria-pressed={isActive}
                    onClick={() => {isProperty ? setProperty(name) : setMisc(name); requestRender()}}>
                    {" "}
                    <span className="name">{name}</span>
                    {" "}
                    <span className="tooltipText">{tooltips[name]}</span>
                    {" "}
                </button>
                {" "}
            </td>
            <td>
                <div className="w3-border w3-circle" style={{width: "40px", height: "40px", padding: "7px"}}>
                    <div className="active w3-circle" style={{width: "24px", height: "24px", backgroundColor: isActive ? color : "var(--pk-raised)"}}></div>
                </div>
            </td>
            <td className="effect">{item.getEffectDescription()}</td>
            <td className="expense"><CoinParts coins={item.getExpense()} /></td>
        </tr>
    )
}
