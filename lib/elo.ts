const K = 32;

/**
 * Calculate new ELO rating.
 * @param rating - current player rating
 * @param opponentRating - opponent's current rating
 * @param score - 1 = win, 0.5 = draw, 0 = loss
 */
export function calcElo(rating: number, opponentRating: number, score: 0 | 0.5 | 1): number {
  const expected = 1 / (1 + Math.pow(10, (opponentRating - rating) / 400));
  return Math.round(rating + K * (score - expected));
}
