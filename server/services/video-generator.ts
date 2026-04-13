/**
 * Video Generation Service
 * Converts concept storyboards into animated Lottie videos
 */

export interface ConceptStoryboard {
  title: string;
  steps: StoryboardStep[];
  duration: number; // in seconds
}

export interface StoryboardStep {
  title: string;
  description: string;
  visualType: "text" | "diagram" | "equation" | "chart" | "animation";
  content: string;
  duration: number; // in seconds
  animations?: AnimationConfig[];
}

export interface AnimationConfig {
  type: "fade" | "slide" | "scale" | "rotate" | "bounce";
  duration: number;
  delay: number;
  easing?: string;
}

export interface GeneratedVideo {
  id: string;
  conceptId: string;
  title: string;
  duration: number;
  lottieJson: Record<string, any>;
  videoUrl?: string;
  thumbnailUrl?: string;
  createdAt: Date;
}

/**
 * Generate Lottie animation JSON from storyboard
 */
export function generateLottieAnimation(storyboard: ConceptStoryboard): Record<string, any> {
  const frames: any[] = [];
  let currentFrame = 0;
  const frameRate = 30;

  // Build animation frames from storyboard steps
  for (const step of storyboard.steps) {
    const stepFrames = Math.ceil(step.duration * frameRate);

    for (let i = 0; i < stepFrames; i++) {
      const progress = i / stepFrames;

      frames.push({
        index: currentFrame,
        step: step.title,
        progress,
        content: step.content,
        visualType: step.visualType,
        animations: step.animations?.map((anim) => ({
          ...anim,
          progress: Math.min(progress, 1),
        })),
      });

      currentFrame++;
    }
  }

  // Create Lottie JSON structure
  const lottieJson = {
    v: "5.5.7",
    fr: frameRate,
    ip: 0,
    op: currentFrame,
    w: 1080,
    h: 1920,
    nm: storyboard.title,
    ddd: 0,
    assets: [],
    layers: generateLayers(storyboard),
    markers: [],
  };

  return lottieJson;
}

/**
 * Generate Lottie layers from storyboard
 */
function generateLayers(storyboard: ConceptStoryboard): any[] {
  const layers: any[] = [];
  let startFrame = 0;

  for (const step of storyboard.steps) {
    const stepFrames = Math.ceil(step.duration * 30);

    // Add text layer
    if (step.visualType === "text" || step.visualType === "equation") {
      layers.push({
        ddd: 0,
        ind: layers.length,
        ty: 5, // Text layer
        nm: step.title,
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [540, 960, 0] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100, 100] },
        },
        ao: 0,
        t: {
          d: {
            k: [
              {
                s: {
                  sz: [1080, 1920],
                  ps: [0, 0],
                  h: "center",
                  v: "center",
                  fc: [0.2, 0.2, 0.2],
                  sc: false,
                  sw: 0,
                  t: step.content,
                  ca: 0,
                  lh: 1.2,
                  ls: 0,
                  fd: 0,
                },
                t: 0,
              },
            ],
          },
          p: {},
          m: { g: 1, a: { a: 0, k: [0, 0] } },
          a: [],
        },
        ip: startFrame,
        op: startFrame + stepFrames,
        st: startFrame,
      });
    }

    // Add shape layer for diagrams/charts
    if (step.visualType === "diagram" || step.visualType === "chart") {
      layers.push({
        ddd: 0,
        ind: layers.length,
        ty: 4, // Shape layer
        nm: step.title,
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [540, 960, 0] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100, 100] },
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              {
                ty: "rc",
                d: 1,
                s: { a: 0, k: [400, 300] },
                p: { a: 0, k: [0, 0] },
                r: { a: 0, k: 10 },
                nm: "Rectangle",
                mn: "ADBE Vector Shape - Rect",
              },
              {
                ty: "st",
                c: { a: 0, k: [0.2, 0.6, 0.9, 1] },
                o: { a: 0, k: 100 },
                w: { a: 0, k: 2 },
                lc: 1,
                lj: 1,
                ml: 4,
                nm: "Stroke",
                mn: "ADBE Vector Graphic - Stroke",
              },
              {
                ty: "fl",
                c: { a: 0, k: [0.2, 0.6, 0.9, 0.2] },
                o: { a: 0, k: 100 },
                nm: "Fill",
                mn: "ADBE Vector Graphic - Fill",
              },
            ],
            nm: "Shape",
            np: 3,
            cix: 2,
            bm: 0,
            ix: 1,
            mn: "ADBE Vector Group",
            hd: false,
          },
        ],
        ip: startFrame,
        op: startFrame + stepFrames,
        st: startFrame,
      });
    }

    startFrame += stepFrames;
  }

  return layers;
}

/**
 * Create video generation task
 */
export async function createVideoGenerationTask(
  conceptId: string,
  storyboard: ConceptStoryboard
): Promise<GeneratedVideo> {
  const lottieJson = generateLottieAnimation(storyboard);

  const video: GeneratedVideo = {
    id: `video-${Date.now()}`,
    conceptId,
    title: storyboard.title,
    duration: storyboard.duration,
    lottieJson,
    createdAt: new Date(),
  };

  return video;
}

/**
 * Render Lottie animation to video file (placeholder)
 * In production, this would use FFmpeg or similar to convert Lottie to video
 */
export async function renderLottieToVideo(
  lottieJson: Record<string, any>,
  outputPath: string
): Promise<string> {
  // TODO: Implement actual Lottie to video rendering
  // This would typically use:
  // - FFmpeg for video encoding
  // - Lottie Web for rendering frames
  // - Or a service like Remotion for React-based animation rendering

  console.log(`[VideoGenerator] Rendering Lottie animation to ${outputPath}`);
  console.log(`[VideoGenerator] Animation duration: ${lottieJson.op / lottieJson.fr}s`);

  // For now, return a placeholder URL
  return `file://${outputPath}/video.mp4`;
}
