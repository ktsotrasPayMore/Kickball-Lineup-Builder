# Kickball Game Day

A dependency-free, phone-friendly kickball lineup and inning-by-inning fielding planner built for GitHub Pages.

**Website:** [https://ktsotraspaymore.github.io/Kickball-Lineup-Builder/](https://ktsotraspaymore.github.io/Kickball-Lineup-Builder/)

## Features

- Alternating female/male kicking rotation that supports unequal roster sizes
- Persistent team roster with player names and genders, saved automatically in the browser
- Add saved roster members to a game lineup with one tap
- Add a female or male sub for the current game without saving them to the permanent roster
- Next-kicker and current-inning controls within the lineup when gender counts are even
- A compact next-kicker control for each gender when player counts are uneven
- Nine innings by default, with support for adjusting the game length
- Inning-by-inning assignments for the nine standard baseball positions, **Rover**, and **Bench**
- Positions already assigned in an inning are disabled for every other player
- Sticky player-name column and table header for easier phone use
- Reorder and remove players
- Browser save/load and JSON import/export
- Print or save a landscape PDF containing only the lineup and fielding assignments

## Publish with GitHub Pages

1. Upload `index.html` to the repository root.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select the `main` branch and `/ (root)`, then save.

No build step, framework, package manager, or server is required.
