import { describe, it, expect } from "vitest";
import type {
  LearnerModel,
  NudgeType,
  NudgeData,
  ChatMessage,
  ChatConversation,
} from "../shared/types";
import { DEFAULT_LEARNER_MODEL } from "../shared/types";

// ─── Learner Model ───────────────────────────────────────────────────────────

describe("LearnerModel", () => {
  it("DEFAULT_LEARNER_MODEL has all required fields", () => {
    const lm = DEFAULT_LEARNER_MODEL;
    expect(lm.preferredPace).toBe("moderate");
    expect(lm.preferredTone).toBe("casual");
    expect(lm.preferredDepth).toBe("detailed");
    expect(lm.conceptConfidence).toEqual({});
    expect(lm.confusionPoints).toEqual([]);
    expect(lm.strengthAreas).toEqual([]);
    expect(lm.peakHours).toEqual([]);
    expect(lm.avgSessionMinutes).toBe(0);
    expect(lm.contentFormatWeights).toEqual({ video: 0.5, article: 0.3, interactive: 0.2 });
    expect(lm.pastTopics).toEqual([]);
    expect(lm.realWorldConnections).toEqual([]);
    expect(lm.learningStyle).toBe("mixed");
    expect(lm.totalNudgesAnswered).toBe(0);
    expect(lm.nudgeResponsePatterns).toEqual({});
    expect(lm.explainSimplerCount).toBe(0);
    expect(lm.topicSwitchCount).toBe(0);
    expect(lm.avgQuizResponseTimeMs).toBe(0);
    expect(lm.questionsAsked).toBe(0);
    expect(lm.followUpDepth).toBe(0);
    expect(lm.lastUpdated).toBeTruthy();
  });

  it("content format weights sum to approximately 1", () => {
    const lm = DEFAULT_LEARNER_MODEL;
    const sum = lm.contentFormatWeights.video + lm.contentFormatWeights.article + lm.contentFormatWeights.interactive;
    expect(sum).toBeCloseTo(1.0, 1);
  });

  it("can track concept confidence as a map", () => {
    const lm: LearnerModel = {
      ...DEFAULT_LEARNER_MODEL,
      conceptConfidence: { gravity: 0.8, "orbital mechanics": 0.3, "Newton's laws": 0.6 },
    };
    expect(lm.conceptConfidence["gravity"]).toBe(0.8);
    expect(lm.conceptConfidence["orbital mechanics"]).toBe(0.3);
    expect(Object.keys(lm.conceptConfidence)).toHaveLength(3);
  });

  it("can accumulate confusion points", () => {
    const lm: LearnerModel = {
      ...DEFAULT_LEARNER_MODEL,
      confusionPoints: ["wave-particle duality", "superposition"],
    };
    expect(lm.confusionPoints).toContain("wave-particle duality");
    expect(lm.confusionPoints).toHaveLength(2);
  });

  it("can accumulate strength areas", () => {
    const lm: LearnerModel = {
      ...DEFAULT_LEARNER_MODEL,
      strengthAreas: ["classical mechanics", "algebra"],
    };
    expect(lm.strengthAreas).toContain("classical mechanics");
    expect(lm.strengthAreas).toHaveLength(2);
  });

  it("can track real-world connections (analogies that resonated)", () => {
    const lm: LearnerModel = {
      ...DEFAULT_LEARNER_MODEL,
      realWorldConnections: [
        "gravity is like a bowling ball on a trampoline",
        "electrons orbit like planets around the sun",
      ],
    };
    expect(lm.realWorldConnections).toHaveLength(2);
    expect(lm.realWorldConnections[0]).toContain("bowling ball");
  });
});

// ─── Nudge Types ─────────────────────────────────────────────────────────────

describe("NudgeType", () => {
  const ALL_NUDGE_TYPES: NudgeType[] = [
    "familiarity_check",
    "connection_check",
    "interest_probe",
    "pace_check",
    "application_prompt",
    "confidence_gauge",
    "direction_check",
    "analogy_test",
  ];

  it("has 8 nudge types", () => {
    expect(ALL_NUDGE_TYPES).toHaveLength(8);
  });

  it("each nudge type is a valid string", () => {
    ALL_NUDGE_TYPES.forEach((t) => {
      expect(typeof t).toBe("string");
      expect(t.length).toBeGreaterThan(0);
    });
  });
});

