/**
 * learner.tsx — the learner store: profile, consent, mastery, FSRS cards,
 * ability estimate and the response log, persisted to AsyncStorage.
 *
 * Everything the loop needs survives an app restart:
 *   profile (incl. parental consent record for under-13s)
 *   per-concept BKT mastery + FSRS card + attempt counts
 *   IRT ability estimate + selected diagnosis result
 *   append-only response log (feeds the parent digest)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ALL_CONCEPTS, type QuizItem } from '../content';
import {
  gradeFromScore,
  gradeReview,
  newReviewCard,
  reviveCard,
  serializeCard,
  type StoredCard,
} from '../engine/scheduling';
import { INITIAL_MASTERY, updateMastery } from '../engine/mastery';

const STORAGE_KEY = 'shiro-v2-learner-state-v1';

export interface ConsentRecord {
  parentEmail: string;
  /** ISO timestamp of capture. */
  consentedAt: string;
  method: 'in-app-checkbox';
  policyVersion: string;
}

export interface LearnerProfile {
  name: string;
  age: number;
  flow: 'child' | 'teen';
  consent?: ConsentRecord;
  createdAt: string;
}

export interface ConceptState {
  mastery: number;
  seen: boolean;
  card: StoredCard | null;
  attempts: number;
  correct: number;
  lastStudiedAt?: string;
}

export interface ResponseLogEntry {
  itemId: string;
  conceptId: string;
  correct: boolean;
  at: string;
}

export interface LearnerState {
  profile: LearnerProfile | null;
  concepts: Record<string, ConceptState>;
  ability: number;
  diagnosisDone: boolean;
  recommendedConceptId: string | null;
  log: ResponseLogEntry[];
}

const EMPTY_CONCEPT: ConceptState = {
  mastery: INITIAL_MASTERY,
  seen: false,
  card: null,
  attempts: 0,
  correct: 0,
};

export function blankState(): LearnerState {
  const concepts: Record<string, ConceptState> = {};
  for (const c of ALL_CONCEPTS) concepts[c.id] = { ...EMPTY_CONCEPT };
  return {
    profile: null,
    concepts,
    ability: 0,
    diagnosisDone: false,
    recommendedConceptId: null,
    log: [],
  };
}

interface LearnerStore {
  state: LearnerState;
  hydrated: boolean;
  onboard: (profile: LearnerProfile) => void;
  /** Record one graded first-attempt response (BKT + log). */
  recordAnswer: (conceptId: string, item: QuizItem, correct: boolean) => void;
  /**
   * Finish a learn/review session for a concept: grade the session with
   * FSRS and (re)schedule its review card.
   */
  completeSession: (conceptId: string, firstAttemptFraction: number) => void;
  completeDiagnosis: (ability: number, recommendedConceptId: string) => void;
  resetAll: () => void;
}

const LearnerContext = createContext<LearnerStore | null>(null);

export function LearnerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LearnerState>(blankState);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!alive) return;
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as LearnerState;
            // Merge over a blank state so new seed concepts appear safely.
            const base = blankState();
            setState({
              ...base,
              ...parsed,
              concepts: { ...base.concepts, ...(parsed.concepts ?? {}) },
            });
          } catch {
            // Corrupt storage: start fresh rather than crash a child's app.
          }
        }
        setHydrated(true);
      })
      .catch(() => setHydrated(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
    }, 250);
  }, [state, hydrated]);

  const onboard = useCallback((profile: LearnerProfile) => {
    setState((s) => ({ ...s, profile }));
  }, []);

  const recordAnswer = useCallback(
    (conceptId: string, item: QuizItem, correct: boolean) => {
      setState((s) => {
        const prev = s.concepts[conceptId] ?? { ...EMPTY_CONCEPT };
        const next: ConceptState = {
          ...prev,
          seen: true,
          mastery: updateMastery(prev.mastery, correct),
          attempts: prev.attempts + 1,
          correct: prev.correct + (correct ? 1 : 0),
          lastStudiedAt: new Date().toISOString(),
        };
        return {
          ...s,
          concepts: { ...s.concepts, [conceptId]: next },
          log: [
            ...s.log.slice(-499),
            {
              itemId: item.id,
              conceptId,
              correct,
              at: new Date().toISOString(),
            },
          ],
        };
      });
    },
    [],
  );

  const completeSession = useCallback(
    (conceptId: string, firstAttemptFraction: number) => {
      setState((s) => {
        const prev = s.concepts[conceptId] ?? { ...EMPTY_CONCEPT };
        const now = new Date();
        const card = prev.card
          ? gradeReview(reviveCard(prev.card), gradeFromScore(firstAttemptFraction), now)
          : gradeReview(newReviewCard(now), gradeFromScore(firstAttemptFraction), now);
        return {
          ...s,
          concepts: {
            ...s.concepts,
            [conceptId]: {
              ...prev,
              seen: true,
              card: serializeCard(card),
              lastStudiedAt: now.toISOString(),
            },
          },
        };
      });
    },
    [],
  );

  const completeDiagnosis = useCallback(
    (ability: number, recommendedConceptId: string) => {
      setState((s) => ({
        ...s,
        ability,
        diagnosisDone: true,
        recommendedConceptId,
      }));
    },
    [],
  );

  const resetAll = useCallback(() => {
    setState(blankState());
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  const value = useMemo<LearnerStore>(
    () => ({
      state,
      hydrated,
      onboard,
      recordAnswer,
      completeSession,
      completeDiagnosis,
      resetAll,
    }),
    [
      state,
      hydrated,
      onboard,
      recordAnswer,
      completeSession,
      completeDiagnosis,
      resetAll,
    ],
  );

  return (
    <LearnerContext.Provider value={value}>{children}</LearnerContext.Provider>
  );
}

export function useLearner(): LearnerStore {
  const ctx = useContext(LearnerContext);
  if (!ctx) throw new Error('useLearner must be used inside LearnerProvider');
  return ctx;
}
