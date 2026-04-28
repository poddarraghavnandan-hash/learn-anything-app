/**
 * Concept Extractor Agent
 * Uses Claude to identify key concepts from research papers
 * Extracts definitions, relationships, and prerequisites
 */

import { orchestrateLLM } from "../ai-orchestrator";
export interface Concept {
  name: string;
  definition: string;
  importance: "core" | "supporting" | "advanced";
  prerequisites: string[];
  relatedConcepts: string[];
  keyEquations?: string[];
  examples?: string[];
}

export interface ConceptGraph {
  concepts: Concept[];
  relationships: Array<{
    from: string;
    to: string;
    type: "prerequisite" | "related" | "extends";
  }>;
  difficulty: "beginner" | "intermediate" | "advanced";
}

/**
 * Extract concepts from paper abstract and title
 */
export async function extractConcepts(
  title: string,
  abstract: string,
  authors: string[]
): Promise<ConceptGraph> {
  try {
    const prompt = `You are an expert AI that extracts and structures key concepts from research papers.

Paper Title: ${title}
Authors: ${authors.join(", ")}

Paper Abstract:
${abstract}

Your task:
1. Identify 5-8 core concepts from this paper
2. For each concept, provide:
   - Clear definition (2-3 sentences)
   - Importance level (core/supporting/advanced)
   - Prerequisites (what must be understood first)
   - Related concepts (other concepts it connects to)
   - Key equations (if applicable)
   - Real-world examples

3. Map concept relationships (prerequisite chains)
4. Determine overall difficulty level

Return your response as a JSON object with this structure:
{
  "concepts": [
    {
      "name": "string",
      "definition": "string",
      "importance": "core|supporting|advanced",
      "prerequisites": ["string"],
      "relatedConcepts": ["string"],
      "keyEquations": ["string"],
      "examples": ["string"]
    }
  ],
  "relationships": [
    {
      "from": "string",
      "to": "string",
      "type": "prerequisite|related|extends"
    }
  ],
  "difficulty": "beginner|intermediate|advanced"
}

Be thorough but concise. Focus on concepts that are essential to understanding this paper.`;

    const message = await orchestrateLLM("content", {      maxTokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract JSON from response
    const responseText =
      message.choices[0]?.message?.content as string || "";

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse concept extraction response");
    }

    const conceptGraph: ConceptGraph = JSON.parse(jsonMatch[0]);
    return conceptGraph;
  } catch (error) {
    console.error("Concept extraction error:", error);
    throw new Error("Failed to extract concepts from paper");
  }
}

/**
 * Generate concept definitions and explanations
 */
export async function generateConceptExplanation(
  conceptName: string,
  paperContext: string,
  targetAudience: "beginner" | "intermediate" | "advanced" = "intermediate"
): Promise<{
  definition: string;
  explanation: string;
  analogy: string;
  keyPoints: string[];
  commonMisconceptions: string[];
}> {
  try {
    const prompt = `You are an expert science communicator explaining complex concepts.

Concept: ${conceptName}
Paper Context: ${paperContext}
Target Audience: ${targetAudience}

Provide a comprehensive explanation including:
1. Clear definition (1-2 sentences)
2. Detailed explanation (3-4 sentences)
3. Real-world analogy to help understanding
4. 3-4 key points about this concept
5. 2-3 common misconceptions people have

Return as JSON:
{
  "definition": "string",
  "explanation": "string",
  "analogy": "string",
  "keyPoints": ["string"],
  "commonMisconceptions": ["string"]
}`;

    const message = await orchestrateLLM("content", {      maxTokens: 1500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.choices[0]?.message?.content as string || "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Failed to parse explanation response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Explanation generation error:", error);
    throw new Error("Failed to generate concept explanation");
  }
}

/**
 * Identify learning prerequisites for a concept
 */
export async function identifyPrerequisites(
  conceptName: string,
  paperTitle: string
): Promise<{
  prerequisites: string[];
  difficulty: number; // 1-10 scale
  estimatedLearningTime: number; // minutes
}> {
  try {
    const prompt = `For the concept "${conceptName}" in the paper "${paperTitle}":

1. List the prerequisite concepts someone needs to understand first (3-5 items)
2. Rate difficulty on a scale of 1-10 (1=easy, 10=very hard)
3. Estimate how long it takes to learn this concept (in minutes)

Return as JSON:
{
  "prerequisites": ["string"],
  "difficulty": number,
  "estimatedLearningTime": number
}`;

    const message = await orchestrateLLM("content", {      maxTokens: 500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.choices[0]?.message?.content as string || "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Failed to parse prerequisites response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Prerequisites identification error:", error);
    throw new Error("Failed to identify prerequisites");
  }
}

/**
 * Generate quiz questions for a concept
 */
export async function generateConceptQuiz(
  conceptName: string,
  explanation: string,
  difficulty: "beginner" | "intermediate" | "advanced" = "intermediate"
): Promise<
  Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }>
> {
  try {
    const prompt = `Create 3 quiz questions to test understanding of "${conceptName}".
Difficulty level: ${difficulty}

Explanation context:
${explanation}

For each question, provide:
1. Question text
2. 4 multiple choice options
3. Index of correct answer (0-3)
4. Explanation of why the answer is correct

Return as JSON array:
[
  {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correctAnswer": number,
    "explanation": "string"
  }
]`;

    const message = await orchestrateLLM("content", {      maxTokens: 1500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.choices[0]?.message?.content as string || "";
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      throw new Error("Failed to parse quiz response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Quiz generation error:", error);
    throw new Error("Failed to generate quiz questions");
  }
}
