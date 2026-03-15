/**
 * Adaptive Learning Engine
 *
 * Implements evidence-based learning science:
 * 1. Spaced Repetition (SM-2 algorithm) — resurface content at optimal intervals
 * 2. Interleaving — mix topics to strengthen neural connections
 * 3. Time-of-Day Optimization — serve content matching user's daily patterns
 * 4. Engagement-Weighted Ranking — prioritize content types the user engages with
 * 5. Forgetting Curve — track memory decay and trigger reviews
 */

import type {
  CardEngagement,
  FeedCard,
  ContentItemData,
  SpacedRepItem,
  UserProfile,
  CardType,
} from "@/shared/types";

// ─── Time-of-Day Patterns ─────────────────────────────────────────────────────

interface TimePattern {
  preferredTypes: CardType[];
  sessionLengthMultiplier: number;
  difficultyBias: "easy" | "medium" | "hard";
}

export function getTimeOfDayPattern(hour: number): TimePattern {
  // Morning (6-11): Fresh mind, good for new concepts
  if (hour >= 6 && hour < 11) {
    return {
      preferredTypes: ["article", "video", "quiz"],
      sessionLengthMultiplier: 1.2,
      difficultyBias: "medium",
    };
  }
  // Midday (11-14): Energy dip, lighter content
  if (hour >= 11 && hour < 14) {
    return {
      preferredTypes: ["video", "insight", "review"],
      sessionLengthMultiplier: 0.8,
      difficultyBias: "easy",
    };
  }
  // Afternoon (14-18): Second wind, mix of content
  if (hour >= 14 && hour < 18) {
    return {
      preferredTypes: ["video", "article", "quiz"],
      sessionLengthMultiplier: 1.0,
      difficultyBias: "medium",
    };
  }
  // Evening (18-22): Wind down, review and consolidation
  if (hour >= 18 && hour < 22) {
    return {
      preferredTypes: ["review", "video", "insight"],
      sessionLengthMultiplier: 0.9,
      difficultyBias: "easy",
    };
  }
  // Night (22-6): Quick bursts only
  return {
    preferredTypes: ["video", "quiz"],
    sessionLengthMultiplier: 0.6,
    difficultyBias: "easy",
  };
}

// ─── Engagement Analysis ──────────────────────────────────────────────────────

interface EngagementProfile {
  topicWeights: Record<string, number>;
  typeWeights: Record<CardType, number>;
  avgTimePerCard: number;
  peakHours: number[];
  reactionPatterns: Record<string, number>;
}

export function analyzeEngagement(engagements: CardEngagement[]): EngagementProfile {
  const topicWeights: Record<string, number> = {};
  const typeWeights: Record<CardType, number> = {
    video: 1,
    article: 1,
    quiz: 1,
    review: 1,
    insight: 1,
  };
  const hourCounts: Record<number, number> = {};
  const reactionCounts: Record<string, number> = {};
  let totalTime = 0;

  for (const e of engagements) {
    // Type engagement weighting
    typeWeights[e.cardType] = (typeWeights[e.cardType] || 0) + 1;

    // Time tracking
    totalTime += e.timeSpentMs;

    // Hour tracking
    hourCounts[e.hourOfDay] = (hourCounts[e.hourOfDay] || 0) + 1;

    // Reaction tracking
    if (e.reaction) {
      reactionCounts[e.reaction] = (reactionCounts[e.reaction] || 0) + 1;
    }
  }

  // Normalize type weights
  const maxTypeWeight = Math.max(...Object.values(typeWeights));
  for (const key of Object.keys(typeWeights) as CardType[]) {
    typeWeights[key] = typeWeights[key] / maxTypeWeight;
  }

  // Find peak hours
  const sortedHours = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([h]) => Number(h));

  return {
    topicWeights,
    typeWeights,
    avgTimePerCard: engagements.length > 0 ? totalTime / engagements.length : 30000,
    peakHours: sortedHours.length > 0 ? sortedHours : [9, 12, 20],
    reactionPatterns: reactionCounts,
  };
}

