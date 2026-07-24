const assert = require("node:assert/strict");
const { nextKicker } = require("../kicking-order.js");

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

console.log("Kicking order tests passed.");
