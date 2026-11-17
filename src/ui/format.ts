// How numbers and coins are written on the page.

const units = ["", "k", "M", "B", "T", "q", "Q", "Sx", "Sp", "Oc"]

export function format(number: number | string): number | string {
    number = Number(number)
    if (!isFinite(number)) return String(number)

    const sign = number < 0 ? "-" : ""
    const abs = Math.abs(number)

    // what tier? (determines SI symbol) - computed without log10 to avoid float error at exact powers of 1000
    let tier = 0
    while (abs >= Math.pow(1000, tier + 1)) tier++

    // below 1000 (including 0, fractions and small negatives) no suffix is needed
    if (tier == 0) return number

    // beyond the last named suffix fall back to scientific notation
    if (tier >= units.length) return sign + abs.toExponential(2)

    let scaled = abs / Math.pow(1000, tier)
    // avoid displaying e.g. "1000.0k" when rounding pushes into the next tier
    if (scaled.toFixed(1) == "1000.0" && tier + 1 < units.length) {
        tier++
        scaled = abs / Math.pow(1000, tier)
    }

    return sign + scaled.toFixed(1) + units[tier]
}

// Coin tier -> its colour, as a design token (css/tokens.css, css/dark.css)
const coinColors = {
    "p": "var(--pk-coin-p)",
    "g": "var(--pk-coin-g)",
    "s": "var(--pk-coin-s)",
    "c": "var(--pk-coin-c)",
}

// One of the four parts of an amount of coins: platinum, gold, silver and
// copper, 100 of each per next. An empty part has no text. When an amount has
// no copper the copper part has no colour either (the colour shown before is
// kept).
export interface CoinPart {
    text: string
    color?: string
}

export function formatCoins(coins: number): CoinPart[] {
    const tiers = ["p", "g", "s"] as const
    const parts: CoinPart[] = []
    let leftOver = coins
    let i = 0
    for (const tier of tiers) {
        const x = Math.floor(leftOver / Math.pow(10, (tiers.length - i) * 2))
        leftOver = Math.floor(leftOver - x * Math.pow(10, (tiers.length - i) * 2))
        const text = format(String(x)) + tier + " "
        parts.push({text: x > 0 ? text : "", color: coinColors[tier]})
        i += 1
    }
    if (leftOver == 0 && coins > 0) {
        parts.push({text: ""})
        return parts
    }
    const copperText = String(Math.floor(leftOver)) + "c"
    parts.push({text: copperText, color: coinColors["c"]})
    return parts
}
