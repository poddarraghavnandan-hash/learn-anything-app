import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import type { FeedCardData } from "../components/feed-card";

function getTimeOfDay(): "morning" | "midday" | "afternoon" | "evening" | "night" {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 14) return "midday";
  if (hour >= 14 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function getContentTypeDistribution(count: number): Array<"video" | "article" | "quiz" | "review" | "insight"> {
  const distribution: Array<"video" | "article" | "quiz" | "review" | "insight"> = [];
  for (let i = 0; i < count; i++) {
    const rand = Math.random() * 100;
    if (rand < 40) distribution.push("video");
    else if (rand < 60) distribution.push("article");
    else if (rand < 80) distribution.push("quiz");
    else if (rand < 90) distribution.push("review");
    else distribution.push("insight");
  }
  return distribution;
}

function createMockFeedCard(type: "video" | "article" | "quiz" | "review" | "insight", index: number): FeedCardData {
  const topics = ["Physics", "Biology", "Computer Science", "History", "Mathematics", "Art"];
  const selectedTopic = topics[index % topics.length];
  const topicEmojis: Record<string, string> = {
    Physics: "🔬",
    Biology: "🧬",
    "Computer Science": "💻",
    History: "📚",
    Mathematics: "🔢",
    Art: "🎨",
  };

  const baseData = {
    id: `card-${type}-${index}`,
    type,
    topic: selectedTopic,
    topicEmoji: topicEmojis[selectedTopic] || "📖",
  };

  if (type === "video") {
    return {
      ...baseData,
      type: "video",
      title: `Understanding ${selectedTopic} - Concept ${index + 1}`,
      description: "A comprehensive introduction to key concepts.",
      source: "YouTube",
      duration: 8 + (index % 5),
      imageUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    };
  } else if (type === "article") {
    return {
      ...baseData,
      type: "article",
      title: `Deep Dive: ${selectedTopic} Fundamentals`,
      description: "An in-depth article exploring foundations.",
      source: "Medium",
      duration: 12 + (index % 8),
      imageUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      articleUrl: "https://medium.com",
    };
  } else if (type === "quiz") {
    return {
      ...baseData,
      type: "quiz",
      title: `Quiz: ${selectedTopic} Concepts`,
      question: `What is the primary concept of ${selectedTopic}?`,
      options: [
        "Option A - Correct answer",
        "Option B - Plausible distractor",
        "Option C - Another distractor",
        "Option D - Less likely option",
      ],
      correctAnswer: 0,
      explanation: "This is correct because it aligns with fundamental principles.",
    };
  } else if (type === "review") {
    return {
      ...baseData,
      type: "review",
      title: `Key principle: The relationship between concepts in ${selectedTopic}`,
      lastReviewDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      confidenceRating: 3,
    };
  } else {
    return {
      ...baseData,
      type: "insight",
      title: `How ${selectedTopic} connects to other fields`,
      description: "Exploring cross-disciplinary connections.",
      relatedTopics: ["Physics", "Mathematics", "Engineering"],
    };
  }
}

export const feedRouter = router({
  generateFeed: publicProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
        topics: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input }: any) => {
      const { limit: count, offset } = input;
      const types = getContentTypeDistribution(count);
      const cards: FeedCardData[] = types.map((type, index) => {
        return createMockFeedCard(type, index + offset);
      });

      return {
        cards,
        total: count,
        hasMore: count >= 20,
        timeOfDay: getTimeOfDay(),
      };
    }),

  getFeed: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(10),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input }: any) => {
      const { limit: count, offset } = input;
      const types = getContentTypeDistribution(count);
      const cards: FeedCardData[] = types.map((type, index) => {
        return createMockFeedCard(type, index + offset);
      });

      return {
        cards,
        total: count,
        hasMore: count >= 20,
        timeOfDay: getTimeOfDay(),
      };
    }),

  completeCard: publicProcedure
    .input(
      z.object({
        cardId: z.string(),
        timeSpent: z.number().optional(),
        reaction: z.enum(["mind_blown", "knew_this", "saved", "skipped"]).optional(),
      })
    )
    .mutation(async ({ input }: any) => {
      return {
        success: true,
        cardId: input.cardId,
        xpEarned: 10,
      };
    }),

  saveCard: publicProcedure
    .input(
      z.object({
        cardId: z.string(),
        collectionName: z.string().optional(),
      })
    )
    .mutation(async ({ input }: any) => {
      return {
        success: true,
        cardId: input.cardId,
        saved: true,
      };
    }),

  rateAnswer: publicProcedure
    .input(
      z.object({
        cardId: z.string(),
        answerIndex: z.number(),
        isCorrect: z.boolean(),
        timeSpent: z.number().optional(),
      })
    )
    .mutation(async ({ input }: any) => {
      const baseXP = input.isCorrect ? 25 : 5;
      const timeBonus = input.timeSpent ? Math.max(0, 30 - Math.floor(input.timeSpent / 1000)) : 0;
      const xpEarned = baseXP + timeBonus;

      return {
        success: true,
        cardId: input.cardId,
        xpEarned,
        isCorrect: input.isCorrect,
      };
    }),

  rateConfidence: publicProcedure
    .input(
      z.object({
        cardId: z.string(),
        rating: z.number().int().min(1).max(5),
      })
    )
    .mutation(async ({ input }: any) => {
      return {
        success: true,
        cardId: input.cardId,
        xpEarned: 15,
        rating: input.rating,
      };
    }),

  refresh: publicProcedure
    .input(
      z.object({
        topicSlugs: z.array(z.string()).min(1).max(5),
      })
    )
    .mutation(async ({ input }: any) => {
      const types = getContentTypeDistribution(10);
      const cards: FeedCardData[] = types.map((type, index) => {
        return createMockFeedCard(type, index);
      });

      return {
        success: true,
        cards,
        refreshedAt: new Date().toISOString(),
      };
    }),
});
