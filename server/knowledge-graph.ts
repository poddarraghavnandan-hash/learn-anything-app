/**
 * Knowledge Graph & Prerequisite Generation Service
 * 
 * Generates implicit prerequisite maps and concept relationships using LLM.
 * Caches results to minimize API calls.
 */

import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import { InsertConceptPrerequisite, InsertConceptRelationship } from "../drizzle/schema";

const CACHE_TTL_DAYS = 30;

interface PrerequisiteGenerationResult {
  conceptId: number;
  prerequisites: Array<{
    name: string;
    confidence: number;
    relationshipType: string;
    description?: string;
  }>;
}

interface ConceptRelationshipResult {
  conceptA: string;
  conceptB: string;
  relationshipType: string;
  strength: number;
  description?: string;
}

/**
 * Generate prerequisites for a concept using LLM
 * Caches results to avoid repeated API calls
 */
export async function generatePrerequisites(
  conceptName: string,
  conceptSlug: string,
  topicSlug?: string
): Promise<PrerequisiteGenerationResult | null> {
  try {
    // Get or create concept
    let concept = await db.getConceptBySlug(conceptSlug);
    if (!concept) {
      await db.upsertConcept({
        slug: conceptSlug,
        name: conceptName,
        description: `Concept: ${conceptName}`,
        topicSlug,
      });
      concept = await db.getConceptBySlug(conceptSlug);
    }

    if (!concept) return null;

    // Check if prerequisites are cached and not expired
    const existingPrereqs = await db.getPrerequisitesForConcept(concept.id);
    if (existingPrereqs.length > 0) {
      const allValid = existingPrereqs.every((p) => new Date(p.cachedUntil) > new Date());
      if (allValid) {
        return {
          conceptId: concept.id,
          prerequisites: existingPrereqs.map((p) => ({
            name: "", // Would need to join with concept table
            confidence: p.confidence,
            relationshipType: p.relationshipType,
          })),
        };
      }
    }

    // Generate prerequisites using LLM
    const systemPrompt = `You are an expert in knowledge mapping and curriculum design.
Your task is to identify the fundamental prerequisites needed to understand a concept.
Think about what foundational knowledge a learner must have before tackling this topic.
Consider both direct prerequisites (must know first) and related concepts (helpful to know).`;

    const userPrompt = `For the concept "${conceptName}", identify 3-5 key prerequisites that someone needs to understand first.
For each prerequisite, provide:
1. The prerequisite concept name
2. A confidence score (0-1) indicating how essential it is
3. The relationship type (prerequisite, related, extends, foundation)
4. A brief explanation of why it's needed

Format your response as a JSON array like this:
[
  {
    "name": "Algebra",
    "confidence": 0.95,
    "relationshipType": "prerequisite",
    "description": "Essential for understanding equations and variables"
  }
]

IMPORTANT: Return ONLY valid JSON, no markdown formatting or extra text.`;

    const result = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const response = result.choices[0]?.message.content || "";
    const responseText = typeof response === "string" ? response : "";

    let prerequisites: Array<{
      name: string;
      confidence: number;
      relationshipType: string;
      description?: string;
    }> = [];

    try {
      // Parse JSON response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        prerequisites = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("[KnowledgeGraph] Failed to parse LLM response:", parseError);
      return null;
    }

    // Save prerequisites to database
    const cachedUntil = new Date(Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);

    for (const prereq of prerequisites) {
      // Get or create prerequisite concept
      const prereqSlug = prereq.name.toLowerCase().replace(/\s+/g, "-");
      let prereqConcept = await db.getConceptBySlug(prereqSlug);
      if (!prereqConcept) {
        await db.upsertConcept({
          slug: prereqSlug,
          name: prereq.name,
          description: prereq.description || `Prerequisite for ${conceptName}`,
          topicSlug,
        });
        prereqConcept = await db.getConceptBySlug(prereqSlug);
      }

      if (prereqConcept) {
        // Save prerequisite relationship
        const prereqRecord: InsertConceptPrerequisite = {
          conceptId: concept.id,
          prerequisiteId: prereqConcept.id,
          confidence: prereq.confidence,
          relationshipType: prereq.relationshipType,
          cachedUntil,
        };
        await db.upsertConceptPrerequisite(prereqRecord);
      }
    }

    return {
      conceptId: concept.id,
      prerequisites,
    };
  } catch (error) {
    console.error("[KnowledgeGraph] Failed to generate prerequisites:", error);
    return null;
  }
}

