import { getDb } from "./db";
import { users, userConceptMetrics } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getUserSignals, analyzeSignals } from "./signal-observer";

/**
 * Learner Profile Service
 * Aggregates signals and builds a comprehensive learner model
 */

export interface LearnerProfile {
  userId: number;
  learningStyle: "analytical" | "relational" | "practical" | "progressive" | "balanced";
  learningVelocity: number; // signals per hour
  confidenceTrajectory: "improving" | "stable" | "struggling";
  averageConfidence: number; // 0-1
  averageDepth: "surface" | "intermediate" | "deep";
  breakthroughsThisWeek: number;
  stuckPointsThisWeek: number;
  totalSignalsThisWeek: number;
  signalDistribution: Record<string, number>;
  topConceptsByConfidence: Array<{
    conceptId: number;
    conceptName: string;
    confidence: number;
  }>;
  knowledgeGaps: Array<{
    conceptId: number;
    conceptName: string;
    reason: string; // "stuck_signal" | "low_confidence" | "no_signals"
  }>;
  recommendedNextSteps: string[];
  lastUpdated: Date;
}

/**
 * Get comprehensive learner profile for a user
 */
export async function getUserLearnerProfile(userId: number): Promise<LearnerProfile | null> {
  try {
    // Get all signals for the user
    const signals = await getUserSignals(userId, {});
    
    // Analyze signals
    const analysis = await analyzeSignals(userId);
    
    // Calculate weekly stats from signals
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklySignals = signals.filter((s) => new Date(s.timestamp) > oneWeekAgo);
    const breakthroughsThisWeek = weeklySignals.filter((s) => s.signalType === "breakthrough").length;
    const stuckPointsThisWeek = weeklySignals.filter((s) => s.signalType === "stuck").length;
    const totalSignalsThisWeek = weeklySignals.length;
    
    // Get user concept metrics
    const db = await getDb();
    if (!db) return null; // Return null if DB not available
    
    const conceptMetrics = await db
      .select()
      .from(userConceptMetrics)
      .where(eq(userConceptMetrics.userId, userId));

    // Calculate learning style from signal patterns
    const learningStyle = detectLearningStyle(analysis);
    
    // Calculate confidence trajectory
    const confidenceTrajectory = calculateConfidenceTrajectory(signals);
    
    // Get top concepts by confidence
    const topConceptsByConfidence = conceptMetrics
      .sort((a: any, b: any) => (b.confidenceInferred || 0) - (a.confidenceInferred || 0))
      .slice(0, 5)
      .map((metric: any) => ({
        conceptId: metric.conceptId,
        conceptName: `Concept ${metric.conceptId}`, // Would fetch from DB in production
        confidence: metric.confidenceInferred || 0,
      }));

    // Detect knowledge gaps
    const knowledgeGaps = detectKnowledgeGaps(signals, analysis);
    
    // Generate recommended next steps
    const recommendedNextSteps = generateRecommendedNextSteps(
      analysis,
      confidenceTrajectory,
      knowledgeGaps
    );

    return {
      userId,
      learningStyle,
      learningVelocity: totalSignalsThisWeek / (7 * 24), // signals per hour over a week
      confidenceTrajectory,
      averageConfidence: analysis.averageConfidence,
      averageDepth: analysis.averageDepth,
      breakthroughsThisWeek,
      stuckPointsThisWeek,
      totalSignalsThisWeek,
      signalDistribution: analysis.signalsByType,
      topConceptsByConfidence,
      knowledgeGaps,
      recommendedNextSteps,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error("[Learner Profile] Failed to get learner profile:", error);
    return null;
  }
}

/**
 * Detect learning style from signal patterns
 */
function detectLearningStyle(
  analysis: any
): "analytical" | "relational" | "practical" | "progressive" | "balanced" {
  const { signalsByType } = analysis;

  // Count signal types
  const questions = signalsByType.question || 0;
  const connections = signalsByType.connection || 0;
  const applications = signalsByType.application || 0;
  const teaching = signalsByType.teaching || 0;
  const total = questions + connections + applications + teaching;

  if (total === 0) return "balanced";

  // Normalize percentages
  const questionPct = questions / total;
  const connectionPct = connections / total;
  const applicationPct = applications / total;
  const teachingPct = teaching / total;

  // Determine dominant learning style
  if (questionPct > 0.35) return "analytical"; // Lots of questions = analytical
  if (applicationPct > 0.35) return "practical"; // Lots of applications = practical
  if (teachingPct > 0.3) return "relational"; // Lots of teaching = relational
  if (connectionPct > 0.35) return "progressive"; // Lots of connections = progressive
  
  return "balanced";
}

/**
 * Calculate confidence trajectory from signal history
 */
function calculateConfidenceTrajectory(
  signals: any[]
): "improving" | "stable" | "struggling" {
  if (signals.length < 2) return "stable";

  // Sort signals by timestamp
  const sortedSignals = signals.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Split into two halves
  const midpoint = Math.floor(sortedSignals.length / 2);
  const firstHalf = sortedSignals.slice(0, midpoint);
  const secondHalf = sortedSignals.slice(midpoint);

  // Calculate average confidence for each half
  const firstHalfConfidence =
    firstHalf.reduce((sum, s) => sum + (s.metadata?.confidence || 0.5), 0) /
    firstHalf.length;
  const secondHalfConfidence =
    secondHalf.reduce((sum, s) => sum + (s.metadata?.confidence || 0.5), 0) /
    secondHalf.length;

  // Determine trajectory
  const diff = secondHalfConfidence - firstHalfConfidence;
  if (diff > 0.1) return "improving";
  if (diff < -0.1) return "struggling";
  return "stable";
}

/**
 * Detect knowledge gaps from signal analysis
 */
function detectKnowledgeGaps(
  signals: any[],
  analysis: any
): Array<{
  conceptId: number;
  conceptName: string;
  reason: string;
}> {
  const gaps: Array<{
    conceptId: number;
    conceptName: string;
    reason: string;
  }> = [];

  // Find concepts with stuck signals
  const stuckSignals = signals.filter((s) => s.signalType === "stuck");
  for (const signal of stuckSignals) {
    if (signal.conceptId) {
      gaps.push({
        conceptId: signal.conceptId,
        conceptName: `Concept ${signal.conceptId}`,
        reason: "stuck_signal",
      });
    }
  }

  // Find concepts with low confidence
  if (analysis.averageConfidence < 0.4) {
    gaps.push({
      conceptId: 0,
      conceptName: "General Concepts",
      reason: "low_confidence",
    });
  }

  return gaps.slice(0, 5); // Return top 5 gaps
}

/**
 * Generate recommended next steps for learner
 */
function generateRecommendedNextSteps(
  analysis: any,
  confidenceTrajectory: string,
  knowledgeGaps: any[]
): string[] {
  const recommendations: string[] = [];

  // If struggling, recommend review
  if (confidenceTrajectory === "struggling") {
    recommendations.push("Review previously learned concepts to strengthen foundation");
  }

  // If improving, recommend advancing
  if (confidenceTrajectory === "improving") {
    recommendations.push("Continue with new concepts - you're making great progress!");
  }

  // If knowledge gaps exist, recommend learning them
  if (knowledgeGaps.length > 0) {
    recommendations.push(`Address knowledge gaps: ${knowledgeGaps[0].conceptName}`);
  }

  // If high breakthrough count, encourage exploration
  if (analysis.recentBreakthroughs > 3) {
    recommendations.push("You're having great insights - try exploring related concepts");
  }

  // If stuck points exist, recommend help
  if (analysis.recentStuckPoints > 2) {
    recommendations.push("You've hit some challenges - try the 'Explain Simpler' feature");
  }

  return recommendations.slice(0, 3); // Return top 3 recommendations
}

/**
 * Update learner model based on new signals
 */
export async function updateLearnerModel(userId: number): Promise<LearnerProfile | null> {
  try {
    const profile = await getUserLearnerProfile(userId);
    if (!profile) return null;
    
    // Update user record with learner profile data
    const db = await getDb();
    if (!db) return profile;
    
    // Note: learningStyle would be stored in a separate learner_profiles table
    // For now, we just return the profile without persisting to users table

    return profile;
  } catch (error) {
    console.error("[Learner Profile] Failed to update learner model:", error);
    throw error;
  }
}

/**
 * Get learner profile summary for quick display
 */
export async function getLearnerProfileSummary(userId: number) {
  const profile = await getUserLearnerProfile(userId);
  if (!profile) return null;
  
  return {
    learningStyle: profile.learningStyle,
    confidenceTrajectory: profile.confidenceTrajectory,
    averageConfidence: profile.averageConfidence,
    breakthroughsThisWeek: profile.breakthroughsThisWeek,
    stuckPointsThisWeek: profile.stuckPointsThisWeek,
    totalSignalsThisWeek: profile.totalSignalsThisWeek,
    topRecommendation: profile.recommendedNextSteps[0] || "Keep learning!",
  };
}

/**
 * Compare learner profiles over time
 */
export async function compareLearnerProfiles(
  userId: number,
  profile1: LearnerProfile,
  profile2: LearnerProfile
) {
  return {
    confidenceChange: profile2.averageConfidence - profile1.averageConfidence,
    breakthroughsChange: profile2.breakthroughsThisWeek - profile1.breakthroughsThisWeek,
    stuckPointsChange: profile2.stuckPointsThisWeek - profile1.stuckPointsThisWeek,
    learningStyleChanged: profile1.learningStyle !== profile2.learningStyle,
    trajectoryChanged: profile1.confidenceTrajectory !== profile2.confidenceTrajectory,
  };
}
