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
  const generateVariationsMutation = trpc.gemini.variations.useMutation();
  const validateTopicMutation = trpc.gemini.validation.useMutation();
  const getMetadataMutation = trpc.gemini.metadata.useMutation();

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

        // Validate topic first
        const validation = await validateTopicMutation.mutateAsync({ topic });

        if (!validation.isValid) {
          throw new Error("Invalid topic. Please try a different topic.");
        }

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
          content: result.data,
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
          progress: 0,
        }));
        throw error;
      }
    },
    [generateContentMutation, validateTopicMutation]
  );

  /**
   * Generate multiple content variations
   */
  const generateVariations = useCallback(
    async (topic: string, difficulty: DifficultyLevel = "intermediate", count: number = 3) => {
      try {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
          progress: 10,
        }));

        const result = await generateVariationsMutation.mutateAsync({
          topic,
          difficulty,
          count,
        });

        if (!result.success) {
          throw new Error(result.error || "Failed to generate variations");
        }

        setState((prev) => ({
          ...prev,
          variations: result.data,
          isLoading: false,
          progress: 100,
        }));

        return result.data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
          progress: 0,
        }));
        throw error;
      }
    },
    [generateVariationsMutation]
  );

  /**
   * Get topic suggestions
   */
  const getSuggestions = useCallback(
    async (topic?: string, count: number = 5) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true }));

        // TODO: Implement getSuggestions endpoint
        const suggestions = [
          "Quantum Computing Basics",
          "Machine Learning Fundamentals",
          "Web Development with React",
          "Data Science Essentials",
          "Cloud Architecture Patterns",
        ];

        setState((prev) => ({
          ...prev,
          suggestions: suggestions.slice(0, count),
          isLoading: false,
        }));
        return suggestions.slice(0, count);
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
   * Validate a topic
   */
  const validateTopic = useCallback(
    async (topic: string) => {
      try {
        const result = await validateTopicMutation.mutateAsync({ topic });
        return result;
      } catch (error) {
        console.error("Topic validation error:", error);
        return {
          success: false,
          isValid: false,
          error: error instanceof Error ? error.message : "Validation failed",
        };
      }
    },
    [validateTopicMutation]
  );

  /**
   * Get content metadata
   */
  const getMetadata = useCallback(
    async (topic: string, difficulty: DifficultyLevel = "intermediate") => {
      try {
        setState((prev) => ({ ...prev, isLoading: true }));

        const result = await getMetadataMutation.mutateAsync({
          topic,
          difficulty,
        });

        if (!result.success) {
          throw new Error(result.error || "Failed to get metadata");
        }

        setState((prev) => ({ ...prev, isLoading: false }));
        return result.data;
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
    [getMetadataMutation]
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

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    generateContent,
    generateVariations,
    getSuggestions,
    validateTopic,
    getMetadata,
    clearState,
    clearError,
  };
}
