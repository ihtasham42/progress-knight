# Progress Knight Evolved

A continuation of [Progress Knight](https://github.com/ihtasham42/progress-knight) by Ihtasham42.

**Play it here: https://a-crawley.github.io/progress-knight-evolved/**

Saves and export strings from the original game can be imported and are upgraded automatically.

### Development
The game is built with [Vite](https://vite.dev/). You need Node.js 22 or later.

- `npm install`: install the tools
- `npm run dev`: run the game locally with live reloading (open the address it prints)
- `npm test`: unit tests (Vitest)
- `npm run test:e2e`: browser tests (Playwright); run `npx playwright install chromium` once first
- `npm run lint`: lint
- `npm run build`: build the site into `dist/`; `npm run preview` serves the build

The game logic and data are in `src/game/` and don't touch the page; the page code is in `src/ui/`. Game data (jobs, skills, items and unlocks) lives in `src/game/data.js`; the format is documented at the top of that file.

Pushes to `main` are published to GitHub Pages automatically.

---

# Progress Knight

### Introduction
Progress Knight is a text-based incremental game, developed by Ihtasham42, which can be played on your browser.

### What is Progress Knight about?
Progress Knight is a life-sim incremental based in a fantasy/medieval setting, where you must progress through the career ladder and acquire new skills to become the ultimate being.

You first start off as a beggar, barely being able to feed yourself as the days go by. However, over the years you learn new skills and gain plenty of work experience to enter new high paying jobs while managing your living expenses...

Will you decide to take the easy route of doing simple commoner work? Or will you go through harsh training to climb the ranks within the military? Or maybe will you decide to study hard and enrol in a magic academy, learning life-impacting spells? Your career path is open-ended, the decision is up to you.

Eventually, your age will catch up to you. You will be given an option to prestige and gain xp multipliers (based on the performance of your current life) for your next life at the cost of losing all your levels and assets. Fear not though, as you will re-gain your levels much, much more quickly than in your previous life...

### Where can I play the original Progress Knight?
The original game can be played on the following sites:  
- [Github Pages](https://ihtasham42.github.io/progress-knight/)  
- [Armor Games](https://armorgames.com/progress-knight-game/19095)
- [Crazy Games](https://www.crazygames.com/game/progress-knight)
