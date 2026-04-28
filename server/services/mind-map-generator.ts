import { orchestrateLLM } from "../ai-orchestrator";
import { learningBehaviorAnalyzer } from "./learning-behavior-analyzer";

/**
 * Personalized Learning Mind Map Generator
 *
 * Generates scholarship-driven, behavior-based learning mind maps for each user
 * Grounded in learning science principles:
 * - Bloom's taxonomy (cognitive complexity levels)
 * - Feynman technique (simplification & teaching)
 * - Spaced repetition (optimal review timing)
 * - Interleaving (mixing practice types)
 * - Desirable difficulty (challenge calibration)
 * - Learning modalities (visual, kinesthetic, auditory, reading)
 * - Cognitive load theory (chunk size, complexity)
 */

export interface MindMapNode {
  id: string;
  title: string;
  description: string;
  bloomLevel: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
  prerequisites: string[]; // Node IDs
  recommendedApproaches: number[]; // Approach IDs ranked by effectiveness
  estimatedTimeMinutes: number;
  difficulty: 1 | 2 | 3 | 4 | 5; // 1=easy, 5=hard
  learningObjectives: string[];
  assessmentMethod: string;
  commonMisconceptions: string[];
  spaceRepetitionSchedule: string[]; // Dates for review
}

export interface PersonalizedMindMap {
  userId: string;
  topicId: number;
  topicName: string;
  nodes: MindMapNode[];
  learningPath: string[]; // Ordered node IDs
  estimatedTotalTime: number; // minutes
  personalizationFactors: {
    learningStyle: string;
    preferredApproaches: number[];
    difficultyLevel: number;
    pacePreference: string;
    motivationDriver: string;
  };
  scholarshipBasis: string; // Explanation of learning science principles used
}

class MindMapGenerator {
  constructor() {
  }

  /**
   * Generate personalized learning mind map for a user and topic
   */
  async generatePersonalizedMindMap(
    userId: string,
    topicId: number,
    topicName: string,
    knowledgeTestScore?: number,
    userAge?: number
  ): Promise<PersonalizedMindMap> {
    // Get user's learning profile
    const learningProfile = await learningBehaviorAnalyzer.getLearningStyleProfile(userId);
    const learningContext = await learningBehaviorAnalyzer.getLearningContext(userId);
    const approachEffectiveness = await learningBehaviorAnalyzer.getApproachEffectiveness(userId);
    const behaviorPatterns = await learningBehaviorAnalyzer.getBehaviorPatterns(userId);

    // Determine user's learning characteristics
    const learningStyle = this.determineLearningStyle(learningProfile);
    const preferredApproaches = this.rankApproachesByEffectiveness(approachEffectiveness);
    const difficultyLevel = this.calculateOptimalDifficulty(
      knowledgeTestScore,
      learningProfile,
      behaviorPatterns
    );
    const pacePreference = learningProfile?.preferredPace || "moderate";
    const motivationDriver = learningProfile?.primaryMotivator || "mastery";

    // Generate mind map structure using Claude
    const mindMapStructure = await this.generateMindMapStructure(
      topicName,
      learningStyle,
      difficultyLevel,
      userAge || 18,
      knowledgeTestScore || 50,
      learningContext
    );

    // Generate individual nodes with personalization
    const nodes = await Promise.all(
      mindMapStructure.nodes.map((nodeTemplate: any) =>
        this.generatePersonalizedNode(
          nodeTemplate,
          userId,
          learningStyle,
          preferredApproaches,
          difficultyLevel,
          pacePreference
        )
      )
    );

    // Determine optimal learning path
    const learningPath = this.determineOptimalLearningPath(nodes, learningProfile, behaviorPatterns);

    // Calculate total estimated time
    const estimatedTotalTime = nodes.reduce((sum, node) => sum + node.estimatedTimeMinutes, 0);

    // Generate scholarship basis explanation
    const scholarshipBasis = this.generateScholarshipBasis(
      learningStyle,
      difficultyLevel,
      nodes,
      motivationDriver
    );

    return {
      userId,
      topicId,
      topicName,
      nodes,
      learningPath,
      estimatedTotalTime,
      personalizationFactors: {
        learningStyle,
        preferredApproaches,
        difficultyLevel,
        pacePreference,
        motivationDriver,
      },
      scholarshipBasis,
    };
  }

