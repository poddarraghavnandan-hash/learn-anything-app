/**
 * Adaptive Content Generator for Learning Ladder
 * Generates progressively complex content for each of the 5 levels
 * Uses Claude API to create level-specific learning material
 * Adapts content based on user sophistication and detected knowledge level
 */

import Anthropic from "@anthropic-ai/sdk";

export interface LevelContentRequest {
  concept: string;
  level: 1 | 2 | 3 | 4 | 5;
  userBackground?: string; // User's prior knowledge
  learningStyle?: string; // visual, auditory, kinesthetic, reading
  difficulty?: "beginner" | "intermediate" | "advanced";
}

export interface LevelContent {
  level: 1 | 2 | 3 | 4 | 5;
  title: string;
  description: string;
  mainContent: string;
  examples: string[];
  keyPoints: string[];
  estimatedTime: number; // minutes
  quizzes: QuizQuestion[];
  discussionPrompts: string[];
  practiceProblems: string[];
  visualStoryboard: {
    scenes: Array<{
      title: string;
      description: string;
      animation: string; // Lottie animation type
    }>;
  };
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

/**
 * Level Definitions and Prompts
 */
const LEVEL_DEFINITIONS = {
  1: {
    name: "Foundation",
    tagline: "What is it?",
    description: "Basic definitions, core concepts, and foundational understanding",
    estimatedTime: 30,
    contentFocus: "definitions, basic concepts, simple examples",
    quizDifficulty: 1,
  },
  2: {
    name: "Understanding",
    tagline: "How does it work?",
    description: "Mechanisms, principles, and how concepts relate to each other",
    estimatedTime: 45,
    contentFocus: "mechanisms, principles, relationships, cause-and-effect",
    quizDifficulty: 2,
  },
  3: {
    name: "Application",
    tagline: "Where is it used?",
    description: "Real-world applications, case studies, and practical use cases",
    estimatedTime: 45,
    contentFocus: "real-world applications, case studies, practical examples, industry use",
    quizDifficulty: 3,
  },
  4: {
    name: "Deep Dive",
    tagline: "Why does it work?",
    description: "Advanced theory, mathematics, physics, and underlying principles",
    estimatedTime: 60,
    contentFocus: "advanced theory, mathematics, physics, research, cutting-edge developments",
    quizDifficulty: 4,
  },
  5: {
    name: "Mastery",
    tagline: "Can you teach it?",
    description: "Create content, solve complex problems, research, and innovation",
    estimatedTime: 90,
    contentFocus: "research, innovation, problem-solving, content creation, teaching others",
    quizDifficulty: 5,
  },
};

const client = new Anthropic();

/**
 * Generate content for a specific level using Claude
 */
export async function generateLevelContent(
  request: LevelContentRequest,
  _claudeApiKey?: string // Claude API key is read from environment
): Promise<LevelContent> {
  const levelDef = LEVEL_DEFINITIONS[request.level];

  // Build prompt for Claude
  const prompt = buildLevelPrompt(request, levelDef);

  // Call Claude API
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Parse JSON response
  let contentData;
  try {
    contentData = JSON.parse(responseText);
  } catch (e) {
    // Fallback to template if parsing fails
    contentData = {
      mainContent: `Content for ${request.concept} at ${levelDef.name} level`,
      examples: generateExamples(request.concept, request.level),
      keyPoints: generateKeyPoints(request.concept, request.level),
      quizzes: generateQuizzes(request.concept, request.level, 3),
      discussionPrompts: generateDiscussionPrompts(request.concept, request.level),
      practiceProblems: generatePracticeProblems(request.concept, request.level),
      storyboardScenes: generateStoryboard(request.concept, request.level).scenes,
    };
  }

  return {
    level: request.level,
    title: `${levelDef.name}: ${levelDef.tagline}`,
    description: levelDef.description,
    mainContent: contentData.mainContent || `Content for ${request.concept}`,
    examples: contentData.examples || generateExamples(request.concept, request.level),
    keyPoints: contentData.keyPoints || generateKeyPoints(request.concept, request.level),
    estimatedTime: levelDef.estimatedTime,
    quizzes: (contentData.quizzes || []).map((q: any) => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: request.level,
    })),
    discussionPrompts: contentData.discussionPrompts || generateDiscussionPrompts(request.concept, request.level),
    practiceProblems: contentData.practiceProblems || generatePracticeProblems(request.concept, request.level),
    visualStoryboard: {
      scenes: contentData.storyboardScenes || generateStoryboard(request.concept, request.level).scenes,
    },
  };
}

/**
 * Adapt content based on user sophistication score
 */
export async function adaptContentToSophistication(
  request: LevelContentRequest,
  sophisticationScore: number
): Promise<LevelContentRequest> {
  // If sophistication is very high (>85), elevate to higher level
  if (sophisticationScore > 85 && request.level < 5) {
    return {
      ...request,
      level: (request.level + 1) as 1 | 2 | 3 | 4 | 5,
    };
  }

  // If sophistication is very low (<30), simplify to lower level
  if (sophisticationScore < 30 && request.level > 1) {
    return {
      ...request,
      level: (request.level - 1) as 1 | 2 | 3 | 4 | 5,
    };
  }

  return request;
}

