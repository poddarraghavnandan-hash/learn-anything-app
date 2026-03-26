/**
 * Learning Ladder Integration Service
 * 
 * Integrates multi-layer content into Learning Ladder stages.
 * Allows users to drill deeper into Foundation/DeepDive/Expert at each stage.
 */

import * as db from "./db";
import * as contentGen from "./content-generator";
import * as assessment from "./adaptive-assessment";

interface LadderStageWithContent {
  stageId: number;
  stageName: string;
  stageDescription: string;
  conceptId: number;
  conceptName: string;
  foundation?: {
    content: string;
    keyPoints: string[];
    estimatedReadTime: number;
  };
  deepDive?: {
    content: string;
    keyPoints: string[];
    estimatedReadTime: number;
  };
  expert?: {
    content: string;
    keyPoints: string[];
    estimatedReadTime: number;
  };
  userConfidence: number;
  recommendedLayer: "foundation" | "deepDive" | "expert";
  prerequisites: Array<{
    conceptId: number;
    conceptName: string;
    userKnows: boolean;
    severity: "low" | "medium" | "high";
  }>;
}

/**
 * Get Learning Ladder with multi-layer content
 */
export async function getLearningLadderWithContent(
  userId: number,
  topicSlug: string
): Promise<LadderStageWithContent[]> {
  try {
    // Get topic and its concepts
    // TODO: Implement getTopicBySlug and getConceptsByTopic in db.ts
    const concepts: any[] = [];
    if (concepts.length === 0) return [];

    // Get user's confidence for each concept
    const stagesWithContent: LadderStageWithContent[] = [];

    for (let i = 0; i < concepts.length; i++) {
      const concept = concepts[i];
      const userConfidence = await assessment.getUserConceptConfidence(userId, concept.id);
      const recommendedLayer = userConfidence < 0.4 ? "foundation" : userConfidence < 0.7 ? "deepDive" : "expert";

      // Get multi-layer content
      const foundation = await db.getConceptContent(concept.id, "foundation");
      const deepDive = await db.getConceptContent(concept.id, "deepDive");
      const expert = await db.getConceptContent(concept.id, "expert");

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

      stagesWithContent.push({
        stageId: i + 1,
        stageName: `Stage ${i + 1}: ${concept.name}`,
        stageDescription: concept.description || "",
        conceptId: concept.id,
        conceptName: concept.name,
        foundation: foundation ? JSON.parse(foundation.content) : undefined,
        deepDive: deepDive ? JSON.parse(deepDive.content) : undefined,
        expert: expert ? JSON.parse(expert.content) : undefined,
        userConfidence,
        recommendedLayer,
        prerequisites: userPrerequisites,
      });
    }

    return stagesWithContent;
  } catch (error) {
    console.error("[LearningLadderIntegration] Failed to get ladder with content:", error);
    return [];
  }
}

/**
 * Get specific stage with multi-layer content
 */
export async function getStageWithContent(
  userId: number,
  topicSlug: string,
  stageNumber: number
): Promise<LadderStageWithContent | null> {
  try {
    const ladder = await getLearningLadderWithContent(userId, topicSlug);
    if (stageNumber < 1 || stageNumber > ladder.length) {
      return null;
    }
    return ladder[stageNumber - 1];
  } catch (error) {
    console.error("[LearningLadderIntegration] Failed to get stage:", error);
    return null;
  }
}

/**
 * Suggest next stage based on user progress
 */
export async function suggestNextStage(
  userId: number,
  topicSlug: string,
  currentStageNumber: number
): Promise<{
  nextStageNumber: number;
  reason: string;
  shouldReviewPrerequisites: boolean;
  prerequisitesToReview: string[];
} | null> {
  try {
    const ladder = await getLearningLadderWithContent(userId, topicSlug);

    if (currentStageNumber >= ladder.length) {
      return {
        nextStageNumber: currentStageNumber,
        reason: "You've completed all stages! Consider exploring related topics.",
        shouldReviewPrerequisites: false,
        prerequisitesToReview: [],
      };
    }

    const currentStage = ladder[currentStageNumber - 1];
    const nextStage = ladder[currentStageNumber];

    // Check if user should review prerequisites before next stage
    const highSeverityGaps = nextStage.prerequisites.filter((p) => !p.userKnows && p.severity === "high");

    if (highSeverityGaps.length > 0) {
      return {
        nextStageNumber: currentStageNumber + 1,
        reason: `You're ready for Stage ${currentStageNumber + 1}, but consider reviewing prerequisites first for better understanding.`,
        shouldReviewPrerequisites: true,
        prerequisitesToReview: highSeverityGaps.map((p) => p.conceptName),
      };
    }

    return {
      nextStageNumber: currentStageNumber + 1,
      reason: `Great progress! Ready to move to Stage ${currentStageNumber + 1}: ${nextStage.conceptName}`,
      shouldReviewPrerequisites: false,
      prerequisitesToReview: [],
    };
  } catch (error) {
    console.error("[LearningLadderIntegration] Failed to suggest next stage:", error);
    return null;
  }
}

/**
 * Record stage completion
 */
export async function recordStageCompletion(
  userId: number,
  topicSlug: string,
  stageNumber: number,
  layerCompleted: "foundation" | "deepDive" | "expert"
): Promise<void> {
  try {
    const stage = await getStageWithContent(userId, topicSlug, stageNumber);
    if (!stage) return;

    // Record engagement based on layer completed
    const timeSpentSeconds = stage[layerCompleted]?.estimatedReadTime ? stage[layerCompleted].estimatedReadTime * 60 : 300;

    await assessment.recordContentEngagement(userId, stage.conceptId, timeSpentSeconds, "save");

    console.log(`[LearningLadderIntegration] Recorded completion: Stage ${stageNumber}, Layer ${layerCompleted}`);
  } catch (error) {
    console.error("[LearningLadderIntegration] Failed to record completion:", error);
  }
}

/**
 * Get learning ladder progress
 */
export async function getLadderProgress(
  userId: number,
  topicSlug: string
): Promise<{
  totalStages: number;
  completedStages: number;
  currentStage: number;
  progressPercentage: number;
  nextMilestone: string;
} | null> {
  try {
    const ladder = await getLearningLadderWithContent(userId, topicSlug);
    if (ladder.length === 0) return null;

    // Calculate completed stages (confidence > 0.6)
    const completedStages = ladder.filter((stage: any) => stage.userConfidence > 0.6).length;
    const currentStage = Math.min(completedStages + 1, ladder.length);
    const progressPercentage = Math.round((completedStages / ladder.length) * 100);

    // Determine next milestone
    let nextMilestone = "Complete all stages";
    if (completedStages === ladder.length) {
      nextMilestone = "Mastery achieved! Explore advanced topics.";
    } else if (currentStage <= ladder.length) {
      nextMilestone = `Learn Stage ${currentStage}: ${(ladder[currentStage - 1] as any).conceptName}`;
    }

    return {
      totalStages: ladder.length,
      completedStages,
      currentStage,
      progressPercentage,
      nextMilestone,
    };
  } catch (error) {
    console.error("[LearningLadderIntegration] Failed to get progress:", error);
    return null;
  }
}
