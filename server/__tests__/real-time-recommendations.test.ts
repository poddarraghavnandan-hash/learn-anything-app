import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  generatePersonalizedRecommendations,
  recommendNextConcept,
  recommendReviewTopics,
  recommendContentType,
  prioritizeRecommendations,
  PersonalizedRecommendation,
} from "../real-time-recommendations";
import * as learnerProfileModule from "../learner-profile";
import * as analyticsModule from "../learning-analytics";
import * as signalObserverModule from "../signal-observer";

// Mock dependencies
vi.mock("../learner-profile");
vi.mock("../learning-analytics");
vi.mock("../signal-observer");

describe("Real-Time Recommendations Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generatePersonalizedRecommendations", () => {
    it("should generate recommendations for knowledge gaps", async () => {
      const mockProfile = {
        userId: 1,
        learningStyle: "analytical" as const,
        learningVelocity: 2.5,
        confidenceTrajectory: "improving" as const,
        averageConfidence: 0.65,
        averageDepth: "intermediate" as const,
        breakthroughsThisWeek: 2,
        stuckPointsThisWeek: 1,
        totalSignalsThisWeek: 15,
        signalDistribution: { question: 5, teaching: 4, breakthrough: 3, stuck: 2, connection: 1 },
        topConceptsByConfidence: [
          { conceptId: 1, conceptName: "Closures", confidence: 0.85 },
          { conceptId: 2, conceptName: "Async/Await", confidence: 0.65 },
          { conceptId: 3, conceptName: "Promises", confidence: 0.45 },
        ],
        knowledgeGaps: [
          { conceptId: 4, conceptName: "Error Handling", reason: "stuck_signal" },
          { conceptId: 5, conceptName: "Testing", reason: "low_confidence" },
        ],
        recommendedNextSteps: ["Review error handling", "Practice testing"],
        lastUpdated: new Date(),
      };

      vi.mocked(learnerProfileModule.getUserLearnerProfile).mockResolvedValue(mockProfile);
      vi.mocked(signalObserverModule.getConceptSignals).mockResolvedValue([
        { id: 1, userId: 1, conceptId: 4, signalType: "stuck", contentHash: null, contentSummary: null, contentLength: 100, metadata: {}, timestamp: new Date() } as any,
        { id: 3, userId: 1, conceptId: 4, signalType: "stuck", contentHash: null, contentSummary: null, contentLength: 100, metadata: {}, timestamp: new Date() } as any,
        { id: 2, userId: 1, conceptId: 4, signalType: "stuck", contentHash: null, contentSummary: null, contentLength: 100, metadata: {}, timestamp: new Date() } as any,
      ]);

      const recommendations = await generatePersonalizedRecommendations(1, 10);

      expect(recommendations.length).toBeGreaterThan(0);
      const knowledgeGapRec = recommendations.find((r) => r.type === "knowledge_gap");
      expect(knowledgeGapRec).toBeDefined();
      expect(knowledgeGapRec?.priority).toBe("critical");
      expect(knowledgeGapRec?.reason).toContain("stuck_signal");
    });

    it("should include spaced repetition recommendations", async () => {
      const now = new Date();
      const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

      const mockProfile = {
        userId: 1,
        learningStyle: "relational" as const,
        learningVelocity: 2.0,
        confidenceTrajectory: "stable" as const,
        averageConfidence: 0.72,
        averageDepth: "intermediate" as const,
        breakthroughsThisWeek: 1,
        stuckPointsThisWeek: 0,
        totalSignalsThisWeek: 12,
        signalDistribution: { question: 4, teaching: 3, breakthrough: 1, stuck: 0, connection: 4 },
        topConceptsByConfidence: [
          { conceptId: 1, conceptName: "Closures", confidence: 0.8 },
          { conceptId: 2, conceptName: "Async/Await", confidence: 0.75 },
        ],
        knowledgeGaps: [],
        recommendedNextSteps: [],
        lastUpdated: new Date(),
      };

      vi.mocked(learnerProfileModule.getUserLearnerProfile).mockResolvedValue(mockProfile);
      vi.mocked(signalObserverModule.getConceptSignals).mockResolvedValue([
        { id: 1, userId: 1, conceptId: 1, signalType: "connection", contentHash: null, contentSummary: null, contentLength: 100, metadata: {}, timestamp: fourDaysAgo } as any,
      ]);

      const recommendations = await generatePersonalizedRecommendations(1, 10);

      // Should have spaced repetition recommendations since concepts have high confidence
      const spacedRepRec = recommendations.find((r) => r.type === "spaced_repetition");
      expect(spacedRepRec).toBeDefined();
      if (spacedRepRec) {
        expect(spacedRepRec.priority).toBe("medium");
      }
    });

    it("should include next concept recommendations for breakthrough momentum", async () => {
      const mockProfile = {
        userId: 1,
        learningStyle: "practical" as const,
        learningVelocity: 3.5,
        confidenceTrajectory: "improving" as const,
        averageConfidence: 0.8,
        averageDepth: "deep" as const,
        breakthroughsThisWeek: 3,
        stuckPointsThisWeek: 0,
        totalSignalsThisWeek: 20,
        signalDistribution: { question: 6, teaching: 5, breakthrough: 5, stuck: 0, connection: 4 },
        topConceptsByConfidence: [
          { conceptId: 1, conceptName: "Closures", confidence: 0.9 },
          { conceptId: 2, conceptName: "Async/Await", confidence: 0.85 },
        ],
        knowledgeGaps: [],
        recommendedNextSteps: [],
        lastUpdated: new Date(),
      };

      vi.mocked(learnerProfileModule.getUserLearnerProfile).mockResolvedValue(mockProfile);
      vi.mocked(signalObserverModule.getConceptSignals).mockResolvedValue([]);

      const recommendations = await generatePersonalizedRecommendations(1, 10);

      // Should have next concept recommendations due to breakthrough momentum
      const nextConceptRec = recommendations.find((r) => r.type === "next_concept");
      expect(nextConceptRec).toBeDefined();
      if (nextConceptRec) {
        expect(nextConceptRec.priority).toBe("high");
      }
    });

    it("should include challenge recommendations for high performers", async () => {
      const mockProfile = {
        userId: 1,
        learningStyle: "analytical" as const,
        learningVelocity: 4.0,
        confidenceTrajectory: "improving" as const,
        averageConfidence: 0.85,
        averageDepth: "deep" as const,
        breakthroughsThisWeek: 4,
        stuckPointsThisWeek: 0,
        totalSignalsThisWeek: 25,
        signalDistribution: { question: 8, teaching: 7, breakthrough: 6, stuck: 0, connection: 4 },
        topConceptsByConfidence: [
          { conceptId: 1, conceptName: "Closures", confidence: 0.95 },
          { conceptId: 2, conceptName: "Async/Await", confidence: 0.9 },
        ],
        knowledgeGaps: [],
        recommendedNextSteps: [],
        lastUpdated: new Date(),
      };

      vi.mocked(learnerProfileModule.getUserLearnerProfile).mockResolvedValue(mockProfile);
      vi.mocked(signalObserverModule.getConceptSignals).mockResolvedValue([]);

      const recommendations = await generatePersonalizedRecommendations(1, 10);

      // Should have challenge recommendations for high performers
      const challengeRec = recommendations.find((r) => r.type === "challenge");
      expect(challengeRec).toBeDefined();
      if (challengeRec) {
        expect(challengeRec.difficulty).toBe("expert");
        expect(challengeRec.engagementScore).toBeGreaterThan(0.85);
      }
    });

    it("should include reinforcement recommendations for low confidence", async () => {
      const mockProfile = {
        userId: 1,
        learningStyle: "relational" as const,
        learningVelocity: 1.5,
        confidenceTrajectory: "struggling" as const,
        averageConfidence: 0.35,
        averageDepth: "surface" as const,
        breakthroughsThisWeek: 0,
        stuckPointsThisWeek: 3,
        totalSignalsThisWeek: 8,
        signalDistribution: { question: 4, teaching: 2, breakthrough: 0, stuck: 2, connection: 0 },
        topConceptsByConfidence: [
          { conceptId: 1, conceptName: "Closures", confidence: 0.3 },
          { conceptId: 2, conceptName: "Async/Await", confidence: 0.25 },
        ],
        knowledgeGaps: [
          { conceptId: 1, conceptName: "Closures", reason: "low_confidence" },
        ],
        recommendedNextSteps: [],
        lastUpdated: new Date(),
      };

      vi.mocked(learnerProfileModule.getUserLearnerProfile).mockResolvedValue(mockProfile);
      vi.mocked(signalObserverModule.getConceptSignals).mockResolvedValue([]);

      const recommendations = await generatePersonalizedRecommendations(1, 10);

      // Should have reinforcement recommendations for low confidence concepts
      const reinforceRec = recommendations.find((r) => r.type === "reinforcement");
      expect(reinforceRec).toBeDefined();
      if (reinforceRec) {
        expect(reinforceRec.priority).toBe("high");
        expect(reinforceRec.difficulty).toBe("foundation");
      }
    });

    it("should return empty array if profile not found", async () => {
      vi.mocked(learnerProfileModule.getUserLearnerProfile).mockResolvedValue(null);

      const recommendations = await generatePersonalizedRecommendations(999, 10);

      expect(recommendations).toEqual([]);
    });

    it("should limit recommendations to requested count", async () => {
      const mockProfile = {
        userId: 1,
        learningStyle: "balanced" as const,
        learningVelocity: 2.5,
        confidenceTrajectory: "stable" as const,
        averageConfidence: 0.65,
        averageDepth: "intermediate" as const,
        breakthroughsThisWeek: 2,
        stuckPointsThisWeek: 1,
        totalSignalsThisWeek: 15,
        signalDistribution: { question: 5, teaching: 4, breakthrough: 3, stuck: 2, connection: 1 },
        topConceptsByConfidence: [
          { conceptId: 1, conceptName: "Closures", confidence: 0.85 },
          { conceptId: 2, conceptName: "Async/Await", confidence: 0.65 },
          { conceptId: 3, conceptName: "Promises", confidence: 0.45 },
        ],
        knowledgeGaps: [
          { conceptId: 4, conceptName: "Error Handling", reason: "stuck_signal" },
          { conceptId: 5, conceptName: "Testing", reason: "low_confidence" },
        ],
        recommendedNextSteps: [],
        lastUpdated: new Date(),
      };

      vi.mocked(learnerProfileModule.getUserLearnerProfile).mockResolvedValue(mockProfile);
      vi.mocked(signalObserverModule.getConceptSignals).mockResolvedValue([]);

      const recommendations = await generatePersonalizedRecommendations(1, 3);

      expect(recommendations.length).toBeLessThanOrEqual(3);
    });
  });

  describe("recommendNextConcept", () => {
    it("should recommend next concept if mastery is high", async () => {
      const mockProfile = {
        userId: 1,
        learningStyle: "analytical" as const,
        learningVelocity: 2.5,
        confidenceTrajectory: "improving" as const,
        averageConfidence: 0.75,
        averageDepth: "deep" as const,
        breakthroughsThisWeek: 2,
        stuckPointsThisWeek: 0,
        totalSignalsThisWeek: 15,
        signalDistribution: { question: 5, teaching: 4, breakthrough: 3, stuck: 0, connection: 3 },
        topConceptsByConfidence: [
          { conceptId: 1, conceptName: "Closures", confidence: 0.85 },
        ],
        knowledgeGaps: [],
        recommendedNextSteps: [],
        lastUpdated: new Date(),
      };

      vi.mocked(learnerProfileModule.getUserLearnerProfile).mockResolvedValue(mockProfile);

      const recommendation = await recommendNextConcept(1, 1);

      expect(recommendation).toBeDefined();
      expect(recommendation?.type).toBe("next_concept");
      expect(recommendation?.conceptId).toBe(2);
      expect(recommendation?.priority).toBe("high");
    });

    it("should not recommend next concept if mastery is low", async () => {
      const mockProfile = {
        userId: 1,
        learningStyle: "analytical" as const,
        learningVelocity: 1.5,
        confidenceTrajectory: "struggling" as const,
        averageConfidence: 0.35,
        averageDepth: "surface" as const,
        breakthroughsThisWeek: 0,
        stuckPointsThisWeek: 3,
        totalSignalsThisWeek: 8,
        signalDistribution: { question: 4, teaching: 2, breakthrough: 0, stuck: 2, connection: 0 },
        topConceptsByConfidence: [
          { conceptId: 1, conceptName: "Closures", confidence: 0.3 },
        ],
        knowledgeGaps: [],
        recommendedNextSteps: [],
        lastUpdated: new Date(),
      };

      vi.mocked(learnerProfileModule.getUserLearnerProfile).mockResolvedValue(mockProfile);

      const recommendation = await recommendNextConcept(1, 1);

      expect(recommendation).toBeNull();
    });

    it("should return null if profile not found", async () => {
      vi.mocked(learnerProfileModule.getUserLearnerProfile).mockResolvedValue(null);

      const recommendation = await recommendNextConcept(999, 1);

      expect(recommendation).toBeNull();
    });
  });

  describe("recommendReviewTopics", () => {
    it("should recommend topics due for spaced repetition", async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const mockProfile = {
        userId: 1,
        learningStyle: "relational" as const,
        learningVelocity: 2.0,
        confidenceTrajectory: "stable" as const,
        averageConfidence: 0.7,
        averageDepth: "intermediate" as const,
        breakthroughsThisWeek: 1,
        stuckPointsThisWeek: 0,
        totalSignalsThisWeek: 12,
        signalDistribution: { question: 4, teaching: 3, breakthrough: 1, stuck: 0, connection: 4 },
        topConceptsByConfidence: [
          { conceptId: 1, conceptName: "Closures", confidence: 0.8 },
          { conceptId: 2, conceptName: "Async/Await", confidence: 0.75 },
        ],
        knowledgeGaps: [],
        recommendedNextSteps: [],
        lastUpdated: new Date(),
      };

      vi.mocked(learnerProfileModule.getUserLearnerProfile).mockResolvedValue(mockProfile);
      vi.mocked(signalObserverModule.getConceptSignals)
        .mockResolvedValueOnce([{ id: 1, userId: 1, conceptId: 1, signalType: "connection", contentHash: null, contentSummary: null, contentLength: 100, metadata: {}, timestamp: sevenDaysAgo } as any])
        .mockResolvedValueOnce([{ id: 2, userId: 1, conceptId: 2, signalType: "connection", contentHash: null, contentSummary: null, contentLength: 100, metadata: {}, timestamp: new Date() } as any]);

      const recommendations = await recommendReviewTopics(1, 5);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].type).toBe("spaced_repetition");
    });

    it("should prioritize critical reviews (30+ days)", async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const mockProfile = {
        userId: 1,
        learningStyle: "analytical" as const,
        learningVelocity: 2.0,
        confidenceTrajectory: "stable" as const,
        averageConfidence: 0.7,
        averageDepth: "intermediate" as const,
        breakthroughsThisWeek: 0,
        stuckPointsThisWeek: 0,
        totalSignalsThisWeek: 10,
        signalDistribution: { question: 3, teaching: 3, breakthrough: 0, stuck: 0, connection: 4 },
        topConceptsByConfidence: [
          { conceptId: 1, conceptName: "Closures", confidence: 0.8 },
        ],
        knowledgeGaps: [],
        recommendedNextSteps: [],
        lastUpdated: new Date(),
      };

      vi.mocked(learnerProfileModule.getUserLearnerProfile).mockResolvedValue(mockProfile);
      vi.mocked(signalObserverModule.getConceptSignals).mockResolvedValue([
        { id: 1, userId: 1, conceptId: 1, signalType: "connection", contentHash: null, contentSummary: null, contentLength: 100, metadata: {}, timestamp: thirtyDaysAgo } as any,
      ]);

      const recommendations = await recommendReviewTopics(1, 5);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].priority).toBe("critical");
    });

    it("should return empty array if profile not found", async () => {
      vi.mocked(learnerProfileModule.getUserLearnerProfile).mockResolvedValue(null);

      const recommendations = await recommendReviewTopics(999, 5);

      expect(recommendations).toEqual([]);
    });
  });

  describe("recommendContentType", () => {
    it("should recommend article for analytical learners", async () => {
      const mockProfile = {
        userId: 1,
        learningStyle: "analytical" as const,
        learningVelocity: 2.5,
        confidenceTrajectory: "stable" as const,
        averageConfidence: 0.7,
        averageDepth: "intermediate" as const,
        breakthroughsThisWeek: 1,
        stuckPointsThisWeek: 0,
        totalSignalsThisWeek: 12,
        signalDistribution: { question: 4, teaching: 3, breakthrough: 1, stuck: 0, connection: 4 },
        topConceptsByConfidence: [],
        knowledgeGaps: [],
        recommendedNextSteps: [],
        lastUpdated: new Date(),
      };

      vi.mocked(learnerProfileModule.getUserLearnerProfile).mockResolvedValue(mockProfile);

      const contentTypes = await recommendContentType(1, 1);

      expect(contentTypes).toContain("article");
      expect(contentTypes).toContain("quiz");
    });

    it("should recommend video for relational learners", async () => {
      const mockProfile = {
        userId: 1,
        learningStyle: "relational" as const,
        learningVelocity: 2.5,
        confidenceTrajectory: "stable" as const,
        averageConfidence: 0.7,
        averageDepth: "intermediate" as const,
        breakthroughsThisWeek: 1,
        stuckPointsThisWeek: 0,
        totalSignalsThisWeek: 12,
        signalDistribution: { question: 4, teaching: 3, breakthrough: 1, stuck: 0, connection: 4 },
        topConceptsByConfidence: [],
        knowledgeGaps: [],
        recommendedNextSteps: [],
        lastUpdated: new Date(),
      };

      vi.mocked(learnerProfileModule.getUserLearnerProfile).mockResolvedValue(mockProfile);

      const contentTypes = await recommendContentType(1, 1);

      expect(contentTypes).toContain("video");
      expect(contentTypes).toContain("quiz");
    });

    it("should recommend interactive for practical learners", async () => {
      const mockProfile = {
        userId: 1,
        learningStyle: "practical" as const,
        learningVelocity: 2.5,
        confidenceTrajectory: "stable" as const,
        averageConfidence: 0.7,
        averageDepth: "intermediate" as const,
        breakthroughsThisWeek: 1,
        stuckPointsThisWeek: 0,
        totalSignalsThisWeek: 12,
        signalDistribution: { question: 4, teaching: 3, breakthrough: 1, stuck: 0, connection: 4 },
        topConceptsByConfidence: [],
        knowledgeGaps: [],
        recommendedNextSteps: [],
        lastUpdated: new Date(),
      };

      vi.mocked(learnerProfileModule.getUserLearnerProfile).mockResolvedValue(mockProfile);

      const contentTypes = await recommendContentType(1, 1);

      expect(contentTypes).toContain("interactive");
      expect(contentTypes).toContain("quiz");
    });

    it("should return default if profile not found", async () => {
      vi.mocked(learnerProfileModule.getUserLearnerProfile).mockResolvedValue(null);

      const contentTypes = await recommendContentType(999, 1);

      expect(contentTypes).toEqual(["video", "article"]);
    });
  });

  describe("prioritizeRecommendations", () => {
    it("should sort by priority (critical > high > medium > low)", () => {
      const recommendations: PersonalizedRecommendation[] = [
        {
          id: "1",
          conceptId: 1,
          conceptName: "Low Priority",
          type: "reinforcement",
          priority: "low",
          reason: "Test",
          estimatedTime: 10,
          successProbability: 0.8,
          engagementScore: 0.8,
          difficulty: "foundation",
          contentTypes: ["video"],
          timestamp: new Date(),
          expiresAt: new Date(),
        },
        {
          id: "2",
          conceptId: 2,
          conceptName: "Critical Priority",
          type: "knowledge_gap",
          priority: "critical",
          reason: "Test",
          estimatedTime: 10,
          successProbability: 0.8,
          engagementScore: 0.8,
          difficulty: "foundation",
          contentTypes: ["video"],
          timestamp: new Date(),
          expiresAt: new Date(),
        },
        {
          id: "3",
          conceptId: 3,
          conceptName: "Medium Priority",
          type: "spaced_repetition",
          priority: "medium",
          reason: "Test",
          estimatedTime: 10,
          successProbability: 0.8,
          engagementScore: 0.8,
          difficulty: "foundation",
          contentTypes: ["video"],
          timestamp: new Date(),
          expiresAt: new Date(),
        },
      ];

      const sorted = prioritizeRecommendations(recommendations);

      expect(sorted[0].priority).toBe("critical");
      expect(sorted[1].priority).toBe("medium");
      expect(sorted[2].priority).toBe("low");
    });

    it("should sort by engagement score within same priority", () => {
      const recommendations: PersonalizedRecommendation[] = [
        {
          id: "1",
          conceptId: 1,
          conceptName: "Low Engagement",
          type: "reinforcement",
          priority: "high",
          reason: "Test",
          estimatedTime: 10,
          successProbability: 0.8,
          engagementScore: 0.5,
          difficulty: "foundation",
          contentTypes: ["video"],
          timestamp: new Date(),
          expiresAt: new Date(),
        },
        {
          id: "2",
          conceptId: 2,
          conceptName: "High Engagement",
          type: "knowledge_gap",
          priority: "high",
          reason: "Test",
          estimatedTime: 10,
          successProbability: 0.8,
          engagementScore: 0.95,
          difficulty: "foundation",
          contentTypes: ["video"],
          timestamp: new Date(),
          expiresAt: new Date(),
        },
      ];

      const sorted = prioritizeRecommendations(recommendations);

      expect(sorted[0].engagementScore).toBe(0.95);
      expect(sorted[1].engagementScore).toBe(0.5);
    });
  });

  describe("Edge Cases", () => {
    it("should handle learner with no signals", async () => {
      const mockProfile = {
        userId: 1,
        learningStyle: "balanced" as const,
        learningVelocity: 0,
        confidenceTrajectory: "stable" as const,
        averageConfidence: 0,
        averageDepth: "surface" as const,
        breakthroughsThisWeek: 0,
        stuckPointsThisWeek: 0,
        totalSignalsThisWeek: 0,
        signalDistribution: {},
        topConceptsByConfidence: [],
        knowledgeGaps: [],
        recommendedNextSteps: [],
        lastUpdated: new Date(),
      };

      vi.mocked(learnerProfileModule.getUserLearnerProfile).mockResolvedValue(mockProfile);

      const recommendations = await generatePersonalizedRecommendations(1, 10);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it("should handle multiple concepts with same confidence", async () => {
      const mockProfile = {
        userId: 1,
        learningStyle: "analytical" as const,
        learningVelocity: 2.5,
        confidenceTrajectory: "stable" as const,
        averageConfidence: 0.7,
        averageDepth: "intermediate" as const,
        breakthroughsThisWeek: 2,
        stuckPointsThisWeek: 0,
        totalSignalsThisWeek: 15,
        signalDistribution: { question: 5, teaching: 4, breakthrough: 3, stuck: 0, connection: 3 },
        topConceptsByConfidence: [
          { conceptId: 1, conceptName: "Closures", confidence: 0.75 },
          { conceptId: 2, conceptName: "Async/Await", confidence: 0.75 },
          { conceptId: 3, conceptName: "Promises", confidence: 0.75 },
        ],
        knowledgeGaps: [],
        recommendedNextSteps: [],
        lastUpdated: new Date(),
      };

      vi.mocked(learnerProfileModule.getUserLearnerProfile).mockResolvedValue(mockProfile);
      vi.mocked(signalObserverModule.getConceptSignals).mockResolvedValue([]);

      const recommendations = await generatePersonalizedRecommendations(1, 10);

      expect(recommendations.length).toBeGreaterThan(0);
    });

    it("should handle very long recommendation list", async () => {
      const mockProfile = {
        userId: 1,
        learningStyle: "analytical" as const,
        learningVelocity: 2.5,
        confidenceTrajectory: "improving" as const,
        averageConfidence: 0.65,
        averageDepth: "intermediate" as const,
        breakthroughsThisWeek: 2,
        stuckPointsThisWeek: 1,
        totalSignalsThisWeek: 15,
        signalDistribution: { question: 5, teaching: 4, breakthrough: 3, stuck: 2, connection: 1 },
        topConceptsByConfidence: Array.from({ length: 20 }, (_, i) => ({
          conceptId: i + 1,
          conceptName: `Concept ${i + 1}`,
          confidence: 0.5 + Math.random() * 0.3,
        })),
        knowledgeGaps: [],
        recommendedNextSteps: [],
        lastUpdated: new Date(),
      };

      vi.mocked(learnerProfileModule.getUserLearnerProfile).mockResolvedValue(mockProfile);
      vi.mocked(signalObserverModule.getConceptSignals).mockResolvedValue([]);

      const recommendations = await generatePersonalizedRecommendations(1, 50);

      expect(recommendations.length).toBeLessThanOrEqual(50);
    });
  });
});
