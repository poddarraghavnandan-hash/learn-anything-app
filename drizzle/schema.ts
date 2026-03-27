import {
  boolean,
  float,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users (auth framework) ──────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Topics ───────────────────────────────────────────────────────────────────
export const topics = mysqlTable("topics", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  emoji: varchar("emoji", { length: 10 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  searchKeywords: text("searchKeywords"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Topic = typeof topics.$inferSelect;

// ─── Content Items ────────────────────────────────────────────────────────────
export const contentItems = mysqlTable("contentItems", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["video", "article"]).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  source: varchar("source", { length: 100 }).notNull(),
  channelOrAuthor: varchar("channelOrAuthor", { length: 255 }),
  durationSeconds: int("durationSeconds"),
  topicSlug: varchar("topicSlug", { length: 100 }),
  qualityScore: float("qualityScore").default(0.5),
  publishedAt: varchar("publishedAt", { length: 50 }),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
  isActive: boolean("isActive").default(true).notNull(),
});

export type ContentItem = typeof contentItems.$inferSelect;
export type InsertContentItem = typeof contentItems.$inferInsert;

// ─── Concepts (for knowledge graph) ──────────────────────────────────────────
export const concepts = mysqlTable("concepts", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  topicSlug: varchar("topicSlug", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Concept = typeof concepts.$inferSelect;
export type InsertConcept = typeof concepts.$inferInsert;

// ─── Concept Prerequisites (implicit knowledge graph) ─────────────────────────
export const conceptPrerequisites = mysqlTable("conceptPrerequisites", {
  id: int("id").autoincrement().primaryKey(),
  conceptId: int("conceptId").notNull(),
  prerequisiteId: int("prerequisiteId").notNull(),
  confidence: float("confidence").default(0.5).notNull(), // 0-1 confidence score
  relationshipType: varchar("relationshipType", { length: 50 }).default("prerequisite").notNull(), // prerequisite, related, extends, etc.
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  cachedUntil: timestamp("cachedUntil").notNull(), // TTL for cache invalidation
});

export type ConceptPrerequisite = typeof conceptPrerequisites.$inferSelect;
export type InsertConceptPrerequisite = typeof conceptPrerequisites.$inferInsert;

// ─── Concept Relationships (bidirectional graph) ──────────────────────────────
export const conceptRelationships = mysqlTable("conceptRelationships", {
  id: int("id").autoincrement().primaryKey(),
  conceptAId: int("conceptAId").notNull(),
  conceptBId: int("conceptBId").notNull(),
  relationshipType: varchar("relationshipType", { length: 50 }).notNull(), // prerequisite, related, extends, opposite, etc.
  strength: float("strength").default(0.5).notNull(), // 0-1 strength of relationship
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  cachedUntil: timestamp("cachedUntil").notNull(),
});

export type ConceptRelationship = typeof conceptRelationships.$inferSelect;
export type InsertConceptRelationship = typeof conceptRelationships.$inferInsert;

// ─── Concept Content (multi-layer content: Foundation/Deep Dive/Expert) ──────
export const conceptContent = mysqlTable("conceptContent", {
  id: int("id").autoincrement().primaryKey(),
  conceptId: int("conceptId").notNull(),
  layer: mysqlEnum("layer", ["foundation", "deepDive", "expert"]).notNull(),
  content: text("content").notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  version: int("version").default(1).notNull(),
});

export type ConceptContentRecord = typeof conceptContent.$inferSelect;
export type InsertConceptContent = typeof conceptContent.$inferInsert;

// ─── User Concept Metrics (adaptive assessment + spaced repetition) ──────────
export const userConceptMetrics = mysqlTable("userConceptMetrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  conceptId: int("conceptId").notNull(),
  conceptName: varchar("conceptName", { length: 255 }),
  quizAccuracy: float("quizAccuracy").default(0).notNull(),
  timeSpentSeconds: int("timeSpentSeconds").default(0).notNull(),
  confidenceInferred: float("confidenceInferred").default(0).notNull(),
  easeFactor: float("easeFactor").default(2.5).notNull(),
  interval: int("interval").default(1).notNull(),
  repetitions: int("repetitions").default(0).notNull(),
  nextReviewDate: timestamp("nextReviewDate").defaultNow().notNull(),
  lastReviewDate: timestamp("lastReviewDate"),
  reviewCount: int("reviewCount").default(0).notNull(),
  lastInteractionAt: timestamp("lastInteractionAt").defaultNow().onUpdateNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserConceptMetric = typeof userConceptMetrics.$inferSelect;
export type InsertUserConceptMetric = typeof userConceptMetrics.$inferInsert;

// ─── Learner Profiles (continuous profiling) ──────────────────────────────────
export const learnerProfiles = mysqlTable("learnerProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  
  // Cognitive style (inferred from behavior)
  cognitiveStyle: varchar("cognitiveStyle", { length: 50 }), // visual|narrative|logical|kinesthetic|mixed
  
  // Problem frame (what they care about)
  primaryProblemFrame: text("primaryProblemFrame"),
  
  // Cultural context (inferred from signals + explicit)
  culturalContext: varchar("culturalContext", { length: 255 }),
  culturalContextConfidence: float("culturalContextConfidence").default(0.5), // 0-1
  culturalContextSource: varchar("culturalContextSource", { length: 50 }), // google_signin|language_signals|ip_location|explicit
  
  // Meaning-making pattern (how they make sense of things)
  meaningMakingPattern: varchar("meaningMakingPattern", { length: 50 }), // ethics|systems|aesthetics|utility|creativity
  
  // Integration style (how they apply knowledge)
  integrationStyle: varchar("integrationStyle", { length: 50 }), // application|teaching|creation|reflection
  
  // Learning pace (inferred)
  learningPace: varchar("learningPace", { length: 50 }), // fast|moderate|deep
  
  // Engagement level (current)
  engagementLevel: varchar("engagementLevel", { length: 50 }).default("medium"), // high|medium|low
  
  // Stuck point baseline (median of all stuck points)
  stuckPointMedian: int("stuckPointMedian").default(0), // seconds
  stuckPointStdDev: int("stuckPointStdDev").default(0), // for anomaly detection
  
  // Profile completeness (0-1)
  completeness: float("completeness").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LearnerProfile = typeof learnerProfiles.$inferSelect;
export type InsertLearnerProfile = typeof learnerProfiles.$inferInsert;

// ─── Learner Signals (compressed storage with on-demand retrieval) ────────────
export const learnerSignals = mysqlTable("learnerSignals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  conceptId: int("conceptId"),
  
  // Signal type
  signalType: mysqlEnum("signalType", ["question", "connection", "application", "teaching", "stuck", "breakthrough", "feedback"]).notNull(),
  
  // Compressed content (store hash + summary, retrieve full on demand)
  contentHash: varchar("contentHash", { length: 64 }), // SHA256 of full content
  contentSummary: varchar("contentSummary", { length: 500 }), // First 500 chars for quick analysis
  contentLength: int("contentLength"), // For storage optimization
  
  // Metadata (JSON, compressed)
  metadata: json("metadata"), // { confidence, depth, stage, etc. }
  
  // Timestamps
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  

});

export type LearnerSignal = typeof learnerSignals.$inferSelect;
export type InsertLearnerSignal = typeof learnerSignals.$inferInsert;

// ─── Understanding Progression (track understanding stage per concept) ────────
export const understandingProgression = mysqlTable("understandingProgression", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  conceptId: int("conceptId").notNull(),
  
  // Understanding stage
  stage: mysqlEnum("stage", ["discovery", "exploration", "application", "mastery", "teaching"]).default("discovery"),
  
  // Confidence (0-1, fluid)
  confidence: float("confidence").default(0),
  
  // When they were last stuck
  lastStuckAt: timestamp("lastStuckAt"),
  stuckDuration: int("stuckDuration"), // seconds
  stuckEvidence: text("stuckEvidence"), // What made us think they were stuck?
  
  // Butterfly effects (real-world applications) - JSON compressed
  butterflyEffects: json("butterflyEffects"), // [{ application, context, timestamp, validationScore }]
  
  // Teaching moments (they explained it to others) - JSON compressed
  teachingMoments: json("teachingMoments"), // [{ explanation, audience, timestamp }]
  
  // Misconceptions - JSON compressed
  misconceptions: json("misconceptions"), // [{ misconception, correctedAt, stage }]
  
  // Questions asked (count, not full text)
  questionsAsked: int("questionsAsked").default(0),
  questionsAvgQuality: float("questionsAvgQuality").default(0), // 0-1 quality score
  
  // Time spent
  timeSpentSeconds: int("timeSpentSeconds").default(0),
  
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  

});

export type UnderstandingProgression = typeof understandingProgression.$inferSelect;
export type InsertUnderstandingProgression = typeof understandingProgression.$inferInsert;

// ─── Concept Cultural Hooks (cached, only generated when context known) ───────
export const conceptCulturalHooks = mysqlTable("conceptCulturalHooks", {
  id: int("id").autoincrement().primaryKey(),
  conceptId: int("conceptId").notNull(),
  
  // Cultural context (region/language/background)
  culturalContext: varchar("culturalContext", { length: 255 }).notNull(),
  
  // The hook (engaging entry point)
  hook: text("hook").notNull(),
  
  // Example (culturally relevant)
  example: text("example"),
  
  // Sensitivity notes (what to be aware of)
  sensitivityNotes: text("sensitivityNotes"),
  
  // Confidence (0-1)
  confidence: float("confidence").default(0.7),
  
  // Cache TTL
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  cachedUntil: timestamp("cachedUntil").notNull(),
  

});

export type ConceptCulturalHook = typeof conceptCulturalHooks.$inferSelect;
export type InsertConceptCulturalHook = typeof conceptCulturalHooks.$inferInsert;

// ─── Stuck Point Baselines (per-learner adaptation) ──────────────────────────
export const stuckPointBaselines = mysqlTable("stuckPointBaselines", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  conceptId: int("conceptId").notNull(),
  
  // Baseline metrics for this learner on this concept
  timeSpentMedian: int("timeSpentMedian"), // Median time before they get unstuck
  timeSpentStdDev: int("timeSpentStdDev"), // For anomaly detection
  
  // Stuck detection signals
  videoRepeatsMedian: int("videoRepeatsMedian"), // Median times they rewatch before understanding
  questionRepeatsMedian: int("questionRepeatsMedian"), // Median similar questions before understanding
  
  // When we last updated this
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  

});

export type StuckPointBaseline = typeof stuckPointBaselines.$inferSelect;
export type InsertStuckPointBaseline = typeof stuckPointBaselines.$inferInsert;

// ─── Google Sign-In Data (for context inference) ────────────────────────────
export const googleSignInData = mysqlTable("googleSignInData", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  
  // From Google Sign-In
  googleId: varchar("googleId", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  name: varchar("name", { length: 255 }),
  picture: text("picture"),
  locale: varchar("locale", { length: 10 }), // e.g., 'en_US', 'es_MX'
  
  // Inferred context
  language: varchar("language", { length: 10 }), // Primary language
  region: varchar("region", { length: 50 }), // Inferred from locale
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GoogleSignInData = typeof googleSignInData.$inferSelect;
export type InsertGoogleSignInData = typeof googleSignInData.$inferInsert;
