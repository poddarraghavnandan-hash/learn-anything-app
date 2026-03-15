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
