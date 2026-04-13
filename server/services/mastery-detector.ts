/**
 * Mastery Detection Algorithm
 * Intelligently detects user mastery based on interactions (not direct tests)
 * Uses multiple signals to determine readiness to advance
 */

export interface MasterySignal {
  type: string; // "correct_answer", "fast_response", "confidence", "explanation_quality", etc.
  weight: number; // 0-1, importance of this signal
  value: number; // 0-100, signal strength
  timestamp: number;
}

export interface MasteryAssessment {
  readinessScore: number; // 0-100, ready to advance?
  confidenceLevel: number; // 0-100, AI confidence in assessment
  signals: MasterySignal[];
  recommendation: "advance" | "review" | "practice" | "skip";
  reason: string;
}

/**
 * Detect mastery based on interaction patterns
 * Uses implicit signals rather than explicit tests
 */
export function detectMastery(
  interactions: Array<{
    type: string;
    data: Record<string, any>;
    quality: number;
    confidence: number;
    timeSpent: number;
  }>,
  levelNumber: number
): MasteryAssessment {
  const signals: MasterySignal[] = [];
  let totalScore = 0;

  // Signal 1: Quiz Performance (implicit)
  const quizInteractions = interactions.filter((i) => i.type === "quiz_answer");
  if (quizInteractions.length > 0) {
    const avgQuality = quizInteractions.reduce((sum, i) => sum + i.quality, 0) / quizInteractions.length;
    const correctCount = quizInteractions.filter((i) => i.quality >= 75).length;
    const correctRatio = correctCount / quizInteractions.length;

    signals.push({
      type: "quiz_performance",
      weight: 0.3,
      value: avgQuality * correctRatio,
      timestamp: Date.now(),
    });
  }

  // Signal 2: Engagement (time spent, interaction frequency)
  const timeSpentTotal = interactions.reduce((sum, i) => sum + i.timeSpent, 0);
  const engagementScore = Math.min(100, (timeSpentTotal / (levelNumber * 600)) * 100); // Expect 10min per level

  signals.push({
    type: "engagement",
    weight: 0.2,
    value: engagementScore,
    timestamp: Date.now(),
  });

  // Signal 3: Confidence (user self-reported)
  const avgConfidence = interactions.reduce((sum, i) => sum + i.confidence, 0) / interactions.length;

  signals.push({
    type: "confidence",
    weight: 0.15,
    value: avgConfidence,
    timestamp: Date.now(),
  });

  // Signal 4: Explanation Quality (if user explains concepts)
  const explanationInteractions = interactions.filter((i) => i.type === "explanation");
  if (explanationInteractions.length > 0) {
    const avgExplanationQuality =
      explanationInteractions.reduce((sum, i) => sum + i.quality, 0) / explanationInteractions.length;

    signals.push({
      type: "explanation_quality",
      weight: 0.2,
      value: avgExplanationQuality,
      timestamp: Date.now(),
    });
  }

  // Signal 5: Consistency (repeated interactions show reinforcement)
  const interactionFrequency = interactions.length;
  const consistencyScore = Math.min(100, (interactionFrequency / (levelNumber * 5)) * 100);

  signals.push({
    type: "consistency",
    weight: 0.15,
    value: consistencyScore,
    timestamp: Date.now(),
  });

  // Calculate weighted readiness score
  let weightedScore = 0;
  let totalWeight = 0;

  for (const signal of signals) {
    weightedScore += signal.value * signal.weight;
    totalWeight += signal.weight;
  }

  const readinessScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

  // Determine recommendation
  let recommendation: "advance" | "review" | "practice" | "skip" = "practice";
  let reason = "";

  if (readinessScore >= 85) {
    recommendation = "advance";
    reason = "Strong mastery demonstrated across all signals. Ready for next level.";
  } else if (readinessScore >= 70) {
    recommendation = "review";
    reason = "Good progress. Review key concepts before advancing.";
  } else if (readinessScore >= 50) {
    recommendation = "practice";
    reason = "More practice needed. Focus on weak areas.";
  } else {
    recommendation = "practice";
    reason = "Significant gaps detected. Recommend focused practice.";
  }

  // Confidence level based on interaction count
  const confidenceLevel = Math.min(100, (interactions.length / (levelNumber * 10)) * 100);

  return {
    readinessScore: Math.round(readinessScore),
    confidenceLevel: Math.round(confidenceLevel),
    signals,
    recommendation,
    reason,
  };
}

