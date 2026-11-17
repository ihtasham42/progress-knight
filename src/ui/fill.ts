// The filled part of a progress bar. The page renders about 10 times a
// second, so setting a width would make the bar jump at each render. Instead
// the fill is full width and slid into place with a transform that eases over
// one render interval (--pk-tick in tokens.css), which looks continuous and
// doesn't make the browser lay out the page again.

import type { CSSProperties } from "react"

// share: how much of the bar is filled, from 0 to 1
export function fillStyle(share: number): CSSProperties {
    const clamped = Math.min(1, Math.max(0, share))
    return {"--fill": clamped} as CSSProperties
}
