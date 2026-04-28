/**
 * Content Processor Service
 * Generic processor for ANY dense text content
 * Supports: Gemini-generated, PDFs, URLs, pasted text, arXiv papers
 */

import axios from "axios";
import { orchestrateLLM } from "../ai-orchestrator";
export interface ContentInput {
  type: "pasted_text" | "url" | "pdf" | "gemini_generated";
  content?: string; // For pasted text
  url?: string; // For URLs
  pdfPath?: string; // For PDFs (local path)
  topic?: string; // For Gemini generation
  geminiPrompt?: string; // Custom prompt for Gemini
  title?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
}

export interface ProcessedContent {
  title: string;
  content: string;
  summary: string;
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  sourceMetadata: Record<string, any>;
}

/**
 * Process any content input and extract text
 */
export async function processContentInput(input: ContentInput): Promise<ProcessedContent> {
  let content = "";
  let sourceMetadata: Record<string, any> = {};
  let title = input.title || "Untitled Content";

  // Step 1: Extract content based on type
  if (input.type === "pasted_text") {
    content = input.content || "";
  } else if (input.type === "url") {
    const { content: urlContent, metadata } = await extractContentFromUrl(input.url!);
    content = urlContent;
    sourceMetadata = metadata;
    title = metadata.title || title;
  } else if (input.type === "pdf") {
    const { content: pdfContent, metadata } = await extractContentFromPdf(input.pdfPath!);
    content = pdfContent;
    sourceMetadata = metadata;
    title = metadata.title || title;
  } else if (input.type === "gemini_generated") {
    const { content: geminiContent, metadata } = await generateContentWithGemini(
      input.topic!,
      input.geminiPrompt,
      input.difficulty || "intermediate"
    );
    content = geminiContent;
    sourceMetadata = metadata;
    title = metadata.title || title;
  }

  // Step 2: Generate summary
  const summary = await generateSummary(content);

  // Step 3: Detect topic if not provided
  const topic = input.topic || (await detectTopic(content, title));

  // Step 4: Assess difficulty if not provided
  const difficulty = input.difficulty || (await assessDifficulty(content));

  return {
    title,
    content,
    summary,
    topic,
    difficulty,
    sourceMetadata,
  };
}

/**
 * Extract content from URL
 */
async function extractContentFromUrl(
  url: string
): Promise<{ content: string; metadata: Record<string, any> }> {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    // Extract title from HTML
    const titleMatch = response.data.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : "Web Content";

    // Extract main content (simple extraction - in production use cheerio or similar)
    const contentMatch = response.data.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const htmlContent = contentMatch ? contentMatch[1] : response.data;

    // Strip HTML tags
    const content = htmlContent
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      content: content.substring(0, 50000), // Limit to 50k chars
      metadata: {
        title,
        url,
        extractedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("URL extraction error:", error);
    throw new Error("Failed to extract content from URL");
  }
}

/**
 * Extract content from PDF
 */
