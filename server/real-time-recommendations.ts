/**
 * Real-Time Recommendations Engine
 * 
 * Generates personalized, prioritized recommendations based on:
 * - Learner profile (learning style, velocity, confidence)
 * - Signal patterns (breakthroughs, stuck points, connections)
 * - Concept mastery (current level, progress trend)
 * - Learning analytics (velocity trends, focus areas)
 */

import { getUserLearnerProfile } from "./learner-profile";
import { calculateConceptMastery, calculateSignalVelocity, detectLearningTrends } from "./learning-analytics";
import { recommendDifficultyLevel, recommendDifficultyLevel as getDifficultyLevel } from "./adaptive-difficulty";
import { getConceptSignals } from "./signal-observer";

export type RecommendationType = 
  | "knowledge_gap"
  | "spaced_repetition"
  | "next_concept"
  | "challenge"
  | "reinforcement"
  | "learning_style_match";

export interface PersonalizedRecommendation {
  id: string; // Unique recommendation ID
  conceptId: number;
  conceptName: string;
  type: RecommendationType;
  priority: "critical" | "high" | "medium" | "low";
  reason: string;
  estimatedTime: number; // minutes
  successProbability: number; // 0-1
  engagementScore: number; // 0-1 (how well it matches learning style)
  difficulty: "foundation" | "intermediate" | "advanced" | "expert";
  contentTypes: string[]; // ["video", "article", "interactive", "quiz"]
  timestamp: Date;
  expiresAt: Date; // When recommendation becomes stale
}

export interface RecommendationBatch {
  userId: number;
  recommendations: PersonalizedRecommendation[];
  generatedAt: Date;
  validUntil: Date;
}

/**
 * Generate personalized recommendations for a learner
 */
