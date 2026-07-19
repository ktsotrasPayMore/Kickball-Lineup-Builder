# Kickball Game Day

A dependency-free, phone-friendly kickball lineup and inning-by-inning fielding planner built for GitHub Pages.

**Website:** [https://ktsotraspaymore.github.io/Kickball-Lineup-Builder/](https://ktsotraspaymore.github.io/Kickball-Lineup-Builder/)

## Features

- Alternating female/male kicking rotation that supports unequal roster sizes
- Multiple named team rosters, saved automatically in the browser
- An explicit team-editing mode for renaming teams and adding or removing roster members
- Rosters stay alphabetized by player name and are attached to their selected team
- Add or remove saved roster members from a game lineup with one tap outside team-editing mode; deleting an unlocked roster member also removes them from lineups, while locked lineup members are protected
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
- Choose every position each roster member can play, then autogenerate valid inning-by-inning defense with scarce-position players assigned first while preserving assignments already entered
- Automatically balanced bench rotations when the lineup exceeds the available fielding spots or the five-male limit
- Field no more than five male players per inning while using every available male player when there are fewer than five
- Prefer substitutes for extra bench time while continuing to rotate the rest of the lineup
- Positions already assigned in an inning are disabled for every other player
- Sticky player-name column and table header for easier phone use
- Reorder and remove players
- Lock only a fully assigned lineup to replace editing controls with easy-to-read text and prevent deleting the lineup or clearing its positions until it is unlocked
- Clear all fielding positions without changing the kicking lineup
- Browser save/load and JSON import/export for all teams and lineups
- Print or save a landscape PDF containing only the lineup and fielding assignments
- Share a read-only live lineup link with the team or a separate co-captain link for full two-way roster, lineup, game, current-inning, and kicking-progress edits (the owner’s sharing page must remain open)
- Password-protected, unlinked admin dashboard for viewing saved rosters, lineups, and anonymous visit activity

## Configure the admin dashboard

The dashboard lives at `admin.html`, but the public builder does not link to or reveal that path. Hiding the address is only a convenience; Supabase Authentication and row-level security provide the actual access control.

1. Create a [Supabase](https://supabase.com/) project.
2. Under **Authentication → Users**, create the administrator user with the email and password you want to use. Never add that password to this repository.
3. Open the **SQL Editor** and run `supabase-admin.sql`. Then run the final commented `insert` statement with the administrator user's UUID. This creates the reporting tables and policies: anonymous visitors can only add reporting records, while only explicitly allowlisted administrators can read them. Creating another authenticated account does not grant dashboard data access.
4. In **Project Settings → API**, copy the project URL and publishable/anon key into `admin-config.js`. The anon key is designed to be public; keep the service-role key private and never put it in this site.
5. Publish the site and navigate directly to `/admin.html`. Sign in with the administrator account created above.

The builder continues to work entirely in local storage if Supabase is not configured or cannot be reached. Once configured, it records a random browser identifier, visit time, page, referrer, user agent, and a copy of locally saved team/lineup data. It does not collect a visitor’s name, email address, or IP address in application tables. Add an appropriate privacy notice for your jurisdiction before enabling reporting publicly.

## Publish with GitHub Pages

1. Upload `index.html` to the repository root.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select the `main` branch and `/ (root)`, then save.

No build step, framework, package manager, or application server is required. Live co-captain sharing loads PeerJS from jsDelivr and uses its public signaling service to connect both browsers directly.
