/**
 * Gemini Content Generator Service
 * Generates dense, comprehensive learning material on any topic
 * at specified difficulty levels using Google's Gemini API
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

type DifficultyLevel = "beginner" | "intermediate" | "advanced";

interface GeneratedContent {
  title: string;
  topic: string;
  difficulty: DifficultyLevel;
  content: string;
  keyPoints: string[];
  prerequisites: string[];
  estimatedReadTime: number;
  conceptCount: number;
}

const DIFFICULTY_PROMPTS = {
  beginner: `
Create comprehensive yet accessible learning material for complete beginners. 
- Use simple, everyday language and analogies
- Explain all terminology clearly
- Include real-world examples that anyone can relate to
- Break concepts into small, digestible chunks
- Avoid jargon unless absolutely necessary (then explain it)
- Focus on building confidence and foundational understanding
- Include 3-5 key takeaways at the end
- Estimated reading time: 5-10 minutes
`,
  intermediate: `
Create detailed learning material for someone with some background knowledge.
- Assume basic understanding of the field
- Use technical terminology appropriately
- Include connections to related concepts
- Provide practical applications and use cases
- Include both theory and practical examples
- Explore nuances and edge cases
- Include 5-8 key insights
- Estimated reading time: 10-15 minutes
`,
  advanced: `
Create in-depth, rigorous learning material for advanced learners.
- Assume strong foundational knowledge
- Explore cutting-edge research and developments
- Include mathematical formulations where relevant
- Discuss limitations, edge cases, and open questions
- Connect to broader theoretical frameworks
- Include citations to seminal works
- Explore controversial or debated aspects
- Include 8-12 advanced insights
- Estimated reading time: 15-25 minutes
`,
};

export class GeminiContentGenerator {
  private client: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({ model: "gemini-pro" });
  }

  /**
   * Generate comprehensive learning material on a topic
   */
  async generateContent(
    topic: string,
    difficulty: DifficultyLevel = "intermediate",
    customPrompt?: string
  ): Promise<GeneratedContent> {
    try {
      const systemPrompt = `You are an expert educational content creator. Your task is to generate high-quality, comprehensive learning material that is engaging, accurate, and well-structured.

${DIFFICULTY_PROMPTS[difficulty]}

Topic: ${topic}
${customPrompt ? `Additional requirements: ${customPrompt}` : ""}

Please structure your response as follows:
1. Start with a compelling introduction that hooks the reader
2. Provide clear, well-organized content sections
3. Use headers and bullet points for clarity
4. Include practical examples and real-world applications
5. End with a summary of key points

Format the response with clear section headers using markdown (##).`;

      const response = await this.model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: systemPrompt,
              },
            ],
          },
        ],
      });

      const generatedText = response.response.text();

      // Parse the generated content
      const keyPoints = this.extractKeyPoints(generatedText);
      const prerequisites = this.extractPrerequisites(difficulty, topic);
      const conceptCount = this.estimateConceptCount(generatedText);
      const estimatedReadTime = this.estimateReadTime(generatedText, difficulty);

      return {
        title: this.generateTitle(topic, difficulty),
        topic,
        difficulty,
        content: generatedText,
        keyPoints,
        prerequisites,
        estimatedReadTime,
        conceptCount,
      };
    } catch (error) {
      console.error("Gemini content generation error:", error);
      throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Extract key points from generated content
   */
  private extractKeyPoints(content: string): string[] {
    const lines = content.split("\n");
    const keyPoints: string[] = [];

    for (const line of lines) {
      if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
        const point = line.trim().substring(2).trim();
        if (point.length > 10 && point.length < 200) {
          keyPoints.push(point);
        }
      }
    }

    // Return top 8 key points
    return keyPoints.slice(0, 8);
  }

  /**
   * Extract or infer prerequisites based on difficulty and topic
   */
  private extractPrerequisites(difficulty: DifficultyLevel, topic: string): string[] {
    const prerequisites: Record<DifficultyLevel, string[]> = {
      beginner: [
        "Basic curiosity about the topic",
        "Willingness to learn",
        "No prior knowledge required",
      ],
      intermediate: [
        `Basic understanding of ${topic}`,
        "Familiarity with core concepts",
        "Some practical experience",
      ],
      advanced: [
        `Strong foundation in ${topic}`,
        "Understanding of related fields",
        "Ability to engage with complex ideas",
        "Mathematical literacy (if applicable)",
      ],
    };

    return prerequisites[difficulty];
  }

  /**
   * Estimate the number of concepts covered
   */
  private estimateConceptCount(content: string): number {
    // Count headers as proxies for major concepts
    const headers = content.match(/^##\s+/gm) || [];
    const subHeaders = content.match(/^###\s+/gm) || [];

    return Math.max(headers.length + Math.floor(subHeaders.length / 2), 5);
  }

  /**
   * Estimate reading time based on word count and difficulty
   */
  private estimateReadTime(content: string, difficulty: DifficultyLevel): number {
    const wordCount = content.split(/\s+/).length;
    const wordsPerMinute = difficulty === "advanced" ? 150 : difficulty === "intermediate" ? 200 : 250;

    return Math.max(Math.ceil(wordCount / wordsPerMinute), 5);
  }

  /**
   * Generate a descriptive title
   */
  private generateTitle(topic: string, difficulty: DifficultyLevel): string {
    const prefixes = {
      beginner: "Introduction to",
      intermediate: "Understanding",
      advanced: "Mastering",
    };

    return `${prefixes[difficulty]} ${topic}`;
  }

  /**
   * Generate multiple content variations (for A/B testing)
   */
  async generateContentVariations(
    topic: string,
    difficulty: DifficultyLevel = "intermediate",
    count: number = 3
  ): Promise<GeneratedContent[]> {
    const variations: GeneratedContent[] = [];

    for (let i = 0; i < count; i++) {
      const customPrompt =
        i === 0
          ? "Focus on historical context and evolution"
          : i === 1
            ? "Focus on practical applications and use cases"
            : "Focus on theoretical foundations and research";

      const content = await this.generateContent(topic, difficulty, customPrompt);
      variations.push(content);
    }

    return variations;
  }

  /**
   * Generate content with streaming for real-time updates
   */
  async generateContentStream(
    topic: string,
    difficulty: DifficultyLevel = "intermediate",
    onChunk?: (chunk: string) => void
  ): Promise<GeneratedContent> {
    try {
      const systemPrompt = `You are an expert educational content creator. Generate comprehensive learning material on: ${topic}

${DIFFICULTY_PROMPTS[difficulty]}

Structure with clear headers and bullet points.`;

      const stream = await this.model.generateContentStream({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: systemPrompt,
              },
            ],
          },
        ],
      });

      let fullContent = "";

      for await (const chunk of stream.stream) {
        const text = chunk.text();
        fullContent += text;
        onChunk?.(text);
      }

      const keyPoints = this.extractKeyPoints(fullContent);
      const prerequisites = this.extractPrerequisites(difficulty, topic);
      const conceptCount = this.estimateConceptCount(fullContent);
      const estimatedReadTime = this.estimateReadTime(fullContent, difficulty);

      return {
        title: this.generateTitle(topic, difficulty),
        topic,
        difficulty,
        content: fullContent,
        keyPoints,
        prerequisites,
        estimatedReadTime,
        conceptCount,
      };
    } catch (error) {
      console.error("Gemini streaming error:", error);
      throw new Error(`Failed to stream content: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

/**
 * Factory function to create Gemini generator with API key from environment
 */
export function createGeminiGenerator(): GeminiContentGenerator {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  return new GeminiContentGenerator(apiKey);
}
