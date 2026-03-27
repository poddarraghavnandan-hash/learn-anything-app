import { invokeLLM } from "./_core/llm";
import {
  createLearnerProfile,
  getLearnerProfile,
  updateLearnerProfile,
  saveGoogleSignInData,
  getGoogleSignInData,
  extractLanguageFromLocale,
  extractRegionFromLocale,
} from "./db-learner-epistemology";
import type { InsertLearnerProfile } from "../drizzle/schema";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OnboardingQuestion {
  id: string;
  question: string;
  type: "open" | "choice" | "scale";
  options?: string[];
  followUp?: boolean;
  timeLimit?: number; // seconds
}

export interface OnboardingResponse {
  questionId: string;
  answer: string | number;
  timeSpent: number; // seconds
}

export interface ProfileInferenceResult {
  cognitiveStyle: "visual" | "narrative" | "logical" | "kinesthetic" | "mixed";
  primaryProblemFrame: string;
  meaningMakingPattern: "ethics" | "systems" | "aesthetics" | "utility" | "creativity";
  integrationStyle: "application" | "teaching" | "creation" | "reflection";
  learningPace: "fast" | "moderate" | "deep";
  confidence: number; // 0-1
}

// ─── Onboarding Questions ────────────────────────────────────────────────────

/**
 * Generate engaging onboarding questions in <90 seconds
 * Questions are designed to infer learner profile without feeling like a test
 */
export function generateOnboardingQuestions(): OnboardingQuestion[] {
  return [
    {
      id: "learning_style",
      question: "When you learn something new, what helps you understand it best?",
      type: "choice",
      options: [
        "Seeing diagrams, videos, or visual examples",
        "Hearing explanations or stories",
        "Reading detailed explanations",
        "Trying it hands-on or experimenting",
      ],
      timeLimit: 15,
    },
    {
      id: "motivation",
      question: "What drives your learning right now?",
      type: "choice",
      options: [
        "Solving a specific problem I face",
        "Building a skill for my career",
        "Understanding how things work",
        "Personal growth and curiosity",
        "Helping others or making an impact",
      ],
      timeLimit: 15,
    },
    {
      id: "learning_pace",
      question: "How do you prefer to learn?",
      type: "choice",
      options: [
        "Quick, bite-sized lessons I can consume fast",
        "Balanced depth and speed",
        "Deep dives into topics, even if it takes time",
      ],
      timeLimit: 10,
    },
    {
      id: "application",
      question: "After learning something, what do you usually do?",
      type: "choice",
      options: [
        "Apply it immediately to solve problems",
        "Share what I learned with others",
        "Create something new with it",
        "Reflect and integrate it into my thinking",
      ],
      timeLimit: 15,
    },
    {
      id: "context",
      question: "What's one thing you'd love to understand better?",
      type: "open",
      timeLimit: 30,
    },
  ];
}

// ─── Profile Inference ───────────────────────────────────────────────────────

/**
 * Infer learner profile from onboarding responses using LLM
 */
