/**
 * ArxiVisuals Database Schema
 * Stores research papers, extracted concepts, teaching plans, and generated content
 */

import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  varchar,
  decimal,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// PAPERS TABLE
// ============================================================================

export const arxivPapers = pgTable(
  "arxiv_papers",
  {
    id: varchar("id", { length: 50 }).primaryKey(), // arXiv ID (e.g., "2401.12345")
    title: text("title").notNull(),
    abstract: text("abstract").notNull(),
    authors: jsonb("authors").notNull(), // Array of author names
    categories: jsonb("categories").notNull(), // Array of arXiv categories (e.g., ["cs.AI", "cs.LG"])
    publishedDate: timestamp("published_date").notNull(),
    updatedDate: timestamp("updated_date").notNull(),
    pdfUrl: text("pdf_url").notNull(),
    arxivUrl: text("arxiv_url").notNull(),
    citationCount: integer("citation_count").default(0),
    viewCount: integer("view_count").default(0),
    processingStatus: varchar("processing_status", {
      enum: ["pending", "extracting", "planning", "generating", "complete", "failed"],
    }).default("pending"),
    processingError: text("processing_error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    categoryIdx: index("papers_category_idx").on(table.categories),
    statusIdx: index("papers_status_idx").on(table.processingStatus),
    createdIdx: index("papers_created_idx").on(table.createdAt),
  })
);

// ============================================================================
// CONCEPTS TABLE
// ============================================================================

export const paperConcepts = pgTable(
  "paper_concepts",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    paperId: varchar("paper_id", { length: 50 })
      .notNull()
      .references(() => arxivPapers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    definition: text("definition").notNull(),
    importance: varchar("importance", {
      enum: ["core", "supporting", "advanced"],
    }).notNull(),
    prerequisites: jsonb("prerequisites").default([]), // Array of concept names
    relatedConcepts: jsonb("related_concepts").default([]), // Array of concept names
    keyEquations: jsonb("key_equations").default([]), // Array of equations
    examples: jsonb("examples").default([]), // Array of example strings
    explanation: text("explanation"),
    analogy: text("analogy"),
    commonMisconceptions: jsonb("common_misconceptions").default([]),
    difficulty: integer("difficulty").default(5), // 1-10 scale
    estimatedLearningTime: integer("estimated_learning_time").default(5), // minutes
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    paperIdx: index("concepts_paper_idx").on(table.paperId),
    nameIdx: index("concepts_name_idx").on(table.name),
  })
);

// ============================================================================
// TEACHING PLANS TABLE
// ============================================================================

export const teachingPlans = pgTable(
  "teaching_plans",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    paperId: varchar("paper_id", { length: 50 })
      .notNull()
      .references(() => arxivPapers.id, { onDelete: "cascade" }),
    totalSteps: integer("total_steps").notNull(),
    estimatedTotalTime: integer("estimated_total_time").notNull(), // minutes
    difficulty: varchar("difficulty", {
      enum: ["beginner", "intermediate", "advanced"],
    }).notNull(),
    learningOutcomes: jsonb("learning_outcomes").notNull(), // Array of outcomes
    assessmentStrategy: text("assessment_strategy").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    paperIdx: index("plans_paper_idx").on(table.paperId),
  })
);

// ============================================================================
// LESSON STEPS TABLE
// ============================================================================

export const lessonSteps = pgTable(
  "lesson_steps",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    planId: integer("plan_id")
      .notNull()
      .references(() => teachingPlans.id, { onDelete: "cascade" }),
    stepNumber: integer("step_number").notNull(),
    title: text("title").notNull(),
    learningObjective: text("learning_objective").notNull(),
    keyInsight: text("key_insight").notNull(),
    visualMetaphor: text("visual_metaphor").notNull(),
    exampleUseCase: text("example_use_case").notNull(),
    estimatedTime: integer("estimated_time").notNull(), // minutes
    difficulty: varchar("difficulty", {
      enum: ["beginner", "intermediate", "advanced"],
    }).notNull(),
    concepts: jsonb("concepts").notNull(), // Array of concept names
    prerequisites: jsonb("prerequisites").default([]), // Array of step numbers
    quizQuestions: integer("quiz_questions").default(3),
    introduction: text("introduction"),
    mainContent: text("main_content"),
    keyPoints: jsonb("key_points").default([]),
    visualizationGuide: text("visualization_guide"),
    realWorldApplication: text("real_world_application"),
    commonMisconceptions: jsonb("common_misconceptions").default([]),
    transitionToNext: text("transition_to_next"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    planIdx: index("steps_plan_idx").on(table.planId),
    stepIdx: index("steps_step_idx").on(table.stepNumber),
  })
);

// ============================================================================
// VIDEO STORYBOARDS TABLE
// ============================================================================

