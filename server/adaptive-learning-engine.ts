import { orchestrateLLM } from "./ai-orchestrator";
export interface LearnerProfile {
  id: string;
  learningStyle: "visual" | "kinesthetic" | "auditory" | "reading-writing";
  currentDifficulty: "beginner" | "intermediate" | "advanced";
  learningPace: "slow" | "moderate" | "fast";
  conceptMastery: Record<string, number>; // 0-100 score per concept
  recentQuizScores: number[];
  detectedMisconceptions: Array<{
    concept: string;
    misconception: string;
    frequency: number;
  }>;
  engagementScore: number; // 0-100
  motivationLevel: "low" | "moderate" | "high";
  priorKnowledge: Record<string, "none" | "basic" | "intermediate" | "advanced">;
}

export interface AdaptiveContentRequest {
  learnerId: string;
  topic: string;
  profile: LearnerProfile;
}

export interface AdaptiveContent {
  content: string;
  difficulty: string;
  modality: string;
  estimatedMinutes: number;
  misconceptionsAddressed: string[];
  personalizationNotes: string;
}

/**
 * Calculate adaptive difficulty based on learner performance
 */
export function calculateAdaptiveDifficulty(profile: LearnerProfile): "beginner" | "intermediate" | "advanced" {
  if (profile.recentQuizScores.length === 0) {
    return "beginner";
  }

  const avgScore = profile.recentQuizScores.reduce((a, b) => a + b, 0) / profile.recentQuizScores.length;

  if (avgScore >= 85) {
    return "advanced";
  } else if (avgScore >= 70) {
    return "intermediate";
  } else {
    return "beginner";
  }
}

/**
 * Detect misconceptions from quiz answers
 */
export function detectMisconceptions(
  answers: Array<{ question: string; selected: string; correct: string; explanation: string }>
): Array<{ concept: string; misconception: string }> {
  const misconceptions: Array<{ concept: string; misconception: string }> = [];

  for (const answer of answers) {
    if (answer.selected !== answer.correct) {
      // Infer misconception from wrong answer
      misconceptions.push({
        concept: extractConcept(answer.question),
        misconception: `Learner selected "${answer.selected}" instead of "${answer.correct}"`,
      });
    }
  }

  return misconceptions;
}

/**
 * Extract concept from question text
 */
function extractConcept(question: string): string {
  // Simple extraction - in production, use NLP
  const words = question.split(" ");
  return words.slice(0, 3).join(" ");
}

/**
 * Generate adaptive content based on learner profile
 */
