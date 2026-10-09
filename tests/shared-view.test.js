const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const html = fs.readFileSync(require.resolve("../index.html"), "utf8");
const script = html.slice(html.indexOf("    const FIELD_POSITIONS"), html.indexOf("    let adminSyncTimer;"));
const sharedFunctions = html.split("\n").filter(line =>
  /^    function (mergeSharedTeam|receiveSharedLineup)\(/.test(line)
).join("\n");
const context = vm.createContext({
  crypto: require("node:crypto"),
  document: { getElementById: () => ({}) },
  SharedTeam: require("../shared-team.js"),
  KickingOrder: require("../kicking-order.js"),
  render: () => {},
});
vm.runInContext(script + "\n" + sharedFunctions, context);
const run = code => vm.runInContext(code, context);
run(`
  sharedView = true;
  readOnlyView = true;
  sharedSession = { lineupId: "oct-eight" };
  state.teams = [normalizeTeam({ name: "Connecting…" })];
  state.activeTeamId = team().id;
`);
const saved = {
  team: {
    id: "team", name: "Team", activeLineupId: "oct-nine",
    lineups: [
      { id: "oct-eight", gameDate: "2026-10-08", players: [{ id: "player", name: "Alex" }] },
      { id: "oct-nine", gameDate: "2026-10-09" },
    ],
  },
};
context.saved = saved;
run("receiveSharedLineup(saved)");
assert.equal(run("game().gameDate"), "2026-10-08");
assert.equal(run("team().lineups.length"), 2);

// Older saved games lack updatedAt. A changed payload on the next poll must
// not discard them and replace them with a blank game dated today.
saved.team.name = "Renamed team";
run("receiveSharedLineup(saved)");
assert.equal(run("game().gameDate"), "2026-10-08");
assert.equal(run("game().players[0].name"), "Alex");
assert.equal(run("team().lineups.length"), 2);

// Read-only data is authoritative even if a stale local game has a newer clock.
run("game().updatedAt = Date.now(); game().gameDate = '2026-10-09'");
saved.team.name = "Updated team";
run("receiveSharedLineup(saved)");
assert.equal(run("game().gameDate"), "2026-10-08");

// Legacy links without a game ID use the saved active game, including after
// that game is removed remotely. They never retain a local placeholder.
run("sharedSession.lineupId = null");
saved.team.activeLineupId = "oct-eight";
run("receiveSharedLineup(saved)");
assert.equal(run("game().gameDate"), "2026-10-08");
saved.team.lineups.shift();
saved.team.activeLineupId = "oct-nine";
run("receiveSharedLineup(saved)");
assert.equal(run("game().id"), "oct-nine");
assert.equal(run("team().lineups.length"), 1);

// Editable sessions still merge their unsaved lineup edits during polling.
run("readOnlyView = false; game().updatedAt = Date.now(); game().gameDate = '2026-10-10'");
saved.team.name = "Another update";
run("receiveSharedLineup(saved)");
assert.equal(run("game().gameDate"), "2026-10-10");

const todaySource = html.split("\n").find(line => line.includes("const today ="));
const NativeDate = Date;
const fixedDate = class extends NativeDate {
  constructor() { super("2026-10-09T00:30:00Z"); }
};
const originalTimezone = process.env.TZ;
for (const [timezone, expected] of [
  ["America/New_York", "2026-10-08"],
  ["UTC", "2026-10-09"],
  ["Asia/Tokyo", "2026-10-09"],
]) {
  process.env.TZ = timezone;
  assert.equal(vm.runInNewContext(`${todaySource}\ntoday()`, { Date: fixedDate }), expected);
}
if (originalTimezone === undefined) delete process.env.TZ;
else process.env.TZ = originalTimezone;

console.log("Shared view tests passed.");
