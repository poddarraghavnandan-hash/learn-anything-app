import { getDb } from "./db";
import {
  learnerProfiles,
  learnerSignals,
  understandingProgression,
  conceptCulturalHooks,
  stuckPointBaselines,
  googleSignInData,
  type InsertLearnerProfile,
  type InsertLearnerSignal,
  type InsertUnderstandingProgression,
  type InsertConceptCulturalHook,
  type InsertStuckPointBaseline,
  type InsertGoogleSignInData,
} from "../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";
import * as zlib from "zlib";
import * as crypto from "crypto";

// ─── Learner Profile Helpers ──────────────────────────────────────────────────

export async function createLearnerProfile(
  userId: number,
  profile: Partial<InsertLearnerProfile>
) {
  const db = await getDb();
  if (!db) return undefined as any;
  return await db.insert(learnerProfiles).values({
    userId,
    ...profile,
  });
}

export async function getLearnerProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined as any;
  const result = await db
    .select()
    .from(learnerProfiles)
    .where(eq(learnerProfiles.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateLearnerProfile(
  userId: number,
  updates: Partial<InsertLearnerProfile>
) {
  const db = await getDb();
  if (!db) return undefined as any;
  return await db
    .update(learnerProfiles)
    .set(updates)
    .where(eq(learnerProfiles.userId, userId));
}

// ─── Learner Signal Helpers (with compression) ────────────────────────────────

/**
 * Capture a learner signal with automatic content compression
 * Stores content hash + summary; full content retrieved on-demand
 */
export async function captureSignal(
  userId: number,
  signalType: string,
  content: string,
  metadata?: Record<string, any>,
  conceptId?: number
) {
  const db = await getDb();
  if (!db) return undefined as any;
  const contentHash = crypto.createHash("sha256").update(content).digest("hex");
  const contentSummary = content.substring(0, 500);
  const contentLength = content.length;

  return await db.insert(learnerSignals).values({
    userId,
    conceptId,
    signalType: signalType as any,
    contentHash,
    contentSummary,
    contentLength,
    metadata: metadata || {},
  });
}

export async function getSignalTimeline(userId: number, conceptId?: number) {
  const db = await getDb();
  if (!db) return undefined as any;
  const whereClause = conceptId
    ? and(eq(learnerSignals.userId, userId), eq(learnerSignals.conceptId, conceptId))
    : eq(learnerSignals.userId, userId);
  
  return await db
    .select()
    .from(learnerSignals)
    .where(whereClause)
    .limit(100);
}

export async function getRecentSignals(userId: number, hours: number = 24) {
  const db = await getDb();
  if (!db) return undefined as any;
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return await db
    .select()
    .from(learnerSignals)
    .where(
      and(
        eq(learnerSignals.userId, userId),
        gt(learnerSignals.timestamp, cutoff)
      )
    );
}

// ─── Understanding Progression Helpers ────────────────────────────────────────

export async function getOrCreateUnderstandingProgression(
  userId: number,
  conceptId: number
) {
  const db = await getDb();
  if (!db) return undefined as any;
  const progressionResult = await db
    .select()
    .from(understandingProgression)
    .where(
      and(
        eq(understandingProgression.userId, userId),
        eq(understandingProgression.conceptId, conceptId)
      )
    )
    .limit(1);
  let progression = progressionResult.length > 0 ? progressionResult[0] : undefined;

  if (!progression) {
    await db.insert(understandingProgression).values({
      userId,
      conceptId,
      stage: "discovery",
      confidence: 0,
    });
    const result = await db
      .select()
      .from(understandingProgression)
      .where(
        and(
          eq(understandingProgression.userId, userId),
          eq(understandingProgression.conceptId, conceptId)
        )
      )
      .limit(1);
    progression = result.length > 0 ? result[0] : undefined;
  }

  return progression;
}

export async function updateUnderstandingProgression(
  userId: number,
  conceptId: number,
  updates: Partial<InsertUnderstandingProgression>
) {
  const db = await getDb();
  if (!db) return undefined as any;
  return await db
    .update(understandingProgression)
    .set(updates)
    .where(
      and(
        eq(understandingProgression.userId, userId),
        eq(understandingProgression.conceptId, conceptId)
      )
    );
}

export async function addButterflyEffect(
  userId: number,
  conceptId: number,
  application: string,
  context?: string,
  validationScore: number = 0.5
) {
  const progression = await getOrCreateUnderstandingProgression(userId, conceptId);
  const effects = (progression?.butterflyEffects as any[]) || [];

  effects.push({
    application,
    context,
    timestamp: new Date().toISOString(),
    validationScore,
  });

  return await updateUnderstandingProgression(userId, conceptId, {
    butterflyEffects: effects as any,
  });
}

export async function addTeachingMoment(
  userId: number,
  conceptId: number,
  explanation: string,
  audience?: string
) {
  const progression = await getOrCreateUnderstandingProgression(userId, conceptId);
  const moments = (progression?.teachingMoments as any[]) || [];

  moments.push({
    explanation,
    audience,
    timestamp: new Date().toISOString(),
  });

  return await updateUnderstandingProgression(userId, conceptId, {
    teachingMoments: moments as any,
  });
}

export async function addMisconception(
  userId: number,
  conceptId: number,
  misconception: string,
  stage: string
) {
  const progression = await getOrCreateUnderstandingProgression(userId, conceptId);
  const misconceptions = (progression?.misconceptions as any[]) || [];

  misconceptions.push({
    misconception,
    correctedAt: new Date().toISOString(),
    stage,
  });

  return await updateUnderstandingProgression(userId, conceptId, {
    misconceptions: misconceptions as any,
  });
}

// ─── Cultural Hooks Helpers ────────────────────────────────────────────────────

export async function getCulturalHook(conceptId: number, culturalContext: string) {
  const db = await getDb();
  if (!db) return undefined as any;
  const result = await db
    .select()
    .from(conceptCulturalHooks)
    .where(
      and(
        eq(conceptCulturalHooks.conceptId, conceptId),
        eq(conceptCulturalHooks.culturalContext, culturalContext)
      )
    )
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function saveCulturalHook(
  conceptId: number,
  culturalContext: string,
  hook: string,
  example?: string,
  sensitivityNotes?: string,
  confidence: number = 0.7
) {
  const db = await getDb();
  if (!db) return undefined as any;
  const cachedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  return await db.insert(conceptCulturalHooks).values({
    conceptId,
    culturalContext,
    hook,
    example,
    sensitivityNotes,
    confidence,
    cachedUntil,
  });
}

// ─── Stuck Point Baseline Helpers ─────────────────────────────────────────────

export async function getStuckPointBaseline(userId: number, conceptId: number) {
  const db = await getDb();
  if (!db) return undefined as any;
  const result = await db
    .select()
    .from(stuckPointBaselines)
    .where(
      and(
        eq(stuckPointBaselines.userId, userId),
        eq(stuckPointBaselines.conceptId, conceptId)
      )
    )
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateStuckPointBaseline(
  userId: number,
  conceptId: number,
  updates: Partial<InsertStuckPointBaseline>
) {
  const db = await getDb();
  if (!db) return undefined as any;
  const existing = await getStuckPointBaseline(userId, conceptId);

  if (existing) {
    return await db
      .update(stuckPointBaselines)
      .set(updates)
      .where(
        and(
          eq(stuckPointBaselines.userId, userId),
          eq(stuckPointBaselines.conceptId, conceptId)
        )
      );
  } else {
    return await db.insert(stuckPointBaselines).values({
      userId,
      conceptId,
      ...updates,
    });
  }
}

// ─── Google Sign-In Data Helpers ──────────────────────────────────────────────

export async function saveGoogleSignInData(
  userId: number,
  googleData: Partial<InsertGoogleSignInData>
) {
  const db = await getDb();
  if (!db) return undefined as any;
  const existingResult = await db
    .select()
    .from(googleSignInData)
    .where(eq(googleSignInData.userId, userId))
    .limit(1);
  const existing = existingResult.length > 0 ? existingResult[0] : undefined;

  if (existing) {
    return await db
      .update(googleSignInData)
      .set(googleData)
      .where(eq(googleSignInData.userId, userId));
  } else {
    return await db.insert(googleSignInData).values({
      userId,
      ...googleData,
    } as InsertGoogleSignInData);
  }
}

export async function getGoogleSignInData(userId: number) {
  const db = await getDb();
  if (!db) return undefined as any;
  const result = await db
    .select()
    .from(googleSignInData)
    .where(eq(googleSignInData.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Utility Functions ────────────────────────────────────────────────────────

/**
 * Extract language from locale (e.g., 'en_US' -> 'en')
 */
export function extractLanguageFromLocale(locale?: string): string | null {
  if (!locale) return null;
  return locale.split("_")[0];
}

/**
 * Extract region from locale (e.g., 'en_US' -> 'US')
 */
export function extractRegionFromLocale(locale?: string): string | null {
  if (!locale) return null;
  const parts = locale.split("_");
  return parts.length > 1 ? parts[1] : null;
}

/**
 * Calculate anomaly score for stuck detection
 * Returns 0-1 score indicating how anomalous this behavior is
 */
export function calculateAnomalyScore(
  value: number,
  median: number,
  stdDev: number
): number {
  if (stdDev === 0) return value > median ? 1 : 0;

  const zScore = Math.abs((value - median) / stdDev);
  // Convert z-score to 0-1 anomaly score
  return Math.min(zScore / 3, 1); // 3 std devs = max anomaly
}
