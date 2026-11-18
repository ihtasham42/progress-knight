// A season's icon, in the season's colour: a sun for Summer, a snowflake for
// Winter. It is decoration: the season's name is always written next to it.

import type { SeasonId } from "../game/data.ts"

export function SeasonIcon({season, size = 16}: {season: SeasonId, size?: number}) {
    return (
        <svg className="season-icon" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" data-season={season}
            style={{color: "var(--pk-season-" + season + ")"}}>
            {season == "summer" ? (
                <>
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </>
            ) : (
                <path d="M12 2v20M3.3 7l17.4 10M3.3 17l17.4-10M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5M3.6 10.4l3.4-.9-.9-3.4M20.4 13.6l-3.4.9.9 3.4M3.6 13.6l3.4.9-.9 3.4M20.4 10.4l-3.4-.9.9-3.4" />
            )}
        </svg>
    )
}
