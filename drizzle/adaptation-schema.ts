import {
  int,
  varchar,
  text,
  timestamp,
  float,
  boolean,
  mysqlTable,
  mysqlEnum,
  json,
} from "drizzle-orm/mysql-core";

/**
 * Adaptation Schema
 *
 * Tracks the 7-phase intelligent content adaptation pipeline:
 * 1. Request Intelligence - user intent analysis
 * 2. Knowledge Assessment - existing knowledge gauging
 * 3. Adaptive Content Generation - 5-level content
 * 4. Content Sequencing - lesson ordering
 * 5. Continuation Engine - next steps
 * 6. Video Integration - video lesson plans
 * 7. UX Tracking - user experience metrics
 */

// ─── User Adaptations (Phase 1: Request Intelligence) ──────────────────────────
/**
 * Tracks user requests and the analysis performed on them
 * Stores sophistication level, intent, prerequisites detected
 */
export const userAdaptations = mysqlTable("userAdaptations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Request details
  userQuery: text("userQuery").notNull(),
  topic: varchar("topic", { length: 255 }).notNull(),
  
  // Phase 1: Request Intelligence Agent
  detectedIntent: mysqlEnum("detectedIntent", [
    "foundational",
    "comprehensive",
    "deep_dive",
    "expert",
    "practical",
  ]).notNull(),
  sophisticationLevel: mysqlEnum("sophisticationLevel", [
    "beginner",
    "intermediate",
    "advanced",
    "expert",
  ]).notNull(),
  sophisticationScore: float("sophisticationScore").notNull(), // 0-100
  detectedPrerequisites: json("detectedPrerequisites").$type<string[]>().default([]), // array of prerequisite topics
  
  // Phase 2: Knowledge Assessment Agent
  userKnowledgeLevel: int("userKnowledgeLevel").notNull(), // 1-5
  readinessScore: float("readinessScore").notNull(), // 0-100
  knowledgeGaps: json("knowledgeGaps").$type<string[]>().default([]),
  
  // Phase 3: Adaptive Content Generation
  recommendedContentLevel: int("recommendedContentLevel").notNull(), // 1-5 (Foundation to Mastery)
  contentGeneratedAt: timestamp("contentGeneratedAt"),
  
  // Phase 4: Content Sequencing
  sequenceGenerated: boolean("sequenceGenerated").default(false),
  lessonCount: int("lessonCount").default(0),
  
  // Phase 5: Continuation Engine
  continuationOptionsGenerated: boolean("continuationOptionsGenerated").default(false),
  
  // Phase 6: Video Integration
  videoLessonGenerated: boolean("videoLessonGenerated").default(false),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type UserAdaptation = typeof userAdaptations.$inferSelect;
export type InsertUserAdaptation = typeof userAdaptations.$inferInsert;

// ─── Lesson Progress (Phase 4: Content Sequencing) ───────────────────────────────
/**
 * Tracks user progress through generated lesson sequences
 * Stores completion status, time spent, quiz scores per lesson
 */
export const lessonProgress = mysqlTable("lessonProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  adaptationId: int("adaptationId").notNull(), // FK to userAdaptations
  
  // Lesson details
  lessonOrder: int("lessonOrder").notNull(), // 1, 2, 3, etc.
  lessonTitle: varchar("lessonTitle", { length: 255 }).notNull(),
  lessonDescription: text("lessonDescription"),
  lessonLevel: int("lessonLevel").notNull(), // 1-5
  
  // Progress tracking
  status: mysqlEnum("status", [
    "not_started",
    "in_progress",
    "completed",
    "skipped",
  ]).default("not_started"),
  
  // Performance metrics
  timeSpentSeconds: int("timeSpentSeconds").default(0),
  quizAccuracy: float("quizAccuracy"), // 0-1 or null if not taken
  quizAttempts: int("quizAttempts").default(0),
  
  // Engagement signals
  contentViewed: boolean("contentViewed").default(false),
  videoWatched: boolean("videoWatched").default(false),
  quizTaken: boolean("quizTaken").default(false),
  
  // Adaptive adjustments
  difficultyAdjusted: boolean("difficultyAdjusted").default(false),
  adjustmentReason: varchar("adjustmentReason", { length: 255 }), // "too_easy", "too_hard", "user_request"
  
  // Timestamps
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LessonProgress = typeof lessonProgress.$inferSelect;
export type InsertLessonProgress = typeof lessonProgress.$inferInsert;

// ─── Continuation History (Phase 5: Continuation Engine) ────────────────────────
/**
 * Tracks which continuation options user selected after lesson completion
 * Stores user choices: Go Deeper, Related Concepts, Teach It, Apply It, Review
 */
export const continuationHistory = mysqlTable("continuationHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  adaptationId: int("adaptationId").notNull(), // FK to userAdaptations
  lessonProgressId: int("lessonProgressId"), // FK to lessonProgress (nullable for full-topic continuations)
  
  // Continuation option selected
  continuationType: mysqlEnum("continuationType", [
    "go_deeper",
    "related_concepts",
    "teach_it",
    "apply_it",
    "review",
  ]).notNull(),
  
  // Target of continuation
  targetTopic: varchar("targetTopic", { length: 255 }),
  targetLevel: int("targetLevel"), // 1-5 for go_deeper
  targetConcept: varchar("targetConcept", { length: 255 }), // for related_concepts
  
  // User engagement with continuation
  selectedAt: timestamp("selectedAt").defaultNow().notNull(),
  engagedAt: timestamp("engagedAt"), // when user actually started the continuation
  completedAt: timestamp("completedAt"),
  
  // Metrics
  timeSpentSeconds: int("timeSpentSeconds").default(0),
  satisfaction: int("satisfaction"), // 1-5 rating if provided
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContinuationRecord = typeof continuationHistory.$inferSelect;
export type InsertContinuationRecord = typeof continuationHistory.$inferInsert;

// ─── Content Generation Cache (Phase 3: Adaptive Content Generation) ────────────
/**
 * Caches generated content at different difficulty levels
 * Avoids regenerating the same content multiple times
 */
export const contentGenerationCache = mysqlTable("contentGenerationCache", {
  id: int("id").autoincrement().primaryKey(),
  
  // Cache key
  topic: varchar("topic", { length: 255 }).notNull(),
  contentLevel: int("contentLevel").notNull(), // 1-5
  sophisticationScore: float("sophisticationScore").notNull(), // 0-100
  
  // Generated content
  title: varchar("title", { length: 255 }).notNull(),
  introduction: text("introduction").notNull(),
  mainContent: text("mainContent").notNull(),
  keyPoints: json("keyPoints").$type<string[]>().notNull(),
  examples: json("examples").$type<string[]>().notNull(),
  checkYourUnderstanding: json("checkYourUnderstanding").$type<{
    question: string;
    options: string[];
    correctAnswer: number;
  }[]>(),
  nextSteps: json("nextSteps").$type<string[]>(),
  
  // Metadata
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(), // TTL for cache invalidation
  usageCount: int("usageCount").default(0),
  lastUsedAt: timestamp("lastUsedAt"),
});

export type ContentGenerationCache = typeof contentGenerationCache.$inferSelect;
export type InsertContentGenerationCache = typeof contentGenerationCache.$inferInsert;

// ─── Video Lesson Plans (Phase 6: Video Integration) ──────────────────────────
/**
 * Stores generated video lesson plans with scene breakdowns
 * Tracks which videos were generated and their metadata
 */
export const videoLessonPlans = mysqlTable("videoLessonPlans", {
  id: int("id").autoincrement().primaryKey(),
  adaptationId: int("adaptationId").notNull(), // FK to userAdaptations
  
  // Video details
  topic: varchar("topic", { length: 255 }).notNull(),
  contentLevel: int("contentLevel").notNull(), // 1-5
  videoStyle: mysqlEnum("videoStyle", [
    "educational",
    "entertaining",
    "professional",
  ]).default("educational"),
  
  // Generated content
  videoScript: text("videoScript").notNull(),
  sceneCount: int("sceneCount").notNull(),
  estimatedDurationSeconds: int("estimatedDurationSeconds").notNull(),
  
  // Scene breakdown (JSON array of scenes)
  scenes: json("scenes").$type<{
    id: string;
    title: string;
    description: string;
    duration: number;
    animation: string;
    visualConcepts: string[];
    voiceover: string;
    keyPoint: string;
  }[]>().notNull(),
  
  // Key frames for preview
  keyFrames: json("keyFrames").$type<string[]>(),
  
  // Animations metadata
  animations: json("animations").$type<{
    type: string;
    duration: number;
    target: string;
  }[]>(),
  
  // Metadata
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  videoGeneratedAt: timestamp("videoGeneratedAt"), // when actual video was rendered
  videoUrl: text("videoUrl"), // S3 or CDN URL
  
  // Usage tracking
  viewCount: int("viewCount").default(0),
  completionRate: float("completionRate"), // 0-1
  userSatisfaction: float("userSatisfaction"), // 0-5
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VideoLessonPlan = typeof videoLessonPlans.$inferSelect;
export type InsertVideoLessonPlan = typeof videoLessonPlans.$inferInsert;

// ─── Adaptation Metrics (Analytics & Optimization) ────────────────────────────
/**
 * Aggregated metrics for analyzing adaptation effectiveness
 * Helps optimize the 7-phase pipeline over time
 */
export const adaptationMetrics = mysqlTable("adaptationMetrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  adaptationId: int("adaptationId").notNull(), // FK to userAdaptations
  
  // Effectiveness metrics
  contentRelevanceScore: float("contentRelevanceScore"), // 0-1 (did content match user need?)
  difficultyCalibration: float("difficultyCalibration"), // 0-1 (was difficulty appropriate?)
  learningOutcome: float("learningOutcome"), // 0-1 (did user learn?)
  userEngagement: float("userEngagement"), // 0-1 (was user engaged?)
  
  // Time metrics
  totalTimeSpentSeconds: int("totalTimeSpentSeconds").default(0),
  estimatedTimeSeconds: int("estimatedTimeSeconds").default(0),
  timeAccuracy: float("timeAccuracy"), // estimated vs actual
  
  // Completion metrics
  lessonsCompleted: int("lessonsCompleted").default(0),
  lessonsSkipped: int("lessonsSkipped").default(0),
  completionRate: float("completionRate"), // 0-1
  
  // Continuation metrics
  continuationSelected: boolean("continuationSelected").default(false),
  continuationCompleted: boolean("continuationCompleted").default(false),
  
  // User feedback
  userRating: int("userRating"), // 1-5 star rating
  userFeedback: text("userFeedback"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdaptationMetric = typeof adaptationMetrics.$inferSelect;
export type InsertAdaptationMetric = typeof adaptationMetrics.$inferInsert;

// ─── Prerequisite Fulfillment (Phase 2: Knowledge Assessment) ──────────────────
/**
 * Tracks whether user completed prerequisite lessons before advancing
 * Helps identify knowledge gaps and recommend micro-lessons
 */
export const prerequisiteFulfillment = mysqlTable("prerequisiteFulfillment", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  adaptationId: int("adaptationId").notNull(), // FK to userAdaptations
  
  // Prerequisite details
  prerequisiteTopic: varchar("prerequisiteTopic", { length: 255 }).notNull(),
  mainTopic: varchar("mainTopic", { length: 255 }).notNull(),
  
  // Fulfillment status
  status: mysqlEnum("status", [
    "not_required",
    "required_not_met",
    "required_met",
    "micro_lesson_offered",
    "micro_lesson_completed",
  ]).default("required_not_met"),
  
  // Micro-lesson tracking
  microLessonGenerated: boolean("microLessonGenerated").default(false),
  microLessonAccepted: boolean("microLessonAccepted").default(false),
  microLessonCompletedAt: timestamp("microLessonCompletedAt"),
  
  // Metrics
  prerequisiteQuizScore: float("prerequisiteQuizScore"), // 0-1 if taken
  timeSpentSeconds: int("timeSpentSeconds").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PrerequisiteFulfillment = typeof prerequisiteFulfillment.$inferSelect;
export type InsertPrerequisiteFulfillment = typeof prerequisiteFulfillment.$inferInsert;
