/**
 * Learning Ladder Schema
 * Defines the structure for progressive mastery levels in learning
 * Each concept has 5 levels of increasing depth and complexity
 */

import { pgTable, text, integer, timestamp, real, json, boolean, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Learning Ladder Levels:
 * 1. Foundation - What is it? (Basic definitions, core concepts)
 * 2. Understanding - How does it work? (Mechanisms, principles, examples)
 * 3. Application - Where is it used? (Real-world applications, case studies)
 * 4. Deep Dive - Why does it work? (Theory, math, advanced concepts)
 * 5. Mastery - Can you teach it? (Create content, solve problems, research)
 */

export const learningLadderLevels = pgTable("learning_ladder_levels", {
  id: serial("id").primaryKey(),
  conceptId: text("concept_id").notNull(),
  userId: text("user_id").notNull(),
  level: integer("level").notNull(), // 1-5
  
  // Content for this level
  title: text("title").notNull(), // e.g., "Foundation: What is Quantum Computing?"
  description: text("description"), // Level-specific description
  contentOutline: json("content_outline"), // Structured content for this level
  
  // Mastery tracking
  masteryScore: real("mastery_score").default(0), // 0-100, based on interactions
  interactionCount: integer("interaction_count").default(0), // Total interactions at this level
  correctAnswers: integer("correct_answers").default(0), // Correct quiz answers
  averageResponseTime: real("average_response_time"), // Seconds, for engagement tracking
  engagementScore: real("engagement_score").default(0), // 0-100, based on time spent, interactions
  
  // Spaced repetition for this level
  nextReviewDate: timestamp("next_review_date"),
  reviewCount: integer("review_count").default(0),
  easeFactor: real("ease_factor").default(2.5), // SM-2 algorithm
  interval: integer("interval").default(1), // Days until next review
  
  // Progression
  unlocked: boolean("unlocked").default(false),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Interaction Log for Mastery Detection
 * Tracks every interaction to intelligently detect mastery
 */
export const ladderInteractionLog = pgTable("ladder_interaction_log", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  conceptId: text("concept_id").notNull(),
  levelId: integer("level_id").notNull(),
  
  // Interaction type
  type: text("type").notNull(), // "quiz_answer", "video_watch", "note_taking", "discussion", "explanation"
  
  // Interaction data
  data: json("data"), // Flexible storage for interaction details
  
  // Quality metrics
  quality: real("quality").default(0), // 0-100, how well user performed
  confidence: real("confidence").default(0), // 0-100, user's self-reported confidence
  timeSpent: integer("time_spent"), // Seconds
  
  // Mastery signals
  signals: json("signals"), // Array of mastery signals detected
  
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Mastery Detection Model
 * Stores the AI model's assessment of user mastery
 */
export const masteryAssessment = pgTable("mastery_assessment", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  conceptId: text("concept_id").notNull(),
  levelId: integer("level_id").notNull(),
  
  // Assessment scores
  readinessScore: real("readiness_score").default(0), // 0-100, ready to advance?
  confidenceLevel: real("confidence_level").default(0), // 0-100, AI confidence in assessment
  
  // Mastery signals detected
  signals: json("signals"), // Array of detected mastery indicators
  
  // Recommendation
  recommendation: text("recommendation"), // "advance", "review", "practice", "skip"
  reason: text("reason"), // Why this recommendation
  
  // Assessment details
  assessmentData: json("assessment_data"), // Raw assessment data
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Adaptive Content for Each Level
 * Stores progressively complex content generated for each level
 */
export const adaptiveContent = pgTable("adaptive_content", {
  id: serial("id").primaryKey(),
  conceptId: text("concept_id").notNull(),
  level: integer("level").notNull(), // 1-5
  
  // Content
  mainContent: text("main_content"), // Primary learning material
  examples: json("examples"), // Array of examples for this level
  keyPoints: json("key_points"), // Array of key takeaways
  visualStoryboard: json("visual_storyboard"), // Lottie animations for this level
  
  // Difficulty metrics
  readabilityScore: real("readability_score"), // 0-100
  complexityScore: real("complexity_score"), // 0-100
  estimatedTime: integer("estimated_time"), // Minutes
  
  // Engagement elements
  quizzes: json("quizzes"), // Array of quiz questions for this level
  discussionPrompts: json("discussion_prompts"), // Array of discussion starters
  practiceProblems: json("practice_problems"), // Array of practice problems
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Learning Path with Ladder Progression
 * Tracks user's journey through the 5-level ladder for each concept
 */
export const learningPathWithLadder = pgTable("learning_path_with_ladder", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  conceptId: text("concept_id").notNull(),
  
  // Current position on ladder
  currentLevel: integer("current_level").default(1), // 1-5
  completedLevels: integer("completed_levels").default(0), // 0-5
  
  // Overall progress
  overallMastery: real("overall_mastery").default(0), // 0-100, average across all levels
  timeSpent: integer("time_spent").default(0), // Total seconds
  
  // Engagement
  totalInteractions: integer("total_interactions").default(0),
  streakDays: integer("streak_days").default(0),
  lastActivityDate: timestamp("last_activity_date"),
  
  // Timestamps
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

/**
 * Relations
 */
export const learningLadderLevelsRelations = relations(learningLadderLevels, ({ many }) => ({
  interactions: many(ladderInteractionLog),
  assessments: many(masteryAssessment),
}));

export const ladderInteractionLogRelations = relations(ladderInteractionLog, ({ one }) => ({
  level: one(learningLadderLevels, {
    fields: [ladderInteractionLog.levelId],
    references: [learningLadderLevels.id],
  }),
}));

export const masteryAssessmentRelations = relations(masteryAssessment, ({ one }) => ({
  level: one(learningLadderLevels, {
    fields: [masteryAssessment.levelId],
    references: [learningLadderLevels.id],
  }),
}));

export const adaptiveContentRelations = relations(adaptiveContent, ({ many }) => ({
  levels: many(learningLadderLevels),
}));

// Export types
export type LearningLadderLevel = typeof learningLadderLevels.$inferSelect;
export type LadderInteraction = typeof ladderInteractionLog.$inferSelect;
export type MasteryAssessmentRecord = typeof masteryAssessment.$inferSelect;
export type AdaptiveContentRecord = typeof adaptiveContent.$inferSelect;
export type LearningPathWithLadderRecord = typeof learningPathWithLadder.$inferSelect;
