import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

interface LessonSessionOptions {
  userId: string;
  lessonId: string;
  topic: string;
  approach: string;
}

export function useLessonSession(options: LessonSessionOptions) {
  const [sessionStarted, setSessionStarted] = useState(false);
  const sessionIdRef = useRef<string>("");

  // Start session on mount
  useEffect(() => {
    const startSession = async () => {
      try {
        // In a real app, this would call the backend API
        // For now, we'll just generate a local session ID
        const sessionId = `${options.userId}-${options.lessonId}-${Date.now()}`;
        sessionIdRef.current = sessionId;
        setSessionStarted(true);
      } catch (error) {
        console.error("Failed to start session:", error);
      }
    };

    startSession();

    // Cleanup: end session on unmount
    return () => {
      if (sessionIdRef.current) {
        // In a real app, this would call endSession API
        console.log("Session ended:", sessionIdRef.current);
      }
    };
  }, [options.userId, options.lessonId]);

  /**
   * Record a behavior signal during the lesson
   */
  const recordSignal = async (
    signalType: "engagement" | "comprehension" | "confidence" | "pacing" | "interaction",
    value: number,
    metadata?: Record<string, any>
  ) => {
    if (!sessionStarted) return;

    try {
      // In a real app, this would call the backend API
      console.log("Signal recorded:", {
        sessionId: sessionIdRef.current,
        signalType,
        value,
        metadata,
      });
    } catch (error) {
      console.error("Failed to record signal:", error);
    }
  };

  /**
   * Record quiz answer
   */
  const recordQuizAnswer = async (
    questionIndex: number,
    selectedAnswerIndex: number,
    correctAnswerIndex: number,
    timeSpentSeconds: number
  ) => {
    const isCorrect = selectedAnswerIndex === correctAnswerIndex;
    const comprehensionScore = isCorrect ? 100 : 50;

    await recordSignal("comprehension", comprehensionScore, {
      questionIndex,
      isCorrect,
      timeSpentSeconds,
    });

    // Record engagement based on time spent
    const engagementScore = timeSpentSeconds > 5 ? 80 : 60;
    await recordSignal("engagement", engagementScore, {
      timeSpentSeconds,
    });
  };

  /**
   * Record confidence level
   */
  const recordConfidence = async (confidenceLevel: number) => {
    await recordSignal("confidence", confidenceLevel, {
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * Record interaction (button clicks, scrolls, etc.)
   */
  const recordInteraction = async (interactionType: string) => {
    await recordSignal("interaction", 75, {
      interactionType,
      timestamp: new Date().toISOString(),
    });
  };

  return {
    sessionStarted,
    sessionId: sessionIdRef.current,
    recordSignal,
    recordQuizAnswer,
    recordConfidence,
    recordInteraction,
  };
}
