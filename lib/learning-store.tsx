import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  UserProfile,
  CardEngagement,
  SpacedRepItem,
  FeedCard,
  TopicData,
  TopicDifficulty,
  BadgeId,
  SkillLevel,
  LearningLadder,
  TopicProgress,
  CuriosityCheckResult,
  ChatConversation,
  ChatMessage,
} from "@/shared/types";
import { XP_VALUES, calibrateDifficulty, BADGE_DEFINITIONS } from "@/shared/types";

// ─── State ────────────────────────────────────────────────────────────────────

interface LearningState {
  profile: UserProfile;
  engagements: CardEngagement[];
  spacedRep: SpacedRepItem[];
  savedContentIds: number[];
  topicDifficulties: TopicDifficulty[];
  unlockedBadges: BadgeId[];
  // Learning Ladders & Curiosity Check
  ladders: Record<string, LearningLadder>;       // topicSlug → ladder
  topicProgress: Record<string, TopicProgress>;   // topicSlug → progress
  curiosityResults: Record<string, CuriosityCheckResult>; // topicSlug → result
  // Chat conversations
  conversations: ChatConversation[];
  activeConversationId: string | null;
  sessionStartTime: number;
  sessionMinutes: number;
  loaded: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  interests: [],
  skillLevel: "beginner",
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
  dailyGoalsCompleted: 0,
  mindBlownCount: 0,
};

