(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SharedTeam = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function mergeLineups(localLineups, remoteLineups, localDeletedAt = {}, remoteDeletedAt = {}) {
    const deletedAt = { ...remoteDeletedAt };
    for (const [id, timestamp] of Object.entries(localDeletedAt)) {
      deletedAt[id] = Math.max(Number(timestamp) || 0, Number(deletedAt[id]) || 0);
    }

    const byId = new Map(remoteLineups.map(lineup => [lineup.id, lineup]));
    for (const lineup of localLineups) {
      const remote = byId.get(lineup.id);
      if (!remote || (lineup.updatedAt || 0) > (remote.updatedAt || 0)) byId.set(lineup.id, lineup);
    }

    const lineups = [...byId.values()].filter(lineup =>
      (Number(deletedAt[lineup.id]) || 0) < (Number(lineup.updatedAt) || 0)
    );
    return { lineups, deletedAt };
  }

  return { mergeLineups };
});