export async function inferProfileFromResponses(
  responses: OnboardingResponse[],
  googleData?: {
    locale?: string;
    language?: string;
    timezone?: string;
  }
): Promise<ProfileInferenceResult> {
  const responseText = responses
    .map((r) => `Q${r.questionId}: ${r.answer} (${r.timeSpent}s)`)
    .join("\n");

  const prompt = `Analyze these learning profile responses and infer the learner's characteristics:

${responseText}

${
  googleData?.locale
    ? `Additional context: Locale: ${googleData.locale}, Language: ${googleData.language}, Timezone: ${googleData.timezone}`
    : ""
}

Infer and return a JSON object with:
- cognitiveStyle: one of "visual", "narrative", "logical", "kinesthetic", "mixed"
- primaryProblemFrame: what they care about (1-2 words)
- meaningMakingPattern: one of "ethics", "systems", "aesthetics", "utility", "creativity"
- integrationStyle: one of "application", "teaching", "creation", "reflection"
- learningPace: one of "fast", "moderate", "deep" based on time spent
- confidence: 0-1 score of how confident you are in these inferences

Return ONLY valid JSON, no markdown or explanation.`;

  const result = await invokeLLM({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  if (!result.choices || result.choices.length === 0) {
    throw new Error("Failed to infer profile from responses");
  }

  const content = result.choices[0].message.content;
  const respText = typeof content === "string" ? content : JSON.stringify(content);

  try {
    const parsed = JSON.parse(respText);
    return {
      cognitiveStyle: parsed.cognitiveStyle || "mixed",
      primaryProblemFrame: parsed.primaryProblemFrame || "learning",
      meaningMakingPattern: parsed.meaningMakingPattern || "utility",
      integrationStyle: parsed.integrationStyle || "application",
      learningPace: parsed.learningPace || "moderate",
      confidence: parsed.confidence || 0.5,
    };
  } catch (e) {
    console.error("Failed to parse profile inference:", e);
    return {
      cognitiveStyle: "mixed",
      primaryProblemFrame: "learning",
      meaningMakingPattern: "utility",
      integrationStyle: "application",
      learningPace: "moderate",
      confidence: 0.3,
    };
  }
}

// ─── Profile Creation ────────────────────────────────────────────────────────

/**
 * Create or update learner profile after onboarding
 */
export async function initializeOrUpdateProfile(
  userId: number,
  responses: OnboardingResponse[],
  googleData?: {
    locale?: string;
    language?: string;
    timezone?: string;
    email?: string;
  }
): Promise<void> {
  // Infer profile from responses
  const inference = await inferProfileFromResponses(responses, googleData);

  // Extract cultural context from Google data
  const language = extractLanguageFromLocale(googleData?.locale) || googleData?.language;
  const region = extractRegionFromLocale(googleData?.locale);

  // Create or update learner profile
  const existingProfile = await getLearnerProfile(userId);

  if (existingProfile) {
    // Update existing profile
    await updateLearnerProfile(userId, {
      cognitiveStyle: inference.cognitiveStyle,
      primaryProblemFrame: inference.primaryProblemFrame,
      meaningMakingPattern: inference.meaningMakingPattern,
      integrationStyle: inference.integrationStyle,
      learningPace: inference.learningPace,
      culturalContext: region || "unknown",
      completeness: inference.confidence,
    });
  } else {
    // Create new profile
    await createLearnerProfile(userId, {
      cognitiveStyle: inference.cognitiveStyle,
      primaryProblemFrame: inference.primaryProblemFrame,
      meaningMakingPattern: inference.meaningMakingPattern,
      integrationStyle: inference.integrationStyle,
      learningPace: inference.learningPace,
      culturalContext: region || "unknown",
      completeness: inference.confidence,
    });
  }

  // Save Google Sign-In data for future reference
  if (googleData) {
    await saveGoogleSignInData(userId, {
      locale: googleData.locale,
      language: googleData.language,
      email: googleData.email,
    });
  }
}

// ─── Continuous Profiling ───────────────────────────────────────────────────

/**
 * Generate contextual follow-up questions based on learning patterns
 * Called throughout the app lifecycle to refine profile
 */
export async function generateFollowUpQuestion(
  userId: number,
  context: {
    recentTopics?: string[];
    stuckConcepts?: string[];
    successfulLearning?: string[];
    timeSpentPattern?: "short" | "medium" | "long";
  }
): Promise<OnboardingQuestion | null> {
  const profile = await getLearnerProfile(userId);
  if (!profile) return null;

  const contextText = `
Current profile: ${profile.cognitiveStyle} learner, ${profile.learningPace} pace, ${profile.meaningMakingPattern} meaning-maker
Recent topics: ${context.recentTopics?.join(", ") || "none"}
Stuck on: ${context.stuckConcepts?.join(", ") || "none"}
Successful with: ${context.successfulLearning?.join(", ") || "none"}
Time spent pattern: ${context.timeSpentPattern || "unknown"}
`;

  const prompt = `Based on this learner profile and context, generate ONE contextual follow-up question to refine understanding:

${contextText}

The question should:
1. Feel natural and conversational, not like a test
2. Help refine one aspect of their profile (e.g., if they're stuck, ask about their approach)
3. Be answerable in <20 seconds
4. Provide actionable insight for personalizing their learning

Return a JSON object with:
- id: unique question id
- question: the question text
- type: "open" or "choice"
- options: array of options if type is "choice"
- followUp: true (since this is a follow-up)
- timeLimit: 20

Return ONLY valid JSON, no markdown.`;

  const result = await invokeLLM({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  if (!result.choices || result.choices.length === 0) {
    return null;
  }

  const content = result.choices[0].message.content;
  const respText = typeof content === "string" ? content : JSON.stringify(content);

  try {
    const parsed = JSON.parse(respText);
    return {
      id: parsed.id || `followup_${Date.now()}`,
      question: parsed.question,
      type: parsed.type || "open",
      options: parsed.options,
      followUp: true,
      timeLimit: 20,
    };
  } catch (e) {
    console.error("Failed to parse follow-up question:", e);
    return null;
  }
}

// ─── Adaptive Question Triggering ────────────────────────────────────────────

/**
 * Determine if we should ask a follow-up question based on learning patterns
 * Returns true if conditions warrant asking
 */
export function shouldAskFollowUpQuestion(
  lastProfileUpdate: Date,
  signals: Array<{
    signalType: string;
    timestamp: Date;
  }>,
  stuckPointCount: number
): boolean {
  // Ask if:
  // 1. Profile hasn't been updated in 7+ days
  const daysSinceUpdate = (Date.now() - lastProfileUpdate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate >= 7) return true;

  // 2. User has 3+ stuck signals in last 24 hours
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentStuck = signals.filter(
    (s) => s.signalType === "stuck" && s.timestamp > last24h
  ).length;
  if (recentStuck >= 3) return true;

  // 3. User has shown a new learning pattern (e.g., switched from "short" to "long" content)
  // This would be detected by comparing recent signals to profile
  // For now, we'll use stuck point changes as a proxy
  if (stuckPointCount > 5) return true;

  return false;
}

// ─── Profile Refinement ──────────────────────────────────────────────────────

/**
 * Refine profile based on new follow-up response
 */
export async function refineProfileFromFollowUp(
  userId: number,
  followUpResponse: OnboardingResponse
): Promise<void> {
  const profile = await getLearnerProfile(userId);
  if (!profile) return;

  // Use LLM to determine what aspect of the profile should be updated
  const prompt = `A learner with profile:
- Cognitive style: ${profile.cognitiveStyle}
- Learning pace: ${profile.learningPace}
- Meaning-making pattern: ${profile.meaningMakingPattern}

Just answered: "${followUpResponse.answer}" (in ${followUpResponse.timeSpent}s)

Should any aspect of their profile be refined? Return JSON with:
- shouldUpdate: boolean
- updatedField: which field to update (or null)
- newValue: new value for that field (or null)
- reason: brief explanation

Return ONLY valid JSON.`;

  const result = await invokeLLM({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  if (!result.choices || result.choices.length === 0) return;

  const content = result.choices[0].message.content;
  const respText = typeof content === "string" ? content : JSON.stringify(content);

  try {
    const parsed = JSON.parse(respText);
    if (parsed.shouldUpdate && parsed.updatedField) {
      const updates: Partial<InsertLearnerProfile> = {};
      (updates as any)[parsed.updatedField] = parsed.newValue;

      await updateLearnerProfile(userId, updates);
    }
  } catch (e) {
    console.error("Failed to refine profile:", e);
  }
}
