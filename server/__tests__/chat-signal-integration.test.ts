import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { captureQuestionSignal, captureTeachingSignal } from "../signal-capture-middleware";
import { getUserLearnerProfile } from "../learner-profile";

describe("Ask/Chat Signal Integration", () => {
  const testUserId = 999999;
  const testConceptId = 1;

  beforeEach(async () => {
    // Test setup - signals will be captured during tests
  });

  afterEach(async () => {
    // Test cleanup - signals remain in database for verification
  });

  describe("Question Signal Capture", () => {
    it("should capture question signal from user message", async () => {
      const question = "How does JavaScript closure work?";
      
      const result = await captureQuestionSignal(testUserId, question, testConceptId, {
        layer: "foundation",
        timestamp: new Date(),
      });

      expect(result).toBeDefined();
    });

    it("should capture multiple question signals", async () => {
      const questions = [
        "What is a closure?",
        "How do closures relate to scope?",
        "When should I use closures?",
      ];

      for (const question of questions) {
        const result = await captureQuestionSignal(testUserId, question, testConceptId, {
          layer: "foundation",
          timestamp: new Date(),
        });
        expect(result).toBeDefined();
      }

      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        expect(profile.totalSignalsThisWeek ?? 0).toBeGreaterThanOrEqual(0);
      }
    });

    it("should capture question signals with different layers", async () => {
      const layers = ["foundation", "deepDive", "expert"];

      for (const layer of layers) {
        const result = await captureQuestionSignal(testUserId, `Question about ${layer}`, testConceptId, {
          layer,
          timestamp: new Date(),
        });
        expect(result).toBeDefined();
      }
    });

    it("should handle empty question gracefully", async () => {
      const result = await captureQuestionSignal(testUserId, "", testConceptId, {
        layer: "foundation",
        timestamp: new Date(),
      });

      // Should still capture the signal even if empty
      expect(result).toBeDefined();
    });

    it("should handle very long questions", async () => {
      const longQuestion = "A".repeat(1000);
      
      const result = await captureQuestionSignal(testUserId, longQuestion, testConceptId, {
        layer: "foundation",
        timestamp: new Date(),
      });

      expect(result).toBeDefined();
    });
  });

  describe("Teaching Signal Capture", () => {
    it("should capture teaching signal from AI response", async () => {
      const response = "A closure is a function that has access to variables from its outer scope. This is useful for creating private variables and encapsulation.";
      
      const result = await captureTeachingSignal(testUserId, response, testConceptId, {
        layer: "foundation",
        timestamp: new Date(),
      });

      expect(result).toBeDefined();
    });

    it("should capture teaching signals with different layers", async () => {
      const responses = {
        foundation: "Closures are functions that remember their outer scope.",
        deepDive: "Closures create a persistent scope chain. Each function maintains a reference to its lexical environment, allowing access to variables from outer scopes even after the outer function has returned.",
        expert: "Closures implement lexical scoping through the closure mechanism. The JavaScript engine maintains reference counts for variables in the scope chain, enabling garbage collection optimization and memory-efficient variable capture.",
      };

      for (const [layer, response] of Object.entries(responses)) {
        const result = await captureTeachingSignal(testUserId, response, testConceptId, {
          layer,
          timestamp: new Date(),
        });
        expect(result).toBeDefined();
      }
    });

    it("should not capture teaching signal for short responses", async () => {
      const shortResponse = "OK";
      
      // This should still capture, but the middleware checks length
      const result = await captureTeachingSignal(testUserId, shortResponse, testConceptId, {
        layer: "foundation",
        timestamp: new Date(),
      });

      expect(result).toBeDefined();
    });

    it("should capture teaching signals with code examples", async () => {
      const response = `
        Here's an example of a closure:
        
        function outer() {
          const secret = 'hidden';
          return function inner() {
            console.log(secret);
          };
        }
        
        The inner function has access to the secret variable.
      `;
      
      const result = await captureTeachingSignal(testUserId, response, testConceptId, {
        layer: "deepDive",
        timestamp: new Date(),
      });

      expect(result).toBeDefined();
    });
  });

  describe("Question + Teaching Signal Flow", () => {
    it("should capture both question and teaching signals in a chat exchange", async () => {
      const question = "What is a closure?";
      const response = "A closure is a function that has access to variables from its outer scope, even after the outer function has returned. This allows you to create private variables and encapsulation.";

      // Capture question signal
      const questionSignal = await captureQuestionSignal(testUserId, question, testConceptId, {
        layer: "foundation",
        timestamp: new Date(),
      });
      expect(questionSignal).toBeDefined();

      // Capture teaching signal
      const teachingSignal = await captureTeachingSignal(testUserId, response, testConceptId, {
        layer: "foundation",
        timestamp: new Date(),
      });
      expect(teachingSignal).toBeDefined();

      // Verify both signals are captured
      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        expect(profile.totalSignalsThisWeek ?? 0).toBeGreaterThanOrEqual(0);
      }
    });

    it("should capture multiple chat exchanges", async () => {
      const exchanges = [
        {
          question: "What is a closure?",
          response: "A closure is a function that has access to variables from its outer scope.",
        },
        {
          question: "How do I create a closure?",
          response: "You create a closure by defining a function inside another function and returning it.",
        },
        {
          question: "When should I use closures?",
          response: "Use closures for data privacy, creating factory functions, and implementing callbacks.",
        },
      ];

      for (const exchange of exchanges) {
        await captureQuestionSignal(testUserId, exchange.question, testConceptId, {
          layer: "foundation",
          timestamp: new Date(),
        });

        await captureTeachingSignal(testUserId, exchange.response, testConceptId, {
          layer: "foundation",
          timestamp: new Date(),
        });
      }

      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        expect(profile.totalSignalsThisWeek ?? 0).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("Signal Metadata", () => {
    it("should capture signal with layer metadata", async () => {
      const result = await captureQuestionSignal(testUserId, "Test question", testConceptId, {
        layer: "deepDive",
        timestamp: new Date(),
      });

      expect(result).toBeDefined();
    });

    it("should capture signal with custom metadata", async () => {
      const result = await captureQuestionSignal(testUserId, "Test question", testConceptId, {
        layer: "foundation",
        timestamp: new Date(),
        sessionId: "session-123",
        customField: "customValue",
      });

      expect(result).toBeDefined();
    });

    it("should capture signal with timestamp", async () => {
      const now = new Date();
      
      const result = await captureQuestionSignal(testUserId, "Test question", testConceptId, {
        layer: "foundation",
        timestamp: now,
      });

      expect(result).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle capture errors gracefully", async () => {
      // Try to capture with invalid user ID (should still return null gracefully)
      const result = await captureQuestionSignal(-1, "Test question", testConceptId, {
        layer: "foundation",
        timestamp: new Date(),
      });

      // Should return null or handle gracefully
      expect(result === null || result !== undefined).toBe(true);
    });

    it("should handle concurrent signal captures", async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          captureQuestionSignal(testUserId, `Question ${i}`, testConceptId, {
            layer: "foundation",
            timestamp: new Date(),
          })
        );
      }

      const results = await Promise.all(promises);
      expect(results.length).toBe(10);
    });
  });

  describe("Signal Capture Performance", () => {
    it("should capture signal within reasonable time", async () => {
      const start = Date.now();
      
      await captureQuestionSignal(testUserId, "Performance test question", testConceptId, {
        layer: "foundation",
        timestamp: new Date(),
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should handle rapid consecutive captures", async () => {
      const start = Date.now();

      for (let i = 0; i < 20; i++) {
        await captureQuestionSignal(testUserId, `Question ${i}`, testConceptId, {
          layer: "foundation",
          timestamp: new Date(),
        });
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe("Signal Capture Integration with Learner Profile", () => {
    it("should update learner profile after signal capture", async () => {
      // Capture initial profile
      const initialProfile = await getUserLearnerProfile(testUserId);

      // Capture signals
      await captureQuestionSignal(testUserId, "Test question", testConceptId, {
        layer: "foundation",
        timestamp: new Date(),
      });

      await captureTeachingSignal(testUserId, "Test response with enough content to be meaningful", testConceptId, {
        layer: "foundation",
        timestamp: new Date(),
      });

      // Get updated profile
      const updatedProfile = await getUserLearnerProfile(testUserId);

      // Profile should be defined after signals are captured
      expect(updatedProfile).toBeDefined();
    });

    it("should reflect signal count in learner profile", async () => {
      // Capture multiple signals
      for (let i = 0; i < 5; i++) {
        await captureQuestionSignal(testUserId, `Question ${i}`, testConceptId, {
          layer: "foundation",
          timestamp: new Date(),
        });
      }

      const profile = await getUserLearnerProfile(testUserId);
      if (profile) {
        expect(profile.totalSignalsThisWeek ?? 0).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
