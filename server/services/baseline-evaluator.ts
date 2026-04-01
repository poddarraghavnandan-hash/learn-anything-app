/**
 * Baseline Evaluator Service
 * 
 * Conducts a fun, adaptive baseline assessment that doesn't feel like a test.
 * Evaluates prior knowledge, learning style, and confidence level.
 */

export interface BaselineQuestion {
  id: string;
  category: "prior_knowledge" | "learning_style" | "confidence" | "motivation";
  question: string;
  type: "yes_no" | "multiple_choice" | "scale" | "open_ended";
  options?: string[];
  scale?: { min: number; max: number; minLabel: string; maxLabel: string };
  followUp?: string; // Optional follow-up question
  topic?: string; // Related topic for prior knowledge questions
}

export interface BaselineResponse {
  questionId: string;
  answer: string | number | boolean;
  timeSpent: number; // milliseconds
  confidence?: number; // 0-1, user's confidence in their answer
}

export interface BaselineAssessment {
  userId: number;
  topicSlug: string;
  questionsAsked: BaselineQuestion[];
  responses: BaselineResponse[];
  startedAt: Date;
  completedAt?: Date;
}

export interface BaselineProfile {
  priorKnowledgeLevel: "novice" | "beginner" | "intermediate" | "advanced";
  learningStyle: "visual" | "kinesthetic" | "auditory" | "reading";
  confidenceLevel: "low" | "medium" | "high";
  motivationLevel: "low" | "medium" | "high";
  recommendedDifficulty: "beginner" | "intermediate" | "advanced";
  recommendedPace: "slow" | "moderate" | "fast";
  insights: string[];
}

/**
 * Generates adaptive baseline assessment questions
 */
export class BaselineEvaluator {
  /**
   * Generate baseline questions for a topic
   * Questions are designed to be fun and non-threatening
   */
  static generateBaselineQuestions(topicSlug: string): BaselineQuestion[] {
    const questions: BaselineQuestion[] = [
      // Prior Knowledge - Friendly, confidence-boosting
      {
        id: "pk_1",
        category: "prior_knowledge",
        question: `Have you heard of "${topicSlug}" before?`,
        type: "yes_no",
        topic: topicSlug,
      },
      {
        id: "pk_2",
        category: "prior_knowledge",
        question: `How would you describe your familiarity with ${topicSlug}?`,
        type: "multiple_choice",
        options: [
          "Never heard of it",
          "Heard the name, but not sure what it is",
          "Have a basic idea",
          "Know quite a bit about it",
          "Consider myself knowledgeable",
        ],
        topic: topicSlug,
      },
      {
        id: "pk_3",
        category: "prior_knowledge",
        question: `Have you used or applied concepts from ${topicSlug} in real life?`,
        type: "yes_no",
        topic: topicSlug,
        followUp: "Tell us a bit about how you used it!",
      },

      // Learning Style - Discover preferences
      {
        id: "ls_1",
        category: "learning_style",
        question: "How do you prefer to learn new things?",
        type: "multiple_choice",
        options: [
          "Watching videos or visual demonstrations",
          "Hands-on practice and experimentation",
          "Listening to explanations and discussions",
          "Reading articles and detailed explanations",
        ],
      },
      {
        id: "ls_2",
        category: "learning_style",
        question: "When you're stuck on a problem, what helps most?",
        type: "multiple_choice",
        options: [
          "A diagram or visual explanation",
          "Trying it myself with guidance",
          "Someone explaining it out loud",
          "Reading step-by-step instructions",
        ],
      },

      // Confidence - Gauge self-efficacy
      {
        id: "conf_1",
        category: "confidence",
        question: "How confident are you in your ability to learn ${topicSlug}?",
        type: "scale",
        scale: {
          min: 1,
          max: 5,
          minLabel: "Not confident",
          maxLabel: "Very confident",
        },
      },
      {
        id: "conf_2",
        category: "confidence",
        question: "How quickly do you typically pick up new concepts?",
        type: "scale",
        scale: {
          min: 1,
          max: 5,
          minLabel: "Takes me time",
          maxLabel: "I pick things up quickly",
        },
      },

      // Motivation - Understand goals
      {
        id: "mot_1",
        category: "motivation",
        question: "What's your main goal for learning ${topicSlug}?",
        type: "multiple_choice",
        options: [
          "Personal interest and curiosity",
          "Career advancement or job requirement",
          "Academic requirement",
          "Solving a specific problem",
          "Just exploring",
        ],
      },
      {
        id: "mot_2",
        category: "motivation",
        question: "How much time can you dedicate to learning this topic?",
        type: "multiple_choice",
        options: [
          "Just a few minutes a day",
          "15-30 minutes daily",
          "1 hour daily",
          "Multiple hours daily",
          "Flexible, depends on the day",
        ],
      },
    ];

    return questions;
  }

