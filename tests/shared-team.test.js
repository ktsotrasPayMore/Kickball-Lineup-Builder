const assert = require("node:assert/strict");
const { mergeLineups } = require("../shared-team.js");

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

console.log("Shared team tests passed.");
