/**
 * ArxiVisuals Content Processing API Router
 * Generic router for processing ANY dense text content into learning materials
 * Supports: Gemini-generated, PDFs, URLs, pasted text, arXiv papers
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { processContentInput, validateContent } from "./services/content-processor";
import {
  extractConcepts,
  generateConceptExplanation,
} from "./services/concept-extractor";
import {
  generateTeachingPlan,
  generateLessonContent,
  generateVideoStoryboard,
  generateLessonAssessment,
} from "./services/teaching-plan-generator";

export const arxivisualsRouter = router({
  /**
   * Process content input (paste, URL, PDF, or Gemini-generated)
   */
  processContent: publicProcedure
    .input(
      z.object({
        type: z.enum(["pasted_text", "url", "pdf", "gemini_generated"]),
        content: z.string().optional(),
        url: z.string().optional(),
        pdfPath: z.string().optional(),
        topic: z.string().optional(),
        geminiPrompt: z.string().optional(),
        title: z.string().optional(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const processed = await processContentInput({
        type: input.type,
        content: input.content,
        url: input.url,
        pdfPath: input.pdfPath,
        topic: input.topic,
        geminiPrompt: input.geminiPrompt,
        title: input.title,
        difficulty: input.difficulty,
      });

      // Validate content
      const validation = await validateContent(processed.content);

      if (!validation.isValid) {
        throw new Error(`Content validation failed: ${validation.issues.join(", ")}`);
      }

      return {
        title: processed.title,
        summary: processed.summary,
        topic: processed.topic,
        difficulty: processed.difficulty,
        contentLength: processed.content.length,
        wordCount: processed.content.split(/\s+/).length,
        recommendations: validation.recommendations,
      };
    }),

  /**
   * Generate Gemini content on any topic
   */
  generateGeminiContent: publicProcedure
    .input(
      z.object({
        topic: z.string(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
        customPrompt: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const processed = await processContentInput({
        type: "gemini_generated",
        topic: input.topic,
        geminiPrompt: input.customPrompt,
        difficulty: input.difficulty,
      });

      return {
        title: processed.title,
        content: processed.content,
        summary: processed.summary,
        topic: processed.topic,
        difficulty: processed.difficulty,
      };
    }),

  /**
   * Extract concepts from processed content
   */
  extractConcepts: publicProcedure
    .input(
      z.object({
        title: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const conceptGraph = await extractConcepts(input.title, input.content, []);
      return {
        concepts: conceptGraph.concepts,
        relationships: conceptGraph.relationships,
        difficulty: conceptGraph.difficulty,
        conceptCount: conceptGraph.concepts.length,
      };
    }),

  /**
   * Generate teaching plan from content
   */
  generateTeachingPlan: publicProcedure
    .input(
      z.object({
        title: z.string(),
        content: z.string(),
        concepts: z.array(z.string()),
        targetAudience: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
      })
    )
    .mutation(async ({ input }) => {
      const plan = await generateTeachingPlan(
        input.title,
        input.concepts,
        input.content,
        input.targetAudience
      );

      return {
        totalSteps: plan.totalSteps,
        estimatedTotalTime: plan.estimatedTotalTime,
        difficulty: plan.difficulty,
        steps: plan.steps.map((step) => ({
          stepNumber: step.stepNumber,
          title: step.title,
          learningObjective: step.learningObjective,
          keyInsight: step.keyInsight,
          visualMetaphor: step.visualMetaphor,
          exampleUseCase: step.exampleUseCase,
          estimatedTime: step.estimatedTime,
          difficulty: step.difficulty,
          concepts: step.concepts,
          prerequisites: step.prerequisites,
          quizQuestions: step.quizQuestions,
        })),
        learningOutcomes: plan.learningOutcomes,
        assessmentStrategy: plan.assessmentStrategy,
      };
    }),

  /**
   * Generate lesson content for a step
   */
  generateLessonContent: publicProcedure
    .input(
      z.object({
        stepTitle: z.string(),
        learningObjective: z.string(),
        concepts: z.array(z.string()),
        contentContext: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const content = await generateLessonContent(
        input.stepTitle,
        input.learningObjective,
        input.concepts,
        input.contentContext
      );
      return content;
    }),

  /**
   * Generate video storyboard for a lesson
   */
  generateVideoStoryboard: publicProcedure
    .input(
      z.object({
        lessonTitle: z.string(),
        mainContent: z.string(),
        keyPoints: z.array(z.string()),
        visualizationGuide: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const storyboard = await generateVideoStoryboard(
        input.lessonTitle,
        input.mainContent,
        input.keyPoints,
        input.visualizationGuide
      );
      return storyboard;
    }),

  /**
   * Generate assessment questions for a lesson
   */
  generateAssessment: publicProcedure
    .input(
      z.object({
        stepTitle: z.string(),
        learningObjective: z.string(),
        keyPoints: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const assessment = await generateLessonAssessment(
        input.stepTitle,
        input.learningObjective,
        input.keyPoints
      );
      return assessment;
    }),

  /**
   * Full content processing pipeline
   * Content → Concepts → Teaching Plan → Storyboards → Assessments
   */
  processContentFull: publicProcedure
    .input(
      z.object({
        type: z.enum(["pasted_text", "url", "pdf", "gemini_generated"]),
        content: z.string().optional(),
        url: z.string().optional(),
        pdfPath: z.string().optional(),
        topic: z.string().optional(),
        geminiPrompt: z.string().optional(),
        title: z.string().optional(),
        targetAudience: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Step 1: Process content
        const processed = await processContentInput({
          type: input.type,
          content: input.content,
          url: input.url,
          pdfPath: input.pdfPath,
          topic: input.topic,
          geminiPrompt: input.geminiPrompt,
          title: input.title,
        });

        // Step 2: Extract concepts
        const conceptGraph = await extractConcepts(processed.title, processed.content, []);
        const conceptNames = conceptGraph.concepts.map((c) => c.name);

        // Step 3: Generate teaching plan
        const teachingPlan = await generateTeachingPlan(
          processed.title,
          conceptNames,
          processed.content,
          input.targetAudience
        );

        // Step 4: Generate content for each step
        const stepsWithContent = await Promise.all(
          teachingPlan.steps.map(async (step) => {
            const content = await generateLessonContent(
              step.title,
              step.learningObjective,
              step.concepts,
              processed.content
            );

            const storyboard = await generateVideoStoryboard(
              step.title,
              content.mainContent,
              content.keyPoints,
              content.visualizationGuide
            );

            const assessment = await generateLessonAssessment(
              step.title,
              step.learningObjective,
              content.keyPoints
            );

            return {
              ...step,
              content,
              storyboard,
              assessment,
            };
          })
        );

        return {
          content: {
            title: processed.title,
            topic: processed.topic,
            difficulty: processed.difficulty,
            summary: processed.summary,
          },
          concepts: conceptGraph.concepts,
          teachingPlan: {
            totalSteps: teachingPlan.totalSteps,
            estimatedTotalTime: teachingPlan.estimatedTotalTime,
            difficulty: teachingPlan.difficulty,
            learningOutcomes: teachingPlan.learningOutcomes,
          },
          steps: stepsWithContent,
          processingStatus: "complete",
        };
      } catch (error) {
        console.error("Content processing error:", error);
        throw new Error("Failed to process content");
      }
    }),
});
