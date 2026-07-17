# Kickball Game Day

A dependency-free, phone-friendly kickball lineup and inning-by-inning fielding planner built for GitHub Pages.

**Website:** [https://ktsotraspaymore.github.io/Kickball-Lineup-Builder/](https://ktsotraspaymore.github.io/Kickball-Lineup-Builder/)

## Features

- Alternating female/male kicking rotation that supports unequal roster sizes
- Persistent team roster with player names and genders, saved automatically in the browser
- Add saved roster members to a game lineup with one tap
- Add a female or male sub for the current game without saving them to the permanent roster
- One next-kicker control that alternates genders while rotating each gender independently, even when gender counts are uneven
- Current-inning control above the next kicker within the lineup
- Nine innings by default, with support for adjusting the game length
- Inning-by-inning assignments for the nine standard baseball positions, **Rover**, and **Bench**
- Positions already assigned in an inning are disabled for every other player
- Sticky player-name column and table header for easier phone use
- Reorder and remove players
- Lock the completed lineup to replace editing controls with easy-to-read text until it is unlocked
- Browser save/load and JSON import/export
- Print or save a landscape PDF containing only the lineup and fielding assignments

## Publish with GitHub Pages

1. Upload `index.html` to the repository root.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select the `main` branch and `/ (root)`, then save.

No build step, framework, package manager, or server is required.
