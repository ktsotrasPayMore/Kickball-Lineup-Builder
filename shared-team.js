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

  function isBlankLineup(lineup) {
    return !lineup.players?.length &&
      !String(lineup.opponent || "").trim() &&
      !String(lineup.gameLocation || "").trim() &&
      !lineup.lineupLocked &&
      !lineup.lastLockedLineup &&
      !lineup.gameStarted &&
      !lineup.gameEnded &&
      !lineup.totalKicks &&
      !(lineup.inningElapsedSeconds || []).some(seconds => Number(seconds) > 0);
  }

  function renumberLineups(lineups, date, updatedAt = Date.now()) {
    lineups.filter(lineup => lineup.gameDate === date).forEach((lineup, index) => {
      const name = `Game ${index + 1}`;
      if (lineup.name === name) return;
      lineup.name = name;
      lineup.updatedAt = Math.max((Number(lineup.updatedAt) || 0) + 1, updatedAt);
    });
  }

  function moveLineupToDate(lineups, lineup, date, updatedAt = Date.now()) {
    if (!lineup || !date || lineup.gameDate === date) return false;
    const previousDate = lineup.gameDate;
    const previousIndex = lineups.indexOf(lineup);
    if (previousIndex >= 0) {
      lineups.splice(previousIndex, 1);
      const lastTargetIndex = lineups.reduce((last, candidate, index) => candidate.gameDate === date ? index : last, -1);
      lineups.splice(lastTargetIndex >= 0 ? lastTargetIndex + 1 : lineups.length, 0, lineup);
    }
    lineup.gameDate = date;
    lineup.updatedAt = Math.max((Number(lineup.updatedAt) || 0) + 1, updatedAt);
    renumberLineups(lineups, previousDate, updatedAt);
    renumberLineups(lineups, date, updatedAt);
    return true;
  }

  function sharedLineupId(lineups, requestedLineupId, activeLineupId) {
    if (lineups.some(lineup => lineup.id === requestedLineupId)) return requestedLineupId;
    if (lineups.some(lineup => lineup.id === activeLineupId)) return activeLineupId;
    return lineups[0]?.id || null;
  }

  return { isBlankLineup, mergeLineups, moveLineupToDate, renumberLineups, sharedLineupId };
});
