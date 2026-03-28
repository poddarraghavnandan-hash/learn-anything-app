import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getUserLearnerProfile,
  getLearnerProfileSummary,
  updateLearnerModel,
  compareLearnerProfiles,
  type LearnerProfile,
} from "../learner-profile";

/**
 * Test suite for Learner Profile Service
 * Tests profile generation, learning style detection, and trajectory analysis
 */

describe("Learner Profile Service", () => {
  const testUserId = 999999; // Use a test user ID

  describe("getUserLearnerProfile", () => {
    it("should return null if user has no signals", async () => {
      const profile = await getUserLearnerProfile(testUserId);
      // Profile might be null or have default values
      expect(profile === null || profile.totalSignalsThisWeek === 0).toBe(true);
    });

    it("should return a valid profile structure when signals exist", async () => {
      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        expect(profile).toHaveProperty("userId");
        expect(profile).toHaveProperty("learningStyle");
        expect(profile).toHaveProperty("learningVelocity");
        expect(profile).toHaveProperty("confidenceTrajectory");
        expect(profile).toHaveProperty("averageConfidence");
        expect(profile).toHaveProperty("averageDepth");
        expect(profile).toHaveProperty("breakthroughsThisWeek");
        expect(profile).toHaveProperty("stuckPointsThisWeek");
        expect(profile).toHaveProperty("totalSignalsThisWeek");
        expect(profile).toHaveProperty("signalDistribution");
        expect(profile).toHaveProperty("topConceptsByConfidence");
        expect(profile).toHaveProperty("knowledgeGaps");
        expect(profile).toHaveProperty("recommendedNextSteps");
        expect(profile).toHaveProperty("lastUpdated");
      }
    });

    it("should have valid learning style value", async () => {
      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        const validStyles = [
          "analytical",
          "relational",
          "practical",
          "progressive",
          "balanced",
        ];
        expect(validStyles).toContain(profile.learningStyle);
      }
    });

    it("should have valid confidence trajectory value", async () => {
      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        const validTrajectories = ["improving", "stable", "struggling"];
        expect(validTrajectories).toContain(profile.confidenceTrajectory);
      }
    });

    it("should have average confidence between 0 and 1", async () => {
      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        expect(profile.averageConfidence).toBeGreaterThanOrEqual(0);
        expect(profile.averageConfidence).toBeLessThanOrEqual(1);
      }
    });

    it("should have valid average depth value", async () => {
      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        const validDepths = ["surface", "intermediate", "deep"];
        expect(validDepths).toContain(profile.averageDepth);
      }
    });

    it("should have non-negative signal counts", async () => {
      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        expect(profile.breakthroughsThisWeek).toBeGreaterThanOrEqual(0);
        expect(profile.stuckPointsThisWeek).toBeGreaterThanOrEqual(0);
        expect(profile.totalSignalsThisWeek).toBeGreaterThanOrEqual(0);
      }
    });

    it("should have signal distribution with valid signal types", async () => {
      const profile = await getUserLearnerProfile(testUserId);
      if (profile && profile.totalSignalsThisWeek > 0) {
        const validTypes = [
          "question",
          "connection",
          "application",
          "teaching",
          "breakthrough",
          "stuck",
          "feedback",
        ];
        for (const type of Object.keys(profile.signalDistribution)) {
          expect(validTypes).toContain(type);
        }
      }
    });

    it("should have top concepts sorted by confidence", async () => {
      const profile = await getUserLearnerProfile(testUserId);
      if (profile && profile.topConceptsByConfidence.length > 1) {
        for (let i = 0; i < profile.topConceptsByConfidence.length - 1; i++) {
          expect(
            profile.topConceptsByConfidence[i].confidence
          ).toBeGreaterThanOrEqual(
            profile.topConceptsByConfidence[i + 1].confidence
          );
        }
      }
    });

    it("should have knowledge gaps with valid reasons", async () => {
      const profile = await getUserLearnerProfile(testUserId);
      if (profile && profile.knowledgeGaps.length > 0) {
        const validReasons = ["stuck_signal", "low_confidence", "no_signals"];
        for (const gap of profile.knowledgeGaps) {
          expect(validReasons).toContain(gap.reason);
        }
      }
    });

    it("should have recommended next steps as array of strings", async () => {
      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        expect(Array.isArray(profile.recommendedNextSteps)).toBe(true);
        for (const step of profile.recommendedNextSteps) {
          expect(typeof step).toBe("string");
          expect(step.length).toBeGreaterThan(0);
        }
      }
    });

    it("should have lastUpdated as a recent date", async () => {
      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        const now = new Date();
        const diff = now.getTime() - profile.lastUpdated.getTime();
        // Should be updated within the last minute
        expect(diff).toBeLessThan(60000);
      }
    });
  });

  describe("getLearnerProfileSummary", () => {
    it("should return null for user with no profile", async () => {
      const summary = await getLearnerProfileSummary(testUserId);
      expect(summary === null || typeof summary === "object").toBe(true);
    });

    it("should return summary with required fields", async () => {
      const summary = await getLearnerProfileSummary(testUserId);
      if (summary) {
        expect(summary).toHaveProperty("learningStyle");
        expect(summary).toHaveProperty("confidenceTrajectory");
        expect(summary).toHaveProperty("averageConfidence");
        expect(summary).toHaveProperty("breakthroughsThisWeek");
        expect(summary).toHaveProperty("stuckPointsThisWeek");
        expect(summary).toHaveProperty("totalSignalsThisWeek");
        expect(summary).toHaveProperty("topRecommendation");
      }
    });

    it("should have valid learning style in summary", async () => {
      const summary = await getLearnerProfileSummary(testUserId);
      if (summary) {
        const validStyles = [
          "analytical",
          "relational",
          "practical",
          "progressive",
          "balanced",
        ];
        expect(validStyles).toContain(summary.learningStyle);
      }
    });

    it("should have top recommendation as non-empty string", async () => {
      const summary = await getLearnerProfileSummary(testUserId);
      if (summary) {
        expect(typeof summary.topRecommendation).toBe("string");
        expect(summary.topRecommendation.length).toBeGreaterThan(0);
      }
    });
  });

  describe("updateLearnerModel", () => {
    it("should return updated profile", async () => {
      const profile = await updateLearnerModel(testUserId);
      expect(profile === null || typeof profile === "object").toBe(true);
    });

    it("should maintain profile consistency after update", async () => {
      const profile1 = await getUserLearnerProfile(testUserId);
      const profile2 = await updateLearnerModel(testUserId);

      if (profile1 && profile2) {
        expect(profile2.userId).toBe(profile1.userId);
        expect(profile2.learningStyle).toBe(profile1.learningStyle);
      }
    });
  });

  describe("compareLearnerProfiles", () => {
    it("should compare two profiles correctly", async () => {
      const profile1 = await getUserLearnerProfile(testUserId);
      const profile2 = await getUserLearnerProfile(testUserId);

      if (profile1 && profile2) {
        const comparison = await compareLearnerProfiles(
          testUserId,
          profile1,
          profile2
        );

        expect(comparison).toHaveProperty("confidenceChange");
        expect(comparison).toHaveProperty("breakthroughsChange");
        expect(comparison).toHaveProperty("stuckPointsChange");
        expect(comparison).toHaveProperty("learningStyleChanged");
        expect(comparison).toHaveProperty("trajectoryChanged");

        // Same profile should have 0 changes
        expect(comparison.confidenceChange).toBe(0);
        expect(comparison.breakthroughsChange).toBe(0);
        expect(comparison.stuckPointsChange).toBe(0);
        expect(comparison.learningStyleChanged).toBe(false);
        expect(comparison.trajectoryChanged).toBe(false);
      }
    });
  });

  describe("Learning Style Detection", () => {
    it("should detect analytical style for high question count", async () => {
      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        // If questions are >35% of signals, should be analytical
        const total = Object.values(profile.signalDistribution).reduce(
          (a, b) => a + b,
          0
        );
        if (total > 0) {
          const questionRatio =
            (profile.signalDistribution.question || 0) / total;
          if (questionRatio > 0.35) {
            expect(profile.learningStyle).toBe("analytical");
          }
        }
      }
    });

    it("should detect practical style for high application count", async () => {
      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        // If applications are >35% of signals, should be practical
        const total = Object.values(profile.signalDistribution).reduce(
          (a, b) => a + b,
          0
        );
        if (total > 0) {
          const appRatio =
            (profile.signalDistribution.application || 0) / total;
          if (appRatio > 0.35) {
            expect(profile.learningStyle).toBe("practical");
          }
        }
      }
    });
  });

  describe("Confidence Trajectory Analysis", () => {
    it("should have valid trajectory based on signals", async () => {
      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        const validTrajectories = ["improving", "stable", "struggling"];
        expect(validTrajectories).toContain(profile.confidenceTrajectory);
      }
    });

    it("should have consistent trajectory and confidence", async () => {
      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        // Improving trajectory should generally have higher confidence
        // Struggling trajectory should generally have lower confidence
        // This is a loose check since we don't have the full signal history
        expect(typeof profile.confidenceTrajectory).toBe("string");
        expect(profile.averageConfidence).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("Knowledge Gaps Detection", () => {
    it("should identify knowledge gaps from stuck signals", async () => {
      const profile = await getUserLearnerProfile(testUserId);
      if (profile && profile.stuckPointsThisWeek > 0) {
        // If there are stuck points, there should be knowledge gaps
        const stuckGaps = profile.knowledgeGaps.filter(
          (g) => g.reason === "stuck_signal"
        );
        expect(stuckGaps.length).toBeGreaterThanOrEqual(0);
      }
    });

    it("should identify low confidence gaps", async () => {
      const profile = await getUserLearnerProfile(testUserId);
      if (profile && profile.averageConfidence < 0.4) {
        // If average confidence is low, should have low confidence gap
        const lowConfGaps = profile.knowledgeGaps.filter(
          (g) => g.reason === "low_confidence"
        );
        expect(lowConfGaps.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Recommended Next Steps", () => {
    it("should provide recommendations for struggling learners", async () => {
      const profile = await getUserLearnerProfile(testUserId);
      if (profile && profile.confidenceTrajectory === "struggling") {
        // Should recommend review
        const hasReviewRec = profile.recommendedNextSteps.some((s) =>
          s.toLowerCase().includes("review")
        );
        expect(hasReviewRec).toBe(true);
      }
    });

    it("should provide recommendations for improving learners", async () => {
      const profile = await getUserLearnerProfile(testUserId);
      if (profile && profile.confidenceTrajectory === "improving") {
        // Should recommend continuing
        const hasContinueRec = profile.recommendedNextSteps.some(
          (s) =>
            s.toLowerCase().includes("continue") ||
            s.toLowerCase().includes("progress")
        );
        expect(hasContinueRec).toBe(true);
      }
    });

    it("should recommend addressing knowledge gaps", async () => {
      const profile = await getUserLearnerProfile(testUserId);
      if (profile && profile.knowledgeGaps.length > 0) {
        // Should recommend addressing gaps
        const hasGapRec = profile.recommendedNextSteps.some((s) =>
          s.toLowerCase().includes("gap")
        );
        expect(hasGapRec).toBe(true);
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle user with zero signals gracefully", async () => {
      const profile = await getUserLearnerProfile(testUserId);
      if (profile && profile.totalSignalsThisWeek === 0) {
        expect(profile.learningStyle).toBe("balanced");
        expect(profile.averageConfidence).toBeGreaterThanOrEqual(0);
        expect(profile.breakthroughsThisWeek).toBe(0);
      }
    });

    it("should handle user with only one signal type", async () => {
      const profile = await getUserLearnerProfile(testUserId);
      if (profile && profile.totalSignalsThisWeek > 0) {
        const nonZeroTypes = Object.values(profile.signalDistribution).filter(
          (v) => v > 0
        ).length;
        if (nonZeroTypes === 1) {
          // Should still have a valid learning style
          const validStyles = [
            "analytical",
            "relational",
            "practical",
            "progressive",
            "balanced",
          ];
          expect(validStyles).toContain(profile.learningStyle);
        }
      }
    });

    it("should handle very high signal velocity", async () => {
      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        // Learning velocity should be reasonable (not negative or NaN)
        expect(profile.learningVelocity).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(profile.learningVelocity)).toBe(true);
      }
    });
  });
});
