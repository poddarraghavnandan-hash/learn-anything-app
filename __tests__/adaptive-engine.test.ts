import { describe, it, expect } from "vitest";
import {
  getTimeOfDayPattern,
  analyzeEngagement,
  calculateNextReview,
  scoreContent,
} from "../lib/adaptive-engine";
import { getLevel, XP_VALUES } from "../shared/types";
import type { CardEngagement, SpacedRepItem, ContentItemData, UserProfile } from "../shared/types";

// ─── getLevel ────────────────────────────────────────────────────────────────

describe("getLevel", () => {
  it("returns level 1 for 0 XP", () => {
    const result = getLevel(0);
    expect(result.level).toBe(1);
    expect(result.name).toBe("Curious");
    expect(result.progress).toBe(0);
    expect(result.xpForNext).toBe(500);
  });

  it("returns level 2 for 500 XP", () => {
    const result = getLevel(500);
    expect(result.level).toBe(2);
    expect(result.name).toBe("Explorer");
  });

  it("returns level 3 for 1200 XP", () => {
    const result = getLevel(1200);
    expect(result.level).toBe(3);
    expect(result.name).toBe("Learner");
    expect(result.progress).toBeCloseTo(0.4);
  });

  it("caps level name at Sage", () => {
    const result = getLevel(10000);
    expect(result.name).toBe("Sage");
  });
});

// ─── XP_VALUES ───────────────────────────────────────────────────────────────

describe("XP_VALUES", () => {
  it("has correct values", () => {
    expect(XP_VALUES.videoComplete).toBe(15);
    expect(XP_VALUES.articleComplete).toBe(10);
    expect(XP_VALUES.quizCorrect).toBe(20);
    expect(XP_VALUES.quizWrong).toBe(5);
    expect(XP_VALUES.reviewRated).toBe(10);
    expect(XP_VALUES.dailyGoal).toBe(50);
    expect(XP_VALUES.streakDay).toBe(10);
  });
});

// ─── getTimeOfDayPattern ─────────────────────────────────────────────────────

describe("getTimeOfDayPattern", () => {
  it("returns morning pattern for hour 8", () => {
    const pattern = getTimeOfDayPattern(8);
    expect(pattern.difficultyBias).toBe("medium");
    expect(pattern.sessionLengthMultiplier).toBe(1.2);
    expect(pattern.preferredTypes).toContain("article");
  });

  it("returns midday pattern for hour 12", () => {
    const pattern = getTimeOfDayPattern(12);
    expect(pattern.difficultyBias).toBe("easy");
    expect(pattern.sessionLengthMultiplier).toBe(0.8);
  });

  it("returns evening pattern for hour 20", () => {
    const pattern = getTimeOfDayPattern(20);
    expect(pattern.difficultyBias).toBe("easy");
    expect(pattern.preferredTypes).toContain("review");
  });

  it("returns night pattern for hour 23", () => {
    const pattern = getTimeOfDayPattern(23);
    expect(pattern.sessionLengthMultiplier).toBe(0.6);
  });

  it("returns afternoon pattern for hour 15", () => {
    const pattern = getTimeOfDayPattern(15);
    expect(pattern.difficultyBias).toBe("medium");
    expect(pattern.sessionLengthMultiplier).toBe(1.0);
  });
});

// ─── analyzeEngagement ───────────────────────────────────────────────────────

describe("analyzeEngagement", () => {
  it("returns defaults for empty engagements", () => {
    const result = analyzeEngagement([]);
    expect(result.avgTimePerCard).toBe(30000);
    expect(result.peakHours).toEqual([9, 12, 20]);
  });

  it("calculates type weights from engagements", () => {
    const engagements: CardEngagement[] = [
      { cardId: "1", cardType: "video", timeSpentMs: 5000, timestamp: Date.now(), hourOfDay: 9 },
      { cardId: "2", cardType: "video", timeSpentMs: 3000, timestamp: Date.now(), hourOfDay: 9 },
      { cardId: "3", cardType: "article", timeSpentMs: 4000, timestamp: Date.now(), hourOfDay: 14 },
    ];
    const result = analyzeEngagement(engagements);
    expect(result.typeWeights.video).toBeGreaterThan(result.typeWeights.article);
  });

  it("tracks peak hours", () => {
    const engagements: CardEngagement[] = Array.from({ length: 10 }, (_, i) => ({
      cardId: `${i}`,
      cardType: "video" as const,
      timeSpentMs: 3000,
      timestamp: Date.now(),
      hourOfDay: 9,
    }));
    const result = analyzeEngagement(engagements);
    expect(result.peakHours).toContain(9);
  });

  it("tracks reaction patterns", () => {
    const engagements: CardEngagement[] = [
      { cardId: "1", cardType: "video", timeSpentMs: 5000, reaction: "mind_blown", timestamp: Date.now(), hourOfDay: 9 },
      { cardId: "2", cardType: "video", timeSpentMs: 3000, reaction: "mind_blown", timestamp: Date.now(), hourOfDay: 9 },
      { cardId: "3", cardType: "article", timeSpentMs: 4000, reaction: "knew_this", timestamp: Date.now(), hourOfDay: 14 },
    ];
    const result = analyzeEngagement(engagements);
    expect(result.reactionPatterns.mind_blown).toBe(2);
    expect(result.reactionPatterns.knew_this).toBe(1);
  });
});

