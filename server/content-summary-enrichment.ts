/**
 * Content Summary Enrichment Service
 * 
 * Enriches in-app content summaries with prerequisite suggestions
 * and layer recommendations based on user profile.
 */

import * as db from "./db";
import * as assessment from "./adaptive-assessment";
import * as contentGen from "./content-generator";

interface EnrichedContentSummary {
  contentId: number;
  title: string;
  description: string;
  summary: string;
  keyTakeaways: string[];
  prerequisites: Array<{
    conceptId: number;
    conceptName: string;
    userKnows: boolean;
    severity: "low" | "medium" | "high";
  }>;
  recommendedLayer: "foundation" | "deepDive" | "expert";
  suggestedNextTopics: string[];
  estimatedReadTime: number;
  userConfidence: number;
  shouldOfferPrimer: boolean;
  primerConcepts: string[];
}

/**
 * Enrich content summary with adaptive recommendations
 */
export async function enrichContentSummary(
  userId: number,
  contentId: number
): Promise<EnrichedContentSummary | null> {
  try {
    // Get content item
    const content = await db.getContentById(contentId);
    if (!content) return null;

    // Extract concept from content (heuristic: use title or description)
    const conceptName = content.title;
    const concept = await db.getConceptBySlug(conceptName.toLowerCase().replace(/\s+/g, "-"));

    if (!concept) {
      // Return basic summary without concept-based enrichment
      return {
        contentId,
        title: content.title,
        description: content.description || "",
        summary: content.description || "No summary available",
        keyTakeaways: [],
        prerequisites: [],
        recommendedLayer: "foundation",
        suggestedNextTopics: [],
        estimatedReadTime: 5,
        userConfidence: 0,
        shouldOfferPrimer: false,
        primerConcepts: [],
      };
    }

    // Get user's confidence for this concept
    const userConfidence = await assessment.getUserConceptConfidence(userId, concept.id);
    const recommendedLayer = userConfidence < 0.4 ? "foundation" : userConfidence < 0.7 ? "deepDive" : "expert";

    // Get prerequisites
    // TODO: Implement getConceptPrerequisites in db.ts
    const prerequisites: any[] = [];
    const userPrerequisites = await Promise.all(
      prerequisites.map(async (prereq: any) => ({
        conceptId: (prereq as any).id,
        conceptName: (prereq as any).name,
        userKnows: (await assessment.getUserConceptConfidence(userId, (prereq as any).id)) > 0.5,
        severity: (prereq as any).severity as "low" | "medium" | "high",
      }))
    );

    // Check if primer should be offered
    const highSeverityGaps = userPrerequisites.filter((p: any) => !p.userKnows && p.severity === "high");
    const shouldOfferPrimer = highSeverityGaps.length > 0;
    const primerConcepts = highSeverityGaps.map((p) => p.conceptName);

    // Get suggested next topics (related concepts)
    const suggestedNextTopics: string[] = [];
    // TODO: Implement getRelatedConcepts in db.ts

    // Estimate read time based on content length
    const wordCount = (content.description || "").split(/\s+/).length;
    const estimatedReadTime = Math.max(2, Math.ceil(wordCount / 200));

    // Get key takeaways from content summary
    const keyTakeaways = extractKeyTakeaways(content.description || "");

    return {
      contentId,
      title: content.title,
      description: content.description || "",
      summary: content.description || "No summary available",
      keyTakeaways,
      prerequisites: userPrerequisites,
      recommendedLayer,
      suggestedNextTopics,
      estimatedReadTime,
      userConfidence,
      shouldOfferPrimer,
      primerConcepts,
    };
  } catch (error) {
    console.error("[ContentSummaryEnrichment] Failed to enrich summary:", error);
    return null;
  }
}

/**
 * Batch enrich multiple content summaries
 */
export async function enrichBatchSummaries(
  userId: number,
  contentIds: number[]
): Promise<EnrichedContentSummary[]> {
  const enriched: EnrichedContentSummary[] = [];

  for (const contentId of contentIds) {
    try {
      const summary = await enrichContentSummary(userId, contentId);
      if (summary) {
        enriched.push(summary);
      }
    } catch (error) {
      console.error(`[ContentSummaryEnrichment] Failed to enrich content ${contentId}:`, error);
    }
  }

  return enriched;
}

/**
 * Get content recommendations based on user's learning gaps
 */
