import { describe, it, expect } from "vitest";
import {
  recommendDifficultyLevel,
  adjustDifficultyBasedOnSignals,
  generateAdaptiveRecommendations,
  trackDifficultyAdjustments,
  calculateOptimalLearningPath,
  type DifficultyLevel,
  type DifficultyAdjustment,
  type AdaptiveRecommendation,
} from "../adaptive-difficulty";

describe("Adaptive Difficulty System", () => {
  const testUserId = 999995;
  const testConceptId = 1;
  const testConceptName = "JavaScript Basics";

  describe("Difficulty Level Recommendation", () => {
    it("should recommend difficulty level", async () => {
      const level = await recommendDifficultyLevel(testUserId, testConceptId, "foundation");

      expect(["foundation", "intermediate", "advanced", "expert"]).toContain(level);
    });

    it("should keep foundation level if insufficient signals", async () => {
      const level = await recommendDifficultyLevel(testUserId, 999999, "foundation");

      expect(level).toBe("foundation");
    });

    it("should handle all difficulty levels", async () => {
      const levels: DifficultyLevel[] = ["foundation", "intermediate", "advanced", "expert"];

      for (const level of levels) {
        const recommended = await recommendDifficultyLevel(testUserId, testConceptId, level);
        expect(["foundation", "intermediate", "advanced", "expert"]).toContain(recommended);
      }
    });
  });

  describe("Difficulty Adjustment", () => {
    it("should calculate difficulty adjustment", async () => {
      const adjustment = await adjustDifficultyBasedOnSignals(testUserId, testConceptId, "foundation");

      expect(adjustment).toBeDefined();
      expect(adjustment.currentLevel).toBe("foundation");
      expect(["foundation", "intermediate", "advanced", "expert"]).toContain(adjustment.recommendedLevel);
      expect(typeof adjustment.reason).toBe("string");
      expect(adjustment.confidence).toBeGreaterThanOrEqual(0);
      expect(adjustment.confidence).toBeLessThanOrEqual(1);
      expect(adjustment.adjustmentFactor).toBeGreaterThanOrEqual(-2);
      expect(adjustment.adjustmentFactor).toBeLessThanOrEqual(2);
    });

    it("should provide reasoning for adjustment", async () => {
      const adjustment = await adjustDifficultyBasedOnSignals(testUserId, testConceptId, "intermediate");

      expect(adjustment.reason.length).toBeGreaterThan(0);
    });

    it("should handle all difficulty levels for adjustment", async () => {
      const levels: DifficultyLevel[] = ["foundation", "intermediate", "advanced", "expert"];

      for (const level of levels) {
        const adjustment = await adjustDifficultyBasedOnSignals(testUserId, testConceptId, level);
        expect(adjustment.currentLevel).toBe(level);
        expect(["foundation", "intermediate", "advanced", "expert"]).toContain(adjustment.recommendedLevel);
      }
    });

    it("should have confidence based on signal volume", async () => {
      const adjustment = await adjustDifficultyBasedOnSignals(testUserId, testConceptId, "foundation");

      expect(adjustment.confidence).toBeGreaterThanOrEqual(0);
      expect(adjustment.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe("Adaptive Recommendations", () => {
    it("should generate adaptive recommendations", async () => {
      const conceptIds = [1, 2, 3];
      const conceptNames = new Map([
        [1, "Concept 1"],
        [2, "Concept 2"],
        [3, "Concept 3"],
      ]);

      const recommendations = await generateAdaptiveRecommendations(testUserId, conceptIds, conceptNames);

      expect(Array.isArray(recommendations)).toBe(true);
      for (const rec of recommendations) {
        expect(rec.conceptId).toBeGreaterThanOrEqual(1);
        expect(typeof rec.conceptName).toBe("string");
        expect(["foundation", "intermediate", "advanced", "expert"]).toContain(rec.recommendedDifficulty);
        expect(rec.estimatedCompletionTime).toBeGreaterThan(0);
        expect(rec.successProbability).toBeGreaterThanOrEqual(0);
        expect(rec.successProbability).toBeLessThanOrEqual(1);
        expect(rec.engagementScore).toBeGreaterThanOrEqual(0);
        expect(rec.engagementScore).toBeLessThanOrEqual(1);
      }
    });

    it("should sort recommendations by priority", async () => {
      const conceptIds = [1, 2, 3, 4, 5];
      const conceptNames = new Map(conceptIds.map((id) => [id, `Concept ${id}`]));

      const recommendations = await generateAdaptiveRecommendations(testUserId, conceptIds, conceptNames);

      // Recommendations should be sorted by priority (low mastery + high engagement first)
      for (let i = 0; i < recommendations.length - 1; i++) {
        const current = recommendations[i];
        const next = recommendations[i + 1];

        const currentPriority = (1 - current.successProbability) * current.engagementScore;
        const nextPriority = (1 - next.successProbability) * next.engagementScore;

        expect(currentPriority).toBeGreaterThanOrEqual(nextPriority - 0.01); // Allow small floating point difference
      }
    });

    it("should handle empty concept list", async () => {
      const recommendations = await generateAdaptiveRecommendations(testUserId, [], new Map());

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBe(0);
    });
  });

  describe("Difficulty Adjustment Tracking", () => {
    it("should track difficulty adjustments", async () => {
      const tracking = await trackDifficultyAdjustments(testUserId, testConceptId);

      expect(tracking).toBeDefined();
      expect(Array.isArray(tracking.adjustmentHistory)).toBe(true);
      expect(["increasing", "stable", "decreasing"]).toContain(tracking.currentTrend);
      expect(tracking.totalAdjustments).toBeGreaterThanOrEqual(0);
    });

    it("should have adjustment history", async () => {
      const tracking = await trackDifficultyAdjustments(testUserId, testConceptId);

      for (const adjustment of tracking.adjustmentHistory) {
        expect(adjustment.timestamp).toBeInstanceOf(Date);
        expect(["foundation", "intermediate", "advanced", "expert"]).toContain(adjustment.fromLevel);
        expect(["foundation", "intermediate", "advanced", "expert"]).toContain(adjustment.toLevel);
        expect(typeof adjustment.reason).toBe("string");
      }
    });
  });

  describe("Optimal Learning Path", () => {
    it("should calculate optimal learning path", async () => {
      const conceptIds = [1, 2, 3];
      const conceptNames = new Map([
        [1, "Concept 1"],
        [2, "Concept 2"],
        [3, "Concept 3"],
      ]);

      const path = await calculateOptimalLearningPath(testUserId, conceptIds, conceptNames);

      expect(path).toBeDefined();
      expect(Array.isArray(path.recommendedOrder)).toBe(true);
      expect(path.estimatedTotalTime).toBeGreaterThanOrEqual(0);
      expect(path.successProbability).toBeGreaterThanOrEqual(0);
      expect(path.successProbability).toBeLessThanOrEqual(1);
    });

    it("should have recommended order", async () => {
      const conceptIds = [1, 2, 3];
      const conceptNames = new Map([
        [1, "Concept 1"],
        [2, "Concept 2"],
        [3, "Concept 3"],
      ]);

      const path = await calculateOptimalLearningPath(testUserId, conceptIds, conceptNames);

      for (let i = 0; i < path.recommendedOrder.length; i++) {
        const order = path.recommendedOrder[i];
        expect(order.conceptId).toBeGreaterThanOrEqual(1);
        expect(typeof order.conceptName).toBe("string");
        expect(["foundation", "intermediate", "advanced", "expert"]).toContain(order.difficulty);
        expect(order.priority).toBe(i + 1);
      }
    });

    it("should estimate total time correctly", async () => {
      const conceptIds = [1, 2, 3];
      const conceptNames = new Map([
        [1, "Concept 1"],
        [2, "Concept 2"],
        [3, "Concept 3"],
      ]);

      const path = await calculateOptimalLearningPath(testUserId, conceptIds, conceptNames);

      expect(path.estimatedTotalTime).toBeGreaterThanOrEqual(0);
      // Estimated time should be reasonable (not too high)
      expect(path.estimatedTotalTime).toBeLessThan(1000);
    });

    it("should handle empty concept list", async () => {
      const path = await calculateOptimalLearningPath(testUserId, [], new Map());

      expect(path.recommendedOrder.length).toBe(0);
      expect(path.estimatedTotalTime).toBe(0);
      expect(path.successProbability).toBe(0);
    });
  });

  describe("Adaptive Difficulty Performance", () => {
    it("should calculate difficulty adjustment within reasonable time", async () => {
      const start = Date.now();
      await adjustDifficultyBasedOnSignals(testUserId, testConceptId, "foundation");
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000);
    });

    it("should generate recommendations within reasonable time", async () => {
      const conceptIds = [1, 2, 3, 4, 5];
      const conceptNames = new Map(conceptIds.map((id) => [id, `Concept ${id}`]));

      const start = Date.now();
      await generateAdaptiveRecommendations(testUserId, conceptIds, conceptNames);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000);
    });

    it("should calculate learning path within reasonable time", async () => {
      const conceptIds = [1, 2, 3, 4, 5];
      const conceptNames = new Map(conceptIds.map((id) => [id, `Concept ${id}`]));

      const start = Date.now();
      await calculateOptimalLearningPath(testUserId, conceptIds, conceptNames);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000);
    });
  });

  describe("Edge Cases", () => {
    it("should handle non-existent concept", async () => {
      const adjustment = await adjustDifficultyBasedOnSignals(testUserId, 999999, "foundation");

      expect(adjustment.currentLevel).toBe("foundation");
      expect(adjustment.confidence).toBeLessThan(0.5);
    });

    it("should handle all difficulty transitions", async () => {
      const transitions: Array<[DifficultyLevel, DifficultyLevel]> = [
        ["foundation", "intermediate"],
        ["intermediate", "advanced"],
        ["advanced", "expert"],
        ["expert", "foundation"],
      ];

      for (const [from, to] of transitions) {
        const adjustment = await adjustDifficultyBasedOnSignals(testUserId, testConceptId, from);
        expect(adjustment.currentLevel).toBe(from);
      }
    });

    it("should handle large concept lists", async () => {
      const conceptIds = Array.from({ length: 50 }, (_, i) => i + 1);
      const conceptNames = new Map(conceptIds.map((id) => [id, `Concept ${id}`]));

      const path = await calculateOptimalLearningPath(testUserId, conceptIds, conceptNames);

      expect(path.recommendedOrder.length).toBe(50);
    });
  });

  describe("Adaptive Difficulty Consistency", () => {
    it("should have consistent adjustment factors", async () => {
      const adjustment = await adjustDifficultyBasedOnSignals(testUserId, testConceptId, "foundation");

      expect(adjustment.adjustmentFactor).toBeGreaterThanOrEqual(-2);
      expect(adjustment.adjustmentFactor).toBeLessThanOrEqual(2);

      // Adjustment factor should be integer
      expect(Number.isInteger(adjustment.adjustmentFactor)).toBe(true);
    });

    it("should have consistent recommendation ordering", async () => {
      const conceptIds = [1, 2, 3];
      const conceptNames = new Map([
        [1, "Concept 1"],
        [2, "Concept 2"],
        [3, "Concept 3"],
      ]);

      const path = await calculateOptimalLearningPath(testUserId, conceptIds, conceptNames);

      // Priorities should be sequential
      for (let i = 0; i < path.recommendedOrder.length; i++) {
        expect(path.recommendedOrder[i].priority).toBe(i + 1);
      }
    });

    it("should have valid success probabilities", async () => {
      const conceptIds = [1, 2, 3];
      const conceptNames = new Map([
        [1, "Concept 1"],
        [2, "Concept 2"],
        [3, "Concept 3"],
      ]);

      const recommendations = await generateAdaptiveRecommendations(testUserId, conceptIds, conceptNames);

      for (const rec of recommendations) {
        expect(rec.successProbability).toBeGreaterThanOrEqual(0);
        expect(rec.successProbability).toBeLessThanOrEqual(1);
      }
    });
  });
});
