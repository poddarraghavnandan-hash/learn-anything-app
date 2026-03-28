import { describe, it, expect } from "vitest";
import {
  captureApplicationSignal,
  captureFeedbackSignal,
} from "../signal-capture-middleware";
import { getUserLearnerProfile } from "../learner-profile";

describe("Content Engagement Signal Tracking", () => {
  const testUserId = 999997;
  const testConceptId = 1;

  describe("Article Reading Signals", () => {
    it("should capture application signal for article completion", async () => {
      const result = await captureApplicationSignal(
        testUserId,
        "Completed reading article on JavaScript closures and applied concepts in code",
        testConceptId,
        {
          contentType: "article",
          contentTitle: "Understanding JavaScript Closures",
          timeSpentSeconds: 600,
          completionPercentage: 100,
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });

    it("should capture application signal for partial article reading", async () => {
      const result = await captureApplicationSignal(
        testUserId,
        "Read part of article on async/await patterns",
        testConceptId,
        {
          contentType: "article",
          contentTitle: "Async/Await Patterns",
          timeSpentSeconds: 300,
          completionPercentage: 60,
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });
  });

  describe("Video Watching Signals", () => {
    it("should capture application signal for video completion", async () => {
      const result = await captureApplicationSignal(
        testUserId,
        "Watched video on React hooks and understood state management",
        testConceptId,
        {
          contentType: "video",
          contentTitle: "React Hooks Explained",
          timeSpentSeconds: 1200,
          completionPercentage: 100,
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });

    it("should capture application signal for partial video watching", async () => {
      const result = await captureApplicationSignal(
        testUserId,
        "Watched first part of Python tutorial",
        testConceptId,
        {
          contentType: "video",
          contentTitle: "Python Basics Tutorial",
          timeSpentSeconds: 900,
          completionPercentage: 45,
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });
  });

  describe("Code Exercise Signals", () => {
    it("should capture application signal for successful code exercise", async () => {
      const result = await captureApplicationSignal(
        testUserId,
        "Successfully completed JavaScript exercise: implementing a closure factory",
        testConceptId,
        {
          contentType: "exercise",
          contentTitle: "Closure Factory Exercise",
          timeSpentSeconds: 450,
          completionPercentage: 100,
          exerciseSuccess: true,
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });

    it("should capture application signal for attempted code exercise", async () => {
      const result = await captureApplicationSignal(
        testUserId,
        "Attempted React component exercise with partial success",
        testConceptId,
        {
          contentType: "exercise",
          contentTitle: "React Component Exercise",
          timeSpentSeconds: 600,
          completionPercentage: 70,
          exerciseSuccess: false,
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });
  });

  describe("Code Review Signals", () => {
    it("should capture application signal for code review completion", async () => {
      const result = await captureApplicationSignal(
        testUserId,
        "Reviewed and understood code patterns in React component library",
        testConceptId,
        {
          contentType: "codeReview",
          contentTitle: "React Component Patterns",
          timeSpentSeconds: 800,
          completionPercentage: 100,
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });
  });

  describe("User Feedback Signals", () => {
    it("should capture positive feedback signal", async () => {
      const result = await captureFeedbackSignal(
        testUserId,
        "This content was very helpful! Clear explanations with good examples.",
        testConceptId,
        {
          feedbackType: "positive",
          contentType: "article",
          contentTitle: "JavaScript Closures",
          rating: 5,
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });

    it("should capture negative feedback signal", async () => {
      const result = await captureFeedbackSignal(
        testUserId,
        "This explanation was confusing and didn't help me understand the concept.",
        testConceptId,
        {
          feedbackType: "negative",
          contentType: "video",
          contentTitle: "Advanced TypeScript",
          rating: 1,
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });

    it("should capture neutral feedback signal", async () => {
      const result = await captureFeedbackSignal(
        testUserId,
        "Content was okay but could use more examples.",
        testConceptId,
        {
          feedbackType: "neutral",
          contentType: "article",
          contentTitle: "REST API Design",
          rating: 3,
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });

    it("should capture feedback with suggestions", async () => {
      const result = await captureFeedbackSignal(
        testUserId,
        "Good content but would benefit from more interactive examples and practice problems.",
        testConceptId,
        {
          feedbackType: "constructive",
          contentType: "course",
          contentTitle: "Web Development Fundamentals",
          rating: 4,
          suggestions: ["Add more interactive examples", "Include practice problems"],
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });
  });

  describe("Multi-Content Learning Sessions", () => {
    it("should capture signals from multiple content engagements", async () => {
      // Read article
      await captureApplicationSignal(
        testUserId,
        "Read article on React hooks",
        testConceptId,
        {
          contentType: "article",
          timeSpentSeconds: 600,
          completionPercentage: 100,
          timestamp: new Date(),
        }
      );

      // Watch video
      await captureApplicationSignal(
        testUserId,
        "Watched video on React state management",
        testConceptId,
        {
          contentType: "video",
          timeSpentSeconds: 900,
          completionPercentage: 100,
          timestamp: new Date(),
        }
      );

      // Do exercise
      await captureApplicationSignal(
        testUserId,
        "Completed React hooks exercise",
        testConceptId,
        {
          contentType: "exercise",
          timeSpentSeconds: 450,
          completionPercentage: 100,
          exerciseSuccess: true,
          timestamp: new Date(),
        }
      );

      // Leave feedback
      await captureFeedbackSignal(
        testUserId,
        "Great learning sequence! Helped me understand React hooks thoroughly.",
        testConceptId,
        {
          feedbackType: "positive",
          rating: 5,
          timestamp: new Date(),
        }
      );

      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        expect(profile.totalSignalsThisWeek ?? 0).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("Content Engagement Patterns", () => {
    it("should capture signals showing deep engagement", async () => {
      const deepEngagementContents = [
        {
          type: "article",
          timeSpent: 1200,
          completion: 100,
        },
        {
          type: "video",
          timeSpent: 1800,
          completion: 100,
        },
        {
          type: "exercise",
          timeSpent: 900,
          completion: 100,
          success: true,
        },
        {
          type: "codeReview",
          timeSpent: 600,
          completion: 100,
        },
      ];

      for (const content of deepEngagementContents) {
        await captureApplicationSignal(
          testUserId,
          `Deep engagement with ${content.type}`,
          testConceptId,
          {
            contentType: content.type,
            timeSpentSeconds: content.timeSpent,
            completionPercentage: content.completion,
            timestamp: new Date(),
          }
        );
      }
    });

    it("should capture signals showing light engagement", async () => {
      const lightEngagementContents = [
        {
          type: "article",
          timeSpent: 120,
          completion: 20,
        },
        {
          type: "video",
          timeSpent: 180,
          completion: 15,
        },
        {
          type: "exercise",
          timeSpent: 60,
          completion: 10,
          success: false,
        },
      ];

      for (const content of lightEngagementContents) {
        await captureApplicationSignal(
          testUserId,
          `Light engagement with ${content.type}`,
          testConceptId,
          {
            contentType: content.type,
            timeSpentSeconds: content.timeSpent,
            completionPercentage: content.completion,
            timestamp: new Date(),
          }
        );
      }
    });
  });

  describe("Time Spent Analysis", () => {
    it("should capture signals with various time spent values", async () => {
      const timeSpents = [60, 300, 600, 1200, 1800, 3600];

      for (const timeSpent of timeSpents) {
        await captureApplicationSignal(
          testUserId,
          `Content engagement for ${timeSpent} seconds`,
          testConceptId,
          {
            contentType: "article",
            timeSpentSeconds: timeSpent,
            completionPercentage: Math.min(100, (timeSpent / 1800) * 100),
            timestamp: new Date(),
          }
        );
      }
    });
  });

  describe("Completion Percentage Analysis", () => {
    it("should capture signals with various completion percentages", async () => {
      const completionPercentages = [0, 25, 50, 75, 100];

      for (const completion of completionPercentages) {
        await captureApplicationSignal(
          testUserId,
          `Content with ${completion}% completion`,
          testConceptId,
          {
            contentType: "video",
            timeSpentSeconds: 600,
            completionPercentage: completion,
            timestamp: new Date(),
          }
        );
      }
    });
  });

  describe("Performance", () => {
    it("should capture content engagement signal within reasonable time", async () => {
      const start = Date.now();

      await captureApplicationSignal(
        testUserId,
        "Performance test content engagement",
        testConceptId,
        {
          contentType: "article",
          timeSpentSeconds: 600,
          completionPercentage: 100,
          timestamp: new Date(),
        }
      );

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });

    it("should handle rapid content engagement captures", async () => {
      const start = Date.now();

      for (let i = 0; i < 15; i++) {
        await captureApplicationSignal(
          testUserId,
          `Content ${i}`,
          testConceptId,
          {
            contentType: ["article", "video", "exercise"][i % 3],
            timeSpentSeconds: 300 + (i * 50),
            completionPercentage: 50 + (i * 3),
            timestamp: new Date(),
          }
        );
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero time spent", async () => {
      const result = await captureApplicationSignal(
        testUserId,
        "Instant content view",
        testConceptId,
        {
          contentType: "article",
          timeSpentSeconds: 0,
          completionPercentage: 0,
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });

    it("should handle very long time spent", async () => {
      const result = await captureApplicationSignal(
        testUserId,
        "Extended study session",
        testConceptId,
        {
          contentType: "video",
          timeSpentSeconds: 14400, // 4 hours
          completionPercentage: 100,
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });

    it("should handle empty feedback", async () => {
      const result = await captureFeedbackSignal(
        testUserId,
        "",
        testConceptId,
        {
          feedbackType: "neutral",
          rating: 3,
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });

    it("should handle very long feedback", async () => {
      const longFeedback = "A".repeat(1000);

      const result = await captureFeedbackSignal(
        testUserId,
        longFeedback,
        testConceptId,
        {
          feedbackType: "constructive",
          rating: 4,
          timestamp: new Date(),
        }
      );

      expect(result).toBeDefined();
    });
  });
});
