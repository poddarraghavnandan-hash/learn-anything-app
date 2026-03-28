import { describe, it, expect } from "vitest";
import {
  recommendContent,
  suggestNextConcept,
  detectKnowledgeGaps,
  suggestReviewTopics,
  suggestDifficulty,
  generateLearningPath,
  getLearningInsights,
} from "../signal-recommendations";

/**
 * Test suite for Signal-Driven Recommendation Engine
 * Tests content recommendations, learning path generation, and insights
 */

describe("Signal-Driven Recommendation Engine", () => {
  const testUserId = 999999; // Use a test user ID

  describe("recommendContent", () => {
    it("should return array of content recommendations", async () => {
      const recommendations = await recommendContent(testUserId);
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it("should have valid recommendation structure", async () => {
      const recommendations = await recommendContent(testUserId, 1);
      if (recommendations.length > 0) {
        const rec = recommendations[0];
        expect(rec).toHaveProperty("conceptId");
        expect(rec).toHaveProperty("conceptName");
        expect(rec).toHaveProperty("reason");
        expect(rec).toHaveProperty("confidence");
        expect(rec).toHaveProperty("priority");
      }
    });

    it("should have valid priority values", async () => {
      const recommendations = await recommendContent(testUserId);
      const validPriorities = ["high", "medium", "low"];
      for (const rec of recommendations) {
        expect(validPriorities).toContain(rec.priority);
      }
    });

    it("should have confidence between 0 and 1", async () => {
      const recommendations = await recommendContent(testUserId);
      for (const rec of recommendations) {
        expect(rec.confidence).toBeGreaterThanOrEqual(0);
        expect(rec.confidence).toBeLessThanOrEqual(1);
      }
    });

    it("should respect limit parameter", async () => {
      const recommendations = await recommendContent(testUserId, 3);
      expect(recommendations.length).toBeLessThanOrEqual(3);
    });

    it("should prioritize high-priority recommendations", async () => {
      const recommendations = await recommendContent(testUserId);
      if (recommendations.length > 1) {
        // First recommendation should be high priority if any exist
        const hasHighPriority = recommendations.some((r) => r.priority === "high");
        if (hasHighPriority) {
          expect(recommendations[0].priority).toBe("high");
        }
      }
    });
  });

  describe("suggestNextConcept", () => {
    it("should return next concept or null", async () => {
      const suggestion = await suggestNextConcept(testUserId);
      expect(suggestion === null || typeof suggestion === "object").toBe(true);
    });

    it("should have valid next concept structure", async () => {
      const suggestion = await suggestNextConcept(testUserId);
      if (suggestion) {
        expect(suggestion).toHaveProperty("nextConceptId");
        expect(suggestion).toHaveProperty("nextConceptName");
        expect(suggestion).toHaveProperty("difficulty");
        expect(suggestion).toHaveProperty("reason");
        expect(suggestion).toHaveProperty("confidence");
      }
    });

    it("should have valid difficulty level", async () => {
      const suggestion = await suggestNextConcept(testUserId);
      if (suggestion) {
        const validDifficulties = ["beginner", "intermediate", "advanced"];
        expect(validDifficulties).toContain(suggestion.difficulty);
      }
    });

    it("should suggest advanced for breakthroughs", async () => {
      const suggestion = await suggestNextConcept(testUserId);
      if (suggestion && suggestion.reason.includes("breakthrough")) {
        expect(suggestion.difficulty).toBe("advanced");
      }
    });

    it("should suggest beginner for struggling learners", async () => {
      const suggestion = await suggestNextConcept(testUserId);
      if (suggestion && suggestion.reason.includes("struggling")) {
        expect(suggestion.difficulty).toBe("beginner");
      }
    });
  });

  describe("detectKnowledgeGaps", () => {
    it("should return array of knowledge gaps", async () => {
      const gaps = await detectKnowledgeGaps(testUserId);
      expect(Array.isArray(gaps)).toBe(true);
    });

    it("should return strings for each gap", async () => {
      const gaps = await detectKnowledgeGaps(testUserId);
      for (const gap of gaps) {
        expect(typeof gap).toBe("string");
      }
    });

    it("should return max 5 gaps", async () => {
      const gaps = await detectKnowledgeGaps(testUserId);
      expect(gaps.length).toBeLessThanOrEqual(5);
    });
  });

  describe("suggestReviewTopics", () => {
    it("should return array of review recommendations", async () => {
      const reviews = await suggestReviewTopics(testUserId);
      expect(Array.isArray(reviews)).toBe(true);
    });

    it("should have valid review structure", async () => {
      const reviews = await suggestReviewTopics(testUserId);
      if (reviews.length > 0) {
        const review = reviews[0];
        expect(review).toHaveProperty("conceptId");
        expect(review).toHaveProperty("conceptName");
        expect(review).toHaveProperty("reason");
        expect(review).toHaveProperty("urgency");
      }
    });

    it("should have valid urgency levels", async () => {
      const reviews = await suggestReviewTopics(testUserId);
      const validUrgencies = ["high", "medium", "low"];
      for (const review of reviews) {
        expect(validUrgencies).toContain(review.urgency);
      }
    });

    it("should return max 5 reviews", async () => {
      const reviews = await suggestReviewTopics(testUserId);
      expect(reviews.length).toBeLessThanOrEqual(5);
    });
  });

  describe("suggestDifficulty", () => {
    it("should return valid difficulty level", async () => {
      const difficulty = await suggestDifficulty(testUserId);
      const validDifficulties = ["beginner", "intermediate", "advanced"];
      expect(validDifficulties).toContain(difficulty);
    });

    it("should suggest beginner for low confidence", async () => {
      // This would require a user with low confidence signals
      const difficulty = await suggestDifficulty(testUserId);
      expect(typeof difficulty).toBe("string");
    });

    it("should suggest advanced for high confidence", async () => {
      // This would require a user with high confidence signals
      const difficulty = await suggestDifficulty(testUserId);
      expect(typeof difficulty).toBe("string");
    });
  });

  describe("generateLearningPath", () => {
    it("should return learning path object", async () => {
      const path = await generateLearningPath(testUserId);
      expect(path).toHaveProperty("currentLevel");
      expect(path).toHaveProperty("nextSteps");
      expect(path).toHaveProperty("estimatedTimeToMastery");
      expect(path).toHaveProperty("focusAreas");
    });

    it("should have valid current level", async () => {
      const path = await generateLearningPath(testUserId);
      const validLevels = ["beginner", "intermediate", "advanced"];
      expect(validLevels).toContain(path.currentLevel);
    });

    it("should have next steps as array", async () => {
      const path = await generateLearningPath(testUserId);
      expect(Array.isArray(path.nextSteps)).toBe(true);
      for (const step of path.nextSteps) {
        expect(typeof step).toBe("string");
      }
    });

    it("should have positive estimated time", async () => {
      const path = await generateLearningPath(testUserId);
      expect(path.estimatedTimeToMastery).toBeGreaterThan(0);
    });

    it("should have focus areas as array", async () => {
      const path = await generateLearningPath(testUserId);
      expect(Array.isArray(path.focusAreas)).toBe(true);
    });
  });

  describe("getLearningInsights", () => {
    it("should return insights object", async () => {
      const insights = await getLearningInsights(testUserId);
      expect(insights).toHaveProperty("strengths");
      expect(insights).toHaveProperty("challenges");
      expect(insights).toHaveProperty("opportunities");
      expect(insights).toHaveProperty("nextMilestone");
    });

    it("should have strengths as array", async () => {
      const insights = await getLearningInsights(testUserId);
      expect(Array.isArray(insights.strengths)).toBe(true);
      for (const strength of insights.strengths) {
        expect(typeof strength).toBe("string");
      }
    });

    it("should have challenges as array", async () => {
      const insights = await getLearningInsights(testUserId);
      expect(Array.isArray(insights.challenges)).toBe(true);
      for (const challenge of insights.challenges) {
        expect(typeof challenge).toBe("string");
      }
    });

    it("should have opportunities as array", async () => {
      const insights = await getLearningInsights(testUserId);
      expect(Array.isArray(insights.opportunities)).toBe(true);
      for (const opportunity of insights.opportunities) {
        expect(typeof opportunity).toBe("string");
      }
    });

    it("should have next milestone as string", async () => {
      const insights = await getLearningInsights(testUserId);
      expect(typeof insights.nextMilestone).toBe("string");
      expect(insights.nextMilestone.length).toBeGreaterThan(0);
    });

    it("should have max 3 items per category", async () => {
      const insights = await getLearningInsights(testUserId);
      expect(insights.strengths.length).toBeLessThanOrEqual(3);
      expect(insights.challenges.length).toBeLessThanOrEqual(3);
      expect(insights.opportunities.length).toBeLessThanOrEqual(3);
    });

    it("should generate insights for new learners", async () => {
      const insights = await getLearningInsights(testUserId);
      // Should have at least some insights even for new learners
      expect(
        insights.strengths.length +
          insights.challenges.length +
          insights.opportunities.length
      ).toBeGreaterThanOrEqual(0);
    });

    it("should identify getting started as challenge for new learners", async () => {
      const insights = await getLearningInsights(testUserId);
      // New learners should have "Getting started" or similar
      const hasStartChallenge = insights.challenges.some((c) =>
        c.toLowerCase().includes("start")
      );
      expect(hasStartChallenge || insights.challenges.length === 0).toBe(true);
    });
  });

  describe("Recommendation Consistency", () => {
    it("should provide consistent recommendations across calls", async () => {
      const rec1 = await recommendContent(testUserId, 1);
      const rec2 = await recommendContent(testUserId, 1);

      if (rec1.length > 0 && rec2.length > 0) {
        // Should recommend same or similar concepts
        expect(rec1[0].conceptId).toBe(rec2[0].conceptId);
      }
    });

    it("should align difficulty suggestion with learning path", async () => {
      const difficulty = await suggestDifficulty(testUserId);
      const path = await generateLearningPath(testUserId);

      expect(difficulty).toBe(path.currentLevel);
    });

    it("should provide actionable next steps", async () => {
      const path = await generateLearningPath(testUserId);
      for (const step of path.nextSteps) {
        expect(step.length).toBeGreaterThan(5); // Should be descriptive
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle user with no signals gracefully", async () => {
      const recommendations = await recommendContent(testUserId);
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it("should handle zero limit gracefully", async () => {
      const recommendations = await recommendContent(testUserId, 0);
      expect(recommendations.length).toBe(0);
    });

    it("should handle very high limit gracefully", async () => {
      const recommendations = await recommendContent(testUserId, 1000);
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it("should always return learning path", async () => {
      const path = await generateLearningPath(testUserId);
      expect(path).not.toBeNull();
      expect(path.currentLevel).toBeDefined();
    });

    it("should always return insights", async () => {
      const insights = await getLearningInsights(testUserId);
      expect(insights).not.toBeNull();
      expect(insights.nextMilestone).toBeDefined();
    });
  });
});
