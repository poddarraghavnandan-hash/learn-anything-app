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

// ─── User Concept Metrics (adaptive assessment) ──────────────────────────────
export const userConceptMetrics = mysqlTable("userConceptMetrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  conceptId: int("conceptId").notNull(),
  quizAccuracy: float("quizAccuracy").default(0).notNull(), // 0-1 accuracy from quizzes
  timeSpentSeconds: int("timeSpentSeconds").default(0).notNull(),
  confidenceInferred: float("confidenceInferred").default(0).notNull(), // 0-1 inferred confidence
  lastInteractionAt: timestamp("lastInteractionAt").defaultNow().onUpdateNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserConceptMetric = typeof userConceptMetrics.$inferSelect;
export type InsertUserConceptMetric = typeof userConceptMetrics.$inferInsert;
