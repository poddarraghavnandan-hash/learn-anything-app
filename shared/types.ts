/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// ─── Content Types ────────────────────────────────────────────────────────────

export type ContentType = "video" | "article";
export type CardType = "video" | "article" | "quiz" | "review" | "insight";

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

export interface UserProfile {
  interests: string[];
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
