/**
 * Content Sources Integration Service
 * Integrates YouTube, educational databases, and curated learning paths
 * Fetches and caches real educational content for lessons
 */

import { invokeLLM } from "./_core/llm";

export interface ContentSource {
  id: string;
  type: "youtube" | "article" | "course" | "textbook" | "research";
  title: string;
  author: string;
  url: string;
  thumbnail?: string;
  duration?: number; // in minutes
  difficulty: "beginner" | "intermediate" | "advanced";
  relevanceScore: number; // 0-1
  quality: number; // 0-1 based on ratings, views, etc.
  topic: string;
  subtopics: string[];
  publishedDate?: string;
  viewCount?: number;
  rating?: number; // 0-5
}

export interface CuratedLearningPath {
  id: string;
  name: string;
  description: string;
  domain: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  sources: ContentSource[];
  prerequisites: string[];
  learningObjectives: string[];
  assessmentStrategy: string;
}

/**
 * Sample curated learning paths - in production would be in database
 */
export const CURATED_PATHS: CuratedLearningPath[] = [
  {
    id: "physics-101",
    name: "Physics Fundamentals",
    description: "Complete introduction to classical mechanics and motion",
    domain: "physics",
    difficulty: "beginner",
    estimatedHours: 8,
    prerequisites: [],
    learningObjectives: [
      "Understand Newton's laws of motion",
      "Apply kinematics equations",
      "Analyze forces and motion",
      "Solve real-world physics problems",
    ],
    assessmentStrategy: "Concept checks after each lesson, final mastery quiz",
    sources: [
      {
        id: "yt-physics-101",
        type: "youtube",
        title: "Physics Fundamentals: Motion and Forces",
        author: "Khan Academy",
        url: "https://www.youtube.com/watch?v=example1",
        thumbnail: "https://img.youtube.com/vi/example1/maxresdefault.jpg",
        duration: 45,
        difficulty: "beginner",
        relevanceScore: 0.95,
        quality: 0.98,
        topic: "Classical Mechanics",
        subtopics: ["Motion", "Forces", "Newton's Laws"],
        viewCount: 5000000,
        rating: 4.8,
      },
      {
        id: "article-forces",
        type: "article",
        title: "Understanding Forces: A Deep Dive",
        author: "Physics Today",
        url: "https://physicstoday.org/forces-explained",
        difficulty: "intermediate",
        relevanceScore: 0.88,
        quality: 0.92,
        topic: "Forces",
        subtopics: ["Newton's Laws", "Force Types", "Applications"],
        publishedDate: "2024-01-15",
        rating: 4.6,
      },
    ],
  },
  {
    id: "ml-basics",
    name: "Machine Learning Fundamentals",
    description: "Introduction to machine learning concepts and algorithms",
    domain: "computer-science",
    difficulty: "intermediate",
    estimatedHours: 12,
    prerequisites: ["math-linear-algebra", "python-basics"],
    learningObjectives: [
      "Understand supervised and unsupervised learning",
      "Implement basic ML algorithms",
      "Evaluate model performance",
      "Build end-to-end ML projects",
    ],
    assessmentStrategy: "Hands-on coding exercises, project-based assessment",
    sources: [
      {
        id: "course-ml-stanford",
        type: "course",
        title: "Machine Learning Specialization",
        author: "Andrew Ng, Stanford",
        url: "https://www.coursera.org/specializations/machine-learning",
        difficulty: "intermediate",
        relevanceScore: 0.98,
        quality: 0.99,
        topic: "Machine Learning",
        subtopics: ["Supervised Learning", "Neural Networks", "Deep Learning"],
        rating: 4.9,
      },
    ],
  },
];

/**
 * Mock YouTube search results - in production would use YouTube API
 */
export async function searchYouTubeContent(query: string, topic: string): Promise<ContentSource[]> {
  try {
    // In production, would call YouTube API with authentication
    // For now, return mock results that would be fetched from API
    const mockResults: ContentSource[] = [
      {
        id: `yt-${query.replace(/\s+/g, "-").toLowerCase()}`,
        type: "youtube",
        title: `${query} - Full Explanation`,
        author: "Educational Channel",
        url: `https://www.youtube.com/watch?v=mock${Math.random()}`,
        thumbnail: `https://img.youtube.com/vi/mock/maxresdefault.jpg`,
        duration: 25,
        difficulty: "beginner",
        relevanceScore: 0.85,
        quality: 0.8,
        topic: topic,
        subtopics: [query],
        viewCount: 1000000,
        rating: 4.5,
      },
      {
        id: `yt-${query.replace(/\s+/g, "-").toLowerCase()}-2`,
        type: "youtube",
        title: `${query} - Advanced Concepts`,
        author: "Advanced Learning",
        url: `https://www.youtube.com/watch?v=mock${Math.random()}`,
        thumbnail: `https://img.youtube.com/vi/mock2/maxresdefault.jpg`,
        duration: 45,
        difficulty: "intermediate",
        relevanceScore: 0.78,
        quality: 0.75,
        topic: topic,
        subtopics: [query, "Advanced"],
        viewCount: 500000,
        rating: 4.3,
      },
    ];

    return mockResults;
  } catch (error) {
    console.error("[ContentSources] YouTube search failed:", error);
    return [];
  }
}

/**
 * Search educational articles and papers
 */
