import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { behaviorTracker } from "./services/behavior-tracker";

/**
 * Behavior Tracking Router
 *
 * Provides tRPC endpoints for recording and analyzing learning behavior
 */

export const behaviorTrackingRouter = router({
  /**
   * Start a new learning session
   */
  startSession: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        lessonId: z.string(),
        topic: z.string(),
        approach: z.string(),
      })
    )
    .mutation(({ input }: any) => {
      try {
        const session = behaviorTracker.startSession(
          input.userId,
          input.lessonId,
          input.topic,
          input.approach
        );

        return {
          success: true,
          sessionId: `${input.userId}-${input.lessonId}-${session.startTime.getTime()}`,
          startTime: session.startTime,
        };
      } catch (error) {
        console.error("Failed to start session:", error);
        return {
          success: false,
          error: "Failed to start learning session",
        };
      }
    }),

  /**
   * Record a behavior signal during learning
   */
  recordSignal: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        lessonId: z.string(),
        signalType: z.enum(["engagement", "comprehension", "confidence", "pacing", "interaction"]),
        value: z.number().min(0).max(100),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(({ input }: any) => {
      try {
        behaviorTracker.recordSignal(
          input.userId,
          input.lessonId,
          input.signalType,
          input.value,
          input.metadata
        );

        return {
          success: true,
          message: "Signal recorded",
        };
      } catch (error) {
        console.error("Failed to record signal:", error);
        return {
          success: false,
          error: "Failed to record behavior signal",
        };
      }
    }),

  /**
   * End a learning session
   */
  endSession: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        lessonId: z.string(),
      })
    )
    .mutation(({ input }: any) => {
      try {
        const session = behaviorTracker.endSession(input.userId, input.lessonId);

        if (!session) {
          return {
            success: false,
            error: "No active session found",
          };
        }

        return {
          success: true,
          session: {
            timeSpentSeconds: session.timeSpentSeconds,
            engagementScore: Math.round(session.engagementScore),
            comprehensionScore: Math.round(session.comprehensionScore),
            confidenceScore: Math.round(session.confidenceScore),
            pacingScore: Math.round(session.pacingScore),
            signalCount: session.signals.length,
          },
        };
      } catch (error) {
        console.error("Failed to end session:", error);
        return {
          success: false,
          error: "Failed to end learning session",
        };
      }
    }),

  /**
   * Get user's behavior profile
   */
  getUserProfile: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(({ input }: any) => {
      try {
        const profile = behaviorTracker.getUserProfile(input.userId);

        if (!profile) {
          return {
            success: false,
            error: "No profile found for user",
          };
        }

        return {
          success: true,
          profile: {
            totalLessonsCompleted: profile.totalLessonsCompleted,
            averageEngagement: Math.round(profile.averageEngagement),
            averageComprehension: Math.round(profile.averageComprehension),
            averageConfidence: Math.round(profile.averageConfidence),
            preferredPacing: profile.preferredPacing,
            peakLearningHours: profile.peakLearningHours,
            strugglingTopics: profile.strugglingTopics,
            strongTopics: profile.strongTopics,
          },
        };
      } catch (error) {
        console.error("Failed to get user profile:", error);
        return {
          success: false,
          error: "Failed to retrieve user profile",
        };
      }
    }),

  /**
   * Detect if user is struggling in current session
   */
  detectStruggle: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        lessonId: z.string(),
      })
    )
    .query(({ input }: any) => {
      try {
        const isStruggling = behaviorTracker.detectStruggle(input.userId, input.lessonId);

        return {
          success: true,
          isStruggling,
          recommendation: isStruggling
            ? "Consider switching to a more interactive approach or taking a break"
            : "You're doing great! Keep going.",
        };
      } catch (error) {
        console.error("Failed to detect struggle:", error);
        return {
          success: false,
          error: "Failed to analyze struggle",
        };
      }
    }),

  /**
   * Predict next learning approach based on behavior
   */
  predictNextApproach: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        topic: z.string(),
      })
    )
    .query(({ input }: any) => {
      try {
        const approach = behaviorTracker.predictNextApproach(input.userId, input.topic);

        return {
          success: true,
          approach,
          reason:
            approach === "experiential"
              ? "Based on your learning history, hands-on practice works best for you"
              : approach === "problem-based"
                ? "You're ready for real-world challenges"
                : "Mixed approach based on your learning patterns",
        };
      } catch (error) {
        console.error("Failed to predict approach:", error);
        return {
          success: false,
          error: "Failed to predict next approach",
        };
      }
    }),

  /**
   * Get all sessions for a user
   */
  getUserSessions: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        completed: z.boolean().optional(),
      })
    )
    .query(({ input }: any) => {
      try {
        const sessions = input.completed
          ? behaviorTracker.getCompletedSessions(input.userId)
          : behaviorTracker.getUserSessions(input.userId);

        return {
          success: true,
          sessions: sessions.map((s) => ({
            lessonId: s.lessonId,
            topic: s.topic,
            approach: s.approach,
            timeSpentSeconds: s.timeSpentSeconds,
            engagementScore: Math.round(s.engagementScore),
            comprehensionScore: Math.round(s.comprehensionScore),
            confidenceScore: Math.round(s.confidenceScore),
            startTime: s.startTime,
            endTime: s.endTime,
          })),
          count: sessions.length,
        };
      } catch (error) {
        console.error("Failed to get user sessions:", error);
        return {
          success: false,
          error: "Failed to retrieve user sessions",
        };
      }
    }),
});
