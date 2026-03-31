import Anthropic from "@anthropic-ai/sdk";
import { LearnerProfile } from "./adaptive-learning-engine";

const client = new Anthropic();

export type FlowState = "question-answering" | "learning-path" | "assessment" | "misconception-correction";

export interface LearningContext {
  currentTopic: string;
  currentLesson?: string;
  currentConcept?: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  flowState: FlowState;
  learnerProfile: LearnerProfile;
  detectedMisconceptions: string[];
}

export interface FlowTransition {
  from: FlowState;
  to: FlowState;
  reason: string;
  action: string;
}

/**
 * Determine if user should transition from Q&A to learning path
 */
export function shouldTransitionToLearning(
  userMessage: string,
  conversationLength: number
): { should: boolean; reason: string } {
  const transitionTriggers = [
    "teach me",
    "explain properly",
    "learn this",
    "full lesson",
    "step by step",
    "comprehensive",
    "deep dive",
    "i want to master",
  ];

  const shouldTransition = transitionTriggers.some((trigger) => userMessage.toLowerCase().includes(trigger));

  return {
    should: shouldTransition || conversationLength > 3,
    reason: shouldTransition
      ? "User explicitly requested structured learning"
      : "Conversation depth suggests structured learning would help",
  };
}

/**
 * Determine if user should transition from learning to Q&A
 */
export function shouldTransitionToQA(userMessage: string): { should: boolean; reason: string } {
  const qaPatterns = [
    "what if",
    "why does",
    "how do",
    "can you explain",
    "i don't understand",
    "confused",
    "question",
    "clarify",
  ];

  const shouldTransition = qaPatterns.some((pattern) => userMessage.toLowerCase().includes(pattern));

  return {
    should: shouldTransition,
    reason: shouldTransition ? "User asked a question during learning" : "No Q&A trigger detected",
  };
}

/**
 * Generate smooth transition message from Q&A to learning
 */
export async function generateTransitionToLearning(
  topic: string,
  conversationSummary: string,
  learnerProfile: LearnerProfile
): Promise<string> {
  const prompt = `Generate a smooth, encouraging transition message from Q&A to structured learning for topic "${topic}".

Conversation so far: ${conversationSummary}

Learner Profile:
- Learning Style: ${learnerProfile.learningStyle}
- Pace: ${learnerProfile.learningPace}
- Motivation: ${learnerProfile.motivationLevel}

The message should:
1. Acknowledge what they've learned in Q&A
2. Explain why structured learning will help
3. Set expectations for the learning path
4. Build excitement
5. Be 2-3 sentences max

Example: "Great questions! I can see you're ready to dive deeper. Let me give you a structured lesson on [topic] that builds on what you've learned. We'll go through it step-by-step, and you can ask questions anytime."

Generate the transition message:`;

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    return "Great! Let's move to a structured lesson where I can teach you this comprehensively.";
  }

  return content.text.trim();
}

/**
 * Generate smooth transition message from learning to Q&A
 */
export async function generateTransitionToQA(
  question: string,
  currentLesson: string,
  learnerProfile: LearnerProfile
): Promise<string> {
  const prompt = `Generate a smooth transition message that answers a question asked DURING a learning path.

Current Lesson: ${currentLesson}
User's Question: ${question}

The message should:
1. Answer their question directly
2. Connect the answer to the current lesson
3. Offer to continue the lesson
4. Be conversational and supportive
5. Be 2-3 sentences max

Example: "Great question! [Answer]. This connects to what we're learning about [concept]. Ready to continue with the next section?"

Generate the transition message:`;

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    return "Good question! Let me answer that and then we'll continue with the lesson.";
  }

  return content.text.trim();
}

/**
 * Handle question during learning path
 */
export async function handleInPathQuestion(
  question: string,
  currentLesson: string,
  currentConcept: string,
  learnerProfile: LearnerProfile
): Promise<{
  answer: string;
  relatedConcept: string;
  continueMessage: string;
}> {
  const prompt = `A learner asked this question DURING a lesson:

Question: "${question}"
Current Lesson: "${currentLesson}"
Current Concept: "${currentConcept}"
Learning Style: ${learnerProfile.learningStyle}

Provide:
1. A direct, clear answer to their question
2. How it relates to the current concept
3. A message to continue the lesson

Return JSON:
{
  "answer": "Direct answer to the question",
  "relatedConcept": "How this connects to current learning",
  "continueMessage": "Ready to continue? [next section]"
}`;

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 800,
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
      answer: "That's a great question! Let me clarify that for you.",
      relatedConcept: "This connects to what we're learning.",
      continueMessage: "Ready to continue with the next section?",
    };
  }

  try {
    return JSON.parse(content.text);
  } catch (e) {
    return {
      answer: content.text,
      relatedConcept: "This connects to our current topic.",
      continueMessage: "Ready to continue?",
    };
  }
}