export const videoStoryboards = pgTable(
  "video_storyboards",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    stepId: integer("step_id")
      .notNull()
      .references(() => lessonSteps.id, { onDelete: "cascade" }),
    totalDuration: integer("total_duration").notNull(), // seconds
    sceneCount: integer("scene_count").notNull(),
    storyboardData: jsonb("storyboard_data").notNull(), // Array of scenes
    generationStatus: varchar("generation_status", {
      enum: ["pending", "generating", "complete", "failed"],
    }).default("pending"),
    videoUrl: text("video_url"),
    thumbnailUrl: text("thumbnail_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    stepIdx: index("storyboards_step_idx").on(table.stepId),
    statusIdx: index("storyboards_status_idx").on(table.generationStatus),
  })
);

// ============================================================================
// ASSESSMENTS TABLE
// ============================================================================

export const lessonAssessments = pgTable(
  "lesson_assessments",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    stepId: integer("step_id")
      .notNull()
      .references(() => lessonSteps.id, { onDelete: "cascade" }),
    questionNumber: integer("question_number").notNull(),
    type: varchar("type", {
      enum: ["multiple_choice", "fill_blank", "true_false", "application"],
    }).notNull(),
    question: text("question").notNull(),
    options: jsonb("options"), // Array of options for multiple choice
    correctAnswer: text("correct_answer").notNull(),
    explanation: text("explanation").notNull(),
    difficulty: varchar("difficulty", {
      enum: ["easy", "medium", "hard"],
    }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    stepIdx: index("assessments_step_idx").on(table.stepId),
  })
);

// ============================================================================
// USER PAPER PROGRESS TABLE
// ============================================================================

export const userPaperProgress = pgTable(
  "user_paper_progress",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id").notNull(),
    paperId: varchar("paper_id", { length: 50 })
      .notNull()
      .references(() => arxivPapers.id, { onDelete: "cascade" }),
    status: varchar("status", {
      enum: ["started", "in_progress", "completed", "abandoned"],
    }).default("started"),
    currentStep: integer("current_step").default(1),
    completedSteps: jsonb("completed_steps").default([]), // Array of step numbers
    totalTimeSpent: integer("total_time_spent").default(0), // seconds
    averageQuizScore: decimal("average_quiz_score", { precision: 5, scale: 2 }).default("0"),
    conceptsMastered: jsonb("concepts_mastered").default([]), // Array of concept names
    startedAt: timestamp("started_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    lastAccessedAt: timestamp("last_accessed_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("progress_user_idx").on(table.userId),
    paperIdx: index("progress_paper_idx").on(table.paperId),
    statusIdx: index("progress_status_idx").on(table.status),
  })
);

// ============================================================================
// USER PAPER RATINGS TABLE
// ============================================================================

export const userPaperRatings = pgTable(
  "user_paper_ratings",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id").notNull(),
    paperId: varchar("paper_id", { length: 50 })
      .notNull()
      .references(() => arxivPapers.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // 1-5 stars
    videoQualityRating: integer("video_quality_rating"), // 1-5
    explanationClarity: integer("explanation_clarity"), // 1-5
    paceRating: integer("pace_rating"), // 1-5
    feedback: text("feedback"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("ratings_user_idx").on(table.userId),
    paperIdx: index("ratings_paper_idx").on(table.paperId),
  })
);

// ============================================================================
// RELATIONS
// ============================================================================

export const arxivPapersRelations = relations(arxivPapers, ({ many }) => ({
  concepts: many(paperConcepts),
  teachingPlans: many(teachingPlans),
  userProgress: many(userPaperProgress),
  userRatings: many(userPaperRatings),
}));

export const paperConceptsRelations = relations(paperConcepts, ({ one }) => ({
  paper: one(arxivPapers, {
    fields: [paperConcepts.paperId],
    references: [arxivPapers.id],
  }),
}));

export const teachingPlansRelations = relations(teachingPlans, ({ one, many }) => ({
  paper: one(arxivPapers, {
    fields: [teachingPlans.paperId],
    references: [arxivPapers.id],
  }),
  steps: many(lessonSteps),
}));

export const lessonStepsRelations = relations(lessonSteps, ({ one, many }) => ({
  plan: one(teachingPlans, {
    fields: [lessonSteps.planId],
    references: [teachingPlans.id],
  }),
  storyboards: many(videoStoryboards),
  assessments: many(lessonAssessments),
}));

export const videoStoryboardsRelations = relations(videoStoryboards, ({ one }) => ({
  step: one(lessonSteps, {
    fields: [videoStoryboards.stepId],
    references: [lessonSteps.id],
  }),
}));

export const lessonAssessmentsRelations = relations(lessonAssessments, ({ one }) => ({
  step: one(lessonSteps, {
    fields: [lessonAssessments.stepId],
    references: [lessonSteps.id],
  }),
}));

export const userPaperProgressRelations = relations(userPaperProgress, ({ one }) => ({
  paper: one(arxivPapers, {
    fields: [userPaperProgress.paperId],
    references: [arxivPapers.id],
  }),
}));

export const userPaperRatingsRelations = relations(userPaperRatings, ({ one }) => ({
  paper: one(arxivPapers, {
    fields: [userPaperRatings.paperId],
    references: [arxivPapers.id],
  }),
}));
