/**
 * Meta-Learning Approach Selector
 *
 * Selects optimal learning approach based on:
 * - User's learning profile (behavior history)
 * - Topic difficulty and prerequisites
 * - Current performance and confidence
 * - Engagement patterns
 * - Time constraints
 */

export type LearningApproach =
  | "socratic" // Question-based discovery
  | "problem-based" // Real-world problem solving
  | "experiential" // Hands-on learning
  | "visual" // Diagrams, animations, videos
  | "narrative" // Story-based learning
  | "spaced-repetition" // Distributed practice
  | "project-based" // Build something real
  | "assessment" // Quiz-driven learning
  | "mixed"; // Combination of approaches

export interface ApproachProfile {
  approach: LearningApproach;
  effectiveness: number; // 0-100
  engagementScore: number; // 0-100
  comprehensionScore: number; // 0-100
  timeToMastery: number; // minutes
  recommendationReason: string;
}

export interface UserLearningProfile {
  userId: string;
  preferredApproaches: LearningApproach[];
  approachEffectiveness: Map<LearningApproach, number>;
  learningStyle: "visual" | "auditory" | "kinesthetic" | "reading" | "mixed";
  pacePreference: "slow" | "moderate" | "fast";
  engagementType: "competitive" | "collaborative" | "independent" | "mixed";
  strugglingTopics: string[];
  strongTopics: string[];
  averageComprehension: number;
  averageEngagement: number;
}

export class MetaLearningSelector {
  private userProfiles: Map<string, UserLearningProfile> = new Map();

  /**
   * Select best approach for a user and topic
   */
  selectApproach(
    userId: string,
    topic: string,
    difficulty: "easy" | "medium" | "hard",
    userProfile?: UserLearningProfile
  ): ApproachProfile {
    const profile = userProfile || this.getOrCreateProfile(userId);

    // Score each approach
    const scores = this.scoreApproaches(profile, topic, difficulty);

    // Find best approach
    let bestApproach: ApproachProfile | null = null;
    let bestScore = -1;

    for (const approach of scores) {
      const score = approach.effectiveness + approach.engagementScore * 0.5;
      if (score > bestScore) {
        bestScore = score;
        bestApproach = approach;
      }
    }

    return bestApproach || this.getDefaultApproach(profile, difficulty);
  }

  /**
   * Score all approaches for a given context
   */
  private scoreApproaches(
    profile: UserLearningProfile,
    topic: string,
    difficulty: "easy" | "medium" | "hard"
  ): ApproachProfile[] {
    const approaches: ApproachProfile[] = [];

    // Socratic: Good for building understanding, works for all levels
    approaches.push({
      approach: "socratic",
      effectiveness: profile.averageComprehension > 60 ? 85 : 70,
      engagementScore: profile.learningStyle === "reading" ? 75 : 65,
      comprehensionScore: 90,
      timeToMastery: difficulty === "hard" ? 60 : difficulty === "medium" ? 40 : 20,
      recommendationReason: "Question-based discovery builds deep understanding",
    });

    // Problem-Based: Excellent for applied learning
    approaches.push({
      approach: "problem-based",
      effectiveness: profile.strongTopics.includes(topic) ? 85 : 60,
      engagementScore: profile.engagementType === "independent" ? 80 : 70,
      comprehensionScore: 85,
      timeToMastery: difficulty === "hard" ? 90 : difficulty === "medium" ? 60 : 30,
      recommendationReason: "Real-world problems boost engagement and retention",
    });

    // Experiential: Great for kinesthetic learners
    approaches.push({
      approach: "experiential",
      effectiveness: profile.learningStyle === "kinesthetic" ? 90 : 65,
      engagementScore: 85,
      comprehensionScore: 80,
      timeToMastery: difficulty === "hard" ? 75 : difficulty === "medium" ? 50 : 25,
      recommendationReason: "Hands-on practice builds muscle memory and intuition",
    });

    // Visual: For visual learners
    approaches.push({
      approach: "visual",
      effectiveness: profile.learningStyle === "visual" ? 90 : 70,
      engagementScore: profile.learningStyle === "visual" ? 90 : 75,
      comprehensionScore: 80,
      timeToMastery: difficulty === "hard" ? 45 : difficulty === "medium" ? 30 : 15,
      recommendationReason: "Diagrams and animations clarify complex concepts",
    });

    // Narrative: Engaging and memorable
    approaches.push({
      approach: "narrative",
      effectiveness: 75,
      engagementScore: 85,
      comprehensionScore: 75,
      timeToMastery: difficulty === "hard" ? 50 : difficulty === "medium" ? 35 : 20,
      recommendationReason: "Stories make learning memorable and relatable",
    });

    // Spaced Repetition: Best for retention
    approaches.push({
      approach: "spaced-repetition",
      effectiveness: 95,
      engagementScore: profile.strugglingTopics.includes(topic) ? 60 : 70,
      comprehensionScore: 85,
      timeToMastery: difficulty === "hard" ? 120 : difficulty === "medium" ? 80 : 40,
      recommendationReason: "Distributed practice maximizes long-term retention",
    });

    // Project-Based: For practical application
    approaches.push({
      approach: "project-based",
      effectiveness: profile.engagementType === "independent" ? 85 : 75,
      engagementScore: 90,
      comprehensionScore: 85,
      timeToMastery: difficulty === "hard" ? 150 : difficulty === "medium" ? 100 : 50,
      recommendationReason: "Building projects creates real-world competence",
    });

    // Assessment: For quick validation
    approaches.push({
      approach: "assessment",
      effectiveness: profile.averageComprehension > 70 ? 80 : 60,
      engagementScore: 65,
      comprehensionScore: 75,
      timeToMastery: difficulty === "hard" ? 30 : difficulty === "medium" ? 20 : 10,
      recommendationReason: "Quizzes identify gaps and reinforce learning",
    });

    return approaches;
  }

