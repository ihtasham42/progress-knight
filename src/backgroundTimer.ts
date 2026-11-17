// Intervals that keep running while the game's tab is in the background.
//
// Browsers slow a background tab's timers down to once a second, and later
// to once a minute, which would stop the game's loop and autosave keeping
// up. A Web Worker's timers aren't slowed, so a worker keeps the time
// (backgroundTimer.worker.ts) and posts a message when each interval is due;
// the callback then runs on the page. Without workers, ordinary intervals
// are used.

export type TimerMessage =
    | {action: "start", id: number, interval: number}
    | {action: "stop", id: number}

// undefined until first used; null if workers aren't available
let worker: Worker | null | undefined
const callbacks = new Map<number, () => void>()
let nextId = 1

function getWorker(): Worker | null {
    if (worker !== undefined) return worker
    try {
        worker = new Worker(new URL("./backgroundTimer.worker.ts", import.meta.url), {type: "module"})
        worker.onmessage = (event: MessageEvent<number>) => callbacks.get(event.data)?.()
    } catch {
        worker = null
    }
    return worker
}

// Calls callback every interval milliseconds. Returns a function that stops it.
export function setBackgroundInterval(callback: () => void, interval: number): () => void {
    const timerWorker = getWorker()
    if (!timerWorker) {
        const handle = setInterval(callback, interval)
        return () => clearInterval(handle)
    }

    const id = nextId++
    callbacks.set(id, callback)
    timerWorker.postMessage({action: "start", id, interval} satisfies TimerMessage)
    return () => {
        callbacks.delete(id)
        timerWorker.postMessage({action: "stop", id} satisfies TimerMessage)
    }
}
