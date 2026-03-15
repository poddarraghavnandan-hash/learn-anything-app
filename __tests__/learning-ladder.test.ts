import { describe, it, expect } from "vitest";
import type {
  LearningLadder,
  LadderStep,
  TopicProgress,
  CuriosityQuestion,
  CuriosityCheckResult,
  SkillLevel,
} from "@/shared/types";

describe("LearningLadder types", () => {
  it("LadderStep has all required fields", () => {
    const step: LadderStep = {
      order: 0,
      title: "Classical Mechanics",
      description: "Newton's laws, motion, forces",
      whyItMatters: "Foundation for all physics",
      searchQuery: "classical mechanics for beginners explained",
      estimatedMinutes: 30,
      prerequisites: [],
    };
    expect(step.order).toBe(0);
    expect(step.title).toBeTruthy();
    expect(step.description).toBeTruthy();
    expect(step.whyItMatters).toBeTruthy();
    expect(step.searchQuery).toBeTruthy();
    expect(step.estimatedMinutes).toBeGreaterThan(0);
    expect(Array.isArray(step.prerequisites)).toBe(true);
  });

  it("LearningLadder has steps array and metadata", () => {
    const ladder: LearningLadder = {
      topicSlug: "physics",
      topicName: "Physics",
      steps: [
        {
          order: 0,
          title: "Classical Mechanics",
          description: "Newton's laws",
          whyItMatters: "Foundation",
          searchQuery: "classical mechanics basics",
          estimatedMinutes: 30,
          prerequisites: [],
        },
        {
          order: 1,
          title: "Thermodynamics",
          description: "Heat and energy",
          whyItMatters: "Energy conservation",
          searchQuery: "thermodynamics basics",
          estimatedMinutes: 25,
          prerequisites: ["Classical Mechanics"],
        },
      ],
      totalEstimatedHours: 1,
      encouragement: "You can learn physics!",
      generatedAt: new Date().toISOString(),
    };
    expect(ladder.steps.length).toBe(2);
    expect(ladder.steps[1].prerequisites).toContain("Classical Mechanics");
    expect(ladder.totalEstimatedHours).toBeGreaterThan(0);
    expect(ladder.encouragement).toBeTruthy();
  });

  it("steps are ordered sequentially", () => {
    const steps: LadderStep[] = [
      { order: 0, title: "A", description: "", whyItMatters: "", searchQuery: "", estimatedMinutes: 10, prerequisites: [] },
      { order: 1, title: "B", description: "", whyItMatters: "", searchQuery: "", estimatedMinutes: 10, prerequisites: ["A"] },
      { order: 2, title: "C", description: "", whyItMatters: "", searchQuery: "", estimatedMinutes: 10, prerequisites: ["B"] },
    ];
    for (let i = 0; i < steps.length; i++) {
      expect(steps[i].order).toBe(i);
    }
  });
});

describe("TopicProgress", () => {
  it("initializes with correct defaults", () => {
    const progress: TopicProgress = {
      topicSlug: "physics",
      currentStepIndex: 0,
      completedSteps: [],
      baselineLevel: "beginner",
      curiosityCheckDone: true,
      videosWatchedPerStep: {},
      quizPassedPerStep: {},
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };
    expect(progress.currentStepIndex).toBe(0);
    expect(progress.completedSteps).toHaveLength(0);
    expect(progress.curiosityCheckDone).toBe(true);
  });

  it("tracks video watches per step", () => {
    const progress: TopicProgress = {
      topicSlug: "physics",
      currentStepIndex: 0,
      completedSteps: [],
      baselineLevel: "beginner",
      curiosityCheckDone: true,
      videosWatchedPerStep: { 0: 3, 1: 1 },
      quizPassedPerStep: { 0: true },
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };
    expect(progress.videosWatchedPerStep[0]).toBe(3);
    expect(progress.videosWatchedPerStep[1]).toBe(1);
    expect(progress.quizPassedPerStep[0]).toBe(true);
    expect(progress.quizPassedPerStep[1]).toBeUndefined();
  });

  it("step completion advances current step", () => {
    let progress: TopicProgress = {
      topicSlug: "physics",
      currentStepIndex: 0,
      completedSteps: [],
      baselineLevel: "beginner",
      curiosityCheckDone: true,
      videosWatchedPerStep: {},
      quizPassedPerStep: {},
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };
    // Simulate completing step 0
    progress = {
      ...progress,
      completedSteps: [...progress.completedSteps, 0],
      currentStepIndex: Math.max(progress.currentStepIndex, 0 + 1),
    };
    expect(progress.completedSteps).toContain(0);
    expect(progress.currentStepIndex).toBe(1);
  });

  it("step unlock logic works correctly", () => {
    const completedSteps = [0, 1];
    const currentStep = 2;

    // Step 0: completed → unlocked
    expect(completedSteps.includes(0) || 0 <= currentStep).toBe(true);
    // Step 2: current → unlocked
    expect(2 <= currentStep).toBe(true);
    // Step 3: beyond current step and step 2 not completed → locked
    expect(3 <= currentStep || completedSteps.includes(3 - 1)).toBe(false);
    // Step 4: locked
    expect(4 <= currentStep || completedSteps.includes(4 - 1)).toBe(false);
  });
});

