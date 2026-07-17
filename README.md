# Kickball Game Day

A dependency-free, phone-friendly kickball lineup and inning-by-inning fielding planner built for GitHub Pages.

**Website:** [https://ktsotraspaymore.github.io/Kickball-Lineup-Builder/](https://ktsotraspaymore.github.io/Kickball-Lineup-Builder/)

## Features

- Alternating female/male kicking rotation that supports unequal roster sizes
- Multiple named team rosters, saved automatically in the browser
- An explicit team-editing mode for renaming teams and adding or removing roster members
- Rosters stay alphabetized by player name and are attached to their selected team
- Add saved roster members to a game lineup with one tap
- Roster player names remain linked and read-only in lineups, while game-day substitute names can be entered freely
- Multiple saved lineups per team for doubleheaders and other multi-game days
- New games inherit the previous game's kicking order while starting with blank fielding assignments
- Add a female or male sub for the current game without saving them to the permanent roster
- One next-kicker control that alternates genders while rotating each gender independently, even when gender counts are uneven
- Current-inning control above the next kicker within the lineup
- Locked lineups start with the first player as next kicker and hide completed innings as the current inning advances
- Nine innings by default, with support for adjusting the game length
- Inning-by-inning assignments for the nine standard baseball positions, **Rover**, and **Bench**
- Choose every position each roster member can play, then autogenerate valid inning-by-inning defense with scarce-position players assigned first
- Automatically balanced bench rotations when more than 10 players are in the lineup; lineups of 10 or fewer never bench a player
- Positions already assigned in an inning are disabled for every other player
- Sticky player-name column and table header for easier phone use
- Reorder and remove players
- Lock the completed lineup to replace editing controls with easy-to-read text until it is unlocked
- Browser save/load and JSON import/export for all teams and lineups
- Print or save a landscape PDF containing only the lineup and fielding assignments

## Publish with GitHub Pages

1. Upload `index.html` to the repository root.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select the `main` branch and `/ (root)`, then save.

No build step, framework, package manager, or server is required.