export async function generatePersonalizedRecommendations(
  userId: number,
  limit: number = 10
): Promise<PersonalizedRecommendation[]> {
  try {
    const profile = await getUserLearnerProfile(userId);
    if (!profile) return [];

    const recommendations: PersonalizedRecommendation[] = [];
    const now = new Date();

    // 1. Knowledge Gap Recommendations (Critical Priority)
    for (const gap of profile.knowledgeGaps.slice(0, 2)) {
      const signals = await getConceptSignals(userId, gap.conceptId);
      const stuckCount = signals?.filter((s: any) => s.signalType === "stuck").length ?? 0;
      
      recommendations.push({
        id: `gap-${gap.conceptId}-${Date.now()}`,
        conceptId: gap.conceptId,
        conceptName: gap.conceptName,
        type: "knowledge_gap",
        priority: stuckCount > 2 ? "critical" : "high",
        reason: `Knowledge gap detected: ${gap.reason}. ${stuckCount} stuck signals recorded.`,
        estimatedTime: 15,
        successProbability: 0.65,
        engagementScore: 0.8,
        difficulty: "foundation",
        contentTypes: ["video", "article", "interactive"],
        timestamp: now,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours
      });
    }

    // 2. Spaced Repetition Recommendations
    for (const concept of profile.topConceptsByConfidence.slice(0, 3)) {
      if (concept.confidence > 0.5 && concept.confidence < 0.85) {
        // Concepts that need reinforcement
        const signals = await getConceptSignals(userId, concept.conceptId);
        const lastSignal = signals?.[signals.length - 1];
        const daysSinceReview = lastSignal 
          ? Math.floor((now.getTime() - new Date(lastSignal.timestamp).getTime()) / (24 * 60 * 60 * 1000))
          : 7;

        if (daysSinceReview >= 3) {
          recommendations.push({
            id: `spaced-${concept.conceptId}-${Date.now()}`,
            conceptId: concept.conceptId,
            conceptName: concept.conceptName,
            type: "spaced_repetition",
            priority: daysSinceReview >= 7 ? "high" : "medium",
            reason: `Time for spaced repetition review (${daysSinceReview} days since last interaction)`,
            estimatedTime: 10,
            successProbability: 0.85,
            engagementScore: 0.75,
            difficulty: "intermediate",
            contentTypes: ["quiz", "interactive"],
            timestamp: now,
            expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000), // 48 hours
          });
        }
      }
    }

    // 3. Next Concept Recommendations (Based on Breakthroughs)
    if (profile.breakthroughsThisWeek >= 2) {
      const topConcept = profile.topConceptsByConfidence[0];
      if (topConcept && topConcept.confidence > 0.75) {
        recommendations.push({
          id: `next-${topConcept.conceptId}-${Date.now()}`,
          conceptId: topConcept.conceptId + 1, // Simplified - would fetch prerequisites
          conceptName: `Advanced ${topConcept.conceptName}`,
          type: "next_concept",
          priority: "high",
          reason: `Breakthrough momentum detected! Ready for next concept.`,
          estimatedTime: 30,
          successProbability: 0.72,
          engagementScore: 0.85,
          difficulty: "advanced",
          contentTypes: ["video", "article", "project"],
          timestamp: now,
          expiresAt: new Date(now.getTime() + 72 * 60 * 60 * 1000), // 72 hours
        });
      }
    }

    // 4. Challenge Recommendations (For High Performers)
    if (profile.averageConfidence > 0.75 && profile.breakthroughsThisWeek >= 3) {
      recommendations.push({
        id: `challenge-${Date.now()}`,
        conceptId: profile.topConceptsByConfidence[0]?.conceptId ?? 1,
        conceptName: `Challenge: ${profile.topConceptsByConfidence[0]?.conceptName ?? "Advanced Topic"}`,
        type: "challenge",
        priority: "medium",
        reason: "You're excelling! Try a challenging project to deepen mastery.",
        estimatedTime: 60,
        successProbability: 0.65,
        engagementScore: 0.9,
        difficulty: "expert",
        contentTypes: ["project", "interactive"],
        timestamp: now,
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week
      });
    }

    // 5. Reinforcement Recommendations (For Low Confidence)
    for (const concept of profile.topConceptsByConfidence.slice(0, 2)) {
      if (concept.confidence < 0.4) {
        recommendations.push({
          id: `reinforce-${concept.conceptId}-${Date.now()}`,
          conceptId: concept.conceptId,
          conceptName: concept.conceptName,
          type: "reinforcement",
          priority: "high",
          reason: `Low confidence (${(concept.confidence * 100).toFixed(0)}%). Need more practice.`,
          estimatedTime: 20,
          successProbability: 0.75,
          engagementScore: 0.7,
          difficulty: "foundation",
          contentTypes: ["video", "article", "quiz"],
          timestamp: now,
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours
        });
      }
    }

    // 6. Learning Style Matched Recommendations
    const learningStyleMatch = getContentTypeForLearningStyle(profile.learningStyle);
    if (recommendations.length < limit) {
      recommendations.push({
        id: `style-${Date.now()}`,
        conceptId: profile.topConceptsByConfidence[0]?.conceptId ?? 1,
        conceptName: `${learningStyleMatch.toUpperCase()} Learning: ${profile.topConceptsByConfidence[0]?.conceptName ?? "Core Concept"}`,
        type: "learning_style_match",
        priority: "low",
        reason: `Tailored to your ${profile.learningStyle} learning style`,
        estimatedTime: 25,
        successProbability: 0.8,
        engagementScore: 0.95,
        difficulty: "intermediate",
        contentTypes: [learningStyleMatch],
        timestamp: now,
        expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000), // 48 hours
      });
    }

    // Sort by priority and engagement score
    recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.engagementScore - a.engagementScore;
    });

    return recommendations.slice(0, limit);
  } catch (error) {
    console.error("[Recommendations] Failed to generate personalized recommendations:", error);
    return [];
  }
}

/**
 * Recommend next concept based on mastery and prerequisites
 */
export async function recommendNextConcept(
  userId: number,
  currentConceptId: number
): Promise<PersonalizedRecommendation | null> {
  try {
    const profile = await getUserLearnerProfile(userId);
    if (!profile) return null;

    const currentConcept = profile.topConceptsByConfidence.find(
      (c) => c.conceptId === currentConceptId
    );

    if (!currentConcept) return null;

    // Only recommend next if mastery is high
    if (currentConcept.confidence < 0.7) {
      return null;
    }

    const now = new Date();
    return {
      id: `next-concept-${currentConceptId}-${Date.now()}`,
      conceptId: currentConceptId + 1,
      conceptName: `Next: Advanced ${currentConcept.conceptName}`,
      type: "next_concept",
      priority: "high",
      reason: `You've mastered ${currentConcept.conceptName}. Ready for the next level?`,
      estimatedTime: 40,
      successProbability: 0.7,
      engagementScore: 0.85,
      difficulty: "advanced",
      contentTypes: ["video", "article", "project"],
      timestamp: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    };
  } catch (error) {
    console.error("[Recommendations] Failed to recommend next concept:", error);
    return null;
  }
}

/**
 * Recommend review topics based on spaced repetition
 */
