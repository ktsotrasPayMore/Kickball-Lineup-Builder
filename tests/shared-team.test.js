const assert = require("node:assert/strict");
const { isBlankLineup, mergeLineups, renumberLineups } = require("../shared-team.js");

const oldGame = { id: "old", updatedAt: 100 };
const currentGame = { id: "current", updatedAt: 300 };

// A co-captain's deletion must beat the stale copy still held by the owner.
let merged = mergeLineups([currentGame], [oldGame, currentGame], { old: 200 }, {});
assert.deepEqual(merged.lineups.map(game => game.id), ["current"]);
assert.equal(merged.deletedAt.old, 200);

// The tombstone must survive another merge so polling cannot restore the game.
merged = mergeLineups(merged.lineups, [oldGame, currentGame], merged.deletedAt, {});
assert.deepEqual(merged.lineups.map(game => game.id), ["current"]);

// A genuinely newer edit may restore a game after an earlier deletion.
const restoredGame = { id: "old", updatedAt: 400 };
merged = mergeLineups([restoredGame, currentGame], [currentGame], { old: 200 }, { old: 200 });
assert.deepEqual(merged.lineups.map(game => game.id).sort(), ["current", "old"]);

const datedGames = [
  { id: "one", name: "Game 1", gameDate: "2026-09-25", updatedAt: 10 },
  { id: "three", name: "Game 3", gameDate: "2026-09-25", updatedAt: 10 },
  { id: "other", name: "Game 1", gameDate: "2026-09-26", updatedAt: 10 }
];
renumberLineups(datedGames, "2026-09-25", 20);
assert.deepEqual(datedGames.map(game => game.name), ["Game 1", "Game 2", "Game 1"]);
assert.equal(datedGames[1].updatedAt, 20);
assert.equal(datedGames[2].updatedAt, 10);

assert.equal(isBlankLineup({ players: [], inningElapsedSeconds: Array(9).fill(0) }), true);
assert.equal(isBlankLineup({ players: [{ id: "player" }], inningElapsedSeconds: [] }), false);
assert.equal(isBlankLineup({ players: [], opponent: "Visitors", inningElapsedSeconds: [] }), false);
assert.equal(isBlankLineup({ players: [], gameStarted: true, inningElapsedSeconds: [] }), false);

console.log("Shared team tests passed.");
