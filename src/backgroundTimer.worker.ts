// Runs in a Web Worker and keeps time for backgroundTimer.ts. Browsers slow
// down timers on a page whose tab is in the background, but not timers in a
// worker, so the worker runs each interval and tells the page when it's due.

import type { TimerMessage } from "./backgroundTimer.ts"

const intervals = new Map<number, ReturnType<typeof setInterval>>()

onmessage = (event: MessageEvent<TimerMessage>) => {
    const message = event.data
    if (message.action == "start") {
        intervals.set(message.id, setInterval(() => postMessage(message.id), message.interval))
    } else {
        clearInterval(intervals.get(message.id))
        intervals.delete(message.id)
    }
}
