import { orchestrateLLM } from "./ai-orchestrator";
import { Lesson, Unit, Topic, ContentSection, ConceptCheck, AssessmentQuestion } from "@/shared/curriculum";

export interface CurriculumRequest {
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  learnerBackground?: string;
  specificGoals?: string[];
}

export interface GeneratedCurriculum {
  topic: Topic;
  units: Unit[];
  lessons: Lesson[];
  assessments: AssessmentQuestion[];
  generatedAt: Date;
  modelUsed: string;
  tokensUsed: number;
}

/**
 * Generate a comprehensive curriculum using Claude
 */
export async function generateCurriculum(request: CurriculumRequest): Promise<GeneratedCurriculum> {
  console.log(`Generating curriculum for: ${request.topic} (${request.difficulty})`);

  // 1. Generate topic structure
  const topicStructure = await generateTopicStructure(request);

  // 2. Generate units
  const units = await Promise.all(
    topicStructure.units.map((u) => generateUnit(u, request))
  );

  // 3. Generate lessons
  const lessons: Lesson[] = [];
  for (const unit of units) {
    for (const lessonOutline of unit.lessons) {
      const fullLesson = await generateLesson(lessonOutline, request);
      lessons.push(fullLesson);
    }
  }

  // 4. Generate assessments
  const assessments = await generateAssessments(lessons, request);

  return {
    topic: topicStructure,
    units,
    lessons,
    assessments,
    generatedAt: new Date(),
    modelUsed: "claude-3-5-sonnet",
    tokensUsed: 0, // Would track actual token usage
  };
}

/**
 * Generate topic structure (units and lessons outline)
 */
