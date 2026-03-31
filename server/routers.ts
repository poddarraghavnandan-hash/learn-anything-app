import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { callDataApi } from "./_core/dataApi";
import * as db from "./db";
import { adaptiveRouter } from "./routers-adaptive";
import { contentRouter } from "./routers-content";
import { chatRouter } from "./routers-chat";
import { integrationRouter } from "./routers-integration";
import { spacedRepetitionRouter } from "./routers-spaced-repetition";
import { signalObserverRouter } from "./routes/signal-observer";
import { learnerProfileRouter } from "./routes/learner-profile";
import { recommendationsRouter } from "./routers-recommendations";
import { notificationsRouter } from "./routers-notifications";
import { feedRouter } from "./routers-feed";
import { adaptiveLearningRouter } from "./routers-adaptive-learning";
import { claudeContentRouter } from "./routers-claude-content";
import { geminiContentRouter } from "./routers-gemini-content";

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

// Helper to fetch YouTube videos for a specific search query and save to DB
async function fetchYouTubeForQuery(searchQuery: string, topicSlug: string, maxResults: number = 10) {
  try {
    const result = await callDataApi("Youtube/search", {
      query: { q: searchQuery, hl: "en", gl: "US" },
    }) as any;

    const contents = result?.contents || [];
    const items = contents
      .filter((c: any) => c.type === "video" && c.video)
      .slice(0, maxResults)
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
          topicSlug,
          qualityScore: 0.5,
          publishedAt: v.publishedTimeText || null,
        };
      });

    if (items.length > 0) {
      await db.upsertContentItems(items);
    }
    return items;
  } catch (e) {
    console.error(`[YouTube] Failed to fetch for query "${searchQuery}":`, e);
    return [];
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
  // feed: feedRouter,  // Replaced with new feed router
  feed: feedRouter,
  feedLegacy: router({
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
          const keywords = topic.searchKeywords || topic.name;
          const searchQuery = `${keywords} ${levelModifier}`;
          const items = await fetchYouTubeForQuery(searchQuery, topic.slug, 10);
          totalFetched += items.length;
        }

        return { fetched: totalFetched };
      }),

    // NEW: Fetch content for a specific learning ladder step
    refreshForStep: publicProcedure
      .input(z.object({
        topicSlug: z.string(),
        stepSearchQuery: z.string(),
        stepTitle: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Use the step-specific search query from the learning ladder
        const items = await fetchYouTubeForQuery(input.stepSearchQuery, input.topicSlug, 8);
        return {
          fetched: items.length,
          items: items.map((item: any) => ({
            id: 0, // Will be assigned by DB
            externalId: item.externalId,
            type: item.type,
            title: item.title,
            description: item.description,
            url: item.url,
            thumbnailUrl: item.thumbnailUrl,
            source: item.source,
            channelOrAuthor: item.channelOrAuthor,
            durationSeconds: item.durationSeconds,
            topicSlug: item.topicSlug,
            publishedAt: item.publishedAt,
          })),
        };
      }),
  }),

  // ─── Curiosity Check — Fun Baseline Assessment ────────────────────────────
  curiosityCheck: router({
    generate: publicProcedure
      .input(z.object({
        topicSlug: z.string(),
        topicName: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `${LEARNLM_SYSTEM}

You are creating a fun "Curiosity Check" — a game-show-style quiz that discovers what a learner already knows about a topic. This is NOT a test. It's a playful exploration.

CRITICAL RULES:
- Generate exactly 5 questions that range from very easy (common knowledge) to hard (expert level)
- Each question should feel like a fun trivia game, NOT a school exam
- Use engaging, conversational language
- Every question MUST have a fun fact that's revealed after answering (regardless of right/wrong)
- The fun fact should make the learner go "wow, that's cool!" and want to learn more
- Questions should progressively reveal what the learner knows
- Emojis should match the vibe of each question

Question difficulty progression:
1. Very Easy — Something almost anyone would know (common sense level)
2. Easy — Basic knowledge about the topic
3. Medium — Requires some familiarity with the subject
4. Hard — Requires real knowledge of the field
5. Expert — Only someone who has studied this would know

Return JSON:
{
  "questions": [
    {
      "question": "Fun, conversational question text",
      "options": ["option A", "option B", "option C", "option D"],
      "correctIndex": 0,
      "difficulty": "easy|medium|hard",
      "funFact": "A genuinely surprising and delightful fact related to this question",
      "emoji": "relevant emoji"
    }
  ],
  "topicIntro": "A 1-sentence exciting intro to this topic that makes the learner curious"
}`,
              },
              {
                role: "user",
                content: `Create a Curiosity Check for the topic: ${input.topicName} (${input.topicSlug})`,
              },
            ],
            response_format: { type: "json_object" },
          });

          const parsed = JSON.parse((response.choices[0].message.content as string) || "{}");
          return {
            questions: (parsed.questions || []).slice(0, 5).map((q: any) => ({
              question: q.question || "What do you know about this topic?",
              options: q.options || ["A", "B", "C", "D"],
              correctIndex: q.correctIndex ?? 0,
              difficulty: q.difficulty || "medium",
              funFact: q.funFact || "Every expert was once a beginner!",
              emoji: q.emoji || "🧠",
            })),
            topicIntro: parsed.topicIntro || `Let's explore ${input.topicName} together!`,
          };
        } catch (e) {
          console.error("[CuriosityCheck] LLM generation failed:", e);
          // Fallback questions
          return {
            questions: [
              { question: `What interests you most about ${input.topicName}?`, options: ["The basics", "How it works", "Real-world applications", "Advanced concepts"], correctIndex: 0, difficulty: "easy" as const, funFact: `${input.topicName} is one of the most fascinating subjects to explore!`, emoji: "🌟" },
              { question: `How would you rate your familiarity with ${input.topicName}?`, options: ["Brand new to me", "I've heard of it", "I know some basics", "I'm quite familiar"], correctIndex: 0, difficulty: "easy" as const, funFact: "Research shows that just being curious about a topic makes you learn it faster!", emoji: "🧠" },
              { question: `What's the best way to start learning ${input.topicName}?`, options: ["Watch videos", "Read articles", "Practice exercises", "All of the above"], correctIndex: 3, difficulty: "medium" as const, funFact: "Studies show that mixing different learning methods (multimodal learning) improves retention by up to 75%!", emoji: "📚" },
            ],
            topicIntro: `Let's discover what you already know about ${input.topicName}!`,
          };
        }
      }),
  }),

  // ─── Learning Ladder Generation (Enhanced) ────────────────────────────────
  learningPath: router({
    generate: publicProcedure
      .input(z.object({
        topicSlug: z.string(),
        topicName: z.string(),
        skillLevel: z.enum(["beginner", "intermediate", "advanced"]).optional().default("beginner"),
        startingStep: z.number().optional().default(0),
      }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `${LEARNLM_SYSTEM}

${getLevelPrompt(input.skillLevel)}

You are generating a STRUCTURED LEARNING LADDER — a real curriculum that takes a learner from their current level to mastery. This is NOT a random list. It's a carefully scaffolded progression where each step builds on the previous one.

CRITICAL RULES:
- Generate 6-10 steps that form a REAL prerequisite chain
- Each step MUST have a specific YouTube search query that will find relevant educational content
- The search queries must be SPECIFIC (e.g., "Newton's laws of motion explained" NOT just "physics")
- Each step must explain WHY it matters and how it connects to the next step
- Include prerequisites — what the learner should understand before this step
- Estimate realistic time for each step (10-30 minutes)
- The progression should feel natural and achievable
- For beginners: start with absolute fundamentals, use everyday language
- For advanced: skip basics, focus on deeper concepts and connections

EXAMPLES of good progressions:
- Physics: Classical Mechanics → Energy & Work → Waves & Sound → Electricity → Magnetism → Optics → Quantum Basics → Relativity
- Reading: Letter Recognition → Phonics → Sight Words → Simple Sentences → Short Stories → Chapter Books
- Programming: Variables → Conditionals → Loops → Functions → Data Structures → Algorithms

Return JSON:
{
  "steps": [
    {
      "order": 1,
      "title": "Clear, specific step title",
      "description": "What the learner will understand after completing this step (2-3 sentences)",
      "whyItMatters": "Why this step is important and how it connects to the bigger picture",
      "searchQuery": "Specific YouTube search query for this exact concept",
      "estimatedMinutes": 15,
      "prerequisites": ["concept 1", "concept 2"]
    }
  ],
  "totalEstimatedHours": 5,
  "encouragement": "A genuinely motivating message about learning this topic — reference the core belief that anyone can learn anything"
}`,
              },
              {
                role: "user",
                content: `Create a learning ladder for: ${input.topicName} (${input.topicSlug})
Learner level: ${input.skillLevel}
${input.startingStep > 0 ? `The learner already knows the basics (starting from step ${input.startingStep + 1}). Skip foundational content they already understand.` : "Start from the very beginning — assume no prior knowledge."}`,
              },
            ],
            response_format: { type: "json_object" },
          });

          const parsed = JSON.parse((response.choices[0].message.content as string) || "{}");
          return {
            steps: (parsed.steps || []).map((s: any, i: number) => ({
              order: s.order || i + 1,
              title: s.title || `Step ${i + 1}`,
              description: s.description || "Learn this concept",
              whyItMatters: s.whyItMatters || "Every concept builds your understanding",
              searchQuery: s.searchQuery || `${input.topicName} ${s.title || "basics"}`,
              estimatedMinutes: s.estimatedMinutes || 15,
              prerequisites: s.prerequisites || [],
            })),
            totalEstimatedHours: parsed.totalEstimatedHours || 0,
            encouragement: parsed.encouragement || `Anyone can learn ${input.topicName} — one step at a time!`,
          };
        } catch (e) {
          console.error("[LearningPath] LLM generation failed:", e);
          return {
            steps: [
              { order: 1, title: "Start with the basics", description: `Learn the fundamentals of ${input.topicName}. Every expert started here.`, whyItMatters: "A strong foundation makes everything else easier to understand.", searchQuery: `${input.topicName} for beginners introduction`, estimatedMinutes: 15, prerequisites: [] },
              { order: 2, title: "Core concepts", description: `Understand the key ideas that make ${input.topicName} work.`, whyItMatters: "These are the building blocks you'll use for everything else.", searchQuery: `${input.topicName} core concepts explained simply`, estimatedMinutes: 20, prerequisites: ["basics"] },
              { order: 3, title: "Deeper understanding", description: "Connect the dots between concepts and see the bigger picture.", whyItMatters: "This is where real understanding begins — not just memorization.", searchQuery: `${input.topicName} how it works in depth`, estimatedMinutes: 20, prerequisites: ["core concepts"] },
              { order: 4, title: "Real-world applications", description: `See how ${input.topicName} applies to the real world.`, whyItMatters: "Understanding real applications makes abstract concepts concrete.", searchQuery: `${input.topicName} real world applications examples`, estimatedMinutes: 25, prerequisites: ["deeper understanding"] },
              { order: 5, title: "Advanced topics", description: "Explore the cutting edge and challenge yourself.", whyItMatters: "This is where you go from knowing to truly understanding.", searchQuery: `${input.topicName} advanced topics explained`, estimatedMinutes: 30, prerequisites: ["real-world applications"] },
            ],
            totalEstimatedHours: 2,
            encouragement: `Anyone can learn ${input.topicName} — one step at a time! The variable is time, not talent.`,
          };
        }
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
            explanation: `Let's simplify "${input.title}": Start with the basics and build up from there.`,
            analogy: "Think of it like building with blocks — you need the bottom ones before you can stack higher.",
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
- The explanation MUST teach — explain WHY the answer is correct, what the learner should remember, and why wrong answers are tempting
- Include a "thinkAbout" prompt that encourages reflection before answering
- Make wrong options plausible but clearly wrong if you understand the concept
- Vary question types: multiple choice, application scenarios, "what would happen if", comparison questions
- For wrong answers, provide brief educational feedback explaining the misconception

