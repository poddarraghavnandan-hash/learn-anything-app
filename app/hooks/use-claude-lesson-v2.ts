import { useState, useEffect, useRef } from "react";
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
  lessonId?: string;
}

// Content cache to prevent regenerating same content
const contentCache = new Map<string, LessonContentData>();

/**
 * Enhanced hook to fetch Claude-generated lesson content with better fallbacks
 * - Diverse question templates to prevent repetition
 * - Content caching to avoid regenerating same lessons
 * - Better error handling and timeout management
 */
export function useClaudeLessonContentV2(options: UseClaudioLessonOptions) {
  const [content, setContent] = useState<LessonContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const cacheKeyRef = useRef(`${options.topic}:${options.lessonTitle}:${options.lessonId || "0"}`);

  // Map learning style to valid values
  const mapLearningStyle = (style?: string): "visual" | "kinesthetic" | "auditory" | "reading" => {
    if (style === "visual" || style === "kinesthetic" || style === "auditory" || style === "reading") {
      return style;
    }
    return "visual";
  };

  // tRPC query for Claude content generation
  const claudeQuery = trpc.claudeContent.generateLessonContent.useQuery({
    learnerId: "user-123",
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
    const cacheKey = cacheKeyRef.current;

    // Check cache first
    if (contentCache.has(cacheKey)) {
      setContent(contentCache.get(cacheKey)!);
      setLoading(false);
      return;
    }

    // Handle server error (success:false)
    if (claudeQuery.data?.success === false) {
      console.warn("Claude content generation failed on server:", claudeQuery.data.error);
      setError(claudeQuery.data.error || "Failed to generate lesson content");
      const fallback = generateDiverseFallbackContent(options);
      contentCache.set(cacheKey, fallback);
      setContent(fallback);
      setLoading(false);
      return;
    }

    // Handle successful response
    if (claudeQuery.data?.success && claudeQuery.data.content) {
      const firstQuestion = claudeQuery.data.content.assessmentQuestions?.[0];
      const quiz = firstQuestion
        ? {
            question: firstQuestion.question,
            options: firstQuestion.options,
            correctAnswer: firstQuestion.options.indexOf(firstQuestion.correctAnswer),
            explanation: firstQuestion.explanation,
          }
        : generateDiverseQuiz(options);

      const result: LessonContentData = {
        title: options.lessonTitle,
        introduction: claudeQuery.data.content.introduction || generateDiverseIntro(options),
        mainContent: claudeQuery.data.content.mainContent || generateDiverseMainContent(options),
        keyPoints: claudeQuery.data.content.keyTakeaways || generateDiverseKeyPoints(options),
        examples: claudeQuery.data.content.examples || generateDiverseExamples(options),
        checkYourUnderstanding: quiz,
        nextSteps: claudeQuery.data.content.nextTopicSuggestions?.[0] || generateDiverseNextSteps(options),
      };

      contentCache.set(cacheKey, result);
      setContent(result);
      setError(null);
      setLoading(false);
    } else if (claudeQuery.isError) {
      console.error("Failed to fetch Claude content:", claudeQuery.error);
      setError("Failed to load content from Claude");
      const fallback = generateDiverseFallbackContent(options);
      contentCache.set(cacheKey, fallback);
      setContent(fallback);
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
      const fallback = generateDiverseFallbackContent(options);
      contentCache.set(cacheKeyRef.current, fallback);
      setContent(fallback);
      setLoading(false);
    }, 20000);

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
 * Diverse content generators to prevent repetition
 */

// Multiple intro templates
const introTemplates = [
  (opts: UseClaudioLessonOptions) =>
    `Welcome to "${opts.lessonTitle}"! This lesson uses a ${opts.approach} approach to help you master this concept step by step.`,
  (opts: UseClaudioLessonOptions) =>
    `Let's dive into "${opts.lessonTitle}" as part of your ${opts.topic} learning journey. Get ready to discover practical insights.`,
  (opts: UseClaudioLessonOptions) =>
    `In this lesson, you'll explore "${opts.lessonTitle}" through real-world examples and hands-on practice.`,
  (opts: UseClaudioLessonOptions) =>
    `Ready to level up? This lesson on "${opts.lessonTitle}" will deepen your understanding of ${opts.topic}.`,
  (opts: UseClaudioLessonOptions) =>
    `"${opts.lessonTitle}" is a key concept in ${opts.topic}. Let's break it down together using a ${opts.approach} approach.`,
];

function generateDiverseIntro(options: UseClaudioLessonOptions): string {
  const hash = hashString(options.lessonTitle);
  const template = introTemplates[hash % introTemplates.length];
  return template(options);
}

// Multiple main content templates
const mainContentTemplates = [
  (opts: UseClaudioLessonOptions) =>
    `${opts.lessonTitle} is a fundamental concept that helps you understand ${opts.topic} more deeply. We'll explore its core principles, see how it applies in practice, and learn why it matters in real-world scenarios.`,
  (opts: UseClaudioLessonOptions) =>
    `At its core, ${opts.lessonTitle} involves understanding how different elements interact and influence each other. This lesson breaks down the key mechanisms and shows you how to apply them effectively.`,
  (opts: UseClaudioLessonOptions) =>
    `${opts.lessonTitle} connects multiple ideas within ${opts.topic}. By mastering this concept, you'll be able to solve complex problems and make better decisions in your field.`,
  (opts: UseClaudioLessonOptions) =>
    `This lesson focuses on the practical aspects of ${opts.lessonTitle}. You'll learn the "why" behind the concept, common pitfalls to avoid, and strategies for success.`,
  (opts: UseClaudioLessonOptions) =>
    `${opts.lessonTitle} is often misunderstood, but once you grasp the fundamentals, everything clicks into place. We'll use analogies, examples, and interactive elements to make it crystal clear.`,
];

function generateDiverseMainContent(options: UseClaudioLessonOptions): string {
  const hash = hashString(options.lessonTitle + options.approach);
  const template = mainContentTemplates[hash % mainContentTemplates.length];
  return template(options);
}

// Multiple key points templates
const keyPointsTemplates = [
  (opts: UseClaudioLessonOptions) => [
    `Core principle: Understanding ${opts.lessonTitle}`,
    `How it connects to broader ${opts.topic} concepts`,
    `Common misconceptions to avoid`,
    `Practical applications in real-world scenarios`,
    `How to build on this knowledge`,
  ],
  (opts: UseClaudioLessonOptions) => [
    `The foundation: What ${opts.lessonTitle} really means`,
    `Why it matters in ${opts.topic}`,
    `Real-world examples and case studies`,
    `How professionals use this concept`,
    `Next steps for deeper learning`,
  ],
  (opts: UseClaudioLessonOptions) => [
    `Key insight #1: The essence of ${opts.lessonTitle}`,
    `Key insight #2: How it works in practice`,
    `Key insight #3: Common mistakes to avoid`,
    `Key insight #4: Advanced applications`,
    `Key insight #5: Your action plan`,
  ],
];

function generateDiverseKeyPoints(options: UseClaudioLessonOptions): string[] {
  const hash = hashString(options.lessonTitle + options.difficulty);
  const template = keyPointsTemplates[hash % keyPointsTemplates.length];
  return template(options);
}

// Multiple examples templates
const examplesTemplates = [
  (opts: UseClaudioLessonOptions) => [
    `Real-world example: How ${opts.lessonTitle} applies in industry`,
    `Case study: A success story using these principles`,
    `Everyday example: Where you've seen this concept in action`,
  ],
  (opts: UseClaudioLessonOptions) => [
    `Example 1: ${opts.lessonTitle} in a startup environment`,
    `Example 2: How large organizations leverage this concept`,
    `Example 3: Personal applications you can use today`,
  ],
  (opts: UseClaudioLessonOptions) => [
    `Scenario A: Applying ${opts.lessonTitle} to solve a problem`,
    `Scenario B: How this concept prevents common pitfalls`,
    `Scenario C: Advanced use case in professional settings`,
  ],
];

function generateDiverseExamples(options: UseClaudioLessonOptions): string[] {
  const hash = hashString(options.lessonTitle + options.approach);
  const template = examplesTemplates[hash % examplesTemplates.length];
  return template(options);
}

// Multiple quiz templates
const quizTemplates = [
  (opts: UseClaudioLessonOptions) => ({
    question: `What is the primary purpose of ${opts.lessonTitle} in ${opts.topic}?`,
    options: [
      "To simplify complex processes",
      "To improve efficiency and outcomes",
      "To provide a framework for understanding",
      "All of the above",
    ],
    correctAnswer: 3,
    explanation: `Correct! ${opts.lessonTitle} serves multiple purposes - it simplifies complexity, improves efficiency, and provides a mental framework for understanding ${opts.topic}.`,
  }),
  (opts: UseClaudioLessonOptions) => ({
    question: `When would you apply ${opts.lessonTitle} in practice?`,
    options: [
      "Only in theoretical scenarios",
      "When you need to solve complex problems",
      "During planning and decision-making phases",
      "Both B and C",
    ],
    correctAnswer: 3,
    explanation: `Great! ${opts.lessonTitle} is most useful when solving complex problems and during strategic planning. It's a practical tool, not just theory.`,
  }),
  (opts: UseClaudioLessonOptions) => ({
    question: `Which of these is a key benefit of understanding ${opts.lessonTitle}?`,
    options: [
      "Better decision-making",
      "Improved problem-solving",
      "Deeper understanding of ${opts.topic}",
      "All of the above",
    ],
    correctAnswer: 3,
    explanation: `Excellent! Understanding ${opts.lessonTitle} enhances all three - your decisions become more informed, you solve problems more effectively, and you gain deeper insights into ${opts.topic}.`,
  }),
  (opts: UseClaudioLessonOptions) => ({
    question: `How does ${opts.lessonTitle} relate to what you've learned before?`,
    options: [
      "It builds on foundational concepts",
      "It's a completely separate topic",
      "It challenges previous understanding",
      "It's an advanced application of basics",
    ],
    correctAnswer: 0,
    explanation: `Right! ${opts.lessonTitle} builds on the foundational concepts you've already learned, creating a stronger knowledge structure.`,
  }),
];

function generateDiverseQuiz(options: UseClaudioLessonOptions): LessonContentData["checkYourUnderstanding"] {
  const hash = hashString(options.lessonTitle + options.lessonId);
  const template = quizTemplates[hash % quizTemplates.length];
  return template(options);
}

// Multiple next steps templates
const nextStepsTemplates = [
  (opts: UseClaudioLessonOptions) =>
    `Excellent work! You've mastered ${opts.lessonTitle}. Next, you'll learn how to apply these concepts to real-world challenges in ${opts.topic}.`,
  (opts: UseClaudioLessonOptions) =>
    `Great job! Now that you understand ${opts.lessonTitle}, you're ready to explore more advanced applications and connect it to other concepts in ${opts.topic}.`,
  (opts: UseClaudioLessonOptions) =>
    `Perfect! You've built a solid foundation with ${opts.lessonTitle}. The next lesson will show you how professionals use this knowledge in practice.`,
  (opts: UseClaudioLessonOptions) =>
    `Fantastic! You've successfully learned ${opts.lessonTitle}. Ready to take on a challenge that combines this with previous lessons?`,
];

function generateDiverseNextSteps(options: UseClaudioLessonOptions): string {
  const hash = hashString(options.lessonTitle + options.topic);
  const template = nextStepsTemplates[hash % nextStepsTemplates.length];
  return template(options);
}

function generateDiverseFallbackContent(options: UseClaudioLessonOptions): LessonContentData {
  return {
    title: options.lessonTitle,
    introduction: generateDiverseIntro(options),
    mainContent: generateDiverseMainContent(options),
    keyPoints: generateDiverseKeyPoints(options),
    examples: generateDiverseExamples(options),
    checkYourUnderstanding: generateDiverseQuiz(options),
    nextSteps: generateDiverseNextSteps(options),
  };
}

/**
 * Simple hash function for consistent but varied selection
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