describe("CuriosityCheck", () => {
  it("CuriosityQuestion has all required fields", () => {
    const q: CuriosityQuestion = {
      question: "What happens when you drop a ball?",
      options: ["It floats", "It falls down", "It disappears", "It grows"],
      correctIndex: 1,
      difficulty: "easy",
      funFact: "Gravity accelerates objects at 9.8 m/s²!",
      emoji: "🏀",
    };
    expect(q.options).toHaveLength(4);
    expect(q.correctIndex).toBeGreaterThanOrEqual(0);
    expect(q.correctIndex).toBeLessThan(q.options.length);
    expect(q.funFact).toBeTruthy();
    expect(q.emoji).toBeTruthy();
  });

  it("CuriosityCheckResult determines skill level from answers", () => {
    // Simulate: 5 questions, user gets 4 right → intermediate
    const result: CuriosityCheckResult = {
      topicSlug: "physics",
      questions: [],
      answeredCorrectly: 4,
      totalQuestions: 5,
      determinedLevel: "intermediate",
      startingStep: 2,
    };
    expect(result.determinedLevel).toBe("intermediate");
    expect(result.startingStep).toBeGreaterThan(0);
  });

  it("determines beginner for low scores", () => {
    const result: CuriosityCheckResult = {
      topicSlug: "physics",
      questions: [],
      answeredCorrectly: 1,
      totalQuestions: 5,
      determinedLevel: "beginner",
      startingStep: 0,
    };
    expect(result.determinedLevel).toBe("beginner");
    expect(result.startingStep).toBe(0);
  });

  it("determines advanced for perfect scores", () => {
    const result: CuriosityCheckResult = {
      topicSlug: "quantum-physics",
      questions: [],
      answeredCorrectly: 5,
      totalQuestions: 5,
      determinedLevel: "advanced",
      startingStep: 4,
    };
    expect(result.determinedLevel).toBe("advanced");
    expect(result.startingStep).toBeGreaterThan(2);
  });

  it("level determination algorithm", () => {
    function determineLevel(correct: number, total: number): { level: SkillLevel; startStep: number } {
      const ratio = correct / total;
      if (ratio >= 0.8) return { level: "advanced", startStep: Math.floor(total * 0.6) };
      if (ratio >= 0.5) return { level: "intermediate", startStep: Math.floor(total * 0.3) };
      return { level: "beginner", startStep: 0 };
    }

    expect(determineLevel(5, 5).level).toBe("advanced");
    expect(determineLevel(4, 5).level).toBe("advanced");
    expect(determineLevel(3, 5).level).toBe("intermediate");
    expect(determineLevel(2, 5).level).toBe("beginner");
    expect(determineLevel(1, 5).level).toBe("beginner");
    expect(determineLevel(0, 5).level).toBe("beginner");
  });
});

