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
  thinkAbout?: string; // Hint to encourage reflection
  wrongAnswerFeedback?: string; // Explain misconceptions
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
  memoryStrength: number; // 0-100: how well user remembers this concept
  keyTakeaway: string;
  nextReviewDaysFromNow?: number; // Spaced repetition: when user should review this
  reviewCount?: number; // How many times user has reviewed this
  confidenceLevel?: "low" | "medium" | "high"; // User's self-assessed confidence
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
  | "prior_knowledge" // Pre-journey knowledge assessment
  | "hook"           // Curiosity-sparking opening
  | "foundation"     // Prerequisite context
  | "explanation"    // Core concept explanation (can have multiple parts)
  | "real_world"     // Concrete real-world example
  | "check"          // Understanding check (multiple choice)
  | "fill-in-the-blank" // Fill-in-the-blank challenge
  | "matching"       // Match items to definitions/examples
  | "sequencing"     // Arrange items in correct order
  | "video"          // Video as culmination
  | "next_steps";    // Follow-up learning paths

// ─── Prior Knowledge Check ────────────────────────────────────────────────────

export type PriorKnowledgeQuestionType = "familiarity" | "experience" | "intuition" | "recognition";

export interface PriorKnowledgeQuestion {
  id: string;
  question: string;
  type: PriorKnowledgeQuestionType;
  options: string[];
  emoji: string;
  // Each option index maps to a knowledge level
  knowledgeLevels: ("none" | "low" | "medium" | "high")[];
}

export interface PriorKnowledgeResult {
  questions: PriorKnowledgeQuestion[];
  answers: number[];  // selected option index per question
  overallLevel: "none" | "low" | "medium" | "high";
  topicCategory: string;
}

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
  // For fill-in-the-blank challenges
  challengeType?: "multipleChoice" | "fillInTheBlank" | "matching" | "sequencing";  // Type of check challenge
  sentence?: string;           // Sentence with [BLANK] placeholder
  correctAnswers?: string[];   // Multiple acceptable answers (synonyms, variations)
  hints?: string[];            // Optional hints (word category, length, etc)
  // For matching game challenges
  matchingPairs?: { left: string; right: string }[];  // Items to match
  matchingInstructions?: string;  // "Match concepts to their definitions"
  // For sequencing game challenges
  sequenceItems?: string[];    // Items to arrange in order
  sequenceInstructions?: string;  // "Arrange these steps in the correct order"
  correctSequence?: number[];  // Indices of correct order
  // For video stages
  searchQuery?: string;
  videoContext?: string;       // Why this video matters now
  // For next_steps stages
  paths?: { question: string; reason: string }[];
  // For prior_knowledge stages
  priorKnowledgeQuestions?: PriorKnowledgeQuestion[];
}

export interface LearningJourney {
  id: string;
  question: string;
  stages: JourneyStage[];
  mappedConcepts: string[];
  difficulty: SkillLevel;
  difficultyLevel: number;       // 1-5 adaptive difficulty
  difficultyLabel: string;       // Human-readable difficulty name
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
  priorKnowledgeResult?: PriorKnowledgeResult;  // Results from prior knowledge check
}

// ─── Journey XP Table ────────────────────────────────────────────────────────

export const JOURNEY_STAGE_XP: Record<JourneyStageType, number> = {
  prior_knowledge: 5,  // Small reward for completing the check
  hook: 5,
  foundation: 10,
  explanation: 15,
  real_world: 10,
  check: 25,       // correct answer; incorrect = 10
  "fill-in-the-blank": 25,  // same as check
  matching: 30,    // Interactive game — higher reward
  sequencing: 30,  // Interactive game — higher reward
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

// ─── Adaptive Difficulty Scaling ────────────────────────────────────────────

export interface DifficultyLevel {
  level: number;        // 1-5
  label: string;
  emoji: string;
  description: string;
}

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  { level: 1, label: "Curious Beginner", emoji: "🌱", description: "Starting your learning journey" },
  { level: 2, label: "Building Foundations", emoji: "🧱", description: "Growing your knowledge base" },
  { level: 3, label: "Making Connections", emoji: "🔗", description: "Linking ideas together" },
  { level: 4, label: "Deep Understanding", emoji: "🔬", description: "Exploring with depth and nuance" },
  { level: 5, label: "Expert Explorer", emoji: "🚀", description: "Pushing the boundaries" },
];

