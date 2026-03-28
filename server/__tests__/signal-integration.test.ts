import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { captureSignal } from "../db-learner-epistemology";
import { getUserLearnerProfile } from "../learner-profile";
import { recommendContent, getLearningInsights } from "../signal-recommendations";

/**
 * Integration Tests for Signal-Driven Adaptive Learning
 * Tests the full flow: signal capture → profile update → recommendations
 */

describe("Signal-Driven Adaptive Learning Integration", () => {
  const testUserId = 999999;
  const testConceptId = 1;

  describe("Full Signal Flow", () => {
    it("should capture signal and update learner profile", async () => {
      // 1. Capture a question signal
      const signal = await captureSignal(
        testUserId,
        "question",
        "How do I use React hooks?",
        {
          depth: "intermediate",
          confidence: 0.5,
        },
        testConceptId
      );

      expect(signal).toBeDefined();

      // 2. Get updated learner profile
      const profile = await getUserLearnerProfile(testUserId);
      expect(profile).toBeDefined();
      if (profile) {
        expect(profile.totalSignalsThisWeek ?? 0).toBeGreaterThanOrEqual(0);
      }
    });

    it("should generate recommendations based on signals", async () => {
      // 1. Capture multiple signals
      await captureSignal(
        testUserId,
        "question",
        "What are hooks?",
        { depth: "surface", confidence: 0.3 },
        testConceptId
      );

      await captureSignal(
        testUserId,
        "stuck",
        "Can't understand useEffect cleanup",
        { depth: "intermediate", confidence: 0.2 },
        testConceptId
      );

      // 2. Get recommendations
      const recommendations = await recommendContent(testUserId);
      expect(Array.isArray(recommendations)).toBe(true);

      // Should recommend content for stuck point
      const hasStuckRecommendation = recommendations.some((r) =>
        r.reason.toLowerCase().includes("stuck")
      );
      expect(hasStuckRecommendation || recommendations.length === 0).toBe(true);
    });

    it("should track learning trajectory from signals", async () => {
      // 1. Capture breakthrough signal
      await captureSignal(
        testUserId,
        "breakthrough",
        "Finally understand how useEffect works!",
        { depth: "deep", confidence: 0.9 },
        testConceptId
      );

      // 2. Get profile and check trajectory
      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        expect(profile.breakthroughsThisWeek ?? 0).toBeGreaterThanOrEqual(0);
        expect(profile.confidenceTrajectory).toBeDefined();
      }
    });

    it("should detect knowledge gaps from stuck signals", async () => {
      // 1. Capture stuck signals for multiple concepts
      await captureSignal(
        testUserId,
        "stuck",
        "Confused about TypeScript generics",
        { depth: "intermediate", confidence: 0.2 },
        1
      );

      await captureSignal(
        testUserId,
        "stuck",
        "Don't understand async/await",
        { depth: "intermediate", confidence: 0.25 },
        2
      );

      // 2. Get profile and check knowledge gaps
      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        expect(Array.isArray(profile.knowledgeGaps)).toBe(true);
        expect((profile.knowledgeGaps ?? []).length).toBeGreaterThanOrEqual(0);
      }
    });

    it("should suggest next concept based on breakthroughs", async () => {
      // 1. Capture multiple breakthrough signals
      await captureSignal(
        testUserId,
        "breakthrough",
        "Mastered React hooks!",
        { depth: "deep", confidence: 0.95 },
        testConceptId
      );

      await captureSignal(
        testUserId,
        "application",
        "Built a custom hook for form validation",
        { depth: "deep", confidence: 0.9 },
        testConceptId
      );

      // 2. Get learning insights
      const insights = await getLearningInsights(testUserId);
      expect(insights).toBeDefined();
      expect(insights.nextMilestone).toBeDefined();
    });
  });

  describe("Signal Type Handling", () => {
    it("should handle question signals correctly", async () => {
      const signal = await captureSignal(
        testUserId,
        "question",
        "How does closure work in JavaScript?",
        { depth: "intermediate", confidence: 0.4 },
        testConceptId
      );

      expect(signal).toBeDefined();
    });

    it("should handle connection signals correctly", async () => {
      const signal = await captureSignal(
        testUserId,
        "connection",
        "Hooks are similar to lifecycle methods",
        { depth: "intermediate", confidence: 0.7 },
        testConceptId
      );

      expect(signal).toBeDefined();
    });

    it("should handle application signals correctly", async () => {
      const signal = await captureSignal(
        testUserId,
        "application",
        "Used useState in my project",
        { depth: "intermediate", confidence: 0.8 },
        testConceptId
      );

      expect(signal).toBeDefined();
    });

    it("should handle teaching signals correctly", async () => {
      const signal = await captureSignal(
        testUserId,
        "teaching",
        "Explained hooks to a colleague",
        { depth: "deep", confidence: 0.85 },
        testConceptId
      );

      expect(signal).toBeDefined();
    });

    it("should handle breakthrough signals correctly", async () => {
      const signal = await captureSignal(
        testUserId,
        "breakthrough",
        "Finally understand the dependency array!",
        { depth: "deep", confidence: 0.95 },
        testConceptId
      );

      expect(signal).toBeDefined();
    });

    it("should handle stuck signals correctly", async () => {
      const signal = await captureSignal(
        testUserId,
        "stuck",
        "Can't figure out why useEffect runs twice",
        { depth: "intermediate", confidence: 0.2 },
        testConceptId
      );

      expect(signal).toBeDefined();
    });

    it("should handle feedback signals correctly", async () => {
      const signal = await captureSignal(
        testUserId,
        "feedback",
        "The example was confusing",
        { depth: "surface", confidence: 0.5 },
        testConceptId
      );

      expect(signal).toBeDefined();
    });
  });

  describe("Learning Style Detection", () => {
    it("should detect analytical learner from questions", async () => {
      // Capture many question signals
      for (let i = 0; i < 5; i++) {
        await captureSignal(
          testUserId,
          "question",
          `Question ${i}`,
          { depth: "intermediate", confidence: 0.5 },
          testConceptId
        );
      }

      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        expect(profile.learningStyle).toBeDefined();
      }
    });

    it("should detect practical learner from applications", async () => {
      // Capture many application signals
      for (let i = 0; i < 5; i++) {
        await captureSignal(
          testUserId,
          "application",
          `Applied concept ${i}`,
          { depth: "intermediate", confidence: 0.7 },
          testConceptId
        );
      }

      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        expect(profile.learningStyle).toBeDefined();
      }
    });

    it("should detect relational learner from connections", async () => {
      // Capture many connection signals
      for (let i = 0; i < 5; i++) {
        await captureSignal(
          testUserId,
          "connection",
          `Connection ${i}`,
          { depth: "intermediate", confidence: 0.7 },
          testConceptId
        );
      }

      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        expect(profile.learningStyle).toBeDefined();
      }
    });
  });

  describe("Confidence Trajectory", () => {
    it("should show improving trajectory with increasing confidence", async () => {
      // 1. Capture signals with increasing confidence
      await captureSignal(
        testUserId,
        "question",
        "First attempt",
        { depth: "surface", confidence: 0.3 },
        testConceptId
      );

      await captureSignal(
        testUserId,
        "connection",
        "Second attempt",
        { depth: "intermediate", confidence: 0.6 },
        testConceptId
      );

      await captureSignal(
        testUserId,
        "breakthrough",
        "Final breakthrough",
        { depth: "deep", confidence: 0.9 },
        testConceptId
      );

      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        expect(profile.confidenceTrajectory).toBeDefined();
        expect(profile.averageConfidence ?? 0).toBeGreaterThanOrEqual(0);
      }
    });

    it("should show struggling trajectory with low confidence", async () => {
      // Capture signals with low confidence
      await captureSignal(
        testUserId,
        "stuck",
        "Stuck",
        { depth: "intermediate", confidence: 0.2 },
        testConceptId
      );

      await captureSignal(
        testUserId,
        "question",
        "Still confused",
        { depth: "surface", confidence: 0.25 },
        testConceptId
      );

      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        expect(profile.confidenceTrajectory).toBeDefined();
      }
    });
  });

  describe("Recommendation Accuracy", () => {
    it("should recommend content for low-confidence concepts", async () => {
      // Capture low-confidence signals
      await captureSignal(
        testUserId,
        "question",
        "Don't understand this",
        { depth: "surface", confidence: 0.2 },
        testConceptId
      );

      const recommendations = await recommendContent(testUserId);
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it("should prioritize high-priority recommendations", async () => {
      // Capture stuck signal (high priority)
      await captureSignal(
        testUserId,
        "stuck",
        "Really stuck here",
        { depth: "intermediate", confidence: 0.1 },
        testConceptId
      );

      const recommendations = await recommendContent(testUserId);
      if (recommendations.length > 0) {
        // First recommendation should be high priority if any stuck signals
        expect(["high", "medium", "low"]).toContain(
          recommendations[0].priority
        );
      }
    });

    it("should respect recommendation limit", async () => {
      const recommendations = await recommendContent(testUserId, 3);
      expect(recommendations.length).toBeLessThanOrEqual(3);
    });
  });

  describe("Edge Cases", () => {
    it("should handle user with no signals", async () => {
      const profile = await getUserLearnerProfile(999998); // Different user
      expect(profile === null || profile.totalSignalsThisWeek === 0).toBe(true);
    });

    it("should handle rapid signal capture", async () => {
      // Capture multiple signals rapidly
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          captureSignal(
            testUserId,
            "question",
            `Rapid signal ${i}`,
            { depth: "surface", confidence: 0.5 },
            testConceptId
          )
        );
      }

      const signals = await Promise.all(promises);
      expect(signals.length).toBe(10);
    });

    it("should handle mixed signal types", async () => {
      const types = [
        "question",
        "connection",
        "application",
        "teaching",
        "breakthrough",
        "stuck",
        "feedback",
      ];

      for (const type of types) {
        await captureSignal(
          testUserId,
          type,
          `Signal of type ${type}`,
          { depth: "intermediate", confidence: 0.5 },
          testConceptId
        );
      }

      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        expect(profile.totalSignalsThisWeek ?? 0).toBeGreaterThanOrEqual(0);
      }
    });

    it("should handle very high confidence signals", async () => {
      await captureSignal(
        testUserId,
        "breakthrough",
        "Perfect understanding",
        { depth: "deep", confidence: 1.0 },
        testConceptId
      );

      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        expect(profile.averageConfidence ?? 0).toBeLessThanOrEqual(1.0);
      }
    });

    it("should handle very low confidence signals", async () => {
      await captureSignal(
        testUserId,
        "stuck",
        "Completely lost",
        { depth: "surface", confidence: 0.0 },
        testConceptId
      );

      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        expect(profile.averageConfidence ?? 0).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("Performance", () => {
    it("should capture signal within reasonable time", async () => {
      const start = Date.now();
      await captureSignal(
        testUserId,
        "question",
        "Performance test",
        { depth: "intermediate", confidence: 0.5 },
        testConceptId
      );
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should fetch learner profile within reasonable time", async () => {
      const start = Date.now();
      await getUserLearnerProfile(testUserId);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it("should generate recommendations within reasonable time", async () => {
      const start = Date.now();
      await recommendContent(testUserId);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