export async function generateAdaptiveContent(request: AdaptiveContentRequest): Promise<AdaptiveContent> {
  const { topic, profile } = request;

  // Determine difficulty
  const difficulty = calculateAdaptiveDifficulty(profile);

  // Build personalization prompt
  const prompt = buildAdaptivePrompt(topic, profile, difficulty);

  console.log(`Generating adaptive content for ${profile.id}: ${topic} (${difficulty})`);

  const response = await orchestrateLLM("content", {    maxTokens: 3000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const contentText = (response.choices[0]?.message?.content as string) || "";

  return {
    content: contentText,
    difficulty,
    modality: profile.learningStyle,
    estimatedMinutes: estimateTime(difficulty, profile.learningPace),
    misconceptionsAddressed: profile.detectedMisconceptions.map((m) => m.concept),
    personalizationNotes: `Adapted for ${profile.learningStyle} learner at ${difficulty} level`,
  };
}

/**
 * Build adaptive prompt with learner-specific context
 */
function buildAdaptivePrompt(topic: string, profile: LearnerProfile, difficulty: string): string {
  const misconceptionSection =
    profile.detectedMisconceptions.length > 0
      ? `
Learner has shown these misconceptions:
${profile.detectedMisconceptions.map((m) => `- ${m.concept}: ${m.misconception}`).join("\n")}

IMPORTANT: Address these misconceptions directly in the content.
Explain why the misconception is wrong and provide the correct understanding.`
      : "";

  const paceSection =
    profile.learningPace === "fast"
      ? "This learner learns quickly. Reduce examples, increase challenge, skip basics."
      : profile.learningPace === "slow"
        ? "This learner needs more time. Include more examples, simpler language, more review."
        : "This learner learns at a moderate pace. Balance examples and challenge.";

  const modalitySection = getModalityGuidance(profile.learningStyle);

  const motivationSection =
    profile.motivationLevel === "low"
      ? "This learner is struggling with motivation. Add encouragement, celebrate progress, provide easier wins first."
      : profile.motivationLevel === "high"
        ? "This learner is highly motivated. Add challenging problems, advanced concepts, real-world applications."
        : "This learner has moderate motivation. Maintain engagement with balanced challenge.";

  return `Generate an adaptive lesson on "${topic}" for a learner with this profile:

LEARNER PROFILE:
- Learning Style: ${profile.learningStyle}
- Current Difficulty Level: ${difficulty}
- Learning Pace: ${profile.learningPace}
- Motivation: ${profile.motivationLevel}
- Engagement Score: ${profile.engagementScore}/100
- Prior Knowledge: ${JSON.stringify(profile.priorKnowledge)}

ADAPTATION REQUIREMENTS:

1. DIFFICULTY LEVEL (${difficulty}):
   ${
     difficulty === "beginner"
       ? "- Use intuitive explanations with everyday analogies\n   - Minimize mathematical complexity\n   - Include 5+ worked examples\n   - Focus on conceptual understanding first"
       : difficulty === "intermediate"
         ? "- Balance intuition with technical depth\n   - Include mathematical formulation\n   - Provide 3-4 worked examples\n   - Connect to real applications"
         : "- Provide rigorous mathematical treatment\n   - Include derivations and proofs\n   - Focus on advanced applications\n   - Add research-level content"
   }

2. LEARNING MODALITY (${profile.learningStyle}):
${modalitySection}

3. PACING:
${paceSection}

4. MOTIVATION:
${motivationSection}

5. MISCONCEPTION CORRECTION:
${misconceptionSection}

CONTENT STRUCTURE:
- Start with a brief overview
- Build from simple to complex
- Include 3-5 worked examples
- Add practice problems at appropriate difficulty
- End with a summary and next steps
- Total length: ${estimateTime(difficulty, profile.learningPace) * 200} words

QUALITY REQUIREMENTS:
- Accurate and well-researched
- Substantive and deep (not surface-level)
- Engaging and relevant
- Logically organized
- Appropriate for the learner's level

Generate the lesson content now:`;
}

/**
 * Get learning modality-specific guidance
 */
function getModalityGuidance(modality: string): string {
  switch (modality) {
    case "visual":
      return `- Use detailed descriptions of diagrams and flowcharts
   - Use color-coding in descriptions (e.g., "highlight in blue")
   - Include visual analogies and metaphors
   - Describe step-by-step visual processes
   - Use spatial descriptions and layouts`;

    case "kinesthetic":
      return `- Include interactive problems and simulations
   - Provide code examples and hands-on scenarios
   - Describe step-by-step walkthroughs
   - Include real-world problem solving
   - Focus on "doing" rather than just reading`;

    case "auditory":
      return `- Write in a conversational, narrative style
   - Use dialogue format (Q&A style)
   - Include verbal descriptions and explanations
   - Use rhythm and repetition
   - Make it sound like someone explaining it aloud`;

    case "reading-writing":
      return `- Provide detailed text explanations
   - Include structured notes and outlines
   - Add writing prompts and summary exercises
   - Create comparison tables and lists
   - Focus on reading comprehension`;

    default:
      return "- Balanced approach across all modalities";
  }
}

/**
 * Estimate lesson time based on difficulty and pace
 */
function estimateTime(difficulty: string, pace: string): number {
  const baseTime = difficulty === "beginner" ? 20 : difficulty === "intermediate" ? 30 : 45;

  const paceMultiplier = pace === "fast" ? 0.7 : pace === "slow" ? 1.3 : 1;

  return Math.round(baseTime * paceMultiplier);
}

/**
 * Generate misconception-specific correction content
 */
export async function generateMisconceptionCorrection(
  misconception: { concept: string; wrongBelief: string; correctBelief: string },
  profile: LearnerProfile
): Promise<string> {
  const prompt = `A learner has this misconception about "${misconception.concept}":
- They incorrectly believe: "${misconception.wrongBelief}"
- Correct understanding: "${misconception.correctBelief}"

Generate targeted correction content that:
1. Acknowledges why this misconception is intuitive
2. Explains why it's actually wrong (use a DIFFERENT explanation than what they already read)
3. Provides the correct understanding with a NEW analogy
4. Includes 3 practice problems specifically targeting this misconception
5. Ends with a verification question

Learning style: ${profile.learningStyle}
Difficulty: ${calculateAdaptiveDifficulty(profile)}
Tone: Encouraging and supportive, not condescending

Generate the correction content:`;

  const response = await orchestrateLLM("content", {    maxTokens: 2000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const contentText = (response.choices[0]?.message?.content as string) || "";

  return contentText;
}

/**
 * Generate adaptive difficulty version of content
 */
export async function generateDifficultyVariant(
  topic: string,
  currentDifficulty: string,
  targetDifficulty: string,
  profile: LearnerProfile
): Promise<string> {
  const difficultyMap = {
    beginner: "Simplify significantly: use everyday language, more analogies, minimal math",
    intermediate: "Balance intuition with technical depth",
    advanced: "Increase rigor: mathematical proofs, advanced applications, research content",
  };

  const prompt = `Rewrite the lesson on "${topic}" from ${currentDifficulty} to ${targetDifficulty} difficulty.

${difficultyMap[targetDifficulty as keyof typeof difficultyMap]}

Learning style: ${profile.learningStyle}
Ensure the content is:
- Accurate and substantive
- Appropriate for the target difficulty
- Engaging for the learner
- Well-organized and clear

Generate the ${targetDifficulty} version:`;

  const response = await orchestrateLLM("content", {    maxTokens: 3000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const contentText = (response.choices[0]?.message?.content as string) || "";

  return contentText;
}

/**
 * Update learner profile based on performance
 */
export function updateLearnerProfile(
  profile: LearnerProfile,
  quizScore: number,
  timeSpent: number,
  answers: Array<{ question: string; selected: string; correct: string }>
): LearnerProfile {
  // Update recent quiz scores
  const updatedScores = [...profile.recentQuizScores, quizScore].slice(-5); // Keep last 5

  // Detect new misconceptions
  const newMisconceptions = detectMisconceptions(
    answers.map((a) => ({
      ...a,
      explanation: "",
    }))
  );

  // Update motivation based on performance
  let updatedMotivation = profile.motivationLevel;
  if (quizScore < 60) {
    updatedMotivation = "low";
  } else if (quizScore > 80) {
    updatedMotivation = "high";
  } else {
    updatedMotivation = "moderate";
  }

  // Update engagement based on time spent
  const engagementScore = Math.min(100, profile.engagementScore + (timeSpent > 15 ? 5 : timeSpent < 5 ? -5 : 0));

  // Add frequency to new misconceptions
  const newMisconceptionsWithFrequency = newMisconceptions.map((m) => ({
    ...m,
    frequency: 1,
  }));

  return {
    ...profile,
    recentQuizScores: updatedScores,
    detectedMisconceptions: [
      ...profile.detectedMisconceptions,
      ...newMisconceptionsWithFrequency.filter(
        (nm) =>
          !profile.detectedMisconceptions.some(
            (pm) => pm.concept === nm.concept && pm.misconception === nm.misconception
          )
      ),
    ],
    motivationLevel: updatedMotivation,
    engagementScore,
  };
}
