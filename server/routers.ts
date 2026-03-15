import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { callDataApi } from "./_core/dataApi";
import * as db from "./db";

// ─── LearnLM System Prompt (Google's 5 Pedagogical Principles) ─────────────
const LEARNLM_SYSTEM = `You are an expert learning tutor following these 5 evidence-based pedagogical principles:
1. INSPIRE ACTIVE LEARNING — Encourage practice and healthy struggle with timely feedback.
2. MANAGE COGNITIVE LOAD — Present relevant, well-structured info. One concept at a time.
3. ADAPT TO THE LEARNER — Dynamically adjust to the learner's level, goals, and needs.
4. STIMULATE CURIOSITY — Inspire engagement and intrinsic motivation.
5. DEEPEN METACOGNITION — Help the learner reflect on what they know and don't know.

Core belief: ANYONE can learn ANYTHING. Teaching must be fine-tuned to the individual.
Never gatekeep knowledge. Always scaffold. Meet the learner where they are.`;

function getLevelPrompt(skillLevel: string): string {
  switch (skillLevel) {
    case "beginner":
      return "The learner is a BEGINNER. Use simple everyday language. Explain with analogies a child could understand. No jargon. Short sentences. Think 'Explain Like I'm 5'.";
    case "intermediate":
      return "The learner has INTERMEDIATE knowledge. Use some technical terms but always define them. Build on foundational concepts they likely know.";
    case "advanced":
      return "The learner is ADVANCED. Use precise technical language. Go deep. Challenge them with nuance, edge cases, and connections to related fields.";
    default:
      return "Adapt your language to be clear and accessible.";
  }
}

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
        skillLevel: z.enum(["beginner", "intermediate", "advanced"]).optional().default("beginner"),
      }))
      .query(async ({ input }) => {
        const content = await db.getContentForTopics(input.topicSlugs, input.limit + input.cursor + 20);
        const sliced = content.slice(input.cursor, input.cursor + input.limit);
        return {
          items: sliced,
          nextCursor: sliced.length === input.limit ? input.cursor + input.limit : null,
        };
      }),

    refresh: publicProcedure
      .input(z.object({
        topicSlugs: z.array(z.string()).min(1).max(5),
        skillLevel: z.enum(["beginner", "intermediate", "advanced"]).optional().default("beginner"),
      }))
      .mutation(async ({ input }) => {
        const topicRows = await db.getTopicsBySlugs(input.topicSlugs);
        let totalFetched = 0;

        const levelModifier = input.skillLevel === "beginner"
          ? "for beginners explained simply easy to understand"
          : input.skillLevel === "intermediate"
          ? "tutorial explained step by step"
          : "advanced deep dive in-depth analysis";

        for (const topic of topicRows) {
          try {
            const keywords = topic.searchKeywords || topic.name;
            const searchQuery = `${keywords} ${levelModifier}`;

            const result = await callDataApi("Youtube/search", {
              query: { q: searchQuery, hl: "en", gl: "US" },
            }) as any;

            const contents = result?.contents || [];
            const items = contents
              .filter((c: any) => c.type === "video" && c.video)
              .slice(0, 10)
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

  // ─── Content Detail with LearnLM-powered Summary ─────────────────────────
  content: router({
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getContentById(input.id);
      }),

    summarize: publicProcedure
      .input(z.object({
        title: z.string(),
        description: z.string(),
        topicSlug: z.string(),
        skillLevel: z.enum(["beginner", "intermediate", "advanced"]).optional().default("beginner"),
      }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `${LEARNLM_SYSTEM}

${getLevelPrompt(input.skillLevel)}

You are summarizing a learning resource. Return JSON:
{
  "summary": "2-3 sentence summary adapted to the learner's level",
  "keyTakeaways": ["3-5 key things to remember, phrased as actionable insights"],
  "prerequisites": ["concepts the learner should know first"],
  "nextSteps": ["what to learn after this"],
  "difficulty": "beginner|intermediate|advanced",
  "whyItMatters": "1 sentence on why this knowledge is valuable in real life",
  "eli5": "Explain the core concept in 1 sentence a 5-year-old would understand"
}`,
              },
              {
                role: "user",
                content: `Summarize this learning content:\nTitle: ${input.title}\nDescription: ${input.description}\nTopic: ${input.topicSlug}`,
              },
            ],
            response_format: { type: "json_object" },
          });

          const parsed = JSON.parse((response.choices[0].message.content as string) || "{}");
          return {
            summary: parsed.summary || "No summary available.",
            keyTakeaways: parsed.keyTakeaways || [],
            prerequisites: parsed.prerequisites || [],
            nextSteps: parsed.nextSteps || [],
            difficulty: parsed.difficulty || input.skillLevel,
            whyItMatters: parsed.whyItMatters || "",
            eli5: parsed.eli5 || "",
          };
        } catch (e) {
          console.error("[Content] Summary generation failed:", e);
          return {
            summary: `Learn about ${input.title} — a great resource for ${input.topicSlug}.`,
            keyTakeaways: ["Watch the full content for key insights"],
            prerequisites: [],
            nextSteps: ["Explore more content on this topic"],
            difficulty: input.skillLevel,
            whyItMatters: "Every new concept you learn builds your understanding of the world.",
            eli5: "This teaches you something new and cool!",
          };
        }
      }),

    // "I don't understand" — re-explain at a simpler level
    simplify: publicProcedure
      .input(z.object({
        title: z.string(),
        description: z.string(),
        topicSlug: z.string(),
        currentLevel: z.enum(["beginner", "intermediate", "advanced"]),
      }))
      .mutation(async ({ input }) => {
        const simplerLevel = input.currentLevel === "advanced" ? "intermediate" : "beginner";
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `${LEARNLM_SYSTEM}

The learner said "I don't understand" about this content. They need a SIMPLER explanation.
${getLevelPrompt(simplerLevel)}

Return JSON:
{
  "explanation": "A clear, simple explanation of the core concept (3-5 sentences). Use analogies and everyday examples.",
  "analogy": "A real-world analogy that makes this concept click",
  "tryThis": "A simple exercise or thought experiment the learner can do right now to understand better"
}`,
              },
              {
                role: "user",
                content: `The learner doesn't understand: "${input.title}"\nContext: ${input.description}\nTopic: ${input.topicSlug}`,
              },
            ],
            response_format: { type: "json_object" },
          });

          const parsed = JSON.parse((response.choices[0].message.content as string) || "{}");
          return {
            explanation: parsed.explanation || "Let's break this down step by step...",
            analogy: parsed.analogy || "",
            tryThis: parsed.tryThis || "",
            simplerLevel,
          };
        } catch (e) {
          return {
            explanation: `Let's simplify "${input.title}": Start with the basics and build up from there. The key idea is to understand the fundamental concept before diving into details.`,
            analogy: "Think of it like building blocks — you need the bottom pieces before the top ones make sense.",
            tryThis: "Try explaining this concept to someone else in your own words.",
            simplerLevel,
          };
        }
      }),
  }),

  // ─── Quiz Generation (LearnLM-powered) ──────────────────────────────────
  quiz: router({
    generate: publicProcedure
      .input(z.object({
        contentTitle: z.string(),
        contentDescription: z.string(),
        topicSlug: z.string(),
        topicEmoji: z.string().optional().default(""),
        difficulty: z.enum(["easy", "medium", "hard"]).optional().default("medium"),
        skillLevel: z.enum(["beginner", "intermediate", "advanced"]).optional().default("beginner"),
      }))
      .mutation(async ({ input }) => {
        const difficultyGuide = input.difficulty === "easy"
          ? "Ask a simple factual question. Options should be clearly distinct. The learner should feel confident."
          : input.difficulty === "medium"
          ? "Ask a question requiring understanding, not just recall. Include plausible distractors. Healthy struggle."
          : "Ask a challenging question requiring deep understanding, application, or synthesis across concepts.";

        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `${LEARNLM_SYSTEM}

${getLevelPrompt(input.skillLevel)}

You are generating a quiz question. ${difficultyGuide}

CRITICAL RULES:
- The question MUST be directly about the content title and description
- The explanation MUST teach — explain WHY the answer is correct and what the learner should remember
- Include a "thinkAbout" prompt that encourages the learner to reflect before answering
- Make wrong options plausible but clearly wrong if you understand the concept

Return JSON:
{
  "question": "the question text",
  "thinkAbout": "A hint that encourages the learner to think before answering (e.g., 'Think about what happens when...')",
  "options": ["option A", "option B", "option C", "option D"],
  "correctIndex": 0,
  "explanation": "2-3 sentence explanation of WHY this is correct. Teach the concept, don't just state the answer.",
  "encouragement": "A brief encouraging message regardless of whether they got it right or wrong"
}`,
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
            thinkAbout: parsed.thinkAbout || "Take a moment to think about what you just learned.",
            options: parsed.options || ["Option A", "Option B", "Option C", "Option D"],
            correctIndex: parsed.correctIndex ?? 0,
            explanation: parsed.explanation || "Great question to reflect on!",
            encouragement: parsed.encouragement || "Every question you answer makes your brain stronger!",
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
            thinkAbout: "Think about the main idea discussed in this content.",
            options: [
              "The main idea discussed in the content",
              "An unrelated concept",
              "A common misconception",
              "None of the above",
            ],
            correctIndex: 0,
            explanation: "The main idea is always the most important takeaway. Focus on understanding the core concept before details.",
            encouragement: "Keep going — curiosity is the first step to mastery!",
            relatedContentTitle: input.contentTitle,
            topicSlug: input.topicSlug,
            topicEmoji: input.topicEmoji,
            difficulty: input.difficulty,
          };
        }
      }),

    generateBatch: publicProcedure
      .input(z.object({
        items: z.array(z.object({
          contentTitle: z.string(),
          contentDescription: z.string(),
          topicSlug: z.string(),
        })).min(1).max(5),
        skillLevel: z.enum(["beginner", "intermediate", "advanced"]).optional().default("beginner"),
      }))
      .mutation(async ({ input }) => {
        const itemDescriptions = input.items
          .map((item, i) => `${i + 1}. "${item.contentTitle}" - ${item.contentDescription}`)
          .join("\n");

        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `${LEARNLM_SYSTEM}

${getLevelPrompt(input.skillLevel)}

For each content item, generate one quiz question that tests UNDERSTANDING, not just recall.
Each question must be directly about its content.
Return JSON: { "quizzes": [{ "question": "...", "thinkAbout": "...", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "...", "encouragement": "..." }] }`,
              },
              {
                role: "user",
                content: `Generate quiz questions for these ${input.items.length} content items:\n${itemDescriptions}`,
              },
            ],
            response_format: { type: "json_object" },
          });

          const parsed = JSON.parse((response.choices[0].message.content as string) || '{"quizzes":[]}');
          const quizzes = (parsed.quizzes || []).map((q: any, i: number) => ({
            id: `quiz-batch-${Date.now()}-${i}`,
            question: q.question || "What did you learn?",
            thinkAbout: q.thinkAbout || "Think about what you just learned.",
            options: q.options || ["A", "B", "C", "D"],
            correctIndex: q.correctIndex ?? 0,
            explanation: q.explanation || "Keep learning!",
            encouragement: q.encouragement || "Great effort!",
            relatedContentTitle: input.items[i]?.contentTitle || "",
            topicSlug: input.items[i]?.topicSlug || "",
            difficulty: "medium" as const,
          }));
          return { quizzes };
        } catch {
          return { quizzes: [] };
        }
      }),
  }),

  // ─── Learning Path Generation ────────────────────────────────────────────
  learningPath: router({
    generate: publicProcedure
      .input(z.object({
        topicSlug: z.string(),
        topicName: z.string(),
        skillLevel: z.enum(["beginner", "intermediate", "advanced"]).optional().default("beginner"),
      }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `${LEARNLM_SYSTEM}

${getLevelPrompt(input.skillLevel)}

Generate a structured learning path for this topic. Break it into progressive steps from foundations to mastery.
Return JSON:
{
  "steps": [
    {
      "order": 1,
      "title": "Step title",
      "description": "What the learner will understand after this step",
      "searchQuery": "YouTube search query to find content for this step",
      "estimatedMinutes": 10
    }
  ],
  "totalEstimatedHours": 5,
  "encouragement": "A motivating message about learning this topic"
}
Generate 5-8 steps that progressively build knowledge. Each step should be achievable in one session.`,
              },
              {
                role: "user",
                content: `Create a learning path for: ${input.topicName} (${input.topicSlug})\nLearner level: ${input.skillLevel}`,
              },
            ],
            response_format: { type: "json_object" },
          });

          const parsed = JSON.parse((response.choices[0].message.content as string) || "{}");
          return {
            steps: parsed.steps || [],
            totalEstimatedHours: parsed.totalEstimatedHours || 0,
            encouragement: parsed.encouragement || "You've got this!",
          };
        } catch (e) {
          return {
            steps: [
              { order: 1, title: "Start with the basics", description: `Learn the fundamentals of ${input.topicName}`, searchQuery: `${input.topicName} for beginners`, estimatedMinutes: 15 },
              { order: 2, title: "Build your foundation", description: "Understand core concepts", searchQuery: `${input.topicName} core concepts explained`, estimatedMinutes: 20 },
              { order: 3, title: "Practice and apply", description: "Put your knowledge to work", searchQuery: `${input.topicName} practice exercises`, estimatedMinutes: 25 },
            ],
            totalEstimatedHours: 1,
            encouragement: `Anyone can learn ${input.topicName} — one step at a time!`,
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
                content: `${LEARNLM_SYSTEM}
Generate a fascinating "Did you know?" insight that connects two different learning topics. Make it genuinely surprising and educational.
Return JSON: { "title": "short catchy title", "body": "2-3 sentence insight connecting the two topics in a way that deepens understanding of both" }`,
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