async function extractContentFromPdf(
  pdfPath: string
): Promise<{ content: string; metadata: Record<string, any> }> {
  try {
    // For MVP, we'll use a simple approach
    // In production, integrate with pdf-parse or similar
    console.log("PDF extraction not yet implemented. Using placeholder.");

    return {
      content: "PDF content placeholder - implement with pdf-parse library",
      metadata: {
        pdfPath,
        extractedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to extract content from PDF");
  }
}

/**
 * Generate dense learning content using Gemini
 */
async function generateContentWithGemini(
  topic: string,
  customPrompt?: string,
  difficulty: "beginner" | "intermediate" | "advanced" = "intermediate"
): Promise<{ content: string; metadata: Record<string, any> }> {
  try {
    const prompt = customPrompt || generateDefaultGeminiPrompt(topic, difficulty);

    const message = await orchestrateLLM("content", {      maxTokens: 4000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.choices[0]?.message?.content as string || "";

    return {
      content,
      metadata: {
        topic,
        difficulty,
        generatedAt: new Date().toISOString(),      },
    };
  } catch (error) {
    console.error("Gemini content generation error:", error);
    throw new Error("Failed to generate content with Gemini");
  }
}

/**
 * Generate default Gemini prompt for content creation
 */
function generateDefaultGeminiPrompt(
  topic: string,
  difficulty: "beginner" | "intermediate" | "advanced"
): string {
  const difficultyGuide = {
    beginner: "suitable for someone with no prior knowledge",
    intermediate: "suitable for someone with basic knowledge",
    advanced: "suitable for someone with strong foundational knowledge",
  };

  return `Create comprehensive, dense learning material about "${topic}" that is ${difficultyGuide[difficulty]}.

The material should:
1. Start with foundational concepts and build to complex ideas
2. Include real-world examples and applications
3. Explain the "why" behind concepts, not just the "what"
4. Use clear, accessible language while maintaining depth
5. Include key equations, formulas, or frameworks where relevant
6. Highlight common misconceptions
7. Suggest prerequisites for understanding
8. Connect concepts to broader contexts

Format the response as a comprehensive essay/guide (2000-3000 words) that could be used as a learning resource.`;
}

/**
 * Generate summary of content
 */
async function generateSummary(content: string): Promise<string> {
  try {
    const message = await orchestrateLLM("content", {      maxTokens: 500,
      messages: [
        {
          role: "user",
          content: `Summarize this content in 2-3 sentences, capturing the main topic and key takeaways:\n\n${content.substring(0, 5000)}`,
        },
      ],
    });

    return message.choices[0]?.message?.content as string || "";
  } catch (error) {
    console.error("Summary generation error:", error);
    return "Unable to generate summary";
  }
}

/**
 * Detect topic from content
 */
async function detectTopic(content: string, title: string): Promise<string> {
  try {
    const message = await orchestrateLLM("content", {      maxTokens: 100,
      messages: [
        {
          role: "user",
          content: `What is the main topic of this content? Respond with just the topic name (1-3 words).\n\nTitle: ${title}\n\nContent: ${content.substring(0, 2000)}`,
        },
      ],
    });

    const text = (message.choices[0]?.message?.content as string || "General").trim();
    return text;
  } catch (error) {
    console.error("Topic detection error:", error);
    return "General";
  }
}

/**
 * Assess content difficulty level
 */
async function assessDifficulty(
  content: string
): Promise<"beginner" | "intermediate" | "advanced"> {
  try {
    const message = await orchestrateLLM("content", {      maxTokens: 50,
      messages: [
        {
          role: "user",
          content: `Assess the difficulty level of this content. Respond with ONLY one word: beginner, intermediate, or advanced.\n\n${content.substring(0, 3000)}`,
        },
      ],
    });

    const response = ((message.choices[0]?.message?.content as string) || "intermediate").toLowerCase().trim();

    if (response.includes("beginner")) return "beginner";
    if (response.includes("advanced")) return "advanced";
    return "intermediate";
  } catch (error) {
    console.error("Difficulty assessment error:", error);
    return "intermediate";
  }
}

/**
 * Validate content quality
 */
export async function validateContent(content: string): Promise<{
  isValid: boolean;
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check length
  if (content.length < 500) {
    issues.push("Content is too short (minimum 500 characters)");
  }

  if (content.length > 100000) {
    issues.push("Content is too long (maximum 100,000 characters)");
  }

  // Check for meaningful content
  const wordCount = content.split(/\s+/).length;
  if (wordCount < 100) {
    issues.push("Content has too few words (minimum 100)");
  }

  // Check for structure
  const paragraphs = content.split(/\n\n+/).length;
  if (paragraphs < 3) {
    recommendations.push("Consider breaking content into more paragraphs for better readability");
  }

  return {
    isValid: issues.length === 0,
    issues,
    recommendations,
  };
}
