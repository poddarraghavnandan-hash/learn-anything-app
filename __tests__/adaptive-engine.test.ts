import { describe, it, expect } from "vitest";
import {
  getTimeOfDayPattern,
  analyzeEngagement,
  calculateNextReview,
  scoreContent,
} from "../lib/adaptive-engine";
import {
  getLevel,
  XP_VALUES,
  calibrateDifficulty,
  getSearchModifier,
  BADGE_DEFINITIONS,
  LEVEL_NAMES,
} from "../shared/types";
import type {
  CardEngagement,
  SpacedRepItem,
  ContentItemData,
  UserProfile,
  TopicDifficulty,
  SkillLevel,
} from "../shared/types";

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

  it("handles edge case of exactly 499 XP", () => {
    const result = getLevel(499);
    expect(result.level).toBe(1);
    expect(result.xpForNext).toBe(1);
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

  it("quiz correct XP is higher than quiz wrong XP", () => {
    expect(XP_VALUES.quizCorrect).toBeGreaterThan(XP_VALUES.quizWrong);
  });

  it("daily goal XP is the highest single reward", () => {
    expect(XP_VALUES.dailyGoal).toBeGreaterThanOrEqual(XP_VALUES.videoComplete);
    expect(XP_VALUES.dailyGoal).toBeGreaterThanOrEqual(XP_VALUES.quizCorrect);
  });
});

// ─── Difficulty Calibration ─────────────────────────────────────────────────

describe("calibrateDifficulty", () => {
  it("promotes beginner to intermediate at high accuracy", () => {
    expect(calibrateDifficulty(0.9, "beginner")).toBe("intermediate");
  });

  it("promotes intermediate to advanced at high accuracy", () => {
    expect(calibrateDifficulty(0.9, "intermediate")).toBe("advanced");
  });

  it("keeps advanced at advanced for high accuracy", () => {
    expect(calibrateDifficulty(0.9, "advanced")).toBe("advanced");
  });

  it("demotes advanced to intermediate at low accuracy", () => {
    expect(calibrateDifficulty(0.3, "advanced")).toBe("intermediate");
  });

  it("demotes intermediate to beginner at low accuracy", () => {
    expect(calibrateDifficulty(0.3, "intermediate")).toBe("beginner");
  });

  it("keeps beginner at beginner for low accuracy", () => {
    expect(calibrateDifficulty(0.3, "beginner")).toBe("beginner");
  });

  it("maintains current level at moderate accuracy", () => {
    expect(calibrateDifficulty(0.65, "beginner")).toBe("beginner");
    expect(calibrateDifficulty(0.65, "intermediate")).toBe("intermediate");
    expect(calibrateDifficulty(0.65, "advanced")).toBe("advanced");
  });

  it("threshold at exactly 0.85 promotes", () => {
    expect(calibrateDifficulty(0.85, "beginner")).toBe("intermediate");
  });

  it("threshold at exactly 0.5 does not demote", () => {
    expect(calibrateDifficulty(0.5, "advanced")).toBe("advanced");
  });

  it("threshold just below 0.5 demotes", () => {
    expect(calibrateDifficulty(0.49, "advanced")).toBe("intermediate");
  });
});

// ─── Search Modifier ────────────────────────────────────────────────────────

describe("getSearchModifier", () => {
  it("returns beginner-friendly modifier", () => {
    const mod = getSearchModifier("beginner");
    expect(mod).toContain("beginner");
    expect(mod).toContain("simply");
  });

  it("returns intermediate modifier with tutorial", () => {
    const mod = getSearchModifier("intermediate");
    expect(mod).toContain("tutorial");
  });

  it("returns advanced modifier with deep dive", () => {
    const mod = getSearchModifier("advanced");
    expect(mod).toContain("advanced");
    expect(mod).toContain("deep dive");
  });
});

// ─── Badge Definitions ──────────────────────────────────────────────────────