  /**
   * Determine user's primary learning style
   */
  private determineLearningStyle(profile: any): string {
    if (!profile) return "balanced";

    const styles = {
      visual: profile.visualLearning || 0,
      kinesthetic: profile.kinestheticLearning || 0,
      auditory: profile.auditoryLearning || 0,
      reading: profile.readingWritingLearning || 0,
    };

    const maxStyle = Object.entries(styles).reduce((max, [style, score]) =>
      score > max[1] ? [style, score] : max
    );

    return maxStyle[0] as string;
  }

  /**
   * Rank approaches by effectiveness for this user
   */
  private rankApproachesByEffectiveness(approachEffectiveness: any[]): number[] {
    return approachEffectiveness
      .sort((a, b) => (b.overallEffectiveness || 0) - (a.overallEffectiveness || 0))
      .slice(0, 3)
      .map((a) => a.approachId);
  }

  /**
   * Calculate optimal difficulty level based on knowledge and behavior
   */
  private calculateOptimalDifficulty(
    knowledgeTestScore: number | undefined,
    learningProfile: any,
    behaviorPatterns: any[]
  ): number {
    let difficulty = 3; // Default to medium

    // Adjust based on knowledge test
    if (knowledgeTestScore !== undefined) {
      if (knowledgeTestScore > 80) difficulty = 4;
      else if (knowledgeTestScore > 60) difficulty = 3;
      else if (knowledgeTestScore > 40) difficulty = 2;
      else difficulty = 1;
    }

    // Adjust based on learning profile
    if (learningProfile?.profileStrength > 80) {
      // User has consistent performance
      const avgConfidence = learningProfile?.baselineConfidence || 50;
      if (avgConfidence > 80) difficulty = Math.min(5, difficulty + 1);
      else if (avgConfidence < 40) difficulty = Math.max(1, difficulty - 1);
    }

    // Adjust based on difficulty sweet spot pattern
    const difficultyPattern = behaviorPatterns.find((p) => p.patternType === "difficulty_sweet_spot");
    if (difficultyPattern) {
      const avgEngagement = difficultyPattern.patternData?.avgEngagement || 0;
      if (avgEngagement > 85) difficulty = Math.min(5, difficulty + 1);
      else if (avgEngagement < 60) difficulty = Math.max(1, difficulty - 1);
    }

    return difficulty as 1 | 2 | 3 | 4 | 5;
  }