/**
 * Detect misconception from answer and generate correction
 */
export async function detectAndCorrectMisconception(
  question: string,
  userAnswer: string,
  correctAnswer: string,
  concept: string,
  learnerProfile: LearnerProfile
): Promise<{
  misconceptionDetected: boolean;
  misconception: string;
  correction: string;
  explanation: string;
  followUpQuestion: string;
}> {
  const prompt = `Analyze this quiz answer for misconceptions:

Question: "${question}"
User's Answer: "${userAnswer}"
Correct Answer: "${correctAnswer}"
Concept: "${concept}"
Learning Style: ${learnerProfile.learningStyle}

Determine:
1. Is there a misconception? (yes/no)
2. What is the misconception? (if any)
3. What's the correct understanding?
4. Why is the user's answer wrong?
5. Generate a follow-up question to verify understanding

Return JSON:
{
  "misconceptionDetected": true/false,
  "misconception": "What the learner incorrectly believes",
  "correction": "The correct understanding",
  "explanation": "Why the misconception is wrong and the correction is right (use ${learnerProfile.learningStyle} style)",
  "followUpQuestion": "Question to verify they understand now"
}`;

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 800,
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
      misconceptionDetected: false,
      misconception: "",
      correction: "",
      explanation: "",
      followUpQuestion: "",
    };
  }

  try {
    return JSON.parse(content.text);
  } catch (e) {
    console.error("Failed to parse misconception detection:", content.text);
    return {
      misconceptionDetected: false,
      misconception: "",
      correction: "",
      explanation: "",
      followUpQuestion: "",
    };
  }
}

/**
 * Generate next recommended learning path
 */
export async function generateNextLearningPath(
  currentTopic: string,
  masteryLevel: number,
  learnerProfile: LearnerProfile
): Promise<{
  nextTopic: string;
  reason: string;
  difficulty: string;
  estimatedTime: number;
  prerequisites: string[];
}> {
  const prompt = `Based on learner progress, recommend the next learning topic.

Current Topic: "${currentTopic}"
Mastery Level: ${masteryLevel}%
Learning Style: ${learnerProfile.learningStyle}
Learning Pace: ${learnerProfile.learningPace}
Motivation: ${learnerProfile.motivationLevel}

Recommend:
1. Next topic to learn
2. Why this topic is recommended
3. Difficulty level (beginner/intermediate/advanced)
4. Estimated time
5. Any prerequisites needed

Return JSON:
{
  "nextTopic": "Topic name",
  "reason": "Why this is recommended",
  "difficulty": "intermediate",
  "estimatedTime": 45,
  "prerequisites": ["Prerequisite 1"]
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
      nextTopic: "Next Topic",
      reason: "Continue your learning journey",
      difficulty: "intermediate",
      estimatedTime: 30,
      prerequisites: [],
    };
  }

  try {
    return JSON.parse(content.text);
  } catch (e) {
    return {
      nextTopic: "Next Topic",
      reason: "Continue your learning journey",
      difficulty: "intermediate",
      estimatedTime: 30,
      prerequisites: [],
    };
  }
}

/**
 * Generate encouragement message based on progress
 */
export async function generateEncouragement(
  topic: string,
  masteryLevel: number,
  learnerProfile: LearnerProfile,
  milestone?: string
): Promise<string> {
  const prompt = `Generate an encouraging, personalized message for a learner.

Topic: "${topic}"
Mastery Level: ${masteryLevel}%
Learning Style: ${learnerProfile.learningStyle}
Motivation: ${learnerProfile.motivationLevel}
${milestone ? `Milestone: ${milestone}` : ""}

The message should:
1. Celebrate their progress
2. Be specific to their mastery level
3. Build confidence
4. Motivate them to continue
5. Be warm and genuine
6. Be 1-2 sentences max

${
  masteryLevel >= 80
    ? "They're doing great - celebrate mastery!"
    : masteryLevel >= 60
      ? "They're making good progress - encourage them!"
      : "They're just starting - be supportive and encouraging!"
}

Generate the message:`;

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
    return "Great job! You're making progress!";
  }

  return content.text.trim();
}
