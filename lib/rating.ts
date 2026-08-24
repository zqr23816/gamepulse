export function eloDelta(winnerRating: number, loserRating: number, k = 32) {
  const expectedWinner = 1 / (1 + 10 ** ((loserRating - winnerRating) / 400));
  const winnerDelta = Math.round(k * (1 - expectedWinner));
  return { winnerDelta, loserDelta: -winnerDelta };
}

export function stableEventId(idempotencyKey: string, index: number) {
  let hash = 2166136261;
  const source = `${idempotencyKey}:${index}`;
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `evt_${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

