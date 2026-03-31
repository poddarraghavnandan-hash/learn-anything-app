import { mysqlTable, varchar, int, float, timestamp, text, json, boolean, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Learning Behavior Profiler Schema
 *
 * Tracks user learning behavior patterns like TikTok tracks content preferences
 * Analyzes engagement, pacing, comprehension, and learning style to build personalized profiles
 */

// ─── Learning Behavior Signals ────────────────────────────────────────────────
// Real-time engagement and behavior tracking

export const learningBehaviorSignals = mysqlTable(
  "learning_behavior_signals",
  {
    id: int().primaryKey().autoincrement(),
    userId: varchar({ length: 255 }).notNull(),
    topicId: int().notNull(),
    approachId: int().notNull(),

    // Engagement signals (TikTok-style tracking)
    timeSpentSeconds: int().notNull(), // How long they spent
    attentionDropoffs: int().default(0), // How many times they paused/left
    revisitCount: int().default(0), // How many times they returned
    completionPercentage: int(), // 0-100
    scrollDepth: int(), // How far they scrolled (if applicable)
    interactionCount: int(), // Clicks, taps, inputs
    pauseResumePattern: json().$type<{ pausedAt: number; resumedAt: number }[]>(), // Pause/resume timeline

    // Comprehension signals
    assessmentScore: int(), // 0-100
    mistakesCount: int(), // Number of errors
    hintUsageCount: int(), // How many hints used
    clarificationQuestionsCount: int(), // How many "I don't understand" moments

    // Pacing signals
    averageReadingSpeed: float(), // words per minute (if text)
    averageClickSpeed: float(), // clicks per minute (if interactive)
    pauseBetweenActivities: int(), // seconds between activities
    rushingIndicators: int(), // Signs of rushing through content

    // Confidence signals
    selfReportedConfidence: int(), // 1-5 scale
    inferredConfidence: int(), // 0-100 (inferred from behavior)
    hesitationCount: int(), // Moments of hesitation
    correctionAttempts: int(), // How many times they tried to fix mistakes

    // Engagement type (what keeps them engaged)
    engagementType: varchar({ length: 50 }), // "visual", "kinesthetic", "auditory", "reading", "social", "competitive", "creative", "discovery"
    engagementScore: int(), // 0-100

    // Metadata
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("idx_behavior_user").on(table.userId),
    topicIdx: index("idx_behavior_topic").on(table.topicId),
    approachIdx: index("idx_behavior_approach").on(table.approachId),
  })
);

// ─── Learning Style Profiles ──────────────────────────────────────────────────
// Aggregated learning style for each user

export const learningStyleProfiles = mysqlTable(
  "learning_style_profiles",
  {
    id: int().primaryKey().autoincrement(),
    userId: varchar({ length: 255 }).notNull().unique(),

    // Primary learning modalities (weighted)
    visualLearning: float(), // 0-100
    kinestheticLearning: float(), // 0-100
    auditoryLearning: float(), // 0-100
    readingWritingLearning: float(), // 0-100

    // Engagement preferences (weighted)
    socialEngagement: float(), // 0-100 (learns better with others)
    competitiveEngagement: float(), // 0-100 (motivated by competition)
    creativeEngagement: float(), // 0-100 (motivated by creation)
    discoveryEngagement: float(), // 0-100 (motivated by exploration)

    // Pacing preferences
    preferredPace: varchar({ length: 50 }), // "fast", "moderate", "slow", "adaptive"
    preferredSessionLength: int(), // minutes
    preferredBreakFrequency: int(), // minutes between breaks

    // Cognitive style
    preferredComplexity: varchar({ length: 50 }), // "simple_first", "comprehensive", "example_first", "theory_first"
    preferredStructure: varchar({ length: 50 }), // "linear", "branching", "open_ended", "mixed"
    preferredFeedback: varchar({ length: 50 }), // "immediate", "delayed", "self_paced", "mixed"

    // Motivation drivers
    primaryMotivator: varchar({ length: 50 }), // "mastery", "achievement", "autonomy", "relatedness", "curiosity"
    secondaryMotivator: varchar({ length: 50 }),

    // Confidence profile
    baselineConfidence: int(), // 0-100
    confidenceGrowthRate: float(), // How fast confidence grows
    confidenceDecayRate: float(), // How fast confidence decays without practice

    // Attention profile
    averageAttentionSpan: int(), // seconds
    attentionDecayRate: float(), // How fast attention drops
    recoveryTime: int(), // seconds to recover attention after distraction

    // Learning efficiency
    conceptRetentionRate: float(), // 0-100
    transferabilityScore: float(), // 0-100 (ability to apply to new contexts)
    errorRecoverySpeed: float(), // How quickly they recover from mistakes

    // Metadata
    profileStrength: int(), // 0-100 (confidence in profile accuracy)
    lastUpdatedAt: timestamp("lastUpdatedAt").defaultNow().onUpdateNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  }
);

