import { learningBehaviorAnalyzer } from "./learning-behavior-analyzer";

/**
 * Peer Intelligence System
 *
 * Learns from aggregate peer data to improve recommendations
 * Identifies what works for similar learners and applies insights to current learner
 */

export interface PeerInsight {
  similarLearnerCount: number;
  mostEffectiveApproach: number;
  effectivenessScore: number; // 0-100
  successRate: number; // % of similar learners who succeeded
  averageTimeToMastery: number; // minutes
  commonMisconceptions: string[];
  recommendedPath: number[]; // Approach IDs in recommended order
  confidence: number; // 0-100 (how confident is this insight)
}

class PeerIntelligence {
  /**
   * Find similar learners based on learning profile
   */
  async findSimilarLearners(
    userId: string,
    similarityThreshold: number = 0.7 // 0-1
  ): Promise<Array<{ userId: string; similarityScore: number }>> {
    const userProfile = await learningBehaviorAnalyzer.getLearningStyleProfile(userId);

    // In a real system, this would query a database of all learner profiles
    // For now, return mock similar learners
    // This would be implemented with vector similarity search (cosine similarity)

    return [
      { userId: "learner_001", similarityScore: 0.92 },
      { userId: "learner_002", similarityScore: 0.88 },
      { userId: "learner_003", similarityScore: 0.85 },
      { userId: "learner_004", similarityScore: 0.82 },
      { userId: "learner_005", similarityScore: 0.79 },
    ];
  }

  /**
   * Get peer insights for a topic/approach combination
   */
  async getPeerInsights(
    userId: string,
    topicId: number,
    approachId: number
  ): Promise<PeerInsight> {
    // Find similar learners
    const similarLearners = await this.findSimilarLearners(userId);

    // In a real system, query peer performance data
    // For now, return mock data

    const mockPeerData = {
      [1]: { // Socratic
        effectiveness: 78,
        successRate: 0.82,
        timeToMastery: 120,
        misconceptions: ["Confusing questions with answers", "Rushing to conclusions"],
      },
      [2]: { // Problem-based
        effectiveness: 85,
        successRate: 0.88,
        timeToMastery: 150,
        misconceptions: ["Overthinking simple problems", "Not reading problem carefully"],
      },
      [3]: { // Experiential
        effectiveness: 80,
        successRate: 0.84,
        timeToMastery: 100,
        misconceptions: ["Not reflecting on experience", "Skipping practice"],
      },
      [4]: { // Peer
        effectiveness: 72,
        successRate: 0.75,
        timeToMastery: 110,
        misconceptions: ["Relying too much on peers", "Not verifying information"],
      },
      [5]: { // Teaching
        effectiveness: 88,
        successRate: 0.91,
        timeToMastery: 140,
        misconceptions: ["Oversimplifying concepts", "Not covering edge cases"],
      },
      [6]: { // Challenges
        effectiveness: 75,
        successRate: 0.78,
        timeToMastery: 95,
        misconceptions: ["Getting frustrated with difficulty", "Giving up too early"],
      },
      [7]: { // Microlearning
        effectiveness: 70,
        successRate: 0.72,
        timeToMastery: 180,
        misconceptions: ["Fragmented understanding", "Not connecting concepts"],
      },
      [8]: { // Discovery
        effectiveness: 82,
        successRate: 0.86,
        timeToMastery: 130,
        misconceptions: ["Getting lost in exploration", "Not finding key concepts"],
      },
      [9]: { // Synthesis
        effectiveness: 86,
        successRate: 0.89,
        timeToMastery: 160,
        misconceptions: ["Oversimplifying synthesis", "Missing important connections"],
      },
    };

    const peerData = mockPeerData[approachId as keyof typeof mockPeerData] || {
      effectiveness: 75,
      successRate: 0.78,
      timeToMastery: 120,
      misconceptions: [],
    };

    return {
      similarLearnerCount: similarLearners.length,
      mostEffectiveApproach: approachId,
      effectivenessScore: peerData.effectiveness,
      successRate: peerData.successRate,
      averageTimeToMastery: peerData.timeToMastery,
      commonMisconceptions: peerData.misconceptions,
      recommendedPath: [5, 2, 8, 1, 3, 6, 4, 7, 9], // Teaching → Problem-based → Discovery → ...
      confidence: Math.min(100, similarLearners.length * 15), // More similar learners = higher confidence
    };
  }

  /**
   * Get recommended approach sequence based on peer data
   */
  async getRecommendedApproachSequence(
    userId: string,
    topicId: number
  ): Promise<Array<{
    approachId: number;
    approachName: string;
    successRate: number;
    estimatedTime: number;
    reasoning: string;
  }>> {
    const approachNames: Record<number, string> = {
      1: "Socratic Questioning",
      2: "Problem-Based Learning",
      3: "Experiential Learning",
      4: "Peer Learning Network",
      5: "Learn by Teaching",
      6: "Gamified Challenges",
      7: "Microlearning Bursts",
      8: "AI-Guided Discovery",
      9: "Multimodal Synthesis",
    };

    // Get peer insights for each approach
    const insights = await Promise.all(
      Array.from({ length: 9 }, (_, i) =>
        this.getPeerInsights(userId, topicId, i + 1)
      )
    );

    // Sort by effectiveness
    const sortedApproaches = insights
      .map((insight, index) => ({
        approachId: index + 1,
        approachName: approachNames[index + 1],
        successRate: insight.successRate,
        estimatedTime: insight.averageTimeToMastery,
        effectiveness: insight.effectivenessScore,
      }))
      .sort((a, b) => b.effectiveness - a.effectiveness);

    return sortedApproaches.map((approach) => ({
      approachId: approach.approachId,
      approachName: approach.approachName,
      successRate: approach.successRate,
      estimatedTime: approach.estimatedTime,
      reasoning: `Similar learners had ${Math.round(approach.successRate * 100)}% success rate with this approach`,
    }));
  }

