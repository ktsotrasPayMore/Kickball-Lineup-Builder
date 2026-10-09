const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const SharedTeam = require("../shared-team.js");

const html = fs.readFileSync(require.resolve("../index.html"), "utf8");
const source = html.slice(html.indexOf("    function sharedPayload("), html.indexOf("    async function copyShareLink("));

function setup({ sharedView = false, viewToken = "stale-view-token" } = {}) {
  const savedTeam = { id: "team", activeLineupId: "game", lineups: [{ id: "game", players: [{ name: "Alex" }] }] };
  const storage = new Map([["kickballShare:team", JSON.stringify({ id: "share", editToken: "edit-token", viewToken })]]);
  let serverViewToken = "current-view-token";
  const calls = [];
  const elements = new Map();
  const context = vm.createContext({
    SharedTeam, JSON, Date, console, crypto: require("node:crypto").webcrypto,
    state: { teams: [savedTeam], activeTeamId: "team" },
    sharedView, readOnlyView: false, sharedSession: sharedView ? { id: "share", token: "edit-token", viewToken, teamId: "team" } : null,
    sharedSaveTimer: null, sharedPollTimer: null, sharedRequestPending: false, lastSharedPayload: "",
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    team: () => context.state.teams[0],
    uid: () => "new-share", randomToken: () => "replacement-view-token",
    normalizeTeam: data => JSON.parse(JSON.stringify(data)),
    render: () => {}, showToast: message => { context.toast = message; },
    $: id => { if (!elements.has(id)) elements.set(id, {}); return elements.get(id); },
    document: { body: { classList: { add() {} } } },
    setInterval: () => 1, clearInterval() {}, setTimeout: () => 1, clearTimeout() {},
    adminConfig: {}, adminHeaders: {}, KickingOrder: {}, esc: value => value,
  });
  vm.runInContext(source, context);
  context.sharedRpc = async (name, body) => {
    calls.push({ name, body });
    if (name === "get_shared_team") {
      if (body.p_access_token === "edit-token" || body.p_access_token === serverViewToken) return [{ payload: { version: 9, team: savedTeam }, can_edit: body.p_access_token === "edit-token" }];
      return [];
    }
    if (name === "update_shared_view_token") serverViewToken = body.p_view_token;
  };
  return { context, calls, storage, elements };
}

(async () => {
  for (const sharedView of [false, true]) {
    const { context, calls } = setup({ sharedView });
    const credentials = await context.ensureSharedTeam();
    const result = await context.sharedRpc("get_shared_team", { p_share_id: credentials.id, p_access_token: credentials.viewToken });
    assert.equal(result.length, 1, "The generated read-only token must actually load the team");
    assert.equal(credentials.editToken, "edit-token");
    assert.equal(calls.filter(call => call.name === "update_shared_view_token").length, 1);
  }
  const missing = setup({ sharedView: true, viewToken: null });
  assert.ok((await missing.context.ensureSharedTeam()).viewToken);

  const missingOwner = setup({ viewToken: null });
  assert.equal((await missingOwner.context.ensureSharedTeam()).id, "share", "Repair a missing viewer token without replacing the co-captain share");
  assert.equal(missingOwner.calls.some(call => call.name === "create_shared_team"), false);

  const offline = setup();
  offline.context.sharedRpc = async () => { throw new Error("Network unavailable"); };
  await assert.rejects(offline.context.ensureSharedViewToken("share", "edit-token", "current-view-token"), /Network unavailable/);

  const editorToken = setup({ viewToken: "edit-token" });
  const safe = await editorToken.context.ensureSharedTeam();
  assert.notEqual(safe.viewToken, safe.editToken, "Viewer links must never grant editing access");

  const valid = setup({ viewToken: "current-view-token" });
  await valid.context.ensureSharedTeam();
  assert.equal(valid.calls.some(call => call.name === "update_shared_view_token"), false, "Keep working viewer links valid");

  const invalid = setup({ sharedView: true });
  invalid.context.readOnlyView = true;
  invalid.context.sharedSession.token = "stale-view-token";
  await invalid.context.pollSharedLineup();
  assert.match(invalid.elements.get("lineupBody")?.innerHTML || "", /unavailable|expired|invalid/i, "An invalid link must not appear to be an empty game");
  assert.equal(invalid.context.sharedRequestPending, false);
  const viewer = setup({ sharedView: true, viewToken: "current-view-token" });
  viewer.context.readOnlyView = true;
  viewer.context.sharedSession.lineupId = "selected";
  const incoming = { version: 9, team: { id: "team", activeLineupId: "blank", lineups: [
    { id: "blank", players: [], updatedAt: 100 },
    { id: "selected", players: [{ name: "Alex", positions: ["P"] }], updatedAt: 0 }
  ] } };
  viewer.context.receiveSharedLineup(incoming);
  assert.equal(viewer.context.state.teams[0].activeLineupId, "selected");
  assert.equal(viewer.context.state.teams[0].lineups[1].players[0].name, "Alex");
  viewer.context.state.teams[0].lineups[1] = { id: "selected", players: [], updatedAt: 9999 };
  incoming.team.lineups[1].players[0].positions = ["C"];
  viewer.context.receiveSharedLineup(incoming);
  assert.equal(viewer.context.state.teams[0].lineups[1].players[0].positions[0], "C", "Read-only polling must use the server lineup rather than merge a stale local copy");
  console.log("Share link tests passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