// ─── Learning Behavior Patterns ────────────────────────────────────────────────
// Identified patterns in learning behavior

export const learningBehaviorPatterns = mysqlTable(
  "learning_behavior_patterns",
  {
    id: int().primaryKey().autoincrement(),
    userId: varchar({ length: 255 }).notNull(),

    // Pattern identification
    patternType: varchar({ length: 50 }).notNull(), // "time_of_day", "topic_preference", "approach_preference", "difficulty_sweet_spot", "engagement_trigger", "stagnation_pattern"
    patternName: varchar({ length: 255 }).notNull(),
    description: text(),

    // Pattern data
    patternData: json().$type<Record<string, any>>(), // Flexible data structure
    confidence: int(), // 0-100, how confident we are in this pattern
    occurrenceCount: int(), // How many times observed
    lastObservedAt: timestamp("lastObservedAt"),

    // Pattern effectiveness
    effectivenessScore: int(), // 0-100
    predictiveValue: int(), // 0-100 (how well it predicts future behavior)

    // Metadata
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("idx_pattern_user").on(table.userId),
  })
);

// ─── Approach Effectiveness for User ───────────────────────────────────────────
// Tracks which approaches work best for this specific user

export const userApproachEffectiveness = mysqlTable(
  "user_approach_effectiveness",
  {
    id: int().primaryKey().autoincrement(),
    userId: varchar({ length: 255 }).notNull(),
    approachId: int().notNull(),

    // Effectiveness metrics
    totalExperiences: int().default(0),
    averageEngagement: float(), // 0-100
    averageComprehension: float(), // 0-100
    averageRetention: float(), // 0-100
    averageConfidence: float(), // 0-100
    overallEffectiveness: float(), // 0-100

    // Trend analysis
    improvementTrend: float(), // Positive = improving, negative = declining
    consistencyScore: float(), // 0-100 (how consistent is performance)
    predictabilityScore: float(), // 0-100 (how predictable is their performance with this approach)

    // Context effectiveness (when does this approach work best)
    bestForTopicTypes: json().$type<string[]>(), // ["math", "science", "language", ...]
    bestForDifficultyLevels: json().$type<string[]>(), // ["beginner", "intermediate", "advanced"]
    bestForTimeOfDay: json().$type<string[]>(), // ["morning", "afternoon", "evening"]
    bestForSessionLength: json().$type<string[]>(), // ["short", "medium", "long"]

    // User preference
    userPreference: int(), // 1-5 stars
    userNotes: text(),

    // Metadata
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userApproachIdx: index("idx_user_approach_eff").on(table.userId, table.approachId),
  })
);

// ─── Learning Context ──────────────────────────────────────────────────────────
// User's current learning context (age, knowledge level, goals, etc.)

