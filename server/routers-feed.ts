import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import type { FeedCardData } from "../components/feed-card";
import { getContentForTopics, getAllTopics } from "./db";

function getTimeOfDay(): "morning" | "midday" | "afternoon" | "evening" | "night" {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 14) return "midday";
  if (hour >= 14 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
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
      const { limit, topics } = input;
      
      const allTopics = await getAllTopics();
      const topicEmojiMap = new Map(allTopics.map(t => [t.slug, t.emoji]));
      
      let items = [];
      if (topics && topics.length > 0) {
        items = await getContentForTopics(topics, limit);
      } else {
        const defaultSlugs = allTopics.slice(0, 5).map(t => t.slug);
        items = await getContentForTopics(defaultSlugs, limit);
      }
      
      const cards: FeedCardData[] = items.map((item, index) => {
        return {
          id: `card-${item.type}-${item.id}`,
          type: item.type as "video" | "article",
          topic: allTopics.find(t => t.slug === item.topicSlug)?.name || item.topicSlug || "General",
          topicEmoji: item.topicSlug ? (topicEmojiMap.get(item.topicSlug) || "📖") : "📖",
          title: item.title,
          description: item.description || "",
          source: item.source,
          duration: item.durationSeconds ? Math.floor(item.durationSeconds / 60) : 0,
          imageUrl: item.thumbnailUrl || "",
          videoUrl: item.type === "video" ? item.url : undefined,
          articleUrl: item.type === "article" ? item.url : undefined,
        };
      });

      return {
        cards,
        total: cards.length,
        hasMore: cards.length === limit,
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
      const { limit } = input;
      const allTopics = await getAllTopics();
      const topicEmojiMap = new Map(allTopics.map(t => [t.slug, t.emoji]));
      const defaultSlugs = allTopics.slice(0, 5).map(t => t.slug);
      
      const items = await getContentForTopics(defaultSlugs, limit);
      
      const cards: FeedCardData[] = items.map((item) => {
        return {
          id: `card-${item.type}-${item.id}`,
          type: item.type as "video" | "article",
          topic: allTopics.find(t => t.slug === item.topicSlug)?.name || item.topicSlug || "General",
          topicEmoji: item.topicSlug ? (topicEmojiMap.get(item.topicSlug) || "📖") : "📖",
          title: item.title,
          description: item.description || "",
          source: item.source,
          duration: item.durationSeconds ? Math.floor(item.durationSeconds / 60) : 0,
          imageUrl: item.thumbnailUrl || "",
          videoUrl: item.type === "video" ? item.url : undefined,
          articleUrl: item.type === "article" ? item.url : undefined,
        };
      });

      return {
        cards,
        total: cards.length,
        hasMore: cards.length === limit,
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
      const { topicSlugs } = input;
      const allTopics = await getAllTopics();
      const topicEmojiMap = new Map(allTopics.map(t => [t.slug, t.emoji]));
      const items = await getContentForTopics(topicSlugs, 10);

      const cards: FeedCardData[] = items.map((item) => {
        return {
          id: `card-${item.type}-${item.id}`,
          type: item.type as "video" | "article",
          topic: allTopics.find(t => t.slug === item.topicSlug)?.name || item.topicSlug || "General",
          topicEmoji: item.topicSlug ? (topicEmojiMap.get(item.topicSlug) || "📖") : "📖",
          title: item.title,
          description: item.description || "",
          source: item.source,
          duration: item.durationSeconds ? Math.floor(item.durationSeconds / 60) : 0,
          imageUrl: item.thumbnailUrl || "",
          videoUrl: item.type === "video" ? item.url : undefined,
          articleUrl: item.type === "article" ? item.url : undefined,
        };
      });

      return {
        success: true,
        cards,
        refreshedAt: new Date().toISOString(),
      };
    }),
});