describe("BADGE_DEFINITIONS", () => {
  it("has at least 10 badges", () => {
    expect(BADGE_DEFINITIONS.length).toBeGreaterThanOrEqual(10);
  });

  it("all badges have required fields", () => {
    for (const badge of BADGE_DEFINITIONS) {
      expect(badge.id).toBeTruthy();
      expect(badge.name).toBeTruthy();
      expect(badge.description).toBeTruthy();
      expect(badge.emoji).toBeTruthy();
      expect(badge.requirement).toBeTruthy();
    }
  });

  it("all badge IDs are unique", () => {
    const ids = BADGE_DEFINITIONS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes key milestone badges", () => {
    const ids = BADGE_DEFINITIONS.map((b) => b.id);
    expect(ids).toContain("first_quiz");
    expect(ids).toContain("streak_7");
    expect(ids).toContain("streak_30");
    expect(ids).toContain("mind_blown_10");
    expect(ids).toContain("daily_goal_7");
  });
});

// ─── LEVEL_NAMES ────────────────────────────────────────────────────────────

describe("LEVEL_NAMES", () => {
  it("has at least 5 level names", () => {
    expect(LEVEL_NAMES.length).toBeGreaterThanOrEqual(5);
  });

  it("starts with Curious", () => {
    expect(LEVEL_NAMES[0]).toBe("Curious");
  });

  it("all names are unique", () => {
    expect(new Set(LEVEL_NAMES).size).toBe(LEVEL_NAMES.length);
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
    for (let i = 1; i < strengths.length; i++) {
      expect(strengths[i]).toBeGreaterThanOrEqual(strengths[i - 1]);
    }
  });
});

// ─── scoreContent ────────────────────────────────────────────────────────────

describe("scoreContent", () => {
  const profile: UserProfile = {
    interests: ["python", "machine-learning"],
    skillLevel: "intermediate",
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
    dailyGoalsCompleted: 3,
    mindBlownCount: 5,
    streakFreezes: 1,
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

// ─── TopicDifficulty Calibration Flow ───────────────────────────────────────

describe("TopicDifficulty calibration flow", () => {
  it("simulates a learner improving over time", () => {
    let td: TopicDifficulty = {
      topicSlug: "quantum-physics",
      currentLevel: "beginner",
      quizCorrect: 0,
      quizAttempted: 0,
      accuracy: 0,
      lastCalibrated: "2026-01-01",
    };

    // Simulate 10 quizzes, 9 correct
    for (let i = 0; i < 10; i++) {
      const correct = i !== 5;
      td = {
        ...td,
        quizAttempted: td.quizAttempted + 1,
        quizCorrect: td.quizCorrect + (correct ? 1 : 0),
        accuracy: (td.quizCorrect + (correct ? 1 : 0)) / (td.quizAttempted + 1),
      };
      td.currentLevel = calibrateDifficulty(td.accuracy, td.currentLevel);
    }

    expect(td.accuracy).toBeGreaterThan(0.8);
    expect(["intermediate", "advanced"]).toContain(td.currentLevel);
  });

  it("simulates a learner struggling and getting easier content", () => {
    let td: TopicDifficulty = {
      topicSlug: "quantum-physics",
      currentLevel: "advanced",
      quizCorrect: 0,
      quizAttempted: 0,
      accuracy: 0,
      lastCalibrated: "2026-01-01",
    };

    // Simulate 10 quizzes, only 3 correct
    for (let i = 0; i < 10; i++) {
      const correct = i < 3;
      td = {
        ...td,
        quizAttempted: td.quizAttempted + 1,
        quizCorrect: td.quizCorrect + (correct ? 1 : 0),
        accuracy: (td.quizCorrect + (correct ? 1 : 0)) / (td.quizAttempted + 1),
      };
      td.currentLevel = calibrateDifficulty(td.accuracy, td.currentLevel);
    }

    expect(td.accuracy).toBeLessThan(0.5);
    expect(["beginner", "intermediate"]).toContain(td.currentLevel);
  });
});

// ─── UserProfile Type Shape ─────────────────────────────────────────────────

describe("UserProfile shape", () => {
  it("default profile has all required fields", () => {
    const profile: UserProfile = {
      interests: [],
      skillLevel: "beginner",
      dailyGoalMinutes: 10,
      preferredFormat: "mixed",
      onboardingDone: false,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: "",
      totalXp: 0,
      totalMinutes: 0,
      totalVideos: 0,
      totalArticles: 0,
      totalQuizCorrect: 0,
      totalQuizAttempted: 0,
      dailyGoalsCompleted: 0,
      mindBlownCount: 0,
        streakFreezes: 1,
    };

    expect(profile.skillLevel).toBe("beginner");
    expect(profile.mindBlownCount).toBe(0);
    expect(profile.dailyGoalsCompleted).toBe(0);
  });
});
