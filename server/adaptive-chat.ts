/**
 * Adaptive Chat Service
 * 
 * Generates knowledge-level-aware LLM responses based on user's adaptive profile.
 * Automatically suggests relevant content layers and prerequisites.
 */

import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import * as assessment from "./adaptive-assessment";

interface AdaptiveContext {
  userId: number;
  conceptName: string;
  userConfidence: number; // 0-1
  prerequisites: Array<{
    conceptId: number;
    conceptName: string;
    userKnows: boolean;
    severity: "low" | "medium" | "high";
  }>;
  recommendedLayer: "foundation" | "deepDive" | "expert";
}

interface ChatResponse {
  message: string;
  layer: "foundation" | "deepDive" | "expert";
  keyPoints: string[];
  suggestedPrerequisites: string[];
  suggestedNextTopics: string[];
  estimatedReadTime: number;
}

/**
 * Build adaptive system prompt based on user's knowledge level
 */
function buildAdaptiveSystemPrompt(context: AdaptiveContext): string {
  const basePrompt = `You are an expert learning tutor following these 5 evidence-based pedagogical principles:
1. INSPIRE ACTIVE LEARNING — Encourage practice and healthy struggle with timely feedback.
2. MANAGE COGNITIVE LOAD — Present relevant, well-structured info. One concept at a time.
3. ADAPT TO THE LEARNER — Dynamically adjust to the learner's level, goals, and needs.
4. STIMULATE CURIOSITY — Inspire engagement and intrinsic motivation.
5. DEEPEN METACOGNITION — Help the learner reflect on what they know and don't know.

Core belief: ANYONE can learn ANYTHING. Teaching must be fine-tuned to the individual.
Never gatekeep knowledge. Always scaffold. Meet the learner where they are.`;

  // Add layer-specific guidance
  let layerGuidance = "";
  switch (context.recommendedLayer) {
    case "foundation":
      layerGuidance = `
The learner is a BEGINNER with low confidence (${Math.round(context.userConfidence * 100)}%).
- Use simple, everyday language (Explain Like I'm 5)
- No jargon or technical terms
- Use 2-3 concrete analogies from daily life
- Keep explanations to 150-200 words
- End with 3 key takeaways`;
      break;

    case "deepDive":
      layerGuidance = `
The learner has INTERMEDIATE knowledge with moderate confidence (${Math.round(context.userConfidence * 100)}%).
- Use some technical terms but always define them
- Build on foundational concepts they likely know
- Explain mechanisms and how things work
- Include 2-3 real-world applications
- Keep explanations to 300-400 words
- End with 5 key insights`;
      break;

    case "expert":
      layerGuidance = `
The learner is ADVANCED with high confidence (${Math.round(context.userConfidence * 100)}%).
- Use precise technical language
- Discuss nuance, edge cases, and limitations
- Include cutting-edge research or recent developments
- Connect to broader theoretical frameworks
- Challenge assumptions and explore counterarguments
- Keep explanations to 400-500 words
- End with 5-7 advanced insights`;
      break;
  }

  // Add prerequisite guidance if there are gaps
  let prerequisiteGuidance = "";
  if (context.prerequisites.length > 0) {
    const unknownPrereqs = context.prerequisites.filter((p) => !p.userKnows);
    if (unknownPrereqs.length > 0) {
      const highSeverity = unknownPrereqs.filter((p) => p.severity === "high");
      if (highSeverity.length > 0) {
        prerequisiteGuidance = `

IMPORTANT: The learner may not know: ${highSeverity.map((p) => p.conceptName).join(", ")}.
If your explanation requires these concepts, briefly define them or suggest learning them first.`;
      }
    }
  }

  return basePrompt + layerGuidance + prerequisiteGuidance;
}

/**
 * Generate adaptive chat response
 */