  /**
   * Generate mind map structure using Claude
   */
  private async generateMindMapStructure(
    topicName: string,
    learningStyle: string,
    difficultyLevel: number,
    userAge: number,
    knowledgeScore: number,
    learningContext: any
  ): Promise<any> {
    const prompt = `You are an expert learning scientist and curriculum designer. Create a personalized learning mind map structure for "${topicName}".

User Profile:
- Learning Style: ${learningStyle}
- Difficulty Level: ${difficultyLevel}/5 (1=beginner, 5=expert)
- Age: ${userAge}
- Knowledge Score: ${knowledgeScore}/100
- Education Level: ${learningContext?.educationLevel || "unknown"}
- Primary Goal: ${learningContext?.primaryGoal || "learning"}

Design a mind map that:
1. Uses Bloom's taxonomy to scaffold learning (remember → understand → apply → analyze → evaluate → create)
2. Identifies prerequisite concepts (what must be learned first)
3. Incorporates spaced repetition (review schedule)
4. Uses interleaving (mix different types of practice)
5. Calibrates desirable difficulty (challenge without overwhelming)
6. Accounts for cognitive load (manageable chunk sizes)
7. Incorporates the Feynman technique (simplification & teaching)
8. Matches the user's learning style (${learningStyle})
9. Respects the user's difficulty preference (${difficultyLevel}/5)
10. Aligns with age-appropriate content (${userAge} years old)

Generate 5-8 core learning nodes. For each node, provide:
- Title (clear, concise)
- Description (what will be learned)
- Bloom level (remember/understand/apply/analyze/evaluate/create)
- Prerequisites (which nodes must come first)
- Estimated time (minutes)
- Difficulty (1-5)
- Learning objectives (2-3 specific outcomes)
- Assessment method (how to verify understanding)
- Common misconceptions (what students often get wrong)

Format as JSON:
{
  "nodes": [
    {
      "title": "...",
      "description": "...",
      "bloomLevel": "...",
      "prerequisites": [],
      "estimatedTime": 20,
      "difficulty": 3,
      "learningObjectives": ["...", "..."],
      "assessmentMethod": "...",
      "commonMisconceptions": ["...", "..."]
    }
  ],
  "scholarshipBasis": "Explanation of learning science principles used"
}`;

    try {
      const response = await orchestrateLLM("content", {
        messages: [          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const contentText = (response.choices[0]?.message?.content as string) || "";
      if (contentText) {
        return JSON.parse(contentText);
      }
    } catch (error) {
      console.error("Error generating mind map structure:", error);
    }

    // Fallback structure
    return {
      nodes: [
        {
          title: `Introduction to ${topicName}`,
          description: `Learn the fundamentals of ${topicName}`,
          bloomLevel: "understand",
          prerequisites: [],
          estimatedTime: 20,
          difficulty: 2,
          learningObjectives: ["Understand basic concepts", "Identify key components"],
          assessmentMethod: "Quiz",
          commonMisconceptions: [],
        },
      ],
      scholarshipBasis: "Bloom's taxonomy, spaced repetition, cognitive load theory",
    };
  }

  /**
   * Generate personalized node with recommended approaches
   */
  private async generatePersonalizedNode(
    nodeTemplate: any,
    userId: string,
    learningStyle: string,
    preferredApproaches: number[],
    difficultyLevel: number,
    pacePreference: string
  ): Promise<MindMapNode> {
    // Generate node ID
    const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Rank approaches for this specific node
    const recommendedApproaches = this.rankApproachesForNode(
      nodeTemplate.bloomLevel,
      learningStyle,
      difficultyLevel,
      preferredApproaches
    );

    // Calculate spaced repetition schedule
    const spaceRepetitionSchedule = this.calculateSpacedRepetitionSchedule(
      nodeTemplate.estimatedTime,
      pacePreference
    );

    return {
      id: nodeId,
      title: nodeTemplate.title,
      description: nodeTemplate.description,
      bloomLevel: nodeTemplate.bloomLevel,
      prerequisites: nodeTemplate.prerequisites || [],
      recommendedApproaches,
      estimatedTimeMinutes: nodeTemplate.estimatedTime || 20,
      difficulty: nodeTemplate.difficulty || 3,
      learningObjectives: nodeTemplate.learningObjectives || [],
      assessmentMethod: nodeTemplate.assessmentMethod || "Quiz",
      commonMisconceptions: nodeTemplate.commonMisconceptions || [],
      spaceRepetitionSchedule,
    };
  }

  /**
   * Rank learning approaches for a specific node based on Bloom's level and learning style
   */
  private rankApproachesForNode(
    bloomLevel: string,
    learningStyle: string,
    difficultyLevel: number,
    preferredApproaches: number[]
  ): number[] {
    const ranking: Map<number, number> = new Map();

    // Initialize with user's preferred approaches
    preferredApproaches.forEach((approachId, index) => {
      ranking.set(approachId, 100 - index * 20);
    });

    // Adjust based on Bloom's level
    const bloomApproachMap: Record<string, number[]> = {
      remember: [7, 1], // Microlearning, Socratic
      understand: [1, 8], // Socratic, Discovery
      apply: [2, 3], // Problem-based, Experiential
      analyze: [8, 2], // Discovery, Problem-based
      evaluate: [5, 6], // Teaching, Challenges
      create: [5, 9], // Teaching, Synthesis
    };

    const bloomApproaches = bloomApproachMap[bloomLevel] || [1, 2, 3];
    bloomApproaches.forEach((approachId, index) => {
      const current = ranking.get(approachId) || 0;
      ranking.set(approachId, current + (50 - index * 20));
    });

    // Adjust based on learning style
    const styleApproachMap: Record<string, number[]> = {
      visual: [9, 3, 8], // Synthesis, Experiential, Discovery
      kinesthetic: [3, 6, 2], // Experiential, Challenges, Problem-based
      auditory: [4, 1, 8], // Peer, Socratic, Discovery
      reading: [1, 8, 5], // Socratic, Discovery, Teaching
    };

    const styleApproaches = styleApproachMap[learningStyle] || [1, 2, 3];
    styleApproaches.forEach((approachId, index) => {
      const current = ranking.get(approachId) || 0;
      ranking.set(approachId, current + (40 - index * 15));
    });

    // Sort by score and return top 3
    return Array.from(ranking.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([approachId]) => approachId);
  }

  /**
   * Calculate spaced repetition schedule based on learning science
   */
  private calculateSpacedRepetitionSchedule(estimatedTimeMinutes: number, pacePreference: string): string[] {
    const schedule: string[] = [];
    const today = new Date();

    // Ebbinghaus spacing: 1 day, 3 days, 7 days, 14 days, 30 days
    const intervals = [1, 3, 7, 14, 30];

    // Adjust intervals based on pace preference
    const adjustedIntervals =
      pacePreference === "fast"
        ? intervals.map((i) => Math.ceil(i * 0.7))
        : pacePreference === "slow"
          ? intervals.map((i) => Math.ceil(i * 1.3))
          : intervals;

    adjustedIntervals.forEach((days) => {
      const reviewDate = new Date(today);
      reviewDate.setDate(reviewDate.getDate() + days);
      schedule.push(reviewDate.toISOString().split("T")[0]);
    });

    return schedule;
  }

  /**
   * Determine optimal learning path through the mind map
   */
  private determineOptimalLearningPath(
    nodes: MindMapNode[],
    learningProfile: any,
    behaviorPatterns: any[]
  ): string[] {
    // Build dependency graph
    const graph = new Map<string, string[]>();
    nodes.forEach((node) => {
      graph.set(node.id, node.prerequisites);
    });

    // Topological sort to find valid learning order
    const visited = new Set<string>();
    const path: string[] = [];

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const prerequisites = graph.get(nodeId) || [];
      prerequisites.forEach((prereq) => {
        const prereqNode = nodes.find((n) => n.id === prereq);
        if (prereqNode) visit(prereqNode.id);
      });

      path.push(nodeId);
    };

    // Start with nodes that have no prerequisites
    const startNodes = nodes.filter((n) => n.prerequisites.length === 0);
    startNodes.forEach((node) => visit(node.id));

    // Visit remaining nodes
    nodes.forEach((node) => visit(node.id));

    // Reorder based on difficulty if user prefers gradual progression
    if (learningProfile?.preferredComplexity === "simple_first") {
      const pathNodes = path.map((id) => nodes.find((n) => n.id === id)!);
      pathNodes.sort((a, b) => a.difficulty - b.difficulty);
      return pathNodes.map((n) => n.id);
    }

    return path;
  }

  /**
   * Generate explanation of scholarship basis
   */
  private generateScholarshipBasis(
    learningStyle: string,
    difficultyLevel: number,
    nodes: MindMapNode[],
    motivationDriver: string
  ): string {
    const bloomLevels = new Set(nodes.map((n) => n.bloomLevel));
    const hasSpacedRepetition = nodes.some((n) => n.spaceRepetitionSchedule.length > 0);
    const hasInterleaving = nodes.length > 1;

    let basis = `This personalized mind map is grounded in evidence-based learning science principles:\n\n`;

    basis += `1. **Bloom's Taxonomy**: Content is scaffolded across cognitive levels (${Array.from(bloomLevels).join(", ")}) to build from foundational understanding to higher-order thinking.\n\n`;

    basis += `2. **Learning Style Matching**: The ${learningStyle} learning style preference is accommodated through recommended approaches that align with your natural learning preferences.\n\n`;

    basis += `3. **Desirable Difficulty**: Difficulty level ${difficultyLevel}/5 is calibrated to provide optimal challenge—hard enough to promote learning, but not so hard as to cause frustration.\n\n`;

    if (hasSpacedRepetition) {
      basis += `4. **Spaced Repetition**: Review schedules follow Ebbinghaus spacing intervals (1, 3, 7, 14, 30 days) to optimize long-term retention.\n\n`;
    }

    if (hasInterleaving) {
      basis += `5. **Interleaving**: Multiple learning approaches are mixed throughout to improve transfer and prevent over-reliance on single methods.\n\n`;
    }

    basis += `6. **Cognitive Load Theory**: Content is chunked into manageable units to avoid overwhelming working memory.\n\n`;

    basis += `7. **Motivation Alignment**: The ${motivationDriver} motivation driver is supported through approach selection and assessment methods.\n\n`;

    basis += `8. **Feynman Technique**: Teaching and explanation approaches are included to promote deep understanding through simplification.`;

    return basis;
  }
}

// Export singleton
export const mindMapGenerator = new MindMapGenerator();
