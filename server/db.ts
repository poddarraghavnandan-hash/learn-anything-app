import { eq, and, inArray, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  topics,
  contentItems,
  InsertContentItem,
  concepts,
  InsertConcept,
  conceptPrerequisites,
  InsertConceptPrerequisite,
  conceptRelationships,
  InsertConceptRelationship,
  conceptContent,
  InsertConceptContent,
  userConceptMetrics,
  InsertUserConceptMetric,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Topics ───────────────────────────────────────────────────────────────────

export async function getAllTopics() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(topics);
}

export async function getTopicsBySlugs(slugs: string[]) {
  const db = await getDb();
  if (!db || slugs.length === 0) return [];
  return db.select().from(topics).where(inArray(topics.slug, slugs));
}

// ─── Content Items ────────────────────────────────────────────────────────────

export async function upsertContentItems(items: InsertContentItem[]) {
  const db = await getDb();
  if (!db || items.length === 0) return;
  for (const item of items) {
    try {
      await db.insert(contentItems).values(item).onDuplicateKeyUpdate({
        set: { title: item.title, description: item.description, thumbnailUrl: item.thumbnailUrl },
      });
    } catch (e) {
      // skip duplicates
    }
  }
}

export async function getContentForTopics(topicSlugs: string[], limit = 50) {
  const db = await getDb();
  if (!db || topicSlugs.length === 0) return [];
  return db
    .select()
    .from(contentItems)
    .where(and(inArray(contentItems.topicSlug, topicSlugs), eq(contentItems.isActive, true)))
    .orderBy(desc(contentItems.fetchedAt))
    .limit(limit);
}

export async function getContentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(contentItems).where(eq(contentItems.id, id)).limit(1);
  return result[0] ?? null;
}

export async function searchContent(query: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contentItems)
    .where(sql`MATCH(${contentItems.title}) AGAINST(${query}) OR ${contentItems.title} LIKE ${`%${query}%`}`)
    .limit(limit);
}

// ─── Concepts (Knowledge Graph) ──────────────────────────────────────────────

export async function upsertConcept(concept: InsertConcept) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(concepts).values(concept).onDuplicateKeyUpdate({
      set: { name: concept.name, description: concept.description, updatedAt: new Date() },
    });
  } catch (error) {
    console.error("[Database] Failed to upsert concept:", error);
    throw error;
  }
}

export async function getConceptBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(concepts).where(eq(concepts.slug, slug)).limit(1);
  return result[0] ?? null;
}

export async function getConceptById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(concepts).where(eq(concepts.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getAllConcepts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(concepts);
}

// ─── Concept Prerequisites ──────────────────────────────────────────────────────

export async function upsertConceptPrerequisite(prereq: InsertConceptPrerequisite) {
  const db = await getDb();
  if (!db) return;
  try {
    await db
      .insert(conceptPrerequisites)
      .values(prereq)
      .onDuplicateKeyUpdate({
        set: {
          confidence: prereq.confidence,
          relationshipType: prereq.relationshipType,
          cachedUntil: prereq.cachedUntil,
        },
      });
  } catch (error) {
    console.error("[Database] Failed to upsert concept prerequisite:", error);
    throw error;
  }
}

export async function getPrerequisitesForConcept(conceptId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conceptPrerequisites).where(eq(conceptPrerequisites.conceptId, conceptId));
}

export async function getPrerequisitesByConceptIds(conceptIds: number[]) {
  const db = await getDb();
  if (!db || conceptIds.length === 0) return [];
  return db
    .select()
    .from(conceptPrerequisites)
    .where(inArray(conceptPrerequisites.conceptId, conceptIds));
}

// ─── Concept Relationships ──────────────────────────────────────────────────────

export async function upsertConceptRelationship(rel: InsertConceptRelationship) {
  const db = await getDb();
  if (!db) return;
  try {
    await db
      .insert(conceptRelationships)
      .values(rel)
      .onDuplicateKeyUpdate({
        set: { strength: rel.strength, relationshipType: rel.relationshipType, cachedUntil: rel.cachedUntil },
      });
  } catch (error) {
    console.error("[Database] Failed to upsert concept relationship:", error);
    throw error;
  }
}

export async function getRelationshipsForConcept(conceptId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(conceptRelationships)
    .where(sql`${conceptRelationships.conceptAId} = ${conceptId} OR ${conceptRelationships.conceptBId} = ${conceptId}`);
}

// ─── Concept Content (Multi-layer) ──────────────────────────────────────────────

export async function upsertConceptContent(content: InsertConceptContent) {
  const db = await getDb();
  if (!db) return;
  try {
    await db
      .insert(conceptContent)
      .values(content)
      .onDuplicateKeyUpdate({
        set: { content: content.content, version: sql`${conceptContent.version} + 1` },
      });
  } catch (error) {
    console.error("[Database] Failed to upsert concept content:", error);
    throw error;
  }
}

export async function getConceptContent(conceptId: number, layer: "foundation" | "deepDive" | "expert") {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(conceptContent)
    .where(and(eq(conceptContent.conceptId, conceptId), eq(conceptContent.layer, layer)))
    .limit(1);
  return result[0] ?? null;
}

export async function getConceptContentByIds(conceptIds: number[]) {
  const db = await getDb();
  if (!db || conceptIds.length === 0) return [];
  return db.select().from(conceptContent).where(inArray(conceptContent.conceptId, conceptIds));
}

// ─── User Concept Metrics (Adaptive Assessment) ──────────────────────────────────

export async function upsertUserConceptMetric(metric: InsertUserConceptMetric) {
  const db = await getDb();
  if (!db) return;
  try {
    await db
      .insert(userConceptMetrics)
      .values(metric)
      .onDuplicateKeyUpdate({
        set: {
          quizAccuracy: metric.quizAccuracy,
          timeSpentSeconds: metric.timeSpentSeconds,
          confidenceInferred: metric.confidenceInferred,
          lastInteractionAt: new Date(),
        },
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user concept metric:", error);
    throw error;
  }
}

export async function getUserConceptMetric(userId: number, conceptId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(userConceptMetrics)
    .where(and(eq(userConceptMetrics.userId, userId), eq(userConceptMetrics.conceptId, conceptId)))
    .limit(1);
  return result[0] ?? null;
}

export async function getUserConceptMetrics(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userConceptMetrics).where(eq(userConceptMetrics.userId, userId));
}