describe("NudgeData", () => {
  it("can create a familiarity check nudge", () => {
    const nudge: NudgeData = {
      nudgeType: "familiarity_check",
      question: "Have you heard of Newton's third law before?",
      options: ["Yes, I know it!", "Sounds familiar", "Not really"],
      freeResponse: false,
      signalKey: "conceptConfidence.newtons_third_law",
      emoji: "🤔",
    };
    expect(nudge.nudgeType).toBe("familiarity_check");
    expect(nudge.options).toHaveLength(3);
    expect(nudge.freeResponse).toBe(false);
  });

  it("can create a pace check nudge", () => {
    const nudge: NudgeData = {
      nudgeType: "pace_check",
      question: "Want to go deeper into this, or move on to the next concept?",
      options: ["Go deeper", "I'm good, let's move on"],
      freeResponse: false,
      signalKey: "preferredPace",
      emoji: "🚀",
    };
    expect(nudge.nudgeType).toBe("pace_check");
    expect(nudge.options).toHaveLength(2);
  });

  it("can create an application prompt nudge with free response", () => {
    const nudge: NudgeData = {
      nudgeType: "application_prompt",
      question: "Where do you think you'd see gravity at work in everyday life?",
      freeResponse: true,
      signalKey: "realWorldConnections",
      emoji: "🌍",
    };
    expect(nudge.nudgeType).toBe("application_prompt");
    expect(nudge.freeResponse).toBe(true);
    expect(nudge.options).toBeUndefined();
  });

  it("can create a confidence gauge nudge", () => {
    const nudge: NudgeData = {
      nudgeType: "confidence_gauge",
      question: "Does that explanation click for you?",
      options: ["Yes, makes sense!", "Kind of", "Not really"],
      freeResponse: false,
      signalKey: "conceptConfidence",
      emoji: "💡",
    };
    expect(nudge.nudgeType).toBe("confidence_gauge");
    expect(nudge.options).toHaveLength(3);
  });

  it("can create an analogy test nudge with free response", () => {
    const nudge: NudgeData = {
      nudgeType: "analogy_test",
      question: "How would you explain gravity to a friend who's never heard of it?",
      freeResponse: true,
      signalKey: "strengthAreas",
      emoji: "🗣️",
    };
    expect(nudge.nudgeType).toBe("analogy_test");
    expect(nudge.freeResponse).toBe(true);
  });
});

// ─── Learner Model Evolution Simulation ──────────────────────────────────────

describe("Learner model evolution simulation", () => {
  it("simulates a learner model evolving over multiple interactions", () => {
    // Start with defaults
    let lm: LearnerModel = { ...DEFAULT_LEARNER_MODEL };

    // Interaction 1: User asks about gravity, answers familiarity check "Not really"
    lm = {
      ...lm,
      questionsAsked: lm.questionsAsked + 1,
      totalNudgesAnswered: lm.totalNudgesAnswered + 1,
      nudgeResponsePatterns: {
        ...lm.nudgeResponsePatterns,
        familiarity_check: 1,
      },
    };
    expect(lm.questionsAsked).toBe(1);
    expect(lm.totalNudgesAnswered).toBe(1);

    // Interaction 2: User says "I don't get it" → confusion signal
    lm = {
      ...lm,
      explainSimplerCount: lm.explainSimplerCount + 1,
      confusionPoints: [...lm.confusionPoints, "gravity"],
      preferredPace: "deep", // they need more time
    };
    expect(lm.explainSimplerCount).toBe(1);
    expect(lm.confusionPoints).toContain("gravity");
    expect(lm.preferredPace).toBe("deep");

    // Interaction 3: User answers pace check "Go deeper"
    lm = {
      ...lm,
      totalNudgesAnswered: lm.totalNudgesAnswered + 1,
      nudgeResponsePatterns: {
        ...lm.nudgeResponsePatterns,
        pace_check: 1,
      },
      preferredDepth: "detailed",
    };
    expect(lm.totalNudgesAnswered).toBe(2);
    expect(lm.preferredDepth).toBe("detailed");

    // Interaction 4: User provides a real-world connection
    lm = {
      ...lm,
      totalNudgesAnswered: lm.totalNudgesAnswered + 1,
      nudgeResponsePatterns: {
        ...lm.nudgeResponsePatterns,
        application_prompt: 1,
      },
      realWorldConnections: [...lm.realWorldConnections, "dropping a ball shows gravity"],
    };
    expect(lm.realWorldConnections).toHaveLength(1);

    // Interaction 5: User answers confidence gauge "Yes, makes sense!"
    lm = {
      ...lm,
      totalNudgesAnswered: lm.totalNudgesAnswered + 1,
      strengthAreas: [...lm.strengthAreas, "gravity basics"],
      conceptConfidence: { ...lm.conceptConfidence, gravity: 0.7 },
    };
    expect(lm.strengthAreas).toContain("gravity basics");
    expect(lm.conceptConfidence["gravity"]).toBe(0.7);

    // After 5 interactions, the model has evolved significantly
    expect(lm.totalNudgesAnswered).toBe(4);
    expect(lm.questionsAsked).toBe(1);
    expect(lm.confusionPoints).toHaveLength(1);
    expect(lm.strengthAreas).toHaveLength(1);
    expect(lm.realWorldConnections).toHaveLength(1);
  });

  it("simulates a confident learner who moves quickly", () => {
    let lm: LearnerModel = { ...DEFAULT_LEARNER_MODEL };

    // Quick learner: answers familiarity "Yes, I know it!"
    lm = {
      ...lm,
      questionsAsked: 1,
      totalNudgesAnswered: 1,
      nudgeResponsePatterns: { ...lm.nudgeResponsePatterns, familiarity_check: 1 },
      conceptConfidence: { "quantum mechanics": 0.6 },
    };

    // Pace check: "Move on"
    lm = {
      ...lm,
      totalNudgesAnswered: 2,
      preferredPace: "quick",
      preferredDepth: "overview",
    };

    // Analogy test: gives a detailed explanation
    lm = {
      ...lm,
      totalNudgesAnswered: 3,
      strengthAreas: [...lm.strengthAreas, "quantum mechanics"],
      conceptConfidence: { ...lm.conceptConfidence, "quantum mechanics": 0.9 },
    };

    expect(lm.preferredPace).toBe("quick");
    expect(lm.preferredDepth).toBe("overview");
    expect(lm.conceptConfidence["quantum mechanics"]).toBe(0.9);
    expect(lm.strengthAreas).toContain("quantum mechanics");
    expect(lm.explainSimplerCount).toBe(0); // never confused
  });
});

