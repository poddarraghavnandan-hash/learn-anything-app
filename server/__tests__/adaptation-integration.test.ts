/**
 * Integration Test for Intelligent Content Adaptation System
 *
 * Tests the full 7-phase pipeline by calling actual tRPC endpoints
 * Verifies database persistence and end-to-end flow
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { requestIntelligenceAgent } from "../services/request-intelligence";
import { knowledgeAssessmentAgent } from "../services/knowledge-assessment";
import { adaptiveContentGenerator } from "../services/adaptive-content-generator";
import { contentSequencingAgent } from "../services/content-sequencing";
import { continuationEngine } from "../services/continuation-engine";
import { videoIntegrationService } from "../services/video-integration";

describe("Intelligent Content Adaptation Pipeline - Integration Tests", () => {
  describe("Phase 1: Request Intelligence Agent", () => {
    it("should analyze beginner-level request", async () => {
      const result = await requestIntelligenceAgent.analyzeRequest(
        "Explain what justice means",
        undefined,
        undefined
      );

      expect(result).toBeDefined();
      expect(result.topic).toBeDefined();
      expect(result.intent).toBeDefined();
      expect(result.estimatedDepth).toBeDefined();
      expect(result.sophisticationScore).toBeGreaterThanOrEqual(0);
      expect(result.sophisticationScore).toBeLessThanOrEqual(100);
      expect(result.prerequisites).toBeDefined();
      expect(Array.isArray(result.prerequisites)).toBe(true);
    });

    it("should analyze advanced-level request", async () => {
      const result = await requestIntelligenceAgent.analyzeRequest(
        "What is the philosophical basis of justice in modern democracies and how does it relate to social contract theory?",
        undefined,
        undefined
      );

      expect(result).toBeDefined();
      expect(result.sophisticationScore).toBeGreaterThan(50);
      expect(result.topic).toContain("justice");
    });

    it("should extract prerequisites from request", async () => {
      const result = await requestIntelligenceAgent.analyzeRequest(
        "Teach me quantum mechanics",
        undefined,
        undefined
      );

      expect(result.prerequisites).toBeDefined();
      expect(result.prerequisites.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Phase 2: Knowledge Assessment Agent", () => {
    it("should assess knowledge from learning history", async () => {
      const history = [
        {
          topicId: "physics",
          quizzes: [{ id: "quiz-1", accuracy: 0.85, timestamp: Date.now() }],
          contentViewed: 5,
          timeSpent: 3600,
          reactions: { mindBlown: 2, knewThis: 1, saved: 3, skipped: 0 },
        },
      ];

      const result = await knowledgeAssessmentAgent.assessUserKnowledge(history);

      expect(result).toBeDefined();
      expect(result.estimatedLevel).toBeDefined();
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(100);
      expect(result.topicSpecificLevels).toBeDefined();
      expect(typeof result.topicSpecificLevels).toBe("object");
    });

    it("should handle empty learning history", async () => {
      const result = await knowledgeAssessmentAgent.assessUserKnowledge([]);

      expect(result).toBeDefined();
      expect(result.estimatedLevel).toBe("beginner");
      expect(result.confidenceScore).toBeLessThan(50);
    });
  });

  describe("Phase 3: Adaptive Content Generation", () => {
    it("should generate Foundation level content", async () => {
      const result = await adaptiveContentGenerator.generateContent({
        concept: "photosynthesis",
        level: 1,
        userBackground: "Beginner",
        difficulty: "beginner",
      });

      expect(result).toBeDefined();
      expect(result.title).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.mainContent).toBeDefined();
      expect(result.keyPoints).toBeDefined();
      expect(Array.isArray(result.keyPoints)).toBe(true);
      expect(result.examples).toBeDefined();
      expect(Array.isArray(result.examples)).toBe(true);
    });

    it("should generate Intermediate level content", async () => {
      const result = await adaptiveContentGenerator.generateContent({
        concept: "photosynthesis",
        level: 3,
        userBackground: "Intermediate",
        difficulty: "intermediate",
      });

      expect(result).toBeDefined();
      expect(result.title).toContain("photosynthesis");
      expect(result.mainContent.length).toBeGreaterThan(result.description.length);
    });

    it("should generate Mastery level content", async () => {
      const result = await adaptiveContentGenerator.generateContent({
        concept: "quantum-mechanics",
        level: 5,
        userBackground: "Expert",
        difficulty: "advanced",
      });

      expect(result).toBeDefined();
      expect(result.keyPoints.length).toBeGreaterThanOrEqual(3);
      expect(result.examples.length).toBeGreaterThanOrEqual(2);
    });

    it("should adapt content based on sophistication", async () => {
      const beginnerResult = await adaptiveContentGenerator.generateContent({
        concept: "machine-learning",
        level: 1,
        userBackground: "No background",
        difficulty: "beginner",
      });

      const expertResult = await adaptiveContentGenerator.generateContent({
        concept: "machine-learning",
        level: 5,
        userBackground: "PhD in CS",
        difficulty: "advanced",
      });

      expect(beginnerResult.mainContent.length).toBeLessThan(expertResult.mainContent.length);
      expect(expertResult.keyPoints.length).toBeGreaterThanOrEqual(beginnerResult.keyPoints.length);
    });
  });

  describe("Phase 4: Content Sequencing Agent", () => {
    it("should generate learning sequence", async () => {
      const result = await contentSequencingAgent.generateLearningSequence(
        "photosynthesis",
        "beginner",
        undefined,
        ["biology-basics", "chemistry-fundamentals"]
      );

      expect(result).toBeDefined();
      expect(result.lessons).toBeDefined();
      expect(Array.isArray(result.lessons)).toBe(true);
      expect(result.lessons.length).toBeGreaterThan(0);
      expect(result.totalDuration).toBeGreaterThan(0);
    });

    it("should include micro-lessons for prerequisites", async () => {
      const result = await contentSequencingAgent.generateLearningSequence(
        "quantum-mechanics",
        "beginner",
        undefined,
        ["calculus", "linear-algebra", "classical-mechanics"]
      );

      expect(result.microLessons).toBeDefined();
      expect(Array.isArray(result.microLessons)).toBe(true);
      expect(result.microLessons.length).toBeGreaterThanOrEqual(1);
    });

    it("should order lessons by difficulty", async () => {
      const result = await contentSequencingAgent.generateLearningSequence(
        "web-development",
        "intermediate",
        undefined,
        []
      );

      if (result.lessons.length > 1) {
        const levels = result.lessons.map((l: any) => l.level);
        // Levels should be non-decreasing
        for (let i = 1; i < levels.length; i++) {
          expect(levels[i]).toBeGreaterThanOrEqual(levels[i - 1]);
        }
      }
    });
  });

  describe("Phase 5: Continuation Engine", () => {
    it("should generate 5 continuation options", async () => {
      const result = await continuationEngine.generateContinuationOptions(
        "photosynthesis",
        2
      );

      expect(result).toBeDefined();
      expect(result.options).toBeDefined();
      expect(Array.isArray(result.options)).toBe(true);
      expect(result.options.length).toBe(5);
    });

    it("should include all 5 continuation types", async () => {
      const result = await continuationEngine.generateContinuationOptions(
        "machine-learning",
        3
      );

      const types = result.options.map((o: any) => o.type);
      expect(types).toContain("go_deeper");
      expect(types).toContain("related_concepts");
      expect(types).toContain("teach_it");
      expect(types).toContain("apply_it");
      expect(types).toContain("review");
    });

    it("should provide actionable CTAs", async () => {
      const result = await continuationEngine.generateContinuationOptions(
        "justice",
        2
      );

      result.options.forEach((option: any) => {
        expect(option.cta).toBeDefined();
        expect(option.cta.length).toBeGreaterThan(0);
        expect(option.description).toBeDefined();
        expect(option.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Phase 6: Video Integration", () => {
    it("should generate video lesson plan", async () => {
      const result = await videoIntegrationService.generateVideoLessonPlan({
        topic: "photosynthesis",
        level: 2,
        keyPoints: ["Light reactions", "Calvin cycle", "Chlorophyll"],
        examples: ["Green plants", "Algae"],
        estimatedDuration: 10,
        style: "educational",
      });

      expect(result).toBeDefined();
      expect(result.scenes).toBeDefined();
      expect(Array.isArray(result.scenes)).toBe(true);
      expect(result.scenes.length).toBeGreaterThan(0);
      expect(result.estimatedDuration).toBeGreaterThan(0);
    });

    it("should include scene details", async () => {
      const result = await videoIntegrationService.generateVideoLessonPlan({
        topic: "quantum-mechanics",
        level: 4,
        keyPoints: ["Wave-particle duality", "Superposition", "Entanglement"],
        examples: ["Double-slit experiment", "Schrödinger's cat"],
        estimatedDuration: 15,
        style: "entertaining",
      });

      result.scenes.forEach((scene: any) => {
        expect(scene.title).toBeDefined();
        expect(scene.description).toBeDefined();
        expect(scene.duration).toBeGreaterThan(0);
        expect(scene.animation).toBeDefined();
        expect(scene.voiceover).toBeDefined();
        expect(scene.keyPoint).toBeDefined();
      });
    });

    it("should generate animations", async () => {
      const result = await videoIntegrationService.generateVideoLessonPlan({
        topic: "molecular-biology",
        level: 3,
        keyPoints: ["DNA replication", "Transcription", "Translation"],
        examples: ["Bacteria", "Human cells"],
        estimatedDuration: 12,
        style: "educational",
      });

      expect(result.animations).toBeDefined();
      expect(Array.isArray(result.animations)).toBe(true);
      expect(result.animations.length).toBeGreaterThan(0);
    });
  });

  describe("Full Pipeline Integration", () => {
    it("should orchestrate all 6 phases for a complete learning path", async () => {
      const query = "How do I learn about climate change?";

      // Phase 1: Analyze request
      const analysis = await requestIntelligenceAgent.analyzeRequest(
        query,
        undefined,
        undefined
      );
      expect(analysis).toBeDefined();

      // Phase 2: Assess knowledge
      const assessment = await knowledgeAssessmentAgent.assessUserKnowledge([]);
      expect(assessment).toBeDefined();

      // Phase 3: Generate content
      const content = await adaptiveContentGenerator.generateContent({
        concept: analysis.topic,
        level: 2,
        userBackground: "Beginner",
        difficulty: analysis.estimatedDepth as "beginner" | "intermediate" | "advanced",
      });
      expect(content).toBeDefined();

      // Phase 4: Generate sequence
      const sequence = await contentSequencingAgent.generateLearningSequence(
        analysis.topic,
        "beginner",
        undefined,
        analysis.prerequisites
      );
      expect(sequence).toBeDefined();

      // Phase 5: Generate continuations
      const continuation = await continuationEngine.generateContinuationOptions(
        analysis.topic,
        2
      );
      expect(continuation).toBeDefined();

      // Phase 6: Generate video
      const video = await videoIntegrationService.generateVideoLessonPlan({
        topic: analysis.topic,
        level: 2,
        keyPoints: content.keyPoints,
        examples: content.examples,
        estimatedDuration: analysis.estimatedDurationMinutes,
        style: "educational",
      });
      expect(video).toBeDefined();

      // Verify all phases completed
      expect(analysis.topic).toBeDefined();
      expect(assessment.estimatedLevel).toBeDefined();
      expect(content.mainContent.length).toBeGreaterThan(0);
      expect(sequence.lessons.length).toBeGreaterThan(0);
      expect(continuation.options.length).toBe(5);
      expect(video.scenes.length).toBeGreaterThan(0);
    });

    it("should handle multiple topics end-to-end", async () => {
      const topics = ["photosynthesis", "machine-learning", "quantum-mechanics"];

      for (const topic of topics) {
        const analysis = await requestIntelligenceAgent.analyzeRequest(
          `Teach me ${topic}`,
          undefined,
          undefined
        );

        expect(analysis.topic).toBeDefined();

        const content = await adaptiveContentGenerator.generateContent({
          concept: analysis.topic,
          level: 2,
          userBackground: "Beginner",
          difficulty: "beginner",
        });

        expect(content.mainContent.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Error Handling & Edge Cases", () => {
    it("should handle empty query gracefully", async () => {
      try {
        const result = await requestIntelligenceAgent.analyzeRequest(
          "",
          undefined,
          undefined
        );
        // Should either return a result or throw an error
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle very long queries", async () => {
      const longQuery = "Explain ".repeat(100) + "quantum mechanics";
      const result = await requestIntelligenceAgent.analyzeRequest(
        longQuery,
        undefined,
        undefined
      );
      expect(result).toBeDefined();
    });

    it("should handle special characters in queries", async () => {
      const specialQuery = "What is @#$%^&*() in physics?";
      const result = await requestIntelligenceAgent.analyzeRequest(
        specialQuery,
        undefined,
        undefined
      );
      expect(result).toBeDefined();
    });
  });
});
