import { orchestrateLLM } from "../ai-orchestrator";
/**
 * Claude Content Generator Service
 *
 * Uses Claude API to generate high-quality, adaptive learning content
 * Features:
 * - Personalized content based on learner profile
 * - Misconception detection and correction
 * - Multiple content modalities (text, examples, analogies)
 * - Adaptive difficulty adjustment
 * - Real-time content generation
 * - API TIMEOUT PROTECTION: All Claude API calls have timeouts to prevent hanging
 */

interface LearnerProfile {
  learnerId: string;
  topic: string;
  learningStyle: "visual" | "kinesthetic" | "auditory" | "reading";
  currentDifficulty: "beginner" | "intermediate" | "advanced";
  learningPace: "slow" | "moderate" | "fast";
  priorKnowledge: string[];
  commonMisconceptions?: string[];
  engagementScore: number;
  motivationLevel: "low" | "medium" | "high";
}

interface GeneratedContent {
  title: string;
  introduction: string;
  mainContent: string;
  examples: string[];
  analogies: string[];
  misconceptionCorrections: {
    misconception: string;
    correction: string;
  }[];
  keyTakeaways: string[];
  assessmentQuestions: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];
  nextTopicSuggestions: string[];
}

class ClaudeContentGenerator {
  constructor() {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      throw new Error("CLAUDE_API_KEY environment variable is not set");
    }
  }

  /**
   * Generate personalized learning content for a specific topic
   * Includes 15-second timeout to prevent hanging
   */
  async generateLessonContent(
    learnerProfile: LearnerProfile,
    topic: string
  ): Promise<GeneratedContent> {
    const prompt = this.buildContentPrompt(learnerProfile, topic);

    try {
      const message = await this.withTimeout(
        orchestrateLLM("content", {
        messages: [            {
              role: "user",
              content: prompt,
            },
          ],
        }),
        15000 // 15 second timeout
      );

      const responseText =
        message.choices[0]?.message?.content as string || "";
      return this.parseGeneratedContent(responseText);
    } catch (error) {
      console.error("Claude API call timed out or failed:", error);
      throw new Error("Failed to generate lesson content: API timeout or error");
    }
  }

  /**
   * Generate misconception corrections based on learner's wrong answers
   * Includes 10-second timeout
   */
  async generateMisconceptionCorrection(
    learnerProfile: LearnerProfile,
    topic: string,
    misconception: string,
    correctConcept: string
  ): Promise<string> {
    const prompt = `
You are an expert educator helping a ${learnerProfile.currentDifficulty} level learner understand ${topic}.

The learner has the following misconception: "${misconception}"
The correct concept is: "${correctConcept}"

Learning style: ${learnerProfile.learningStyle}
Motivation level: ${learnerProfile.motivationLevel}

Generate a clear, encouraging explanation that:
1. Acknowledges why this misconception is common
2. Explains the correct concept using ${learnerProfile.learningStyle} examples
3. Shows how the misconception differs from reality
4. Uses language appropriate for ${learnerProfile.learningStyle} learners
5. Builds confidence by showing the learner's thinking was partially correct

Keep the explanation concise (2-3 paragraphs) and encouraging.
`;

    try {
      const message = await this.withTimeout(
        orchestrateLLM("content", {
        messages: [            {
              role: "user",
              content: prompt,
            },
          ],
        }),
        10000 // 10 second timeout
      );

      return message.choices[0]?.message?.content as string || "";
    } catch (error) {
      console.error("Claude API call timed out:", error);
      throw new Error("Failed to generate misconception correction: API timeout");
    }
  }

  /**
   * Generate adaptive difficulty variants of content
   */
  async generateDifficultyVariants(
    topic: string,
    content: string
  ): Promise<{
    beginner: string;
    intermediate: string;
    advanced: string;
  }> {
    const prompt = `
You are an expert educator. Given the following educational content about "${topic}":

"${content}"

Generate three versions of this content at different difficulty levels:

1. BEGINNER: Simple, uses everyday analogies, explains all terms, short paragraphs
2. INTERMEDIATE: Balanced depth, assumes some background knowledge, introduces technical terms
3. ADVANCED: In-depth analysis, assumes strong background, includes nuances and edge cases

Format your response as:
BEGINNER:
[beginner version]

INTERMEDIATE:
[intermediate version]

ADVANCED:
[advanced version]
`;

    try {
      const message = await this.withTimeout(
        orchestrateLLM("content", {
        messages: [            {
              role: "user",
              content: prompt,
            },
          ],
        }),
        12000 // 12 second timeout
      );

      const responseText =
        message.choices[0]?.message?.content as string || "";
      return this.parseDifficultyVariants(responseText);
    } catch (error) {
      console.error("Claude API call timed out:", error);
      throw new Error("Failed to generate difficulty variants: API timeout");
    }
  }

  /**
   * Generate personalized learning path recommendations
   */
  async generateLearningPathRecommendations(
    learnerProfile: LearnerProfile,
    currentTopic: string,
    masteryLevel: number
  ): Promise<string[]> {
    const prompt = `
You are an expert learning path designer. A ${learnerProfile.currentDifficulty} level learner with ${learnerProfile.learningStyle} learning style has just completed "${currentTopic}" with ${masteryLevel}% mastery.

Prior knowledge: ${learnerProfile.priorKnowledge.join(", ")}
Learning pace: ${learnerProfile.learningPace}
Motivation: ${learnerProfile.motivationLevel}

Suggest 5 logical next topics that:
1. Build on their current knowledge
2. Match their learning pace
3. Maintain engagement based on their motivation level
4. Are appropriate for their learning style

Return ONLY a JSON array of 5 topic strings, like:
["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]
`;

    try {
      const message = await this.withTimeout(
        orchestrateLLM("content", {
        messages: [            {
              role: "user",
              content: prompt,
            },
          ],
        }),
        10000 // 10 second timeout
      );

      const responseText =
        message.choices[0]?.message?.content as string || "";
      try {
        const jsonMatch = responseText.match(/\[.*\]/s);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("Failed to parse learning path recommendations:", e);
      }
      return [];
    } catch (error) {
      console.error("Claude API call timed out:", error);
      return [];
    }
  }

  /**
   * Generate assessment questions for a topic
   */
  async generateAssessmentQuestions(
    topic: string,
    difficulty: "beginner" | "intermediate" | "advanced",
    count: number = 5
  ): Promise<
    {
      question: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
    }[]
  > {
    const prompt = `
Generate ${count} multiple-choice assessment questions for "${topic}" at ${difficulty} level.

For each question:
1. Create a clear, unambiguous question
2. Provide 4 plausible options (1 correct, 3 common misconceptions)
3. Identify the correct answer
4. Explain why the correct answer is right and why common misconceptions are wrong

Format as JSON array:
[
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "A",
    "explanation": "..."
  }
]
`;

    try {
      const message = await this.withTimeout(
        orchestrateLLM("content", {
        messages: [            {
              role: "user",
              content: prompt,
            },
          ],
        }),
        12000 // 12 second timeout
      );

      const responseText =
        message.choices[0]?.message?.content as string || "";
      try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("Failed to parse assessment questions:", e);
      }
      return [];
    } catch (error) {
      console.error("Claude API call timed out:", error);
      return [];
    }
  }

  /**
   * Generate content tailored to specific learning style
   */
  async generateLearningStyleContent(
    topic: string,
    learningStyle: "visual" | "kinesthetic" | "auditory" | "reading"
  ): Promise<string> {
    const styleGuides = {
      visual:
        "Use vivid descriptions, diagrams descriptions, color references, spatial relationships, and visual metaphors",
      kinesthetic:
        "Use hands-on examples, movement descriptions, physical interactions, and practical applications",
      auditory:
        "Use rhythm, dialogue, discussions, explanations, and conversational language",
      reading:
        "Use detailed text, lists, structured information, definitions, and written examples",
    };

    const prompt = `
Create engaging educational content about "${topic}" optimized for ${learningStyle} learners.

Style guide: ${styleGuides[learningStyle]}

The content should:
1. Use the recommended style throughout
2. Include 2-3 concrete examples
3. Be engaging and maintain interest
4. Be appropriate for self-study
5. Include a brief summary

Keep it to 3-4 paragraphs.
`;

    try {
      const message = await this.withTimeout(
        orchestrateLLM("content", {
        messages: [            {
              role: "user",
              content: prompt,
            },
          ],
        }),
        10000 // 10 second timeout
      );

      return message.choices[0]?.message?.content as string || "";
    } catch (error) {
      console.error("Claude API call timed out:", error);
      return "";
    }
  }

  // ─── Private Helper Methods ──────────────────────────────────────────────────

  /**
   * Wraps a promise with a timeout
   * Rejects if the promise doesn't resolve within the specified time
   */
  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Operation timed out after ${ms}ms`)),
          ms
        )
      ),
    ]);
  }

  private buildContentPrompt(
    learnerProfile: LearnerProfile,
    topic: string
  ): string {
    return `