export async function searchArticles(query: string, topic: string): Promise<ContentSource[]> {
  try {
    // In production, would search article databases (Medium, ArXiv, educational sites)
    const mockArticles: ContentSource[] = [
      {
        id: `article-${query.replace(/\s+/g, "-").toLowerCase()}`,
        type: "article",
        title: `${query}: Complete Guide`,
        author: "Educational Writer",
        url: `https://medium.com/learning/${query.replace(/\s+/g, "-").toLowerCase()}`,
        difficulty: "intermediate",
        relevanceScore: 0.82,
        quality: 0.85,
        topic: topic,
        subtopics: [query],
        publishedDate: new Date().toISOString(),
        rating: 4.4,
      },
    ];

    return mockArticles;
  } catch (error) {
    console.error("[ContentSources] Article search failed:", error);
    return [];
  }
}

/**
 * Get curated learning path by ID
 */
export function getCuratedPath(pathId: string): CuratedLearningPath | null {
  return CURATED_PATHS.find((p) => p.id === pathId) || null;
}

/**
 * Get all curated paths in a domain
 */
export function getCuratedPathsByDomain(domain: string): CuratedLearningPath[] {
  return CURATED_PATHS.filter((p) => p.domain === domain);
}

/**
 * Find best content sources for a concept using LLM
 */
export async function findBestContentSources(
  conceptName: string,
  topic: string,
  difficulty: "beginner" | "intermediate" | "advanced"
): Promise<ContentSource[]> {
  try {
    // Search for content
    const youtubeResults = await searchYouTubeContent(conceptName, topic);
    const articleResults = await searchArticles(conceptName, topic);

    // Combine and rank
    const allSources = [...youtubeResults, ...articleResults];

    // Filter by difficulty
    const filteredSources = allSources.filter((s) => {
      if (difficulty === "beginner") return s.difficulty === "beginner";
      if (difficulty === "intermediate") return ["beginner", "intermediate"].includes(s.difficulty);
      return true; // advanced gets all
    });

    // Sort by relevance and quality
    return filteredSources.sort((a, b) => {
      const scoreA = a.relevanceScore * 0.7 + a.quality * 0.3;
      const scoreB = b.relevanceScore * 0.7 + b.quality * 0.3;
      return scoreB - scoreA;
    });
  } catch (error) {
    console.error("[ContentSources] Failed to find best sources:", error);
    return [];
  }
}

/**
 * Enrich lesson with real content sources
 */
export async function enrichLessonWithContent(
  lessonTitle: string,
  topic: string,
  difficulty: "beginner" | "intermediate" | "advanced"
): Promise<{
  videoSources: ContentSource[];
  articleSources: ContentSource[];
  relatedCourses: ContentSource[];
}> {
  try {
    const sources = await findBestContentSources(lessonTitle, topic, difficulty);

    return {
      videoSources: sources.filter((s) => s.type === "youtube").slice(0, 3),
      articleSources: sources.filter((s) => s.type === "article").slice(0, 3),
      relatedCourses: sources.filter((s) => s.type === "course").slice(0, 2),
    };
  } catch (error) {
    console.error("[ContentSources] Failed to enrich lesson:", error);
    return {
      videoSources: [],
      articleSources: [],
      relatedCourses: [],
    };
  }
}

/**
 * Generate content recommendations using LLM
 */
export async function generateContentRecommendations(
  learnerInterests: string[],
  currentTopics: string[],
  difficulty: "beginner" | "intermediate" | "advanced"
): Promise<CuratedLearningPath[]> {
  try {
    const systemPrompt = `You are an expert in curriculum design and learning paths.
Given learner interests and current topics, recommend the best curated learning paths.
Consider difficulty level and learning progression.`;

    const userPrompt = `Learner interests: ${learnerInterests.join(", ")}
Current topics: ${currentTopics.join(", ")}
Difficulty level: ${difficulty}

Recommend 2-3 learning paths that would be most beneficial.
Format as JSON array with path IDs from: ${CURATED_PATHS.map((p) => p.id).join(", ")}

Return only valid JSON like:
["path-id-1", "path-id-2"]`;

    const result = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const response = result.choices[0]?.message.content || "";
    const responseText = typeof response === "string" ? response : "";

    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const pathIds = JSON.parse(jsonMatch[0]);
        return pathIds
          .map((id: string) => getCuratedPath(id))
          .filter((p: CuratedLearningPath | null) => p !== null);
      }
    } catch (parseError) {
      console.error("[ContentSources] Failed to parse recommendations:", parseError);
    }

    return [];
  } catch (error) {
    console.error("[ContentSources] Failed to generate recommendations:", error);
    return [];
  }
}

/**
 * Cache content sources locally
 */
export interface CachedContent {
  sourceId: string;
  data: ContentSource;
  cachedAt: number;
  expiresAt: number;
}

const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const contentCache = new Map<string, CachedContent>();

export function cacheContentSource(source: ContentSource): void {
  const now = Date.now();
  contentCache.set(source.id, {
    sourceId: source.id,
    data: source,
    cachedAt: now,
    expiresAt: now + CACHE_DURATION_MS,
  });
}

export function getCachedContent(sourceId: string): ContentSource | null {
  const cached = contentCache.get(sourceId);
  if (!cached) return null;

  if (cached.expiresAt < Date.now()) {
    contentCache.delete(sourceId);
    return null;
  }

  return cached.data;
}

export function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, value] of contentCache.entries()) {
    if (value.expiresAt < now) {
      contentCache.delete(key);
    }
  }
}