// ─── calculateNextReview (SM-2) ──────────────────────────────────────────────

describe("calculateNextReview", () => {
  const baseItem: SpacedRepItem = {
    contentId: 1,
    title: "Test",
    thumbnailUrl: "",
    topicSlug: "python",
    easeFactor: 2.5,
    interval: 0,
    repetition: 0,
    lastReviewDate: "",
    nextReviewDate: "",
    memoryStrength: 0,
  };

  it("sets interval to 1 on first correct review", () => {
    const result = calculateNextReview(baseItem, 4);
    expect(result.interval).toBe(1);
    expect(result.repetition).toBe(1);
    expect(result.memoryStrength).toBeGreaterThan(0);
  });

  it("sets interval to 3 on second correct review", () => {
    const afterFirst = calculateNextReview(baseItem, 4);
    const result = calculateNextReview(afterFirst, 4);
    expect(result.interval).toBe(3);
    expect(result.repetition).toBe(2);
  });

  it("resets on incorrect review", () => {
    const afterFirst = calculateNextReview(baseItem, 4);
    const result = calculateNextReview(afterFirst, 1);
    expect(result.interval).toBe(1);
    expect(result.repetition).toBe(0);
  });

  it("ease factor never goes below 1.3", () => {
    let item = baseItem;
    for (let i = 0; i < 10; i++) {
      item = calculateNextReview(item, 0);
    }
    expect(item.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("memory strength increases with repetitions", () => {
    let item = baseItem;
    const strengths: number[] = [];
    for (let i = 0; i < 5; i++) {
      item = calculateNextReview(item, 4);
      strengths.push(item.memoryStrength);
    }
    // Each successive review should increase or maintain memory strength
    for (let i = 1; i < strengths.length; i++) {
      expect(strengths[i]).toBeGreaterThanOrEqual(strengths[i - 1]);
    }
  });
});

// ─── scoreContent ────────────────────────────────────────────────────────────

describe("scoreContent", () => {
  const profile: UserProfile = {
    interests: ["python", "machine-learning"],
    dailyGoalMinutes: 10,
    preferredFormat: "videos",
    onboardingDone: true,
    currentStreak: 3,
    longestStreak: 5,
    lastActiveDate: new Date().toISOString().split("T")[0],
    totalXp: 500,
    totalMinutes: 60,
    totalVideos: 10,
    totalArticles: 5,
    totalQuizCorrect: 8,
    totalQuizAttempted: 10,
  };

  const content: ContentItemData = {
    id: 1,
    externalId: "abc",
    type: "video",
    title: "Python Tutorial",
    description: "Learn Python basics",
    url: "https://youtube.com/watch?v=abc",
    thumbnailUrl: "https://img.youtube.com/vi/abc/hqdefault.jpg",
    source: "youtube",
    channelOrAuthor: "Tech Channel",
    durationSeconds: 300,
    topicSlug: "python",
    publishedAt: "1 day ago",
  };

  it("scores higher for matching topic", () => {
    const matchScore = scoreContent(content, profile, []);
    const noMatchContent = { ...content, topicSlug: "cooking" };
    const noMatchScore = scoreContent(noMatchContent, profile, []);
    expect(matchScore).toBeGreaterThan(noMatchScore);
  });

  it("scores higher for preferred format", () => {
    const videoScore = scoreContent(content, profile, []);
    const articleContent = { ...content, type: "article" as const };
    const articleScore = scoreContent(articleContent, profile, []);
    expect(videoScore).toBeGreaterThan(articleScore);
  });

  it("gives bonus for short content", () => {
    const shortContent = { ...content, durationSeconds: 300 };
    const longContent = { ...content, durationSeconds: 3600 };
    const shortScore = scoreContent(shortContent, profile, []);
    const longScore = scoreContent(longContent, profile, []);
    expect(shortScore).toBeGreaterThanOrEqual(longScore);
  });

  it("returns score between 0 and 1", () => {
    const score = scoreContent(content, profile, []);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});
