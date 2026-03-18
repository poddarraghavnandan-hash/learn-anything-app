import { describe, it, expect } from "vitest";
import type {
  JourneyStage,
  JourneyStageType,
  LearningJourney,
  SkillLevel,
} from "../shared/types";

describe("JourneyStageType", () => {
  it("supports all 7 stage types in the learning strategy", () => {
    const types: JourneyStageType[] = [
      "hook",
      "foundation",
      "explanation",
      "real_world",
      "check",
      "video",
      "next_steps",
    ];
    expect(types).toHaveLength(7);
  });
});

describe("JourneyStage", () => {
  it("creates a valid hook stage", () => {
    const stage: JourneyStage = {
      type: "hook",
      emoji: "🔮",
      title: "A Sky Full of Secrets!",
      content:
        "Look up at the sky right now. It's blue, right? But have you ever wondered WHY?",
    };
    expect(stage.type).toBe("hook");
    expect(stage.emoji.length).toBeGreaterThan(0);
    expect(stage.title.length).toBeGreaterThan(0);
    expect(stage.content.length).toBeGreaterThan(0);
  });

  it("creates a valid foundation stage", () => {
    const stage: JourneyStage = {
      type: "foundation",
      emoji: "🌈",
      title: "Light is a Rainbow!",
      content:
        "Before we can understand why the sky is blue, we need to know that sunlight is actually made up of ALL the colors of the rainbow.",
      keyTakeaway: "White light = all colors combined",
    };
    expect(stage.type).toBe("foundation");
    expect(stage.keyTakeaway).toBeTruthy();
  });

  it("creates a valid explanation stage with key takeaway", () => {
    const stage: JourneyStage = {
      type: "explanation",
      emoji: "🔬",
      title: "Rayleigh Scattering",
      content:
        "When sunlight enters the atmosphere, it bumps into tiny molecules. **Blue light** has a shorter wavelength, so it gets scattered in all directions.",
      keyTakeaway:
        "Blue light scatters more because of its short wavelength",
    };
    expect(stage.type).toBe("explanation");
    expect(stage.content).toContain("**Blue light**");
    expect(stage.keyTakeaway).toBeTruthy();
  });

  it("creates a valid real_world stage", () => {
    const stage: JourneyStage = {
      type: "real_world",
      emoji: "🌅",
      title: "Sunrise & Sunset Magic",
      content:
        "At sunset, sunlight travels through MORE atmosphere. Most blue light is scattered away, leaving red and orange.",
    };
    expect(stage.type).toBe("real_world");
  });

  it("creates a valid check stage with quiz data", () => {
    const stage: JourneyStage = {
      type: "check",
      emoji: "🤔",
      title: "Quick Check",
      content: "Let's see if you got it!",
      question: "Why is the sky blue?",
      options: [
        "Because the ocean reflects blue",
        "Because blue light scatters more",
        "Because the sun is blue",
      ],
      correctIndex: 1,
      explanation:
        "Blue light has a shorter wavelength and gets scattered in all directions by air molecules.",
    };
    expect(stage.type).toBe("check");
    expect(stage.options).toHaveLength(3);
    expect(stage.correctIndex).toBe(1);
    expect(stage.question).toBeTruthy();
    expect(stage.explanation).toBeTruthy();
  });

  it("creates a valid video stage with search query", () => {
    const stage: JourneyStage = {
      type: "video",
      emoji: "🎬",
      title: "See It in Action",
      content: "Now watch this visual explanation.",
      searchQuery: "why is the sky blue explained simply",
      videoContext:
        "This video shows cool animations of how light scatters through the atmosphere.",
    };
    expect(stage.type).toBe("video");
    expect(stage.searchQuery).toBeTruthy();
    expect(stage.videoContext).toBeTruthy();
  });

  it("creates a valid next_steps stage with follow-up paths", () => {
    const stage: JourneyStage = {
      type: "next_steps",
      emoji: "🚀",
      title: "Keep Exploring",
      content: "Here are some related topics to explore next.",
      paths: [
        {
          question: "Why are clouds white?",
          reason: "Explores how different particle sizes affect light scattering",
        },
        {
          question: "What is ultraviolet light?",
          reason: "Dives deeper into the light spectrum beyond visible light",
        },
        {
          question: "Why do diamonds sparkle?",
          reason: "Another fascinating way light interacts with matter",
        },
      ],
    };
    expect(stage.type).toBe("next_steps");
    expect(stage.paths).toHaveLength(3);
    expect(stage.paths![0].question).toBeTruthy();
    expect(stage.paths![0].reason).toBeTruthy();
  });
});