  /**
   * Identify learning patterns from peer data
   */
  async identifyPeerPatterns(topicId: number): Promise<{
    mostCommonPath: number[];
    fastestPath: number[];
    deepestPath: number[];
    engagingPath: number[];
    commonStruggles: string[];
    successFactors: string[];
  }> {
    // In a real system, this would analyze aggregate peer data
    // For now, return mock patterns

    return {
      mostCommonPath: [5, 2, 8, 1, 3], // Teaching → Problem-based → Discovery → Socratic → Experiential
      fastestPath: [7, 6, 3, 2, 1], // Microlearning → Challenges → Experiential → Problem-based → Socratic
      deepestPath: [5, 2, 8, 9, 1], // Teaching → Problem-based → Discovery → Synthesis → Socratic
      engagingPath: [6, 4, 3, 9, 5], // Challenges → Peer → Experiential → Synthesis → Teaching
      commonStruggles: [
        "Misconceptions about foundational concepts",
        "Difficulty connecting theory to practice",
        "Cognitive overload from too much content",
        "Disengagement after initial concepts",
      ],
      successFactors: [
        "Starting with concrete examples",
        "Regular practice and application",
        "Peer discussion and explanation",
        "Varied learning approaches",
        "Clear learning objectives",
      ],
    };
  }

  /**
   * Get learning recommendations based on peer success patterns
   */
  async getPeerBasedRecommendations(
    userId: string,
    topicId: number,
    currentApproachId: number
  ): Promise<{
    nextApproachId: number;
    reasoning: string;
    successProbability: number;
    alternativeApproaches: number[];
  }> {
    // Get peer patterns
    const patterns = await this.identifyPeerPatterns(topicId);

    // Find current approach in patterns
    let nextApproachId = currentApproachId + 1;
    let reasoning = "Based on peer patterns";

    // Check if current approach is in most common path
    const pathIndex = patterns.mostCommonPath.indexOf(currentApproachId);
    if (pathIndex >= 0 && pathIndex < patterns.mostCommonPath.length - 1) {
      nextApproachId = patterns.mostCommonPath[pathIndex + 1];
      reasoning = "Following most common successful path from peer data";
    }

    // Get success probability from peer insights
    const insight = await this.getPeerInsights(userId, topicId, nextApproachId);

    return {
      nextApproachId,
      reasoning,
      successProbability: insight.successRate * 100,
      alternativeApproaches: patterns.mostCommonPath.filter((a) => a !== nextApproachId).slice(0, 2),
    };
  }

  /**
   * Detect emerging learning trends from peer data
   */
  async detectLearningTrends(): Promise<{
    emergingApproaches: Array<{
      approachId: number;
      growthRate: number; // % increase in usage
      adoptionRate: number; // % of learners using it
    }>;
    decliningApproaches: Array<{
      approachId: number;
      declineRate: number;
      adoptionRate: number;
    }>;
    topicTrends: Array<{
      topicId: number;
      growthRate: number;
      engagementTrend: "increasing" | "stable" | "decreasing";
    }>;
  }> {
    // In a real system, this would analyze time-series peer data
    // For now, return mock trends

    return {
      emergingApproaches: [
        { approachId: 9, growthRate: 45, adoptionRate: 0.35 }, // Synthesis
        { approachId: 8, growthRate: 30, adoptionRate: 0.42 }, // Discovery
      ],
      decliningApproaches: [
        { approachId: 7, declineRate: -15, adoptionRate: 0.28 }, // Microlearning
      ],
      topicTrends: [
        { topicId: 1, growthRate: 25, engagementTrend: "increasing" },
        { topicId: 2, growthRate: 10, engagementTrend: "stable" },
      ],
    };
  }

  /**
   * Calculate peer similarity score between two learners
   */
  private calculateSimilarityScore(profile1: any, profile2: any): number {
    // Euclidean distance in learning profile space
    let distance = 0;

    // Learning style similarity
    distance += Math.pow((profile1.visualLearning || 0) - (profile2.visualLearning || 0), 2);
    distance += Math.pow((profile1.kinestheticLearning || 0) - (profile2.kinestheticLearning || 0), 2);
    distance += Math.pow((profile1.auditoryLearning || 0) - (profile2.auditoryLearning || 0), 2);
    distance += Math.pow((profile1.readingWritingLearning || 0) - (profile2.readingWritingLearning || 0), 2);

    // Motivation similarity
    const motivationScore1 = this.motivationToScore(profile1.primaryMotivator);
    const motivationScore2 = this.motivationToScore(profile2.primaryMotivator);
    distance += Math.pow(motivationScore1 - motivationScore2, 2);

    // Pacing similarity
    const pacingScore1 = this.pacingToScore(profile1.preferredPace);
    const pacingScore2 = this.pacingToScore(profile2.preferredPace);
    distance += Math.pow(pacingScore1 - pacingScore2, 2);

    // Convert distance to similarity (0-1)
    const similarity = 1 / (1 + Math.sqrt(distance));
    return similarity;
  }

  /**
   * Convert motivation to numeric score
   */
  private motivationToScore(motivation: string): number {
    const scores: Record<string, number> = {
      mastery: 0,
      achievement: 1,
      autonomy: 2,
      relatedness: 3,
      curiosity: 4,
    };
    return scores[motivation] || 0;
  }

  /**
   * Convert pacing to numeric score
   */
  private pacingToScore(pace: string): number {
    const scores: Record<string, number> = {
      fast: 0,
      moderate: 1,
      slow: 2,
    };
    return scores[pace] || 1;
  }
}

// Export singleton
export const peerIntelligence = new PeerIntelligence();
