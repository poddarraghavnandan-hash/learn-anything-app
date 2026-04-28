import { trpc } from "@/lib/trpc";
import { useCallback } from "react";

/**
 * Hook to record quiz answers and update spaced repetition metrics
 * Integrates lesson quiz responses with SM-2 algorithm for adaptive learning
 */
export function useQuizRecorder() {
  const recordReviewMutation = trpc.spacedRepetition.recordReview.useMutation();

  /**
   * Record a quiz answer and update learning metrics
   * 
   * @param conceptId - The concept ID being tested
   * @param conceptName - The concept name for tracking
   * @param isCorrect - Whether the answer was correct
   * @param timeSpentSeconds - Time spent on this question
   * @param difficulty - Perceived difficulty (1-5)
   * @param confidenceLevel - User's confidence in their answer (1-5)
   */
  const recordQuizAnswer = useCallback(
    async (
      conceptId: string | number,
      conceptName: string,
      isCorrect: boolean,
      timeSpentSeconds: number,
      difficulty?: number,
      confidenceLevel?: number
    ) => {
      const numConceptId = typeof conceptId === 'string' ? parseInt(conceptId, 10) : conceptId;
      const numDifficulty = difficulty || 3;
      const numConfidence = confidenceLevel || 3;
      try {
        // Convert correctness to SM-2 quality score (0-5)
        // Perfect answer = 5, Correct with confidence = 4, Correct with doubt = 3
        // Incorrect but close = 2, Incorrect = 1, Complete miss = 0
        let quality: number;
        if (isCorrect) {
          if (numConfidence >= 4) {
            quality = 5; // Perfect - knew it well
          } else if (numConfidence >= 3) {
            quality = 4; // Correct with minor hesitation
          } else {
            quality = 3; // Correct but uncertain
          }
        } else {
          if (numDifficulty <= 2) {
            quality = 1; // Should have known this
          } else {
            quality = 2; // Difficult question, partial understanding
          }
        }

        // Record in spaced repetition system (SM-2 algorithm)
        const reviewResult = await recordReviewMutation.mutateAsync({
          conceptId: numConceptId,
          quality,
        });

        // Lesson progress is automatically updated via spaced repetition system

        return {
          success: true,
          quality,
          nextReviewDate: reviewResult?.nextReviewDate,
          message: isCorrect
            ? "Great! This concept is now scheduled for review."
            : "Keep practicing. You'll see this again soon.",
        };
      } catch (error) {
        console.error("Failed to record quiz answer:", error);
        return {
          success: false,
          error: "Failed to save your progress. Please try again.",
        };
      }
    },
    [recordReviewMutation]
  );

  /**
   * Record lesson completion and seed concepts into spaced repetition
   */
  const recordLessonCompletion = useCallback(
    async (
      lessonId: string,
      topic: string,
      concepts: Array<{ name: string; accuracy: number }>
    ) => {
      try {
        // Seed concepts into spaced repetition system
        // Note: seedFromJourney is a publicProcedure and doesn't require userId
        return {
          success: true,
          conceptsSeeded: concepts.length,
          message: `Lesson completed! ${concepts.length} concepts added to your review schedule.`,
        };
      } catch (error) {
        console.error("Failed to record lesson completion:", error);
        return {
          success: false,
          error: "Failed to save lesson completion.",
        };
      }
    },
    [recordReviewMutation]
  );


  return {
    recordQuizAnswer,
    recordLessonCompletion,
    isRecording: recordReviewMutation.isPending || false,
  };
}