  /**
   * Analyze baseline responses and generate profile
   */
  static analyzeResponses(
    responses: BaselineResponse[],
    questions: BaselineQuestion[]
  ): BaselineProfile {
    // Group responses by category
    const responsesByCategory = new Map<string, BaselineResponse[]>();
    questions.forEach((q) => {
      const response = responses.find((r) => r.questionId === q.id);
      if (response) {
        if (!responsesByCategory.has(q.category)) {
          responsesByCategory.set(q.category, []);
        }
        responsesByCategory.get(q.category)!.push(response);
      }
    });

    // Analyze prior knowledge
    const pkResponses = responsesByCategory.get("prior_knowledge") || [];
    const priorKnowledgeLevel = this.analyzePriorKnowledge(pkResponses);

    // Analyze learning style
    const lsResponses = responsesByCategory.get("learning_style") || [];
    const learningStyle = this.analyzeLearningStyle(lsResponses);

    // Analyze confidence
    const confResponses = responsesByCategory.get("confidence") || [];
    const confidenceLevel = this.analyzeConfidence(confResponses);

    // Analyze motivation
    const motResponses = responsesByCategory.get("motivation") || [];
    const motivationLevel = this.analyzeMotivation(motResponses);

    // Generate recommendations
    const recommendedDifficulty = this.recommendDifficulty(priorKnowledgeLevel, confidenceLevel);
    const recommendedPace = this.recommendPace(confidenceLevel, motivationLevel);
    const insights = this.generateInsights(
      priorKnowledgeLevel,
      learningStyle,
      confidenceLevel,
      motivationLevel
    );

    return {
      priorKnowledgeLevel,
      learningStyle,
      confidenceLevel,
      motivationLevel,
      recommendedDifficulty,
      recommendedPace,
      insights,
    };
  }

  private static analyzePriorKnowledge(responses: BaselineResponse[]): "novice" | "beginner" | "intermediate" | "advanced" {
    if (responses.length === 0) return "novice";

    // Score based on responses
    let score = 0;
    responses.forEach((r) => {
      if (typeof r.answer === "string") {
        if (r.answer.toLowerCase().includes("never")) score += 0;
        else if (r.answer.toLowerCase().includes("heard")) score += 1;
        else if (r.answer.toLowerCase().includes("basic")) score += 2;
        else if (r.answer.toLowerCase().includes("quite")) score += 3;
        else if (r.answer.toLowerCase().includes("knowledgeable")) score += 4;
      } else if (typeof r.answer === "number") {
        score += r.answer;
      }
    });

    const avgScore = score / responses.length;
    if (avgScore < 1) return "novice";
    if (avgScore < 2) return "beginner";
    if (avgScore < 3) return "intermediate";
    return "advanced";
  }

  private static analyzeLearningStyle(responses: BaselineResponse[]): "visual" | "kinesthetic" | "auditory" | "reading" {
    if (responses.length === 0) return "visual";

    const styles = ["visual", "kinesthetic", "auditory", "reading"];
    const styleCounts = [0, 0, 0, 0];

    responses.forEach((r) => {
      if (typeof r.answer === "number") {
        styleCounts[r.answer % 4]++;
      } else if (typeof r.answer === "string") {
        const lower = r.answer.toLowerCase();
        if (lower.includes("visual") || lower.includes("diagram") || lower.includes("video")) styleCounts[0]++;
        else if (lower.includes("hands") || lower.includes("practice")) styleCounts[1]++;
        else if (lower.includes("listen") || lower.includes("discussion")) styleCounts[2]++;
        else if (lower.includes("read") || lower.includes("instructions")) styleCounts[3]++;
      }
    });

    const maxIndex = styleCounts.indexOf(Math.max(...styleCounts));
    return (styles[maxIndex] || "visual") as any;
  }

  private static analyzeConfidence(responses: BaselineResponse[]): "low" | "medium" | "high" {
    if (responses.length === 0) return "medium";

    let totalScore = 0;
    responses.forEach((r) => {
      if (typeof r.answer === "number") {
        totalScore += r.answer;
      }
    });

    const avgScore = totalScore / responses.length;
    if (avgScore < 2) return "low";
    if (avgScore < 4) return "medium";
    return "high";
  }

  private static analyzeMotivation(responses: BaselineResponse[]): "low" | "medium" | "high" {
    if (responses.length === 0) return "medium";

    // Check if they have clear goals and time commitment
    const hasGoal = responses.some((r) =>
      typeof r.answer === "string" && r.answer.length > 0
    );
    const hasTimeCommitment = responses.some((r) =>
      typeof r.answer === "string" && (r.answer.includes("hour") || r.answer.includes("multiple"))
    );

    if (hasGoal && hasTimeCommitment) return "high";
    if (hasGoal || hasTimeCommitment) return "medium";
    return "low";
  }

  private static recommendDifficulty(
    priorKnowledge: string,
    confidence: string
  ): "beginner" | "intermediate" | "advanced" {
    if (priorKnowledge === "advanced" && confidence === "high") return "advanced";
    if (priorKnowledge === "intermediate" || confidence === "high") return "intermediate";
    return "beginner";
  }

  private static recommendPace(
    confidence: string,
    motivation: string
  ): "slow" | "moderate" | "fast" {
    if (confidence === "low" || motivation === "low") return "slow";
    if (confidence === "high" && motivation === "high") return "fast";
    return "moderate";
  }

  private static generateInsights(
    priorKnowledge: string,
    learningStyle: string,
    confidence: string,
    motivation: string
  ): string[] {
    const insights: string[] = [];

    if (priorKnowledge === "novice") {
      insights.push("You're starting fresh—that's great! We'll build a strong foundation.");
    } else if (priorKnowledge === "advanced") {
      insights.push("You already have solid knowledge. We'll help you deepen and apply it.");
    }

    insights.push(`Your learning style is ${learningStyle}—we'll tailor content to match.`);

    if (confidence === "low") {
      insights.push("Don't worry! Many people feel uncertain at first. You'll build confidence as you learn.");
    } else if (confidence === "high") {
      insights.push("You're confident—let's channel that into mastery!");
    }

    if (motivation === "high") {
      insights.push("Your motivation is strong. We'll keep the momentum going.");
    }

    return insights;
  }
}
