/**
 * scheduling.ts — FSRS-6 spaced-repetition scheduling (via ts-fsrs).
 *
 * One FSRS card is kept per concept. When a learner finishes a learn or
 * review session for a concept, their first-attempt score is mapped to an
 * FSRS grade and the card is rescheduled. All mastery *decisions* are made
 * elsewhere (deterministic answer keys + BKT); FSRS only decides *when* a
 * concept comes back.
 */
import {
  createEmptyCard,
  fsrs,
  Rating,
  type Card,
  type Grade,
} from 'ts-fsrs';

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

const GRADE_TO_RATING: Record<ReviewGrade, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

// ts-fsrs v6 ships the FSRS-6 algorithm and default parameters.
const scheduler = fsrs();

const DAY_MS = 86_400_000;

/**
 * Product policy on top of FSRS-6: reviews for young learners happen on
 * whole days, never in minutes. FSRS-6 natively schedules sub-day learning
 * steps for new and lapsed cards (Again ≈ 1 min, Good ≈ 10 min); when its
 * result lands within a day, we floor the *schedule* to a grade-ordered
 * day count. The stability math inside the card is untouched — FSRS sees
 * the real elapsed time at the next review and adapts from there.
 */
const DAY_FLOOR: Record<ReviewGrade, number> = {
  again: 1,
  hard: 2,
  good: 3,
  easy: 4,
};

/** A fresh, never-studied card whose first review is due immediately. */
export function newReviewCard(now: Date = new Date()): Card {
  return createEmptyCard(now);
}

/** Apply a grade to a card and return the rescheduled card. */
export function gradeReview(
  card: Card,
  grade: ReviewGrade,
  now: Date = new Date(),
): Card {
  const next = scheduler.next(card, now, GRADE_TO_RATING[grade]).card;
  if (next.due.getTime() - now.getTime() < DAY_MS) {
    const floorDays = DAY_FLOOR[grade];
    next.due = new Date(now.getTime() + floorDays * DAY_MS);
    next.scheduled_days = floorDays;
  }
  return next;
}

/** Map a session score (fraction of first-attempt correct, 0..1) to a grade. */
export function gradeFromScore(fraction: number): ReviewGrade {
  if (!Number.isFinite(fraction) || fraction < 0.5) return 'again';
  if (fraction < 0.75) return 'hard';
  if (fraction < 1) return 'good';
  return 'easy';
}

export function isDue(card: Card, now: Date = new Date()): boolean {
  return card.due.getTime() <= now.getTime();
}

/** Whole days until the card is due; negative when overdue. */
export function daysUntilDue(card: Card, now: Date = new Date()): number {
  return Math.floor((card.due.getTime() - now.getTime()) / 86_400_000);
}

/** Days between the review just taken and the next scheduled one. */
export function scheduledIntervalDays(card: Card): number {
  return card.scheduled_days;
}

// --- Persistence helpers -------------------------------------------------
// FSRS cards contain Date objects; AsyncStorage needs JSON-safe data.

export type StoredCard = Omit<Card, 'due' | 'last_review'> & {
  due: string;
  last_review?: string;
};

export function serializeCard(card: Card): StoredCard {
  return {
    ...card,
    due: card.due.toISOString(),
    last_review: card.last_review ? card.last_review.toISOString() : undefined,
  };
}

export function reviveCard(stored: StoredCard): Card {
  return {
    ...stored,
    due: new Date(stored.due),
    last_review: stored.last_review ? new Date(stored.last_review) : undefined,
  };
}
