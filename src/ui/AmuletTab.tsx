// The Amulet tab: notes revealed as the player ages, and the two rebirths.

import type { CSSProperties } from "react"
import { headerRowColors, jobBaseData, namesById, skills } from "../game/data.ts"
import { getEvilGain, getTaskById, isUnlocked, rebirthOne, rebirthTwo } from "../game/engine.ts"
import { daysToYears, getLifespan } from "../game/rules.ts"
import type { Skill } from "../game/classes.ts"
import type { TaskRequirementSpec } from "../game/types.ts"
import { requestRender, useGame } from "./gameStore.ts"
import { classNames } from "./classNames.ts"
import { format } from "./format.ts"
import { PastLives } from "./PastLives.tsx"

// The age that Rebirth II waits for (the "rebirth_note_3" unlock in data.ts)
const EVIL_AGE = 200

// What Immortality needs, read from the data: "Apprentice mage 10, through
// the Arcane Association"
const immortalityNeeds = (() => {
    const spec = skills.find(skill => skill.id == "immortality")?.requires[0] as TaskRequirementSpec
    const name = namesById[spec.task]
    // "The Arcane Association" reads as "the Arcane Association" mid-sentence
    return {name, level: spec.level, place: "the " + jobBaseData[name].category.replace(/^The /, "")}
})()

export function AmuletTab() {
    const game = useGame()
    const eyeReady = isUnlocked("rebirth_note_2")
    const evilReady = isUnlocked("rebirth_note_3")

    // The tasks that would give the biggest multipliers after touching the eye:
    // a rebirth keeps the highest level reached, and the multiplier is 1 + that / 10
    const bonuses = Object.values(game.taskData)
        .map(task => ({task, max: Math.max(task.maxLevel, task.level)}))
        .filter(bonus => bonus.max > 0)
        .sort((a, b) => b.max - a.max)
        .slice(0, 4)

    return (
        <div className="amulet">
            <header className="amulet-head">
                <h1 className="amulet-title">The Amulet</h1>
                <p className="amulet-subtitle">Every life leaves something behind. Choose when to let this one go.</p>
            </header>
            <div className="amulet-story">
                <p>
                    You stumble across a strange looking amulet on your 25th birthday. It does not look like
                    it has any worth on the market given that it&apos;s made from cheap-looking copper. However, you
                    feel a weird urge to keep the amulet, so you slip it into your pocket for safekeeping.
                </p>
                <p id="rebirthNote1" className={classNames(!isUnlocked("rebirth_note_1") && "hidden")}>
                    On your 45th birthday, you feel the amulet shiver uncontrollably in your pocket. You take it
                    out and the constant shivering suddenly stops. More to your bizarre surprise, you notice
                    a strange etching on the centre of the amulet.
                </p>
            </div>
            <div className="amulet-cards">
                <section id="rebirthNote2" className={classNames("amulet-card", !eyeReady && "hidden")}>
                    <div className="amulet-card-head">
                        <div className="amulet-ripple">
                            <EyeEmblem />
                        </div>
                        <div className="amulet-card-title">
                            <span className="amulet-kicker amulet-kicker-gold">Rebirth I · ready</span>
                            <h2>Touch the eye</h2>
                        </div>
                    </div>
                    <div className="amulet-flavour">
                        <p>
                            On your 65th birthday, you once again encounter the strange, unexplained shivering from your
                            amulet. But this time, a living eyeball emerges from the centre. Although terribly frightened,
                            you realise you do not have many years to live left anyway so you consider touching the eye
                            to see what happens.
                        </p>
                        <p>
                            By touching the eyeball, you will be reborn and have to restart life again, losing all your levels and coins.
                            However, you will gain <b>xp multipliers</b> for your jobs and skills equivalent to: <b>1 + the max level of the skill or job / 10.</b>{" "}
                            This means you will learn everything again much more quickly than you did in your previous life. <span className="amulet-evil-hint">
                                Something tells you that the amulet might transform even further after living for <b>2 whole centuries</b>...</span>
                        </p>
                    </div>
                    <div className="amulet-bonuses">
                        <h3 className="card-label">Strongest bonuses next life</h3>
                        {bonuses.length == 0 && <p className="amulet-none">Nothing yet. Level up a job or a skill and it shows here.</p>}
                        {bonuses.map(({task, max}) => (
                            <div key={task.name} className="amulet-bonus"
                                style={{"--cat": headerRowColors[task.baseData.category as keyof typeof headerRowColors]} as CSSProperties}>
                                <span aria-hidden="true" className="amulet-swatch"></span>
                                <span className="amulet-bonus-name">{task.name}</span>
                                <span className="amulet-bonus-max">max {format(max)}</span>
                                <strong className="amulet-bonus-gain">{"×" + (max < 1000 ? (1 + max / 10).toFixed(1) : format(1 + max / 10))}</strong>
                            </div>
                        ))}
                    </div>
                    <button type="button" id="rebirthOneButton" className="amulet-cta"
                        onClick={() => {rebirthOne(); requestRender()}}>Touch the eye</button>
                    <p className="amulet-fine">
                        Resets coins, age, levels and items · {game.rebirthOneCount} {game.rebirthOneCount == 1 ? "rebirth" : "rebirths"} so far
                    </p>
                </section>

                <section id="rebirthNote3" className={classNames("amulet-card", !evilReady && "hidden")}>
                    <div className="amulet-card-head">
                        <EvilEmblem />
                        <div className="amulet-card-title">
                            <span className="amulet-kicker amulet-kicker-evil">Rebirth II · ready</span>
                            <h2>Embrace evil</h2>
                        </div>
                    </div>
                    <div className="amulet-flavour">
                        <p>
                            Your gut instinct was right. The moment you hit the grand age of 200, you hear an ominous hum coming from the amulet.
                            A mouth emerges from its surface and begins to cackle, and proceeds to say: &quot;So you&apos;ve made it this far... Are you ready to embrace evil?&quot;
                        </p>
                        <p>
                            If you decide to embrace evil, all of your levels, coins and even max levels will be reset.
                            You will be reborn as a fresh slate. However, you will unlock a new line of skills and gain <b>evil</b>,
                            which will heavily impact your future lives.
                        </p>
                    </div>
                    <div className="amulet-reward">
                        <span>Reward</span>
                        <strong className="amulet-throb">+<span id="evilGainDisplay">{getEvilGain().toFixed(1)}</span> evil</strong>
                    </div>
                    <button type="button" id="rebirthTwoButton" className="quiet-button amulet-evil-button"
                        onClick={() => {rebirthTwo(); requestRender()}}>Embrace evil</button>
                </section>

                <EvilTeaser hidden={evilReady} />
            </div>
            <PastLives />
        </div>
    )
}

