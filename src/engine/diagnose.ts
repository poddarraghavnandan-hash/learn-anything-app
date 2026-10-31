/**
 * diagnose.ts — IRT-lite adaptive diagnosis.
 *
 * A Rasch (1PL) model: each bank item has a difficulty `b`; the learner has
 * an ability estimate `theta`. After every answer, theta moves toward the
 * evidence with a gradient step, and the next item is the unused one whose
 * Fisher information at theta is highest — in a Rasch model that is simply
 * the item whose difficulty is closest to the current ability estimate.
 * This gives a short (5–7 item) placement check instead of a long test,
 * which matters for young learners.
 */

export interface BankItem {
  id: string;
  /** Rasch difficulty parameter; roughly -2 (very easy) .. +2 (hard). */
  difficulty: number;
}

export function probabilityCorrect(theta: number, difficulty: number): number {
  return 1 / (1 + Math.exp(-(theta - difficulty)));
}

/** Fisher information of a Rasch item at ability theta: P * (1 - P). */
export function fisherInformation(theta: number, difficulty: number): number {
  const p = probabilityCorrect(theta, difficulty);
  return p * (1 - p);
}

/**
 * Pick the unused item carrying the most information at the current
 * ability estimate. Ties break toward the easier item (friendlier for kids).
 */
export function selectNextItem<T extends BankItem>(
  theta: number,
  bank: readonly T[],
  usedIds: ReadonlySet<string>,
): T | null {
  let best: T | null = null;
  let bestInfo = -1;
  for (const item of bank) {
    if (usedIds.has(item.id)) continue;
    const info = fisherInformation(theta, item.difficulty);
    if (
      info > bestInfo + 1e-9 ||
      (Math.abs(info - bestInfo) <= 1e-9 &&
        best !== null &&
        item.difficulty < best.difficulty)
    ) {
      best = item;
      bestInfo = info;
    }
  }
  return best;
}

/** One gradient step on theta after a graded response. */
export function updateAbility(
  theta: number,
  item: BankItem,
  correct: boolean,
  step: number = 0.7,
): number {
  const p = probabilityCorrect(theta, item.difficulty);
  const next = theta + step * ((correct ? 1 : 0) - p);
  // Keep the estimate inside the bank's useful range.
  return Math.min(2.5, Math.max(-2.5, next));
}

/** Human-friendly reading of an ability estimate for parents. */
export function abilityLabel(theta: number): string {
  if (theta < -1) return 'Starting out';
  if (theta < -0.25) return 'Building basics';
  if (theta < 0.5) return 'On track';
  if (theta < 1.25) return 'Confident';
  return 'Advanced for age band';
}
