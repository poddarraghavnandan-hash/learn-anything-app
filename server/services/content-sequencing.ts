import Anthropic from "@anthropic-ai/sdk";

export interface SequencedLesson {
  id: string;
  title: string;
  description: string;
  level: 1 | 2 | 3 | 4 | 5;
  order: number;
  prerequisites: string[];
  estimatedDuration: number; // minutes
  videoScript?: string;
  keyPoints: string[];
  isOptional: boolean;
  prerequisiteGaps?: string[]; // Micro-lessons needed before this
}

export interface LearningSequence {
  topic: string;
  userLevel: "beginner" | "intermediate" | "advanced" | "expert";
  lessons: SequencedLesson[];
  totalDuration: number; // minutes
  microLessons: Array<{
    topic: string;
    duration: number;
    reason: string;
  }>;
  reasoning: string;
}

export class ContentSequencingAgent {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic();
  }

  /**
   * Generate adaptive lesson sequence for a topic
   */
  async generateLearningSequence(
    topic: string,
    userLevel: "beginner" | "intermediate" | "advanced" | "expert",
    userKnowledge?: Record<string, number>, // topic -> accuracy %
    prerequisites?: string[]
  ): Promise<LearningSequence> {
    const systemPrompt = `You are an expert curriculum designer. Generate an optimal learning sequence for a topic.

Consider:
1. User's current level and knowledge gaps
2. Logical prerequisites and dependencies
3. Optimal pacing (don't overwhelm, build progressively)
4. Identify micro-lessons needed for gaps
5. Mark optional advanced topics

Respond with JSON only.`;

    const knowledgeContext = userKnowledge
      ? `\nUser's topic knowledge: ${JSON.stringify(userKnowledge)}`
      : "";
    const prerequisiteContext = prerequisites
      ? `\nPrerequisites: ${prerequisites.join(", ")}`
      : "";

    const message = await this.client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Generate learning sequence for: "${topic}"
User Level: ${userLevel}${knowledgeContext}${prerequisiteContext}

Return JSON with: lessons (array with id, title, description, level, order, prerequisites, estimatedDuration, keyPoints, isOptional, prerequisiteGaps), totalDuration, microLessons (array with topic, duration, reason), reasoning`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    try {
      const sequence = JSON.parse(responseText) as Omit<
        LearningSequence,
        "topic" | "userLevel"
      >;

      return {
        topic,
        userLevel,
        ...sequence,
      };
    } catch (e) {
      // Fallback to basic sequence
      return {
        topic,
        userLevel,
        lessons: this.generateDefaultSequence(topic, userLevel),
        totalDuration: 180,
        microLessons: [],
        reasoning: "Default sequence generated due to parsing error",
      };
    }
  }

  /**
   * Detect prerequisite gaps and suggest micro-lessons
   */
  async detectPrerequisiteGaps(
    topic: string,
    userKnowledge: Record<string, number>
  ): Promise<Array<{ topic: string; duration: number; reason: string }>> {
    const prerequisiteMap: Record<string, string[]> = {
      "quantum computing": ["quantum_mechanics", "linear_algebra", "probability"],
      "machine learning": ["linear_algebra", "calculus", "probability", "programming"],
      "climate science": ["physics", "chemistry", "statistics", "earth_science"],
      justice: ["philosophy_basics", "ethics", "logic", "history"],
      "string theory": ["quantum_mechanics", "relativity", "differential_geometry"],
      "neural networks": ["linear_algebra", "calculus", "programming", "statistics"],
    };

    const topicPrerequisites =
      prerequisiteMap[topic.toLowerCase()] || [];
    const gaps: Array<{ topic: string; duration: number; reason: string }> = [];

    for (const prereq of topicPrerequisites) {
      const userAccuracy = userKnowledge[prereq] || 0;

      // If user has <60% accuracy or no knowledge, suggest micro-lesson
      if (userAccuracy < 60) {
        gaps.push({
          topic: prereq,
          duration: 10, // 10-minute micro-lesson
          reason: `Prerequisite gap detected: ${userAccuracy === 0 ? "No prior knowledge" : `Low accuracy (${userAccuracy}%)`}`,
        });
      }
    }

    return gaps;
  }

  /**
   * Reorder lessons based on user's learning pattern
   */
  async optimizeSequenceForUser(
    sequence: LearningSequence,
    userLearningStyle?: string,
    userPeakHours?: string[]
  ): Promise<LearningSequence> {
    // If user prefers videos, prioritize lessons with video scripts
    if (userLearningStyle === "visual") {
      sequence.lessons.sort((a, b) => {
        const aHasVideo = a.videoScript ? 1 : 0;
        const bHasVideo = b.videoScript ? 1 : 0;
        return bHasVideo - aHasVideo;
      });
    }

    // If user has peak hours, suggest scheduling
    if (userPeakHours && userPeakHours.length > 0) {
      // Longer lessons during peak hours
      sequence.lessons.sort((a, b) => {
        return b.estimatedDuration - a.estimatedDuration;
      });
    }

    return sequence;
  }

  /**
   * Generate default sequence when LLM fails
   */
  private generateDefaultSequence(
    topic: string,
    userLevel: "beginner" | "intermediate" | "advanced" | "expert"
  ): SequencedLesson[] {
    const baseLevel = userLevel === "beginner" ? 1 : userLevel === "intermediate" ? 2 : 3;

    return [
      {
        id: "lesson-1",
        title: `Introduction to ${topic}`,
        description: `Learn the basics of ${topic}`,
        level: Math.max(1, baseLevel - 1) as 1 | 2 | 3 | 4 | 5,
        order: 1,
        prerequisites: [],
        estimatedDuration: 30,
        keyPoints: [
          `What is ${topic}?`,
          `Why ${topic} matters`,
          `Common misconceptions`,
        ],
        isOptional: false,
      },
      {
        id: "lesson-2",
        title: `How ${topic} works`,
        description: `Understand the mechanisms of ${topic}`,
        level: baseLevel as 1 | 2 | 3 | 4 | 5,
        order: 2,
        prerequisites: ["lesson-1"],
        estimatedDuration: 45,
        keyPoints: [
          `Core principles`,
          `Key mechanisms`,
          `Real-world examples`,
        ],
        isOptional: false,
      },
      {
        id: "lesson-3",
        title: `Applying ${topic}`,
        description: `Apply ${topic} to real-world scenarios`,
        level: Math.min(5, baseLevel + 1) as 1 | 2 | 3 | 4 | 5,
        order: 3,
        prerequisites: ["lesson-2"],
        estimatedDuration: 45,
        keyPoints: [
          `Practical applications`,
          `Case studies`,
          `Problem-solving`,
        ],
        isOptional: false,
      },
      {
        id: "lesson-4",
        title: `Advanced topics in ${topic}`,
        description: `Deep dive into advanced aspects`,
        level: Math.min(5, baseLevel + 2) as 1 | 2 | 3 | 4 | 5,
        order: 4,
        prerequisites: ["lesson-3"],
        estimatedDuration: 60,
        keyPoints: [
          `Theoretical frameworks`,
          `Research insights`,
          `Cutting-edge developments`,
        ],
        isOptional: true,
      },
    ];
  }

  /**
   * Suggest next lesson based on current progress
   */
  async suggestNextLesson(
    currentLessonId: string,
    sequence: LearningSequence,
    userPerformance?: { accuracy: number; timeSpent: number }
  ): Promise<SequencedLesson | null> {
    const currentIndex = sequence.lessons.findIndex(
      (l) => l.id === currentLessonId
    );

    if (currentIndex === -1 || currentIndex === sequence.lessons.length - 1) {
      return null; // No next lesson
    }

    // If user performed well, consider skipping optional lessons
    if (
      userPerformance &&
      userPerformance.accuracy > 85 &&
      sequence.lessons[currentIndex + 1].isOptional
    ) {
      // Skip to lesson after optional one
      return sequence.lessons[currentIndex + 2] || sequence.lessons[currentIndex + 1];
    }

    return sequence.lessons[currentIndex + 1];
  }

  /**
   * Check if user is ready for next level
   */
  isReadyForNextLevel(
    currentLevel: 1 | 2 | 3 | 4 | 5,
    userAccuracy: number,
    timeSpent: number,
    minAccuracy: number = 75
  ): boolean {
    if (currentLevel === 5) return false; // Already at max level

    // User needs 75%+ accuracy and at least 30 minutes spent
    return userAccuracy >= minAccuracy && timeSpent >= 30;
  }
}

export const contentSequencingAgent = new ContentSequencingAgent();