export async function generateAdaptiveResponse(
  userId: number,
  userMessage: string,
  conceptName: string
): Promise<ChatResponse | null> {
  try {
    // Get user's adaptive profile
    const userProfile = await assessment.getUserKnowledgeProfile(userId);
    const userConfidence = await assessment.getUserConceptConfidence(userId, 0); // Generic confidence

    // Get concept prerequisites
    // TODO: Implement getConceptByName in db.ts
    // For now, use a placeholder
    const concept = { id: 0, name: conceptName };
    if (!concept) {
      return null;
    }

    const prerequisites: any[] = [];
    // TODO: Implement getConceptPrerequisites in db.ts
    // const prerequisites = await db.getConceptPrerequisites(concept.id);
    const userPrerequisites = await Promise.all(
      prerequisites.map(async (prereq: any) => ({
        conceptId: prereq.id,
        conceptName: prereq.name,
        userKnows: (await assessment.getUserConceptConfidence(userId, prereq.id)) > 0.5,
        severity: prereq.severity as "low" | "medium" | "high",
      }))
    );

    // Determine recommended layer
    const recommendedLayer = userConfidence < 0.4 ? "foundation" : userConfidence < 0.7 ? "deepDive" : "expert";

    // Build adaptive context
    const context: AdaptiveContext = {
      userId,
      conceptName,
      userConfidence,
      prerequisites: userPrerequisites,
      recommendedLayer,
    };

    // Build system prompt
    const systemPrompt = buildAdaptiveSystemPrompt(context);

    // Generate LLM response
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const messageContent = response.choices[0]?.message.content || "";
    const messageText = typeof messageContent === "string" ? messageContent : "";

    // Extract key points from response (simple heuristic)
    const keyPoints = extractKeyPoints(messageText);

    // Get suggested prerequisites
    const suggestedPrerequisites = userPrerequisites
      .filter((p: any) => !p.userKnows && p.severity === "high")
      .map((p: any) => p.conceptName);

    // Get suggested next topics (related concepts)
    const suggestedNextTopics: string[] = [];
    // TODO: Implement getRelatedConcepts in db.ts
    // const relatedConcepts = await db.getRelatedConcepts(concept.id, 3);
    // const suggestedNextTopics = relatedConcepts.map((c: any) => c.name);

    // Estimate read time based on word count
    const wordCount = messageText.split(/\s+/).length;
    const estimatedReadTime = Math.max(2, Math.ceil(wordCount / 200));

    return {
      message: messageText,
      layer: recommendedLayer,
      keyPoints,
      suggestedPrerequisites,
      suggestedNextTopics,
      estimatedReadTime,
    };
  } catch (error) {
    console.error("[AdaptiveChat] Failed to generate response:", error);
    return null;
  }
}

/**
 * Extract key points from response text (simple heuristic)
 */
function extractKeyPoints(text: string): string[] {
  const keyPoints: string[] = [];

  // Look for bullet points or numbered lists
  const bulletPattern = /^[\s]*[-•*]\s+(.+?)$/gm;
  const numberedPattern = /^[\s]*\d+\.\s+(.+?)$/gm;

  let match;
  while ((match = bulletPattern.exec(text)) !== null) {
    keyPoints.push(match[1].trim());
  }

  while ((match = numberedPattern.exec(text)) !== null) {
    keyPoints.push(match[1].trim());
  }

  // If no lists found, extract first 3 sentences as key points
  if (keyPoints.length === 0) {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    keyPoints.push(...sentences.slice(0, 3).map((s) => s.trim()));
  }

  return keyPoints.slice(0, 5); // Return max 5 key points
}

/**
 * Record chat interaction for adaptive learning
 */
export async function recordChatInteraction(
  userId: number,
  conceptId: number,
  userMessage: string,
  assistantResponse: string,
  layer: "foundation" | "deepDive" | "expert"
): Promise<void> {
  try {
    // Record engagement
    const timeSpentSeconds = Math.ceil(userMessage.length / 10); // Rough estimate
    await assessment.recordContentEngagement(userId, conceptId, timeSpentSeconds, "save");

    // Could also log to analytics or user interaction history
    console.log(`[AdaptiveChat] Recorded interaction for user ${userId} on concept ${conceptId} (${layer})`);
  } catch (error) {
    console.error("[AdaptiveChat] Failed to record interaction:", error);
  }
}

/**
 * Get chat suggestions based on user's learning gaps
 */
export async function getChatSuggestions(userId: number): Promise<string[]> {
  try {
    const gaps = await assessment.detectKnowledgeGaps(userId);

    if (gaps.length === 0) {
      return ["Ask me anything!", "What would you like to learn today?", "Curious about something?"];
    }

    // Suggest learning about the top gaps
    const suggestions = gaps.slice(0, 3).map((gap) => `Learn about ${gap.conceptName}`);

    return suggestions;
  } catch (error) {
    console.error("[AdaptiveChat] Failed to get suggestions:", error);
    return ["Ask me anything!"];
  }
}