export async function recommendReviewTopics(
  userId: number,
  limit: number = 5
): Promise<PersonalizedRecommendation[]> {
  try {
    const profile = await getUserLearnerProfile(userId);
    if (!profile) return [];

    const recommendations: PersonalizedRecommendation[] = [];
    const now = new Date();

    // Find concepts that need review based on time since last interaction
    for (const concept of profile.topConceptsByConfidence) {
      const signals = await getConceptSignals(userId, concept.conceptId);
      const lastSignal = signals?.[signals.length - 1];
      
      if (!lastSignal) continue;

      const daysSinceReview = Math.floor(
        (now.getTime() - new Date(lastSignal.timestamp).getTime()) / (24 * 60 * 60 * 1000)
      );

      // Spaced repetition schedule: 1, 3, 7, 14, 30 days
      const reviewDays = [1, 3, 7, 14, 30];
      const shouldReview = reviewDays.some((days) => daysSinceReview >= days && daysSinceReview < days + 1);

      if (shouldReview) {
        let priority: "critical" | "high" | "medium" | "low" = "medium";
        if (daysSinceReview >= 30) priority = "critical";
        else if (daysSinceReview >= 14) priority = "high";

        recommendations.push({
          id: `review-${concept.conceptId}-${Date.now()}`,
          conceptId: concept.conceptId,
          conceptName: concept.conceptName,
          type: "spaced_repetition",
          priority,
          reason: `Spaced repetition review (${daysSinceReview} days since last review)`,
          estimatedTime: 10,
          successProbability: 0.85,
          engagementScore: 0.75,
          difficulty: "intermediate",
          contentTypes: ["quiz", "interactive"],
          timestamp: now,
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        });
      }
    }

    // Sort by priority
    recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return recommendations.slice(0, limit);
  } catch (error) {
    console.error("[Recommendations] Failed to recommend review topics:", error);
    return [];
  }
}

/**
 * Recommend content type based on learning style
 */
export async function recommendContentType(
  userId: number,
  conceptId: number
): Promise<string[]> {
  try {
    const profile = await getUserLearnerProfile(userId);
    if (!profile) return ["video", "article"];

    const contentTypes = getContentTypeForLearningStyle(profile.learningStyle);
    
    // Always include quiz for reinforcement
    return [contentTypes, "quiz"].filter((v, i, a) => a.indexOf(v) === i);
  } catch (error) {
    console.error("[Recommendations] Failed to recommend content type:", error);
    return ["video", "article"];
  }
}

/**
 * Prioritize recommendations based on urgency and engagement
 */
export function prioritizeRecommendations(
  recommendations: PersonalizedRecommendation[]
): PersonalizedRecommendation[] {
  return recommendations.sort((a, b) => {
    // 1. Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // 2. Sort by engagement score (higher first)
    const engagementDiff = b.engagementScore - a.engagementScore;
    if (engagementDiff !== 0) return engagementDiff;

    // 3. Sort by success probability (higher first)
    return b.successProbability - a.successProbability;
  });
}

/**
 * Get content type based on learning style
 */
function getContentTypeForLearningStyle(
  learningStyle: "analytical" | "relational" | "practical" | "progressive" | "balanced"
): string {
  const styleMap: Record<string, string> = {
    analytical: "article",
    relational: "video",
    practical: "interactive",
    progressive: "project",
    balanced: "video",
  };
  return styleMap[learningStyle] || "video";
}

/**
 * Generate recommendation batch for multiple concepts
 */
export async function generateRecommendationBatch(
  userId: number,
  conceptIds: number[]
): Promise<RecommendationBatch> {
  try {
    const recommendations: PersonalizedRecommendation[] = [];
    const now = new Date();

    for (const conceptId of conceptIds) {
      const nextRec = await recommendNextConcept(userId, conceptId);
      if (nextRec) {
        recommendations.push(nextRec);
      }
    }

    // Add general recommendations
    const generalRecs = await generatePersonalizedRecommendations(userId, 5);
    recommendations.push(...generalRecs);

    // Prioritize and deduplicate
    const uniqueRecs = Array.from(
      new Map(recommendations.map((r) => [r.conceptId, r])).values()
    );

    return {
      userId,
      recommendations: prioritizeRecommendations(uniqueRecs).slice(0, 10),
      generatedAt: now,
      validUntil: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 hours
    };
  } catch (error) {
    console.error("[Recommendations] Failed to generate recommendation batch:", error);
    return {
      userId,
      recommendations: [],
      generatedAt: new Date(),
      validUntil: new Date(),
    };
  }
}
