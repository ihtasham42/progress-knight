// The world's history: every life kept, and the one being lived, as spans of
// world days. The Chronicle and the past lives table read it. Lives are
// ordered by date, not by number, and lives whose spans overlap are given
// rows of their own, so the history still reads if a life is ever lived in
// the past.

import { gameData } from "./state.ts"
import type { LifeEnd } from "./state.ts"
import { getWorldDay, GROWING_UP_DAYS, toDate } from "./calendar.ts"
import { daysToYears } from "./rules.ts"

export interface LifeSpan {
    life: number // its number across the whole save
    born: number // world days
    woke: number // at 14
    ended: number // today for the life being lived
    living: boolean
    end: LifeEnd | null // null while living
    age: number // years at the end, or now
    evil: number // gained at the end
    row: number // 0, or more for a life that overlaps an earlier one
}

// The world day a past life woke at 14
export function wokeOn(life: {born: number}): number {
    return life.born + GROWING_UP_DAYS
}

// The world day the next life wakes if this one ends today
export function nextWakeDay(): number {
    return getWorldDay() + GROWING_UP_DAYS
}

export function yearOf(worldDay: number): number {
    return toDate(worldDay).year
}

// Every life kept and the one being lived, earliest first
export function getLifeSpans(): LifeSpan[] {
    const spans: LifeSpan[] = gameData.lives.map(life => ({
        life: life.life,
        born: life.born,
        woke: wokeOn(life),
        ended: life.ended,
        living: false,
        end: life.end,
        age: life.age,
        evil: life.evil,
        row: 0,
    }))
    spans.push({
        life: gameData.rebirthOneCount + gameData.rebirthTwoCount + 1,
        born: gameData.lifeStartDay - GROWING_UP_DAYS,
        woke: gameData.lifeStartDay,
        ended: getWorldDay(),
        living: true,
        end: null,
        age: daysToYears(gameData.days),
        evil: 0,
        row: 0,
    })
    spans.sort((a, b) => a.woke - b.woke || a.life - b.life)
    return assignRows(spans)
}

// Gives each span (earliest first) the first row free when it wakes
export function assignRows<T extends {woke: number, ended: number, row: number}>(spans: T[]): T[] {
    const rowEnds: number[] = []
    for (const span of spans) {
        let row = rowEnds.findIndex(end => end <= span.woke)
        if (row == -1) row = rowEnds.length
        rowEnds[row] = span.ended
        span.row = row
    }
    return spans
}

const numerals: [number, string][] = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
    [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]]

// 14 -> "XIV". Lives are numbered from 1.
export function toRoman(number: number): string {
    let text = ""
    for (const [value, numeral] of numerals) {
        while (number >= value) {
            text += numeral
            number -= value
        }
    }
    return text
}