// Rebirth II before it's reachable: how far along the road to age 200 the
// player is, and what stretches the lifespan that far
function EvilTeaser({hidden}: {hidden: boolean}) {
    const game = useGame()
    const age = daysToYears(game.days)
    const lifespan = daysToYears(getLifespan())
    const immortality = getTaskById("immortality") as Skill
    const stretched = immortality.level > 0
    const progress = Math.min(1, age / EVIL_AGE)
    return (
        <section id="rebirthTeaser" className={classNames("amulet-card amulet-locked", hidden && "hidden")}>
            <div className="amulet-card-head">
                <EvilEmblem />
                <div className="amulet-card-title">
                    <span className="amulet-kicker">
                        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg>
                        Rebirth II
                    </span>
                    <h2>Embrace evil</h2>
                </div>
            </div>
            {[12, 27, 44, 61, 76, 90].map((left, index) => (
                <span key={left} aria-hidden="true" className={classNames("amulet-ember", index % 2 == 1 && "small")}
                    style={{left: left + "%", animationDelay: [0, 1.6, 3.1, 0.8, 2.4, 3.8][index] + "s"}}></span>
            ))}
            <p className="amulet-flavour">Give up everything, max levels included, for evil, which powers Dark magic.</p>
            <div className="amulet-road">
                <div className="amulet-road-line">
                    <span>Reach age {EVIL_AGE}</span>
                    <span className="amulet-road-age"><strong>{age}</strong> / {EVIL_AGE}</span>
                </div>
                <div role="img" aria-label={"Age " + age + " of " + EVIL_AGE} className="amulet-track">
                    <div style={{width: progress * 100 + "%"}}></div>
                </div>
            </div>
            {lifespan < EVIL_AGE ? (
                <div className="amulet-hint">
                    <h3 className="card-label">The road there</h3>
                    <p>
                        {stretched
                            ? <>Immortality has stretched your lifespan to {lifespan}, <b>×{immortality.getEffect().toFixed(1)}</b>.</>
                            : <>Your lifespan is {lifespan}. Immortality is what stretches it.</>}
                    </p>
                    <p className="amulet-hint-note">
                        {isUnlocked("immortality")
                            ? <>Keep training Immortality to reach {EVIL_AGE}.</>
                            : <>Immortality unlocks with <b>{immortalityNeeds.name} {immortalityNeeds.level}</b>, through {immortalityNeeds.place}.</>}
                    </p>
                </div>
            ) : (
                <div className="amulet-hint">
                    <h3 className="card-label">The road there</h3>
                    <p>Your lifespan is {lifespan}, long enough to reach {EVIL_AGE}.</p>
                </div>
            )}
            <div className="amulet-reward">
                <span>Reward</span>
                <strong className="amulet-throb">+{getEvilGain().toFixed(1)} evil</strong>
            </div>
        </section>
    )
}

