import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { callDataApi } from "./_core/dataApi";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Topics ───────────────────────────────────────────────────────────────
  topics: router({
    list: publicProcedure.query(async () => {
      return db.getAllTopics();
    }),
  }),

  // ─── Content Feed ─────────────────────────────────────────────────────────
  feed: router({
    get: publicProcedure
      .input(z.object({
        topicSlugs: z.array(z.string()).min(1),
        cursor: z.number().optional().default(0),
        limit: z.number().optional().default(10),
      }))
      .query(async ({ input }) => {
        const content = await db.getContentForTopics(input.topicSlugs, input.limit + input.cursor + 20);
        const sliced = content.slice(input.cursor, input.cursor + input.limit);
        return {
          items: sliced,
          nextCursor: sliced.length === input.limit ? input.cursor + input.limit : null,
        };
      }),

    // Fetch fresh content from YouTube for given topics
    refresh: publicProcedure
      .input(z.object({
        topicSlugs: z.array(z.string()).min(1).max(5),
      }))
      .mutation(async ({ input }) => {
        const topicRows = await db.getTopicsBySlugs(input.topicSlugs);
        let totalFetched = 0;

        for (const topic of topicRows) {
          try {
            const keywords = topic.searchKeywords || topic.name;
            const result = await callDataApi("Youtube/search", {
              query: { q: `${keywords} tutorial explained`, hl: "en", gl: "US" },
            }) as any;

            const contents = result?.contents || [];
            const items = contents
              .filter((c: any) => c.type === "video" && c.video)
              .slice(0, 8)
              .map((c: any) => {
                const v = c.video;
                const durationText = v.lengthText || "";
                let durationSeconds = 0;
                const parts = durationText.split(":").map(Number);
                if (parts.length === 3) durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                else if (parts.length === 2) durationSeconds = parts[0] * 60 + parts[1];
                else if (parts.length === 1) durationSeconds = parts[0];

                return {
                  externalId: v.videoId || `yt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  type: "video" as const,
                  title: v.title || "Untitled",
                  description: v.descriptionSnippet || v.title || "",
                  url: `https://www.youtube.com/watch?v=${v.videoId}`,
                  thumbnailUrl: v.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
                  source: "youtube",
                  channelOrAuthor: v.channelTitle || v.channelName || "Unknown",
                  durationSeconds,
                  topicSlug: topic.slug,
                  qualityScore: 0.5,
                  publishedAt: v.publishedTimeText || null,
                };
              });

            if (items.length > 0) {
              await db.upsertContentItems(items);
              totalFetched += items.length;
            }
          } catch (e) {
            console.error(`[Feed] Failed to fetch for topic ${topic.slug}:`, e);
          }
        }

        return { fetched: totalFetched };
      }),
  }),

  // ─── Quiz Generation ──────────────────────────────────────────────────────
  quiz: router({
    generate: publicProcedure
      .input(z.object({
        contentTitle: z.string(),
        contentDescription: z.string(),
        topicSlug: z.string(),
        topicEmoji: z.string().optional().default(""),
        difficulty: z.enum(["easy", "medium", "hard"]).optional().default("medium"),
      }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a quiz generator for a learning app. Generate a multiple-choice quiz question based on the given content. Return JSON with this exact structure:
{
  "question": "the question text",
  "options": ["option A", "option B", "option C", "option D"],
  "correctIndex": 0,
  "explanation": "brief explanation of the correct answer"
}
Difficulty: ${input.difficulty}. Make the question engaging and educational. The question should test understanding, not just recall.`,
              },
              {
                role: "user",
                content: `Generate a quiz question about: "${input.contentTitle}"\n\nContext: ${input.contentDescription}\n\nTopic: ${input.topicSlug}`,
              },
            ],
            response_format: { type: "json_object" },
          });

          const parsed = JSON.parse((response.choices[0].message.content as string) || "{}");
          return {
            id: `quiz-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            question: parsed.question || "What did you learn from this content?",
            options: parsed.options || ["Option A", "Option B", "Option C", "Option D"],
            correctIndex: parsed.correctIndex ?? 0,
            explanation: parsed.explanation || "Great question to reflect on!",
            relatedContentTitle: input.contentTitle,
            topicSlug: input.topicSlug,
            topicEmoji: input.topicEmoji,
            difficulty: input.difficulty,
          };
        } catch (e) {
          console.error("[Quiz] LLM generation failed:", e);
          return {
            id: `quiz-fallback-${Date.now()}`,
            question: `What is a key concept from "${input.contentTitle}"?`,
            options: [
              "The main idea discussed in the content",
              "An unrelated concept",
              "A common misconception",
              "None of the above",
            ],
            correctIndex: 0,
            explanation: "Reflect on the main takeaway from this content.",
            relatedContentTitle: input.contentTitle,
            topicSlug: input.topicSlug,
            topicEmoji: input.topicEmoji,
            difficulty: input.difficulty,
          };
        }
      }),
  }),

  // ─── Insight Generation ───────────────────────────────────────────────────
  insight: router({
    generate: publicProcedure
      .input(z.object({
        topicSlugs: z.array(z.string()).min(2),
      }))
      .mutation(async ({ input }) => {
        const topicRows = await db.getTopicsBySlugs(input.topicSlugs.slice(0, 2));
        if (topicRows.length < 2) {
          return {
            id: `insight-${Date.now()}`,
            title: "Connecting the Dots",
            body: "Learning across different subjects helps build stronger neural connections.",
            topicA: input.topicSlugs[0],
            topicB: input.topicSlugs[1],
            emojiA: "",
            emojiB: "",
          };
        }

        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You generate fascinating "Did you know?" insights that connect two different learning topics. Return JSON: { "title": "short catchy title", "body": "2-3 sentence insight connecting the two topics" }`,
              },
              {
                role: "user",
                content: `Connect these two topics with a fascinating insight:\n1. ${topicRows[0].name} (${topicRows[0].emoji})\n2. ${topicRows[1].name} (${topicRows[1].emoji})`,
              },
            ],
            response_format: { type: "json_object" },
          });

          const parsed = JSON.parse((response.choices[0].message.content as string) || "{}");
          return {
            id: `insight-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            title: parsed.title || "Connecting the Dots",
            body: parsed.body || "These topics share more in common than you might think!",
            topicA: topicRows[0].slug,
            topicB: topicRows[1].slug,
            emojiA: topicRows[0].emoji,
            emojiB: topicRows[1].emoji,
          };
        } catch (e) {
          return {
            id: `insight-fallback-${Date.now()}`,
            title: "Cross-Topic Connection",
            body: `${topicRows[0].name} and ${topicRows[1].name} share surprising connections that deepen your understanding of both.`,
            topicA: topicRows[0].slug,
            topicB: topicRows[1].slug,
            emojiA: topicRows[0].emoji,
            emojiB: topicRows[1].emoji,
          };
        }
      }),
  }),

  // ─── Search ───────────────────────────────────────────────────────────────
  search: router({
    query: publicProcedure
      .input(z.object({ q: z.string().min(1), limit: z.number().optional().default(20) }))
      .query(async ({ input }) => {
        try {
          return await db.searchContent(input.q, input.limit);
        } catch {
          // Fallback: simple LIKE search if FULLTEXT fails
          const dbInstance = await db.getDb();
          if (!dbInstance) return [];
          const { contentItems } = await import("../drizzle/schema");
          const { like } = await import("drizzle-orm");
          return dbInstance
            .select()
            .from(contentItems)
            .where(like(contentItems.title, `%${input.q}%`))
            .limit(input.limit);
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