export const learningContext = mysqlTable(
  "learning_context",
  {
    id: int().primaryKey().autoincrement(),
    userId: varchar({ length: 255 }).notNull().unique(),

    // Demographics
    age: int(),
    educationLevel: varchar({ length: 50 }), // "elementary", "middle", "high", "undergraduate", "graduate", "professional"

    // Knowledge baseline
    generalKnowledgeLevel: int(), // 0-100
    technicalKnowledgeLevel: int(), // 0-100
    languageProficiency: varchar({ length: 50 }), // "beginner", "intermediate", "advanced", "native"

    // Learning goals
    primaryGoal: varchar({ length: 255 }), // "career", "hobby", "certification", "personal_growth", "skill_specific"
    secondaryGoals: json().$type<string[]>(),
    timeAvailable: int(), // minutes per week
    targetCompletionDate: timestamp("targetCompletionDate"),

    // Proclivity (natural inclination)
    naturalStrengths: json().$type<string[]>(), // ["math", "writing", "visual_arts", ...]
    naturalWeaknesses: json().$type<string[]>(),
    preferredSubjects: json().$type<string[]>(),
    avoidedSubjects: json().$type<string[]>(),

    // Learning history
    previousLearningExperiences: text(), // Narrative description
    successfulLearningStrategies: json().$type<string[]>(),
    failedLearningStrategies: json().$type<string[]>(),

    // Current state
    currentMood: varchar({ length: 50 }), // "motivated", "tired", "frustrated", "bored", "excited"
    currentStressLevel: int(), // 0-100
    currentFocusLevel: int(), // 0-100

    // Metadata
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  }
);

// ─── Knowledge Assessment Results ──────────────────────────────────────────────
// Results from knowledge tests and assessments

export const knowledgeAssessments = mysqlTable(
  "knowledge_assessments",
  {
    id: int().primaryKey().autoincrement(),
    userId: varchar({ length: 255 }).notNull(),
    topicId: int().notNull(),
    topicName: varchar({ length: 255 }).notNull(),

    // Assessment type
    assessmentType: varchar({ length: 50 }).notNull(), // "baseline", "formative", "summative", "diagnostic"
    assessmentMethod: varchar({ length: 50 }), // "quiz", "essay", "project", "interview", "observation"

    // Results
    score: int(), // 0-100
    timeSpent: int(), // seconds
    questionsAttempted: int(),
    questionsCorrect: int(),
    conceptsMastered: json().$type<string[]>(),
    conceptsPartiallyMastered: json().$type<string[]>(),
    conceptsNotMastered: json().$type<string[]>(),

    // Misconceptions identified
    misconceptions: json().$type<{
      concept: string;
      misconception: string;
      severity: "low" | "medium" | "high";
    }[]>(),

    // Metadata
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("idx_assessment_user").on(table.userId),
    topicIdx: index("idx_assessment_topic").on(table.topicId),
  })
);

// ─── Relations ─────────────────────────────────────────────────────────────────

export const learningStyleProfilesRelations = relations(learningStyleProfiles, ({ many }) => ({
  behaviorSignals: many(learningBehaviorSignals),
  behaviorPatterns: many(learningBehaviorPatterns),
  approachEffectiveness: many(userApproachEffectiveness),
}));

export const learningBehaviorSignalsRelations = relations(learningBehaviorSignals, ({ one }) => ({
  profile: one(learningStyleProfiles, {
    fields: [learningBehaviorSignals.userId],
    references: [learningStyleProfiles.userId],
  }),
}));

export const learningBehaviorPatternsRelations = relations(learningBehaviorPatterns, ({ one }) => ({
  profile: one(learningStyleProfiles, {
    fields: [learningBehaviorPatterns.userId],
    references: [learningStyleProfiles.userId],
  }),
}));

export const userApproachEffectivenessRelations = relations(userApproachEffectiveness, ({ one }) => ({
  profile: one(learningStyleProfiles, {
    fields: [userApproachEffectiveness.userId],
    references: [learningStyleProfiles.userId],
  }),
}));