/**
 * Generate simplified explanation for a concept
 */
export async function simplifyContent(
  content: string,
  targetLevel: "eli5" | "simple" | "intermediate" | "advanced"
): Promise<string> {
  const levelGuides = {
    eli5: "Explain as if to a 5-year-old. Use simple words, short sentences, everyday examples.",
    simple: "Explain simply. Use basic vocabulary, clear structure, concrete examples.",
    intermediate: "Explain clearly with some technical terms. Assume basic knowledge.",
    advanced: "Explain with technical depth. Assume prior knowledge of fundamentals.",
  };

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `${levelGuides[targetLevel]}\n\nContent to simplify:\n${content}`,
      },
    ],
  });

  return message.content[0].type === "text" ? message.content[0].text : "";
}

/**
 * Build Gemini prompt for level-specific content
 */
function buildLevelPrompt(request: LevelContentRequest, levelDef: any): string {
  const userContext = request.userBackground
    ? `User's background: ${request.userBackground}`
    : "Assume beginner level";

  const learningStyleNote = request.learningStyle
    ? `User's learning style: ${request.learningStyle}`
    : "";

  return `
Generate comprehensive learning content for the following:

Concept: ${request.concept}
Level: ${levelDef.name} (${levelDef.tagline})
Description: ${levelDef.description}
Content Focus: ${levelDef.contentFocus}
Estimated Time: ${levelDef.estimatedTime} minutes

${userContext}
${learningStyleNote}

Please provide:
1. Main content (2-3 paragraphs)
2. 3-4 real-world examples
3. 4-5 key points
4. 3 quiz questions with options and explanations
5. 2 discussion prompts
6. 2 practice problems
7. Visual storyboard suggestions (4-5 scenes)

Format as JSON with the following structure:
{
  "mainContent": "...",
  "examples": ["...", "..."],
  "keyPoints": ["...", "..."],
  "quizzes": [
    {
      "question": "...",
      "options": ["...", "..."],
      "correctAnswer": 0,
      "explanation": "..."
    }
  ],
  "discussionPrompts": ["...", "..."],
  "practiceProblems": ["...", "..."],
  "storyboardScenes": [
    {
      "title": "...",
      "description": "...",
      "animation": "..."
    }
  ]
}
`;
}

/**
 * Generate examples for a concept at a specific level
 */
function generateExamples(concept: string, level: number): string[] {
  const examplesByLevel: Record<number, string[]> = {
    1: [
      `Simple, everyday example of ${concept}`,
      `Basic illustration of ${concept}`,
      `Common scenario involving ${concept}`,
      `Introductory case of ${concept}`,
    ],
    2: [
      `How ${concept} works in practice`,
      `Mechanism of ${concept} explained`,
      `Step-by-step process of ${concept}`,
      `Related concepts that connect to ${concept}`,
    ],
    3: [
      `Industry application of ${concept}`,
      `Real-world case study using ${concept}`,
      `Business use case for ${concept}`,
      `Problem solved by ${concept}`,
    ],
    4: [
      `Mathematical model of ${concept}`,
      `Physics principles behind ${concept}`,
      `Advanced theory of ${concept}`,
      `Research findings on ${concept}`,
    ],
    5: [
      `Cutting-edge research on ${concept}`,
      `Innovation extending ${concept}`,
      `Teaching others about ${concept}`,
      `Solving complex problems with ${concept}`,
    ],
  };

  return examplesByLevel[level] || examplesByLevel[1];
}

/**
 * Generate key points for a concept at a specific level
 */
function generateKeyPoints(concept: string, level: number): string[] {
  const pointsByLevel: Record<number, string[]> = {
    1: [
      `Definition of ${concept}`,
      `Basic characteristics of ${concept}`,
      `Why ${concept} matters`,
      `Common misconceptions about ${concept}`,
      `How ${concept} relates to everyday life`,
    ],
    2: [
      `How ${concept} works`,
      `Key mechanisms in ${concept}`,
      `Relationships between components of ${concept}`,
      `Cause and effect in ${concept}`,
      `Variations of ${concept}`,
    ],
    3: [
      `Applications of ${concept}`,
      `Industries using ${concept}`,
      `Benefits of ${concept}`,
      `Limitations of ${concept}`,
      `Future trends in ${concept}`,
    ],
    4: [
      `Mathematical foundations of ${concept}`,
      `Physics underlying ${concept}`,
      `Advanced principles of ${concept}`,
      `Research gaps in ${concept}`,
      `Theoretical extensions of ${concept}`,
    ],
    5: [
      `Frontier research in ${concept}`,
      `Emerging applications of ${concept}`,
      `Teaching strategies for ${concept}`,
      `Problem-solving with ${concept}`,
      `Innovation opportunities in ${concept}`,
    ],
  };

  return pointsByLevel[level] || pointsByLevel[1];
}

