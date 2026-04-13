/**
 * useGeminiGenerator Hook
 * Manages Gemini content generation state and API calls from mobile app
 */

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";

type DifficultyLevel = "beginner" | "intermediate" | "advanced";

interface GeneratedContent {
  title: string;
  topic: string;
  difficulty: DifficultyLevel;
  content: string;
  keyPoints: string[];
  prerequisites: string[];
  estimatedReadTime: number;
  conceptCount: number;
}

interface UseGeminiGeneratorState {
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  content: GeneratedContent | null;
  variations: GeneratedContent[];
  suggestions: string[];
  progress: number; // 0-100
}

export function useGeminiGenerator() {
  const [state, setState] = useState<UseGeminiGeneratorState>({
    isLoading: false,
    isGenerating: false,
    error: null,
    content: null,
    variations: [],
    suggestions: [],
    progress: 0,
  });

  const generateContentMutation = trpc.gemini.generateContent.useMutation();

  /**
   * Generate content on a topic
   */
  const generateContent = useCallback(
    async (topic: string, difficulty: DifficultyLevel = "intermediate", customPrompt?: string) => {
      try {
        setState((prev) => ({
          ...prev,
          isGenerating: true,
          error: null,
          progress: 10,
        }));

        setState((prev) => ({ ...prev, progress: 20 }));

        // Generate content
        const result = await generateContentMutation.mutateAsync({
          topic,
          difficulty,
          customPrompt,
        });

        if (!result.success) {
          throw new Error(result.error || "Failed to generate content");
        }

        setState((prev) => ({
          ...prev,
          content: result.data || null,
          isGenerating: false,
          progress: 100,
        }));

        return result.data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isGenerating: false,
        }));
        throw error;
      }
    },
    [generateContentMutation]
  );

  /**
   * Generate variations of content
   */
  const generateVariations = useCallback(
    async (topic: string, difficulty: DifficultyLevel = "intermediate") => {
      try {
        setState((prev) => ({ ...prev, isLoading: true }));

        // Placeholder for variations
        setState((prev) => ({
          ...prev,
          variations: [],
          isLoading: false,
        }));

        return [];
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        throw error;
      }
    },
    []
  );

  /**
   * Validate topic
   */
  const validateTopic = useCallback(
    async (topic: string) => {
      try {
        // Placeholder validation
        return { isValid: topic.length > 0 };
      } catch (error) {
        return { isValid: false };
      }
    },
    []
  );

  /**
   * Get metadata for topic (placeholder)
   */
  const getMetadata = useCallback(
    async (topic: string, difficulty: DifficultyLevel = "intermediate") => {
      // Placeholder for future metadata endpoint
      return { success: true, suggestions: [] };
    },
    []
  );

  /**
   * Clear state
   */
  const clearState = useCallback(() => {
    setState({
      isLoading: false,
      isGenerating: false,
      error: null,
      content: null,
      variations: [],
      suggestions: [],
      progress: 0,
    });
  }, []);

  return {
    ...state,
    generateContent,
    generateVariations,
    validateTopic,
    getMetadata,
    clearState,
  };
}