  /**
   * Get default approach based on profile
   */
  private getDefaultApproach(
    profile: UserLearningProfile,
    difficulty: "easy" | "medium" | "hard"
  ): ApproachProfile {
    // For struggling users, use more interactive approaches
    if (profile.averageComprehension < 50) {
      return {
        approach: "experiential",
        effectiveness: 75,
        engagementScore: 85,
        comprehensionScore: 80,
        timeToMastery: 60,
        recommendationReason: "Hands-on practice helps build confidence",
      };
    }

    // For advanced users, use challenging approaches
    if (profile.averageComprehension > 80) {
      return {
        approach: "problem-based",
        effectiveness: 85,
        engagementScore: 80,
        comprehensionScore: 85,
        timeToMastery: 60,
        recommendationReason: "Real-world problems challenge your skills",
      };
    }

    // Default: mixed approach
    return {
      approach: "mixed",
      effectiveness: 75,
      engagementScore: 75,
      comprehensionScore: 80,
      timeToMastery: 45,
      recommendationReason: "Balanced approach works for most learners",
    };
  }

  /**
   * Get or create user profile
   */
  private getOrCreateProfile(userId: string): UserLearningProfile {
    if (this.userProfiles.has(userId)) {
      return this.userProfiles.get(userId)!;
    }

    const profile: UserLearningProfile = {
      userId,
      preferredApproaches: ["mixed", "visual", "experiential"],
      approachEffectiveness: new Map(),
      learningStyle: "mixed",
      pacePreference: "moderate",
      engagementType: "mixed",
      strugglingTopics: [],
      strongTopics: [],
      averageComprehension: 50,
      averageEngagement: 70,
    };

    this.userProfiles.set(userId, profile);
    return profile;
  }

  /**
   * Update approach effectiveness based on session results
   */
  updateApproachEffectiveness(
    userId: string,
    approach: LearningApproach,
    comprehensionScore: number,
    engagementScore: number
  ): void {
    const profile = this.getOrCreateProfile(userId);

    // Calculate weighted effectiveness
    const effectiveness = comprehensionScore * 0.7 + engagementScore * 0.3;

    // Update map
    const current = profile.approachEffectiveness.get(approach) || 50;
    const updated = (current + effectiveness) / 2; // Rolling average
    profile.approachEffectiveness.set(approach, updated);

    // Update learning style based on engagement
    if (engagementScore > 80 && approach === "visual") {
      profile.learningStyle = "visual";
    } else if (engagementScore > 80 && approach === "experiential") {
      profile.learningStyle = "kinesthetic";
    } else if (engagementScore > 80 && approach === "narrative") {
      profile.learningStyle = "auditory";
    }
  }

  /**
   * Predict next approach based on learning history
   */
  predictNextApproach(userId: string, topic: string): LearningApproach {
    const profile = this.getOrCreateProfile(userId);

    // If struggling, suggest more interactive approach
    if (profile.strugglingTopics.includes(topic)) {
      return "experiential"; // Hands-on learning
    }

    // If strong, suggest more challenging approach
    if (profile.strongTopics.includes(topic)) {
      return "problem-based"; // Real-world problems
    }

    // Default to mixed
    return "mixed";
  }

  /**
   * Detect learning plateau and suggest approach innovation
   */
  detectPlateauAndInnovate(userId: string, topic: string): LearningApproach | null {
    const profile = this.getOrCreateProfile(userId);

    // If using same approach too long, suggest different one
    const currentApproach = profile.preferredApproaches[0];
    const currentEffectiveness = profile.approachEffectiveness.get(currentApproach) || 50;

    // If effectiveness is low, switch approaches
    if (currentEffectiveness < 60) {
      // Find alternative approach
      const alternatives = this.getAlternativeApproaches(currentApproach);
      if (alternatives.length > 0) {
        return alternatives[0];
      }
    }

    return null;
  }

  /**
   * Get alternative approaches to try
   */
  private getAlternativeApproaches(current: LearningApproach): LearningApproach[] {
    const allApproaches: LearningApproach[] = [
      "socratic",
      "problem-based",
      "experiential",
      "visual",
      "narrative",
      "spaced-repetition",
      "project-based",
      "assessment",
      "mixed",
    ];

    return allApproaches.filter((a) => a !== current);
  }

  /**
   * Get user profile
   */
  getUserProfile(userId: string): UserLearningProfile {
    return this.getOrCreateProfile(userId);
  }
}

// Singleton instance
export const metaLearningSelector = new MetaLearningSelector();
