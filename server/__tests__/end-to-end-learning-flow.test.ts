import { describe, it, expect, beforeEach } from "vitest";
import { behaviorTracker } from "../services/behavior-tracker";
import { metaLearningSelector } from "../services/meta-learning-selector";
import { adaptiveDifficultyEngine } from "../services/adaptive-difficulty";

/**
 * End-to-End Learning Flow Test
 *
 * Tests the complete learning journey:
 * 1. User starts a learning session
 * 2. Behavior signals are recorded
 * 3. Meta-learning selects optimal approach
 * 4. Adaptive difficulty adjusts based on performance
 * 5. User profile is updated
 */

describe("End-to-End Learning Flow", () => {
  const userId = "test-user-123";
  const lessonId = "lesson-physics-101";
  const topic = "Physics Fundamentals";

  beforeEach(() => {
    // Reset state
    behaviorTracker["sessions"].clear();
    behaviorTracker["profiles"].clear();
    metaLearningSelector["userProfiles"].clear();
    adaptiveDifficultyEngine["configs"].clear();
  });

  it("should complete a full learning session with behavior tracking", () => {
    // 1. Start session
    const session = behaviorTracker.startSession(userId, lessonId, topic, "socratic");
    expect(session).toBeDefined();
    expect(session.userId).toBe(userId);
    expect(session.approach).toBe("socratic");

    // 2. Record engagement signals during lesson
    behaviorTracker.recordSignal(userId, lessonId, "engagement", 85, {
      timeSpent: 120,
    });

    behaviorTracker.recordSignal(userId, lessonId, "comprehension", 90, {
      quizScore: 0.9,
    });

    behaviorTracker.recordSignal(userId, lessonId, "confidence", 80, {
      selfReported: true,
    });

    // 3. End session
    const completedSession = behaviorTracker.endSession(userId, lessonId);
    expect(completedSession).toBeDefined();
    expect(completedSession?.engagementScore).toBeGreaterThan(0);
    expect(completedSession?.comprehensionScore).toBeGreaterThan(0);
  });

  it("should select optimal approach based on user profile", () => {
    // Create user profile
    const profile = metaLearningSelector["getOrCreateProfile"](userId);
    profile.averageComprehension = 75;
    profile.learningStyle = "visual";
    profile.engagementType = "independent";

    // Select approach for medium difficulty topic
    const approach = metaLearningSelector.selectApproach(userId, topic, "medium", profile);

    expect(approach).toBeDefined();
    expect(approach.approach).toBeTruthy();
    expect(approach.effectiveness).toBeGreaterThan(0);
    expect(approach.engagementScore).toBeGreaterThan(0);
  });

  it("should adjust difficulty based on performance", () => {
    // Assess difficulty with high performance
    const metrics = adaptiveDifficultyEngine.assessDifficulty(
      lessonId,
      95, // High performance
      300, // 5 minutes
      0, // No mistakes
      90, // High confidence
      85 // High engagement
    );

    expect(metrics.performanceScore).toBe(95);
    expect(metrics.recommendedAdjustment).toBe("increase");
    expect(metrics.reason).toContain("Excellent");

    // Apply adjustment
    const newLevel = adaptiveDifficultyEngine.applyDifficultyAdjustment(lessonId, "increase");
    expect(newLevel).toBeDefined();
  });

  it("should detect struggle and recommend easier approach", () => {
    // Assess difficulty with low performance
    const metrics = adaptiveDifficultyEngine.assessDifficulty(
      lessonId,
      35, // Low performance
      900, // 15 minutes (too long)
      5, // Multiple mistakes
      30, // Low confidence
      40 // Low engagement
    );

    expect(metrics.performanceScore).toBe(35);
    expect(metrics.struggleLevel).toBeGreaterThanOrEqual(50);
    expect(metrics.recommendedAdjustment).toBe("decrease");
  });

  it("should update user profile after multiple sessions", () => {
    // Simulate multiple learning sessions
    for (let i = 0; i < 3; i++) {
      const session = behaviorTracker.startSession(userId, `lesson-${i}`, topic, "mixed");

      // Record signals
      behaviorTracker.recordSignal(userId, `lesson-${i}`, "engagement", 70 + i * 5);
      behaviorTracker.recordSignal(userId, `lesson-${i}`, "comprehension", 60 + i * 10);
      behaviorTracker.recordSignal(userId, `lesson-${i}`, "confidence", 50 + i * 10);

      behaviorTracker.endSession(userId, `lesson-${i}`);
    }

    // Check user profile
    const profile = behaviorTracker.getUserProfile(userId);
    expect(profile).toBeDefined();
    expect(profile?.totalLessonsCompleted).toBe(3);
    expect(profile?.averageComprehension).toBeGreaterThan(50);
  });

  it("should predict next approach based on learning history", () => {
    // Create user profile with history
    const profile = metaLearningSelector["getOrCreateProfile"](userId);
    profile.strugglingTopics = ["Physics"];
    profile.averageComprehension = 40;

    // Predict approach for struggling topic
    const approach = metaLearningSelector["predictNextApproach"](userId, "Physics");
    expect(approach).toBe("experiential"); // Hands-on for struggling topics
  });

  it("should detect plateau and suggest approach innovation", () => {
    const profile = metaLearningSelector["getOrCreateProfile"](userId);
    profile.preferredApproaches = ["socratic"];
    profile.approachEffectiveness.set("socratic", 45); // Low effectiveness

    // Detect plateau
    const innovativeApproach = metaLearningSelector.detectPlateauAndInnovate(userId, topic);
    expect(innovativeApproach).toBeDefined();
    expect(innovativeApproach).not.toBe("socratic");
  });

  it("should predict mastery timeline based on performance", () => {
    // Predict outcome
    const prediction = adaptiveDifficultyEngine.predictOutcome(lessonId, 70, 3);

    expect(prediction.predictedMastery).toBeGreaterThan(0);
    expect(prediction.predictedMastery).toBeLessThanOrEqual(100);
    expect(prediction.estimatedTimeToMastery).toBeGreaterThan(0);
    expect(prediction.confidence).toBeGreaterThan(0);
  });

  it("should handle complete learning journey: start → track → analyze → adapt", () => {
    // 1. Start learning session
    const session = behaviorTracker.startSession(userId, lessonId, topic, "mixed");
    expect(session.startTime).toBeDefined();

    // 2. Record learning signals
    behaviorTracker.recordSignal(userId, lessonId, "engagement", 75);
    behaviorTracker.recordSignal(userId, lessonId, "comprehension", 70);
    behaviorTracker.recordSignal(userId, lessonId, "confidence", 65);

    // 3. Assess difficulty
    const metrics = adaptiveDifficultyEngine.assessDifficulty(lessonId, 70, 600, 1, 65, 75);
    expect(metrics.recommendedAdjustment).toBe("maintain");

    // 4. Select next approach
    const nextApproach = metaLearningSelector.selectApproach(userId, topic, "medium");
    expect(nextApproach.approach).toBeTruthy();

    // 5. End session and update profile
    const completed = behaviorTracker.endSession(userId, lessonId);
    expect(completed?.timeSpentSeconds).toBeGreaterThanOrEqual(0);

    // 6. Verify profile was updated
    const profile = behaviorTracker.getUserProfile(userId);
    expect(profile?.totalLessonsCompleted).toBe(1);
    expect(profile?.averageComprehension).toBeGreaterThanOrEqual(0);
  });
});
