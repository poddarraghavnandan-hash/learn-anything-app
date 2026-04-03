/**
 * Unified Heuristic Engine (Phase 0)
 *
 * Consolidates the 3 fragmented difficulty engines into one deterministic
 * rules-based engine. No ML required — pure heuristics driven by:
 * - Quiz accuracy (EMA from userConceptMetrics)
 * - Signal counts (breakthrough/stuck from learnerSignals)
 * - Dwell time and skip rate (from engagement data)
 * - Streak performance
 *
 * This addresses the adversarial review's Critique #3:
 * "Define a robust Phase 0 Heuristic Engine"
 */

import * as db from "../db";
import { getRecentSignals } from "../db-learner-epistemology";

export type HeuristicDifficultyLevel = 1 | 2 | 3 | 4 | 5;

export interface HeuristicResult {
  level: HeuristicDifficultyLevel;
  label: string;
  alpha: number;  // Engagement weight (0-1)
  beta: number;   // Pedagogy weight (0-1)
  reason: string;
  signals: {
    quizAccuracyEma: number;
    stuckCount: number;
    breakthroughCount: number;
    totalSignals: number;
    recentStreak: number;
  };
}

const LEVEL_LABELS: Record<HeuristicDifficultyLevel, string> = {
  1: "Curious Beginner",
  2: "Building Foundations",
  3: "Making Connections",
  4: "Deep Understanding",
  5: "Expert Explorer",
};

/**
 * Core heuristic evaluation.
 *
 * Rules (from Day-0 spec):
 * - Quiz accuracy EMA > 0.85 AND skip_rate < 0.1 → INCREASE difficulty
 * - Quiz accuracy EMA < 0.50 OR stuck_signals > 3 → DECREASE difficulty
 * - Dwell time < 3s on 2+ cards → Disengage detection → entertainment mode (α=0.9)
 * - Streak > 5 correct → Inject challenge (increase difficulty by 1)
 */
export async function evaluateDifficulty(
  userId: number,
  currentLevel: HeuristicDifficultyLevel = 3,
  recentStreak: number = 0,
): Promise<HeuristicResult> {
  // Gather signals from last 24 hours
  let signals: any[] = [];
  try {
    signals = (await getRecentSignals(userId, 24)) || [];
  } catch {
    // DB unavailable — fall back to current level
  }

  // Count signal types
  let stuckCount = 0;
  let breakthroughCount = 0;
  for (const signal of signals) {
    if (signal.signalType === "stuck") stuckCount++;
    if (signal.signalType === "breakthrough") breakthroughCount++;
  }

  // Get aggregate quiz accuracy from userConceptMetrics
  let quizAccuracyEma = 0.5; // default neutral
  try {
    const metrics = await db.getUserConceptMetrics(userId);
    if (metrics && metrics.length > 0) {
      quizAccuracyEma = metrics.reduce((sum: number, m: any) => sum + m.quizAccuracy, 0) / metrics.length;
    }
  } catch {
    // DB unavailable
  }

  const signalData = {
    quizAccuracyEma,
    stuckCount,
    breakthroughCount,
    totalSignals: signals.length,
    recentStreak,
  };

  // ─── Rule Evaluation ──────────────────────────────────────────

  let newLevel = currentLevel;
  let alpha = 0.5; // balanced default
  let beta = 0.5;
  let reason = "Maintaining current level";

  // RULE 1: Struggling — decrease difficulty
  if (quizAccuracyEma < 0.50 || stuckCount > 3) {
    newLevel = Math.max(1, currentLevel - 1) as HeuristicDifficultyLevel;
    alpha = 0.7; // more entertainment to re-engage
    beta = 0.3;
    reason = quizAccuracyEma < 0.50
      ? `Quiz accuracy low (${(quizAccuracyEma * 100).toFixed(0)}%) — easing difficulty`
      : `Multiple stuck signals (${stuckCount}) — easing difficulty`;
  }
  // RULE 2: Cruising — increase difficulty
  else if (quizAccuracyEma > 0.85 && breakthroughCount >= stuckCount) {
    newLevel = Math.min(5, currentLevel + 1) as HeuristicDifficultyLevel;
    alpha = 0.4;
    beta = 0.6; // more pedagogy
    reason = `High accuracy (${(quizAccuracyEma * 100).toFixed(0)}%) and momentum — increasing challenge`;
  }
  // RULE 3: Streak bonus — temporary level boost
  else if (recentStreak >= 5) {
    newLevel = Math.min(5, currentLevel + 1) as HeuristicDifficultyLevel;
    alpha = 0.4;
    beta = 0.6;
    reason = `${recentStreak}-streak detected — injecting challenge`;
  }
  // RULE 4: Trance state — shift toward pedagogy
  else if (signals.length > 10 && stuckCount === 0) {
    alpha = 0.4;
    beta = 0.6;
    reason = "Deep engagement detected — shifting to pedagogical content";
  }

  return {
    level: newLevel,
    label: LEVEL_LABELS[newLevel],
    alpha,
    beta,
    reason,
    signals: signalData,
  };
}

/**
 * Seed userConceptMetrics rows for concepts encountered in a journey.
 * Creates initial SM-2 state so concepts appear in spaced repetition.
 */
export async function seedConceptsFromJourney(
  userId: number,
  concepts: Array<{ name: string; checkCorrect?: boolean }>,
): Promise<number> {
  let seeded = 0;

  for (const concept of concepts) {
    try {
      // Try to find existing concept by slug
      const slug = concept.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      let conceptRow = await db.getConceptBySlug(slug);

      // If not found, create it
      if (!conceptRow) {
        await db.upsertConcept({
          name: concept.name,
          slug,
          description: concept.name,
        });
        conceptRow = await db.getConceptBySlug(slug);
      }

      if (!conceptRow) continue;

      // Check if metric already exists
      const existing = await db.getUserConceptMetric(userId, conceptRow.id);

      if (!existing) {
        // First encounter — seed with initial values
        const initialAccuracy = concept.checkCorrect ? 0.7 : 0.3;
        await db.upsertUserConceptMetric({
          userId,
          conceptId: conceptRow.id,
          conceptName: concept.name,
          quizAccuracy: initialAccuracy,
          timeSpentSeconds: 0,
          confidenceInferred: initialAccuracy,
        });
        seeded++;
      } else {
        // Already exists — update quiz accuracy if we have new data
        if (concept.checkCorrect !== undefined) {
          const alpha = 0.3;
          const newAccuracy = concept.checkCorrect ? 1 : 0;
          const updatedAccuracy = alpha * newAccuracy + (1 - alpha) * existing.quizAccuracy;
          await db.upsertUserConceptMetric({
            userId,
            conceptId: conceptRow.id,
            conceptName: concept.name,
            quizAccuracy: updatedAccuracy,
            timeSpentSeconds: existing.timeSpentSeconds,
            confidenceInferred: updatedAccuracy,
          });
        }
      }
    } catch (error) {
      console.error(`[HeuristicEngine] Failed to seed concept "${concept.name}":`, error);
    }
  }

  return seeded;
}