/**
 * Generate quiz questions for a concept at a specific level
 */
function generateQuizzes(concept: string, level: number, count: number = 3): QuizQuestion[] {
  const quizzes: QuizQuestion[] = [];

  for (let i = 0; i < count; i++) {
    quizzes.push({
      question: `Question about ${concept} at level ${level}`,
      options: [
        `Option 1 for ${concept}`,
        `Option 2 for ${concept}`,
        `Option 3 for ${concept}`,
        `Option 4 for ${concept}`,
      ],
      correctAnswer: Math.floor(Math.random() * 4),
      explanation: `Explanation for ${concept} question`,
      difficulty: (level as any),
    });
  }

  return quizzes;
}

/**
 * Generate discussion prompts for a concept at a specific level
 */
function generateDiscussionPrompts(concept: string, level: number): string[] {
  const promptsByLevel: Record<number, string[]> = {
    1: [
      `What does ${concept} mean to you?`,
      `Have you encountered ${concept} before?`,
      `Why do you think ${concept} is important?`,
    ],
    2: [
      `How do the components of ${concept} work together?`,
      `Can you explain ${concept} to someone else?`,
      `What would happen without ${concept}?`,
    ],
    3: [
      `Where have you seen ${concept} applied?`,
      `How would you use ${concept} in your field?`,
      `What are the benefits and drawbacks of ${concept}?`,
    ],
    4: [
      `What are the mathematical principles behind ${concept}?`,
      `How does ${concept} compare to alternative approaches?`,
      `What research questions remain about ${concept}?`,
    ],
    5: [
      `How would you teach ${concept} to others?`,
      `What innovations could extend ${concept}?`,
      `How can ${concept} solve real-world problems?`,
    ],
  };

  return promptsByLevel[level] || promptsByLevel[1];
}

/**
 * Generate practice problems for a concept at a specific level
 */
function generatePracticeProblems(concept: string, level: number): string[] {
  const problemsByLevel: Record<number, string[]> = {
    1: [
      `Identify ${concept} in a given scenario`,
      `Define ${concept} in your own words`,
    ],
    2: [
      `Explain how ${concept} works step-by-step`,
      `Compare ${concept} to a related concept`,
    ],
    3: [
      `Apply ${concept} to solve a real-world problem`,
      `Analyze a case study involving ${concept}`,
    ],
    4: [
      `Derive the mathematical model for ${concept}`,
      `Evaluate the theoretical foundations of ${concept}`,
    ],
    5: [
      `Design a solution using ${concept}`,
      `Conduct research on ${concept} and present findings`,
    ],
  };

  return problemsByLevel[level] || problemsByLevel[1];
}

/**
 * Generate visual storyboard for a concept at a specific level
 */
function generateStoryboard(concept: string, level: number) {
  const scenesByLevel: Record<number, any[]> = {
    1: [
      { title: "Introduction", description: `What is ${concept}?`, animation: "fade_in" },
      { title: "Definition", description: `Key definition of ${concept}`, animation: "slide_in" },
      { title: "Example", description: `Simple example of ${concept}`, animation: "bounce" },
      { title: "Summary", description: `Key takeaway about ${concept}`, animation: "fade_out" },
    ],
    2: [
      { title: "Overview", description: `${concept} overview`, animation: "fade_in" },
      { title: "Mechanism 1", description: `First mechanism`, animation: "slide_in" },
      { title: "Mechanism 2", description: `Second mechanism`, animation: "slide_in" },
      { title: "Integration", description: `How mechanisms work together`, animation: "morph" },
      { title: "Summary", description: `How ${concept} works`, animation: "fade_out" },
    ],
    3: [
      { title: "Application 1", description: `First real-world use`, animation: "fade_in" },
      { title: "Application 2", description: `Second real-world use`, animation: "slide_in" },
      { title: "Benefits", description: `Advantages of ${concept}`, animation: "highlight" },
      { title: "Impact", description: `Real-world impact`, animation: "scale" },
      { title: "Summary", description: `Applications of ${concept}`, animation: "fade_out" },
    ],
    4: [
      { title: "Theory", description: `Theoretical foundations`, animation: "fade_in" },
      { title: "Mathematics", description: `Mathematical model`, animation: "equation_animate" },
      { title: "Physics", description: `Physical principles`, animation: "particle_system" },
      { title: "Research", description: `Current research`, animation: "network" },
      { title: "Summary", description: `Deep understanding`, animation: "fade_out" },
    ],
    5: [
      { title: "Frontier", description: `Cutting-edge research`, animation: "fade_in" },
      { title: "Innovation", description: `New applications`, animation: "spark" },
      { title: "Teaching", description: `How to teach ${concept}`, animation: "mentor" },
      { title: "Problem Solving", description: `Solving complex problems`, animation: "puzzle" },
      { title: "Summary", description: `Mastery of ${concept}`, animation: "celebration" },
    ],
  };

  return {
    scenes: scenesByLevel[level] || scenesByLevel[1],
  };
}