const initialState: LearningState = {
  profile: DEFAULT_PROFILE,
  engagements: [],
  spacedRep: [],
  savedContentIds: [],
  topicDifficulties: [],
  unlockedBadges: [],
  ladders: {},
  topicProgress: {},
  curiosityResults: {},
  conversations: [],
  activeConversationId: null,
  sessionStartTime: Date.now(),
  sessionMinutes: 0,
  loaded: false,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "LOAD_STATE"; payload: Partial<LearningState> }
  | { type: "SET_INTERESTS"; payload: string[] }
  | { type: "SET_SKILL_LEVEL"; payload: SkillLevel }
  | { type: "SET_DAILY_GOAL"; payload: number }
  | { type: "SET_FORMAT"; payload: "videos" | "articles" | "mixed" }
  | { type: "COMPLETE_ONBOARDING" }
  | { type: "ADD_XP"; payload: number }
  | { type: "RECORD_ENGAGEMENT"; payload: CardEngagement }
  | { type: "UPDATE_STREAK" }
  | { type: "INCREMENT_VIDEOS" }
  | { type: "INCREMENT_ARTICLES" }
  | { type: "RECORD_QUIZ"; payload: { correct: boolean; topicSlug?: string } }
  | { type: "ADD_SPACED_REP"; payload: SpacedRepItem }
  | { type: "UPDATE_SPACED_REP"; payload: { contentId: number; rating: number } }
  | { type: "TOGGLE_SAVE"; payload: number }
  | { type: "UPDATE_SESSION_TIME"; payload: number }
  | { type: "INCREMENT_MIND_BLOWN" }
  | { type: "INCREMENT_DAILY_GOALS" }
  | { type: "UNLOCK_BADGE"; payload: BadgeId }
  // Learning Ladder actions
  | { type: "SAVE_LADDER"; payload: { topicSlug: string; ladder: LearningLadder } }
  | { type: "SAVE_TOPIC_PROGRESS"; payload: { topicSlug: string; progress: TopicProgress } }
  | { type: "SAVE_CURIOSITY_RESULT"; payload: { topicSlug: string; result: CuriosityCheckResult } }
  | { type: "COMPLETE_STEP"; payload: { topicSlug: string; stepIndex: number } }
  | { type: "RECORD_STEP_VIDEO"; payload: { topicSlug: string; stepIndex: number } }
  | { type: "RECORD_STEP_QUIZ"; payload: { topicSlug: string; stepIndex: number; passed: boolean } }
  // Chat actions
  | { type: "SAVE_CONVERSATION"; payload: ChatConversation }
  | { type: "ADD_CHAT_MESSAGE"; payload: { conversationId: string; message: ChatMessage } }
  | { type: "SET_ACTIVE_CONVERSATION"; payload: string | null }
  | { type: "UPDATE_CONVERSATION"; payload: { id: string; updates: Partial<ChatConversation> } };

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function reducer(state: LearningState, action: Action): LearningState {
  switch (action.type) {
    case "LOAD_STATE":
      return { ...state, ...action.payload, loaded: true };

    case "SET_INTERESTS":
      return { ...state, profile: { ...state.profile, interests: action.payload } };

    case "SET_SKILL_LEVEL":
      return { ...state, profile: { ...state.profile, skillLevel: action.payload } };

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
      const newProfile = {
        ...p,
        totalQuizAttempted: p.totalQuizAttempted + 1,
        totalQuizCorrect: p.totalQuizCorrect + (action.payload.correct ? 1 : 0),
      };

      let newDifficulties = [...state.topicDifficulties];
      if (action.payload.topicSlug) {
        const slug = action.payload.topicSlug;
        const existing = newDifficulties.find((d) => d.topicSlug === slug);
        if (existing) {
          const updated = {
            ...existing,
            quizAttempted: existing.quizAttempted + 1,
            quizCorrect: existing.quizCorrect + (action.payload.correct ? 1 : 0),
            accuracy: (existing.quizCorrect + (action.payload.correct ? 1 : 0)) / (existing.quizAttempted + 1),
            lastCalibrated: getToday(),
          };
          updated.currentLevel = calibrateDifficulty(updated.accuracy, updated.currentLevel);
          newDifficulties = newDifficulties.map((d) => (d.topicSlug === slug ? updated : d));
        } else {
          newDifficulties.push({
            topicSlug: slug,
            currentLevel: p.skillLevel,
            quizCorrect: action.payload.correct ? 1 : 0,
            quizAttempted: 1,
            accuracy: action.payload.correct ? 1 : 0,
            lastCalibrated: getToday(),
          });
        }
      }

      return { ...state, profile: newProfile, topicDifficulties: newDifficulties };
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

    case "INCREMENT_MIND_BLOWN":
      return { ...state, profile: { ...state.profile, mindBlownCount: state.profile.mindBlownCount + 1 } };

    case "INCREMENT_DAILY_GOALS":
      return { ...state, profile: { ...state.profile, dailyGoalsCompleted: state.profile.dailyGoalsCompleted + 1 } };

    case "UNLOCK_BADGE": {
      if (state.unlockedBadges.includes(action.payload)) return state;
      return { ...state, unlockedBadges: [...state.unlockedBadges, action.payload] };
    }

    // ─── Learning Ladder Actions ──────────────────────────────────────────────

    case "SAVE_LADDER": {
      return {
        ...state,
        ladders: { ...state.ladders, [action.payload.topicSlug]: action.payload.ladder },
      };
    }

    case "SAVE_TOPIC_PROGRESS": {
      return {
        ...state,
        topicProgress: { ...state.topicProgress, [action.payload.topicSlug]: action.payload.progress },
      };
    }

    case "SAVE_CURIOSITY_RESULT": {
      return {
        ...state,
        curiosityResults: { ...state.curiosityResults, [action.payload.topicSlug]: action.payload.result },
      };
    }

    case "RECORD_STEP_VIDEO": {
      const { topicSlug, stepIndex } = action.payload;
      const existing = state.topicProgress[topicSlug];
      if (!existing) return state;
      const newWatched = { ...existing.videosWatchedPerStep };
      newWatched[stepIndex] = (newWatched[stepIndex] || 0) + 1;
      return {
        ...state,
        topicProgress: {
          ...state.topicProgress,
          [topicSlug]: { ...existing, videosWatchedPerStep: newWatched, lastActivityAt: new Date().toISOString() },
        },
      };
    }

    case "RECORD_STEP_QUIZ": {
      const { topicSlug, stepIndex, passed } = action.payload;
      const existing = state.topicProgress[topicSlug];
      if (!existing) return state;
      const newQuizPassed = { ...existing.quizPassedPerStep };
      if (passed) newQuizPassed[stepIndex] = true;
      return {
        ...state,
        topicProgress: {
          ...state.topicProgress,
          [topicSlug]: { ...existing, quizPassedPerStep: newQuizPassed, lastActivityAt: new Date().toISOString() },
        },
      };
    }

    // ─── Chat Actions ─────────────────────────────────────────────────────────

    case "SAVE_CONVERSATION": {
      const existing = state.conversations.findIndex(c => c.id === action.payload.id);
      if (existing >= 0) {
        const updated = [...state.conversations];
        updated[existing] = action.payload;
        return { ...state, conversations: updated, activeConversationId: action.payload.id };
      }
      return { ...state, conversations: [action.payload, ...state.conversations].slice(0, 50), activeConversationId: action.payload.id };
    }

    case "ADD_CHAT_MESSAGE": {
      const { conversationId, message } = action.payload;
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === conversationId
            ? { ...c, messages: [...c.messages, message], updatedAt: new Date().toISOString() }
            : c
        ),
      };
    }

    case "SET_ACTIVE_CONVERSATION":
      return { ...state, activeConversationId: action.payload };

    case "UPDATE_CONVERSATION": {
      const { id, updates } = action.payload;
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
        ),
      };
    }

    case "COMPLETE_STEP": {
      const { topicSlug, stepIndex } = action.payload;
      const existing = state.topicProgress[topicSlug];
      if (!existing) return state;
      const newCompleted = [...existing.completedSteps];
      if (!newCompleted.includes(stepIndex)) newCompleted.push(stepIndex);
      return {
        ...state,
        topicProgress: {
          ...state.topicProgress,
          [topicSlug]: {
            ...existing,
            completedSteps: newCompleted,
            currentStepIndex: Math.max(existing.currentStepIndex, stepIndex + 1),
            lastActivityAt: new Date().toISOString(),
          },
        },
      };
    }

    default:
      return state;
  }
}