/**
 * Generate concept relationships (bidirectional graph)
 * Maps how concepts relate to each other across a domain
 */
export async function generateConceptRelationships(
  conceptAName: string,
  conceptASlug: string,
  conceptBName: string,
  conceptBSlug: string,
  topicSlug?: string
): Promise<ConceptRelationshipResult | null> {
  try {
    // Get or create concepts
    let conceptA = await db.getConceptBySlug(conceptASlug);
    if (!conceptA) {
      await db.upsertConcept({
        slug: conceptASlug,
        name: conceptAName,
        topicSlug,
      });
      conceptA = await db.getConceptBySlug(conceptASlug);
    }

    let conceptB = await db.getConceptBySlug(conceptBSlug);
    if (!conceptB) {
      await db.upsertConcept({
        slug: conceptBSlug,
        name: conceptBName,
        topicSlug,
      });
      conceptB = await db.getConceptBySlug(conceptBSlug);
    }

    if (!conceptA || !conceptB) return null;

    // Generate relationship using LLM
    const systemPrompt = `You are an expert in knowledge mapping.
Analyze the relationship between two concepts and describe how they relate.`;

    const userPrompt = `Describe the relationship between "${conceptAName}" and "${conceptBName}".
Provide:
1. The relationship type (prerequisite, related, extends, opposite, foundation, application)
2. A strength score (0-1) indicating how strongly they're related
3. A brief explanation

Format as JSON:
{
  "relationshipType": "related",
  "strength": 0.7,
  "description": "Both are fundamental concepts in physics"
}

IMPORTANT: Return ONLY valid JSON, no markdown.`;

    const result = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const response = result.choices[0]?.message.content || "";
    const responseText = typeof response === "string" ? response : "";

    let relationshipData: {
      relationshipType: string;
      strength: number;
      description?: string;
    } | null = null;

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        relationshipData = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("[KnowledgeGraph] Failed to parse relationship response:", parseError);
      return null;
    }

    if (!relationshipData) return null;

    // Save relationship to database
    const cachedUntil = new Date(Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);

    const relationshipRecord: InsertConceptRelationship = {
      conceptAId: conceptA.id,
      conceptBId: conceptB.id,
      relationshipType: relationshipData.relationshipType,
      strength: relationshipData.strength,
      cachedUntil,
    };

    await db.upsertConceptRelationship(relationshipRecord);

    return {
      conceptA: conceptAName,
      conceptB: conceptBName,
      relationshipType: relationshipData.relationshipType,
      strength: relationshipData.strength,
      description: relationshipData.description,
    };
  } catch (error) {
    console.error("[KnowledgeGraph] Failed to generate relationship:", error);
    return null;
  }
}

/**
 * Get the full prerequisite chain for a concept (BFS traversal)
 */
export async function getPrerequisiteChain(conceptId: number, maxDepth = 3): Promise<Map<number, number>> {
  const visited = new Map<number, number>(); // conceptId -> depth
  const queue: Array<{ id: number; depth: number }> = [{ id: conceptId, depth: 0 }];

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;

    if (visited.has(id) || depth > maxDepth) continue;
    visited.set(id, depth);

    const prereqs = await db.getPrerequisitesForConcept(id);
    for (const prereq of prereqs) {
      if (!visited.has(prereq.prerequisiteId)) {
        queue.push({ id: prereq.prerequisiteId, depth: depth + 1 });
      }
    }
  }

  return visited;
}

/**
 * Get all concepts related to a given concept
 */
export async function getRelatedConcepts(conceptId: number): Promise<number[]> {
  const relationships = await db.getRelationshipsForConcept(conceptId);
  const relatedIds = new Set<number>();

  for (const rel of relationships) {
    if (rel.conceptAId === conceptId) {
      relatedIds.add(rel.conceptBId);
    } else {
      relatedIds.add(rel.conceptAId);
    }
  }

  return Array.from(relatedIds);
}