You are an expert educator creating personalized learning content.

LEARNER PROFILE:
- Level: ${learnerProfile.currentDifficulty}
- Learning Style: ${learnerProfile.learningStyle}
- Pace: ${learnerProfile.learningPace}
- Prior Knowledge: ${learnerProfile.priorKnowledge.join(", ") || "None specified"}
- Common Misconceptions: ${learnerProfile.commonMisconceptions?.join(", ") || "None specified"}
- Motivation: ${learnerProfile.motivationLevel}

TOPIC: ${topic}

Generate comprehensive learning content that:
1. Matches the learner's level (${learnerProfile.currentDifficulty})
2. Uses ${learnerProfile.learningStyle} examples and explanations
3. Builds on their prior knowledge
4. Addresses common misconceptions
5. Maintains engagement for ${learnerProfile.motivationLevel} motivation

Format the response as JSON with this structure:
{
  "title": "...",
  "introduction": "...",
  "mainContent": "...",
  "examples": ["example1", "example2", "example3"],
  "analogies": ["analogy1", "analogy2"],
  "misconceptionCorrections": [
    {"misconception": "...", "correction": "..."}
  ],
  "keyTakeaways": ["takeaway1", "takeaway2", "takeaway3"],
  "assessmentQuestions": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "..."
    }
  ],
  "nextTopicSuggestions": ["topic1", "topic2", "topic3"]
}
`;
  }

  private parseGeneratedContent(responseText: string): GeneratedContent {
    try {
      // Extract JSON from response (Claude might include explanation text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Failed to parse generated content:", e);
    }

    // Fallback structure if parsing fails
    return {
      title: "Learning Content",
      introduction: responseText.substring(0, 200),
      mainContent: responseText,
      examples: [],
      analogies: [],
      misconceptionCorrections: [],
      keyTakeaways: [],
      assessmentQuestions: [],
      nextTopicSuggestions: [],
    };
  }

  private parseDifficultyVariants(responseText: string): {
    beginner: string;
    intermediate: string;
    advanced: string;
  } {
    const beginnerMatch = responseText.match(
      /BEGINNER:\s*([\s\S]*?)(?=INTERMEDIATE:|$)/
    );
    const intermediateMatch = responseText.match(
      /INTERMEDIATE:\s*([\s\S]*?)(?=ADVANCED:|$)/
    );
    const advancedMatch = responseText.match(/ADVANCED:\s*([\s\S]*?)$/);

    return {
      beginner: beginnerMatch ? beginnerMatch[1].trim() : "",
      intermediate: intermediateMatch ? intermediateMatch[1].trim() : "",
      advanced: advancedMatch ? advancedMatch[1].trim() : "",
    };
  }
}

// Export singleton instance
export const claudeContentGenerator = new ClaudeContentGenerator();

// Export type for use in other modules
export type { LearnerProfile, GeneratedContent };
