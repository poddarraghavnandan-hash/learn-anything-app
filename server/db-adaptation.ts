import { eq, and, desc, inArray } from "drizzle-orm";
import {
  userAdaptations,
  lessonProgress,
  continuationHistory,
  contentGenerationCache,
  videoLessonPlans,
  adaptationMetrics,
  prerequisiteFulfillment,
  InsertUserAdaptation,
  InsertLessonProgress,
  InsertContinuationRecord,
  InsertContentGenerationCache,
  InsertVideoLessonPlan,
  InsertAdaptationMetric,
  InsertPrerequisiteFulfillment,
} from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Database Service Functions for Adaptation Pipeline
 *
 * Handles all database operations for the 7-phase intelligent content adaptation system
 */

// ─── User Adaptations (Phase 1: Request Intelligence) ──────────────────────────

export async function createUserAdaptation(
  data: InsertUserAdaptation
): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(userAdaptations).values(data);
    return (result as any).insertId as number;
  } catch (error) {
    console.error("[DB] Failed to create user adaptation:", error);
    throw error;
  }
}

export async function getUserAdaptation(adaptationId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(userAdaptations)
      .where(eq(userAdaptations.id, adaptationId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[DB] Failed to get user adaptation:", error);
    throw error;
  }
}

export async function getUserAdaptationsByUserId(userId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(userAdaptations)
      .where(eq(userAdaptations.userId, userId))
      .orderBy(desc(userAdaptations.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("[DB] Failed to get user adaptations:", error);
    throw error;
  }
}

export async function updateUserAdaptation(
  adaptationId: number,
  data: Partial<InsertUserAdaptation>
) {
  const db = await getDb();
  if (!db) return null;

  try {
    await db
      .update(userAdaptations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userAdaptations.id, adaptationId));

    return await getUserAdaptation(adaptationId);
  } catch (error) {
    console.error("[DB] Failed to update user adaptation:", error);
    throw error;
  }
}

// ─── Lesson Progress (Phase 4: Content Sequencing) ───────────────────────────

export async function createLessonProgress(
  data: InsertLessonProgress
): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(lessonProgress).values(data);
    return (result as any).insertId as number;
  } catch (error) {
    console.error("[DB] Failed to create lesson progress:", error);
    throw error;
  }
}

export async function getLessonProgress(progressId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(lessonProgress)
      .where(eq(lessonProgress.id, progressId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[DB] Failed to get lesson progress:", error);
    throw error;
  }
}

export async function getLessonProgressByAdaptation(adaptationId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(lessonProgress)
      .where(eq(lessonProgress.adaptationId, adaptationId))
      .orderBy(lessonProgress.lessonOrder);
  } catch (error) {
    console.error("[DB] Failed to get lesson progress by adaptation:", error);
    throw error;
  }
}

export async function updateLessonProgress(
  progressId: number,
  data: Partial<InsertLessonProgress>
) {
  const db = await getDb();
  if (!db) return null;

  try {
    await db
      .update(lessonProgress)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(lessonProgress.id, progressId));

    return await getLessonProgress(progressId);
  } catch (error) {
    console.error("[DB] Failed to update lesson progress:", error);
    throw error;
  }
}

// ─── Continuation History (Phase 5: Continuation Engine) ────────────────────

export async function createContinuationRecord(
  data: InsertContinuationRecord
): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(continuationHistory).values(data);
    return (result as any).insertId as number;
  } catch (error) {
    console.error("[DB] Failed to create continuation record:", error);
    throw error;
  }
}

export async function getContinuationHistory(adaptationId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(continuationHistory)
      .where(eq(continuationHistory.adaptationId, adaptationId))
      .orderBy(desc(continuationHistory.selectedAt));
  } catch (error) {
    console.error("[DB] Failed to get continuation history:", error);
    throw error;
  }
}

export async function updateContinuationRecord(
  recordId: number,
  data: Partial<InsertContinuationRecord>
) {
  const db = await getDb();
  if (!db) return null;

  try {
    await db
      .update(continuationHistory)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(continuationHistory.id, recordId));

    const result = await db
      .select()
      .from(continuationHistory)
      .where(eq(continuationHistory.id, recordId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[DB] Failed to update continuation record:", error);
    throw error;
  }
}

// ─── Content Generation Cache (Phase 3: Adaptive Content Generation) ────────

export async function getCachedContent(
  topic: string,
  contentLevel: number,
  sophisticationScore: number
) {
  const db = await getDb();
  if (!db) return null;

  try {
    // Find cache entry with matching topic and level, within sophistication range
    const result = await db
      .select()
      .from(contentGenerationCache)
      .where(
        and(
          eq(contentGenerationCache.topic, topic),
          eq(contentGenerationCache.contentLevel, contentLevel)
        )
      )
      .limit(1);

    if (result.length === 0) return null;

    const cache = result[0];

    // Check if cache is still valid
    if (new Date() > cache.expiresAt) {
      return null; // Cache expired
    }

    // Update usage stats
    await db
      .update(contentGenerationCache)
      .set({
        usageCount: (cache.usageCount || 0) + 1,
        lastUsedAt: new Date(),
      })
      .where(eq(contentGenerationCache.id, cache.id));

    return cache;
  } catch (error) {
    console.error("[DB] Failed to get cached content:", error);
    throw error;
  }
}

export async function cacheContent(
  data: InsertContentGenerationCache
): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(contentGenerationCache).values(data);
    return (result as any).insertId as number;
  } catch (error) {
    console.error("[DB] Failed to cache content:", error);
    throw error;
  }
}