// ─── Badge Checker ───────────────────────────────────────────────────────────

function checkBadges(state: LearningState): BadgeId[] {
  const newBadges: BadgeId[] = [];
  const p = state.profile;
  const u = state.unlockedBadges;

  if (p.totalQuizAttempted >= 1 && !u.includes("first_quiz")) newBadges.push("first_quiz");
  if (p.currentStreak >= 7 && !u.includes("streak_7")) newBadges.push("streak_7");
  if (p.currentStreak >= 30 && !u.includes("streak_30")) newBadges.push("streak_30");
  if (p.currentStreak >= 100 && !u.includes("streak_100")) newBadges.push("streak_100");
  if (p.totalQuizCorrect >= 50 && !u.includes("quiz_master_50")) newBadges.push("quiz_master_50");
  if (p.totalQuizCorrect >= 100 && !u.includes("quiz_master_100")) newBadges.push("quiz_master_100");
  if (p.interests.length >= 5 && !u.includes("explorer_5")) newBadges.push("explorer_5");
  if (p.interests.length >= 10 && !u.includes("explorer_10")) newBadges.push("explorer_10");
  if (p.totalVideos >= 50 && !u.includes("video_50")) newBadges.push("video_50");
  if (p.totalArticles >= 25 && !u.includes("article_25")) newBadges.push("article_25");
  if (getLevel(p.totalXp).level >= 5 && !u.includes("level_5")) newBadges.push("level_5");
  if (getLevel(p.totalXp).level >= 10 && !u.includes("level_10")) newBadges.push("level_10");
  if (p.mindBlownCount >= 10 && !u.includes("mind_blown_10")) newBadges.push("mind_blown_10");
  if (p.dailyGoalsCompleted >= 7 && !u.includes("daily_goal_7")) newBadges.push("daily_goal_7");

  return newBadges;
}

function getLevel(xp: number) {
  return { level: Math.floor(xp / 500) + 1 };
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
          // Migrate old profiles missing new fields
          if (parsed.profile) {
            if (parsed.profile.skillLevel === undefined) parsed.profile.skillLevel = "beginner";
            if (parsed.profile.dailyGoalsCompleted === undefined) parsed.profile.dailyGoalsCompleted = 0;
            if (parsed.profile.mindBlownCount === undefined) parsed.profile.mindBlownCount = 0;
          }
          // Migrate missing ladder/progress fields
          if (!parsed.ladders) parsed.ladders = {};
          if (!parsed.topicProgress) parsed.topicProgress = {};
          if (!parsed.curiosityResults) parsed.curiosityResults = {};
          if (!parsed.conversations) parsed.conversations = [];
          if (!parsed.activeConversationId) parsed.activeConversationId = null;
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
        topicDifficulties: state.topicDifficulties,
        unlockedBadges: state.unlockedBadges,
        ladders: state.ladders,
        topicProgress: state.topicProgress,
        curiosityResults: state.curiosityResults,
        conversations: state.conversations.slice(0, 20), // Keep last 20 conversations
        activeConversationId: state.activeConversationId,
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
    }, 500);
  }, [state.profile, state.engagements, state.spacedRep, state.savedContentIds, state.topicDifficulties, state.unlockedBadges, state.ladders, state.topicProgress, state.curiosityResults, state.conversations, state.activeConversationId, state.loaded]);

  // Badge checker
  useEffect(() => {
    if (!state.loaded) return;
    const newBadges = checkBadges(state);
    for (const badge of newBadges) {
      dispatch({ type: "UNLOCK_BADGE", payload: badge });
    }
  }, [state.profile, state.loaded]);

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
