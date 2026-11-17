// The Amulet tab: notes revealed as the player ages, and the two rebirths.

import { getEvilGain, isUnlocked, rebirthOne, rebirthTwo } from "../game/engine.ts"
import { requestRender, useGame } from "./gameStore.ts"
import { classNames } from "./classNames.ts"

export function AmuletTab() {
    useGame()
    return (
        <ul>
            {" "}
            <li style={{margin: "8px"}}>
                You stumble across a strange looking amulet on your 25th birthday. It does not look like
                it has any worth on the market given that it&apos;s made from cheap-looking copper. However, you
                feel a weird urge to keep the amulet, so you slip it into your pocket for safekeeping.
            </li>
            {" "}
            <li style={{margin: "8px"}} id="rebirthNote1" className={classNames(!isUnlocked("rebirth_note_1") && "hidden")}>
                On your 45th birthday, you feel the amulet shiver uncontrollably in your pocket. You take it
                out and the constant shivering suddenly stops. More to your bizarre surprise, you notice
                a strange etching on the centre of the amulet.
            </li>
            {" "}
            <li style={{margin: "8px"}} id="rebirthNote2" className={classNames(!isUnlocked("rebirth_note_2") && "hidden")}>
                {" "}
                <div style={{marginBottom: "8px"}}>
                    On your 65th birthday, you once again encounter the strange, unexplained shivering from your
                    amulet. But this time, a living eyeball emerges from the centre. Although terribly frightened,
                    you realise you do not have many years to live left anyway so you consider touching the eye
                    to see what happens.
                </div>
                {" "}
                <i style={{color: "grey"}}>
                    {" "}By touching the eyeball, you will be reborn and have to restart life again, losing all your levels and coins.
                    However, you will gain <b>xp multipliers</b> for your jobs and skills equivalent to: <b>1 + the max level of the skill or job / 10.</b>{" "}
                    This means you will learn everything again much more quickly than you did in your previous life. <span style={{color: "rgb(200, 0, 0)"}}>
                        {" "}Something tells you that the amulet might transform even further after living for <b>2 whole centuries</b>...</span>{" "}
                </i>
                {" "}
                <br />
                {" "}
                <button id="rebirthOneButton" className="w3-button button" style={{marginBottom: "8px", marginTop: "8px"}}
                    onClick={() => {rebirthOne(); requestRender()}}>Touch the eye</button>
                {" "}
                <br />
                {" "}
            </li>
            {" "}
            <li style={{margin: "8px"}} id="rebirthNote3" className={classNames(!isUnlocked("rebirth_note_3") && "hidden")}>
                {" "}
                <div style={{marginBottom: "8px"}}>
                    Your gut instinct was right. The moment you hit the grand age of 200, you hear an ominous hum coming from the amulet.
                    A mouth emerges from its surface and begins to cackle, and proceeds to say: &quot;So you&apos;ve made it this far... Are you ready to embrace evil?&quot;
                </div>
                {" "}
                <i style={{color: "rgb(200, 0, 0)"}}>
                    {" "}If you decide to embrace evil, all of your levels, coins and even max levels will be reset.
                    You will be reborn as a fresh slate. However, you will unlock a new line of skills and gain{" "}
                    <b><span id="evilGainDisplay">{getEvilGain().toFixed(1)}</span> evil</b>, which will heavily impact your future lives.{" "}
                </i>
                {" "}
                <br />
                {" "}
                <button id="rebirthTwoButton" className="w3-button button" style={{marginBottom: "8px", marginTop: "8px"}}
                    onClick={() => {rebirthTwo(); requestRender()}}>Embrace evil</button>
                {" "}
                <br />
                {" "}
            </li>
            {" "}
        </ul>
    )
}
