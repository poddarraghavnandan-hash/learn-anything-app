/**
 * Spaced Repetition Service
 * 
 * Implements SM-2 (SuperMemo 2) algorithm for optimal review scheduling
 * Based on decades of research on human memory and forgetting curves
 */

export interface ReviewMetrics {
  easeFactor: number; // Difficulty factor (1.3 - 2.5)
  interval: number; // Days until next review
  repetitions: number; // Number of successful reviews
  nextReviewDate: Date;
  quality: number; // 0-5 quality of response (0=blackout, 5=perfect)
}

export interface ConceptReview {
  conceptId: number;
  conceptName: string;
  lastReviewDate: Date | null;
  nextReviewDate: Date;
  easeFactor: number;
  repetitions: number;
  quizAccuracy: number;
  confidenceInferred: number;
  daysUntilReview: number;
  priority: "urgent" | "high" | "medium" | "low"; // Based on overdue status
}

/**
 * SM-2 Algorithm Implementation
 * 
 * The algorithm adjusts review intervals based on performance:
 * - Correct answers: interval increases exponentially
 * - Incorrect answers: interval resets to 1 day
 * - Difficulty factor adjusts based on response quality
 */
export class SpacedRepetitionEngine {
  /**
   * Calculate next review date using SM-2 algorithm
   * 
   * @param quality Response quality (0-5)
   *   0 = complete blackout
   *   1 = incorrect response
   *   2 = incorrect but close
   *   3 = correct with serious difficulty
   *   4 = correct with minor difficulty
   *   5 = perfect response
   * @param currentMetrics Current review metrics
   * @returns Updated metrics for next review
   */
  static calculateNextReview(quality: number, currentMetrics: ReviewMetrics): ReviewMetrics {
    // Clamp quality to 0-5
    const q = Math.max(0, Math.min(5, quality));

    let newEaseFactor = currentMetrics.easeFactor;
    let newInterval = 1;
    let newRepetitions = currentMetrics.repetitions;

    // If response quality is below 3, reset progress
    if (q < 3) {
      newEaseFactor = Math.max(1.3, currentMetrics.easeFactor - 0.2);
      newInterval = 1;
      newRepetitions = 0;
    } else {
      // Calculate new ease factor
      newEaseFactor = Math.max(
        1.3,
        currentMetrics.easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
      );

      // Increment repetitions
      newRepetitions = currentMetrics.repetitions + 1;

      // Calculate new interval based on repetition number
      if (newRepetitions === 1) {
        newInterval = 1; // First review: 1 day
      } else if (newRepetitions === 2) {
        newInterval = 3; // Second review: 3 days
      } else {
        // Subsequent reviews: multiply by ease factor
        newInterval = Math.round(currentMetrics.interval * newEaseFactor);
      }
    }

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    return {
      easeFactor: newEaseFactor,
      interval: newInterval,
      repetitions: newRepetitions,
      nextReviewDate,
      quality: q,
    };
  }

  /**
   * Get priority for review based on overdue status
   */
  static getPriority(nextReviewDate: Date): "urgent" | "high" | "medium" | "low" {
    const now = new Date();
    const daysUntilReview = Math.floor((nextReviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilReview < -7) return "urgent"; // More than 1 week overdue
    if (daysUntilReview < 0) return "high"; // Overdue
    if (daysUntilReview <= 1) return "medium"; // Due within 1 day
    return "low"; // Not due soon
  }

  /**
   * Calculate days until review
   */
  static getDaysUntilReview(nextReviewDate: Date): number {
    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.ceil((nextReviewDate.getTime() - now.getTime()) / msPerDay);
  }

  /**
   * Get all concepts due for review
   */
  static filterConceptsDueForReview(concepts: ConceptReview[]): ConceptReview[] {
    const now = new Date();
    return concepts
      .filter((c) => c.nextReviewDate <= now)
      .sort((a, b) => {
        // Sort by priority (urgent first) then by how overdue
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.nextReviewDate.getTime() - b.nextReviewDate.getTime();
      });
  }

  /**
   * Get upcoming reviews (next 7 days)
   */
  static getUpcomingReviews(concepts: ConceptReview[]): ConceptReview[] {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    return concepts
      .filter((c) => c.nextReviewDate > now && c.nextReviewDate <= sevenDaysFromNow)
      .sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime());
  }

