import crypto from "crypto";
import zlib from "zlib";
import { promisify } from "util";
import {
  captureSignal as recordSignal,
  getSignalTimeline,
  getRecentSignals as getRecentSignalsDb,
} from "./db-learner-epistemology";

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

// ─── Types ───────────────────────────────────────────────────────────────────

export type SignalType = "question" | "connection" | "application" | "teaching" | "stuck" | "breakthrough" | "feedback";

export interface SignalMetadata {
  confidence?: number; // 0-1
  depth?: "surface" | "intermediate" | "deep";
  stage?: "discovery" | "exploration" | "application" | "mastery" | "teaching";
  emotionalTone?: "frustrated" | "curious" | "confident" | "struggling" | "excited";
  contextualRelevance?: number; // 0-1
  [key: string]: any;
}

export interface Signal {
  userId: number;
  conceptId?: number;
  signalType: SignalType;
  content: string; // Full content (not stored, used for analysis)
  metadata?: SignalMetadata;
  timestamp?: Date;
}

export interface CompressedSignal {
  id: number;
  userId: number;
  conceptId: number | null;
  signalType: SignalType;
  contentHash: string | null;
  contentSummary: string | null;
  contentLength: number | null;
  metadata: unknown;
  timestamp: Date;
}

export interface SignalAnalysis {
  totalSignals: number;
  signalsByType: Record<SignalType, number>;
  averageConfidence: number;
  averageDepth: "surface" | "intermediate" | "deep";
  emotionalTrend: Record<string, number>;
  recentBreakthroughs: number;
  recentStuckPoints: number;
  connectionsMade: number;
  applicationsAttempted: number;
  teachingMoments: number;
}

// ─── Content Compression ──────────────────────────────────────────────────────

/**
 * Compress content using gzip for efficient storage
 */
export async function compressContentForStorage(content: string): Promise<Buffer> {
  try {
    return await gzip(content);
  } catch (error) {
    console.error("Failed to compress content:", error);
    throw error;
  }
}

/**
 * Decompress content from storage
 */
export async function decompressContentFromStorage(compressed: Buffer): Promise<string> {
  try {
    const decompressed = await gunzip(compressed);
    return decompressed.toString("utf-8");
  } catch (error) {
    console.error("Failed to decompress content:", error);
    throw error;
  }
}

/**
 * Generate SHA256 hash of content for deduplication
 */
