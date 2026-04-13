import Anthropic from "@anthropic-ai/sdk";

export interface VideoLessonPlan {
  topic: string;
  level: 1 | 2 | 3 | 4 | 5;
  videoScript: string;
  scenes: VideoScene[];
  estimatedDuration: number; // minutes
  keyFrames: string[]; // Key visual moments
  animations: string[]; // Animation types needed
  voiceoverNotes?: string;
  subtitles?: string[];
}

export interface VideoScene {
  id: string;
  title: string;
  description: string;
  duration: number; // seconds
  animation: string; // Lottie animation type
  visualConcepts: string[];
  voiceover: string;
  keyPoint?: string;
}

export interface VideoGenerationRequest {
  topic: string;
  level: 1 | 2 | 3 | 4 | 5;
  keyPoints: string[];
  examples: string[];
  estimatedDuration: number;
  style?: "educational" | "entertaining" | "professional";
}

export class VideoIntegrationService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic();
  }

  /**
   * Generate video lesson plan for a specific level
   */
  async generateVideoLessonPlan(
    request: VideoGenerationRequest
  ): Promise<VideoLessonPlan> {
    const systemPrompt = `You are an expert video content designer for educational content. Create a detailed video lesson plan with:
1. Clear video script (narration)
2. Scene-by-scene breakdown
3. Animation suggestions
4. Visual concepts to illustrate
5. Timing for each scene

The video should be engaging, clear, and appropriate for the level.

Respond with JSON only.`;

    const styleNote = request.style
      ? `\nStyle: ${request.style}`
      : "\nStyle: educational";

    const message = await this.client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Generate video lesson plan for:
Topic: ${request.topic}
Level: ${request.level}
Duration: ${request.estimatedDuration} minutes
Key Points: ${request.keyPoints.join(", ")}
Examples: ${request.examples.join(", ")}${styleNote}

Return JSON with: videoScript, scenes (array with id, title, description, duration, animation, visualConcepts, voiceover, keyPoint), keyFrames (array), animations (array), estimatedDuration, voiceoverNotes, subtitles (array)`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    try {
      const plan = JSON.parse(responseText) as Omit<
        VideoLessonPlan,
        "topic" | "level"
      >;

      return {
        topic: request.topic,
        level: request.level,
        ...plan,
      };
    } catch (e) {
      // Fallback to default plan
      return this.generateDefaultVideoLessonPlan(request);
    }
  }

  /**
   * Generate default video lesson plan
   */
  private generateDefaultVideoLessonPlan(
    request: VideoGenerationRequest
  ): VideoLessonPlan {
    const sceneCount = Math.ceil(request.estimatedDuration / 2); // ~2 min per scene
    const scenes: VideoScene[] = [];

    // Scene 1: Introduction
    scenes.push({
      id: "scene-1",
      title: "Introduction",
      description: `What is ${request.topic}?`,
      duration: 30,
      animation: "fade_in",
      visualConcepts: ["title", "topic_overview"],
      voiceover: `Welcome to this lesson on ${request.topic}. Today we'll explore the key concepts and applications.`,
      keyPoint: "Topic introduction",
    });

    // Scene 2-N: Key points
    for (let i = 0; i < Math.min(request.keyPoints.length, sceneCount - 2); i++) {
      scenes.push({
        id: `scene-${i + 2}`,
        title: request.keyPoints[i],
        description: `Explaining ${request.keyPoints[i]}`,
        duration: 60,
        animation: "slide_in",
        visualConcepts: [request.keyPoints[i], "diagram", "example"],
        voiceover: `${request.keyPoints[i]} is a fundamental concept in ${request.topic}.`,
        keyPoint: request.keyPoints[i],
      });
    }

    // Final scene: Conclusion
    scenes.push({
      id: `scene-${sceneCount}`,
      title: "Summary",
      description: "Recap and next steps",
      duration: 30,
      animation: "fade_out",
      visualConcepts: ["summary", "key_takeaways"],
      voiceover: `That's a quick overview of ${request.topic}. Keep learning!`,
      keyPoint: "Summary",
    });

    return {
      topic: request.topic,
      level: request.level,
      videoScript: `# ${request.topic} - Level ${request.level} Video\n\nThis video covers the essential concepts of ${request.topic}.`,
      scenes,
      estimatedDuration: request.estimatedDuration,
      keyFrames: request.keyPoints.slice(0, 3),
      animations: [
        "fade_in",
        "slide_in",
        "bounce",
        "highlight",
        "fade_out",
      ],
      voiceoverNotes: "Clear, engaging narration at natural pace",
      subtitles: scenes.map((s) => s.voiceover),
    };
  }

  /**
   * Generate Lottie animation JSON for a concept
   */
  async generateLottieAnimation(
    concept: string,
    animationType: string
  ): Promise<Record<string, any>> {
    // This would call the existing video-generator service
    // For now, return a placeholder structure
    return {
      v: "5.12.2",
      fr: 30,
      ip: 0,
      op: 120,
      w: 400,
      h: 400,
      nm: concept,
      ddd: 0,
      assets: [],
      layers: [
        {
          ddd: 0,
          ind: 1,
          ty: 4,
          nm: concept,
          sr: 1,
          ks: {
            o: { a: 0, k: 100 },
            r: { a: 0, k: 0 },
            p: { a: 0, k: [200, 200, 0] },
            a: { a: 0, k: [0, 0, 0] },
            s: { a: 0, k: [100, 100, 100] },
          },
          ao: 0,
          shapes: [],
          ip: 0,
          op: 120,
          st: 0,
          bm: 0,
        },
      ],
    };
  }

  /**
   * Connect video to lesson content
   */
  async integrateVideoWithContent(
    topic: string,
    level: 1 | 2 | 3 | 4 | 5,
    videoLessonPlan: VideoLessonPlan,
    textContent: string
  ): Promise<{
    videoUrl?: string;
    videoScript: string;
    scenes: VideoScene[];
    integratedContent: string;
    videoPlacement: "intro" | "throughout" | "conclusion";
  }> {
    // Determine best video placement based on content length
    let videoPlacement: "intro" | "throughout" | "conclusion" = "throughout";
    if (textContent.length < 500) {
      videoPlacement = "intro";
    } else if (textContent.length > 2000) {
      videoPlacement = "throughout";
    } else {
      videoPlacement = "conclusion";
    }

    // Create integrated content with video markers
    const integratedContent = this.createIntegratedContent(
      textContent,
      videoLessonPlan,
      videoPlacement
    );

    return {
      videoScript: videoLessonPlan.videoScript,
      scenes: videoLessonPlan.scenes,
      integratedContent,
      videoPlacement,
    };
  }

  /**
   * Create content with video integration markers
   */
  private createIntegratedContent(
    textContent: string,
    videoLessonPlan: VideoLessonPlan,
    placement: "intro" | "throughout" | "conclusion"
  ): string {
    let result = "";

    if (placement === "intro") {
      result += `\n[VIDEO: ${videoLessonPlan.topic} - Level ${videoLessonPlan.level}]\n`;
      result += `Duration: ${videoLessonPlan.estimatedDuration} minutes\n\n`;
      result += textContent;
    } else if (placement === "conclusion") {
      result += textContent;
      result += `\n\n[VIDEO SUMMARY: ${videoLessonPlan.topic}]\n`;
      result += `Duration: ${videoLessonPlan.estimatedDuration} minutes\n`;
    } else {
      // Throughout: insert video at key points
      const paragraphs = textContent.split("\n\n");
      const videosPerContent = Math.max(
        1,
        Math.floor(paragraphs.length / videoLessonPlan.scenes.length)
      );

      let sceneIndex = 0;
      for (let i = 0; i < paragraphs.length; i++) {
        result += paragraphs[i] + "\n\n";

        if (
          i > 0 &&
          i % videosPerContent === 0 &&
          sceneIndex < videoLessonPlan.scenes.length
        ) {
          const scene = videoLessonPlan.scenes[sceneIndex];
          result += `[VIDEO SCENE: ${scene.title}]\n`;
          result += `${scene.description}\n\n`;
          sceneIndex++;
        }
      }
    }

    return result;
  }

  /**
   * Generate video metadata for player
   */
  generateVideoMetadata(
    topic: string,
    level: 1 | 2 | 3 | 4 | 5,
    videoLessonPlan: VideoLessonPlan
  ): {
    title: string;
    description: string;
    duration: number;
    thumbnail?: string;
    chapters: Array<{ title: string; time: number }>;
    tags: string[];
  } {
    const levelNames = {
      1: "Foundation",
      2: "Understanding",
      3: "Application",
      4: "Deep Dive",
      5: "Mastery",
    };

    // Calculate chapter times
    let currentTime = 0;
    const chapters = videoLessonPlan.scenes.map((scene) => {
      const chapterTime = currentTime;
      currentTime += scene.duration;
      return {
        title: scene.title,
        time: chapterTime,
      };
    });

    return {
      title: `${topic} - ${levelNames[level]}`,
      description: `Learn ${topic} at the ${levelNames[level]} level. This video covers key concepts, examples, and applications.`,
      duration: videoLessonPlan.estimatedDuration * 60, // Convert to seconds
      chapters,
      tags: [
        topic.toLowerCase(),
        levelNames[level].toLowerCase(),
        "educational",
        "learning",
      ],
    };
  }

  /**
   * Suggest video length based on level
   */
  suggestVideoDuration(level: 1 | 2 | 3 | 4 | 5): number {
    const durations = {
      1: 5, // 5 minutes for foundation
      2: 10, // 10 minutes for understanding
      3: 15, // 15 minutes for application
      4: 20, // 20 minutes for deep dive
      5: 30, // 30 minutes for mastery
    };
    return durations[level];
  }
}

export const videoIntegrationService = new VideoIntegrationService();
