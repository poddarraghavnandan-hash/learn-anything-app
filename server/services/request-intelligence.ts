import Anthropic from "@anthropic-ai/sdk";

export interface RequestAnalysis {
  intent: "foundational" | "comprehensive" | "deep_dive" | "expert" | "practical";
  topic: string;
  startingPoint: string | null;
  detectedUserLevel: "beginner" | "intermediate" | "advanced" | "expert";
  estimatedDepth: "beginner" | "intermediate" | "advanced" | "expert";
  prerequisites: string[];
  confidence: number;
  suggestedLadderLevel: 1 | 2 | 3 | 4 | 5;
  videoRequired: boolean;
  estimatedDurationMinutes: number;
  sophisticationScore: number; // 0-100
  keyPhrasesDetected: string[];
  reasoning: string;
}

export class RequestIntelligenceAgent {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic();
  }

  /**
   * Analyze user's learning request to understand intent and sophistication level
   */
  async analyzeRequest(
    userRequest: string,
    userLadderLevels?: Record<string, number>,
    userHistory?: { topicId: string; quizAccuracy: number; timeSpent: number }[]
  ): Promise<RequestAnalysis> {
    const systemPrompt = `You are an expert educational analyst. Analyze learning requests to determine:
1. User's actual intent (foundational learning vs comprehensive mastery vs expert deep dive)
2. Sophistication level of the request (are they asking for beginner or advanced content?)
3. Prerequisite knowledge needed
4. Appropriate ladder level (1-5)
5. Whether video content is essential

Respond with JSON only, no markdown.`;

    const userContext = userLadderLevels
      ? `\n\nUser's current ladder levels: ${JSON.stringify(userLadderLevels)}`
      : "";
    const historyContext = userHistory
      ? `\nUser's learning history: Average quiz accuracy ${(userHistory.reduce((sum, h) => sum + h.quizAccuracy, 0) / userHistory.length * 100).toFixed(0)}%`
      : "";

    const message = await this.client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Analyze this learning request: "${userRequest}"${userContext}${historyContext}

Return JSON with: intent, topic, startingPoint, detectedUserLevel, estimatedDepth, prerequisites (array), confidence (0-1), suggestedLadderLevel (1-5), videoRequired (boolean), estimatedDurationMinutes, sophisticationScore (0-100), keyPhrasesDetected (array), reasoning`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON response
    const analysis = JSON.parse(responseText) as RequestAnalysis;

    return analysis;
  }

  /**
   * Detect if user is asking for advanced content based on sophistication markers
   */
  private detectSophisticationMarkers(request: string): {
    score: number;
    markers: string[];
  } {
    const markers: string[] = [];
    let score = 0;

    // Philosophical/theoretical language
    if (/\b(principle|theory|framework|paradigm|epistemolog|ontolog)\b/i.test(request)) {
      markers.push("philosophical_language");
      score += 15;
    }

    // Advanced academic language
    if (/\b(synthesis|critique|deconstruct|juxtapose|dialectic)\b/i.test(request)) {
      markers.push("academic_language");
      score += 20;
    }

    // Comparative/analytical requests
    if (/\b(compare|contrast|analyze|evaluate|critique)\b/i.test(request)) {
      markers.push("analytical_request");
      score += 15;
    }

    // Historical/contextual depth
    if (/\b(history|evolution|development|origin|ancient|modern)\b/i.test(request)) {
      markers.push("historical_context");
      score += 10;
    }

    // Specific theorist/author mentions
    if (/\b(Plato|Aristotle|Kant|Hegel|Rawls|Nozick|Foucault|Derrida)\b/.test(request)) {
      markers.push("specific_theorists");
      score += 25;
    }

    // "Everything about" = comprehensive request
    if (/everything|comprehensive|complete|full|entire/i.test(request)) {
      markers.push("comprehensive_request");
      score += 20;
    }

    // "Starting with" = specific entry point
    if (/starting with|beginning with|from|via/i.test(request)) {
      markers.push("specific_entry_point");
      score += 10;
    }

    return { score: Math.min(score, 100), markers };
  }

  /**
   * Extract prerequisites from request
   */
  private extractPrerequisites(topic: string, request: string): string[] {
    const prerequisites: string[] = [];

    // Topic-specific prerequisite mapping
    const prerequisiteMap: Record<string, string[]> = {
      justice: [
        "philosophy_basics",
        "ethics",
        "ancient_greece",
        "socratic_method",
      ],
      "quantum computing": ["quantum_mechanics", "linear_algebra", "computer_science"],
      "machine learning": ["linear_algebra", "calculus", "probability", "programming"],
      "climate science": ["physics", "chemistry", "earth_science", "statistics"],
    };

    // Get topic-specific prerequisites
    const topicKey = topic.toLowerCase();
    for (const [key, prefs] of Object.entries(prerequisiteMap)) {
      if (topicKey.includes(key)) {
        prerequisites.push(...prefs);
        break;
      }
    }

    // Detect mentioned prerequisites in request
    if (/socratic|plato|aristotle/i.test(request)) {
      if (!prerequisites.includes("ancient_greece")) prerequisites.push("ancient_greece");
      if (!prerequisites.includes("socratic_method")) prerequisites.push("socratic_method");
    }

    if (/quantum/i.test(request)) {
      if (!prerequisites.includes("quantum_mechanics")) prerequisites.push("quantum_mechanics");
    }

    return [...new Set(prerequisites)]; // Remove duplicates
  }
}

export const requestIntelligenceAgent = new RequestIntelligenceAgent();
