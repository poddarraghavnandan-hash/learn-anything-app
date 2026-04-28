/**
 * Teaching Plan Generator
 * Creates structured lesson plans from extracted concepts
 * Scaffolds learning from simple to complex
 */

import { orchestrateLLM } from "../ai-orchestrator";
export interface LessonStep {
  stepNumber: number;
  title: string;
  learningObjective: string;
  keyInsight: string;
  visualMetaphor: string;
  exampleUseCase: string;
  estimatedTime: number; // minutes
  difficulty: "beginner" | "intermediate" | "advanced";
  concepts: string[];
  prerequisites: string[];
  quizQuestions: number;
}

export interface TeachingPlan {
  paperTitle: string;
  totalSteps: number;
  estimatedTotalTime: number; // minutes
  difficulty: "beginner" | "intermediate" | "advanced";
  steps: LessonStep[];
  learningOutcomes: string[];
  assessmentStrategy: string;
}

/**
 * Generate a teaching plan from concepts
 */
export async function generateTeachingPlan(
  paperTitle: string,
  concepts: string[],
  abstract: string,
  targetAudience: "beginner" | "intermediate" | "advanced" = "intermediate"
): Promise<TeachingPlan> {
  try {
    const conceptList = concepts.join(", ");

    const prompt = `You are an expert curriculum designer creating a learning path for a research paper.

Paper Title: ${paperTitle}
Key Concepts: ${conceptList}
Target Audience: ${targetAudience}

Abstract:
${abstract}

Design a 5-step learning path that:
1. Starts with foundational concepts
2. Progressively builds to complex ideas
3. Includes real-world applications
4. Ends with advanced extensions

For each step, provide:
- Clear title
- Learning objective (what students will be able to do)
- Key insight (the "aha" moment)
- Visual metaphor (analogy to help understanding)
- Real-world example or use case
- Estimated time (in minutes)
- Difficulty level
- Which concepts are covered
- Prerequisites from previous steps
- Number of quiz questions (2-4)

Also provide:
- 3-4 overall learning outcomes
- Assessment strategy

Return as JSON:
{
  "totalSteps": number,
  "estimatedTotalTime": number,
  "difficulty": "beginner|intermediate|advanced",
  "steps": [
    {
      "stepNumber": number,
      "title": "string",
      "learningObjective": "string",
      "keyInsight": "string",
      "visualMetaphor": "string",
      "exampleUseCase": "string",
      "estimatedTime": number,
      "difficulty": "string",
      "concepts": ["string"],
      "prerequisites": ["string"],
      "quizQuestions": number
    }
  ],
  "learningOutcomes": ["string"],
  "assessmentStrategy": "string"
}`;

    const message = await orchestrateLLM("content", {      maxTokens: 3000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.choices[0]?.message?.content as string || "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Failed to parse teaching plan response");
    }

    const planData = JSON.parse(jsonMatch[0]);

    return {
      paperTitle,
      totalSteps: planData.totalSteps,
      estimatedTotalTime: planData.estimatedTotalTime,
      difficulty: planData.difficulty,
      steps: planData.steps,
      learningOutcomes: planData.learningOutcomes,
      assessmentStrategy: planData.assessmentStrategy,
    };
  } catch (error) {
    console.error("Teaching plan generation error:", error);
    throw new Error("Failed to generate teaching plan");
  }
}

/**
 * Generate detailed content for a single lesson step
 */
export async function generateLessonContent(
  stepTitle: string,
  learningObjective: string,
  concepts: string[],
  paperContext: string
): Promise<{
  introduction: string;
  mainContent: string;
  keyPoints: string[];
  visualizationGuide: string;
  realWorldApplication: string;
  commonMisconceptions: string[];
  transitionToNext: string;
}> {
  try {
    const prompt = `Create detailed lesson content for a teaching step.

Step Title: ${stepTitle}
Learning Objective: ${learningObjective}
Concepts Covered: ${concepts.join(", ")}

Paper Context:
${paperContext}

Provide:
1. Introduction (hook the learner, 2-3 sentences)
2. Main content explanation (detailed, 4-5 sentences)
3. 3-4 key points to remember
4. Visualization guide (describe what should be animated/shown)
5. Real-world application (concrete example)
6. 2-3 common misconceptions
7. Transition to next step

Return as JSON:
{
  "introduction": "string",
  "mainContent": "string",
  "keyPoints": ["string"],
  "visualizationGuide": "string",
  "realWorldApplication": "string",
  "commonMisconceptions": ["string"],
  "transitionToNext": "string"
}`;

    const message = await orchestrateLLM("content", {      maxTokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.choices[0]?.message?.content as string || "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Failed to parse lesson content response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Lesson content generation error:", error);
    throw new Error("Failed to generate lesson content");
  }
}

/**
 * Generate storyboard for video animation
 */
export async function generateVideoStoryboard(
  lessonTitle: string,
  mainContent: string,
  keyPoints: string[],
  visualizationGuide: string
): Promise<
  Array<{
    sceneNumber: number;
    duration: number; // seconds
    description: string;
    animation: string;
    voiceover: string;
    visualElements: string[];
  }>
> {
  try {
    const prompt = `Create a video storyboard for an educational animation.

Lesson: ${lessonTitle}
Duration: 60-90 seconds total

Content to cover:
${mainContent}

Key Points:
${keyPoints.join("\n")}

Visualization Guide:
${visualizationGuide}

Break this into 4-6 scenes, each 15-20 seconds. For each scene:
- Scene number and duration
- What happens in this scene
- Type of animation (fade, slide, draw, morph, etc.)
- Voiceover script (concise, conversational)
- Visual elements to show (diagrams, equations, icons, etc.)

Return as JSON array:
[
  {
    "sceneNumber": number,
    "duration": number,
    "description": "string",
    "animation": "string",
    "voiceover": "string",
    "visualElements": ["string"]
  }
]`;

    const message = await orchestrateLLM("content", {      maxTokens: 2500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.choices[0]?.message?.content as string || "";
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      throw new Error("Failed to parse storyboard response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Storyboard generation error:", error);
    throw new Error("Failed to generate video storyboard");
  }
}

/**
 * Generate assessment questions for a lesson
 */
export async function generateLessonAssessment(
  stepTitle: string,
  learningObjective: string,
  keyPoints: string[]
): Promise<
  Array<{
    type: "multiple_choice" | "fill_blank" | "true_false" | "application";
    question: string;
    options?: string[];
    correctAnswer: string | number;
    explanation: string;
    difficulty: "easy" | "medium" | "hard";
  }>
> {
  try {
    const prompt = `Create assessment questions for a lesson.

Lesson: ${stepTitle}
Objective: ${learningObjective}
Key Points: ${keyPoints.join(", ")}

Generate 4 questions of different types:
1. Multiple choice (conceptual understanding)
2. Fill-in-the-blank (key terminology)
3. True/False (common misconceptions)
4. Application problem (real-world use)

For each question:
- Type
- Question text
- Options (if applicable)
- Correct answer
- Explanation of why it's correct
- Difficulty level

Return as JSON array:
[
  {
    "type": "string",
    "question": "string",
    "options": ["string"],
    "correctAnswer": "string|number",
    "explanation": "string",
    "difficulty": "easy|medium|hard"
  }
]`;

    const message = await orchestrateLLM("content", {      maxTokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.choices[0]?.message?.content as string || "";
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      throw new Error("Failed to parse assessment response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Assessment generation error:", error);
    throw new Error("Failed to generate assessment questions");
  }
}
