import { getDb } from "./db";
import { eq, and, lt, desc } from "drizzle-orm";
import { userConceptMetrics } from "@/drizzle/schema";
import { invokeLLM } from "./_core/llm";

export interface KnowledgeGap {
  conceptId: number;
  conceptName: string;
  accuracy: number; // 0-1, lower = bigger gap
  lastReviewDate: Date | null;
  reviewCount: number;
  confidenceInferred: number;
}

export interface RefresherConfig {
  delayDays: number; // days since last session
  intensity: "quick" | "medium" | "full"; // based on delay
  focusGaps: KnowledgeGap[]; // top 3-5 knowledge gaps
  maxLength: number; // words: quick=150, medium=300, full=500
}

export interface PersonalizedRefresher {
  title: string;
  intensity: "quick" | "medium" | "full";
  sections: RefresherSection[];
  estimatedTime: number; // minutes
  keyTakeaways: string[];
}

export interface RefresherSection {
  title: string;
  content: string;
  conceptId: number;
  difficulty: "foundation" | "intermediate" | "advanced";
  keyPoints: string[];
}

/**
 * Analyze user's knowledge gaps from concept metrics
 */
export async function analyzeKnowledgeGaps(userId: number): Promise<KnowledgeGap[]> {
  const db = await getDb();
  if (!db) return [];

  const metrics = await db
    .select()
    .from(userConceptMetrics)
    .where(eq(userConceptMetrics.userId, userId))
    .orderBy(desc(userConceptMetrics.lastInteractionAt))
    .limit(50);

  // Sort by accuracy (lowest first = biggest gaps)
  const gaps = metrics
    .map((m) => ({
      conceptId: m.conceptId,
      conceptName: m.conceptName || `Concept ${m.conceptId}`,
      accuracy: m.quizAccuracy,
      lastReviewDate: m.lastReviewDate,
      reviewCount: m.reviewCount,
      confidenceInferred: m.confidenceInferred,
    }))
    .filter((g) => g.accuracy < 0.8) // Focus on areas where accuracy < 80%
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5); // Top 5 knowledge gaps

  return gaps;
}

/**
 * Calculate refresher intensity based on time since last session
 */
export function calculateRefresherIntensity(lastSessionDate: Date): RefresherConfig["intensity"] {
  const now = new Date();
  const delayMs = now.getTime() - lastSessionDate.getTime();
  const delayDays = delayMs / (1000 * 60 * 60 * 24);

  if (delayDays < 1) return "quick"; // < 1 day: quick recap
  if (delayDays < 7) return "medium"; // 1-7 days: medium refresher
  return "full"; // 7+ days: full refresher
}

/**
 * Get max content length based on intensity
 */
function getMaxLength(intensity: "quick" | "medium" | "full"): number {
  switch (intensity) {
    case "quick":
      return 150;
    case "medium":
      return 300;
    case "full":
      return 500;
  }
}

/**
 * Generate personalized refresher content
 */
export async function generatePersonalizedRefresher(
  userId: number,
  topicSlug: string,
  lastSessionDate: Date
): Promise<PersonalizedRefresher> {
  // Analyze knowledge gaps
  const gaps = await analyzeKnowledgeGaps(userId);

  // Calculate intensity
  const delayMs = new Date().getTime() - lastSessionDate.getTime();
  const delayDays = delayMs / (1000 * 60 * 60 * 24);
  const intensity = calculateRefresherIntensity(lastSessionDate);
  const maxLength = getMaxLength(intensity);

  // Build refresher config
  const config: RefresherConfig = {
    delayDays,
    intensity,
    focusGaps: gaps,
    maxLength,
  };

  // Generate refresher content via LLM
  const prompt = buildRefresherPrompt(topicSlug, config);
  const result = await invokeLLM({
    messages: [{ role: "user", content: prompt }],
    maxTokens: Math.ceil(maxLength / 4), // rough estimate: 1 token ≈ 4 chars
  });
  const refresherText = result.choices?.[0]?.message?.content || "";
  const contentStr = typeof refresherText === "string" ? refresherText : "";
  const refresherContent = contentStr;

  // Parse and structure refresher
  const refresher = parseRefresherContent(contentStr, intensity);

  return {
    ...refresher,
    intensity,
    estimatedTime: calculateEstimatedTime(intensity),
  };
}

/**
 * Build LLM prompt for personalized refresher
 */
