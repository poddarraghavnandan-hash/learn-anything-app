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
  | "daily_goal_7"
  | "perfect_journey"
  | "journey_5"
  | "journey_25"
  | "check_streak_5"
  | "check_streak_10";

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
  { id: "perfect_journey", name: "Perfect Journey", description: "Complete a journey with 100% mastery", emoji: "💫", requirement: "1 perfect journey" },
  { id: "journey_5", name: "Pathfinder", description: "Complete 5 learning journeys", emoji: "🗺️", requirement: "5 journeys completed" },
  { id: "journey_25", name: "Knowledge Architect", description: "Complete 25 learning journeys", emoji: "🏛️", requirement: "25 journeys completed" },
  { id: "check_streak_5", name: "Sharp Mind", description: "5 correct checks in a row", emoji: "⚡", requirement: "5 check streak" },
  { id: "check_streak_10", name: "Unstoppable", description: "10 correct checks in a row", emoji: "🔥", requirement: "10 check streak" },
];

// ─── User Profile ────────────────────────────────────────────────────────────

export interface UserProfile {
  interests: string[];
  skillLevel: SkillLevel;
  dailyGoalMinutes: number;
  preferredFormat: "videos" | "articles" | "mixed";
  onboardingDone: boolean;
  age?: number;                    // used for cold-start curation
  displayName?: string;            // optional, set via sign-in or manually
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
  // Streak freeze
  streakFreezes: number;           // available freezes (max 3)
  streakFreezeUsedDate?: string;   // last date a freeze was used
  // Level tracking for celebrations
  lastCelebratedLevel?: number;
  lastCelebratedStreak?: number;
  // Gamification — teaching strategy
  checkStreak: number;              // Consecutive correct check answers
  bestCheckStreak: number;          // All-time best check streak
  perfectJourneys: number;          // Count of perfect journeys
  totalJourneysCompleted: number;   // Total journeys finished
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

// ─── Chat / Conversational Learning ────────────────────────────────────────

export type ChatMessageRole = "user" | "assistant" | "system";
export type ChatBubbleType = "text" | "baseline_quiz" | "content_card" | "mini_ladder" | "thinking" | "encouragement" | "nudge" | "reflection";

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  bubbleType: ChatBubbleType;
  text?: string;
  quiz?: InlineChatQuiz;
  nudge?: NudgeData;
  contentCards?: ContentItemData[];
  miniLadder?: MiniLadderStep[];
  timestamp: number;
}

// ─── Nudge — Subtle Signal-Gathering ──────────────────────────────────────

export type NudgeType =
  | "familiarity_check"    // "Have you heard of X?"
  | "connection_check"     // "Does that remind you of anything?"
  | "interest_probe"       // "What part of that surprises you most?"
  | "pace_check"           // "Want to go deeper or move on?"
  | "application_prompt"   // "Where would you see this in real life?"
  | "confidence_gauge"     // "Does that feel right to you?"
  | "direction_check"      // "Where do you want to go from here?"
  | "analogy_test";        // "How would you explain this to a friend?"

export interface NudgeData {
  nudgeType: NudgeType;
  question: string;
  options?: string[];       // optional quick-tap responses
  freeResponse?: boolean;   // allow typed answer
  signalKey: string;        // what learner model field this updates
  emoji: string;
}

// ─── Learner Model — Evolves Silently ─────────────────────────────────────

export interface LearnerModel {
  // Pace & Style (inferred from behavior)
  preferredPace: "quick" | "moderate" | "deep";
  preferredTone: "casual" | "balanced" | "formal";
  preferredDepth: "overview" | "detailed" | "expert";
  
  // Comprehension Map
  conceptConfidence: Record<string, number>;  // concept → 0-1 confidence
  confusionPoints: string[];                  // concepts they've struggled with
  strengthAreas: string[];                    // concepts they grasp quickly
  
  // Engagement Patterns
  peakHours: number[];                        // hours of day most active
  avgSessionMinutes: number;
  contentFormatWeights: { video: number; article: number; interactive: number };
  
  // Personal Context
  pastTopics: string[];
  realWorldConnections: string[];             // analogies that resonated
  learningStyle: "visual" | "verbal" | "kinesthetic" | "mixed";
  
  // Interaction Signals
  totalNudgesAnswered: number;
  nudgeResponsePatterns: Record<NudgeType, number>;  // count per nudge type
  explainSimplerCount: number;
  topicSwitchCount: number;
  avgQuizResponseTimeMs: number;
  questionsAsked: number;
  followUpDepth: number;                      // avg follow-ups per conversation
  
