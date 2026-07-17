# Kickball Game Day

A dependency-free, phone-friendly kickball lineup and inning-by-inning fielding planner built for GitHub Pages.

**Website:** [https://ktsotraspaymore.github.io/Kickball-Lineup-Builder/](https://ktsotraspaymore.github.io/Kickball-Lineup-Builder/)

## Features

- Alternating female/male kicking rotation that supports unequal roster sizes
- Multiple named team rosters, saved automatically in the browser
- An explicit team-editing mode for renaming teams and adding or removing roster members
- Rosters stay alphabetized by player name and are attached to their selected team
- Add or remove saved roster members from a game lineup with one tap outside team-editing mode
- Roster and substitute player names remain linked and read-only after they are added to a lineup
- Multiple saved lineups per team for doubleheaders and other multi-game days
- New games inherit the previous game's kicking order while starting with blank fielding assignments
- Save named female or male substitutes with a team while editing its roster
- Keep substitutes in a separate section with playable-position choices and add or remove them from a game lineup with one tap
- Current, on-deck, and in-the-hole kicker status that alternates genders while rotating each gender independently, even when gender counts are uneven
- Current-inning control above the current kicker within the lineup
- Locked lineups start with the first player as current kicker and hide completed innings as the current inning advances
- Nine innings by default, with support for adjusting the game length
- Inning-by-inning assignments for the nine standard baseball positions, **Rover**, and **Bench**
- Choose every position each roster member can play, then autogenerate valid inning-by-inning defense with scarce-position players assigned first
- Automatically balanced bench rotations when the lineup exceeds the available fielding spots or the five-male limit
- Field no more than five male players per inning while using every available male player when there are fewer than five
- Prefer substitutes for extra bench time while continuing to rotate the rest of the lineup
- Positions already assigned in an inning are disabled for every other player
- Sticky player-name column and table header for easier phone use
- Reorder and remove players
- Lock the completed lineup to replace editing controls with easy-to-read text until it is unlocked
- Browser save/load and JSON import/export for all teams and lineups
- Print or save a landscape PDF containing only the lineup and fielding assignments
- Share a read-only live lineup link with the team or a separate co-captain link for full two-way roster, lineup, game, current-inning, and kicking-progress edits (the owner’s sharing page must remain open)

## Publish with GitHub Pages

1. Upload `index.html` to the repository root.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select the `main` branch and `/ (root)`, then save.

No build step, framework, package manager, or application server is required. Live co-captain sharing loads PeerJS from jsDelivr and uses its public signaling service to connect both browsers directly.