export function hashContent(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Extract summary from content (first 500 chars or first sentence)
 */
export function extractSummary(content: string, maxLength: number = 500): string {
  if (content.length <= maxLength) {
    return content;
  }

  // Try to break at sentence boundary
  const truncated = content.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf(".");
  const lastNewline = truncated.lastIndexOf("\n");
  const breakPoint = Math.max(lastPeriod, lastNewline);

  if (breakPoint > maxLength * 0.7) {
    return content.substring(0, breakPoint + 1);
  }

  return truncated + "...";
}

// ─── Signal Recording ────────────────────────────────────────────────────────

/**
 * Record a signal with automatic compression and metadata extraction
 */
export async function captureSignal(signal: Signal): Promise<CompressedSignal> {
  // Extract metadata from content if not provided
  const metadata = signal.metadata || extractMetadataFromContent(signal.content, signal.signalType);

  // Generate content hash
  const contentHash = hashContent(signal.content);

  // Extract summary
  const contentSummary = extractSummary(signal.content);

  // Store in database
  await recordSignal(
    signal.userId,
    signal.signalType,
    signal.content,
    metadata,
    signal.conceptId
  );

  // Return compressed signal representation
  return {
    id: 0, // Will be set by database
    userId: signal.userId,
    conceptId: signal.conceptId || null,
    signalType: signal.signalType,
    contentHash,
    contentSummary,
    contentLength: signal.content.length,
    metadata,
    timestamp: signal.timestamp || new Date(),
  } as CompressedSignal;
}

/**
 * Extract metadata from content based on signal type
 */
export function extractMetadataFromContent(content: string, signalType: SignalType): SignalMetadata {
  const metadata: SignalMetadata = {};

  // Estimate depth based on content length and complexity
  const wordCount = content.split(/\s+/).length;
  if (wordCount < 20) {
    metadata.depth = "surface";
  } else if (wordCount < 100) {
    metadata.depth = "intermediate";
  } else {
    metadata.depth = "deep";
  }

  // Detect emotional tone from keywords
  const contentLower = content.toLowerCase();
  if (contentLower.includes("confused") || contentLower.includes("stuck") || contentLower.includes("help")) {
    metadata.emotionalTone = "frustrated";
  } else if (contentLower.includes("why") || contentLower.includes("how") || contentLower.includes("?")) {
    metadata.emotionalTone = "curious";
  } else if (contentLower.includes("got it") || contentLower.includes("understand") || contentLower.includes("!")) {
    metadata.emotionalTone = "confident";
  } else if (contentLower.includes("breakthrough") || contentLower.includes("eureka") || contentLower.includes("wow")) {
    metadata.emotionalTone = "excited";
  }

  // Estimate confidence based on certainty indicators
  if (contentLower.includes("i think") || contentLower.includes("maybe") || contentLower.includes("possibly")) {
    metadata.confidence = 0.5;
  } else if (contentLower.includes("i'm sure") || contentLower.includes("definitely") || contentLower.includes("certainly")) {
    metadata.confidence = 0.9;
  } else {
    metadata.confidence = 0.7;
  }

  return metadata;
}

// ─── Signal Retrieval ────────────────────────────────────────────────────────

/**
 * Get all signals for a user with optional filtering
 */
export async function getUserSignals(
  userId: number,
  options?: {
    since?: Date;
    signalType?: SignalType;
    conceptId?: number;
    limit?: number;
  }
): Promise<CompressedSignal[]> {
  if (options?.since) {
    return getRecentSignalsDb(userId, Math.round((Date.now() - options.since.getTime()) / (1000 * 60 * 60)));
  }

  if (options?.conceptId) {
    return getSignalTimeline(userId, options.conceptId);
  }

  return getSignalTimeline(userId);
}

/**
 * Get signals for a specific concept
 */
export async function getConceptSignals(
  userId: number,
  conceptId: number,
  options?: {
    since?: Date;
    signalType?: SignalType;
    limit?: number;
  }
): Promise<CompressedSignal[]> {
  return getSignalTimeline(userId, conceptId);
}

/**
 * Get recent signals (last N hours)
 */
export async function getRecentSignals(
  userId: number,
  hoursBack: number = 24,
  limit?: number
): Promise<CompressedSignal[]> {
  return getRecentSignalsDb(userId, hoursBack);
}

// ─── Signal Analysis ────────────────────────────────────────────────────────

/**
 * Analyze signals to understand learner behavior patterns
 */
export async function analyzeSignals(
  userId: number,
  timeWindowHours: number = 168 // 1 week
): Promise<SignalAnalysis> {
  const since = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);
  const signals = await getRecentSignals(userId, timeWindowHours, 1000);

  const analysis: SignalAnalysis = {
    totalSignals: signals.length,
    signalsByType: {
      question: 0,
      connection: 0,
      application: 0,
      teaching: 0,
      stuck: 0,
      breakthrough: 0,
      feedback: 0,
    },
    averageConfidence: 0,
    averageDepth: "intermediate",
    emotionalTrend: {},
    recentBreakthroughs: 0,
    recentStuckPoints: 0,
    connectionsMade: 0,
    applicationsAttempted: 0,
    teachingMoments: 0,
  };

  let totalConfidence = 0;
  let depthScores = { surface: 0, intermediate: 0, deep: 0 };

  for (const signal of signals) {
    // Count by type
    analysis.signalsByType[signal.signalType as SignalType]++;

    // Track specific signal types
    if (signal.signalType === "breakthrough") {
      analysis.recentBreakthroughs++;
    } else if (signal.signalType === "stuck") {
      analysis.recentStuckPoints++;
    } else if (signal.signalType === "connection") {
      analysis.connectionsMade++;
    } else if (signal.signalType === "application") {
      analysis.applicationsAttempted++;
    } else if (signal.signalType === "teaching") {
      analysis.teachingMoments++;
    }

    // Aggregate metadata
    if (signal.metadata && typeof signal.metadata === 'object') {
      const meta = signal.metadata as any;
      if (meta.confidence) {
        totalConfidence += meta.confidence;
      }

      if (meta.depth) {
        depthScores[meta.depth as keyof typeof depthScores]++;
      }

      if (meta.emotionalTone) {
        analysis.emotionalTrend[meta.emotionalTone] =
          (analysis.emotionalTrend[meta.emotionalTone] || 0) + 1;
      }
    }
  }

  // Calculate averages
  if (signals.length > 0) {
    analysis.averageConfidence = totalConfidence / signals.length;

    // Determine average depth
    const maxDepth = Math.max(depthScores.surface, depthScores.intermediate, depthScores.deep);
    if (maxDepth === depthScores.deep) {
      analysis.averageDepth = "deep";
    } else if (maxDepth === depthScores.intermediate) {
      analysis.averageDepth = "intermediate";
    } else {
      analysis.averageDepth = "surface";
    }
  }

  return analysis;
}

