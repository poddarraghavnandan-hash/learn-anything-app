/**
 * mastery.ts — BKT-style (Bayesian Knowledge Tracing) per-concept mastery.
 *
 * Each concept carries a probability that the learner has mastered it.
 * Every graded response updates that probability using the classic BKT
 * evidence step (accounting for slips and guesses) followed by a learning
 * transition. Parameters are deliberately conservative defaults for young
 * learners; they are constants, not fitted values.
 */

export interface BktParams {
  /** Probability of transitioning to "learned" after each opportunity. */
  learn: number;
  /** Probability a learner who knows the concept still answers wrong. */
  slip: number;
  /** Probability a learner who does not know it answers right by luck. */
  guess: number;
}

export const DEFAULT_BKT: BktParams = { learn: 0.15, slip: 0.1, guess: 0.2 };

/** Starting mastery for a concept the learner has never touched. */
export const INITIAL_MASTERY = 0.1;

/** Mastery at or above this is shown to parents as "still knows it". */
export const MASTERED_THRESHOLD = 0.9;

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/**
 * Update the mastery probability after one graded response.
 * Correct answers always raise it, incorrect answers always lower the
 * evidence term (the learning transition can still nudge it up slightly).
 */
export function updateMastery(
  prior: number,
  correct: boolean,
  params: BktParams = DEFAULT_BKT,
): number {
  const p = clamp01(prior);
  const { learn, slip, guess } = params;
  const evidence = correct
    ? (p * (1 - slip)) / (p * (1 - slip) + (1 - p) * guess)
    : (p * slip) / (p * slip + (1 - p) * (1 - guess));
  return clamp01(evidence + (1 - evidence) * learn);
}

export type MasteryBand = 'new' | 'learning' | 'growing' | 'mastered';

export function masteryBand(mastery: number, seen: boolean): MasteryBand {
  if (!seen) return 'new';
  if (mastery >= MASTERED_THRESHOLD) return 'mastered';
  if (mastery >= 0.55) return 'growing';
  return 'learning';
}

export function masteryLabel(band: MasteryBand): string {
  switch (band) {
    case 'new':
      return 'Not started';
    case 'learning':
      return 'Learning';
    case 'growing':
      return 'Growing';
    case 'mastered':
      return 'Mastered';
  }
}
