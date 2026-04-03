/**
 * Multi-Layer Content Generation Service
 * 
 * Generates Foundation, Deep Dive, and Expert content for concepts.
 * Uses LLM with intelligent caching to minimize API costs.
 */

import { orchestrateLLM } from "./ai-orchestrator";
import * as db from "./db";
import { InsertConceptContent } from "../drizzle/schema";

const CACHE_TTL_DAYS = 30;

interface GeneratedContent {
  layer: "foundation" | "deepDive" | "expert";
  content: string;
  keyPoints: string[];
  estimatedReadTime: number; // minutes
}

interface ContentGenerationResult {
  conceptId: number;
  conceptName: string;
  foundation: GeneratedContent;
  deepDive: GeneratedContent;
  expert: GeneratedContent;
}

/**
 * Generate Foundation layer content (ELI5 style)
 */
async function generateFoundationContent(conceptName: string, conceptDescription?: string): Promise<GeneratedContent> {
  const userPrompt = `Create a Foundation layer explanation for the concept: "${conceptName}"
${conceptDescription ? `Context: ${conceptDescription}` : ""}

Requirements:
- Use simple, everyday language (Explain Like I'm 5)
- No jargon or technical terms
- Use 2-3 concrete analogies from daily life
- Keep to 150-200 words
- End with 3 key takeaways in bullet points

Format your response as JSON:
{
  "content": "Your explanation here...",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "estimatedReadTime": 2
}

IMPORTANT: Return ONLY valid JSON, no markdown.`;

  const result = await orchestrateLLM("content", {
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const response = result.choices[0]?.message.content || "";
  const responseText = typeof response === "string" ? response : "";

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("[ContentGenerator] Failed to parse foundation content:", error);
  }

  return {
    layer: "foundation",
    content: responseText,
    keyPoints: [],
    estimatedReadTime: 3,
  };
}

/**
 * Generate Deep Dive layer content (intermediate understanding)
 */
async function generateDeepDiveContent(conceptName: string, conceptDescription?: string): Promise<GeneratedContent> {
  const userPrompt = `Create a Deep Dive layer explanation for the concept: "${conceptName}"
${conceptDescription ? `Context: ${conceptDescription}` : ""}

Requirements:
- Assume intermediate knowledge (reader knows basics)
- Explain mechanisms and how things work
- Include 2-3 real-world applications or examples
- Connect to related concepts where relevant
- Keep to 300-400 words
- End with 5 key insights in bullet points

Format your response as JSON:
{
  "content": "Your explanation here...",
  "keyPoints": ["Insight 1", "Insight 2", "Insight 3", "Insight 4", "Insight 5"],
  "estimatedReadTime": 5
}

IMPORTANT: Return ONLY valid JSON, no markdown.`;

  const result = await orchestrateLLM("content", {
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const response = result.choices[0]?.message.content || "";
  const responseText = typeof response === "string" ? response : "";

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("[ContentGenerator] Failed to parse deep dive content:", error);
  }

  return {
    layer: "deepDive",
    content: responseText,
    keyPoints: [],
    estimatedReadTime: 6,
  };
}

/**
 * Generate Expert layer content (advanced understanding)
 */
async function generateExpertContent(conceptName: string, conceptDescription?: string): Promise<GeneratedContent> {
  const userPrompt = `Create an Expert layer explanation for the concept: "${conceptName}"
${conceptDescription ? `Context: ${conceptDescription}` : ""}

Requirements:
- Assume advanced knowledge and technical background
- Discuss nuance, edge cases, and limitations
- Include cutting-edge research or recent developments
- Connect to broader theoretical frameworks
- Challenge assumptions and explore counterarguments
- Keep to 400-500 words
- End with 5-7 advanced insights in bullet points

Format your response as JSON:
{
  "content": "Your explanation here...",
  "keyPoints": ["Insight 1", "Insight 2", "Insight 3", "Insight 4", "Insight 5"],
  "estimatedReadTime": 8
}

IMPORTANT: Return ONLY valid JSON, no markdown.`;

  const result = await orchestrateLLM("content", {
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const response = result.choices[0]?.message.content || "";
  const responseText = typeof response === "string" ? response : "";

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("[ContentGenerator] Failed to parse expert content:", error);
  }

  return {
    layer: "expert",
    content: responseText,
    keyPoints: [],
    estimatedReadTime: 9,
  };
}

/**
 * Generate all three layers for a concept
 */
export async function generateAllLayers(
  conceptName: string,
  conceptSlug: string,
  conceptDescription?: string,
  topicSlug?: string
): Promise<ContentGenerationResult | null> {
  try {
    // Get or create concept
    let concept = await db.getConceptBySlug(conceptSlug);
    if (!concept) {
      await db.upsertConcept({
        slug: conceptSlug,
        name: conceptName,
        description: conceptDescription || `Concept: ${conceptName}`,
        topicSlug,
      });
      concept = await db.getConceptBySlug(conceptSlug);
    }

    if (!concept) return null;

    // Check if content is already cached
    const cachedFoundation = await db.getConceptContent(concept.id, "foundation");
    const cachedDeepDive = await db.getConceptContent(concept.id, "deepDive");
    const cachedExpert = await db.getConceptContent(concept.id, "expert");

    if (cachedFoundation && cachedDeepDive && cachedExpert) {
      // All layers cached and valid
      return {
        conceptId: concept.id,
        conceptName: concept.name,
        foundation: JSON.parse(cachedFoundation.content),
        deepDive: JSON.parse(cachedDeepDive.content),
        expert: JSON.parse(cachedExpert.content),
      };
    }

    // Generate missing layers
    console.log(`[ContentGenerator] Generating content for "${conceptName}"...`);

    const [foundation, deepDive, expert] = await Promise.all([
      cachedFoundation ? Promise.resolve(JSON.parse(cachedFoundation.content)) : generateFoundationContent(conceptName, conceptDescription),
      cachedDeepDive ? Promise.resolve(JSON.parse(cachedDeepDive.content)) : generateDeepDiveContent(conceptName, conceptDescription),
      cachedExpert ? Promise.resolve(JSON.parse(cachedExpert.content)) : generateExpertContent(conceptName, conceptDescription),
    ]);

    // Save to database
    const cachedUntil = new Date(Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);

    const contentRecords: InsertConceptContent[] = [
      {
        conceptId: concept.id,
        layer: "foundation",
        content: JSON.stringify(foundation),
      },
      {
        conceptId: concept.id,
        layer: "deepDive",
        content: JSON.stringify(deepDive),
      },
      {
        conceptId: concept.id,
        layer: "expert",
        content: JSON.stringify(expert),
      },
    ];

    for (const record of contentRecords) {
      await db.upsertConceptContent(record);
    }

    console.log(`[ContentGenerator] Content generated and cached for "${conceptName}"`);

    return {
      conceptId: concept.id,
      conceptName: concept.name,
      foundation,
      deepDive,
      expert,
    };
  } catch (error) {
    console.error("[ContentGenerator] Failed to generate content:", error);
    return null;
  }
}

/**
 * Generate content for a specific layer only
 */
export async function generateLayerContent(
  conceptId: number,
  layer: "foundation" | "deepDive" | "expert"
): Promise<GeneratedContent | null> {
  try {
    const concept = await db.getConceptById(conceptId);
    if (!concept) return null;

    // Check cache first
    const cached = await db.getConceptContent(conceptId, layer);
    if (cached) {
      return JSON.parse(cached.content);
    }

    // Generate based on layer
    let content: GeneratedContent;
    switch (layer) {
      case "foundation":
        content = await generateFoundationContent(concept.name, concept.description || undefined);
        break;
      case "deepDive":
        content = await generateDeepDiveContent(concept.name, concept.description || undefined);
        break;
      case "expert":
        content = await generateExpertContent(concept.name, concept.description || undefined);
        break;
    }

    // Save to cache
    await db.upsertConceptContent({
      conceptId,
      layer,
      content: JSON.stringify(content),
    });

    return content;
  } catch (error) {
    console.error("[ContentGenerator] Failed to generate layer content:", error);
    return null;
  }
}

/**
 * Batch generate content for multiple concepts
 */
export async function generateBatchContent(
  concepts: Array<{
    name: string;
    slug: string;
    description?: string;
    topicSlug?: string;
  }>
): Promise<ContentGenerationResult[]> {
  const results: ContentGenerationResult[] = [];

  for (const concept of concepts) {
    try {
      const result = await generateAllLayers(concept.name, concept.slug, concept.description, concept.topicSlug);
      if (result) {
        results.push(result);
      }
    } catch (error) {
      console.error(`[ContentGenerator] Failed to generate content for "${concept.name}":`, error);
    }
  }

  return results;
}

/**
 * Regenerate content for a concept (bust cache)
 */
export async function regenerateContent(conceptId: number): Promise<ContentGenerationResult | null> {
  try {
    const concept = await db.getConceptById(conceptId);
    if (!concept) return null;

    // Delete old cached content (by generating new version)
    const [foundation, deepDive, expert] = await Promise.all([
      generateFoundationContent(concept.name, concept.description || undefined),
      generateDeepDiveContent(concept.name, concept.description || undefined),
      generateExpertContent(concept.name, concept.description || undefined),
    ]);

    // Save new versions
    const contentRecords: InsertConceptContent[] = [
      {
        conceptId,
        layer: "foundation",
        content: JSON.stringify(foundation),
      },
      {
        conceptId,
        layer: "deepDive",
        content: JSON.stringify(deepDive),
      },
      {
        conceptId,
        layer: "expert",
        content: JSON.stringify(expert),
      },
    ];

    for (const record of contentRecords) {
      await db.upsertConceptContent(record);
    }

    return {
      conceptId,
      conceptName: concept.name,
      foundation,
      deepDive,
      expert,
    };
  } catch (error) {
    console.error("[ContentGenerator] Failed to regenerate content:", error);
    return null;
  }
}