// ─── Video Lesson Plans (Phase 6: Video Integration) ──────────────────────

export async function createVideoLessonPlan(
  data: InsertVideoLessonPlan
): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(videoLessonPlans).values(data);
    return (result as any).insertId as number;
  } catch (error) {
    console.error("[DB] Failed to create video lesson plan:", error);
    throw error;
  }
}

export async function getVideoLessonPlan(planId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(videoLessonPlans)
      .where(eq(videoLessonPlans.id, planId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[DB] Failed to get video lesson plan:", error);
    throw error;
  }
}

export async function getVideoLessonPlansByAdaptation(adaptationId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(videoLessonPlans)
      .where(eq(videoLessonPlans.adaptationId, adaptationId));
  } catch (error) {
    console.error("[DB] Failed to get video lesson plans:", error);
    throw error;
  }
}

export async function updateVideoLessonPlan(
  planId: number,
  data: Partial<InsertVideoLessonPlan>
) {
  const db = await getDb();
  if (!db) return null;

  try {
    await db
      .update(videoLessonPlans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(videoLessonPlans.id, planId));

    return await getVideoLessonPlan(planId);
  } catch (error) {
    console.error("[DB] Failed to update video lesson plan:", error);
    throw error;
  }
}

// ─── Adaptation Metrics (Analytics & Optimization) ────────────────────────

export async function createAdaptationMetric(
  data: InsertAdaptationMetric
): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(adaptationMetrics).values(data);
    return (result as any).insertId as number;
  } catch (error) {
    console.error("[DB] Failed to create adaptation metric:", error);
    throw error;
  }
}

export async function getAdaptationMetrics(adaptationId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(adaptationMetrics)
      .where(eq(adaptationMetrics.adaptationId, adaptationId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[DB] Failed to get adaptation metrics:", error);
    throw error;
  }
}

export async function updateAdaptationMetrics(
  metricsId: number,
  data: Partial<InsertAdaptationMetric>
) {
  const db = await getDb();
  if (!db) return null;

  try {
    await db
      .update(adaptationMetrics)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(adaptationMetrics.id, metricsId));

    const result = await db
      .select()
      .from(adaptationMetrics)
      .where(eq(adaptationMetrics.id, metricsId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[DB] Failed to update adaptation metrics:", error);
    throw error;
  }
}

// ─── Prerequisite Fulfillment (Phase 2: Knowledge Assessment) ──────────────

export async function createPrerequisiteFulfillment(
  data: InsertPrerequisiteFulfillment
): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(prerequisiteFulfillment).values(data);
    return (result as any).insertId as number;
  } catch (error) {
    console.error("[DB] Failed to create prerequisite fulfillment:", error);
    throw error;
  }
}

export async function getPrerequisiteFulfillment(adaptationId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(prerequisiteFulfillment)
      .where(eq(prerequisiteFulfillment.adaptationId, adaptationId));
  } catch (error) {
    console.error("[DB] Failed to get prerequisite fulfillment:", error);
    throw error;
  }
}

export async function updatePrerequisiteFulfillment(
  fulfillmentId: number,
  data: Partial<InsertPrerequisiteFulfillment>
) {
  const db = await getDb();
  if (!db) return null;

  try {
    await db
      .update(prerequisiteFulfillment)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(prerequisiteFulfillment.id, fulfillmentId));

    const result = await db
      .select()
      .from(prerequisiteFulfillment)
      .where(eq(prerequisiteFulfillment.id, fulfillmentId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[DB] Failed to update prerequisite fulfillment:", error);
    throw error;
  }
}

// ─── Aggregate Queries ────────────────────────────────────────────────────

export async function getUserAdaptationStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const adaptations = await db
      .select()
      .from(userAdaptations)
      .where(eq(userAdaptations.userId, userId));

    if (adaptations.length === 0) return null;

    // Calculate aggregate stats
    const totalAdaptations = adaptations.length;
    const completedAdaptations = adaptations.filter((a) => a.completedAt).length;
    const avgContentLevel =
      adaptations.reduce((sum, a) => sum + (a.recommendedContentLevel || 0), 0) /
      totalAdaptations;

    return {
      totalAdaptations,
      completedAdaptations,
      completionRate: completedAdaptations / totalAdaptations,
      avgContentLevel,
      recentTopics: adaptations.slice(0, 5).map((a) => a.topic),
    };
  } catch (error) {
    console.error("[DB] Failed to get user adaptation stats:", error);
    throw error;
  }
}

export async function getAdaptationJourney(adaptationId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const adaptation = await getUserAdaptation(adaptationId);
    if (!adaptation) return null;

    const lessons = await getLessonProgressByAdaptation(adaptationId);
    const continuations = await getContinuationHistory(adaptationId);
    const metrics = await getAdaptationMetrics(adaptationId);
    const prerequisites = await getPrerequisiteFulfillment(adaptationId);

    return {
      adaptation,
      lessons,
      continuations,
      metrics,
      prerequisites,
    };
  } catch (error) {
    console.error("[DB] Failed to get adaptation journey:", error);
    throw error;
  }
}
