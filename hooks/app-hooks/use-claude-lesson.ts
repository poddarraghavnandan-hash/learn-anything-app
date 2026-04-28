import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

export interface LessonContentData {
  title: string;
  introduction: string;
  mainContent: string;
  keyPoints: string[];
  examples: string[];
  checkYourUnderstanding: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  };
  nextSteps: string;
}

interface UseClaudioLessonOptions {
  topic: string;
  lessonTitle: string;
  approach: string;
  learningStyle?: "visual" | "kinesthetic" | "auditory" | "reading" | "mixed";
  difficulty?: "beginner" | "intermediate" | "advanced";
  engagementScore?: number;
}

/**
 * Hook to fetch Claude-generated lesson content
 * Falls back to placeholder if API fails
 * 
 * BUG FIX: Now handles success:false case (server error without network error)
 * and includes 20s timeout to prevent infinite loading
 */
export function useClaudeLessonContent(options: UseClaudioLessonOptions) {
  const [content, setContent] = useState<LessonContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  // Map learning style to valid values
  const mapLearningStyle = (style?: string): "visual" | "kinesthetic" | "auditory" | "reading" => {
    if (style === "visual" || style === "kinesthetic" || style === "auditory" || style === "reading") {
      return style;
    }
    return "visual"; // Default to visual
  };

  // tRPC query for Claude content generation
  const claudeQuery = trpc.claudeContent.generateLessonContent.useQuery({
    learnerId: "user-123", // In real app, get from auth context
    topic: options.topic,
    learningStyle: mapLearningStyle(options.learningStyle),
    currentDifficulty: options.difficulty || "beginner",
    learningPace: "moderate",
    priorKnowledge: [],
    engagementScore: options.engagementScore || 70,
    motivationLevel: "high",
  });

  // Handle Claude query results
  useEffect(() => {
    // BUG FIX: Handle success:false case (server returned error but no network error)
    if (claudeQuery.data?.success === false) {
      console.warn("Claude content generation failed on server:", claudeQuery.data.error);
      setError(claudeQuery.data.error || "Failed to generate lesson content");
      setContent(generateFallbackContent(options));
      setLoading(false);
      return;
    }

    if (claudeQuery.data?.success && claudeQuery.data.content) {
      // Transform Claude response to LessonContentData format
      const firstQuestion = claudeQuery.data.content.assessmentQuestions?.[0];
      const quiz = firstQuestion
        ? {
            question: firstQuestion.question,
            options: firstQuestion.options,
            correctAnswer: firstQuestion.options.indexOf(firstQuestion.correctAnswer),
            explanation: firstQuestion.explanation,
          }
        : generatePlaceholderQuiz(options);

      setContent({
        title: options.lessonTitle,
        introduction: claudeQuery.data.content.introduction || generatePlaceholderIntro(options),
        mainContent: claudeQuery.data.content.mainContent || generatePlaceholderMainContent(options),
        keyPoints: claudeQuery.data.content.keyTakeaways || generatePlaceholderKeyPoints(options),
        examples: claudeQuery.data.content.examples || generatePlaceholderExamples(options),
        checkYourUnderstanding: quiz,
        nextSteps: claudeQuery.data.content.nextTopicSuggestions?.[0] || generatePlaceholderNextSteps(options),
      });
      setError(null);
      setLoading(false);
    } else if (claudeQuery.isError) {
      console.error("Failed to fetch Claude content:", claudeQuery.error);
      setError("Failed to load content from Claude");
      // Fall back to placeholder
      setContent(generateFallbackContent(options));
      setLoading(false);
    } else if (claudeQuery.isLoading) {
      setLoading(true);
    }
  }, [claudeQuery.data, claudeQuery.isError, claudeQuery.error, claudeQuery.isLoading, options]);

  // TIMEOUT: If loading takes more than 20 seconds, use fallback
  useEffect(() => {
    if (!loading || hasTimedOut) return;

    const timeoutId = setTimeout(() => {
      console.warn("Claude content generation timed out after 20s, using fallback");
      setHasTimedOut(true);
      setError("Content generation took too long, using fallback");
      setContent(generateFallbackContent(options));
      setLoading(false);
    }, 20000); // 20 second timeout

    return () => clearTimeout(timeoutId);
  }, [loading, hasTimedOut, options]);

  return {
    content,
    loading: loading && !hasTimedOut,
    error,
    isUsingFallback: error !== null || hasTimedOut,
  };
}

/**
 * Fallback content generators for when Claude API fails
 */

function generatePlaceholderIntro(options: UseClaudioLessonOptions): string {
  return `Welcome to this lesson on "${options.lessonTitle}" as part of your ${options.topic} learning journey. This lesson uses a ${options.approach} approach to help you understand the concepts deeply.`;
}

function generatePlaceholderMainContent(options: UseClaudioLessonOptions): string {
  return `In this lesson, we'll explore the key concepts of ${options.lessonTitle}. We'll break down complex ideas into digestible pieces, use real-world examples, and help you build a strong foundation. By the end, you'll have a clear understanding of how these concepts work and why they matter.`;
}

function generatePlaceholderKeyPoints(options: UseClaudioLessonOptions): string[] {
  return [
    `Understanding the fundamentals of ${options.lessonTitle}`,
    `How ${options.lessonTitle} connects to ${options.topic}`,
    `Practical applications in real-world scenarios`,
    `Common misconceptions and how to avoid them`,
    `How to apply this knowledge to solve problems`,
  ];
}

function generatePlaceholderExamples(options: UseClaudioLessonOptions): string[] {
  return [
    `Example 1: A real-world scenario showing ${options.lessonTitle} in action`,
    `Example 2: How professionals use these concepts daily`,
    `Example 3: A historical perspective on ${options.lessonTitle}`,
  ];
}

function generatePlaceholderQuiz(options: UseClaudioLessonOptions): LessonContentData["checkYourUnderstanding"] {
  return {
    question: `Based on what you've learned, which of the following best describes ${options.lessonTitle}?`,
    options: [
      "The most fundamental concept in this field",
      "A supporting concept that builds on basics",
      "An advanced topic for specialists",
      "A historical concept no longer relevant",
    ],
    correctAnswer: 1,
    explanation: `That's correct! ${options.lessonTitle} is a supporting concept that builds on the fundamentals. Understanding it requires grasping the basics first, and it forms the foundation for more advanced topics.`,
  };
}

function generatePlaceholderNextSteps(options: UseClaudioLessonOptions): string {
  return `Great job completing this lesson! You've built a strong understanding of ${options.lessonTitle}. Next, you'll explore how to apply these concepts in practice. Ready to continue your learning journey?`;
}

function generateFallbackContent(options: UseClaudioLessonOptions): LessonContentData {
  return {
    title: options.lessonTitle,
    introduction: generatePlaceholderIntro(options),
    mainContent: generatePlaceholderMainContent(options),
    keyPoints: generatePlaceholderKeyPoints(options),
    examples: generatePlaceholderExamples(options),
    checkYourUnderstanding: generatePlaceholderQuiz(options),
    nextSteps: generatePlaceholderNextSteps(options),
  };
}
