// A checkbox that shows a setting from the game state. It only renders again
// when its props change: React writes to a controlled checkbox every time it
// renders, which would otherwise touch the page about 10 times a second.

import { memo } from "react"
import { requestRender } from "./gameStore.ts"

interface CheckboxProps {
    id?: string
    className: string
    // For a checkbox with no visible label
    ariaLabel?: string
    checked: boolean
    // Changes the setting; it must stay the same function between renders
    onToggle?: (checked: boolean) => void
}

export const Checkbox = memo(function Checkbox({id, className, ariaLabel, checked, onToggle}: CheckboxProps) {
    return (
        <input type="checkbox" id={id} className={className} aria-label={ariaLabel} checked={checked}
            onChange={event => {
                if (onToggle) onToggle(event.target.checked)
                requestRender()
            }} />
    )
})