  /**
   * Calculate retention probability based on ease factor and days since last review
   * Uses exponential decay model
   */
  static calculateRetentionProbability(
    easeFactor: number,
    daysSinceReview: number
  ): number {
    // Exponential decay: P(t) = e^(-t/T) where T is decay constant
    // T is inversely related to ease factor (higher ease = slower decay)
    const decayConstant = 30 / easeFactor; // Normalize to ease factor
    return Math.exp(-daysSinceReview / decayConstant);
  }

  /**
   * Estimate mastery level (0-100%) based on review history
   */
  static estimateMastery(
    repetitions: number,
    quizAccuracy: number,
    confidenceInferred: number,
    easeFactor: number
  ): number {
    // Mastery = combination of:
    // - Number of successful reviews (repetitions)
    // - Quiz accuracy (0-1)
    // - Confidence (0-1)
    // - Ease factor (higher = easier = better mastery)

    const reviewScore = Math.min(100, repetitions * 20); // Each review adds 20%
    const accuracyScore = quizAccuracy * 100; // 0-100
    const confidenceScore = confidenceInferred * 100; // 0-100
    const easeScore = Math.min(100, (easeFactor - 1.3) / (2.5 - 1.3) * 100); // Normalize 1.3-2.5 to 0-100

    // Weighted average
    return (
      reviewScore * 0.3 +
      accuracyScore * 0.3 +
      confidenceScore * 0.2 +
      easeScore * 0.2
    );
  }
}

/**
 * Review Session Manager
 * Handles the lifecycle of a review session
 */
export class ReviewSessionManager {
  private sessionId: string;
  private conceptsToReview: ConceptReview[];
  private currentIndex: number = 0;
  private startTime: Date;
  private responses: Array<{ conceptId: number; quality: number; timeSpent: number }> = [];

  constructor(sessionId: string, conceptsToReview: ConceptReview[]) {
    this.sessionId = sessionId;
    this.conceptsToReview = conceptsToReview;
    this.startTime = new Date();
  }

  getCurrentConcept(): ConceptReview | null {
    return this.conceptsToReview[this.currentIndex] || null;
  }

  getTotalConcepts(): number {
    return this.conceptsToReview.length;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  recordResponse(quality: number, timeSpent: number): void {
    const current = this.getCurrentConcept();
    if (current) {
      this.responses.push({
        conceptId: current.conceptId,
        quality,
        timeSpent,
      });
      this.currentIndex++;
    }
  }

  isComplete(): boolean {
    return this.currentIndex >= this.conceptsToReview.length;
  }

  getProgress(): number {
    return this.conceptsToReview.length > 0
      ? (this.currentIndex / this.conceptsToReview.length) * 100
      : 0;
  }

  getSessionSummary(): {
    totalConcepts: number;
    reviewedConcepts: number;
    averageQuality: number;
    totalTimeSpent: number;
    sessionDuration: number;
  } {
    const totalTimeSpent = this.responses.reduce((sum, r) => sum + r.timeSpent, 0);
    const averageQuality =
      this.responses.length > 0
        ? this.responses.reduce((sum, r) => sum + r.quality, 0) / this.responses.length
        : 0;

    return {
      totalConcepts: this.conceptsToReview.length,
      reviewedConcepts: this.responses.length,
      averageQuality,
      totalTimeSpent,
      sessionDuration: Date.now() - this.startTime.getTime(),
    };
  }

  getResponses(): Array<{ conceptId: number; quality: number; timeSpent: number }> {
    return this.responses;
  }
}
