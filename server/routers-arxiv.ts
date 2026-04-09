/**
 * ArxiVisuals API Router
 * Handles paper discovery, processing, and content generation
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { searchArxiv, getPaperById, getTrendingPapers } from "./services/arxiv-service";
import {
  extractConcepts,
  generateConceptExplanation,
  identifyPrerequisites,
} from "./services/concept-extractor";
import {
  generateTeachingPlan,
  generateLessonContent,
  generateVideoStoryboard,
  generateLessonAssessment,
} from "./services/teaching-plan-generator";

export const arxivRouter = router({
  /**
   * Search arXiv papers
   */
  searchPapers: publicProcedure
    .input(
      z.object({
        query: z.string(),
        category: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(10),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const result = await searchArxiv(input.query, input.category, input.limit, input.offset);
      return {
        papers: result.papers.map((p) => ({
          id: p.id,
          title: p.title,
          authors: p.authors,
          summary: p.summary,
          publishedDate: p.publishedDate,
          categories: p.categories,
          arxivUrl: p.arxivUrl,
        })),
        totalResults: result.totalResults,
        startIndex: result.startIndex,
        itemsPerPage: result.itemsPerPage,
      };
    }),

  /**
   * Get trending papers
   */
  getTrendingPapers: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(10) }))
    .query(async ({ input }) => {
      const papers = await getTrendingPapers(input.limit);
      return papers.map((p) => ({
        id: p.id,
        title: p.title,
        authors: p.authors,
        summary: p.summary,
        publishedDate: p.publishedDate,
        categories: p.categories,
        arxivUrl: p.arxivUrl,
      }));
    }),

  /**
   * Get paper details
   */
  getPaperDetails: publicProcedure
    .input(z.object({ paperId: z.string() }))
    .query(async ({ input }) => {
      const paper = await getPaperById(input.paperId);
      return {
        id: paper.id,
        title: paper.title,
        authors: paper.authors,
        summary: paper.summary,
        publishedDate: paper.publishedDate,
        categories: paper.categories,
        pdfUrl: paper.pdfUrl,
        arxivUrl: paper.arxivUrl,
      };
    }),

  /**
   * Extract concepts from paper
   */
  extractConcepts: publicProcedure
    .input(
      z.object({
        title: z.string(),
        abstract: z.string(),
        authors: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const conceptGraph = await extractConcepts(input.title, input.abstract, input.authors);
      return {
        concepts: conceptGraph.concepts,
        relationships: conceptGraph.relationships,
        difficulty: conceptGraph.difficulty,
      };
    }),

  /**
   * Generate teaching plan from concepts
   */
  generateTeachingPlan: publicProcedure
    .input(
      z.object({
        paperTitle: z.string(),
        concepts: z.array(z.string()),
        abstract: z.string(),
        targetAudience: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
      })
    )
    .mutation(async ({ input }) => {
      const plan = await generateTeachingPlan(
        input.paperTitle,
        input.concepts,
        input.abstract,
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
        paperContext: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const content = await generateLessonContent(
        input.stepTitle,
        input.learningObjective,
        input.concepts,
        input.paperContext
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
   * Full paper processing pipeline
   * Extracts concepts → generates teaching plan → creates storyboards
   */
  processPaperFull: publicProcedure
    .input(
      z.object({
        paperId: z.string(),
        targetAudience: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Step 1: Get paper details
        const paper = await getPaperById(input.paperId);

        // Step 2: Extract concepts
        const conceptGraph = await extractConcepts(paper.title, paper.summary, paper.authors);

        // Step 3: Generate teaching plan
        const conceptNames = conceptGraph.concepts.map((c) => c.name);
        const teachingPlan = await generateTeachingPlan(
          paper.title,
          conceptNames,
          paper.summary,
          input.targetAudience
        );

        // Step 4: Generate content for each step
        const stepsWithContent = await Promise.all(
          teachingPlan.steps.map(async (step) => {
            const content = await generateLessonContent(
              step.title,
              step.learningObjective,
              step.concepts,
              paper.summary
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
          paper: {
            id: paper.id,
            title: paper.title,
            authors: paper.authors,
            arxivUrl: paper.arxivUrl,
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
        console.error("Paper processing error:", error);
        throw new Error("Failed to process paper");
      }
    }),
});
