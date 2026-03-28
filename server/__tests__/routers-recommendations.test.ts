import { describe, it, expect, beforeEach, vi } from "vitest";
import { recommendationsRouter } from "../routers-recommendations";
import * as realTimeRecommendations from "../real-time-recommendations";

vi.mock("../real-time-recommendations");

describe("Recommendations tRPC Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPersonalized", () => {
    it("should return personalized recommendations", async () => {
      const mockRecommendations = [
        {
          id: "rec-1",
          conceptId: 1,
          conceptName: "Closures",
          type: "knowledge_gap" as const,
          priority: "high" as const,
          reason: "Knowledge gap detected",
          estimatedTime: 15,
          successProbability: 0.65,
          engagementScore: 0.8,
          difficulty: "foundation" as const,
          contentTypes: ["video"],
          timestamp: new Date(),
          expiresAt: new Date(),
        },
      ];

      vi.mocked(
        realTimeRecommendations.generatePersonalizedRecommendations
      ).mockResolvedValue(mockRecommendations);

      const caller = recommendationsRouter.createCaller({
        user: { id: 1, email: "test@example.com" },
      } as any);

      const result = await caller.getPersonalized({ limit: 10 });

      expect(result).toEqual(mockRecommendations);
      expect(
        realTimeRecommendations.generatePersonalizedRecommendations
      ).toHaveBeenCalledWith(1, 10);
    });

    it("should filter by recommendation types", async () => {
      const mockRecommendations = [
        {
          id: "rec-1",
          conceptId: 1,
          conceptName: "Closures",
          type: "knowledge_gap" as const,
          priority: "high" as const,
          reason: "Knowledge gap detected",
          estimatedTime: 15,
          successProbability: 0.65,
          engagementScore: 0.8,
          difficulty: "foundation" as const,
          contentTypes: ["video"],
          timestamp: new Date(),
          expiresAt: new Date(),
        },
        {
          id: "rec-2",
          conceptId: 2,
          conceptName: "Async/Await",
          type: "spaced_repetition" as const,
          priority: "medium" as const,
          reason: "Time for review",
          estimatedTime: 10,
          successProbability: 0.8,
          engagementScore: 0.7,
          difficulty: "intermediate" as const,
          contentTypes: ["article"],
          timestamp: new Date(),
          expiresAt: new Date(),
        },
      ];

      vi.mocked(
        realTimeRecommendations.generatePersonalizedRecommendations
      ).mockResolvedValue(mockRecommendations);

      const caller = recommendationsRouter.createCaller({
        user: { id: 1, email: "test@example.com" },
      } as any);

      const result = await caller.getPersonalized({
        limit: 10,
        includeTypes: ["knowledge_gap"],
      });

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("knowledge_gap");
    });

    it("should throw error if user not authenticated", async () => {
      const caller = recommendationsRouter.createCaller({
        user: null,
      } as any);

      await expect(caller.getPersonalized({ limit: 10 })).rejects.toThrow();
    });
  });

  describe("getNextConcept", () => {
    it("should return next concept recommendation", async () => {
      const mockNextConcept = {
        id: "next-1",
        conceptId: 2,
        conceptName: "Advanced Closures",
        type: "next_concept" as const,
        priority: "high" as const,
        reason: "You've mastered Closures",
        estimatedTime: 40,
        successProbability: 0.7,
        engagementScore: 0.85,
        difficulty: "advanced" as const,
        contentTypes: ["video"],
        timestamp: new Date(),
        expiresAt: new Date(),
      };

      vi.mocked(
        realTimeRecommendations.recommendNextConcept
      ).mockResolvedValue(mockNextConcept);

      const caller = recommendationsRouter.createCaller({
        user: { id: 1, email: "test@example.com" },
      } as any);

      const result = await caller.getNextConcept({ conceptId: 1 });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockNextConcept);
    });

    it("should return empty array if no next concept", async () => {
      vi.mocked(
        realTimeRecommendations.recommendNextConcept
      ).mockResolvedValue(null);

      const caller = recommendationsRouter.createCaller({
        user: { id: 1, email: "test@example.com" },
      } as any);

      const result = await caller.getNextConcept({ conceptId: 1 });

      expect(result).toEqual([]);
    });
  });

  describe("getReviewTopics", () => {
    it("should return review topics for spaced repetition", async () => {
      const mockReviewTopics = [
        {
          id: "review-1",
          conceptId: 1,
          conceptName: "Closures",
          type: "spaced_repetition" as const,
          priority: "medium" as const,
          reason: "3 days since last review",
          estimatedTime: 10,
          successProbability: 0.8,
          engagementScore: 0.7,
          difficulty: "intermediate" as const,
          contentTypes: ["article"],
          timestamp: new Date(),
          expiresAt: new Date(),
        },
      ];

      vi.mocked(
        realTimeRecommendations.recommendReviewTopics
      ).mockResolvedValue(mockReviewTopics);

      const caller = recommendationsRouter.createCaller({
        user: { id: 1, email: "test@example.com" },
      } as any);

      const result = await caller.getReviewTopics({ limit: 5 });

      expect(result).toEqual(mockReviewTopics);
      expect(
        realTimeRecommendations.recommendReviewTopics
      ).toHaveBeenCalledWith(1, 5);
    });
  });

  describe("getContentType", () => {
    it("should return recommended content types", async () => {
      vi.mocked(
        realTimeRecommendations.recommendContentType
      ).mockResolvedValue(["video", "article", "quiz"]);

      const caller = recommendationsRouter.createCaller({
        user: { id: 1, email: "test@example.com" },
      } as any);

      const result = await caller.getContentType({ conceptId: 1 });

      expect(result.conceptId).toBe(1);
      expect(result.recommendedTypes).toEqual(["video", "article", "quiz"]);
      expect(result.reasoning).toBe("Based on your learning style");
    });
  });

  describe("getPrioritized", () => {
    it("should return prioritized recommendations", async () => {
      const mockRecommendations = [
        {
          id: "rec-1",
          conceptId: 1,
          conceptName: "Closures",
          type: "knowledge_gap" as const,
          priority: "critical" as const,
          reason: "Knowledge gap detected",
          estimatedTime: 15,
          successProbability: 0.65,
          engagementScore: 0.8,
          difficulty: "foundation" as const,
          contentTypes: ["video"],
          timestamp: new Date(),
          expiresAt: new Date(),
        },
      ];

      vi.mocked(
        realTimeRecommendations.generatePersonalizedRecommendations
      ).mockResolvedValue(mockRecommendations);

      vi.mocked(
        realTimeRecommendations.prioritizeRecommendations
      ).mockReturnValue(mockRecommendations);

      const caller = recommendationsRouter.createCaller({
        user: { id: 1, email: "test@example.com" },
      } as any);

      const result = await caller.getPrioritized({ limit: 10 });

      expect(result).toEqual(mockRecommendations);
      expect(
        realTimeRecommendations.prioritizeRecommendations
      ).toHaveBeenCalled();
    });
  });

  describe("getChallenges", () => {
    it("should return challenge recommendations for high performers", async () => {
      const mockRecommendations = [
        {
          id: "challenge-1",
          conceptId: 5,
          conceptName: "Advanced Patterns",
          type: "challenge" as const,
          priority: "high" as const,
          reason: "You're ready for advanced challenges",
          estimatedTime: 60,
          successProbability: 0.6,
          engagementScore: 0.9,
          difficulty: "expert" as const,
          contentTypes: ["project"],
          timestamp: new Date(),
          expiresAt: new Date(),
        },
      ];

      vi.mocked(
        realTimeRecommendations.generatePersonalizedRecommendations
      ).mockResolvedValue(mockRecommendations);

      const caller = recommendationsRouter.createCaller({
        user: { id: 1, email: "test@example.com" },
      } as any);

      const result = await caller.getChallenges({
        limit: 5,
        difficulty: "expert",
      });

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("challenge");
    });
  });

  describe("getReinforcement", () => {
    it("should return reinforcement recommendations for struggling concepts", async () => {
      const mockRecommendations = [
        {
          id: "reinforce-1",
          conceptId: 3,
          conceptName: "Promises",
          type: "reinforcement" as const,
          priority: "high" as const,
          reason: "Low confidence detected",
          estimatedTime: 20,
          successProbability: 0.7,
          engagementScore: 0.75,
          difficulty: "foundation" as const,
          contentTypes: ["video", "article"],
          timestamp: new Date(),
          expiresAt: new Date(),
        },
      ];

      vi.mocked(
        realTimeRecommendations.generatePersonalizedRecommendations
      ).mockResolvedValue(mockRecommendations);

      const caller = recommendationsRouter.createCaller({
        user: { id: 1, email: "test@example.com" },
      } as any);

      const result = await caller.getReinforcement({ limit: 5 });

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("reinforcement");
    });
  });

  describe("dismiss", () => {
    it("should dismiss a recommendation", async () => {
      const caller = recommendationsRouter.createCaller({
        user: { id: 1, email: "test@example.com" },
      } as any);

      const result = await caller.dismiss({
        recommendationId: "rec-1",
        reason: "already_know",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("accept", () => {
    it("should accept a recommendation", async () => {
      const caller = recommendationsRouter.createCaller({
        user: { id: 1, email: "test@example.com" },
      } as any);

      const result = await caller.accept({
        recommendationId: "rec-1",
        conceptId: 1,
      });

      expect(result.success).toBe(true);
      expect(result.conceptId).toBe(1);
    });
  });
});
