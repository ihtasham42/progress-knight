// How events read on the page: their effects ("×1.25 upkeep"), whether each
// is good or bad for the player, and how long until one comes.

import type { EventEffect } from "../game/types.ts"
import type { EventOccurrence } from "../game/events.ts"
import { calendar } from "../game/data.ts"
import { DAYS_PER_YEAR } from "../game/calendar.ts"

// "×1.25 upkeep"
export function effectText(effect: EventEffect): string {
    return "×" + Number(effect.effect.toFixed(2)) + " " + effect.label
}

// Paying more upkeep is bad; every other boost an event gives is good
export function isEffectGood(effect: EventEffect): boolean {
    const raisesUpkeep = effect.boosts.some(boost => boost.stat == "expense")
    return raisesUpkeep ? effect.effect < 1 : effect.effect >= 1
}

// The token to colour an effect in. onRaised: drawn on the raised background
export function effectColor(effect: EventEffect, onRaised = false): string {
    if (isEffectGood(effect)) return onRaised ? "var(--pk-gain-text)" : "var(--pk-gain)"
    return "var(--pk-loss)"
}

// "in 141 days", "in 1 day", "in 3 years"
export function untilText(days: number): string {
    const whole = Math.max(1, Math.ceil(days))
    if (whole < DAYS_PER_YEAR) return "in " + whole + (whole == 1 ? " day" : " days")
    const years = Math.floor(whole / DAYS_PER_YEAR)
    return "in " + years + (years == 1 ? " year" : " years")
}

// "Winter 1536"
export function seasonYearText(occurrence: EventOccurrence): string {
    const season = calendar.seasons.find(found => found.id == occurrence.event.season)
    return (season?.name ?? "") + " " + occurrence.year
}
