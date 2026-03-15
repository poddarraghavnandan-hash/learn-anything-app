/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// ─── Content Types ────────────────────────────────────────────────────────────

export type ContentType = "video" | "article";
export type CardType = "video" | "article" | "quiz" | "review" | "insight";
export type SkillLevel = "beginner" | "intermediate" | "advanced";

export interface FeedCard {
  id: string;
  cardType: CardType;
  content?: ContentItemData;
  quiz?: QuizData;
  review?: ReviewData;
  insight?: InsightData;
}

export interface ContentItemData {
  id: number;
  externalId: string;
  type: ContentType;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  source: string;
  channelOrAuthor: string;
  durationSeconds?: number;
  topicSlug: string;
  topicEmoji?: string;
  topicName?: string;
  publishedAt?: string;
}

export interface QuizData {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  relatedContentTitle: string;
  topicSlug: string;
  topicEmoji?: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface ReviewData {
  id: string;
  contentId: number;
  title: string;
  thumbnailUrl: string;
  topicSlug: string;
  topicEmoji?: string;
  lastSeenDaysAgo: number;
  memoryStrength: number;
  keyTakeaway: string;
}

export interface InsightData {
  id: string;
  title: string;
  body: string;
  topicA: string;
  topicB: string;
  emojiA: string;
  emojiB: string;
}

export interface TopicData {
  id: number;
  slug: string;
  name: string;
  emoji: string;
  category: string;
}

// ─── Difficulty Calibration ──────────────────────────────────────────────────

export interface TopicDifficulty {
  topicSlug: string;
  currentLevel: SkillLevel;
  quizCorrect: number;
  quizAttempted: number;
  accuracy: number;
  lastCalibrated: string;
}

// ─── Badges / Achievements ──────────────────────────────────────────────────

export type BadgeId =
  | "first_quiz"
  | "streak_7"
  | "streak_30"
  | "streak_100"
  | "quiz_master_50"
  | "quiz_master_100"
  | "explorer_5"
  | "explorer_10"
  | "video_50"
  | "article_25"
  | "level_5"
  | "level_10"
  | "mind_blown_10"
  | "daily_goal_7";

export interface BadgeDef {
  id: BadgeId;
  name: string;
  description: string;
  emoji: string;
  requirement: string;
}

export const BADGE_DEFINITIONS: BadgeDef[] = [
  { id: "first_quiz", name: "First Steps", description: "Answer your first quiz", emoji: "🎯", requirement: "1 quiz answered" },
  { id: "streak_7", name: "Week Warrior", description: "7-day learning streak", emoji: "🔥", requirement: "7-day streak" },
  { id: "streak_30", name: "Monthly Master", description: "30-day learning streak", emoji: "💎", requirement: "30-day streak" },
  { id: "streak_100", name: "Century Scholar", description: "100-day learning streak", emoji: "👑", requirement: "100-day streak" },
  { id: "quiz_master_50", name: "Quiz Whiz", description: "Answer 50 quizzes correctly", emoji: "🧠", requirement: "50 correct quizzes" },
  { id: "quiz_master_100", name: "Quiz Legend", description: "Answer 100 quizzes correctly", emoji: "🏆", requirement: "100 correct quizzes" },
  { id: "explorer_5", name: "Curious Mind", description: "Follow 5 topics", emoji: "🔭", requirement: "5 topics followed" },
  { id: "explorer_10", name: "Renaissance Learner", description: "Follow 10 topics", emoji: "🌍", requirement: "10 topics followed" },
  { id: "video_50", name: "Binge Learner", description: "Watch 50 videos", emoji: "🎬", requirement: "50 videos watched" },
  { id: "article_25", name: "Bookworm", description: "Read 25 articles", emoji: "📚", requirement: "25 articles read" },
  { id: "level_5", name: "Rising Star", description: "Reach level 5", emoji: "⭐", requirement: "Level 5" },
  { id: "level_10", name: "Knowledge Titan", description: "Reach level 10", emoji: "🌟", requirement: "Level 10" },
  { id: "mind_blown_10", name: "Mind Expander", description: "React 'Mind blown' 10 times", emoji: "🤯", requirement: "10 mind blown reactions" },
  { id: "daily_goal_7", name: "Goal Crusher", description: "Hit daily goal 7 times", emoji: "🎯", requirement: "7 daily goals met" },
];

// ─── User Profile ────────────────────────────────────────────────────────────

export interface UserProfile {
  interests: string[];
  skillLevel: SkillLevel;
  dailyGoalMinutes: number;
  preferredFormat: "videos" | "articles" | "mixed";
  onboardingDone: boolean;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  totalXp: number;
  totalMinutes: number;
  totalVideos: number;
  totalArticles: number;
  totalQuizCorrect: number;
  totalQuizAttempted: number;
  dailyGoalsCompleted: number;
  mindBlownCount: number;
}

export type Reaction = "mind_blown" | "knew_this" | "save" | "skip";

export interface CardEngagement {
  cardId: string;
  cardType: CardType;
  timeSpentMs: number;
  reaction?: Reaction;
  quizAnswer?: number;
  quizCorrect?: boolean;
  reviewRating?: number;
  timestamp: number;
  hourOfDay: number;
}

export interface SpacedRepItem {
  contentId: number;
  title: string;
  thumbnailUrl: string;
  topicSlug: string;
  easeFactor: number;
  interval: number;
  repetition: number;
  lastReviewDate: string;
  nextReviewDate: string;
  memoryStrength: number;
}

export const XP_VALUES = {
  videoComplete: 15,
  articleComplete: 10,
  quizCorrect: 20,
  quizWrong: 5,
  reviewRated: 10,
  dailyGoal: 50,
  streakDay: 10,
} as const;

export const LEVEL_NAMES = [
  "Curious", "Explorer", "Learner", "Scholar", "Expert", "Master", "Sage",
] as const;

export function getLevel(xp: number) {
  const level = Math.floor(xp / 500) + 1;
  const idx = Math.min(level - 1, LEVEL_NAMES.length - 1);
  const xpInLevel = xp % 500;
  return { level, name: LEVEL_NAMES[idx], xpForNext: 500 - xpInLevel, progress: xpInLevel / 500 };
}

// ─── Difficulty Calibration Helpers ──────────────────────────────────────────

export function calibrateDifficulty(accuracy: number, current: SkillLevel): SkillLevel {
  if (accuracy >= 0.85 && current !== "advanced") {
    return current === "beginner" ? "intermediate" : "advanced";
  }
  if (accuracy < 0.5 && current !== "beginner") {
    return current === "advanced" ? "intermediate" : "beginner";
  }
  return current;
}

export function getSearchModifier(level: SkillLevel): string {
  switch (level) {
    case "beginner": return "for beginners explained simply";
    case "intermediate": return "tutorial explained";
    case "advanced": return "advanced deep dive";
  }
}

// ─── Learning Ladder ────────────────────────────────────────────────────────

export interface LadderStep {
  order: number;
  title: string;
  description: string;
  whyItMatters: string;
  searchQuery: string;
  estimatedMinutes: number;
  prerequisites: string[];
}

export interface LearningLadder {
  topicSlug: string;
  topicName: string;
  steps: LadderStep[];
  totalEstimatedHours: number;
  encouragement: string;
  generatedAt: string;
}

export interface TopicProgress {
  topicSlug: string;
  currentStepIndex: number;       // which step the user is on (0-based)
  completedSteps: number[];       // indices of completed steps
  baselineLevel: SkillLevel;      // determined by Curiosity Check
  curiosityCheckDone: boolean;
  videosWatchedPerStep: Record<number, number>;  // stepIndex → count
  quizPassedPerStep: Record<number, boolean>;    // stepIndex → passed
  startedAt: string;
  lastActivityAt: string;
}

// ─── Curiosity Check ────────────────────────────────────────────────────────

export interface CuriosityQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: "easy" | "medium" | "hard";
  funFact: string;               // shown after answering, regardless of correct/wrong
  emoji: string;                 // fun emoji for the question
}

export interface CuriosityCheckResult {
  topicSlug: string;
  questions: CuriosityQuestion[];
  answeredCorrectly: number;
  totalQuestions: number;
  determinedLevel: SkillLevel;
  startingStep: number;           // which ladder step to start from
}