function buildRefresherPrompt(topicSlug: string, config: RefresherConfig): string {
  const gapsList = config.focusGaps.map((g) => `- ${g.conceptName} (${Math.round(g.accuracy * 100)}% accuracy)`).join("\n");

  const intensityDesc = {
    quick: "very brief (2-3 bullet points, 150 words max)",
    medium: "moderate (3-4 sections, 300 words max)",
    full: "comprehensive (5-6 sections, 500 words max)",
  }[config.intensity];

  return `You are a personalized learning refresher generator. Generate a ${intensityDesc} refresher for the topic "${topicSlug}".

User's knowledge gaps (areas where they struggled):
${gapsList}

Days since last session: ${Math.round(config.delayDays)}

Create a refresher that:
1. Focuses on the user's specific knowledge gaps (areas where they got questions wrong)
2. Uses simple, clear language
3. Includes concrete examples
4. Ends with 2-3 key takeaways

Format as:
TITLE: [Catchy title]
SECTION 1: [Title]
[Content]
KEY POINTS: [Bullet 1], [Bullet 2], [Bullet 3]

SECTION 2: [Title]
[Content]
KEY POINTS: [Bullet 1], [Bullet 2], [Bullet 3]

[Continue for ${config.intensity === "quick" ? 2 : config.intensity === "medium" ? 3 : 5} sections]

TAKEAWAYS: [Takeaway 1], [Takeaway 2], [Takeaway 3]`;
}

/**
 * Parse LLM refresher content into structured format
 */
function parseRefresherContent(content: string, intensity: "quick" | "medium" | "full"): Omit<PersonalizedRefresher, "intensity" | "estimatedTime"> {
  const lines = content.split("\n");
  const sections: RefresherSection[] = [];
  let title = "Quick Refresher";
  let keyTakeaways: string[] = [];

  let currentSection: Partial<RefresherSection> | null = null;

  for (const line of lines) {
    if (line.startsWith("TITLE:")) {
      title = line.replace("TITLE:", "").trim();
    } else if (line.startsWith("SECTION")) {
      if (currentSection && currentSection.title) {
        sections.push({
          title: currentSection.title || "Section",
          content: currentSection.content || "",
          conceptId: sections.length,
          difficulty: intensity === "quick" ? "foundation" : intensity === "medium" ? "intermediate" : "advanced",
          keyPoints: currentSection.keyPoints || [],
        });
      }
      currentSection = {
        title: line.replace(/SECTION \d+:/, "").trim(),
        content: "",
        keyPoints: [],
      };
    } else if (line.startsWith("KEY POINTS:")) {
      if (currentSection) {
        currentSection.keyPoints = line
          .replace("KEY POINTS:", "")
          .split(",")
          .map((p) => p.trim());
      }
    } else if (line.startsWith("TAKEAWAYS:")) {
      keyTakeaways = line
        .replace("TAKEAWAYS:", "")
        .split(",")
        .map((t) => t.trim());
    } else if (currentSection && line.trim() && !line.startsWith("SECTION") && !line.startsWith("KEY")) {
      currentSection.content = (currentSection.content || "") + " " + line.trim();
    }
  }

  // Add last section
  if (currentSection && currentSection.title) {
    sections.push({
      title: currentSection.title || "Section",
      content: currentSection.content || "",
      conceptId: sections.length,
      difficulty: intensity === "quick" ? "foundation" : intensity === "medium" ? "intermediate" : "advanced",
      keyPoints: currentSection.keyPoints || [],
    });
  }

  return {
    title,
    sections: sections.slice(0, intensity === "quick" ? 2 : intensity === "medium" ? 3 : 5),
    keyTakeaways,
  };
}

/**
 * Calculate estimated time based on intensity
 */
function calculateEstimatedTime(intensity: "quick" | "medium" | "full"): number {
  switch (intensity) {
    case "quick":
      return 2; // 2 minutes
    case "medium":
      return 5; // 5 minutes
    case "full":
      return 10; // 10 minutes
  }
}

/**
 * Get user's last session date for a topic
 */
export async function getLastSessionDate(userId: number, topicSlug: string): Promise<Date | null> {
  const db = await getDb();
  if (!db) return null;

  const lastMetric = await db
    .select()
    .from(userConceptMetrics)
    .where(eq(userConceptMetrics.userId, userId))
    .orderBy(desc(userConceptMetrics.lastInteractionAt))
    .limit(1);

  if (lastMetric.length > 0 && lastMetric[0].lastInteractionAt) {
    return lastMetric[0].lastInteractionAt;
  }
  return null;
}
