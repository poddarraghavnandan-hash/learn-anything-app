import { captureSignal } from "./signal-observer";

/**
 * Middleware to capture signals from various user interactions
 * Handles: Ask/Chat questions, learning journey completions, content engagement
 */

export interface SignalCaptureContext {
  userId: number;
  conceptId?: number;
  source: "ask" | "journey" | "content" | "chat";
  metadata?: Record<string, any>;
}

/**
 * Capture a question signal from Ask/Chat
 */
export async function captureQuestionSignal(
  userId: number,
  question: string,
  conceptId?: number,
  metadata?: Record<string, any>
) {
  try {
    return await captureSignal({
      userId,
      signalType: "question",
      content: question,
      conceptId,
      metadata: {
        source: "ask",
        ...metadata,
      },
    });
  } catch (error) {
    console.error("[Signal] Failed to capture question signal:", error);
    return null;
  }
}

/**
 * Capture a connection signal when user relates concepts
 */
export async function captureConnectionSignal(
  userId: number,
  connection: string,
  conceptId?: number,
  relatedConceptId?: number,
  metadata?: Record<string, any>
) {
  try {
    return await captureSignal({
      userId,
      signalType: "connection",
      content: connection,
      conceptId,
      metadata: {
        source: "journey",
        relatedConceptId,
        ...metadata,
      },
    });
  } catch (error) {
    console.error("[Signal] Failed to capture connection signal:", error);
    return null;
  }
}

/**
 * Capture an application signal when user applies concept
 */
export async function captureApplicationSignal(
  userId: number,
  application: string,
  conceptId?: number,
  metadata?: Record<string, any>
) {
  try {
    return await captureSignal({
      userId,
      signalType: "application",
      content: application,
      conceptId,
      metadata: {
        source: "journey",
        ...metadata,
      },
    });
  } catch (error) {
    console.error("[Signal] Failed to capture application signal:", error);
    return null;
  }
}

/**
 * Capture a breakthrough signal when user has aha moment
 */
export async function captureBreakthroughSignal(
  userId: number,
  breakthrough: string,
  conceptId?: number,
  metadata?: Record<string, any>
) {
  try {
    return await captureSignal({
      userId,
      signalType: "breakthrough",
      content: breakthrough,
      conceptId,
      metadata: {
        source: "journey",
        ...metadata,
      },
    });
  } catch (error) {
    console.error("[Signal] Failed to capture breakthrough signal:", error);
    return null;
  }
}

/**
 * Capture a stuck signal when user is confused
 */
export async function captureStuckSignal(
  userId: number,
  stuckPoint: string,
  conceptId?: number,
  metadata?: Record<string, any>
) {
  try {
    return await captureSignal({
      userId,
      signalType: "stuck",
      content: stuckPoint,
      conceptId,
      metadata: {
        source: "journey",
        ...metadata,
      },
    });
  } catch (error) {
    console.error("[Signal] Failed to capture stuck signal:", error);
    return null;
  }
}

/**
 * Capture a teaching signal when user explains concept
 */
export async function captureTeachingSignal(
  userId: number,
  explanation: string,
  conceptId?: number,
  metadata?: Record<string, any>
) {
  try {
    return await captureSignal({
      userId,
      signalType: "teaching",
      content: explanation,
      conceptId,
      metadata: {
        source: "chat",
        ...metadata,
      },
    });
  } catch (error) {
    console.error("[Signal] Failed to capture teaching signal:", error);
    return null;
  }
}

/**
 * Capture a feedback signal from user
 */
export async function captureFeedbackSignal(
  userId: number,
  feedback: string,
  conceptId?: number,
  metadata?: Record<string, any>
) {
  try {
    return await captureSignal({
      userId,
      signalType: "feedback",
      content: feedback,
      conceptId,
      metadata: {
        source: "content",
        ...metadata,
      },
    });
  } catch (error) {
    console.error("[Signal] Failed to capture feedback signal:", error);
    return null;
  }
}

/**
 * Capture engagement signal from content interaction
 */
export async function captureEngagementSignal(
  userId: number,
  engagementType: "watch" | "read" | "reaction" | "save" | "skip",
  contentId: string,
  conceptId?: number,
  metadata?: Record<string, any>
) {
  try {
    const contentDescription = `User ${engagementType} content ${contentId}`;
    
    // Map engagement type to signal type
    let signalType: "question" | "connection" | "application" | "teaching" | "breakthrough" | "stuck" | "feedback" = "feedback";
    if (engagementType === "reaction") {
      signalType = "connection"; // Indicates they're making connections
    } else if (engagementType === "save") {
      signalType = "application"; // Indicates they find it useful
    }

    return await captureSignal({
      userId,
      signalType,
      content: contentDescription,
      conceptId,
      metadata: {
        source: "content",
        engagementType,
        contentId,
        ...metadata,
      },
    });
  } catch (error) {
    console.error("[Signal] Failed to capture engagement signal:", error);
    return null;
  }
}

/**
 * Capture stage completion signal from learning journey
 */
export async function captureStageCompletionSignal(
  userId: number,
  stageTitle: string,
  stageType: string,
  conceptId?: number,
  accuracy?: number,
  timeSpentSeconds?: number,
  metadata?: Record<string, any>
) {
  try {
    const stageDescription = `Completed stage: ${stageTitle} (${stageType})${accuracy ? ` with ${Math.round(accuracy * 100)}% accuracy` : ""}`;
    
    // Determine signal type based on stage type
    let signalType: "question" | "connection" | "application" | "teaching" | "breakthrough" | "stuck" | "feedback" = "feedback";
    if (stageType === "check") {
      signalType = accuracy && accuracy > 0.7 ? "breakthrough" : accuracy && accuracy < 0.4 ? "stuck" : "connection";
    } else if (stageType === "explanation") {
      signalType = "connection";
    } else if (stageType === "real_world") {
      signalType = "application";
    }

    return await captureSignal({
      userId,
      signalType,
      content: stageDescription,
      conceptId,
      metadata: {
        source: "journey",
        stageTitle,
        stageType,
        accuracy,
        timeSpentSeconds,
        ...metadata,
      },
    });
  } catch (error) {
    console.error("[Signal] Failed to capture stage completion signal:", error);
    return null;
  }
}

/**
 * Batch capture multiple signals
 */
export async function captureMultipleSignals(
  userId: number,
  signals: Array<{
    signalType: "question" | "connection" | "application" | "teaching" | "breakthrough" | "stuck" | "feedback";
    content: string;
    conceptId?: number;
    metadata?: Record<string, any>;
  }>
) {
  try {
    const results = await Promise.all(
      signals.map((signal) =>
        captureSignal({
          userId,
          signalType: signal.signalType,
          content: signal.content,
          conceptId: signal.conceptId,
          metadata: signal.metadata,
        })
      )
    );
    return results;
  } catch (error) {
    console.error("[Signal] Failed to capture multiple signals:", error);
    return [];
  }
}
