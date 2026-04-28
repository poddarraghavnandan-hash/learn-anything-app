import { router, publicProcedure } from "@/server/_core/trpc";
import { z } from "zod";
import { requestIntelligenceAgent } from "@/server/services/request-intelligence";
import { knowledgeAssessmentAgent } from "@/server/services/knowledge-assessment";
import { adaptiveContentGenerator } from "@/server/services/adaptive-content-generator";
import { contentSequencingAgent } from "@/server/services/content-sequencing";
import { continuationEngine } from "@/server/services/continuation-engine";
import { videoIntegrationService } from "@/server/services/video-integration";
import {
  createUserAdaptation,
  updateUserAdaptation,
  createLessonProgress,
  updateLessonProgress,
  createContinuationRecord,
  createAdaptationMetric,
  createVideoLessonPlan,
  createPrerequisiteFulfillment,
  getCachedContent,
  cacheContent,
} from "@/server/db-adaptation";
import { getUserByOpenId } from "@/server/db";

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

// Helper to get user ID from context
async function getUserId(ctx: any): Promise<number> {
  // In a real app, get from session/auth context
  // For now, use a default test user ID
  return 1;
}

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
      // Convert userProfile to Record<string, number> format if provided
      let userLadderLevels: Record<string, number> | undefined;
      if (input.context?.userProfile) {
        // Map profile to numeric scores
        const skillLevelMap = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
        const learningStyleMap = { visual: 1, textual: 2, kinesthetic: 3, mixed: 4 };
        userLadderLevels = {
          skillLevel: skillLevelMap[input.context.userProfile.skillLevel],
          learningStyle: learningStyleMap[input.context.userProfile.learningStyle],
        };
      }

      const analysis = await requestIntelligenceAgent.analyzeRequest(
        input.query,
        userLadderLevels,
        undefined
      );

      // Save to database
      const userId = await getUserId(undefined);
      const adaptationId = await createUserAdaptation({
        userId,
        userQuery: input.query,
        topic: analysis.topic,
        detectedIntent: analysis.intent,
        sophisticationLevel: analysis.estimatedDepth,
        sophisticationScore: analysis.sophisticationScore,
        detectedPrerequisites: analysis.prerequisites,
        userKnowledgeLevel: 1,
        readinessScore: 0,
        recommendedContentLevel: analysis.suggestedLadderLevel,
      });

      return {
        adaptationId,
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
      const content = await adaptiveContentGenerator.generateContent({
        concept: input.topic,
        level: input.targetLevel as 1 | 2 | 3 | 4 | 5,
        userBackground: input.sophistication ? `Sophistication: ${input.sophistication}` : undefined,
        difficulty: "intermediate",
      });

      return {
        level: content.level,
        title: content.title,
        description: content.description,
        mainContent: content.mainContent,
        keyPoints: content.keyPoints,
        examples: content.examples,
        quizzes: content.quizzes,
        estimatedTime: content.estimatedTime,
        discussionPrompts: content.discussionPrompts || [],
        practiceProblems: content.practiceProblems || [],
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
        input.userAccuracy || undefined,
        input.userMastery || undefined
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
          targetLevel: option.targetLevel || plan.currentLevel,
          estimatedDuration: option.estimatedDuration || 30,
          difficulty: option.difficulty || "intermediate",
          icon: option.icon || "",
          reason: option.reason || "",
        })),
        recommendedNext: plan.recommendedNext
          ? {
              id: plan.recommendedNext.id,
              type: plan.recommendedNext.type,
              title: plan.recommendedNext.title,
              description: plan.recommendedNext.description,
            }
          : null,
        reasoning: plan.reasoning || "",
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
      const content = await adaptiveContentGenerator.generateContent({
        concept: analysis.topic,
        level: recommendedLevel,
        userBackground: `Sophistication: ${analysis.sophisticationScore}`,
        difficulty: analysis.estimatedDepth as "beginner" | "intermediate" | "advanced",
      });

      // Phase 4: Generate sequence
      const sequence = await contentSequencingAgent.generateLearningSequence(
        analysis.topic,
        (input.userProfile?.skillLevel || "beginner") as "beginner" | "intermediate" | "advanced" | "expert",
        undefined,
        analysis.prerequisites
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

      // Save to database
      const userId = await getUserId(undefined);
      const adaptationId = await createUserAdaptation({
        userId,
        userQuery: input.query,
        topic: analysis.topic,
        detectedIntent: analysis.intent,
        sophisticationLevel: analysis.estimatedDepth,
        sophisticationScore: analysis.sophisticationScore,
        detectedPrerequisites: analysis.prerequisites,
        userKnowledgeLevel: recommendedStartPoint2,
        readinessScore: assessment.confidenceScore,
        recommendedContentLevel: recommendedLevel,
        sequenceGenerated: true,
        continuationOptionsGenerated: true,
        videoLessonGenerated: true,
      });

      if (!adaptationId) throw new Error("Failed to create adaptation record");

      // Save first 3 lessons
      for (let i = 0; i < Math.min(3, sequence.lessons.length); i++) {
        const lesson = sequence.lessons[i];
        await createLessonProgress({
          userId,
          adaptationId,
          lessonOrder: i + 1,
          lessonTitle: lesson.title,
          lessonDescription: lesson.description,
          lessonLevel: lesson.level,
          status: "not_started",
        });
      }

      // Save video lesson plan
      const scenes = videoPlan.scenes.map((scene: any) => ({
        id: scene.id || `scene-${Math.random()}`,
        title: scene.title,
        description: scene.description,
        duration: scene.duration || 30,
        animation: scene.animation || "fade_in",
        visualConcepts: scene.visualConcepts || [],
        voiceover: scene.voiceover || "",
        keyPoint: scene.keyPoint || "",
      }));

      const animations = (videoPlan.animations || []).map((anim: any) => ({
        type: anim.type || "fade",
        duration: anim.duration || 300,
        target: anim.target || "",
      }));

      await createVideoLessonPlan({
        adaptationId,
        topic: analysis.topic,
        contentLevel: recommendedLevel,
        videoStyle: input.userProfile?.learningStyle === "visual" ? "entertaining" : "educational",
        videoScript: content.mainContent,
        sceneCount: scenes.length,
        estimatedDurationSeconds: videoPlan.estimatedDuration * 60,
        scenes,
        keyFrames: videoPlan.keyFrames || [],
        animations,
      });

      // Save metrics
      await createAdaptationMetric({
        userId,
        adaptationId,
        contentRelevanceScore: 0.8,
        difficultyCalibration: 0.75,
        learningOutcome: 0,
        userEngagement: 0,
        totalTimeSpentSeconds: 0,
        estimatedTimeSeconds: analysis.estimatedDurationMinutes * 60,
        lessonsCompleted: 0,
        lessonsSkipped: 0,
      });

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
          description: content.description,
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

  /**
   * Adaptive Chat Integration
   * Combines chat interface with 7-phase adaptation pipeline
   * Analyzes user question, assesses knowledge, generates adaptive content
   */
  adaptiveChat: publicProcedure
    .input(
      z.object({
        question: z.string().min(1),
        chatHistory: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          text: z.string(),
        })).optional(),
        userProfile: z.object({
          skillLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
          learningStyle: z.enum(["visual", "textual", "mixed"]).optional(),
          preferredDepth: z.enum(["overview", "detailed", "expert"]).optional(),
        }).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Phase 1: Analyze user question
        const skillLevelRecord = input.userProfile?.skillLevel ? { [input.userProfile.skillLevel]: 1 } : undefined;
        const analysis = await requestIntelligenceAgent.analyzeRequest(
          input.question,
          skillLevelRecord,
          undefined
        );

        // Phase 2: Assess user knowledge
        const assessment = await knowledgeAssessmentAgent.assessUserKnowledge([]);

        // Phase 3: Generate adaptive content at appropriate level
        const recommendedLevel = Math.max(
          1,
          Math.min(5, (assessment.topicSpecificLevels[analysis.topic] || 1) as number)
        ) as 1 | 2 | 3 | 4 | 5;

        const content = await adaptiveContentGenerator.generateContent({
          concept: analysis.topic,
          level: recommendedLevel,
          userBackground: input.userProfile?.skillLevel || "beginner",
          difficulty: analysis.estimatedDepth as "beginner" | "intermediate" | "advanced",
        });

        // Phase 4: Generate learning sequence
        const learningStyleRecord = input.userProfile?.learningStyle ? { [input.userProfile.learningStyle]: 1 } : undefined;
        const sequence = await contentSequencingAgent.generateLearningSequence(
          analysis.topic,
          input.userProfile?.skillLevel || "beginner",
          learningStyleRecord,
          analysis.prerequisites
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

        // Return comprehensive adaptive response
        return {
          // Chat response
          response: content.description,
          emoji: "🎓",
          
          // Adaptation metadata
          adaptation: {
            topic: analysis.topic,
            sophisticationScore: analysis.sophisticationScore,
            detectedIntent: analysis.intent,
            userLevel: recommendedLevel,
            readinessScore: assessment.confidenceScore,
          },

          // Content
          content: {
            title: content.title,
            description: content.description,
            mainContent: content.mainContent,
            keyPoints: content.keyPoints,
            examples: content.examples,
          },

          // Learning path
          learningPath: {
            lessons: sequence.lessons.slice(0, 3),
            totalDuration: sequence.totalDuration,
            microLessons: sequence.microLessons,
          },

          // Continuation options
          continuationOptions: continuation.options,

          // Video metadata
          videoLesson: {
            sceneCount: videoPlan.scenes.length,
            estimatedDuration: videoPlan.estimatedDuration,
            scenes: videoPlan.scenes.slice(0, 3),
          },
        };
      } catch (error) {
        console.error("[Adaptation Chat] Error:", error);
        return {
          response: "I encountered an issue generating adaptive content. Please try again.",
          emoji: "🤔",
          adaptation: {
            topic: "unknown",
            sophisticationScore: 0,
            detectedIntent: "unknown",
            userLevel: 1,
            readinessScore: 0,
          },
          content: {
            title: "",
            description: "",
            mainContent: "",
            keyPoints: [],
            examples: [],
          },
          learningPath: {
            lessons: [],
            totalDuration: 0,
            microLessons: [],
          },
          continuationOptions: [],
          videoLesson: {
            sceneCount: 0,
            estimatedDuration: 0,
            scenes: [],
          },
        };
      }
    }),
});