describe("LearningJourney", () => {
  const createSampleJourney = (): LearningJourney => ({
    id: "journey-1",
    question: "Why is the sky blue?",
    stages: [
      { type: "hook", emoji: "🔮", title: "A Sky Full of Secrets!", content: "Look up..." },
      { type: "foundation", emoji: "🌈", title: "Light is a Rainbow!", content: "Sunlight is all colors..." },
      { type: "explanation", emoji: "🔬", title: "Rayleigh Scattering", content: "Blue scatters more...", keyTakeaway: "Short wavelength = more scattering" },
      { type: "real_world", emoji: "🌅", title: "Sunset Magic", content: "At sunset..." },
      { type: "check", emoji: "🤔", title: "Quick Check", content: "Test yourself", question: "Why blue?", options: ["A", "B", "C"], correctIndex: 1, explanation: "Because..." },
      { type: "video", emoji: "🎬", title: "Watch This", content: "Visual explanation", searchQuery: "sky blue explained", videoContext: "Great animation" },
      { type: "next_steps", emoji: "🚀", title: "Keep Going", content: "Explore more", paths: [{ question: "Why clouds?", reason: "Related" }] },
    ],
    mappedConcepts: ["Rayleigh scattering", "light spectrum", "wavelength"],
    difficulty: "beginner",
    emoji: "🌍",
    createdAt: new Date().toISOString(),
    currentStageIndex: 0,
    completed: false,
  });

  it("creates a valid learning journey with all 7 stage types", () => {
    const journey = createSampleJourney();
    expect(journey.stages).toHaveLength(7);
    expect(journey.stages[0].type).toBe("hook");
    expect(journey.stages[1].type).toBe("foundation");
    expect(journey.stages[2].type).toBe("explanation");
    expect(journey.stages[3].type).toBe("real_world");
    expect(journey.stages[4].type).toBe("check");
    expect(journey.stages[5].type).toBe("video");
    expect(journey.stages[6].type).toBe("next_steps");
  });

  it("starts at stage index 0 and is not completed", () => {
    const journey = createSampleJourney();
    expect(journey.currentStageIndex).toBe(0);
    expect(journey.completed).toBe(false);
  });

  it("tracks mapped concepts", () => {
    const journey = createSampleJourney();
    expect(journey.mappedConcepts).toHaveLength(3);
    expect(journey.mappedConcepts).toContain("Rayleigh scattering");
  });

  it("supports all difficulty levels", () => {
    const levels: SkillLevel[] = ["beginner", "intermediate", "advanced"];
    levels.forEach((level) => {
      const journey = createSampleJourney();
      journey.difficulty = level;
      expect(journey.difficulty).toBe(level);
    });
  });

  it("can simulate progressing through stages", () => {
    const journey = createSampleJourney();
    expect(journey.currentStageIndex).toBe(0);

    // Advance through stages
    for (let i = 0; i < journey.stages.length; i++) {
      journey.currentStageIndex = i;
      expect(journey.currentStageIndex).toBe(i);
    }

    // Mark completed at last stage
    journey.currentStageIndex = journey.stages.length - 1;
    journey.completed = true;
    expect(journey.completed).toBe(true);
  });

  it("ensures the learning strategy follows the correct order", () => {
    const journey = createSampleJourney();
    const expectedOrder: JourneyStageType[] = [
      "hook",
      "foundation",
      "explanation",
      "real_world",
      "check",
      "video",
      "next_steps",
    ];
    journey.stages.forEach((stage, idx) => {
      expect(stage.type).toBe(expectedOrder[idx]);
    });
  });

  it("validates that check stages have quiz data", () => {
    const journey = createSampleJourney();
    const checkStages = journey.stages.filter((s) => s.type === "check");
    checkStages.forEach((stage) => {
      expect(stage.question).toBeTruthy();
      expect(stage.options).toBeDefined();
      expect(stage.options!.length).toBeGreaterThanOrEqual(2);
      expect(stage.correctIndex).toBeDefined();
      expect(stage.correctIndex!).toBeGreaterThanOrEqual(0);
      expect(stage.correctIndex!).toBeLessThan(stage.options!.length);
    });
  });

  it("validates that video stages have search queries", () => {
    const journey = createSampleJourney();
    const videoStages = journey.stages.filter((s) => s.type === "video");
    videoStages.forEach((stage) => {
      expect(stage.searchQuery).toBeTruthy();
      expect(stage.videoContext).toBeTruthy();
    });
  });

  it("validates that next_steps stages have follow-up paths", () => {
    const journey = createSampleJourney();
    const nextStepsStages = journey.stages.filter((s) => s.type === "next_steps");
    nextStepsStages.forEach((stage) => {
      expect(stage.paths).toBeDefined();
      expect(stage.paths!.length).toBeGreaterThan(0);
      stage.paths!.forEach((path) => {
        expect(path.question).toBeTruthy();
        expect(path.reason).toBeTruthy();
      });
    });
  });
});
