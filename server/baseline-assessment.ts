import Anthropic from "@anthropic-ai/sdk";
import { LearnerProfile } from "./adaptive-learning-engine";

const client = new Anthropic();

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: "yes-no" | "multiple-choice" | "text" | "scale";
  options?: string[];
  followUp?: string;
  purpose: "prior-knowledge" | "learning-style" | "pace" | "goals" | "confidence";
}

export interface AssessmentResponse {
  questionId: string;
  answer: string | number;
  confidence?: number;
}

export interface BaselineAssessmentResult {
  learnerProfile: Partial<LearnerProfile>;
  assessmentScore: number;
  recommendations: string[];
  nextSteps: string;
}

/**
 * Generate conversational baseline assessment questions
 */
export async function generateBaselineQuestions(topic: string): Promise<AssessmentQuestion[]> {
  const prompt = `Generate 8 conversational assessment questions to evaluate a learner's baseline knowledge about "${topic}".

The questions should:
1. NOT feel like a formal test
2. Build confidence (easy questions first)
3. Assess: prior knowledge, learning style, pace preference, goals
4. Be conversational and friendly
5. Include follow-up questions based on answers

Structure:
- Q1-2: Prior knowledge (yes/no, "Have you heard of X?")
- Q3-4: Learning style (how they prefer to learn)
- Q5-6: Pace preference (quick overview vs deep dive)
- Q7-8: Goals (why they want to learn this)

Return ONLY valid JSON (no markdown):
{
  "questions": [
    {
      "id": "q1",
      "question": "Have you heard of [concept]?",
      "type": "yes-no",
      "purpose": "prior-knowledge",
      "followUp": "If yes, what do you know about it?"
    }
  ]
}`;

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type");
  }

  try {
    const data = JSON.parse(content.text);
    return data.questions || [];
  } catch (e) {
    console.error("Failed to parse assessment questions:", content.text);
    return [];
  }
}

/**
 * Analyze assessment responses and create learner profile
 */
export async function analyzeAssessmentResponses(
  topic: string,
  responses: AssessmentResponse[],
  questions: AssessmentQuestion[]
): Promise<BaselineAssessmentResult> {
  // Build response context
  const responseContext = responses
    .map((r) => {
      const q = questions.find((q) => q.id === r.questionId);
      return `Q: ${q?.question}\nA: ${r.answer}`;
    })
    .join("\n\n");

  const prompt = `Analyze these baseline assessment responses for a learner about "${topic}":

${responseContext}

Based on the responses, determine:
1. Prior Knowledge Level (none/basic/intermediate/advanced)
2. Learning Style (visual/kinesthetic/auditory/reading-writing)
3. Learning Pace (slow/moderate/fast)
4. Learning Goals (mastery/quick-overview/practical-skills)
5. Motivation Level (low/moderate/high)
6. Confidence Level (0-100)
7. Key Strengths
8. Areas to Focus On

Return ONLY valid JSON:
{
  "priorKnowledge": "basic",
  "learningStyle": "visual",
  "learningPace": "moderate",
  "learningGoals": ["mastery", "practical-skills"],
  "motivationLevel": "high",
  "confidenceLevel": 65,
  "strengths": ["...", "..."],
  "focusAreas": ["...", "..."],
  "recommendations": ["...", "..."],
  "nextSteps": "Start with fundamentals lesson..."
}`;

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type");
  }

  try {
    const analysis = JSON.parse(content.text);

    // Create learner profile
    const learnerProfile: Partial<LearnerProfile> = {
      learningStyle: analysis.learningStyle,
      learningPace: analysis.learningPace,
      currentDifficulty: analysis.priorKnowledge === "advanced" ? "advanced" : "beginner",
      motivationLevel: analysis.motivationLevel,
      engagementScore: analysis.confidenceLevel,
      priorKnowledge: {
        [topic]: analysis.priorKnowledge,
      },
      recentQuizScores: [],
      conceptMastery: {},
      detectedMisconceptions: [],
    };

    // Calculate assessment score
    const assessmentScore = analysis.confidenceLevel;

    return {
      learnerProfile,
      assessmentScore,
      recommendations: analysis.recommendations || [],
      nextSteps: analysis.nextSteps || "Ready to start learning!",
    };
  } catch (e) {
    console.error("Failed to parse assessment analysis:", content.text);
    throw new Error("Failed to analyze assessment responses");
  }
}

/**
 * Generate personalized assessment feedback
 */
export async function generateAssessmentFeedback(
  result: BaselineAssessmentResult,
  topic: string
): Promise<string> {
  const prompt = `Generate encouraging, personalized feedback for a learner based on their baseline assessment for "${topic}".

Profile:
- Learning Style: ${result.learnerProfile.learningStyle}
- Pace: ${result.learnerProfile.learningPace}
- Prior Knowledge: ${JSON.stringify(result.learnerProfile.priorKnowledge)}
- Motivation: ${result.learnerProfile.motivationLevel}
- Assessment Score: ${result.assessmentScore}/100

Next Steps: ${result.nextSteps}

Generate feedback that:
1. Celebrates their strengths
2. Acknowledges their learning style and pace
3. Sets realistic expectations
4. Builds confidence
5. Explains what's coming next
6. Makes them excited to learn

Keep it conversational and warm, 2-3 sentences max.`;

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    return "Great! Let's get started on your learning journey!";
  }

  return content.text;
}

/**
 * Determine if learner needs prerequisite review
 */
export async function assessPrerequisites(
  topic: string,
  learnerProfile: Partial<LearnerProfile>
): Promise<{
  needsPrerequisites: boolean;
  prerequisites: string[];
  estimatedTime: number;
}> {
  const prompt = `For the topic "${topic}", determine if a learner with this profile needs prerequisite review:

Learning Style: ${learnerProfile.learningStyle}
Prior Knowledge: ${JSON.stringify(learnerProfile.priorKnowledge)}
Learning Pace: ${learnerProfile.learningPace}

Return JSON:
{
  "needsPrerequisites": true/false,
  "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
  "estimatedTime": 30,
  "reason": "Why prerequisites are needed"
}`;

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    return {
      needsPrerequisites: false,
      prerequisites: [],
      estimatedTime: 0,
    };
  }

  try {
    return JSON.parse(content.text);
  } catch (e) {
    return {
      needsPrerequisites: false,
      prerequisites: [],
      estimatedTime: 0,
    };
  }
}

/**
 * Generate quick confidence-building question
 */
export async function generateConfidenceBuilder(
  topic: string,
  learnerProfile: Partial<LearnerProfile>
): Promise<string> {
  const prompt = `Generate a simple, confidence-building question about "${topic}" for a learner with ${learnerProfile.learningStyle} learning style.

The question should:
1. Be easy to answer (build confidence)
2. Be relevant to the topic
3. Feel like a conversation, not a test
4. Take <1 minute to answer

Example format: "What's one thing you already know about [topic]?"

Generate just the question, no explanation.`;

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    return "What's one thing you already know about this topic?";
  }

  return content.text.trim();
}