// ─── SM-2 Spaced Repetition ──────────────────────────────────────────────────

export function calculateNextReview(
  item: SpacedRepItem,
  quality: number // 0-5 rating
): SpacedRepItem {
  let { easeFactor, interval, repetition } = item;

  if (quality >= 3) {
    // Correct response
    if (repetition === 0) interval = 1;
    else if (repetition === 1) interval = 3;
    else interval = Math.round(interval * easeFactor);
    repetition += 1;
  } else {
    // Incorrect — reset
    interval = 1;
    repetition = 0;
  }

  // Update ease factor (SM-2 formula)
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const today = new Date().toISOString().split("T")[0];
  const nextDate = new Date(Date.now() + interval * 86400000).toISOString().split("T")[0];

  // Memory strength based on Ebbinghaus forgetting curve
  const memoryStrength = Math.min(
    100,
    Math.round((1 - Math.exp(-0.5 * repetition)) * 100)
  );

  return {
    ...item,
    easeFactor,
    interval,
    repetition,
    lastReviewDate: today,
    nextReviewDate: nextDate,
    memoryStrength,
  };
}

// ─── Feed Interleaving ───────────────────────────────────────────────────────

export function interleaveFeed(
  contentCards: FeedCard[],
  reviewCards: FeedCard[],
  quizCards: FeedCard[],
  insightCards: FeedCard[],
  profile: UserProfile,
  engagements: CardEngagement[]
): FeedCard[] {
  const result: FeedCard[] = [];
  const hour = new Date().getHours();
  const timePattern = getTimeOfDayPattern(hour);
  const engagement = analyzeEngagement(engagements);

  let contentIdx = 0;
  let reviewIdx = 0;
  let quizIdx = 0;
  let insightIdx = 0;
  let cardsSinceQuiz = 0;
  let cardsSinceReview = 0;

  const maxCards = 30;

  while (result.length < maxCards) {
    // Priority 1: Insert review card every 5 cards if reviews are due
    if (cardsSinceReview >= 5 && reviewIdx < reviewCards.length) {
      result.push(reviewCards[reviewIdx++]);
      cardsSinceReview = 0;
      continue;
    }

    // Priority 2: Insert quiz every 3 content cards
    if (cardsSinceQuiz >= 3 && quizIdx < quizCards.length) {
      result.push(quizCards[quizIdx++]);
      cardsSinceQuiz = 0;
      continue;
    }

    // Priority 3: Insert insight every 7 cards
    if (result.length > 0 && result.length % 7 === 0 && insightIdx < insightCards.length) {
      result.push(insightCards[insightIdx++]);
      continue;
    }

    // Default: content card
    if (contentIdx < contentCards.length) {
      result.push(contentCards[contentIdx++]);
      cardsSinceQuiz++;
      cardsSinceReview++;
    } else {
      break;
    }
  }

  return result;
}

// ─── Content Scoring ─────────────────────────────────────────────────────────

export function scoreContent(
  content: ContentItemData,
  profile: UserProfile,
  engagements: CardEngagement[]
): number {
  let score = 0.5; // base score

  // Topic relevance
  if (profile.interests.includes(content.topicSlug)) {
    score += 0.3;
  }

  // Format preference
  if (
    (profile.preferredFormat === "videos" && content.type === "video") ||
    (profile.preferredFormat === "articles" && content.type === "article")
  ) {
    score += 0.15;
  }

  // Recency bonus
  if (content.publishedAt) {
    const daysAgo = content.publishedAt.includes("day")
      ? parseInt(content.publishedAt) || 30
      : content.publishedAt.includes("hour")
      ? 0
      : 30;
    score += Math.max(0, 0.1 * (1 - daysAgo / 30));
  }

  // Duration preference (shorter content scores slightly higher for engagement)
  if (content.durationSeconds && content.durationSeconds < 600) {
    score += 0.05;
  }

  return Math.min(1, score);
}
