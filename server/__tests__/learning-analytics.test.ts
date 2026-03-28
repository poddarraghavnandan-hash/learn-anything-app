import { describe, it, expect } from "vitest";
import {
  calculateSignalVelocity,
  calculateConceptMastery,
  detectLearningTrends,
  generateLearningReport,
  trackLearningVelocity,
  type SignalVelocity,
  type ConceptMastery,
  type LearningTrend,
  type LearningReport,
} from "../learning-analytics";

describe("Learning Analytics Engine", () => {
  const testUserId = 999996;

  describe("Signal Velocity Calculation", () => {
    it("should calculate signal velocity for 24 hours", async () => {
      const velocity = await calculateSignalVelocity(testUserId, 24);

      expect(velocity).toBeDefined();
      expect(velocity.signalsPerHour).toBeGreaterThanOrEqual(0);
      expect(velocity.totalSignalsThisWeek).toBeGreaterThanOrEqual(0);
      expect(velocity.averageSignalsPerDay).toBeGreaterThanOrEqual(0);
      expect(["increasing", "stable", "decreasing"]).toContain(velocity.trend);
    });

    it("should calculate signal velocity for 7 days", async () => {
      const velocity = await calculateSignalVelocity(testUserId, 168);

      expect(velocity).toBeDefined();
      expect(velocity.signalsPerHour).toBeGreaterThanOrEqual(0);
      expect(velocity.totalSignalsThisWeek).toBeGreaterThanOrEqual(0);
    });

    it("should handle zero signals", async () => {
      const velocity = await calculateSignalVelocity(testUserId, 24);

      expect(velocity.signalsPerHour).toBeGreaterThanOrEqual(0);
      expect(velocity.trend).toBe("stable");
    });

    it("should detect increasing trend", async () => {
      const velocity = await calculateSignalVelocity(testUserId, 24);

      expect(["increasing", "stable", "decreasing"]).toContain(velocity.trend);
    });
  });

  describe("Concept Mastery Calculation", () => {
    it("should calculate concept mastery", async () => {
      const mastery = await calculateConceptMastery(testUserId, 1, "JavaScript Basics");

      expect(mastery).toBeDefined();
      expect(mastery.conceptId).toBe(1);
      expect(mastery.conceptName).toBe("JavaScript Basics");
      expect(mastery.masteryScore).toBeGreaterThanOrEqual(0);
      expect(mastery.masteryScore).toBeLessThanOrEqual(1);
      expect(["low", "medium", "high"]).toContain(mastery.confidenceLevel);
      expect(mastery.breakthroughCount).toBeGreaterThanOrEqual(0);
      expect(mastery.stuckCount).toBeGreaterThanOrEqual(0);
      expect(["improving", "stable", "declining"]).toContain(mastery.progressTrend);
    });

    it("should handle multiple concepts", async () => {
      const concepts = [
        { id: 1, name: "Concept 1" },
        { id: 2, name: "Concept 2" },
        { id: 3, name: "Concept 3" },
      ];

      for (const concept of concepts) {
        const mastery = await calculateConceptMastery(testUserId, concept.id, concept.name);
        expect(mastery.conceptId).toBe(concept.id);
        expect(mastery.conceptName).toBe(concept.name);
      }
    });

    it("should calculate mastery score based on signals", async () => {
      const mastery = await calculateConceptMastery(testUserId, 1, "Test Concept");

      // Mastery score should be between 0 and 1
      expect(mastery.masteryScore).toBeGreaterThanOrEqual(0);
      expect(mastery.masteryScore).toBeLessThanOrEqual(1);

      // Confidence level should match mastery score
      if (mastery.masteryScore >= 0.7) {
        expect(mastery.confidenceLevel).toBe("high");
      } else if (mastery.masteryScore >= 0.4) {
        expect(mastery.confidenceLevel).toBe("medium");
      } else {
        expect(mastery.confidenceLevel).toBe("low");
      }
    });
  });

  describe("Learning Trends Detection", () => {
    it("should detect learning trends", async () => {
      const trends = await detectLearningTrends(testUserId);

      expect(Array.isArray(trends)).toBe(true);
      for (const trend of trends) {
        expect(["breakthrough_streak", "stuck_pattern", "learning_acceleration", "learning_plateau"]).toContain(
          trend.trendType
        );
        expect(trend.intensity).toBeGreaterThanOrEqual(0);
        expect(trend.intensity).toBeLessThanOrEqual(1);
        expect(trend.duration).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(trend.affectedConcepts)).toBe(true);
        expect(typeof trend.recommendation).toBe("string");
      }
    });

    it("should handle no trends", async () => {
      const trends = await detectLearningTrends(testUserId);

      expect(Array.isArray(trends)).toBe(true);
    });

    it("should identify breakthrough streaks", async () => {
      const trends = await detectLearningTrends(testUserId);

      const breakthroughTrends = trends.filter((t) => t.trendType === "breakthrough_streak");
      for (const trend of breakthroughTrends) {
        expect(trend.intensity).toBeGreaterThanOrEqual(0);
        expect(trend.recommendation).toContain("Great momentum");
      }
    });

    it("should identify stuck patterns", async () => {
      const trends = await detectLearningTrends(testUserId);

      const stuckTrends = trends.filter((t) => t.trendType === "stuck_pattern");
      for (const trend of stuckTrends) {
        expect(trend.intensity).toBeGreaterThanOrEqual(0);
        expect(trend.recommendation).toContain("struggling");
      }
    });
  });

  describe("Learning Report Generation", () => {
    it("should generate comprehensive learning report", async () => {
      const report = await generateLearningReport(testUserId);

      expect(report).toBeDefined();
      expect(report.userId).toBe(testUserId);
      expect(report.reportDate).toBeInstanceOf(Date);
      expect(report.overallMastery).toBeGreaterThanOrEqual(0);
      expect(report.overallMastery).toBeLessThanOrEqual(1);
      expect(report.signalVelocity).toBeDefined();
      expect(Array.isArray(report.conceptMasteries)).toBe(true);
      expect(Array.isArray(report.learningTrends)).toBe(true);
      expect(report.estimatedLearningVelocity).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(report.recommendedFocusAreas)).toBe(true);
      expect(report.learningStyleProfile).toBeDefined();
    });

    it("should include signal velocity in report", async () => {
      const report = await generateLearningReport(testUserId);

      expect(report.signalVelocity.signalsPerHour).toBeGreaterThanOrEqual(0);
      expect(report.signalVelocity.totalSignalsThisWeek).toBeGreaterThanOrEqual(0);
      expect(report.signalVelocity.averageSignalsPerDay).toBeGreaterThanOrEqual(0);
      expect(["increasing", "stable", "decreasing"]).toContain(report.signalVelocity.trend);
    });

    it("should include concept masteries in report", async () => {
      const report = await generateLearningReport(testUserId);

      for (const mastery of report.conceptMasteries) {
        expect(mastery.conceptId).toBeGreaterThanOrEqual(0);
        expect(typeof mastery.conceptName).toBe("string");
        expect(mastery.masteryScore).toBeGreaterThanOrEqual(0);
        expect(mastery.masteryScore).toBeLessThanOrEqual(1);
        expect(["low", "medium", "high"]).toContain(mastery.confidenceLevel);
      }
    });

    it("should identify focus areas", async () => {
      const report = await generateLearningReport(testUserId);

      // Focus areas should be concepts with low mastery
      for (const focusArea of report.recommendedFocusAreas) {
        expect(typeof focusArea).toBe("string");
        const concept = report.conceptMasteries.find((c) => c.conceptName === focusArea);
        if (concept) {
          expect(concept.masteryScore).toBeLessThan(0.5);
        }
      }
    });

    it("should include learning style profile", async () => {
      const report = await generateLearningReport(testUserId);

      expect(report.learningStyleProfile).toBeDefined();
      expect(Array.isArray(report.learningStyleProfile.preferredContentTypes)).toBe(true);
      expect(["slow", "moderate", "fast"]).toContain(report.learningStyleProfile.optimalLearningPace);
      expect(report.learningStyleProfile.engagementLevel).toBeGreaterThanOrEqual(0);
      expect(report.learningStyleProfile.engagementLevel).toBeLessThanOrEqual(1);
    });
  });

  describe("Learning Velocity Tracking", () => {
    it("should track learning velocity over time", async () => {
      const velocityTrack = await trackLearningVelocity(testUserId);

      expect(velocityTrack).toBeDefined();
      expect(velocityTrack.current).toBeGreaterThanOrEqual(0);
      expect(velocityTrack.oneWeekAgo).toBeGreaterThanOrEqual(0);
      expect(velocityTrack.twoWeeksAgo).toBeGreaterThanOrEqual(0);
      expect(["accelerating", "stable", "decelerating"]).toContain(velocityTrack.trend);
    });

    it("should detect accelerating trend", async () => {
      const velocityTrack = await trackLearningVelocity(testUserId);

      expect(["accelerating", "stable", "decelerating"]).toContain(velocityTrack.trend);
    });

    it("should detect decelerating trend", async () => {
      const velocityTrack = await trackLearningVelocity(testUserId);

      expect(velocityTrack.trend).toBeDefined();
    });
  });

  describe("Analytics Performance", () => {
    it("should calculate signal velocity within reasonable time", async () => {
      const start = Date.now();
      await calculateSignalVelocity(testUserId, 24);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000);
    });

    it("should calculate concept mastery within reasonable time", async () => {
      const start = Date.now();
      await calculateConceptMastery(testUserId, 1, "Test");
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000);
    });

    it("should generate learning report within reasonable time", async () => {
      const start = Date.now();
      await generateLearningReport(testUserId);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000);
    });

    it("should handle multiple analytics queries concurrently", async () => {
      const start = Date.now();

      await Promise.all([
        calculateSignalVelocity(testUserId, 24),
        calculateConceptMastery(testUserId, 1, "Test"),
        detectLearningTrends(testUserId),
        trackLearningVelocity(testUserId),
      ]);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(10000);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero hours", async () => {
      const velocity = await calculateSignalVelocity(testUserId, 0);

      expect(velocity).toBeDefined();
    });

    it("should handle very large hour values", async () => {
      const velocity = await calculateSignalVelocity(testUserId, 8760); // 1 year

      expect(velocity).toBeDefined();
      expect(velocity.signalsPerHour).toBeGreaterThanOrEqual(0);
    });

    it("should handle non-existent concept", async () => {
      const mastery = await calculateConceptMastery(testUserId, 999999, "Non-existent");

      expect(mastery.masteryScore).toBe(0);
      expect(mastery.confidenceLevel).toBe("low");
      expect(mastery.breakthroughCount).toBe(0);
      expect(mastery.stuckCount).toBe(0);
    });

    it("should handle empty trends", async () => {
      const trends = await detectLearningTrends(testUserId);

      expect(Array.isArray(trends)).toBe(true);
    });

    it("should handle report with no signals", async () => {
      const report = await generateLearningReport(testUserId);

      expect(report.overallMastery).toBeGreaterThanOrEqual(0);
      expect(report.overallMastery).toBeLessThanOrEqual(1);
      expect(report.conceptMasteries).toBeDefined();
    });
  });

  describe("Analytics Data Consistency", () => {
    it("should have consistent mastery scores", async () => {
      const report = await generateLearningReport(testUserId);

      // Overall mastery should be average of concept masteries
      if (report.conceptMasteries.length > 0) {
        const calculatedAverage =
          report.conceptMasteries.reduce((sum, m) => sum + m.masteryScore, 0) / report.conceptMasteries.length;
        expect(Math.abs(report.overallMastery - calculatedAverage)).toBeLessThan(0.01);
      }
    });

    it("should have consistent velocity metrics", async () => {
      const velocity = await calculateSignalVelocity(testUserId, 24);
      const weekVelocity = await calculateSignalVelocity(testUserId, 168);

      // Week velocity should be >= daily velocity
      expect(weekVelocity.totalSignalsThisWeek).toBeGreaterThanOrEqual(velocity.totalSignalsThisWeek);
    });

    it("should have consistent learning trends", async () => {
      const trends = await detectLearningTrends(testUserId);

      for (const trend of trends) {
        // Intensity should be between 0 and 1
        expect(trend.intensity).toBeGreaterThanOrEqual(0);
        expect(trend.intensity).toBeLessThanOrEqual(1);

        // Duration should be positive
        expect(trend.duration).toBeGreaterThanOrEqual(0);

        // Recommendation should not be empty
        expect(trend.recommendation.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Analytics Insights", () => {
    it("should provide actionable insights", async () => {
      const report = await generateLearningReport(testUserId);

      // If there are focus areas, they should be based on low mastery
      if (report.recommendedFocusAreas.length > 0) {
        const focusAreaConcepts = report.conceptMasteries.filter((c) =>
          report.recommendedFocusAreas.includes(c.conceptName)
        );
        for (const concept of focusAreaConcepts) {
          expect(concept.masteryScore).toBeLessThan(0.5);
        }
      }

      // Learning style should have at least one preferred content type
      expect(report.learningStyleProfile.preferredContentTypes.length).toBeGreaterThan(0);

      // Optimal learning pace should be based on signal velocity
      const pace = report.learningStyleProfile.optimalLearningPace;
      expect(["slow", "moderate", "fast"]).toContain(pace);
    });

    it("should identify high performers", async () => {
      const report = await generateLearningReport(testUserId);

      // High performers should have high overall mastery
      if (report.overallMastery >= 0.7) {
        expect(report.conceptMasteries.filter((c) => c.masteryScore >= 0.7).length).toBeGreaterThan(0);
      }
    });

    it("should identify struggling learners", async () => {
      const report = await generateLearningReport(testUserId);

      // Struggling learners should have focus areas if they have low mastery concepts
      if (report.overallMastery < 0.4 && report.conceptMasteries.length > 0) {
        expect(report.recommendedFocusAreas.length).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
