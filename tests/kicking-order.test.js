const assert = require("node:assert/strict");
const { createLineupSnapshot, lineupMatchesSnapshot, nextKicker, restoreLineupSnapshot } = require("../kicking-order.js");

const players = [
  { id: "f1", gender: "Female" },
  { id: "f2", gender: "Female" },
  { id: "m1", gender: "Male" },
  { id: "m2", gender: "Male" },
];

function rotation(straightThru, count) {
  const progress = {
    lastKicker: { Female: null, Male: null },
    lastGender: null,
    lastStraightKicker: null,
  };
  return Array.from({ length: count }, () => {
    const result = nextKicker(players, progress, straightThru);
    if (straightThru) progress.lastStraightKicker = result.next.id;
    else {
      progress.lastKicker[result.next.gender] = result.next.id;
      progress.lastGender = result.next.gender;
    }
    return result.next.id;
  });
}

assert.deepEqual(rotation(false, 8), ["f1", "m1", "f2", "m2", "f1", "m1", "f2", "m2"]);
assert.deepEqual(rotation(true, 4), ["f1", "f2", "m1", "m2"]);

const oneGenderProgress = { lastKicker: { Female: null, Male: null }, lastGender: "Female", lastStraightKicker: null };
assert.equal(nextKicker(players.filter(player => player.gender === "Female"), oneGenderProgress, false).next.id, "f1");

const lineup = {
  innings: 2,
  currentInning: 2,
  straightThru: false,
  players: [
    { id: "f1", name: "Fran", gender: "Female", eligiblePositions: ["P"], positions: ["P", "Bench"] },
    { id: "m1", name: "Mo", gender: "Male", eligiblePositions: ["1B"], positions: ["1B", "P"] },
  ],
};
const lockedSnapshot = createLineupSnapshot(lineup);
lineup.players.reverse();
lineup.players[0].positions[0] = "Bench";
lineup.straightThru = true;
assert.equal(lineupMatchesSnapshot(lineup, lockedSnapshot), false);
assert.equal(restoreLineupSnapshot(lineup, lockedSnapshot), true);
assert.equal(lineupMatchesSnapshot(lineup, lockedSnapshot), true);
assert.deepEqual(lineup.players.map(player => player.id), ["f1", "m1"]);
assert.deepEqual(lineup.players[0].positions, ["P", "Bench"]);

// The snapshot must not share nested arrays with the editable lineup.
lineup.players[0].positions[0] = "C";
assert.equal(lockedSnapshot.players[0].positions[0], "P");

console.log("Kicking order tests passed.");