export function computeDifficultyLevel(
  profile: Pick<UserProfile, "totalQuizCorrect" | "totalQuizAttempted" | "checkStreak" | "totalJourneysCompleted">,
  learnerModel: Pick<LearnerModel, "conceptConfidence" | "confusionPoints" | "explainSimplerCount" | "preferredDepth">,
): DifficultyLevel {
  let score = 0;

  // Check/quiz accuracy (30% weight)
  if (profile.totalQuizAttempted > 0) {
    const accuracy = profile.totalQuizCorrect / profile.totalQuizAttempted;
    score += accuracy * 30;
  }

  // Check streak (20% weight)
  score += Math.min(profile.checkStreak / 10, 1) * 20;

  // Concept confidence average (20% weight)
  const confidences = Object.values(learnerModel.conceptConfidence);
  if (confidences.length > 0) {
    const avg = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    score += avg * 20;
  }

  // Journey experience (10% weight)
  score += Math.min(profile.totalJourneysCompleted / 20, 1) * 10;

  // Inverse: confusion and simpler requests (10% penalty)
  const confusionPenalty = Math.min(learnerModel.confusionPoints.length / 10, 1) * 5;
  const simplerPenalty = Math.min(learnerModel.explainSimplerCount / 5, 1) * 5;
  score -= (confusionPenalty + simplerPenalty);

  // Self-reported depth preference (10% weight)
  const depthBonus: Record<string, number> = { overview: 0, detailed: 5, expert: 10 };
  score += depthBonus[learnerModel.preferredDepth] ?? 5;

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // Map to level
  if (score < 20) return DIFFICULTY_LEVELS[0];
  if (score < 40) return DIFFICULTY_LEVELS[1];
  if (score < 60) return DIFFICULTY_LEVELS[2];
  if (score < 80) return DIFFICULTY_LEVELS[3];
  return DIFFICULTY_LEVELS[4];
}

export function getDifficultyPrompt(level: number): string {
  switch (level) {
    case 1:
      return `DIFFICULTY: CURIOUS BEGINNER (Level 1)
- Use simple everyday language a child could understand
- Explain with vivid analogies from daily life ("It's like...")
- Short sentences (8-12 words). No jargon whatsoever
- Hook: Use a relatable, everyday surprise
- Foundation: Give full prerequisite explanation — assume they know nothing
- Explanation: ELI5 style. One idea per paragraph. Bold key terms and immediately define them
- Real World: Use a common everyday example (kitchen, playground, driving)
- Check: Recall-based question ("What is X?" / "Which of these is true?")
- Video search: Add "explained simply for beginners" to the query
- Keep total content SHORT — about 60% of normal length`;
    case 2:
      return `DIFFICULTY: BUILDING FOUNDATIONS (Level 2)
- Use clear language with occasional technical terms — always define them in parentheses
- Analogies should be relatable but can reference slightly more complex scenarios
- Medium sentences (10-15 words)
- Hook: A surprising fact that challenges common assumptions
- Foundation: Brief refresher — they know the basics but need a reminder
- Explanation: Clear and structured. Define technical terms on first use. Build step by step
- Real World: Practical example from work, technology, or nature
- Check: Comprehension-based ("Why does X happen?" / "What would you expect if...?")
- Video search: Add "tutorial explained" to the query
- Standard content length`;
    case 3:
      return `DIFFICULTY: MAKING CONNECTIONS (Level 3)
- Use some technical vocabulary — define only uncommon terms
- Draw connections between concepts and related fields
- Medium-length sentences (12-18 words)
- Hook: A counterintuitive fact or common misconception
- Foundation: Brief 1-2 sentence reference — they likely know the prerequisites
- Explanation: Moderate depth. Include nuance and "but actually" moments. Connect to related concepts
- Real World: Industry or professional example showing practical application
- Check: Application-based ("What would happen if...?" / "How would you use this to...?")
- Video search: Add "how it works in depth" to the query
- Standard to slightly longer content`;
    case 4:
      return `DIFFICULTY: DEEP UNDERSTANDING (Level 4)
- Use precise technical language freely
- Explore edge cases, exceptions, and nuances
- Longer, more complex sentences are fine (15-22 words)
- Hook: A paradox, open research question, or surprising implication
- Foundation: Skip or give a single-sentence reference — they know the prerequisites well
- Explanation: Go deep. Discuss mechanisms, trade-offs, and competing theories. Include "what most people get wrong"
- Real World: Research application or cutting-edge industry use case
- Check: Synthesis-based ("How does X relate to Y?" / "What's the key trade-off between...?")
- Video search: Add "advanced deep dive" to the query
- Longer content with more detail (about 120% of normal)`;
    case 5:
      return `DIFFICULTY: EXPERT EXPLORER (Level 5)
- Full technical vocabulary — no simplification needed
- Challenge them with frontier knowledge and open questions
- Complex, precise sentences (15-25 words)
- Hook: Cutting-edge research, unsolved problems, or paradigm-shifting ideas
- Foundation: Skip entirely or reference as "As you know..."
- Explanation: Expert-level depth. Discuss competing models, recent developments, mathematical intuitions where relevant. Include caveats and limitations
- Real World: Frontier research, novel applications, or cross-domain connections
- Check: Evaluation-based ("What's the strongest argument against...?" / "How would you design an experiment to test...?")
- Video search: Add "advanced lecture" or "research talk" to the query
- Longest content with full technical depth (about 140% of normal)`;
    default:
      return getDifficultyPrompt(3); // Default to middle
  }
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
