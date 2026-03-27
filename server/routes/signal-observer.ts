import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  captureSignal,
  getUserSignals,
  getConceptSignals,
  getRecentSignals,
  analyzeSignals,
  getUniqueSignals,
  archiveOldSignals,
} from "../signal-observer";

const SignalTypeSchema = z.enum(["question", "connection", "application", "teaching", "breakthrough", "stuck", "feedback"]);

const CaptureSignalSchema = z.object({
  userId: z.number(),
  signalType: SignalTypeSchema,
  content: z.string().min(1),
  conceptId: z.number().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  timestamp: z.date().optional(),
});

export const signalObserverRouter = router({
  /**
   * Capture a new signal from user interaction
   */
  captureSignal: publicProcedure
    .input(CaptureSignalSchema)
    .mutation(async ({ input }) => {
      return await captureSignal({
        userId: input.userId,
        signalType: input.signalType,
        content: input.content,
        conceptId: input.conceptId,
        timestamp: input.timestamp,
      });
    }),

  /**
   * Get all signals for a user with optional filtering
   */
  getUserSignals: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        since: z.date().optional(),
        signalType: SignalTypeSchema.optional(),
        conceptId: z.number().optional(),
        limit: z.number().default(100),
      })
    )
    .query(async ({ input }) => {
      return await getUserSignals(input.userId, {
        since: input.since,
        signalType: input.signalType,
        conceptId: input.conceptId,
        limit: input.limit,
      });
    }),

  /**
   * Get signals for a specific concept
   */
  getConceptSignals: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        conceptId: z.number(),
        since: z.date().optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      return await getConceptSignals(input.userId, input.conceptId, {
        since: input.since,
        limit: input.limit,
      });
    }),

  /**
   * Get recent signals (last N hours)
   */
  getRecentSignals: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        hoursBack: z.number().default(24),
        limit: z.number().default(100),
      })
    )
    .query(async ({ input }) => {
      return await getRecentSignals(input.userId, input.hoursBack, input.limit);
    }),

  /**
   * Analyze signals for a user
   */
  analyzeSignals: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        timeWindowHours: z.number().default(168),
      })
    )
    .query(async ({ input }) => {
      return await analyzeSignals(input.userId, input.timeWindowHours);
    }),

  /**
   * Get unique signals (deduplicated by content hash)
   */
  getUniqueSignals: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        timeWindowHours: z.number().default(24),
      })
    )
    .query(async ({ input }) => {
      return await getUniqueSignals(input.userId, input.timeWindowHours);
    }),

  /**
   * Archive old signals
   */
  archiveOldSignals: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        daysOld: z.number().default(30),
      })
    )
    .mutation(async ({ input }) => {
      return await archiveOldSignals(input.userId, input.daysOld);
    }),

  /**
   * Get signal statistics for a user
   */
  getSignalStats: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const analysis = await analyzeSignals(input.userId, 168); // Last 7 days
      const recentSignals = await getRecentSignals(input.userId, 24);
      const uniqueSignals = await getUniqueSignals(input.userId, 24);

      return {
        analysis,
        recentSignalCount: recentSignals.length,
        uniqueSignalCount: uniqueSignals.length,
        deduplicationRate: recentSignals.length > 0 
          ? (1 - (uniqueSignals.length / recentSignals.length)) * 100
          : 0,
      };
    }),

  /**
   * Get signals by type for a user
   */
  getSignalsByType: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        signalType: SignalTypeSchema,
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const signals = await getUserSignals(input.userId, {
        limit: input.limit,
      });
      // Filter by type
      return signals.filter((s) => s.signalType === input.signalType);
    }),

  /**
   * Get signal timeline for concept learning
   */
  getConceptTimeline: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        conceptId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const signals = await getConceptSignals(input.userId, input.conceptId);
      
      // Group signals by type and sort by timestamp
      const timeline = signals.reduce(
        (acc, signal) => {
          const type = signal.signalType;
          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push(signal);
          return acc;
        },
        {} as Record<string, (typeof signals)[number][]>
      );

      // Sort each group by timestamp
      Object.keys(timeline).forEach((key) => {
        timeline[key].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      });

      return timeline;
    }),

  /**
   * Get learning insights from signals
   */
  getLearningInsights: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const analysis = await analyzeSignals(input.userId, 168);
      const recentSignals = await getRecentSignals(input.userId, 24);

      // Calculate learning patterns
      const questionCount = analysis.signalsByType.question || 0;
      const connectionCount = analysis.signalsByType.connection || 0;
      const applicationCount = analysis.signalsByType.application || 0;
      const breakthroughCount = analysis.recentBreakthroughs;
      const stuckCount = analysis.recentStuckPoints;

      // Determine learning style
      let learningStyle = "balanced";
      if (questionCount > connectionCount && questionCount > applicationCount) {
        learningStyle = "analytical";
      } else if (connectionCount > questionCount && connectionCount > applicationCount) {
        learningStyle = "relational";
      } else if (applicationCount > questionCount && applicationCount > connectionCount) {
        learningStyle = "practical";
      } else if (breakthroughCount > stuckCount) {
        learningStyle = "progressive";
      }

      // Calculate learning velocity
      const learningVelocity = recentSignals.length > 0 ? recentSignals.length / 24 : 0; // signals per hour

      // Determine confidence trajectory
      let confidenceTrajectory = "stable";
      if (analysis.averageConfidence > 0.7) {
        confidenceTrajectory = "improving";
      } else if (analysis.averageConfidence < 0.4) {
        confidenceTrajectory = "struggling";
      }

      return {
        learningStyle,
        learningVelocity,
        confidenceTrajectory,
        averageConfidence: analysis.averageConfidence,
        averageDepth: analysis.averageDepth,
        breakthroughsThisWeek: breakthroughCount,
        stuckPointsThisWeek: stuckCount,
        totalSignalsThisWeek: analysis.totalSignals,
        signalDistribution: analysis.signalsByType,
      };
    }),
});