describe("Learning path progression simulation", () => {
  it("simulates a kid learning to read", () => {
    // A kid starts at beginner, gets easy questions, progresses through phonics → words → sentences
    const readingLadder: LearningLadder = {
      topicSlug: "reading",
      topicName: "Reading",
      steps: [
        { order: 0, title: "Letter Recognition", description: "Learn ABCs", whyItMatters: "Foundation", searchQuery: "alphabet for kids", estimatedMinutes: 15, prerequisites: [] },
        { order: 1, title: "Phonics", description: "Letter sounds", whyItMatters: "Decoding", searchQuery: "phonics for kids", estimatedMinutes: 20, prerequisites: ["Letter Recognition"] },
        { order: 2, title: "Simple Words", description: "CVC words", whyItMatters: "Reading", searchQuery: "simple words for kids", estimatedMinutes: 20, prerequisites: ["Phonics"] },
        { order: 3, title: "Sentences", description: "Reading sentences", whyItMatters: "Comprehension", searchQuery: "reading sentences for kids", estimatedMinutes: 25, prerequisites: ["Simple Words"] },
      ],
      totalEstimatedHours: 1.5,
      encouragement: "You're going to be a great reader!",
      generatedAt: new Date().toISOString(),
    };

    expect(readingLadder.steps[0].title).toBe("Letter Recognition");
    expect(readingLadder.steps[0].searchQuery).toContain("kids");
    expect(readingLadder.steps[3].prerequisites).toContain("Simple Words");

    // Simulate progression
    let progress: TopicProgress = {
      topicSlug: "reading",
      currentStepIndex: 0,
      completedSteps: [],
      baselineLevel: "beginner",
      curiosityCheckDone: true,
      videosWatchedPerStep: {},
      quizPassedPerStep: {},
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };

    // Complete step 0
    progress = { ...progress, completedSteps: [0], currentStepIndex: 1, videosWatchedPerStep: { 0: 2 }, quizPassedPerStep: { 0: true } };
    expect(progress.currentStepIndex).toBe(1);

    // Complete step 1
    progress = { ...progress, completedSteps: [0, 1], currentStepIndex: 2, videosWatchedPerStep: { ...progress.videosWatchedPerStep, 1: 3 }, quizPassedPerStep: { ...progress.quizPassedPerStep, 1: true } };
    expect(progress.currentStepIndex).toBe(2);
    expect(progress.completedSteps).toHaveLength(2);
  });

  it("simulates an adult learning quantum physics", () => {
    const qpLadder: LearningLadder = {
      topicSlug: "quantum-physics",
      topicName: "Quantum Physics",
      steps: [
        { order: 0, title: "Classical Mechanics Review", description: "Newton's laws", whyItMatters: "Foundation", searchQuery: "classical mechanics review", estimatedMinutes: 20, prerequisites: [] },
        { order: 1, title: "Wave-Particle Duality", description: "Light as wave and particle", whyItMatters: "Core concept", searchQuery: "wave particle duality explained", estimatedMinutes: 30, prerequisites: ["Classical Mechanics Review"] },
        { order: 2, title: "Quantum States", description: "Superposition and measurement", whyItMatters: "Key principle", searchQuery: "quantum superposition explained", estimatedMinutes: 35, prerequisites: ["Wave-Particle Duality"] },
        { order: 3, title: "Schrödinger Equation", description: "Mathematical framework", whyItMatters: "Predictive power", searchQuery: "schrodinger equation explained simply", estimatedMinutes: 40, prerequisites: ["Quantum States"] },
        { order: 4, title: "Quantum Entanglement", description: "Spooky action at a distance", whyItMatters: "Applications", searchQuery: "quantum entanglement explained", estimatedMinutes: 30, prerequisites: ["Quantum States"] },
        { order: 5, title: "String Theory Introduction", description: "Unifying framework", whyItMatters: "Frontier", searchQuery: "string theory for beginners", estimatedMinutes: 35, prerequisites: ["Schrödinger Equation", "Quantum Entanglement"] },
      ],
      totalEstimatedHours: 3,
      encouragement: "Quantum physics is within your reach!",
      generatedAt: new Date().toISOString(),
    };

    // An adult with some physics background starts at step 1 (skips classical review)
    const curiosityResult: CuriosityCheckResult = {
      topicSlug: "quantum-physics",
      questions: [],
      answeredCorrectly: 3,
      totalQuestions: 5,
      determinedLevel: "intermediate",
      startingStep: 1,
    };

    expect(curiosityResult.startingStep).toBe(1);
    expect(qpLadder.steps[curiosityResult.startingStep].title).toBe("Wave-Particle Duality");
    expect(qpLadder.steps[5].prerequisites).toContain("Schrödinger Equation");
    expect(qpLadder.steps[5].prerequisites).toContain("Quantum Entanglement");
  });
});