// ─── Chat Message with Nudge ─────────────────────────────────────────────────

describe("ChatMessage with nudge bubble", () => {
  it("can create a nudge message", () => {
    const msg: ChatMessage = {
      id: "msg-1",
      role: "assistant",
      bubbleType: "nudge",
      nudge: {
        nudgeType: "familiarity_check",
        question: "Have you heard of photosynthesis?",
        options: ["Yes!", "A little", "Not at all"],
        freeResponse: false,
        signalKey: "conceptConfidence.photosynthesis",
        emoji: "🌱",
      },
      timestamp: Date.now(),
    };
    expect(msg.bubbleType).toBe("nudge");
    expect(msg.nudge?.nudgeType).toBe("familiarity_check");
    expect(msg.nudge?.options).toHaveLength(3);
  });

  it("nudge message can coexist with text messages in a conversation", () => {
    const conv: ChatConversation = {
      id: "conv-1",
      title: "Why do plants need sunlight?",
      messages: [
        { id: "m1", role: "user", bubbleType: "text", text: "Why do plants need sunlight?", timestamp: 1 },
        { id: "m2", role: "assistant", bubbleType: "text", text: "Great question! Plants use sunlight for photosynthesis...", timestamp: 2 },
        {
          id: "m3",
          role: "assistant",
          bubbleType: "nudge",
          nudge: {
            nudgeType: "familiarity_check",
            question: "Have you heard of chlorophyll before?",
            options: ["Yes!", "Sounds familiar", "Nope"],
            freeResponse: false,
            signalKey: "conceptConfidence.chlorophyll",
            emoji: "🍃",
          },
          timestamp: 3,
        },
        { id: "m4", role: "assistant", bubbleType: "text", text: "Chlorophyll is the green pigment that captures light energy...", timestamp: 4 },
      ],
      originalQuestion: "Why do plants need sunlight?",
      mappedConcepts: ["photosynthesis", "chlorophyll", "light energy"],
      baselineLevel: "beginner",
      baselineDone: true,
      miniLadder: [],
      currentStep: 0,
      signalsGathered: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(conv.messages).toHaveLength(4);
    const nudgeMessages = conv.messages.filter((m) => m.bubbleType === "nudge");
    expect(nudgeMessages).toHaveLength(1);
    expect(nudgeMessages[0].nudge?.nudgeType).toBe("familiarity_check");
  });
});
