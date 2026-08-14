(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.KickingOrder = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function nextKicker(players, progress, straightThru) {
    if (!players.length) return { next: null, nextGender: null };

    if (straightThru) {
      const current = players.findIndex(player => player.id === progress.lastStraightKicker);
      const next = players[(current + 1) % players.length];
      return { next, nextGender: next.gender };
    }

    const playersFor = gender => players.filter(player => player.gender === gender);
    const nextFor = gender => {
      const list = playersFor(gender);
      if (!list.length) return null;
      const current = list.findIndex(player => player.id === progress.lastKicker[gender]);
      return list[(current + 1) % list.length];
    };

    if (!progress.lastGender) {
      const next = players[0];
      return { next, nextGender: next.gender };
    }

    // In normal mode, always try the opposite gender first. The same gender is
    // only used as a fallback when the lineup contains nobody of the other gender.
    const wantedGender = progress.lastGender === "Female" ? "Male" : "Female";
    const next = nextFor(wantedGender);
    if (next) return { next, nextGender: wantedGender };

    const fallback = nextFor(progress.lastGender);
    return { next: fallback, nextGender: fallback?.gender || null };
  }

  function createLineupSnapshot(lineup) {
    return {
      innings: lineup.innings,
      straightThru: Boolean(lineup.straightThru),
      players: lineup.players.map(player => ({
        ...player,
        eligiblePositions: [...player.eligiblePositions],
        positions: [...player.positions],
      })),
    };
  }

  function lineupMatchesSnapshot(lineup, snapshot) {
    if (!snapshot) return true;
    return JSON.stringify(createLineupSnapshot(lineup)) === JSON.stringify(snapshot);
  }

  function restoreLineupSnapshot(lineup, snapshot) {
    if (!snapshot) return false;
    const restored = createLineupSnapshot(snapshot);
    lineup.innings = restored.innings;
    lineup.straightThru = restored.straightThru;
    lineup.players = restored.players;
    lineup.currentInning = Math.min(lineup.currentInning, lineup.innings);
    return true;
  }

  return { nextKicker, createLineupSnapshot, lineupMatchesSnapshot, restoreLineupSnapshot };
});
