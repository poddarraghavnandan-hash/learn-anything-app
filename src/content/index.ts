import { phonicsLadder } from './phonics';
import { vocabularyLadder } from './vocabulary';
import { readingLadder } from './reading';
import { grammarLadder } from './grammar';
import type { Concept, Ladder, QuizItem } from './types';

export type { Concept, Ladder, QuizItem, TeachCard } from './types';

/** The full seed pack: four English ladders for ages 6–14. */
export const LADDERS: Ladder[] = [
  phonicsLadder,
  vocabularyLadder,
  readingLadder,
  grammarLadder,
];

export const ALL_CONCEPTS: Concept[] = LADDERS.flatMap((l) => l.concepts);

export const ALL_ITEMS: QuizItem[] = ALL_CONCEPTS.flatMap((c) => c.items);

export function getConcept(conceptId: string): Concept | undefined {
  return ALL_CONCEPTS.find((c) => c.id === conceptId);
}

export function getLadderForConcept(conceptId: string): Ladder | undefined {
  return LADDERS.find((l) => l.concepts.some((c) => c.id === conceptId));
}

/** Mean Rasch difficulty of a concept's item bank (used to recommend a start). */
export function conceptMeanDifficulty(concept: Concept): number {
  if (concept.items.length === 0) return 0;
  return (
    concept.items.reduce((sum, i) => sum + i.difficulty, 0) /
    concept.items.length
  );
}
