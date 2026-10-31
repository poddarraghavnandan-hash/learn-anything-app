/**
 * qa.ts — deterministic answer checking.
 *
 * Mastery gates in Shiro are decided HERE, by comparing a learner's answer
 * to the item's answer key after normalisation. An LLM may phrase feedback,
 * but it never decides whether an answer is right.
 */
import type { QuizItem } from '../content';

/** Lowercase, trim, drop punctuation, collapse whitespace. */
export function normalizeAnswer(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"()]/g, '')
    .replace(/\s+/g, ' ');
}

export function checkAnswer(item: QuizItem, response: string): boolean {
  const given = normalizeAnswer(response);
  if (given.length === 0) return false;
  const keys = [item.answer, ...(item.accepted ?? [])].map(normalizeAnswer);
  return keys.includes(given);
}
