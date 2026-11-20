// Public Plant Board ranking. Plain functions, no database, so they're testable and demo-safe.
// Bayesian average: every cafeteria starts with PRIOR_WEIGHT imaginary neutral (3-star) reviews,
// so one 5-star review can't beat twenty 4-star reviews.

export const PRIOR_WEIGHT = 5; // "C": imaginary reviews every cafeteria starts with
export const PRIOR_MEAN = 3; // "m": the neutral middle of the 1 to 5 scale

export type RatingStats = { reviewCount: number; starSum: number };

/** Weighted rating on the 1 to 5 scale. */
export function bayesianRating({ reviewCount, starSum }: RatingStats, prior = PRIOR_WEIGHT, mean = PRIOR_MEAN): number {
  return (prior * mean + starSum) / (prior + reviewCount);
}

export type CafeteriaStats = RatingStats & { cafeteriaId: number; plantDishCount: number };

export type RankedCafeteria = CafeteriaStats & { score: number; avgRating: number | null; gettingStarted: boolean };

/**
 * Rank cafeterias for the board. Score = Bayesian rating + 0.1 per plant dish (max +0.3).
 * Cafeterias with no reviews yet go to the bottom ("getting started"), ordered by dish count.
 */
export function rankCafeterias(stats: CafeteriaStats[]): RankedCafeteria[] {
  const ranked = stats.map((c) => {
    const gettingStarted = c.reviewCount === 0;
    const bonus = Math.min(0.3, 0.1 * c.plantDishCount);
    return {
      ...c,
      gettingStarted,
      avgRating: c.reviewCount ? Math.round((c.starSum / c.reviewCount) * 10) / 10 : null,
      score: gettingStarted ? 0 : Math.round((bayesianRating(c) + bonus) * 100) / 100,
    };
  });

  return ranked.sort(
    (a, b) =>
      Number(a.gettingStarted) - Number(b.gettingStarted) ||
      b.score - a.score ||
      b.plantDishCount - a.plantDishCount ||
      b.reviewCount - a.reviewCount ||
      a.cafeteriaId - b.cafeteriaId,
  );
}