  lastUpdated: string;
}

export interface InlineChatQuiz {
  question: string;
  options: string[];
  correctIndex: number;
  funFact: string;
  emoji: string;
  answered?: boolean;
  selectedIndex?: number;
}

export interface MiniLadderStep {
  order: number;
  title: string;
  description: string;
  realWorldConnection: string;
  searchQuery: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  originalQuestion: string;
  mappedConcepts: string[];
  baselineLevel: SkillLevel;
  baselineDone: boolean;
  miniLadder: MiniLadderStep[];
  currentStep: number;
  signalsGathered: Record<string, any>;  // signals collected during this conversation
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_LEARNER_MODEL: LearnerModel = {
  preferredPace: "moderate",
  preferredTone: "casual",
  preferredDepth: "detailed",
  conceptConfidence: {},
  confusionPoints: [],
  strengthAreas: [],
  peakHours: [],
  avgSessionMinutes: 0,
  contentFormatWeights: { video: 0.5, article: 0.3, interactive: 0.2 },
  pastTopics: [],
  realWorldConnections: [],
  learningStyle: "mixed",
  totalNudgesAnswered: 0,
  nudgeResponsePatterns: {} as Record<NudgeType, number>,
  explainSimplerCount: 0,
  topicSwitchCount: 0,
  avgQuizResponseTimeMs: 0,
  questionsAsked: 0,
  followUpDepth: 0,
  lastUpdated: new Date().toISOString(),
};

export interface CuriosityCheckResult {
  topicSlug: string;
  questions: CuriosityQuestion[];
  answeredCorrectly: number;
  totalQuestions: number;
  determinedLevel: SkillLevel;
  startingStep: number;           // which ladder step to start from
}

// ─── Learning Journey — Guided Learning Strategy ────────────────────────────

export type JourneyStageType =
  | "hook"           // Curiosity-sparking opening
  | "foundation"     // Prerequisite context
  | "explanation"    // Core concept explanation (can have multiple parts)
  | "real_world"     // Concrete real-world example
  | "check"          // Understanding check (interactive)
  | "video"          // Video as culmination
  | "next_steps";    // Follow-up learning paths

export interface JourneyStage {
  type: JourneyStageType;
  emoji: string;
  title: string;
  content: string;             // Main text content (markdown)
  keyTakeaway?: string;        // For explanation stages — the one-liner to remember
  // For check stages
  question?: string;
  options?: string[];
  correctIndex?: number;
  explanation?: string;        // Shown after answering the check
  // For video stages
  searchQuery?: string;
  videoContext?: string;       // Why this video matters now
  // For next_steps stages
  paths?: { question: string; reason: string }[];
}

export interface LearningJourney {
  id: string;
  question: string;
  stages: JourneyStage[];
  mappedConcepts: string[];
  difficulty: SkillLevel;
  emoji: string;
  createdAt: string;
  currentStageIndex: number;   // Tracks where the user is
  completed: boolean;
  // Gamification
  xpEarned: number;            // Total XP earned in this journey
  masteryScore: number;        // 0-100 mastery percentage
  perfectJourney: boolean;     // All stages + correct check on first try
  checkCorrect?: boolean;      // Whether the check was answered correctly
  checkTimeMs?: number;        // Time taken to answer check (for challenge mode)
  streakMultiplier: number;    // XP multiplier active during this journey
}

// ─── Journey XP Table ────────────────────────────────────────────────────────

export const JOURNEY_STAGE_XP: Record<JourneyStageType, number> = {
  hook: 5,
  foundation: 10,
  explanation: 15,
  real_world: 10,
  check: 25,       // correct answer; incorrect = 10
  video: 15,
  next_steps: 5,
};

export const CHECK_INCORRECT_XP = 10;
export const CHALLENGE_TIMER_SECONDS = 30;
export const CHALLENGE_BONUS_XP = 15;

export function getStreakMultiplier(checkStreak: number): number {
  if (checkStreak >= 10) return 3;
  if (checkStreak >= 5) return 2;
  if (checkStreak >= 3) return 1.5;
  return 1;
}

export function calculateMasteryScore(opts: {
  stagesCompleted: number;
  totalStages: number;
  checkCorrect: boolean;
  videoWatched: boolean;
}): number {
  const completionScore = (opts.stagesCompleted / opts.totalStages) * 30;
  const checkScore = opts.checkCorrect ? 60 : 20;
  const videoScore = opts.videoWatched ? 10 : 0;
  return Math.round(completionScore + checkScore + videoScore);
}
