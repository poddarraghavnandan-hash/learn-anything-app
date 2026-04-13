import { router, publicProcedure } from "@/server/_core/trpc";
import { z } from "zod";
import { requestIntelligenceAgent } from "@/server/services/request-intelligence";
import { knowledgeAssessmentAgent } from "@/server/services/knowledge-assessment";
import { adaptiveContentGenerator } from "@/server/services/adaptive-content-generator";
import { contentSequencingAgent } from "@/server/services/content-sequencing";
import { continuationEngine } from "@/server/services/continuation-engine";
import { videoIntegrationService } from "@/server/services/video-integration";

/**
 * Adaptation Router
 *
 * Orchestrates the 7-phase intelligent content adaptation pipeline:
 * 1. Request Intelligence Agent - analyzes user intent
 * 2. Knowledge Assessment Agent - gauges existing knowledge
 * 3. Adaptive Content Generation - generates 5-level content
 * 4. Content Sequencing Agent - orders lessons optimally
 * 5. Continuation Engine - recommends next steps
 * 6. Video Integration - creates video lesson plans
 * 7. UX Fixes - ensures smooth user experience
 */

export const adaptationRouter = router({
  /**
   * Analyze user request and detect sophistication level
   * Phase 1: Request Intelligence Agent
   */
  analyzeRequest: publicProcedure
    .input(
      z.object({
        query: z.string().describe("User's learning query"),
        context: z
          .object({
            previousQueries: z.array(z.string()).optional(),
            userProfile: z
              .object({
                skillLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]),
                learningStyle: z.enum(["visual", "textual", "kinesthetic", "mixed"]),
              })
              .optional(),
          })
          .optional(),
      })
    )
    .query(async ({ input }) => {
      const analysis = await requestIntelligenceAgent.analyzeRequest(
        input.query,
        input.context?.userProfile,
        input.context?.previousQueries
      );

      return {
        topic: analysis.topic,
        sophisticationLevel: analysis.estimatedDepth,
        sophisticationScore: analysis.sophisticationScore,
        prerequisites: analysis.prerequisites,
        learningGoal: analysis.intent,
        estimatedDuration: analysis.estimatedDurationMinutes,
      };
    }),

  /**
   * Assess user's knowledge level for a topic
   * Phase 2: Knowledge Assessment Agent
   */
  assessKnowledge: publicProcedure
    .input(
      z.object({
        topic: z.string(),
        userHistory: z
          .object({
            completedLessons: z.array(z.string()).optional(),
            quizScores: z.record(z.number()).optional(),
            timeSpent: z.number().optional(),
          })
          .optional(),
      })
    )
    .query(async ({ input }) => {
      // Create UserHistoryData structure for the agent
      const historyData: any[] = input.userHistory?.quizScores
        ? Object.entries(input.userHistory.quizScores).map(([topic, accuracy]) => ({
            topicId: topic,
            quizzes: [{ id: "quiz-1", accuracy: accuracy / 100, timestamp: Date.now() }],
            contentViewed: 1,
            timeSpent: input.userHistory?.timeSpent || 0,
            reactions: { mindBlown: 0, knewThis: 0, saved: 0, skipped: 0 },
          }))
        : [];

      const assessment = historyData.length > 0
        ? await knowledgeAssessmentAgent.assessUserKnowledge(historyData)
        : {
            estimatedLevel: "beginner" as const,
            confidenceScore: 50,
            topicSpecificLevels: { [input.topic]: 1 },
            quizAccuracyByTopic: {},
            averageQuizAccuracy: 0,
            timeSpentByTopic: {},
            totalTimeSpent: 0,
            completedTopics: [],
            inProgressTopics: [],
            strugglingTopics: [],
            mastery: {},
            reasoning: "No history data available",
          };

      const recommendedStartPoint = Math.max(
        1,
        Math.min(5, (assessment.topicSpecificLevels[input.topic] || 1) as number)
      ) as 1 | 2 | 3 | 4 | 5;

      return {
        topicLevel: recommendedStartPoint,
        readinessScore: assessment.confidenceScore,
        knowledgeGaps: assessment.strugglingTopics,
        strengths: assessment.completedTopics,
        recommendedStartPoint,
      };
    }),

  /**
   * Generate adaptive content at appropriate difficulty level
   * Phase 3: Adaptive Content Generation
   */
  generateContent: publicProcedure
    .input(
      z.object({
        topic: z.string(),
        targetLevel: z.number().int().min(1).max(5),
        sophistication: z.number().min(0).max(100).optional(),
        keyPoints: z.array(z.string()).optional(),
        examples: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const content = await adaptiveContentGenerator.generateContent(
        input.topic,
        input.targetLevel as 1 | 2 | 3 | 4 | 5,
        input.sophistication,
        input.keyPoints,
        input.examples
      );

      return {
        title: content.title,
        introduction: content.introduction,
        mainContent: content.mainContent,
        keyPoints: content.keyPoints,
        examples: content.examples,
        checkYourUnderstanding: content.checkYourUnderstanding,
        nextSteps: content.nextSteps,
        difficulty: content.difficulty,
      };
    }),

  /**
   * Generate optimal lesson sequence for a topic
   * Phase 4: Content Sequencing Agent
   */
  generateSequence: publicProcedure
    .input(
      z.object({
        topic: z.string(),
        userLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]),
        userKnowledge: z.record(z.number()).optional(),
        prerequisites: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input }) => {
      const sequence = await contentSequencingAgent.generateLearningSequence(
        input.topic,
        input.userLevel,
        input.userKnowledge,
        input.prerequisites
      );

      return {
        topic: sequence.topic,
        userLevel: sequence.userLevel,
        lessons: sequence.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          level: lesson.level,
          order: lesson.order,
          prerequisites: lesson.prerequisites,
          estimatedDuration: lesson.estimatedDuration,
          keyPoints: lesson.keyPoints,
          isOptional: lesson.isOptional,
        })),
        totalDuration: sequence.totalDuration,
        microLessons: sequence.microLessons,
        reasoning: sequence.reasoning,
      };
    }),

  /**
   * Generate continuation options after lesson completion
   * Phase 5: Continuation Engine
   */
  generateContinuation: publicProcedure
    .input(
      z.object({
        topic: z.string(),
        currentLevel: z.number().int().min(1).max(5),
        userAccuracy: z.number().optional(),
        userMastery: z.record(z.number()).optional(),
      })
    )
    .query(async ({ input }) => {
      const plan = await continuationEngine.generateContinuationOptions(
        input.topic,
        input.currentLevel as 1 | 2 | 3 | 4 | 5,
        input.userAccuracy,
        input.userMastery
      );

      return {
        currentTopic: plan.currentTopic,
        currentLevel: plan.currentLevel,
        options: plan.options.map((option) => ({
          id: option.id,
          type: option.type,
          title: option.title,
          description: option.description,
          targetTopic: option.targetTopic || "",
          targetLevel: option.targetLevel || (plan.currentLevel as 1 | 2 | 3 | 4 | 5),
          estimatedDuration: option.estimatedDuration,
          difficulty: option.difficulty,
          icon: option.icon || "",
          reason: option.reason,
        })),
        recommendedNext: plan.recommendedNext
          ? {
              id: plan.recommendedNext.id,
              type: plan.recommendedNext.type,
              title: plan.recommendedNext.title,
              description: plan.recommendedNext.description,
            }
          : null,
        reasoning: plan.reasoning,
      };
    }),

  /**
   * Generate video lesson plan for a topic
   * Phase 6: Video Integration
   */
  generateVideoLesson: publicProcedure
    .input(
      z.object({
        topic: z.string(),
        level: z.number().int().min(1).max(5),
        keyPoints: z.array(z.string()),
        examples: z.array(z.string()),
        estimatedDuration: z.number().optional(),
        style: z.enum(["educational", "entertaining", "professional"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const videoPlan = await videoIntegrationService.generateVideoLessonPlan({
        topic: input.topic,
        level: input.level as 1 | 2 | 3 | 4 | 5,
        keyPoints: input.keyPoints,
        examples: input.examples,
        estimatedDuration: input.estimatedDuration || 15,
        style: input.style || "educational",
      });

      const metadata = videoIntegrationService.generateVideoMetadata(
        input.topic,
        input.level as 1 | 2 | 3 | 4 | 5,
        videoPlan
      );

      return {
        videoScript: videoPlan.videoScript,
        scenes: videoPlan.scenes.map((scene) => ({
          id: scene.id,
          title: scene.title,
          description: scene.description,
          duration: scene.duration,
          animation: scene.animation,
          visualConcepts: scene.visualConcepts,
          voiceover: scene.voiceover,
          keyPoint: scene.keyPoint,
        })),
        keyFrames: videoPlan.keyFrames,
        animations: videoPlan.animations,
        estimatedDuration: videoPlan.estimatedDuration,
        metadata: {
          title: metadata.title,
          description: metadata.description,
          duration: metadata.duration,
          chapters: metadata.chapters,
          tags: metadata.tags,
        },
      };
    }),

  /**
   * Full pipeline: from request to complete learning path
   * Orchestrates all 7 phases
   */
  generateFullPath: publicProcedure
    .input(
      z.object({
        query: z.string(),
        userProfile: z
          .object({
            skillLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]),
            learningStyle: z.enum(["visual", "textual", "kinesthetic", "mixed"]),
          })
          .optional(),
        userHistory: z
          .object({
            completedLessons: z.array(z.string()).optional(),
            quizScores: z.record(z.number()).optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Phase 1: Analyze request
      const analysis = await requestIntelligenceAgent.analyzeRequest(
        input.query,
        undefined,
        input.userHistory?.quizScores
          ? Object.entries(input.userHistory.quizScores).map(([topic, accuracy]) => ({
              topicId: topic,
              quizAccuracy: accuracy,
              timeSpent: 0,
            }))
          : undefined
      );

      // Phase 2: Assess knowledge
      const historyData: any[] = input.userHistory?.quizScores
        ? Object.entries(input.userHistory.quizScores).map(([topic, accuracy]) => ({
            topicId: topic,
            quizzes: [{ id: "quiz-1", accuracy: accuracy / 100, timestamp: Date.now() }],
            contentViewed: 1,
            timeSpent: 0,
            reactions: { mindBlown: 0, knewThis: 0, saved: 0, skipped: 0 },
          }))
        : [];

      const assessment = historyData.length > 0
        ? await knowledgeAssessmentAgent.assessUserKnowledge(historyData)
        : {
            estimatedLevel: "beginner" as const,
            confidenceScore: 50,
            topicSpecificLevels: { [analysis.topic]: 1 },
            quizAccuracyByTopic: {},
            averageQuizAccuracy: 0,
            timeSpentByTopic: {},
            totalTimeSpent: 0,
            completedTopics: [],
            inProgressTopics: [],
            strugglingTopics: [],
            mastery: {},
            reasoning: "No history data available",
          };

      // Determine recommended start point
      const recommendedLevel = Math.max(
        1,
        Math.min(5, (assessment.topicSpecificLevels[analysis.topic] || 1) as number)
      ) as 1 | 2 | 3 | 4 | 5;

      // Phase 3: Generate content for recommended level
      const content = await adaptiveContentGenerator.generateContent(
        analysis.topic,
        recommendedLevel,
        analysis.sophisticationScore,
        analysis.prerequisites
      );

      // Phase 4: Generate sequence
      const sequence = await contentSequencingAgent.generateLearningSequence(
        analysis.topic,
        (input.userProfile?.skillLevel || "beginner") as "beginner" | "intermediate" | "advanced" | "expert",
        undefined
      );

      // Phase 5: Generate continuation options
      const continuation = await continuationEngine.generateContinuationOptions(
        analysis.topic,
        recommendedLevel
      );

      // Phase 6: Generate video lesson plan
      const videoPlan = await videoIntegrationService.generateVideoLessonPlan({
        topic: analysis.topic,
        level: recommendedLevel,
        keyPoints: content.keyPoints,
        examples: content.examples,
        estimatedDuration: analysis.estimatedDurationMinutes,
        style: input.userProfile?.learningStyle === "visual" ? "entertaining" : "educational",
      });

      const recommendedStartPoint2 = Math.max(
        1,
        Math.min(5, (assessment.topicSpecificLevels[analysis.topic] || 1) as number)
      ) as 1 | 2 | 3 | 4 | 5;

      return {
        analysis: {
          topic: analysis.topic,
          sophisticationLevel: analysis.estimatedDepth,
          sophisticationScore: analysis.sophisticationScore,
          learningGoal: analysis.intent,
          estimatedDuration: analysis.estimatedDurationMinutes,
        },
        assessment: {
          topicLevel: recommendedStartPoint2,
          readinessScore: assessment.confidenceScore,
          knowledgeGaps: assessment.strugglingTopics,
          recommendedStartPoint: recommendedStartPoint2,
        },
        content: {
          title: content.title,
          introduction: content.introduction,
          mainContent: content.mainContent,
          keyPoints: content.keyPoints,
          examples: content.examples,
        },
        sequence: {
          lessons: sequence.lessons.slice(0, 3), // First 3 lessons
          totalDuration: sequence.totalDuration,
          microLessons: sequence.microLessons,
        },
        continuation: {
          options: continuation.options.slice(0, 3), // Top 3 options
          recommendedNext: continuation.recommendedNext,
        },
        video: {
          estimatedDuration: videoPlan.estimatedDuration,
          sceneCount: videoPlan.scenes.length,
          keyFrames: videoPlan.keyFrames,
        },
      };
    }),

  /**
   * Check if user is ready for next level
   */
  checkLevelReadiness: publicProcedure
    .input(
      z.object({
        currentLevel: z.number().int().min(1).max(5),
        userAccuracy: z.number().min(0).max(100),
        timeSpent: z.number(),
        minAccuracy: z.number().optional(),
      })
    )
    .query(({ input }) => {
      const isReady = input.currentLevel < 5 && input.userAccuracy >= (input.minAccuracy || 75) && input.timeSpent >= 30;

      return {
        isReady,
        nextLevel: isReady ? input.currentLevel + 1 : null,
        message: isReady
          ? `Great work! You're ready for Level ${input.currentLevel + 1}.`
          : `Keep practicing! You need ${input.minAccuracy || 75}% accuracy to advance.`,
      };
    }),
});