async function generateTopicStructure(request: CurriculumRequest): Promise<Topic> {
  const prompt = `Generate a comprehensive learning curriculum structure for "${request.topic}" at ${request.difficulty} level.

${request.learnerBackground ? `Learner Background: ${request.learnerBackground}` : ""}
${request.specificGoals?.length ? `Learning Goals: ${request.specificGoals.join(", ")}` : ""}

Create 3-5 units, each with 3-5 lessons. Each unit should build on previous knowledge.

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "title": "Topic Title",
  "slug": "topic-slug",
  "description": "Comprehensive description",
  "difficulty": "${request.difficulty}",
  "estimatedHours": ${request.estimatedHours},
  "units": [
    {
      "title": "Unit Title",
      "description": "Unit description",
      "sequenceNumber": 1,
      "lessons": [
        {
          "title": "Lesson Title",
          "description": "Lesson description",
          "estimatedMinutes": 30,
          "sequenceNumber": 1
        }
      ]
    }
  ]
}`;

  const response = await orchestrateLLM("content", {    maxTokens: 2000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const contentText = (response.choices[0]?.message?.content as string) || "";

  try {
    const structure = JSON.parse(contentText);
    return {
      id: `topic-${Date.now()}`,
      ...structure,
    };
  } catch (e) {
    console.error("Failed to parse topic structure:", contentText);
    throw new Error("Failed to generate topic structure");
  }
}

/**
 * Generate a complete unit with all lessons
 */
async function generateUnit(unitOutline: any, request: CurriculumRequest): Promise<Unit> {
  return {
    id: `unit-${Date.now()}`,
    topicId: `topic-${Date.now()}`,
    title: unitOutline.title,
    description: unitOutline.description,
    sequenceNumber: unitOutline.sequenceNumber,
    lessons: unitOutline.lessons || [],
  };
}

/**
 * Generate a complete lesson with content, examples, and assessments
 */
async function generateLesson(lessonOutline: any, request: CurriculumRequest): Promise<Lesson> {
  const prompt = `Generate a comprehensive, in-depth lesson on "${lessonOutline.title}" for ${request.difficulty} learners.

This lesson should take approximately ${lessonOutline.estimatedMinutes} minutes to complete.

Create a lesson with SUBSTANTIVE DEPTH - not surface-level facts. Include:

1. Learning Objectives (5-7 specific, measurable objectives using Bloom's taxonomy)
2. Prerequisites (list 2-3 topics that should be learned first)
3. Intuitive Explanation (200-300 words using analogies and everyday examples)
4. Formal Explanation (300-400 words with technical depth and reasoning)
5. Mathematical/Technical Treatment (if applicable, with key equations or concepts)
6. Worked Examples (3-5 detailed examples with step-by-step solutions)
7. Real-World Applications (2-3 practical, concrete examples)
8. Common Misconceptions (5+ misconceptions with corrections and explanations)
9. Concept Checks (3-4 formative assessment questions to check understanding)

Ensure the content is:
- Accurate and well-researched
- Substantive and deep, not superficial
- Accessible to the target audience
- Engaging with relevant examples
- Logically organized and coherent

Return ONLY valid JSON (no markdown, no code blocks) with this structure:
{
  "title": "Lesson Title",
  "description": "Brief description",
  "objectives": [
    {"text": "Objective 1", "bloomLevel": "understand"},
    {"text": "Objective 2", "bloomLevel": "apply"}
  ],
  "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
  "contentSections": [
    {
      "type": "intuition",
      "title": "Intuitive Understanding",
      "content": "Content here..."
    },
    {
      "type": "explanation",
      "title": "Formal Explanation",
      "content": "Content here..."
    }
  ],
  "misconceptions": [
    {
      "incorrect": "Common wrong idea",
      "correct": "Correct understanding",
      "explanation": "Why the correction matters"
    }
  ],
  "conceptChecks": [
    {
      "question": "Question?",
      "type": "multiple-choice",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}`;

  const response = await orchestrateLLM("content", {    maxTokens: 4000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const contentText = (response.choices[0]?.message?.content as string) || "";

  try {
    const lessonData = JSON.parse(contentText);
    return {
      id: `lesson-${Date.now()}`,
      unitId: `unit-${Date.now()}`,
      title: lessonData.title,
      description: lessonData.description,
      estimatedMinutes: lessonOutline.estimatedMinutes || 30,
      sequenceNumber: lessonOutline.sequenceNumber || 1,
      objectives: lessonData.objectives || [],
      prerequisites: lessonData.prerequisites || [],
      contentSections: lessonData.contentSections || [],
      misconceptions: lessonData.misconceptions || [],
      conceptChecks: lessonData.conceptChecks || [],
      assessmentQuestions: [],
      masteryThreshold: 80,
      reviewSchedule: [1, 3, 7, 14, 30],
    };
  } catch (e) {
    console.error("Failed to parse lesson:", contentText);
    throw new Error("Failed to generate lesson");
  }
}

/**
 * Generate assessment questions for lessons
 */
async function generateAssessments(
  lessons: Lesson[],
  request: CurriculumRequest
): Promise<AssessmentQuestion[]> {
  const assessments: AssessmentQuestion[] = [];

  for (const lesson of lessons) {
    const prompt = `Generate 10 comprehensive assessment questions for the lesson "${lesson.title}".

The lesson covers these objectives:
${lesson.objectives.map((o) => `- ${o.text} (${o.bloomLevel})`).join("\n")}

Create questions that:
1. Test real understanding, not just memorization
2. Progress in difficulty (easy to hard)
3. Cover different Bloom's taxonomy levels
4. Include common misconceptions
5. Require application and synthesis, not just recall

Include:
- 2 recall questions (Bloom's "Remember")
- 2 comprehension questions (Bloom's "Understand")
- 2 application questions (Bloom's "Apply")
- 2 analysis questions (Bloom's "Analyze")
- 1 synthesis question (Bloom's "Create")
- 1 evaluation question (Bloom's "Evaluate")

Return ONLY valid JSON (no markdown) with this structure:
{
  "questions": [
    {
      "question": "Question text?",
      "type": "multiple-choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct and others are wrong",
      "difficulty": 1,
      "bloomLevel": "remember"
    }
  ]
}`;

    const response = await orchestrateLLM("content", {      maxTokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const contentText = (response.choices[0]?.message?.content as string) || "";

    try {
      const data = JSON.parse(contentText);
      assessments.push(
        ...data.questions.map((q: any) => ({
          id: `q-${Date.now()}-${Math.random()}`,
          ...q,
        }))
      );
    } catch (e) {
      console.error("Failed to parse assessments:", contentText);
    }
  }

  return assessments;
}

/**
 * Generate adaptive difficulty content
 */
export async function generateAdaptiveContent(
  lesson: Lesson,
  difficulty: "easy" | "medium" | "hard"
): Promise<ContentSection[]> {
  const difficultyDescriptions = {
    easy: "Simplify for beginners: use more analogies, fewer technical details, simpler examples",
    medium: "Balanced approach: mix intuition with some technical depth",
    hard: "Advanced treatment: mathematical rigor, complex examples, research-level content",
  };

  const prompt = `Regenerate the content for the lesson "${lesson.title}" with ${difficulty} difficulty.

${difficultyDescriptions[difficulty]}

Return ONLY valid JSON with content sections:
{
  "sections": [
    {
      "type": "intuition",
      "title": "Title",
      "content": "Content..."
    }
  ]
}`;

  const response = await orchestrateLLM("content", {    maxTokens: 2000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const contentText = (response.choices[0]?.message?.content as string) || "";

  try {
    const data = JSON.parse(contentText);
    return data.sections || [];
  } catch (e) {
    console.error("Failed to parse adaptive content:", contentText);
    return [];
  }
}
