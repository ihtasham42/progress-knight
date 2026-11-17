// An amount of coins as four parts (platinum, gold, silver, copper), for an
// element that holds nothing else. The spaces around the parts are the same
// as the page has always had.

import { Fragment } from "react"
import { formatCoins } from "./format.ts"
import type { CoinPart } from "./format.ts"

export function CoinParts({coins}: {coins: number}) {
    return <Parts parts={formatCoins(coins)} />
}

// The same four parts with nothing in them, for amounts that aren't shown
export function EmptyCoinParts() {
    return <Parts parts={[{text: ""}, {text: ""}, {text: ""}, {text: ""}]} />
}

function Parts({parts}: {parts: CoinPart[]}) {
    return (
        <>
            {" "}
            {parts.map((part, i) => (
                <Fragment key={i}>
                    <span style={part.color ? {color: part.color} : undefined}>{part.text}</span>
                    {" "}
                </Fragment>
            ))}
        </>
    )
}