export async function getContentRecommendations(
  userId: number,
  limit: number = 5
): Promise<EnrichedContentSummary[]> {
  try {
    // Get user's knowledge gaps
    const gaps = await assessment.detectKnowledgeGaps(userId);

    if (gaps.length === 0) {
      // Return popular content if no gaps detected
      // TODO: Implement getAllContent in db.ts
      const allContent: any[] = [];
      const contentIds = allContent.slice(0, limit).map((c: any) => c.id);
      return enrichBatchSummaries(userId, contentIds);
    }

    // Get content related to top gaps
    const recommendations: EnrichedContentSummary[] = [];
    for (const gap of gaps.slice(0, limit)) {
      // Find content related to this gap concept
      const relatedContent = await db.searchContent(gap.conceptName, 1);
      if (relatedContent.length > 0) {
        const enriched = await enrichContentSummary(userId, relatedContent[0].id);
        if (enriched) {
          recommendations.push(enriched);
        }
      }
    }

    return recommendations;
  } catch (error) {
    console.error("[ContentSummaryEnrichment] Failed to get recommendations:", error);
    return [];
  }
}

/**
 * Get content by layer for a concept
 */
export async function getContentByLayer(
  userId: number,
  conceptId: number,
  layer: "foundation" | "deepDive" | "expert"
): Promise<EnrichedContentSummary | null> {
  try {
    // Get concept content
    const conceptContent = await db.getConceptContent(conceptId, layer);
    if (!conceptContent) return null;

    const concept = await db.getConceptById(conceptId);
    if (!concept) return null;

    // Get user's confidence
    const userConfidence = await assessment.getUserConceptConfidence(userId, conceptId);

    // Get prerequisites
    // TODO: Implement getConceptPrerequisites in db.ts
    const prerequisites: any[] = [];
    const userPrerequisites = await Promise.all(
      prerequisites.map(async (prereq: any) => ({
        conceptId: (prereq as any).id,
        conceptName: (prereq as any).name,
        userKnows: (await assessment.getUserConceptConfidence(userId, (prereq as any).id)) > 0.5,
        severity: (prereq as any).severity as "low" | "medium" | "high",
      }))
    );

    const highSeverityGaps = userPrerequisites.filter((p: any) => !p.userKnows && p.severity === "high");

    const content = JSON.parse(conceptContent.content);

    return {
      contentId: conceptId,
      title: `${concept.name} - ${layer.charAt(0).toUpperCase() + layer.slice(1)}`,
      description: concept.description || "",
      summary: content.content || "",
      keyTakeaways: content.keyPoints || [],
      prerequisites: userPrerequisites,
      recommendedLayer: layer,
      suggestedNextTopics: [],
      estimatedReadTime: content.estimatedReadTime || 5,
      userConfidence,
      shouldOfferPrimer: highSeverityGaps.length > 0,
      primerConcepts: highSeverityGaps.map((p) => p.conceptName),
    };
  } catch (error) {
    console.error("[ContentSummaryEnrichment] Failed to get content by layer:", error);
    return null;
  }
}

/**
 * Extract key takeaways from content (simple heuristic)
 */
function extractKeyTakeaways(text: string): string[] {
  const takeaways: string[] = [];

  // Look for bullet points or numbered lists
  const bulletPattern = /^[\s]*[-•*]\s+(.+?)$/gm;
  const numberedPattern = /^[\s]*\d+\.\s+(.+?)$/gm;

  let match;
  while ((match = bulletPattern.exec(text)) !== null) {
    takeaways.push(match[1].trim());
  }

  while ((match = numberedPattern.exec(text)) !== null) {
    takeaways.push(match[1].trim());
  }

  // If no lists found, extract first 3 sentences as takeaways
  if (takeaways.length === 0) {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    takeaways.push(...sentences.slice(0, 3).map((s) => s.trim()));
  }

  return takeaways.slice(0, 5); // Return max 5 takeaways
}

/**
 * Get personalized content feed
 */
export async function getPersonalizedContentFeed(
  userId: number,
  limit: number = 10
): Promise<EnrichedContentSummary[]> {
  try {
    // Get user's profile
    const profile = await assessment.getUserKnowledgeProfile(userId);

    // Get content recommendations based on gaps and interests
    const recommendations = await getContentRecommendations(userId, limit);

    // Sort by relevance (high-severity gaps first)
    recommendations.sort((a, b) => {
      const aGapCount = a.prerequisites.filter((p: any) => !p.userKnows && p.severity === "high").length;
      const bGapCount = b.prerequisites.filter((p: any) => !p.userKnows && p.severity === "high").length;
      return bGapCount - aGapCount;
    });

    return recommendations;
  } catch (error) {
    console.error("[ContentSummaryEnrichment] Failed to get personalized feed:", error);
    return [];
  }
}
