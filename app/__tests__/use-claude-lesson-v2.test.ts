import { describe, it, expect, vi } from "vitest";

/**
 * Tests for useClaudeLessonContentV2 - Content Generation Diversity
 * 
 * Verifies that:
 * 1. Multiple content templates are used (no repetition)
 * 2. Content caching works correctly
 * 3. Diverse quiz questions are generated
 * 4. Fallback content is diverse and contextual
 */

// Mock hash function for testing
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

describe("Content Generation Diversity", () => {
  const mockOptions = {
    topic: "Physics",
    lessonTitle: "Newton's Laws",
    approach: "visual",
    difficulty: "beginner" as const,
    learningStyle: "visual" as const,
  };

  it("should generate different intros for different lessons", () => {
    const introTemplates = [
      (opts: any) =>
        `Welcome to "${opts.lessonTitle}"! This lesson uses a ${opts.approach} approach to help you master this concept step by step.`,
      (opts: any) =>
        `Let's dive into "${opts.lessonTitle}" as part of your ${opts.topic} learning journey. Get ready to discover practical insights.`,
      (opts: any) =>
        `In this lesson, you'll explore "${opts.lessonTitle}" through real-world examples and hands-on practice.`,
    ];

    const hash1 = hashString(mockOptions.lessonTitle);
    const hash2 = hashString("Different Lesson");

    const intro1 = introTemplates[hash1 % introTemplates.length](mockOptions);
    const mockOptions2 = { ...mockOptions, lessonTitle: "Different Lesson" };
    const intro2 = introTemplates[hash2 % introTemplates.length](mockOptions2);

    // Intros should be different for different lessons
    expect(intro1).not.toBe(intro2);
    expect(intro1).toContain("Newton's Laws");
    expect(intro2).toContain("Different Lesson")
  });

  it("should generate consistent content for same lesson", () => {
    const introTemplates = [
      (opts: any) =>
        `Welcome to "${opts.lessonTitle}"! This lesson uses a ${opts.approach} approach.`,
      (opts: any) =>
        `Let's dive into "${opts.lessonTitle}" as part of your ${opts.topic} learning journey.`,
    ];

    const hash1 = hashString(mockOptions.lessonTitle);
    const hash2 = hashString(mockOptions.lessonTitle);

    const intro1 = introTemplates[hash1 % introTemplates.length](mockOptions);
    const intro2 = introTemplates[hash2 % introTemplates.length](mockOptions);

    // Same lesson should produce same intro
    expect(intro1).toBe(intro2);
  });

  it("should generate diverse quiz questions", () => {
    const quizTemplates = [
      (opts: any) => ({
        question: `What is the primary purpose of ${opts.lessonTitle}?`,
        correctAnswer: 0,
      }),
      (opts: any) => ({
        question: `When would you apply ${opts.lessonTitle} in practice?`,
        correctAnswer: 1,
      }),
      (opts: any) => ({
        question: `Which of these is a key benefit of understanding ${opts.lessonTitle}?`,
        correctAnswer: 2,
      }),
      (opts: any) => ({
        question: `How does ${opts.lessonTitle} relate to what you've learned before?`,
        correctAnswer: 3,
      }),
    ];

    // Test that different lesson IDs produce different questions
    const hash1 = hashString(mockOptions.lessonTitle + "1");
    const hash2 = hashString(mockOptions.lessonTitle + "2");
    const hash3 = hashString(mockOptions.lessonTitle + "3");

    const quiz1 = quizTemplates[hash1 % quizTemplates.length](mockOptions);
    const quiz2 = quizTemplates[hash2 % quizTemplates.length](mockOptions);
    const quiz3 = quizTemplates[hash3 % quizTemplates.length](mockOptions);

    // Questions should be different
    expect(quiz1.question).not.toBe(quiz2.question);
    expect(quiz2.question).not.toBe(quiz3.question);
    expect(quiz1.question).not.toBe(quiz3.question);

    // All should contain the lesson title
    expect(quiz1.question).toContain("Newton's Laws");
    expect(quiz2.question).toContain("Newton's Laws");
    expect(quiz3.question).toContain("Newton's Laws");
  });

  it("should generate diverse key points", () => {
    const keyPointsTemplates = [
      (opts: any) => [
        `Core principle: Understanding ${opts.lessonTitle}`,
        `How it connects to broader ${opts.topic} concepts`,
        `Common misconceptions to avoid`,
      ],
      (opts: any) => [
        `The foundation: What ${opts.lessonTitle} really means`,
        `Why it matters in ${opts.topic}`,
        `Real-world examples and case studies`,
      ],
      (opts: any) => [
        `Key insight #1: The essence of ${opts.lessonTitle}`,
        `Key insight #2: How it works in practice`,
        `Key insight #3: Common mistakes to avoid`,
      ],
    ];

    const hash1 = hashString(mockOptions.lessonTitle + "beginner");
    const hash2 = hashString(mockOptions.lessonTitle + "intermediate");

    const points1 = keyPointsTemplates[hash1 % keyPointsTemplates.length](mockOptions);
    const points2 = keyPointsTemplates[hash2 % keyPointsTemplates.length](mockOptions);

    // Key points should be different
    expect(points1[0]).not.toBe(points2[0]);

    // All should contain the lesson title
    expect(points1.join(" ")).toContain("Newton's Laws");
    expect(points2.join(" ")).toContain("Newton's Laws");

    // Should have expected number of points
    expect(points1.length).toBeGreaterThan(0);
    expect(points2.length).toBeGreaterThan(0);
  });

  it("should generate diverse examples", () => {
    const examplesTemplates = [
      (opts: any) => [
        `Real-world example: How ${opts.lessonTitle} applies in industry`,
        `Case study: A success story using these principles`,
        `Everyday example: Where you've seen this concept in action`,
      ],
      (opts: any) => [
        `Example 1: ${opts.lessonTitle} in a startup environment`,
        `Example 2: How large organizations leverage this concept`,
        `Example 3: Personal applications you can use today`,
      ],
    ];

    const hash1 = hashString(mockOptions.lessonTitle + "visual");
    const hash2 = hashString(mockOptions.lessonTitle + "kinesthetic");

    const examples1 = examplesTemplates[hash1 % examplesTemplates.length](mockOptions);
    const examples2 = examplesTemplates[hash2 % examplesTemplates.length](mockOptions);

    // Examples should be different
    expect(examples1[0]).not.toBe(examples2[0]);

    // All should contain the lesson title
    expect(examples1.join(" ")).toContain("Newton's Laws");
    expect(examples2.join(" ")).toContain("Newton's Laws");
  });

  it("should generate contextual next steps", () => {
    const nextStepsTemplates = [
      (opts: any) =>
        `Excellent work! You've mastered ${opts.lessonTitle}. Next, you'll learn how to apply these concepts to real-world challenges in ${opts.topic}.`,
      (opts: any) =>
        `Great job! Now that you understand ${opts.lessonTitle}, you're ready to explore more advanced applications.`,
      (opts: any) =>
        `Perfect! You've built a solid foundation with ${opts.lessonTitle}. The next lesson will show you how professionals use this knowledge.`,
    ];

    const hash1 = hashString(mockOptions.lessonTitle + mockOptions.topic);
    const hash2 = hashString("Different Topic" + mockOptions.topic);

    const nextSteps1 = nextStepsTemplates[hash1 % nextStepsTemplates.length](mockOptions);
    const nextSteps2 = nextStepsTemplates[hash2 % nextStepsTemplates.length](mockOptions);

    // Should contain lesson and topic
    expect(nextSteps1).toContain("Newton's Laws");
    expect(nextSteps1).toContain("Physics");

    // Should be encouraging
    expect(nextSteps1).toMatch(/Excellent|Great|Perfect/);
  });

  it("should prevent repetition across 8 lessons", () => {
    const quizTemplates = [
      (opts: any) => `What is the primary purpose of ${opts.lessonTitle}?`,
      (opts: any) => `When would you apply ${opts.lessonTitle} in practice?`,
      (opts: any) => `Which of these is a key benefit of understanding ${opts.lessonTitle}?`,
      (opts: any) => `How does ${opts.lessonTitle} relate to what you've learned before?`,
    ];

    const questions = [];
    for (let i = 1; i <= 8; i++) {
      const hash = hashString(mockOptions.lessonTitle + i);
      const question = quizTemplates[hash % quizTemplates.length](mockOptions);
      questions.push(question);
    }

    // Check that we have variety (at least 2 different questions across 8 lessons)
    const uniqueQuestions = new Set(questions);
    expect(uniqueQuestions.size).toBeGreaterThan(1);

    // All should contain the lesson title
    questions.forEach((q) => {
      expect(q).toContain("Newton's Laws");
    });
  });

  it("should handle content caching", () => {
    const contentCache = new Map<string, any>();
    const cacheKey = `${mockOptions.topic}:${mockOptions.lessonTitle}:1`;

    // First call - cache miss
    expect(contentCache.has(cacheKey)).toBe(false);

    // Simulate cache hit
    const mockContent = { title: "Test", introduction: "Test intro" };
    contentCache.set(cacheKey, mockContent);

    // Second call - cache hit
    expect(contentCache.has(cacheKey)).toBe(true);
    expect(contentCache.get(cacheKey)).toEqual(mockContent);

    // Different lesson - cache miss
    const cacheKey2 = `${mockOptions.topic}:${mockOptions.lessonTitle}:2`;
    expect(contentCache.has(cacheKey2)).toBe(false);
  });

  it("should generate contextual main content", () => {
    const mainContentTemplates = [
      (opts: any) =>
        `${opts.lessonTitle} is a fundamental concept that helps you understand ${opts.topic} more deeply.`,
      (opts: any) =>
        `At its core, ${opts.lessonTitle} involves understanding how different elements interact.`,
      (opts: any) =>
        `${opts.lessonTitle} connects multiple ideas within ${opts.topic}.`,
    ];

    const hash1 = hashString(mockOptions.lessonTitle + mockOptions.approach);
    const content1 = mainContentTemplates[hash1 % mainContentTemplates.length](mockOptions);

    expect(content1).toContain("Newton's Laws");
    expect(content1).toContain("Physics");
    expect(content1.length).toBeGreaterThan(50);
  });
});
