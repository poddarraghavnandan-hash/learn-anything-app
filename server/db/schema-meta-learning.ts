import { mysqlTable, varchar, int, float, timestamp, text, json, boolean, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Meta-Learning Schema
 *
 * Tracks how each user learns best by experimenting with 9 different approaches
 * and measuring effectiveness across multiple dimensions
 */

// ─── Learning Approaches ──────────────────────────────────────────────────────
// The 9 innovative learning approaches the system experiments with

export const learningApproaches = mysqlTable("learning_approaches", {
  id: int().primaryKey().autoincrement(),
  name: varchar({ length: 50 }).notNull(), // "socratic", "problem_based", "experiential", etc.
  displayName: varchar({ length: 100 }).notNull(), // "Socratic Questioning", "Problem-Based Learning", etc.
  description: text().notNull(),
  category: varchar({ length: 50 }).notNull(), // "questioning", "problem_solving", "experience", "social", "creation", "competition", "micro", "discovery", "synthesis"
  icon: varchar({ length: 50 }).notNull(), // emoji or icon name
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── User Learning Profiles ──────────────────────────────────────────────────
// Tracks each user's learning profile and optimal approach mix

export const userLearningProfiles = mysqlTable("user_learning_profiles", {
  id: int().primaryKey().autoincrement(),
  userId: varchar({ length: 255 }).notNull().unique(),

  // Current learning profile
  preferredApproaches: json()
    .$type<{
      approachId: number;
      weight: number; // 0-100, sum should be ~100
      confidence: number; // 0-100, how confident we are in this weight
    }[]>()
    .notNull()
    .default([]),

  // Learning style indicators
  learningStyle: varchar({ length: 50 }), // "visual", "kinesthetic", "auditory", "reading"
  pacePreference: varchar({ length: 50 }), // "fast", "moderate", "slow"
  engagementLevel: int(), // 0-100
  confidenceLevel: int(), // 0-100

  // Stagnation tracking
  lastApproachChangeAt: timestamp("lastApproachChangeAt"),
  lastInnovationAt: timestamp("lastInnovationAt"),
  stagnationScore: int().default(0), // 0-100, triggers innovation if high

  // Evolution tracking
  totalLessonsCompleted: int().default(0),
  totalHoursLearned: float().default(0),
  approachExperimentsCompleted: int().default(0),

  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Learning Approach Experiments ────────────────────────────────────────────
// Records each time a user experiences a learning approach

export const learningApproachExperiments = mysqlTable(
  "learning_approach_experiments",
  {
    id: int().primaryKey().autoincrement(),
    userId: varchar({ length: 255 }).notNull(),
    topicId: int().notNull(),
    topicName: varchar({ length: 255 }).notNull(),
    approachId: int().notNull(),

    // Experiment metadata
    experimentSequence: int().notNull(), // Which # experiment is this for this user
    isRandomized: boolean().default(true), // Was this randomly assigned or user-chosen?

    // Effectiveness metrics (collected after completion)
    engagementScore: int(), // 0-100
    comprehensionScore: int(), // 0-100 (from assessment)
    retentionScore: int(), // 0-100 (from spaced repetition)
    applicationScore: int(), // 0-100 (can apply in new context?)
    confidenceScore: int(), // 0-100 (self-reported)
    overallEffectiveness: int(), // 0-100 (weighted average)

    // Behavioral metrics
    timeSpentSeconds: int(),
    attentionDropoffs: int(), // How many times did they pause/leave?
    completionPercentage: int(), // 0-100
    revisitCount: int(), // How many times did they return?

    // Learner feedback
    userRating: int(), // 1-5 stars
    userNotes: text(), // Free-form feedback

    // Status
    status: varchar({ length: 50 }).default("in_progress"), // "in_progress", "completed", "abandoned"

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
  },
  (table) => ({
    userIdx: index("idx_user_experiments").on(table.userId),
    topicIdx: index("idx_topic_experiments").on(table.topicId),
    approachIdx: index("idx_approach_experiments").on(table.approachId),
  })
);

// ─── Approach Effectiveness Scores ────────────────────────────────────────────
// Aggregated effectiveness scores for each user-approach combination

export const approachEffectivenessScores = mysqlTable(
  "approach_effectiveness_scores",
  {
    id: int().primaryKey().autoincrement(),
    userId: varchar({ length: 255 }).notNull(),
    approachId: int().notNull(),

    // Aggregated metrics
    totalExperiments: int().default(0),
    averageEngagement: float(),
    averageComprehension: float(),
    averageRetention: float(),
    averageApplication: float(),
    averageConfidence: float(),
    overallScore: float(), // 0-100, weighted average of all metrics

    // Trend analysis
    scoreImprovement: float(), // Positive = improving, negative = declining
    consistencyScore: float(), // 0-100, how consistent is performance?

    // User preference
    userPreference: int(), // 1-5 stars, explicit user rating

    // Last updated
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userApproachIdx: index("idx_user_approach").on(table.userId, table.approachId),
  })
);

// ─── Learning Approach Combinations ───────────────────────────────────────────
// Tracks combinations of approaches that work well together

export const approachCombinations = mysqlTable(
  "approach_combinations",
  {
    id: int().primaryKey().autoincrement(),
    userId: varchar({ length: 255 }).notNull(),

    // Combination definition
    approachIds: json().$type<number[]>().notNull(), // [approachId1, approachId2, ...]
    weights: json().$type<number[]>().notNull(), // [weight1, weight2, ...] - how much of each

    // Performance
    effectiveness: float(), // 0-100
    experimentCount: int().default(0),

    // Metadata
    discoveredAt: timestamp("discoveredAt").defaultNow().notNull(),
    lastUsedAt: timestamp("lastUsedAt"),
  },
  (table) => ({
    userIdx: index("idx_user_combinations").on(table.userId),
  })
);

// ─── Stagnation Events ────────────────────────────────────────────────────────
// Tracks when stagnation is detected and what innovation was triggered

export const stagnationEvents = mysqlTable(
  "stagnation_events",
  {
    id: int().primaryKey().autoincrement(),
    userId: varchar({ length: 255 }).notNull(),

    // Stagnation detection
    stagnationType: varchar({ length: 50 }).notNull(), // "performance_plateau", "approach_overuse", "content_repetition", "engagement_decline"
    stagnationScore: int(), // 0-100
    detectedAt: timestamp("detectedAt").defaultNow().notNull(),

    // Innovation triggered
    innovationApproach: varchar({ length: 50 }), // New approach introduced
    innovationDescription: text(),

    // Outcome
    resolutionScore: int(), // 0-100, did innovation help?
    resolvedAt: timestamp("resolvedAt"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("idx_stagnation_user").on(table.userId),
  })
);

// ─── Learning Milestones ──────────────────────────────────────────────────────
// Tracks major learning milestones and approach evolution

export const learningMilestones = mysqlTable(
  "learning_milestones",
  {
    id: int().primaryKey().autoincrement(),
    userId: varchar({ length: 255 }).notNull(),

    // Milestone
    type: varchar({ length: 50 }).notNull(), // "approach_mastery", "topic_mastery", "approach_evolution", "stagnation_breakthrough"
    title: varchar({ length: 255 }).notNull(),
    description: text(),

    // Data
    relatedApproachId: int(),
    relatedTopicId: int(),
    metricValue: float(), // The value that triggered this milestone

    // Metadata
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("idx_milestone_user").on(table.userId),
  })
);

// ─── Approach Recommendations ─────────────────────────────────────────────────
// AI-generated recommendations for next approaches to try

export const approachRecommendations = mysqlTable(
  "approach_recommendations",
  {
    id: int().primaryKey().autoincrement(),
    userId: varchar({ length: 255 }).notNull(),
    topicId: int().notNull(),

    // Recommendation
    recommendedApproachId: int().notNull(),
    recommendationReason: text().notNull(), // Why this approach?
    confidence: int(), // 0-100

    // Reasoning
    basedOnMetrics: json()
      .$type<{
        metric: string;
        value: number;
        weight: number;
      }[]>(),

    // Status
    status: varchar({ length: 50 }).default("pending"), // "pending", "accepted", "rejected", "completed"
    acceptedAt: timestamp("acceptedAt"),
    completedAt: timestamp("completedAt"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("idx_rec_user").on(table.userId),
    topicIdx: index("idx_rec_topic").on(table.topicId),
  })
);

// ─── Relations ─────────────────────────────────────────────────────────────────

export const userLearningProfilesRelations = relations(userLearningProfiles, ({ many }) => ({
  experiments: many(learningApproachExperiments),
  effectivenessScores: many(approachEffectivenessScores),
  combinations: many(approachCombinations),
  stagnationEvents: many(stagnationEvents),
  milestones: many(learningMilestones),
  recommendations: many(approachRecommendations),
}));

export const learningApproachExperimentsRelations = relations(
  learningApproachExperiments,
  ({ one }) => ({
    profile: one(userLearningProfiles, {
      fields: [learningApproachExperiments.userId],
      references: [userLearningProfiles.userId],
    }),
    approach: one(learningApproaches, {
      fields: [learningApproachExperiments.approachId],
      references: [learningApproaches.id],
    }),
  })
);

export const approachEffectivenessScoresRelations = relations(
  approachEffectivenessScores,
  ({ one }) => ({
    profile: one(userLearningProfiles, {
      fields: [approachEffectivenessScores.userId],
      references: [userLearningProfiles.userId],
    }),
    approach: one(learningApproaches, {
      fields: [approachEffectivenessScores.approachId],
      references: [learningApproaches.id],
    }),
  })
);