/**
 * Get signal patterns for a concept
 */
export async function getConceptSignalPattern(
  userId: number,
  conceptId: number,
  timeWindowHours: number = 168
): Promise<{
  totalSignals: number;
  signalSequence: SignalType[];
  timeSpentSeconds: number;
  questionsAsked: number;
  stuckCount: number;
  breakthroughCount: number;
  applicationCount: number;
}> {
  const signals = await getConceptSignals(userId, conceptId, { limit: 1000 });

  const pattern = {
    totalSignals: signals.length,
    signalSequence: signals.map((s) => s.signalType),
    timeSpentSeconds: 0,
    questionsAsked: signals.filter((s) => s.signalType === "question").length,
    stuckCount: signals.filter((s) => s.signalType === "stuck").length,
    breakthroughCount: signals.filter((s) => s.signalType === "breakthrough").length,
    applicationCount: signals.filter((s) => s.signalType === "application").length,
  };

  // Estimate time spent from signal timestamps
  if (signals.length > 1) {
    const firstSignal = signals[0].timestamp;
    const lastSignal = signals[signals.length - 1].timestamp;
    pattern.timeSpentSeconds = Math.round((lastSignal.getTime() - firstSignal.getTime()) / 1000);
  }

  return pattern;
}

// ─── Signal Deduplication ────────────────────────────────────────────────────

/**
 * Check if similar signal already exists (by content hash)
 */
export function isDuplicateSignal(contentHash: string, recentSignals: CompressedSignal[]): boolean {
  return recentSignals.some((s) => s.contentHash === contentHash);
}

/**
 * Get unique signals (deduplicated by content hash)
 */
export async function getUniqueSignals(
  userId: number,
  timeWindowHours: number = 24
): Promise<CompressedSignal[]> {
  const signals = await getRecentSignals(userId, timeWindowHours, 1000);
  const seen = new Set<string>();
  const unique: CompressedSignal[] = [];

  for (const signal of signals) {
    if (signal.contentHash && !seen.has(signal.contentHash)) {
      seen.add(signal.contentHash);
      unique.push(signal);
    }
  }

  return unique;
}

// ─── Signal Storage Optimization ──────────────────────────────────────────────

/**
 * Calculate storage efficiency metrics
 */
export async function getStorageMetrics(userId: number): Promise<{
  totalSignals: number;
  totalContentBytes: number;
  averageContentSize: number;
  duplicateCount: number;
  storageEfficiency: number; // 0-1, higher is better
}> {
  const signals = await getUserSignals(userId, { limit: 10000 });

  const totalContentBytes = signals.reduce((sum: number, s: CompressedSignal) => sum + (s.contentLength || 0), 0);
  const duplicateCount = signals.length - (await getUniqueSignals(userId, 24 * 365)).length;

  return {
    totalSignals: signals.length,
    totalContentBytes,
    averageContentSize: signals.length > 0 ? totalContentBytes / signals.length : 0,
    duplicateCount,
    storageEfficiency: signals.length > 0 ? (signals.length - duplicateCount) / signals.length : 1,
  };
}

// ─── Signal Archival ──────────────────────────────────────────────────────────

/**
 * Archive old signals (compress further or move to cold storage)
 * Called periodically to optimize storage
 */
export async function archiveOldSignals(
  userId: number,
  daysOld: number = 90
): Promise<{
  archivedCount: number;
  spaceSavedBytes: number;
}> {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  const oldSignals = await getSignalTimeline(userId);

  const toArchive = oldSignals.filter((s: CompressedSignal) => s.timestamp < cutoffDate);

  // In a real system, we'd move these to cold storage or apply additional compression
  // For now, we just track what would be archived
  const spaceSavedBytes = toArchive.reduce((sum: number, s: CompressedSignal) => sum + (s.contentLength || 0), 0);

  return {
    archivedCount: toArchive.length,
    spaceSavedBytes,
  };
}
