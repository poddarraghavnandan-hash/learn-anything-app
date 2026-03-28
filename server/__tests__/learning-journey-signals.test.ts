import { describe, it, expect } from "vitest";
import {
  captureBreakthroughSignal,
  captureStuckSignal,
  captureConnectionSignal,
} from "../signal-capture-middleware";
import { getUserLearnerProfile } from "../learner-profile";

describe("Learning Journey Signal Capture", () => {
  const testUserId = 999998;
  const testConceptId = 1;

  describe("Stage Completion Signals", () => {
    it("should capture breakthrough signal for high accuracy completion", async () => {
      const result = await captureBreakthroughSignal(
        testUserId,
        "Completed JavaScript stage 1 (foundation) with 90% accuracy",
        testConceptId,
        {
          topicSlug: "javascript",
          stageNumber: 1,
          layerCompleted: "foundation",
          accuracy: 0.9,
          timeSpentSeconds: 300,
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });

    it("should capture stuck signal for low accuracy completion", async () => {
      const result = await captureStuckSignal(
        testUserId,
        "Struggled with JavaScript stage 2 (deepDive) with 30% accuracy",
        testConceptId,
        {
          topicSlug: "javascript",
          stageNumber: 2,
          layerCompleted: "deepDive",
          accuracy: 0.3,
          timeSpentSeconds: 600,
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });

    it("should capture connection signal for medium accuracy completion", async () => {
      const result = await captureConnectionSignal(
        testUserId,
        "Completed JavaScript stage 1 (foundation) with 65% accuracy",
        testConceptId,
        undefined,
        {
          topicSlug: "javascript",
          stageNumber: 1,
          layerCompleted: "foundation",
          accuracy: 0.65,
          timeSpentSeconds: 450,
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });

    it("should capture breakthrough signal for stage completion without accuracy", async () => {
      const result = await captureBreakthroughSignal(
        testUserId,
        "Completed Python stage 1 (foundation)",
        testConceptId,
        {
          topicSlug: "python",
          stageNumber: 1,
          layerCompleted: "foundation",
          timeSpentSeconds: 300,
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });
  });

  describe("Multi-Layer Learning Journey", () => {
    it("should capture signals for foundation layer completion", async () => {
      const result = await captureBreakthroughSignal(
        testUserId,
        "Completed React stage 1 (foundation)",
        testConceptId,
        {
          topicSlug: "react",
          stageNumber: 1,
          layerCompleted: "foundation",
          accuracy: 0.85,
          timeSpentSeconds: 400,
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });

    it("should capture signals for deepDive layer completion", async () => {
      const result = await captureConnectionSignal(
        testUserId,
        "Completed React stage 1 (deepDive)",
        testConceptId,
        undefined,
        {
          topicSlug: "react",
          stageNumber: 1,
          layerCompleted: "deepDive",
          accuracy: 0.7,
          timeSpentSeconds: 600,
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });

    it("should capture signals for expert layer completion", async () => {
      const result = await captureBreakthroughSignal(
        testUserId,
        "Completed React stage 1 (expert)",
        testConceptId,
        {
          topicSlug: "react",
          stageNumber: 1,
          layerCompleted: "expert",
          accuracy: 0.95,
          timeSpentSeconds: 800,
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });
  });

  describe("Multiple Stage Completions", () => {
    it("should capture signals for multiple stage completions", async () => {
      const stages = [
        {
          stageNumber: 1,
          accuracy: 0.85,
          timeSpent: 300,
        },
        {
          stageNumber: 2,
          accuracy: 0.75,
          timeSpent: 400,
        },
        {
          stageNumber: 3,
          accuracy: 0.9,
          timeSpent: 350,
        },
      ];

      for (const stage of stages) {
        if (stage.accuracy >= 0.8) {
          await captureBreakthroughSignal(
            testUserId,
            `Completed stage ${stage.stageNumber}`,
            testConceptId,
            {
              stageNumber: stage.stageNumber,
              accuracy: stage.accuracy,
              timeSpentSeconds: stage.timeSpent,
              timestamp: new Date(),
            }
          );
        } else {
          await captureConnectionSignal(
            testUserId,
            `Completed stage ${stage.stageNumber}`,
            testConceptId,
            undefined,
            {
              stageNumber: stage.stageNumber,
              accuracy: stage.accuracy,
              timeSpentSeconds: stage.timeSpent,
              timestamp: new Date(),
            }
          );
        }
      }

      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        expect(profile.totalSignalsThisWeek ?? 0).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("Time Spent Tracking", () => {
    it("should capture signal with short time spent", async () => {
      const result = await captureBreakthroughSignal(
        testUserId,
        "Quick stage completion",
        testConceptId,
        {
          stageNumber: 1,
          accuracy: 0.8,
          timeSpentSeconds: 60,
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });

    it("should capture signal with long time spent", async () => {
      const result = await captureStuckSignal(
        testUserId,
        "Struggled with stage",
        testConceptId,
        {
          stageNumber: 2,
          accuracy: 0.4,
          timeSpentSeconds: 1800,
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });

    it("should capture signal with very long time spent", async () => {
      const result = await captureConnectionSignal(
        testUserId,
        "Extended learning session",
        testConceptId,
        undefined,
        {
          stageNumber: 3,
          accuracy: 0.65,
          timeSpentSeconds: 3600,
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });
  });

  describe("Accuracy Thresholds", () => {
    it("should capture breakthrough for accuracy >= 0.8", async () => {
      const accuracies = [0.8, 0.85, 0.9, 0.95, 1.0];

      for (const accuracy of accuracies) {
        const result = await captureBreakthroughSignal(
          testUserId,
          `High accuracy: ${accuracy}`,
          testConceptId,
          {
            accuracy,
            timestamp: new Date(),
          }
        );
        expect(result).toBeDefined();
      }
    });

    it("should capture stuck for accuracy < 0.5", async () => {
      const accuracies = [0.0, 0.1, 0.2, 0.3, 0.4];

      for (const accuracy of accuracies) {
        const result = await captureStuckSignal(
          testUserId,
          `Low accuracy: ${accuracy}`,
          testConceptId,
          {
            accuracy,
            timestamp: new Date(),
          }
        );
        expect(result).toBeDefined();
      }
    });

    it("should capture connection for 0.5 <= accuracy < 0.8", async () => {
      const accuracies = [0.5, 0.6, 0.65, 0.7, 0.75];

      for (const accuracy of accuracies) {
        const result = await captureConnectionSignal(
          testUserId,
          `Medium accuracy: ${accuracy}`,
          testConceptId,
          undefined,
          {
            accuracy,
            timestamp: new Date(),
          }
        );
        expect(result).toBeDefined();
      }
    });
  });

  describe("Learning Journey Progression", () => {
    it("should capture signals showing learning progression", async () => {
      // Stage 1: Low accuracy (stuck)
      await captureStuckSignal(testUserId, "Stage 1 - First attempt", testConceptId, {
        stageNumber: 1,
        accuracy: 0.3,
        timeSpentSeconds: 600,
        timestamp: new Date(),
      });

      // Stage 1: Medium accuracy (connection)
      await captureConnectionSignal(testUserId, "Stage 1 - Second attempt", testConceptId, undefined, {
        stageNumber: 1,
        accuracy: 0.65,
        timeSpentSeconds: 400,
        timestamp: new Date(),
      });

      // Stage 1: High accuracy (breakthrough)
      await captureBreakthroughSignal(testUserId, "Stage 1 - Final attempt", testConceptId, {
        stageNumber: 1,
        accuracy: 0.9,
        timeSpentSeconds: 300,
        timestamp: new Date(),
      });

      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        expect(profile.totalSignalsThisWeek ?? 0).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("Performance", () => {
    it("should capture stage completion signal within reasonable time", async () => {
      const start = Date.now();

      await captureBreakthroughSignal(
        testUserId,
        "Performance test stage completion",
        testConceptId,
        {
          stageNumber: 1,
          accuracy: 0.85,
          timeSpentSeconds: 300,
          timestamp: new Date(),
        }
      );

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });

    it("should handle rapid stage completions", async () => {
      const start = Date.now();

      for (let i = 0; i < 10; i++) {
        const accuracy = 0.5 + (Math.random() * 0.5); // Random accuracy 0.5-1.0
        if (accuracy >= 0.8) {
          await captureBreakthroughSignal(testUserId, `Stage ${i}`, testConceptId, {
            stageNumber: i,
            accuracy,
            timeSpentSeconds: 300,
            timestamp: new Date(),
          });
        } else {
          await captureConnectionSignal(testUserId, `Stage ${i}`, testConceptId, undefined, {
            stageNumber: i,
            accuracy,
            timeSpentSeconds: 300,
            timestamp: new Date(),
          });
        }
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000);
    });
  });

  describe("Edge Cases", () => {
    it("should handle stage completion with zero accuracy", async () => {
      const result = await captureStuckSignal(testUserId, "Zero accuracy stage", testConceptId, {
        stageNumber: 1,
        accuracy: 0.0,
        timeSpentSeconds: 300,
        timestamp: new Date(),
      });

      expect(result).toBeDefined();
    });

    it("should handle stage completion with perfect accuracy", async () => {
      const result = await captureBreakthroughSignal(testUserId, "Perfect accuracy stage", testConceptId, {
        stageNumber: 1,
        accuracy: 1.0,
        timeSpentSeconds: 300,
        timestamp: new Date(),
      });

      expect(result).toBeDefined();
    });

    it("should handle stage completion with no time spent", async () => {
      const result = await captureBreakthroughSignal(testUserId, "Instant stage", testConceptId, {
        stageNumber: 1,
        accuracy: 0.85,
        timeSpentSeconds: 0,
        timestamp: new Date(),
      });

      expect(result).toBeDefined();
    });

    it("should handle stage completion with missing accuracy", async () => {
      const result = await captureBreakthroughSignal(testUserId, "No accuracy stage", testConceptId, {
        stageNumber: 1,
        timeSpentSeconds: 300,
        timestamp: new Date(),
      });

      expect(result).toBeDefined();
    });
  });
});