/**
 * Adaptive content difficulty adjustment
 * Recommends content difficulty based on performance
 */
export function adjustContentDifficulty(
  currentPerformance: number, // 0-100
  currentDifficulty: number // 1-5
): {
  recommendedDifficulty: number;
  adjustment: "increase" | "maintain" | "decrease";
  reason: string;
} {
  let recommendedDifficulty = currentDifficulty;
  let adjustment: "increase" | "maintain" | "decrease" = "maintain";
  let reason = "";

  if (currentPerformance >= 85) {
    recommendedDifficulty = Math.min(5, currentDifficulty + 1);
    adjustment = "increase";
    reason = "High performance. Increase difficulty to maintain engagement.";
  } else if (currentPerformance >= 70) {
    recommendedDifficulty = currentDifficulty;
    adjustment = "maintain";
    reason = "Good performance. Maintain current difficulty.";
  } else if (currentPerformance >= 50) {
    recommendedDifficulty = Math.max(1, currentDifficulty - 1);
    adjustment = "decrease";
    reason = "Moderate performance. Decrease difficulty for better understanding.";
  } else {
    recommendedDifficulty = Math.max(1, currentDifficulty - 1);
    adjustment = "decrease";
    reason = "Low performance. Significantly decrease difficulty.";
  }

  return {
    recommendedDifficulty,
    adjustment,
    reason,
  };
}

/**
 * Calculate readiness to advance to next level
 * Based on mastery assessment and time spent
 */
export function calculateAdvancementReadiness(
  masteryScore: number, // 0-100
  timeSpent: number, // seconds
  minimumTimePerLevel: number = 600, // 10 minutes default
  minimumMasteryScore: number = 75 // 75% default
): {
  canAdvance: boolean;
  readinessPercentage: number;
  missingRequirements: string[];
} {
  const missingRequirements: string[] = [];

  if (masteryScore < minimumMasteryScore) {
    missingRequirements.push(`Mastery score: ${Math.round(masteryScore)}% (need ${minimumMasteryScore}%)`);
  }

  if (timeSpent < minimumTimePerLevel) {
    missingRequirements.push(
      `Time spent: ${Math.round(timeSpent / 60)}min (need ${Math.round(minimumTimePerLevel / 60)}min)`
    );
  }

  const masteryPercentage = Math.min(100, (masteryScore / minimumMasteryScore) * 100);
  const timePercentage = Math.min(100, (timeSpent / minimumTimePerLevel) * 100);
  const readinessPercentage = (masteryPercentage + timePercentage) / 2;

  return {
    canAdvance: missingRequirements.length === 0,
    readinessPercentage: Math.round(readinessPercentage),
    missingRequirements,
  };
}

/**
 * Predict next level difficulty based on current performance
 */
export function predictNextLevelDifficulty(
  currentLevelMastery: number, // 0-100
  currentLevel: number // 1-5
): {
  predictedDifficulty: number;
  confidence: number;
  notes: string;
} {
  let predictedDifficulty = currentLevel + 1;
  let confidence = 0;
  let notes = "";

  // If user is struggling, next level might be harder
  if (currentLevelMastery < 60) {
    predictedDifficulty = Math.min(5, currentLevel + 1.5);
    confidence = 0.8;
    notes = "User struggled with current level. Next level will be challenging.";
  } else if (currentLevelMastery < 75) {
    predictedDifficulty = currentLevel + 1;
    confidence = 0.85;
    notes = "Moderate performance. Next level will be moderately harder.";
  } else if (currentLevelMastery < 90) {
    predictedDifficulty = currentLevel + 0.8;
    confidence = 0.9;
    notes = "Good performance. Next level will be slightly harder.";
  } else {
    predictedDifficulty = currentLevel + 0.5;
    confidence = 0.95;
    notes = "Excellent performance. Next level will be only slightly harder.";
  }

  return {
    predictedDifficulty: Math.min(5, predictedDifficulty),
    confidence: Math.round(confidence * 100),
    notes,
  };
}
