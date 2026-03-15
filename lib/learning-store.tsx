import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  UserProfile,
  CardEngagement,
  SpacedRepItem,
  FeedCard,
  TopicData,
} from "@/shared/types";
import { XP_VALUES } from "@/shared/types";

// ─── State ────────────────────────────────────────────────────────────────────

interface LearningState {
  profile: UserProfile;
  engagements: CardEngagement[];
  spacedRep: SpacedRepItem[];
  savedContentIds: number[];
  sessionStartTime: number;
  sessionMinutes: number;
  loaded: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  interests: [],
  dailyGoalMinutes: 10,
  preferredFormat: "mixed",
  onboardingDone: false,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: "",
  totalXp: 0,
  totalMinutes: 0,
  totalVideos: 0,
  totalArticles: 0,
  totalQuizCorrect: 0,
  totalQuizAttempted: 0,
};

const initialState: LearningState = {
  profile: DEFAULT_PROFILE,
  engagements: [],
  spacedRep: [],
  savedContentIds: [],
  sessionStartTime: Date.now(),
  sessionMinutes: 0,
  loaded: false,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "LOAD_STATE"; payload: Partial<LearningState> }
  | { type: "SET_INTERESTS"; payload: string[] }
  | { type: "SET_DAILY_GOAL"; payload: number }
  | { type: "SET_FORMAT"; payload: "videos" | "articles" | "mixed" }
  | { type: "COMPLETE_ONBOARDING" }
  | { type: "ADD_XP"; payload: number }
  | { type: "RECORD_ENGAGEMENT"; payload: CardEngagement }
  | { type: "UPDATE_STREAK" }
  | { type: "INCREMENT_VIDEOS" }
  | { type: "INCREMENT_ARTICLES" }
  | { type: "RECORD_QUIZ"; payload: { correct: boolean } }
  | { type: "ADD_SPACED_REP"; payload: SpacedRepItem }
  | { type: "UPDATE_SPACED_REP"; payload: { contentId: number; rating: number } }
  | { type: "TOGGLE_SAVE"; payload: number }
  | { type: "UPDATE_SESSION_TIME"; payload: number };

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function reducer(state: LearningState, action: Action): LearningState {
  switch (action.type) {
    case "LOAD_STATE":
      return { ...state, ...action.payload, loaded: true };

    case "SET_INTERESTS":
      return { ...state, profile: { ...state.profile, interests: action.payload } };

    case "SET_DAILY_GOAL":
      return { ...state, profile: { ...state.profile, dailyGoalMinutes: action.payload } };

    case "SET_FORMAT":
      return { ...state, profile: { ...state.profile, preferredFormat: action.payload } };

    case "COMPLETE_ONBOARDING":
      return { ...state, profile: { ...state.profile, onboardingDone: true } };

    case "ADD_XP":
      return { ...state, profile: { ...state.profile, totalXp: state.profile.totalXp + action.payload } };

    case "RECORD_ENGAGEMENT":
      return { ...state, engagements: [...state.engagements.slice(-200), action.payload] };

    case "UPDATE_STREAK": {
      const today = getToday();
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      let { currentStreak, longestStreak, lastActiveDate } = state.profile;

      if (lastActiveDate === today) return state;
      if (lastActiveDate === yesterday) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
      longestStreak = Math.max(longestStreak, currentStreak);
      return {
        ...state,
        profile: { ...state.profile, currentStreak, longestStreak, lastActiveDate: today },
      };
    }

    case "INCREMENT_VIDEOS":
      return { ...state, profile: { ...state.profile, totalVideos: state.profile.totalVideos + 1 } };

    case "INCREMENT_ARTICLES":
      return { ...state, profile: { ...state.profile, totalArticles: state.profile.totalArticles + 1 } };

    case "RECORD_QUIZ": {
      const p = state.profile;
      return {
        ...state,
        profile: {
          ...p,
          totalQuizAttempted: p.totalQuizAttempted + 1,
          totalQuizCorrect: p.totalQuizCorrect + (action.payload.correct ? 1 : 0),
        },
      };
    }

    case "ADD_SPACED_REP": {
      const exists = state.spacedRep.find((s) => s.contentId === action.payload.contentId);
      if (exists) return state;
      return { ...state, spacedRep: [...state.spacedRep, action.payload] };
    }

    case "UPDATE_SPACED_REP": {
      const { contentId, rating } = action.payload;
      return {
        ...state,
        spacedRep: state.spacedRep.map((item) => {
          if (item.contentId !== contentId) return item;
          let { easeFactor, interval, repetition } = item;
          if (rating >= 3) {
            if (repetition === 0) interval = 1;
            else if (repetition === 1) interval = 3;
            else interval = Math.round(interval * easeFactor);
            repetition += 1;
          } else {
            interval = 1;
            repetition = 0;
          }
          easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)));
          const today = getToday();
          const next = new Date(Date.now() + interval * 86400000).toISOString().split("T")[0];
          const memoryStrength = Math.min(100, Math.round((1 - Math.exp(-0.5 * repetition)) * 100));
          return { ...item, easeFactor, interval, repetition, lastReviewDate: today, nextReviewDate: next, memoryStrength };
        }),
      };
    }

    case "TOGGLE_SAVE": {
      const id = action.payload;
      const saved = state.savedContentIds.includes(id)
        ? state.savedContentIds.filter((s) => s !== id)
        : [...state.savedContentIds, id];
      return { ...state, savedContentIds: saved };
    }

    case "UPDATE_SESSION_TIME":
      return {
        ...state,
        sessionMinutes: action.payload,
        profile: { ...state.profile, totalMinutes: state.profile.totalMinutes + 1 },
      };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface LearningContextType {
  state: LearningState;
  dispatch: React.Dispatch<Action>;
  addXp: (amount: number) => void;
  updateStreak: () => void;
}

const LearningContext = createContext<LearningContextType | null>(null);

const STORAGE_KEY = "learn_anything_state";

export function LearningProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load state from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          dispatch({ type: "LOAD_STATE", payload: { ...parsed, loaded: true, sessionStartTime: Date.now(), sessionMinutes: 0 } });
        } else {
          dispatch({ type: "LOAD_STATE", payload: { loaded: true, sessionStartTime: Date.now() } });
        }
      } catch {
        dispatch({ type: "LOAD_STATE", payload: { loaded: true, sessionStartTime: Date.now() } });
      }
    })();
  }, []);

  // Debounced save to AsyncStorage
  useEffect(() => {
    if (!state.loaded) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const toSave = {
        profile: state.profile,
        engagements: state.engagements.slice(-100),
        spacedRep: state.spacedRep,
        savedContentIds: state.savedContentIds,
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
    }, 500);
  }, [state.profile, state.engagements, state.spacedRep, state.savedContentIds, state.loaded]);

  // Session time tracker
  useEffect(() => {
    const interval = setInterval(() => {
      const mins = Math.floor((Date.now() - state.sessionStartTime) / 60000);
      if (mins !== state.sessionMinutes) {
        dispatch({ type: "UPDATE_SESSION_TIME", payload: mins });
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [state.sessionStartTime, state.sessionMinutes]);

  const addXp = useCallback((amount: number) => {
    dispatch({ type: "ADD_XP", payload: amount });
  }, []);

  const updateStreak = useCallback(() => {
    dispatch({ type: "UPDATE_STREAK" });
  }, []);

  return (
    <LearningContext.Provider value={{ state, dispatch, addXp, updateStreak }}>
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const ctx = useContext(LearningContext);
  if (!ctx) throw new Error("useLearning must be used within LearningProvider");
  return ctx;
}
