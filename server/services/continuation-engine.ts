import Anthropic from "@anthropic-ai/sdk";

export interface ContinuationOption {
  id: string;
  type: "go_deeper" | "related_concept" | "teach_it" | "apply_it" | "review";
  title: string;
  description: string;
  targetTopic?: string;
  targetLevel?: 1 | 2 | 3 | 4 | 5;
  estimatedDuration: number; // minutes
  difficulty: "easy" | "medium" | "hard";
  icon?: string;
  reason: string;
}

export interface ContinuationPlan {
  currentTopic: string;
  currentLevel: 1 | 2 | 3 | 4 | 5;
  options: ContinuationOption[];
  recommendedNext?: ContinuationOption;
  reasoning: string;
}

export class ContinuationEngine {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic();
  }

  /**
   * Generate continuation options after lesson completion
   */
  async generateContinuationOptions(
    topic: string,
    currentLevel: 1 | 2 | 3 | 4 | 5,
    userAccuracy?: number,
    userMastery?: Record<string, number>
  ): Promise<ContinuationPlan> {
    const systemPrompt = `You are an expert learning coach. Generate meaningful next steps after a user completes a learning segment.

Options should include:
1. Go Deeper: Next level on same topic
2. Related Concept: Connected topics in the knowledge graph
3. Teach It: Create content to solidify mastery
4. Apply It: Real-world application challenges
5. Review: Spaced repetition review of key concepts

Respond with JSON only.`;

    const performanceContext = userAccuracy
      ? `\nUser Performance: ${userAccuracy}% accuracy`
      : "";
    const masteryContext = userMastery
      ? `\nUser's Topic Mastery: ${JSON.stringify(userMastery)}`
      : "";

    const message = await this.client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Generate continuation options after completing Level ${currentLevel} of "${topic}"${performanceContext}${masteryContext}

Return JSON with: options (array with id, type, title, description, targetTopic, targetLevel, estimatedDuration, difficulty, icon, reason), recommendedNext (single option), reasoning`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    try {
      const plan = JSON.parse(responseText) as Omit<
        ContinuationPlan,
        "currentTopic" | "currentLevel"
      >;

      return {
        currentTopic: topic,
        currentLevel,
        ...plan,
      };
    } catch (e) {
      // Fallback to default options
      return this.generateDefaultContinuationOptions(topic, currentLevel);
    }
  }

  /**
   * Generate default continuation options
   */
  private generateDefaultContinuationOptions(
    topic: string,
    currentLevel: 1 | 2 | 3 | 4 | 5
  ): ContinuationPlan {
    const options: ContinuationOption[] = [];

    // Option 1: Go Deeper (if not at max level)
    if (currentLevel < 5) {
      const nextLevel = Math.min(5, currentLevel + 1) as 1 | 2 | 3 | 4 | 5;
      options.push({
        id: "go-deeper",
        type: "go_deeper",
        title: `Level ${nextLevel}: ${this.getLevelName(nextLevel)}`,
        description: `Continue to the next level and deepen your understanding of ${topic}`,
        targetTopic: topic,
        targetLevel: nextLevel,
        estimatedDuration: 45,
        difficulty: currentLevel < 3 ? "easy" : "medium",
        icon: "arrow-up",
        reason: "Natural progression to build on your current knowledge",
      });
    }

    // Option 2: Related Concepts
    const relatedTopics = this.getRelatedTopics(topic);
    if (relatedTopics.length > 0) {
      const relatedLevel = Math.max(1, currentLevel - 1) as 1 | 2 | 3 | 4 | 5;
      options.push({
        id: "related-concept",
        type: "related_concept",
        title: `Explore: ${relatedTopics[0]}`,
        description: `Learn about ${relatedTopics[0]}, which connects to ${topic}`,
        targetTopic: relatedTopics[0],
        targetLevel: relatedLevel,
        estimatedDuration: 40,
        difficulty: "medium",
        icon: "link",
        reason: "Expand your knowledge graph with related concepts",
      });
    }

    // Option 3: Teach It
    const teachLevel = currentLevel as 1 | 2 | 3 | 4 | 5;
    options.push({
      id: "teach-it",
      type: "teach_it",
      title: "Teach It: Create a lesson",
      description: `Create content or teach someone else about ${topic} to solidify your mastery`,
      targetTopic: topic,
      targetLevel: teachLevel,
      estimatedDuration: 30,
      difficulty: "hard",
      icon: "book-open",
      reason: "Teaching others is one of the best ways to master a topic",
    });

    // Option 4: Apply It
    const applyLevel = currentLevel as 1 | 2 | 3 | 4 | 5;
    options.push({
      id: "apply-it",
      type: "apply_it",
      title: "Apply It: Real-world challenge",
      description: `Apply your knowledge of ${topic} to solve real-world problems`,
      targetTopic: topic,
      targetLevel: applyLevel,
      estimatedDuration: 60,
      difficulty: "hard",
      icon: "target",
      reason: "Apply what you've learned to real-world scenarios",
    });

    // Option 5: Review
    const reviewLevel = currentLevel as 1 | 2 | 3 | 4 | 5;
    options.push({
      id: "review",
      type: "review",
      title: "Review: Spaced repetition",
      description: `Review key concepts from ${topic} using spaced repetition`,
      targetTopic: topic,
      targetLevel: reviewLevel,
      estimatedDuration: 15,
      difficulty: "easy",
      icon: "refresh",
      reason: "Reinforce your memory with spaced repetition",
    });

    return {
      currentTopic: topic,
      currentLevel: currentLevel as 1 | 2 | 3 | 4 | 5,
      options,
      recommendedNext: options[0], // Recommend going deeper first
      reasoning: "Default continuation options based on learning progression",
    };
  }

  /**
   * Get level name
   */
  private getLevelName(level: number): string {
    const names: Record<number, string> = {
      1: "Foundation",
      2: "Understanding",
      3: "Application",
      4: "Deep Dive",
      5: "Mastery",
    };
    return names[level] || "Unknown";
  }

  /**
   * Get related topics for a given topic
   */
  private getRelatedTopics(topic: string): string[] {
    const relatedMap: Record<string, string[]> = {
      justice: ["ethics", "philosophy", "law", "political_theory"],
      "quantum mechanics": ["relativity", "particle_physics", "wave_functions"],
      "machine learning": ["neural_networks", "statistics", "data_science"],
      "climate science": ["physics", "chemistry", "earth_science", "sustainability"],
      "string theory": ["quantum_mechanics", "relativity", "particle_physics"],
      physics: ["mathematics", "chemistry", "engineering"],
      philosophy: ["ethics", "logic", "metaphysics"],
    };

    return relatedMap[topic.toLowerCase()] || [];
  }

  /**
   * Generate "Continue Learning" CTA text
   */
  generateContinuationCTA(
    option: ContinuationOption,
    userLevel: "beginner" | "intermediate" | "advanced" | "expert"
  ): string {
    const ctaMap: Record<string, Record<string, string>> = {
      go_deeper: {
        beginner:
          "Ready to level up? Let's dive deeper into this topic.",
        intermediate:
          "You're doing great! Ready for the next challenge?",
        advanced:
          "Let's explore the advanced concepts next.",
        expert: "Ready to master the next level?",
      },
      related_concept: {
        beginner:
          "This topic connects to something interesting...",
        intermediate:
          "Want to explore a related concept?",
        advanced:
          "Let's expand your knowledge graph.",
        expert: "Ready to explore the broader landscape?",
      },
      teach_it: {
        beginner:
          "Try explaining what you learned to solidify it.",
        intermediate:
          "Teaching others is a great way to master concepts.",
        advanced:
          "Create content to share your expertise.",
        expert: "Ready to teach others?",
      },
      apply_it: {
        beginner:
          "Let's try applying this to a real-world scenario.",
        intermediate:
          "Ready for a real-world challenge?",
        advanced:
          "Let's solve a complex problem using this knowledge.",
        expert: "Ready to tackle an expert-level challenge?",
      },
      review: {
        beginner:
          "Let's review the key concepts to lock them in.",
        intermediate:
          "Time to reinforce what you've learned.",
        advanced:
          "Review to strengthen your memory.",
        expert: "Spaced repetition review coming up.",
      },
    };

    return (
      ctaMap[option.type]?.[userLevel] ||
      "What would you like to do next?"
    );
  }

  /**
   * Determine if user should review before continuing
   */
  shouldReviewBeforeContinuing(
    userAccuracy: number,
    timeSinceLastReview: number // minutes
  ): boolean {
    // Review if accuracy is below 70% or it's been more than 24 hours since last review
    return userAccuracy < 70 || timeSinceLastReview > 1440;
  }

  /**
   * Generate personalized encouragement message
   */
  generateEncouragement(
    userLevel: "beginner" | "intermediate" | "advanced" | "expert",
    accuracy: number,
    streak: number
  ): string {
    const messages = {
      beginner: [
        "Great start! You're building a solid foundation.",
        "Keep going! Every step counts.",
        "You're learning something new every day!",
      ],
      intermediate: [
        "Excellent work! You're making real progress.",
        "Your understanding is getting deeper.",
        "You're on your way to mastery!",
      ],
      advanced: [
        "Impressive! You're thinking like an expert.",
        "Your insights are getting sharper.",
        "You're pushing the boundaries of your knowledge.",
      ],
      expert: [
        "Outstanding! You're at the frontier of knowledge.",
        "Your expertise is remarkable.",
        "You're ready to teach others.",
      ],
    };

    let message = messages[userLevel][Math.floor(Math.random() * 3)];

    if (accuracy > 90) {
      message += " Perfect accuracy!";
    } else if (accuracy > 80) {
      message += " Your accuracy is excellent.";
    }

    if (streak > 7) {
      message += ` You have a ${streak}-day learning streak! 🔥`;
    }

    return message;
  }
}

export const continuationEngine = new ContinuationEngine();
