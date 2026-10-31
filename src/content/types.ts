/**
 * Content model for the Shiro seed pack.
 *
 * Every quiz item has a deterministic answer key — mastery decisions are
 * made by checking against these keys (see src/ai/qa.ts), never by an LLM.
 * `difficulty` is the Rasch b parameter used by the diagnosis engine.
 */

export interface QuizItem {
  id: string;
  conceptId: string;
  type: 'mcq' | 'fill';
  prompt: string;
  /** Answer options for mcq items. */
  options?: string[];
  /** Canonical correct answer (the option text for mcq, the word for fill). */
  answer: string;
  /** Additional accepted answers for fill items (checked after normalising). */
  accepted?: string[];
  /** Rasch difficulty, roughly -2 (very easy) .. +2 (hard). */
  difficulty: number;
  /** Hint shown before any answer is revealed (hints-first tutoring). */
  hint: string;
}

export interface TeachCard {
  heading: string;
  body: string;
  example: string;
}

export interface Concept {
  id: string;
  title: string;
  summary: string;
  teach: TeachCard;
  items: QuizItem[];
}

export interface Ladder {
  id: string;
  title: string;
  tagline: string;
  /** Human-readable age guidance, e.g. "Ages 6–9". */
  ageRange: string;
  concepts: Concept[];
}

// --- Small builders so the seed files stay readable ----------------------

export function mcq(
  id: string,
  conceptId: string,
  prompt: string,
  options: string[],
  answer: string,
  difficulty: number,
  hint: string,
): QuizItem {
  return { id, conceptId, type: 'mcq', prompt, options, answer, difficulty, hint };
}

export function fill(
  id: string,
  conceptId: string,
  prompt: string,
  answer: string,
  accepted: string[] | undefined,
  difficulty: number,
  hint: string,
): QuizItem {
  return { id, conceptId, type: 'fill', prompt, answer, accepted, difficulty, hint };
}