// The eye on the amulet: it blinks and glances about (css/styles.css)
function EyeEmblem() {
    return (
        <svg role="img" aria-label="The amulet's eye, watching" width="56" height="56" viewBox="0 0 56 56" className="amulet-emblem">
            <defs><clipPath id="amulet-eye-clip"><path d="M12 28 Q28 13 44 28 Q28 43 12 28 Z"></path></clipPath></defs>
            <circle cx="28" cy="28" r="26" className="amulet-gold-line" strokeWidth="2"></circle>
            <circle cx="28" cy="28" r="21" className="amulet-gold-line" strokeWidth="1" opacity="0.5"></circle>
            <g className="amulet-lid">
                <path d="M12 28 Q28 13 44 28 Q28 43 12 28 Z" className="amulet-eye-white" strokeWidth="1.5"></path>
                <g clipPath="url(#amulet-eye-clip)">
                    <g className="amulet-iris">
                        <circle cx="28" cy="28" r="6.5" className="amulet-gold-fill"></circle>
                        <circle cx="28" cy="28" r="2.6" className="amulet-dark-fill"></circle>
                    </g>
                </g>
            </g>
        </svg>
    )
}

// The grinning mouth: a rune ring that turns, glaring brows and fangs
function EvilEmblem() {
    return (
        <svg role="img" aria-label="The amulet's mouth, grinning with too many teeth" width="56" height="56" viewBox="0 0 56 56"
            className="amulet-emblem amulet-flicker">
            <circle cx="28" cy="28" r="26" className="amulet-evil-line" strokeWidth="2"></circle>
            <g className="amulet-turn">
                <circle cx="28" cy="28" r="22.5" className="amulet-evil-line" strokeWidth="1.2" strokeDasharray="1 3.2 4 3.2" opacity="0.7"></circle>
            </g>
            <g className="amulet-glare">
                <path d="M13.5 18.5 L25 23.6 L16 24.6 Z" className="amulet-evil-fill"></path>
                <path d="M42.5 18.5 L31 23.6 L40 24.6 Z" className="amulet-evil-fill"></path>
            </g>
            <g className="amulet-sneer">
                <path d="M10 28 Q28 34 46 28 Q28 54 10 28 Z" className="amulet-mouth" strokeWidth="1.6" strokeLinejoin="round"></path>
                <path d="M14.3 29.0 L15.5 32.0 L16.7 29.5 Z M18.2 29.8 L19.5 33.5 L20.8 30.2 Z M21.4 30.3 L23.0 37.2 L24.6 30.6 Z M25.7 30.7 L27.0 34.4 L28.3 30.7 Z M27.7 30.7 L29.0 34.4 L30.3 30.7 Z M31.4 30.6 L33.0 37.2 L34.6 30.3 Z M35.2 30.2 L36.5 33.5 L37.8 29.8 Z M39.3 29.5 L40.5 32.0 L41.7 29.0 Z M16.3 35.8 L17.5 34.4 L18.7 37.8 Z M19.8 38.6 L21.0 36.2 L22.2 40.0 Z M24.2 40.7 L25.5 37.7 L26.8 41.2 Z M29.2 41.2 L30.5 37.7 L31.8 40.7 Z M33.8 40.0 L35.0 36.2 L36.2 38.6 Z M37.3 37.8 L38.5 34.4 L39.7 35.8 Z" className="amulet-evil-fill"></path>
                <path d="M8 26.5 L10 28 M48 26.5 L46 28" className="amulet-evil-line" strokeWidth="1.6" strokeLinecap="round"></path>
            </g>
        </svg>
    )
}
