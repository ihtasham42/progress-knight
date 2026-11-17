// Touch screens can't hover, so a long press on a bar or shop item shows its
// tooltip instead. The press doesn't select, a plain tap still does, and the
// tooltip closes on the next tap anywhere or after a few seconds.

import { useEffect, useRef, useState } from "react"
import type { MouseEvent, PointerEvent } from "react"

export const longPressMs = 500
export const tooltipShownMs = 4000
// A finger that moves further than this is scrolling, not pressing
const moveLimit = 10
// How long after a long press the click it leaves behind is still swallowed
const clickGraceMs = 400

function canHover() {
    return typeof matchMedia != "function" || !matchMedia("(hover: none)").matches
}

export function useLongPressTooltip() {
    const [shown, setShown] = useState(false)
    const pressTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
    const graceTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
    const start = useRef({x: 0, y: 0})
    const longPressed = useRef(false)

    // While it's open: the next tap anywhere closes it, and so does time
    useEffect(() => {
        if (!shown) return
        const close = () => setShown(false)
        const timer = setTimeout(close, tooltipShownMs)
        document.addEventListener("pointerdown", close, true)
        return () => {
            clearTimeout(timer)
            document.removeEventListener("pointerdown", close, true)
        }
    }, [shown])

    useEffect(() => () => {
        clearTimeout(pressTimer.current)
        clearTimeout(graceTimer.current)
    }, [])

    const cancelPress = () => clearTimeout(pressTimer.current)

    const handlers = {
        onPointerDown(event: PointerEvent) {
            if (event.pointerType == "mouse" || canHover()) return
            clearTimeout(graceTimer.current)
            longPressed.current = false
            start.current = {x: event.clientX, y: event.clientY}
            pressTimer.current = setTimeout(() => {
                longPressed.current = true
                setShown(true)
            }, longPressMs)
        },
        onPointerMove(event: PointerEvent) {
            if (Math.hypot(event.clientX - start.current.x, event.clientY - start.current.y) > moveLimit) cancelPress()
        },
        onPointerUp() {
            cancelPress()
            // The click comes right after; if none does, don't swallow a later one
            graceTimer.current = setTimeout(() => {longPressed.current = false}, clickGraceMs)
        },
        onPointerCancel() {
            cancelPress()
            longPressed.current = false
        },
        // Capture, so the button's own onClick never sees the click
        onClickCapture(event: MouseEvent) {
            if (!longPressed.current) return
            longPressed.current = false
            event.preventDefault()
            event.stopPropagation()
        },
        // Android turns a long press into a context menu
        onContextMenu(event: MouseEvent) {
            if (!canHover()) event.preventDefault()
        },
    }
    return {shown, handlers}
}
