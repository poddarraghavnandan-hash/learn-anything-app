import { router, publicProcedure } from "./_core/trpc";
import type { LearnerProfile } from "./adaptive-learning-engine";
import { z } from "zod";
import {
  generateBaselineQuestions,
  analyzeAssessmentResponses,
  generateAssessmentFeedback,
  assessPrerequisites,
  generateConfidenceBuilder,
} from "./baseline-assessment";
import {
  generateAdaptiveContent,
  updateLearnerProfile,
  calculateAdaptiveDifficulty,
  generateMisconceptionCorrection,
  generateDifficultyVariant,
} from "./adaptive-learning-engine";
import {
  shouldTransitionToLearning,
  shouldTransitionToQA,
  generateTransitionToLearning,
  generateTransitionToQA,
  handleInPathQuestion,
  detectAndCorrectMisconception,
  generateNextLearningPath,
  generateEncouragement,
} from "./unified-learning-flow";

export const adaptiveLearningRouter = router({
  // ============= BASELINE ASSESSMENT =============

  /**
   * Generate baseline assessment questions for a topic
   */
  generateAssessmentQuestions: publicProcedure
    .input(z.object({ topic: z.string() }))
    .query(async ({ input }) => {
      try {
        const questions = await generateBaselineQuestions(input.topic);
        return {
          success: true,
          questions,
          totalQuestions: questions.length,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate questions",
          questions: [],
        };
      }
    }),

  /**
   * Analyze assessment responses and create learner profile
   */
  analyzeAssessment: publicProcedure
    .input(
      z.object({
        topic: z.string(),
        responses: z.array(
          z.object({
            questionId: z.string(),
            answer: z.union([z.string(), z.number()]),
            confidence: z.number().optional(),
          })
        ),
        questions: z.array(
          z.object({
            id: z.string(),
            question: z.string(),
            type: z.enum(["yes-no", "multiple-choice", "text", "scale"]),
            purpose: z.enum(["prior-knowledge", "learning-style", "pace", "goals", "confidence"]),
          })
        ),
      })
    )
    .mutation(async ({ input }: any) => {
      try {
        const result = await analyzeAssessmentResponses(input.topic, input.responses, input.questions);
        const feedback = await generateAssessmentFeedback(result, input.topic);

        return {
          success: true,
          profile: result.learnerProfile,
          assessmentScore: result.assessmentScore,
          recommendations: result.recommendations,
          nextSteps: result.nextSteps,
          feedback,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to analyze assessment",
        };
      }
    }),

  /**
   * Check if learner needs prerequisite review
   */
  assessPrerequisites: publicProcedure
    .input(
      z.object({
        topic: z.string(),
        learningStyle: z.enum(["visual", "kinesthetic", "auditory", "reading-writing"]),
        priorKnowledge: z.record(z.string(), z.any()),
        learningPace: z.enum(["slow", "moderate", "fast"]),
      })
    )
    .query(async ({ input }) => {
      try {
        const result = await assessPrerequisites(input.topic, input as any);
        return {
          success: true,
          ...result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to assess prerequisites",
          needsPrerequisites: false,
          prerequisites: [],
          estimatedTime: 0,
        };
      }
    }),

  /**
   * Generate confidence-building question
   */
  generateConfidenceQuestion: publicProcedure
    .input(
      z.object({
        topic: z.string(),
        learningStyle: z.enum(["visual", "kinesthetic", "auditory", "reading-writing"]),
      })
    )
    .query(async ({ input }) => {
      try {
        const question = await generateConfidenceBuilder(input.topic, input as any);
        return {
          success: true,
          question,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate question",
          question: "What's one thing you already know about this topic?",
        };
      }
    }),

  // ============= ADAPTIVE CONTENT DELIVERY =============

  /**
   * Generate adaptive content based on learner profile
   */
  generateAdaptiveLesson: publicProcedure
    .input(
      z.object({
        learnerId: z.string(),
        topic: z.string(),
        learningStyle: z.enum(["visual", "kinesthetic", "auditory", "reading-writing"]),
        currentDifficulty: z.enum(["beginner", "intermediate", "advanced"]),
        learningPace: z.enum(["slow", "moderate", "fast"]),
        engagementScore: z.number().min(0).max(100),
        motivationLevel: z.enum(["low", "moderate", "high"]),
      })
    )
    .mutation(async ({ input }: any) => {
      try {
        const profile: any = {
          id: input.learnerId,
          learningStyle: input.learningStyle,
          currentDifficulty: input.currentDifficulty,
          learningPace: input.learningPace,
          engagementScore: input.engagementScore,
          motivationLevel: input.motivationLevel,
          conceptMastery: {},
          recentQuizScores: [],
          detectedMisconceptions: [],
          priorKnowledge: {},
        };

        const content = await generateAdaptiveContent({
          learnerId: input.learnerId,
          topic: input.topic,
          profile,
        });

        return {
          success: true,
          content: content.content,
          difficulty: content.difficulty,
          modality: content.modality,
          estimatedMinutes: content.estimatedMinutes,
          misconceptionsAddressed: content.misconceptionsAddressed,
          personalizationNotes: content.personalizationNotes,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate content",
        };
      }
    }),

  /**
   * Generate difficulty variant of content
   */
  generateDifficultyVariant: publicProcedure
    .input(
      z.object({
        topic: z.string(),
        currentDifficulty: z.enum(["beginner", "intermediate", "advanced"]),
        targetDifficulty: z.enum(["beginner", "intermediate", "advanced"]),
        learningStyle: z.enum(["visual", "kinesthetic", "auditory", "reading-writing"]),
      })
    )
    .mutation(async ({ input }: any) => {
      try {
        const profile: any = {
          id: "temp",
          learningStyle: input.learningStyle,
          currentDifficulty: input.currentDifficulty,
          learningPace: "moderate",
          engagementScore: 50,
          motivationLevel: "moderate",
          conceptMastery: {},
          recentQuizScores: [],
          detectedMisconceptions: [],
          priorKnowledge: {},
        };

        const content = await generateDifficultyVariant(input.topic, input.currentDifficulty, input.targetDifficulty, profile);

        return {
          success: true,
          content,
          difficulty: input.targetDifficulty,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate variant",
        };
      }
    }),

  // ============= MISCONCEPTION DETECTION & CORRECTION =============

  /**
   * Detect and correct misconceptions from quiz answers
   */
  detectMisconception: publicProcedure
    .input(
      z.object({
        question: z.string(),
        userAnswer: z.string(),
        correctAnswer: z.string(),
        concept: z.string(),
        learningStyle: z.enum(["visual", "kinesthetic", "auditory", "reading-writing"]),
      })
    )
    .mutation(async ({ input }: any) => {
      try {
        const profile: any = {
          id: "temp",
          learningStyle: input.learningStyle,
          currentDifficulty: "intermediate",
          learningPace: "moderate",
          engagementScore: 50,
          motivationLevel: "moderate",
          conceptMastery: {},
          recentQuizScores: [],
          detectedMisconceptions: [],
          priorKnowledge: {},
        };

        const result = await detectAndCorrectMisconception(
          input.question,
          input.userAnswer,
          input.correctAnswer,
          input.concept,
          profile
        );

        return {
          success: true,
          ...result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to detect misconception",
          misconceptionDetected: false,
        };
      }
    }),

  /**
   * Generate misconception correction content
   */
  generateMisconceptionCorrection: publicProcedure
    .input(
      z.object({
        concept: z.string(),
        wrongBelief: z.string(),
        correctBelief: z.string(),
        learningStyle: z.enum(["visual", "kinesthetic", "auditory", "reading-writing"]),
      })
    )
    .mutation(async ({ input }: any) => {
      try {
        const profile: any = {
          id: "temp",
          learningStyle: input.learningStyle,
          currentDifficulty: "intermediate",
          learningPace: "moderate",
          engagementScore: 50,
          motivationLevel: "moderate",
          conceptMastery: {},
          recentQuizScores: [],
          detectedMisconceptions: [],
          priorKnowledge: {},
        };

        const correction = await generateMisconceptionCorrection(
          {
            concept: input.concept,
            wrongBelief: input.wrongBelief,
            correctBelief: input.correctBelief,
          },
          profile
        );

        return {
          success: true,
          correction,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate correction",
        };
      }
    }),

  // ============= UNIFIED LEARNING FLOW =============

  /**
   * Check if should transition from Q&A to learning
   */
  shouldTransitionToLearning: publicProcedure
    .input(z.object({ userMessage: z.string(), conversationLength: z.number() }))
    .query(({ input }: { input: { userMessage: string; conversationLength: number } }) => {
      const result = shouldTransitionToLearning(input.userMessage, input.conversationLength);
      return {
        success: true,
        ...result,
      };
    }),

  /**
   * Check if should transition from learning to Q&A
   */
  shouldTransitionToQA: publicProcedure
    .input(z.object({ userMessage: z.string() }))
    .query(({ input }: { input: { userMessage: string } }) => {
      const result = shouldTransitionToQA(input.userMessage);
      return {
        success: true,
        ...result,
      };
    }),

  /**
   * Generate transition message from Q&A to learning
   */
  generateTransitionToLearning: publicProcedure
    .input(
      z.object({
        topic: z.string(),
        conversationSummary: z.string(),
        learningStyle: z.enum(["visual", "kinesthetic", "auditory", "reading-writing"]),
        learningPace: z.enum(["slow", "moderate", "fast"]),
        motivationLevel: z.enum(["low", "moderate", "high"]),
      })
    )
    .mutation(async ({ input }: any) => {
      try {
        const profile: any = {
          id: "temp",
          learningStyle: input.learningStyle,
          currentDifficulty: "intermediate",
          learningPace: input.learningPace,
          engagementScore: 50,
          motivationLevel: input.motivationLevel,
          conceptMastery: {},
          recentQuizScores: [],
          detectedMisconceptions: [],
          priorKnowledge: {},
        };

        const message = await generateTransitionToLearning(input.topic, input.conversationSummary, profile);

        return {
          success: true,
          message,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate transition",
        };
      }
    }),

  /**
   * Handle question during learning path
   */
  handleInPathQuestion: publicProcedure
    .input(
      z.object({
        question: z.string(),
        currentLesson: z.string(),
        currentConcept: z.string(),
        learningStyle: z.enum(["visual", "kinesthetic", "auditory", "reading-writing"]),
      })
    )
    .mutation(async ({ input }: any) => {
      try {
        const profile: any = {
          id: "temp",
          learningStyle: input.learningStyle,
          currentDifficulty: "intermediate",
          learningPace: "moderate",
          engagementScore: 50,
          motivationLevel: "moderate",
          conceptMastery: {},
          recentQuizScores: [],
          detectedMisconceptions: [],
          priorKnowledge: {},
        };

        const result = await handleInPathQuestion(input.question, input.currentLesson, input.currentConcept, profile);

        return {
          success: true,
          ...result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to handle question",
        };
      }
    }),

  /**
   * Generate next learning path recommendation
   */
  generateNextPath: publicProcedure
    .input(
      z.object({
        currentTopic: z.string(),
        masteryLevel: z.number().min(0).max(100),
        learningStyle: z.enum(["visual", "kinesthetic", "auditory", "reading-writing"]),
        learningPace: z.enum(["slow", "moderate", "fast"]),
        motivationLevel: z.enum(["low", "moderate", "high"]),
      })
    )
    .mutation(async ({ input }: any) => {
      try {
        const profile: any = {
          id: "temp",
          learningStyle: input.learningStyle,
          currentDifficulty: "intermediate",
          learningPace: input.learningPace,
          engagementScore: input.masteryLevel,
          motivationLevel: input.motivationLevel,
          conceptMastery: {},
          recentQuizScores: [],
          detectedMisconceptions: [],
          priorKnowledge: {},
        };

        const result = await generateNextLearningPath(input.currentTopic, input.masteryLevel, profile);

        return {
          success: true,
          ...result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate next path",
        };
      }
    }),

  /**
   * Generate encouragement message
   */
  generateEncouragement: publicProcedure
    .input(
      z.object({
        topic: z.string(),
        masteryLevel: z.number().min(0).max(100),
        learningStyle: z.enum(["visual", "kinesthetic", "auditory", "reading-writing"]),
        motivationLevel: z.enum(["low", "moderate", "high"]),
        milestone: z.string().optional(),
      })
    )
    .mutation(async ({ input }: any) => {
      try {
        const profile: any = {
          id: "temp",
          learningStyle: input.learningStyle,
          currentDifficulty: "intermediate",
          learningPace: "moderate",
          engagementScore: input.masteryLevel,
          motivationLevel: input.motivationLevel,
          conceptMastery: {},
          recentQuizScores: [],
          detectedMisconceptions: [],
          priorKnowledge: {},
        };

        const message = await generateEncouragement(input.topic, input.masteryLevel, profile, input.milestone);

        return {
          success: true,
          message,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate encouragement",
        };
      }
    }),
});
