// Intervals that keep running in a background tab: the page side
// (backgroundTimer.ts) and the worker that keeps the time.

import { test, vi, beforeEach, afterEach } from "vitest"
import assert from "node:assert/strict"
import path from "node:path"

const ROOT = path.join(import.meta.dirname, "..")

beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
})
afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

async function loadTimer() {
    return import(path.join(ROOT, "src/backgroundTimer.ts"))
}

// Stands in for a browser Web Worker: records what the page posts, and
// lets the test post messages back
class FakeWorker {
    static created = []
    constructor(url, options) {
        this.url = String(url)
        this.options = options
        this.posted = []
        FakeWorker.created.push(this)
    }
    postMessage(message) { this.posted.push(message) }
    receive(data) { this.onmessage({ data }) }
}

test("the intervals run in a worker, which tells the page when each is due", async () => {
    FakeWorker.created = []
    vi.stubGlobal("Worker", FakeWorker)
    const { setBackgroundInterval } = await loadTimer()
    const calls = { loop: 0, save: 0 }
    const stopLoop = setBackgroundInterval(() => calls.loop++, 50)
    setBackgroundInterval(() => calls.save++, 3000)

    assert.equal(FakeWorker.created.length, 1, "one worker for all the intervals")
    const worker = FakeWorker.created[0]
    assert.match(worker.url, /backgroundTimer\.worker\.ts$/)
    assert.deepEqual(worker.options, { type: "module" })
    assert.deepEqual(worker.posted, [
        { action: "start", id: 1, interval: 50 },
        { action: "start", id: 2, interval: 3000 },
    ])

    worker.receive(1)
    worker.receive(1)
    worker.receive(2)
    assert.deepEqual(calls, { loop: 2, save: 1 })

    stopLoop()
    assert.deepEqual(worker.posted.at(-1), { action: "stop", id: 1 })
    worker.receive(1)
    assert.equal(calls.loop, 2, "a stopped interval's late messages are ignored")
})

test("without workers, ordinary intervals are used", async () => {
    vi.stubGlobal("Worker", undefined)
    const { setBackgroundInterval } = await loadTimer()
    let calls = 0
    const stop = setBackgroundInterval(() => calls++, 50)
    vi.advanceTimersByTime(120)
    assert.equal(calls, 2)
    stop()
    vi.advanceTimersByTime(500)
    assert.equal(calls, 2)
})

test("if a worker can't be started, ordinary intervals are used", async () => {
    vi.stubGlobal("Worker", class { constructor() { throw new Error("blocked") } })
    const { setBackgroundInterval } = await loadTimer()
    let calls = 0
    setBackgroundInterval(() => calls++, 1000)
    vi.advanceTimersByTime(3000)
    assert.equal(calls, 3)
})

test("the worker posts each interval's id when it's due, until it's stopped", async () => {
    const posted = []
    vi.stubGlobal("postMessage", id => posted.push(id))
    // A worker's global scope has onmessage; Node's doesn't
    vi.stubGlobal("onmessage", null)
    await import(path.join(ROOT, "src/backgroundTimer.worker.ts"))
    const send = data => globalThis.onmessage({ data })

    send({ action: "start", id: 1, interval: 50 })
    send({ action: "start", id: 2, interval: 3000 })
    vi.advanceTimersByTime(150)
    assert.deepEqual(posted, [1, 1, 1])

    send({ action: "stop", id: 1 })
    vi.advanceTimersByTime(2850)
    assert.deepEqual(posted, [1, 1, 1, 2])
    send({ action: "stop", id: 2 })
})