Return JSON:
{
  "question": "the question text",
  "thinkAbout": "A hint that encourages the learner to think before answering",
  "options": ["option A", "option B", "option C", "option D"],
  "correctIndex": 0,
    "explanation": "2-3 sentence explanation of the quiz question. Teach the concept.",
  "encouragement": "A brief encouraging message regardless of whether they got it right or wrong",
  "wrongAnswerFeedback": "Brief explanation of why the wrong answers are tempting misconceptions"
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
            explanation: "The main idea is always the most important takeaway.",
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
Generate a fascinating "Did you know?" insight that connects two different learning topics.
Return JSON: { "title": "short catchy title", "body": "2-3 sentence insight connecting the two topics" }`,
              },
              {
                role: "user",
                content: `Connect these two topics:\n1. ${topicRows[0].name} (${topicRows[0].emoji})\n2. ${topicRows[1].name} (${topicRows[1].emoji})`,
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
            body: `${topicRows[0].name} and ${topicRows[1].name} share surprising connections.`,
            topicA: topicRows[0].slug,
            topicB: topicRows[1].slug,
            emojiA: topicRows[0].emoji,
            emojiB: topicRows[1].emoji,
          };
        }
      }),
  }),

  // ─── Conversational AI Chat ──────────────────────────────────────────────
  chat: router({
    // ─── Learning Journey: Structured progressive learning stages ─────────
    // Replaces the old chat.ask with a guided learning strategy
    learn: publicProcedure
      .input(z.object({
        question: z.string().min(1),
        skillLevel: z.enum(["beginner", "intermediate", "advanced"]).optional().default("beginner"),
        difficultyLevel: z.number().min(1).max(5).optional().default(1),
        difficultyLabel: z.string().optional().default("Curious Beginner"),
        learnerModel: z.object({
          preferredPace: z.enum(["quick", "moderate", "deep"]).optional(),
          preferredTone: z.enum(["casual", "balanced", "formal"]).optional(),
          preferredDepth: z.enum(["overview", "detailed", "expert"]).optional(),
          strengthAreas: z.array(z.string()).optional(),
          confusionPoints: z.array(z.string()).optional(),
          conceptConfidence: z.record(z.string(), z.number()).optional(),
          realWorldConnections: z.array(z.string()).optional(),
          learningStyle: z.enum(["visual", "verbal", "kinesthetic", "mixed"]).optional(),
          explainSimplerCount: z.number().optional(),
          questionsAsked: z.number().optional(),
        }).optional().default({}),
        pastConversations: z.array(z.object({
          question: z.string(),
          concepts: z.array(z.string()),
          timestamp: z.string(),
        })).optional().default([]),
        priorKnowledgeContext: z.string().optional().default(""),
      }))
      .mutation(async ({ input }) => {
        try {
          const lm = input.learnerModel;
          const diffLevel = input.difficultyLevel;

          const pastConvContext = input.pastConversations.length > 0
            ? `\nPAST LEARNING JOURNEYS:\n${input.pastConversations.slice(-5).map(pc => `- Explored "${pc.question}" → concepts: ${pc.concepts.join(", ")}`).join("\n")}\nReference past explorations naturally when there's a genuine connection.`
            : "";

          const priorKnowledgeInfo = input.priorKnowledgeContext
            ? `\nPRIOR KNOWLEDGE ASSESSMENT (just completed):\n${input.priorKnowledgeContext}\nIMPORTANT: Use this prior knowledge assessment to calibrate your response. If they know the basics, keep Foundation very brief. If they're new to this, give more Foundation context. Match vocabulary to their demonstrated level.`
            : "";

          const learnerContext = [
            lm.strengthAreas?.length ? `Strengths: ${lm.strengthAreas.join(", ")}` : "",
            lm.confusionPoints?.length ? `Has struggled with: ${lm.confusionPoints.join(", ")} — approach these gently` : "",
            lm.realWorldConnections?.length ? `Analogies that resonated: ${lm.realWorldConnections.slice(-3).join("; ")}` : "",
            lm.preferredPace ? `Preferred pace: ${lm.preferredPace}` : "",
            lm.preferredDepth ? `Preferred depth: ${lm.preferredDepth}` : "",
            lm.learningStyle ? `Learning style: ${lm.learningStyle}` : "",
            (lm.explainSimplerCount || 0) > 2 ? "This learner often needs simpler explanations — default to very clear, simple language" : "",
            pastConvContext,
            priorKnowledgeInfo,
          ].filter(Boolean).join("\n");

          // Import adaptive difficulty prompt
          const { getDifficultyPrompt } = await import("../shared/types.js");
          const adaptiveDifficultyInstructions = getDifficultyPrompt(diffLevel);

          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `${LEARNLM_SYSTEM}

${adaptiveDifficultyInstructions}

You are designing a LEARNING JOURNEY — a structured, progressive experience that takes a learner from curiosity to understanding. This is NOT a chat response. It's a guided learning strategy.

${learnerContext ? `ABOUT THIS LEARNER:\n${learnerContext}` : "This is a new learner — be warm and welcoming."}

You must create a sequence of STAGES that build understanding progressively. Each stage has a specific purpose:

1. HOOK (required) — Start with something that sparks curiosity. A surprising fact, a counterintuitive question, or a "did you know" that makes them WANT to learn. This should be short (1-2 sentences) and punchy. Make them go "wait, really?"

2. FOUNDATION (required) — "Before we dive in, here's what you need to know." Give the prerequisite context in simple terms. If the learner already knows this (based on their model), keep it very brief. 2-3 sentences max.

3. EXPLANATION (required) — The core answer to their question. Break it into digestible pieces. Use **bold** for key terms. Keep each paragraph short (2-3 sentences). This is the meat — make it clear, vivid, and memorable. Include a keyTakeaway: one sentence that captures the essential insight.

4. REAL_WORLD (required) — "See it in action." Give a concrete, tangible example from everyday life. Something they can observe or experience themselves. Make it vivid and specific, not abstract. Include 2-3 concrete details that make it memorable and relatable.

5. CHECK (required) — A quick understanding check. NOT a quiz — more like "here's a thought experiment." Ask a question that tests whether the core concept clicked. Provide 4 options (multiple choice). Include a detailed explanation for the correct answer that reinforces the concept. The question should make them THINK, not just recall. Avoid trivial or purely factual questions — test application or reasoning.

6. VIDEO (required) — The culmination. By now they have context to appreciate a deeper explanation. Provide a specific YouTube search query that would find the best video for this topic at their level. Include videoContext: 1-2 sentences explaining what they'll see and why it matters NOW that they understand the basics.

7. NEXT_STEPS (required) — Where to go from here. Provide exactly 3 follow-up paths, each with a question and a brief reason why it's interesting. These should feel like natural next curiosities, not a syllabus.

CRITICAL RULES:
- Every stage must have an emoji that matches its mood
- Keep language warm, conversational, and encouraging
- The hook should be genuinely surprising or intriguing — avoid clickbait, but make them curious
- The explanation should build on the foundation — don't repeat. Include analogies, metaphors, or vivid examples
- The check question should be thought-provoking, not trivial. Test understanding, not memorization
- The video search query should be specific enough to find great content. Include creator name or channel if known
- Next steps should branch in different directions (deeper into this topic, related concepts, practical applications)
- Total reading time for all stages: 2-3 minutes (not a textbook)
- Use markdown for emphasis but keep it readable
- EXPLANATION DEPTH: For intermediate/advanced learners, include nuance, edge cases, and connections to related fields
- REAL_WORLD EXAMPLES: Make them specific and memorable. Use numbers, names, or vivid details when possible

Return JSON:
{
  "stages": [
    {
      "type": "hook",
      "emoji": "emoji",
      "title": "Short punchy title",
      "content": "The surprising hook text"
    },
    {
      "type": "foundation",
      "emoji": "emoji",
      "title": "What you need to know first",
      "content": "Prerequisite context"
    },
    {
      "type": "explanation",
      "emoji": "emoji",
      "title": "Here's the answer",
      "content": "The core explanation with **bold** key terms. Include vivid examples, analogies, or metaphors. For advanced learners, include nuance and edge cases.",
      "keyTakeaway": "One sentence summary of the key insight",
      "deeperInsight": "Optional: A second-order insight or connection to related concepts for curious learners"
    },
    {
      "type": "real_world",
      "emoji": "emoji",
      "title": "See it in real life",
      "content": "Vivid real-world example"
    },
    {
      "type": "check",
      "emoji": "emoji",
      "title": "Quick check",
      "content": "Brief context for the question",
      "question": "A thought-provoking question that tests understanding",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "2-3 sentence explanation of why that's correct and what to remember. Teach, don't just confirm.",
      "thinkAbout": "A hint that encourages reflection before answering"
    },
    {
      "type": "video",
      "emoji": "emoji",
      "title": "Now watch this",
      "content": "",
      "searchQuery": "specific youtube search query (include creator name if known)",
      "videoContext": "What you'll see and why it matters now that you understand the basics",
      "videoTip": "A specific thing to watch for or think about while watching"
    },
    {
      "type": "next_steps",
      "emoji": "emoji",
      "title": "Keep exploring",
      "content": "",
      "paths": [
        { "question": "Follow-up question 1 (go deeper into this topic)", "reason": "Why it's interesting" },
        { "question": "Follow-up question 2 (related concept)", "reason": "Why it's interesting" },
        { "question": "Follow-up question 3 (practical application)", "reason": "Why it's interesting" }
      ]
    }
  ],
  "mappedConcepts": ["concept1", "concept2", "concept3"],
  "difficulty": "beginner|intermediate|advanced",
  "emoji": "overall topic emoji"
}`,
              },
              {
                role: "user",
                content: input.question,
              },
            ],
            response_format: { type: "json_object" },
          });

          const parsed = JSON.parse((response.choices[0].message.content as string) || "{}");
          const stages = (parsed.stages || []).map((s: any) => {
            // Randomize check stage type: 60% multiple choice, 40% fill-in-the-blank
            let stageData: any = {
              type: s.type || "explanation",
              emoji: s.emoji || "💡",
              title: s.title || "",
              content: s.content || "",
              keyTakeaway: s.keyTakeaway || undefined,
              question: s.question || undefined,
              thinkAbout: s.thinkAbout || undefined,
              explanation: s.explanation || undefined,
              searchQuery: s.searchQuery || "",
              videoContext: s.videoContext || "",
              videoTip: s.videoTip || "Pay attention to how the concepts connect to what you just learned.",
              paths: s.paths || undefined,
            };
            
            // For check stages, randomize between multiple choice and fill-in-the-blank
            if (s.type === "check" && Math.random() < 0.4) {
              stageData.questionType = "fillInTheBlank";
              stageData.correctAnswer = s.correctAnswer || s.options?.[s.correctIndex] || "correct answer";
              stageData.hint = s.hint || `Think about: ${s.keyTakeaway || ""}`;
              delete stageData.options;
              delete stageData.correctIndex;
            } else if (s.type === "check") {
              stageData.questionType = "multipleChoice";
              stageData.options = s.options || undefined;
              stageData.correctIndex = s.correctIndex ?? undefined;
              delete stageData.correctAnswer;
              delete stageData.hint;
            }
            
            return stageData;
          });

          return {
            stages,
            mappedConcepts: parsed.mappedConcepts || [],
            difficulty: parsed.difficulty || input.skillLevel,
            difficultyLevel: diffLevel,
            difficultyLabel: input.difficultyLabel,
            emoji: parsed.emoji || "🧠",
          };
        } catch (e) {
          console.error("[Chat.learn] LLM failed:", e);
          // Fallback: generate a minimal journey
          return {
            stages: [
              { type: "hook", emoji: "🤔", title: "Great question!", content: `"${input.question}" — let's explore this together.` },
              { type: "explanation", emoji: "💡", title: "Here's what we know", content: `This is a fascinating topic. Let me find the best resources to help you understand it.`, keyTakeaway: "Every great question is the start of a learning journey." },
              { type: "video", emoji: "🎬", title: "Watch and learn", content: "", searchQuery: `${input.question} explained simply`, videoContext: "This video will give you a solid foundation." },
              { type: "next_steps", emoji: "🚀", title: "Keep exploring", content: "", paths: [
                { question: `What are the basics of ${input.question.split(" ").slice(-2).join(" ")}?`, reason: "Start from the fundamentals" },
                { question: "How does this apply in real life?", reason: "See the practical side" },
                { question: "What's the most surprising thing about this?", reason: "Discover something unexpected" },
              ]},
            ],
            mappedConcepts: [],
            difficulty: input.skillLevel,
            difficultyLevel: input.difficultyLevel,
            difficultyLabel: input.difficultyLabel,
            emoji: "🧠",
          };
        }
      }),

    // ─── Prior Knowledge Check: Generate assessment questions ─────────────
    priorKnowledge: publicProcedure
      .input(z.object({
        question: z.string().min(1),
        difficultyLevel: z.number().min(1).max(5).optional().default(1),
        ageGroup: z.string().optional().default("unknown"),
        existingConfidence: z.record(z.string(), z.number()).optional().default({}),
        pastTopics: z.array(z.string()).optional().default([]),
      }))
      .mutation(async ({ input }) => {
        try {
          const agePrompt: Record<string, string> = {
            "under_10": "The learner is a young child (under 10). Use very simple, playful language. Frame questions as fun curiosity checks: \"Do you know what [X] is? It's okay if you don't!\"",
            "10_14": "The learner is 10-14 years old. Use friendly, curious language. Frame questions like: \"Have you learned about [X] in school?\"",
            "15_18": "The learner is 15-18 years old. Use peer-like, respectful language. Frame questions like: \"How much do you know about [X]?\"",
            "18_25": "The learner is 18-25 years old. Use direct, engaging language. Frame questions like: \"What's your background with [X]?\"",
            "25_40": "The learner is 25-40 years old. Use professional, warm language. Frame questions like: \"How familiar are you with [X]?\"",
            "40_plus": "The learner is 40+. Use respectful language that acknowledges their life experience. Frame questions like: \"You may have encountered [X] before — how much do you know?\"",
            "unknown": "Age is unknown. Use neutral, warm language that works for any age. Frame questions like: \"Before we start, how familiar are you with [X]?\"",
          };

          const ageInstruction = agePrompt[input.ageGroup] || agePrompt["unknown"];
          const pastTopicContext = input.pastTopics.length > 0
            ? `\nThe learner has previously explored: ${input.pastTopics.slice(-10).join(", ")}. Consider this when assessing their likely knowledge.`
            : "";

          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a warm, perceptive teacher about to start a learning session. Before teaching, you want to understand what the learner already knows — NOT to test them, but to personalize their experience.

${ageInstruction}
${pastTopicContext}

Generate exactly 3 prior knowledge questions about the topic. Each question should:
1. Feel personal and conversational, NOT like a standardized test
2. Have exactly 4 options that map to knowledge levels (none, low, medium, high)
3. Be non-judgmental — every answer is valid
4. Cover different aspects: familiarity with the term, real-world experience, and intuitive understanding
5. Be adaptive: answers will calibrate the learning journey. High knowledge = skip Foundation. Low knowledge = expand Foundation.

Question types to use:
- "familiarity": How familiar are you with the concept? ("Never heard of it" → "Pretty comfortable")
- "experience": Have you encountered this in real life? ("Not at all" → "All the time")
- "intuition": What do you think happens when...? / What's your gut feeling about...? (Tests conceptual understanding without requiring formal knowledge)
- "recognition": Can you recognize or identify...? (Tests ability to identify examples)

Return JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "The question text",
      "type": "familiarity|experience|intuition|recognition",
      "options": ["Option for none", "Option for low", "Option for medium", "Option for high"],
      "emoji": "relevant emoji",
      "knowledgeLevels": ["none", "low", "medium", "high"]
    }
  ],
  "topicCategory": "science|code|math|history|art|language|health|philosophy|business|general",
  "warmGreeting": "A brief, warm sentence to introduce the check (e.g., 'Before we explore black holes, let me understand where you're starting from...')"
}`,
              },
              {
                role: "user",
                content: `Topic: ${input.question}`,
              },
            ],
            response_format: { type: "json_object" },
          });

          const parsed = JSON.parse((response.choices[0].message.content as string) || "{}");
          return {
            questions: (parsed.questions || []).map((q: any, i: number) => ({
              id: q.id || `q${i + 1}`,
              question: q.question || "",
              type: q.type || "familiarity",
              options: q.options || [],
              emoji: q.emoji || "🤔",
              knowledgeLevels: q.knowledgeLevels || ["none", "low", "medium", "high"],
            })),
            topicCategory: parsed.topicCategory || "general",
            warmGreeting: parsed.warmGreeting || `Before we explore this, let me understand where you're starting from...`,
          };
        } catch (e) {
          console.error("[Chat.priorKnowledge] LLM failed:", e);
          // Fallback: generic questions
          return {
            questions: [
              {
                id: "q1",
                question: `How familiar are you with this topic?`,
                type: "familiarity" as const,
                options: ["Never heard of it", "Heard the name before", "Know the basics", "Pretty comfortable"],
                emoji: "🤔",
                knowledgeLevels: ["none" as const, "low" as const, "medium" as const, "high" as const],
              },
              {
                id: "q2",
                question: `Have you ever encountered this in your daily life?`,
                type: "experience" as const,
                options: ["Not that I know of", "Maybe once or twice", "A few times", "All the time"],
                emoji: "🌍",
                knowledgeLevels: ["none" as const, "low" as const, "medium" as const, "high" as const],
              },
              {
                id: "q3",
                question: `If someone asked you to explain this topic, how would you feel?`,
                type: "intuition" as const,
                options: ["I'd have no idea where to start", "I could say a sentence or two", "I could give a decent explanation", "I could teach it"],
                emoji: "💭",
                knowledgeLevels: ["none" as const, "low" as const, "medium" as const, "high" as const],
              },
            ],
            topicCategory: "general",
            warmGreeting: "Before we dive in, let me understand where you're starting from...",
          };
        }
      }),

    // Regenerate a single stage at a different difficulty (Explain Simpler / Tell Me More)
    regenStage: publicProcedure
      .input(z.object({
        stageType: z.enum(["hook", "foundation", "explanation", "real_world"]),
        originalContent: z.string(),
        originalTitle: z.string(),
        question: z.string().min(1),
        direction: z.enum(["simpler", "deeper"]),
        currentDifficultyLevel: z.number().min(1).max(5),
        depthLevel: z.number().min(0).max(3).optional().default(0),
        learnerContext: z.string().optional().default(""),
      }))
      .mutation(async ({ input }) => {
        try {
          const { getDifficultyPrompt } = await import("../shared/types.js");
          const targetLevel = input.direction === "simpler"
            ? Math.max(1, input.currentDifficultyLevel - 1)
            : Math.min(5, input.currentDifficultyLevel + 1);
          const diffPrompt = getDifficultyPrompt(targetLevel);

          const depthLevel = input.depthLevel ?? 0;
          const depthLabels = ["", "Expanded", "Deep Dive", "Expert Analysis"];

          const directionInstruction = input.direction === "simpler"
            ? `The learner found the previous explanation too complex. Rewrite this stage to be SIMPLER and more accessible:
- Use shorter sentences and everyday words
- Add a vivid analogy from daily life
- Remove jargon or define every term immediately
- Make it feel warm and encouraging, like talking to a curious friend
- If there's a key takeaway, make it crystal clear in one simple sentence`
            : depthLevel === 0
            ? `The learner wants to go DEEPER (Depth 1/3: Expanded). Rewrite this stage with MORE depth and detail:
- Add nuance, edge cases, or "what most people don't realize" insights
- Include connections to related concepts or fields
- Use more precise terminology (still define new terms)
- Add a thought-provoking angle they haven't considered
- If there's a key takeaway, make it richer and more insightful`
            : depthLevel === 1
            ? `The learner wants to go EVEN DEEPER (Depth 2/3: Deep Dive). They've already seen an expanded version. Now provide a DEEP DIVE:
- Explain the underlying mechanisms or principles at work
- Add historical context, research findings, or expert perspectives
- Discuss trade-offs, limitations, or common misconceptions
- Connect to adjacent fields or advanced applications
- Make the key takeaway synthesize multiple layers of understanding`
            : `The learner wants MAXIMUM DEPTH (Depth 3/3: Expert Analysis). They've seen expanded and deep dive versions. Now provide EXPERT-LEVEL analysis:
- Discuss cutting-edge developments, open questions, or active debates in the field
- Reference specific frameworks, models, or seminal ideas by name
- Explore second-order effects and systemic implications
- Challenge assumptions and present contrarian viewpoints
- The key takeaway should be a sophisticated insight that connects multiple domains`;

          const stageTypeInstruction: Record<string, string> = {
            hook: "This is a HOOK stage — it should spark curiosity. Keep it short (2-3 sentences) and punchy.",
            foundation: "This is a FOUNDATION stage — prerequisite context. Include a keyTakeaway field.",
            explanation: "This is an EXPLANATION stage — the core answer. Use **bold** for key terms. Include a keyTakeaway field.",
            real_world: "This is a REAL_WORLD stage — a concrete example. Make it vivid and tangible. Include a keyTakeaway field.",
          };

          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `${LEARNLM_SYSTEM}\n\n${diffPrompt}\n\n${directionInstruction}\n\n${stageTypeInstruction[input.stageType] || ""}\n\n${input.learnerContext ? `ABOUT THIS LEARNER:\n${input.learnerContext}` : ""}\n\nThe learner's original question was: "${input.question}"\n\nReturn JSON:\n{\n  "title": "New title for this stage",\n  "content": "Rewritten content",\n  "emoji": "appropriate emoji",\n  "keyTakeaway": "one sentence key insight (for foundation/explanation/real_world stages)"\n}`,
              },
              {
                role: "user",
                content: `Here is the current stage to rewrite:\n\nTitle: ${input.originalTitle}\nContent: ${input.originalContent}`,
              },
            ],
            response_format: { type: "json_object" },
          });

          const parsed = JSON.parse((response.choices[0].message.content as string) || "{}");
          return {
            title: parsed.title || input.originalTitle,
            content: parsed.content || input.originalContent,
            emoji: parsed.emoji || "💡",
            keyTakeaway: parsed.keyTakeaway || undefined,
            newDifficultyLevel: targetLevel,
          };
        } catch (e) {
          console.error("[Chat.regenStage] LLM failed:", e);
          return {
            title: input.originalTitle,
            content: input.originalContent,
            emoji: "💡",
            keyTakeaway: undefined,
            newDifficultyLevel: input.currentDifficultyLevel,
          };
        }
      }),

    // Legacy: keep ask endpoint for backward compatibility
    ask: publicProcedure
      .input(z.object({
        question: z.string().min(1),
        skillLevel: z.enum(["beginner", "intermediate", "advanced"]).optional().default("beginner"),
        conversationHistory: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          text: z.string(),
        })).optional().default([]),
        messageCount: z.number().optional().default(0),
        learnerModel: z.object({
          preferredPace: z.enum(["quick", "moderate", "deep"]).optional(),
          preferredTone: z.enum(["casual", "balanced", "formal"]).optional(),
          preferredDepth: z.enum(["overview", "detailed", "expert"]).optional(),
          strengthAreas: z.array(z.string()).optional(),
          confusionPoints: z.array(z.string()).optional(),
          conceptConfidence: z.record(z.string(), z.number()).optional(),
          realWorldConnections: z.array(z.string()).optional(),
          learningStyle: z.enum(["visual", "verbal", "kinesthetic", "mixed"]).optional(),
          explainSimplerCount: z.number().optional(),
          questionsAsked: z.number().optional(),
        }).optional().default({}),
        // Cross-conversation memory: summaries of past conversations
        pastConversations: z.array(z.object({
          question: z.string(),
          concepts: z.array(z.string()),
          timestamp: z.string(),
        })).optional().default([]),
      }))
      .mutation(async ({ input }) => {
        try {
          const lm = input.learnerModel;
          const historyContext = input.conversationHistory.length > 0
            ? `\n\nPrevious conversation:\n${input.conversationHistory.map(m => `${m.role}: ${m.text}`).join("\n")}`
            : "";

          // Build past conversation memory
          const pastConvContext = input.pastConversations.length > 0
            ? `\nPAST LEARNING JOURNEY:\n${input.pastConversations.slice(-5).map(pc => `- Asked "${pc.question}" → explored: ${pc.concepts.join(", ")}`).join("\n")}\nReference their past explorations naturally when relevant (e.g., "Remember when you explored X? This connects to that because..."). Don't force it — only mention past topics when there's a genuine connection.`
            : "";

          // Build learner context from the model
          const learnerContext = [
            lm.strengthAreas?.length ? `Strengths: ${lm.strengthAreas.join(", ")}` : "",
            lm.confusionPoints?.length ? `Has struggled with: ${lm.confusionPoints.join(", ")} — approach these gently` : "",
            lm.realWorldConnections?.length ? `Analogies that resonated before: ${lm.realWorldConnections.slice(-3).join("; ")}` : "",
            lm.preferredPace ? `Preferred pace: ${lm.preferredPace}` : "",
            lm.preferredDepth ? `Preferred depth: ${lm.preferredDepth}` : "",
            lm.learningStyle ? `Learning style: ${lm.learningStyle}` : "",
            (lm.explainSimplerCount || 0) > 2 ? "This learner often needs simpler explanations — default to very clear, simple language" : "",
            pastConvContext,
          ].filter(Boolean).join("\n");

          // Decide whether to include a nudge (every 2-3 messages, not every time)
          const shouldNudge = input.messageCount > 0 && input.messageCount % 2 === 1;
          const nudgeInstruction = shouldNudge ? `

SUBTLE NUDGE: Weave ONE natural check-in into your response. Pick the most appropriate type:
- "familiarity_check": "Have you come across [concept] before?" — reveals prior knowledge
- "connection_check": "Does that remind you of anything from your experience?" — reveals mental models
- "interest_probe": "What part of that surprises you most?" — reveals engagement & curiosity direction
- "pace_check": "Want me to go deeper into this, or shall we move on?" — reveals preferred pace
- "application_prompt": "Where might you see this in everyday life?" — reveals real-world thinking
- "confidence_gauge": "How does that sit with you — does it click?" — reveals comprehension
- "analogy_test": "How would you explain this to a friend?" — reveals depth of understanding

Make the nudge feel NATURAL — like a thoughtful tutor checking in, not a quiz. Blend it into the conversation.
Include the nudge in "nudge" field of your JSON response.` : "";

          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `${LEARNLM_SYSTEM}

${getLevelPrompt(input.skillLevel)}

You are a brilliant, warm learning companion who KNOWS this specific learner. You adapt your tone, pace, and depth based on what you know about them.

${learnerContext ? `ABOUT THIS LEARNER:\n${learnerContext}` : "This is a new learner — be warm and welcoming."}

Your job is to:
1. UNDERSTAND their real question and map it to underlying concepts
2. RESPOND in a way that feels PERSONAL — reference their strengths, avoid their pain points
3. CONNECT to real-world examples they can relate to (use analogies that worked before if available)
4. TEACH the concept step by step, building from what they likely know
5. Boost their confidence — acknowledge what they already know before teaching new things

IMPORTANT RULES:
- Keep responses concise (3-5 short paragraphs max)
- Use analogies and real-world connections
- End with a thought-provoking follow-up question or suggestion
- If the question is vague, gently guide them toward something specific
- Never say "I can't" — always find a way to help them learn
- Use markdown for emphasis (**bold** for key terms)
- Make it feel like a 1-on-1 conversation with a brilliant friend, not a textbook${nudgeInstruction}

Return JSON:
{
  "response": "Your conversational response (markdown supported)",
  "mappedConcepts": ["concept1", "concept2", "concept3"],
  "realWorldConnection": "A relatable real-world analogy or example",
  "followUpQuestion": "An engaging question to keep them curious",
  "suggestedSearchQueries": ["youtube search query 1", "youtube search query 2"],
  "difficulty": "beginner|intermediate|advanced",
  "emoji": "relevant emoji for the topic"${shouldNudge ? `,
  "nudge": {
    "nudgeType": "one of: familiarity_check, connection_check, interest_probe, pace_check, application_prompt, confidence_gauge, analogy_test",
    "question": "The natural check-in question woven into your response",
    "options": ["Quick-tap option 1", "Quick-tap option 2", "Quick-tap option 3"],
    "signalKey": "what this reveals about the learner",
    "emoji": "relevant emoji"
  }` : ""}
}`,
              },
              {
                role: "user",
                content: `${input.question}${historyContext}`,
              },
            ],
            response_format: { type: "json_object" },
          });

          const parsed = JSON.parse((response.choices[0].message.content as string) || "{}");
          return {
            response: parsed.response || "That's a great question! Let me help you explore it.",
            mappedConcepts: parsed.mappedConcepts || [],
            realWorldConnection: parsed.realWorldConnection || "",
            followUpQuestion: parsed.followUpQuestion || "What else are you curious about?",
            suggestedSearchQueries: parsed.suggestedSearchQueries || [`${input.question} explained`],
            difficulty: parsed.difficulty || input.skillLevel,
            emoji: parsed.emoji || "🧠",
            nudge: parsed.nudge || null,
          };
        } catch (e) {
          console.error("[Chat] LLM failed:", e);
          return {
            response: "That's a fascinating question! Let me find some great resources to help you understand it.",
            mappedConcepts: [],
            realWorldConnection: "",
            followUpQuestion: "Can you tell me more about what specifically you'd like to understand?",
            suggestedSearchQueries: [`${input.question} explained simply`],
            difficulty: input.skillLevel,
            emoji: "🧠",
            nudge: null,
          };
        }
      }),

    // Generate inline baseline quiz questions based on the user's question
    baseline: publicProcedure
      .input(z.object({
        question: z.string(),
        mappedConcepts: z.array(z.string()).min(1),
      }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `${LEARNLM_SYSTEM}

Generate 3 quick, fun baseline questions to discover what the learner already knows about their question. These should feel like a casual conversation, NOT a test.

Rules:
- Questions go from very easy (common sense) to harder (requires knowledge)
- Each has a fun fact revealed after answering
- Use playful, encouraging language
- The goal is to figure out WHERE to start teaching, not to judge

Return JSON:
{
  "questions": [
    {
      "question": "Casual, fun question text",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "funFact": "A delightful fact that makes them want to learn more",
      "emoji": "relevant emoji"
    }
  ]
}`,
              },
              {
                role: "user",
                content: `The learner asked: "${input.question}"\nRelated concepts: ${input.mappedConcepts.join(", ")}\n\nGenerate 3 baseline questions.`,
              },
            ],
            response_format: { type: "json_object" },
          });

          const parsed = JSON.parse((response.choices[0].message.content as string) || "{}");
          return {
            questions: (parsed.questions || []).slice(0, 3).map((q: any) => ({
              question: q.question || "What do you already know?",
              options: q.options || ["A", "B", "C", "D"],
              correctIndex: q.correctIndex ?? 0,
              funFact: q.funFact || "Every expert was once a beginner!",
              emoji: q.emoji || "🧠",
            })),
          };
        } catch {
          return { questions: [] };
        }
      }),

    // Build a mini learning ladder from the user's level to answering their question
    buildPath: publicProcedure
      .input(z.object({
        question: z.string(),
        mappedConcepts: z.array(z.string()),
        baselineCorrect: z.number().min(0).max(3),
        skillLevel: z.enum(["beginner", "intermediate", "advanced"]).optional().default("beginner"),
      }))
      .mutation(async ({ input }) => {
        const effectiveLevel = input.baselineCorrect === 0 ? "beginner"
          : input.baselineCorrect <= 1 ? "beginner"
          : input.baselineCorrect <= 2 ? "intermediate"
          : "advanced";

        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `${LEARNLM_SYSTEM}

${getLevelPrompt(effectiveLevel)}

Build a mini learning path (3-5 steps) that takes the learner from their current level to understanding the answer to their question.

Each step must:
- Have a clear, specific title
- Include a real-world connection (something they can see/touch/experience)
- Include a YouTube search query to find great content for that step
- Build on the previous step

Return JSON:
{
  "steps": [
    {
      "order": 1,
      "title": "Step title",
      "description": "What you'll learn in this step (1-2 sentences)",
      "realWorldConnection": "A relatable example from everyday life",
      "searchQuery": "specific youtube search query for this step"
    }
  ],
  "estimatedMinutes": 15,
  "encouragement": "A motivating message about their learning journey"
}`,
              },
              {
                role: "user",
                content: `Question: "${input.question}"\nConcepts: ${input.mappedConcepts.join(", ")}\nBaseline: ${input.baselineCorrect}/3 correct (level: ${effectiveLevel})\n\nBuild a learning path from their level to answering this question.`,
              },
            ],
            response_format: { type: "json_object" },
          });

          const parsed = JSON.parse((response.choices[0].message.content as string) || "{}");
          return {
            steps: (parsed.steps || []).map((s: any, i: number) => ({
              order: s.order || i + 1,
              title: s.title || `Step ${i + 1}`,
              description: s.description || "",
              realWorldConnection: s.realWorldConnection || "",
              searchQuery: s.searchQuery || input.question,
            })),
            estimatedMinutes: parsed.estimatedMinutes || 15,
            encouragement: parsed.encouragement || "You're about to learn something amazing!",
          };
        } catch {
          return {
            steps: [{
              order: 1,
              title: "Explore the basics",
              description: "Let's start with the fundamentals",
              realWorldConnection: "Think about what you already know from everyday life",
              searchQuery: `${input.question} explained for beginners`,
            }],
            estimatedMinutes: 10,
            encouragement: "Every journey starts with a single step!",
          };
        }
      }),

    // Fetch YouTube content for a specific learning path step
    fetchStepContent: publicProcedure
      .input(z.object({
        searchQuery: z.string(),
        topicSlug: z.string().optional().default("general"),
      }))
      .mutation(async ({ input }) => {
        const items = await fetchYouTubeForQuery(input.searchQuery, input.topicSlug, 5);
        return {
          items: items.map((item: any) => ({
            id: 0,
            externalId: item.externalId,
            type: item.type,
            title: item.title,
            description: item.description,
            url: item.url,
            thumbnailUrl: item.thumbnailUrl,
            source: item.source,
            channelOrAuthor: item.channelOrAuthor,
            durationSeconds: item.durationSeconds,
            topicSlug: item.topicSlug,
            publishedAt: item.publishedAt,
          })),
        };
      }),

    // Follow-up: user says "I don't get it" or asks a follow-up
    // Now learner-model-aware for personalized responses
    followUp: publicProcedure
      .input(z.object({
        originalQuestion: z.string(),
        followUpMessage: z.string(),
        previousResponse: z.string(),
        skillLevel: z.enum(["beginner", "intermediate", "advanced"]).optional().default("beginner"),
        messageCount: z.number().optional().default(0),
        learnerModel: z.object({
          preferredPace: z.enum(["quick", "moderate", "deep"]).optional(),
          preferredTone: z.enum(["casual", "balanced", "formal"]).optional(),
          preferredDepth: z.enum(["overview", "detailed", "expert"]).optional(),
          strengthAreas: z.array(z.string()).optional(),
          confusionPoints: z.array(z.string()).optional(),
          realWorldConnections: z.array(z.string()).optional(),
          explainSimplerCount: z.number().optional(),
        }).optional().default({}),
      }))
      .mutation(async ({ input }) => {
        try {
          const lm = input.learnerModel;
          const learnerContext = [
            lm.confusionPoints?.length ? `Has struggled with: ${lm.confusionPoints.join(", ")}` : "",
            lm.strengthAreas?.length ? `Good at: ${lm.strengthAreas.join(", ")}` : "",
            lm.realWorldConnections?.length ? `Analogies that worked: ${lm.realWorldConnections.slice(-2).join("; ")}` : "",
            (lm.explainSimplerCount || 0) > 2 ? "This learner often needs simpler explanations" : "",
          ].filter(Boolean).join("\n");

          // Nudge on every 3rd follow-up
          const shouldNudge = input.messageCount > 1 && input.messageCount % 3 === 0;

          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `${LEARNLM_SYSTEM}

${getLevelPrompt(input.skillLevel)}

${learnerContext ? `ABOUT THIS LEARNER:\n${learnerContext}` : ""}

The learner is continuing a conversation. They may:
- Say they don't understand → Explain simpler with a DIFFERENT analogy (not the same one!)
- Ask a follow-up → Answer it and connect back to the original question
- Want to change direction → Smoothly pivot to the new topic
- Express frustration → Be extra encouraging, validate their effort, and break it down further
- Answer a check-in question → Acknowledge their answer warmly and use it to personalize your next explanation

Keep responses concise (2-4 short paragraphs). Always be warm and personal.${shouldNudge ? `

Weave in ONE subtle check-in: either "confidence_gauge" ("Does that click now?"), "pace_check" ("Want to explore this more or move forward?"), or "connection_check" ("Does this connect to anything you've experienced?"). Include in "nudge" field.` : ""}

Return JSON:
{
  "response": "Your conversational response (markdown supported)",
  "suggestedSearchQueries": ["youtube search query if relevant"],
  "emoji": "relevant emoji"${shouldNudge ? `,
  "nudge": {
    "nudgeType": "confidence_gauge|pace_check|connection_check",
    "question": "Natural check-in question",
    "options": ["Option 1", "Option 2", "Option 3"],
    "signalKey": "what this reveals",
    "emoji": "emoji"
  }` : ""}
}`,
              },
              {
                role: "user",
                content: `Original question: "${input.originalQuestion}"\nPrevious AI response: "${input.previousResponse.slice(0, 500)}"\n\nUser says: "${input.followUpMessage}"`,
              },
            ],
            response_format: { type: "json_object" },
          });

          const parsed = JSON.parse((response.choices[0].message.content as string) || "{}");
          return {
            response: parsed.response || "Let me try explaining that differently...",
            suggestedSearchQueries: parsed.suggestedSearchQueries || [],
            emoji: parsed.emoji || "💡",
            nudge: parsed.nudge || null,
          };
        } catch {
          return {
            response: "Let me try a different approach. Can you tell me which part is confusing?",
            suggestedSearchQueries: [],
            emoji: "🤔",
            nudge: null,
          };
        }
      }),
    // Transcribe voice input using LLM
    transcribe: publicProcedure
      .input(z.object({
        audioBase64: z.string(),
        mimeType: z.string().optional().default("audio/m4a"),
      }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "You are a transcription assistant. Transcribe the user's audio message into text. Return ONLY the transcribed text, nothing else. If you cannot understand the audio, return 'I could not understand that. Could you try again?'",
              },
              {
                role: "user",
                content: [
                  {
                    type: "input_audio" as any,
                    input_audio: {
                      data: input.audioBase64,
                      format: input.mimeType.includes("wav") ? "wav" : "mp3",
                    },
                  },
                ] as any,
              },
            ],
          });
          return {
            text: (response.choices[0].message.content as string) || "",
            success: true,
          };
        } catch {
          return { text: "", success: false };
        }
      }),

    // Generate personalized suggestions based on learner model and past conversations
    suggestions: publicProcedure
      .input(z.object({
        interests: z.array(z.string()),
        skillLevel: z.enum(["beginner", "intermediate", "advanced"]).optional().default("beginner"),
        pastTopics: z.array(z.string()).optional().default([]),
        confusionPoints: z.array(z.string()).optional().default([]),
        strengthAreas: z.array(z.string()).optional().default([]),
        questionsAsked: z.number().optional().default(0),
      }))
      .mutation(async ({ input }) => {
        try {
          const hasHistory = input.pastTopics.length > 0;
          const prompt = hasHistory
            ? `Based on this learner's profile, generate 4 personalized question suggestions they'd love to explore next.

Their interests: ${input.interests.join(", ")}
Topics they've explored: ${input.pastTopics.join(", ")}
Things they're good at: ${input.strengthAreas.join(", ") || "still discovering"}
Things they found confusing: ${input.confusionPoints.join(", ") || "none yet"}
Skill level: ${input.skillLevel}
Questions asked so far: ${input.questionsAsked}

Rules:
- 2 suggestions should build on what they've already explored (go deeper or connect to related topics)
- 1 suggestion should be a fun tangent related to their interests
- 1 suggestion should gently address a confusion point (if any) from a new angle
- Each suggestion should be a natural, curiosity-driven question (not academic-sounding)
- Keep them short (under 50 chars each)

Return JSON: { "suggestions": ["question1", "question2", "question3", "question4"], "reasons": ["why1", "why2", "why3", "why4"] }`
            : `Generate 4 engaging starter questions for a ${input.skillLevel} learner interested in: ${input.interests.join(", ")}.

Rules:
- Questions should spark genuine curiosity about real-world phenomena
- Mix practical ("How does X work?") with wonder ("Why does X happen?")
- Keep them short (under 50 chars each)
- Make them feel like questions a curious person would naturally ask

Return JSON: { "suggestions": ["q1", "q2", "q3", "q4"], "reasons": ["why1", "why2", "why3", "why4"] }`;

          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You generate personalized learning question suggestions. Return valid JSON only." },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
          });

          const parsed = JSON.parse((response.choices[0].message.content as string) || "{}");
          return {
            suggestions: parsed.suggestions || [],
            reasons: parsed.reasons || [],
          };
        } catch {
          // Fallback to interest-based suggestions
          const fallbacks = input.interests.slice(0, 4).map((i) => `How does ${i} work in real life?`);
          return { suggestions: fallbacks, reasons: fallbacks.map(() => "Based on your interests") };
        }
      }),

    // ─── Journey Chat: Contextual Q&A within a learning journey ───────────
    journeyChat: publicProcedure
      .input(z.object({
        question: z.string().min(1),
        journeyQuestion: z.string(),
        currentStageType: z.string(),
        currentStageContent: z.string(),
        currentStageTitle: z.string(),
        chatHistory: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          text: z.string(),
        })).optional().default([]),
        skillLevel: z.enum(["beginner", "intermediate", "advanced"]).optional().default("beginner"),
        learnerModel: z.object({
          preferredDepth: z.enum(["overview", "detailed", "expert"]).optional(),
          confusionPoints: z.array(z.string()).optional(),
          strengthAreas: z.array(z.string()).optional(),
        }).optional().default({}),
      }))
      .mutation(async ({ input }) => {
        try {
          const lm = input.learnerModel;
          const learnerCtx = [
            lm.confusionPoints?.length ? `Struggles with: ${lm.confusionPoints.join(", ")}` : "",
            lm.strengthAreas?.length ? `Good at: ${lm.strengthAreas.join(", ")}` : "",
            lm.preferredDepth ? `Preferred depth: ${lm.preferredDepth}` : "",
          ].filter(Boolean).join("\n");

          const historyMessages = input.chatHistory.slice(-6).map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.text,
          }));

          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `${LEARNLM_SYSTEM}

${getLevelPrompt(input.skillLevel)}

${learnerCtx ? `ABOUT THIS LEARNER:\n${learnerCtx}` : ""}

The learner is on a guided learning journey about: "${input.journeyQuestion}"
They are currently on the "${input.currentStageType}" stage titled: "${input.currentStageTitle}"

Current card content (for context):
${input.currentStageContent.slice(0, 800)}

The learner has a question about what they're learning. Answer it:
- Be concise (2-3 short paragraphs max)
- Reference the current card content when relevant
- Use simple, warm language
- If they're confused, try a different analogy
- Use **bold** for key terms

Return JSON: { "response": "your answer (markdown)", "emoji": "relevant emoji" }`,
              },
              ...historyMessages,
              {
                role: "user",
                content: input.question,
              },
            ],
            response_format: { type: "json_object" },
          });

          const parsed = JSON.parse((response.choices[0].message.content as string) || "{}");
          return {
            response: parsed.response || "Let me try explaining that differently...",
            emoji: parsed.emoji || "💡",
          };
        } catch {
          return {
            response: "I'm having trouble answering right now. Try rephrasing your question!",
            emoji: "🤔",
          };
        }
      }),
  }),

  // ─── Journey Topic Suggestions for Home Feed ─────────────────────────────
  journeyTopics: router({
    // Generate personalized learning journey topic suggestions with YouTube thumbnails
    suggest: publicProcedure
      .input(z.object({
        interests: z.array(z.string()),
        skillLevel: z.enum(["beginner", "intermediate", "advanced"]).optional().default("beginner"),
        age: z.number().optional(),
        pastTopics: z.array(z.string()).optional().default([]),
        strengthAreas: z.array(z.string()).optional().default([]),
        confusionPoints: z.array(z.string()).optional().default([]),
        category: z.string().optional(), // filter by category
      }))
      .mutation(async ({ input }) => {
        try {
          const ageContext = input.age
            ? input.age < 10 ? "a child under 10" : input.age < 16 ? `a teenager (${input.age} years old)` : `an adult (${input.age} years old)`
            : "a curious learner";

          const categoryFilter = input.category && input.category !== "all"
            ? `\nFocus specifically on the "${input.category}" category.`
            : "";

          const hasHistory = input.pastTopics.length > 0;

          const prompt = `Generate 6 compelling learning journey topics for ${ageContext} at ${input.skillLevel} level.

Their interests: ${input.interests.join(", ") || "general knowledge"}
${hasHistory ? `Topics they've already explored: ${input.pastTopics.slice(-10).join(", ")}` : ""}
${input.strengthAreas.length ? `Strong in: ${input.strengthAreas.join(", ")}` : ""}
${input.confusionPoints.length ? `Struggles with: ${input.confusionPoints.join(", ")}` : ""}${categoryFilter}

For each topic, provide:
1. A curiosity-sparking question or topic title (the kind that makes you go "wait, really?")
2. A 1-sentence hook that makes them NEED to know the answer
3. A category (one of: Science, Programming, AI & Data, Humanities, Creative, Business, Health, General)
4. An emoji that captures the topic
5. A YouTube search query to find a great thumbnail image for this topic
6. Estimated learning time in minutes (5-15)

Rules:
- Topics should feel like fascinating questions, not textbook chapters
- ${hasHistory ? "2 topics should build on what they've explored, 2 should be fresh angles on their interests, 2 should be surprising tangents" : "Mix practical how-it-works topics with mind-blowing why-does-this-happen topics"}
- Each topic should be something that leads to a full learning journey, not just a video to watch
- Make them specific and concrete, not vague ("Why do cats purr?" not "Animal behavior")
- Keep titles under 60 characters

Return JSON: {
  "topics": [
    {
      "title": "...",
      "hook": "...",
      "category": "...",
      "emoji": "...",
      "searchQuery": "...",
      "estimatedMinutes": 10
    }
  ]
}`;

          const response = await invokeLLM({
            messages: [
              { role: "system", content: `${LEARNLM_SYSTEM}\nYou generate personalized learning topic suggestions. Return valid JSON only.` },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
          });

          const parsed = JSON.parse((response.choices[0].message.content as string) || "{}");
          const topics = parsed.topics || [];

          // Fetch YouTube thumbnails for each topic in parallel
          const topicsWithThumbnails = await Promise.all(
            topics.map(async (topic: any) => {
              try {
                const result = await callDataApi("Youtube/search", {
                  query: { q: topic.searchQuery, hl: "en", gl: "US" },
                }) as any;
                const firstVideo = (result?.contents || []).find((c: any) => c.type === "video" && c.video);
                const video = firstVideo?.video;
                return {
                  ...topic,
                  thumbnailUrl: video?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${video?.videoId || "dQw4w9WgXcQ"}/hqdefault.jpg`,
                  channelName: video?.channelTitle || video?.channelName || "",
                  videoTitle: video?.title || "",
                };
              } catch {
                return { ...topic, thumbnailUrl: "", channelName: "", videoTitle: "" };
              }
            })
          );

          return { topics: topicsWithThumbnails };
        } catch {
          // Fallback: generate basic topics from interests
          const fallbackTopics = input.interests.slice(0, 6).map((interest) => ({
            title: `How does ${interest.replace(/-/g, " ")} actually work?`,
            hook: `The answer might surprise you.`,
            category: "General",
            emoji: "🧠",
            searchQuery: `${interest.replace(/-/g, " ")} explained`,
            estimatedMinutes: 10,
            thumbnailUrl: "",
            channelName: "",
            videoTitle: "",
          }));
          return { topics: fallbackTopics };
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

  // ─── Adaptive Assessment ──────────────────────────────────────────────
  adaptive: adaptiveRouter,

  // ─── Concept Content Generation ────────────────────────────────────────────────
  concepts: contentRouter,

  // ─── Adaptive Chat ─────────────────────────────────────────────────────────────
  adaptiveChat: chatRouter,

  // ─── Learning Ladder & Content Integration ─────────────────────────────────────────────────────────────
  integration: integrationRouter,
  spacedRepetition: spacedRepetitionRouter,

  // ─── Signal Observer (Learner Epistemology) ────────────────────────────────────────────────────────────────
  signals: signalObserverRouter,
  learnerProfile: learnerProfileRouter,

  // ─── Real-Time Recommendations ────────────────────────────────────────────────────────────────
  recommendations: recommendationsRouter,

  // ─── Signal-Based Notifications ────────────────────────────────────────────────────────────────
  notifications: notificationsRouter,
  // ─── Adaptive Learning (Assessment, Content, Flow) ────────────────────────────────────────────────────────────────
  adaptiveLearning: adaptiveLearningRouter,

  // ─── Claude Content Generation (LLM-powered adaptive content) ────────────────────────────────────────────────────────────────
  claudeContent: claudeContentRouter,

  // ─── Gemini Content Analysis (Multimodal content understanding) ────────────────────────────────────────────────────────────────
  geminiContent: geminiContentRouter,

  // ─── App Update ────────────────────────────────────────────────────────
  appUpdate: router({
    check: publicProcedure
      .input(z.object({ currentVersion: z.string() }))
      .query(async ({ input, ctx }) => {
        // Get the latest published version from the Manus platform
        // The platform sets MANUS_APP_DOWNLOAD_URL env var when published
        const downloadUrl = process.env.MANUS_APP_DOWNLOAD_URL || "";
        const latestVersion = process.env.MANUS_APP_VERSION || "1.0.0";
        
        const parseVersion = (v: string) => {
          const parts = v.split(".").map(Number);
          return (parts[0] || 0) * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);
        };
        
        const currentNum = parseVersion(input.currentVersion);
        const latestNum = parseVersion(latestVersion);
        const hasUpdate = latestNum > currentNum;
        
        return {
          hasUpdate,
          currentVersion: input.currentVersion,
          latestVersion,
          downloadUrl,
          releaseNotes: hasUpdate
            ? "A new version is available with improvements and bug fixes."
            : "You're on the latest version!",
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
