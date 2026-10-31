import { describe, expect, it } from 'vitest';
import {
  gradeFromScore,
  gradeReview,
  newReviewCard,
  scheduledIntervalDays,
} from './scheduling';
import { INITIAL_MASTERY, updateMastery } from './mastery';
import {
  fisherInformation,
  probabilityCorrect,
  selectNextItem,
  updateAbility,
  type BankItem,
} from './diagnose';

const NOW = new Date('2026-10-30T12:00:00Z');
const DAY = 86_400_000;

describe('FSRS scheduling', () => {
  it('schedules a first review in the future', () => {
    const card = gradeReview(newReviewCard(NOW), 'good', NOW);
    expect(card.due.getTime()).toBeGreaterThan(NOW.getTime());
    expect(scheduledIntervalDays(card)).toBeGreaterThanOrEqual(1);
  });

  it('better grades earn longer intervals than worse grades', () => {
    const again = gradeReview(newReviewCard(NOW), 'again', NOW);
    const hard = gradeReview(newReviewCard(NOW), 'hard', NOW);
    const good = gradeReview(newReviewCard(NOW), 'good', NOW);
    const easy = gradeReview(newReviewCard(NOW), 'easy', NOW);
    expect(again.due.getTime()).toBeLessThan(hard.due.getTime());
    expect(hard.due.getTime()).toBeLessThan(good.due.getTime());
    expect(good.due.getTime()).toBeLessThan(easy.due.getTime());
  });

  it('repeated good reviews stretch the interval', () => {
    let card = gradeReview(newReviewCard(NOW), 'good', NOW);
    const firstInterval = scheduledIntervalDays(card);
    const secondReviewAt = new Date(NOW.getTime() + firstInterval * DAY);
    card = gradeReview(card, 'good', secondReviewAt);
    expect(scheduledIntervalDays(card)).toBeGreaterThan(firstInterval);
  });

  it('maps session scores to grades monotonically', () => {
    expect(gradeFromScore(0.2)).toBe('again');
    expect(gradeFromScore(0.6)).toBe('hard');
    expect(gradeFromScore(0.8)).toBe('good');
    expect(gradeFromScore(1)).toBe('easy');
  });
});

describe('BKT mastery', () => {
  it('rises on a correct answer', () => {
    expect(updateMastery(INITIAL_MASTERY, true)).toBeGreaterThan(
      INITIAL_MASTERY,
    );
  });

  it('falls (evidence term) relative to a correct answer and trends down on repeated misses from a high prior', () => {
    const afterCorrect = updateMastery(0.8, true);
    const afterWrong = updateMastery(0.8, false);
    expect(afterWrong).toBeLessThan(afterCorrect);
    // Many consecutive misses must drag a high mastery down overall.
    let p = 0.95;
    for (let i = 0; i < 6; i++) p = updateMastery(p, false);
    expect(p).toBeLessThan(0.95);
  });

  it('repeated correct answers approach mastery', () => {
    let p = INITIAL_MASTERY;
    for (let i = 0; i < 8; i++) p = updateMastery(p, true);
    expect(p).toBeGreaterThan(0.9);
    expect(p).toBeLessThanOrEqual(1);
  });
});

describe('IRT-lite diagnosis', () => {
  const bank: BankItem[] = [
    { id: 'hard', difficulty: 1.8 },
    { id: 'mid-hard', difficulty: 0.9 },
    { id: 'mid', difficulty: 0.1 },
    { id: 'mid-easy', difficulty: -0.8 },
    { id: 'easy', difficulty: -1.7 },
  ];

  it('gives 50% at theta == difficulty and rises with ability', () => {
    expect(probabilityCorrect(0.5, 0.5)).toBeCloseTo(0.5);
    expect(probabilityCorrect(2, 0)).toBeGreaterThan(0.8);
    expect(probabilityCorrect(-2, 0)).toBeLessThan(0.2);
  });

  it('picks the unused item nearest the ability estimate (max information)', () => {
    const picked = selectNextItem(0, bank, new Set());
    expect(picked?.id).toBe('mid'); // b = 0.1 is closest to theta = 0
    const pickedHigh = selectNextItem(1.6, bank, new Set());
    expect(pickedHigh?.id).toBe('hard');
    const pickedExcluding = selectNextItem(0, bank, new Set(['mid']));
    expect(pickedExcluding?.id).not.toBe('mid');
    // Information at the picked item is at least as high as any other.
    const info = fisherInformation(0, picked!.difficulty);
    for (const item of bank) {
      expect(info).toBeGreaterThanOrEqual(
        fisherInformation(0, item.difficulty) - 1e-9,
      );
    }
  });

  it('moves ability up on correct and down on incorrect answers', () => {
    const item = { id: 'x', difficulty: 0 };
    expect(updateAbility(0, item, true)).toBeGreaterThan(0);
    expect(updateAbility(0, item, false)).toBeLessThan(0);
  });

  it('an all-correct run ends with a high ability estimate', () => {
    let theta = 0;
    const used = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const item = selectNextItem(theta, bank, used)!;
      used.add(item.id);
      theta = updateAbility(theta, item, true);
    }
    expect(theta).toBeGreaterThan(1);
  });
});
