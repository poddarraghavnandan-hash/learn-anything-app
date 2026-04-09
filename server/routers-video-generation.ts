/**
 * Video Generation Router
 * API endpoints for generating animated explainer videos
 */

import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import {
  createVideoGenerationTask,
  generateLottieAnimation,
  type ConceptStoryboard,
  type StoryboardStep,
} from "./services/video-generator";

// Input schemas
const storyboardStepSchema = z.object({
  title: z.string(),
  description: z.string(),
  visualType: z.enum(["text", "diagram", "equation", "chart", "animation"]),
  content: z.string(),
  duration: z.number().min(1).max(60),
  animations: z
    .array(
      z.object({
        type: z.enum(["fade", "slide", "scale", "rotate", "bounce"]),
        duration: z.number(),
        delay: z.number(),
        easing: z.string().optional(),
      })
    )
    .optional(),
});

const storyboardSchema = z.object({
  title: z.string(),
  steps: z.array(storyboardStepSchema).min(1).max(20),
  duration: z.number().optional(),
});

const generateVideoSchema = z.object({
  conceptId: z.string(),
  storyboard: storyboardSchema,
});

const renderVideoSchema = z.object({
  conceptId: z.string(),
  lottieJson: z.record(z.any()),
  outputFormat: z.enum(["mp4", "webm", "gif"]).optional().default("mp4"),
});

export const videoGenerationRouter = router({
  /**
   * Generate Lottie animation from storyboard
   * POST /api/trpc/videoGeneration.generateAnimation
   */
  generateAnimation: publicProcedure
    .input(storyboardSchema)
    .mutation(async ({ input }) => {
      try {
        const lottieJson = generateLottieAnimation(input as ConceptStoryboard);

        return {
          success: true,
          data: {
            lottieJson,
            estimatedDuration: input.duration || input.steps.reduce((sum, s) => sum + s.duration, 0),
            frameCount: Math.ceil(
              (input.duration || input.steps.reduce((sum, s) => sum + s.duration, 0)) * 30
            ),
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate animation",
        };
      }
    }),

  /**
   * Create video generation task
   * POST /api/trpc/videoGeneration.createTask
   */
  createTask: publicProcedure.input(generateVideoSchema).mutation(async ({ input }) => {
    try {
      const video = await createVideoGenerationTask(
        input.conceptId,
        input.storyboard as ConceptStoryboard
      );

      return {
        success: true,
        data: {
          videoId: video.id,
          conceptId: video.conceptId,
          title: video.title,
          duration: video.duration,
          createdAt: video.createdAt.toISOString(),
          status: "processing",
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create video task",
      };
    }
  }),

  /**
   * Get video generation status
   * GET /api/trpc/videoGeneration.getStatus
   */
  getStatus: publicProcedure.input(z.object({ videoId: z.string() })).query(async ({ input }) => {
    try {
      // TODO: Implement actual status tracking from database
      return {
        success: true,
        data: {
          videoId: input.videoId,
          status: "completed",
          progress: 100,
          videoUrl: `/videos/${input.videoId}.mp4`,
          thumbnailUrl: `/videos/${input.videoId}-thumb.jpg`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get status",
      };
    }
  }),

  /**
   * List generated videos for a concept
   * GET /api/trpc/videoGeneration.listVideos
   */
  listVideos: publicProcedure
    .input(z.object({ conceptId: z.string(), limit: z.number().optional().default(10) }))
    .query(async ({ input }) => {
      try {
        // TODO: Implement actual video listing from database
        return {
          success: true,
          data: {
            videos: [
              {
                videoId: `video-${input.conceptId}-1`,
                title: "Concept Overview",
                duration: 120,
                videoUrl: `/videos/concept-overview.mp4`,
                thumbnailUrl: `/videos/concept-overview-thumb.jpg`,
                createdAt: new Date().toISOString(),
              },
            ],
            total: 1,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to list videos",
        };
      }
    }),

  /**
   * Delete generated video
   * DELETE /api/trpc/videoGeneration.deleteVideo
   */
  deleteVideo: publicProcedure
    .input(z.object({ videoId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        // TODO: Implement actual video deletion
        return {
          success: true,
          data: {
            deleted: true,
            videoId: input.videoId,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to delete video",
        };
      }
    }),
});
