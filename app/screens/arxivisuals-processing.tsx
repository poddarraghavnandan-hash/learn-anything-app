/**
 * ArxiVisuals Processing Status Screen
 * Shows real-time progress as content is processed
 * Stages: Processing → Extracting Concepts → Generating Plan → Creating Storyboards → Complete
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";
import * as Haptics from "expo-haptics";

type ProcessingStage =
  | "idle"
  | "processing"
  | "extracting"
  | "planning"
  | "generating"
  | "complete"
  | "error";

interface ProcessingStep {
  id: string;
  label: string;
  description: string;
  status: "pending" | "active" | "complete" | "error";
  duration?: number;
}

export default function ArxivisualsProcessingScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams();

  const [stage, setStage] = useState<ProcessingStage>("idle");
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      id: "process",
      label: "Processing Content",
      description: "Validating and preparing your content",
      status: "pending",
    },
    {
      id: "extract",
      label: "Extracting Concepts",
      description: "Identifying key concepts and relationships",
      status: "pending",
    },
    {
      id: "plan",
      label: "Generating Teaching Plan",
      description: "Creating 5-step learning pathway",
      status: "pending",
    },
    {
      id: "storyboard",
      label: "Creating Storyboards",
      description: "Designing video scenes and animations",
      status: "pending",
    },
    {
      id: "assessment",
      label: "Generating Assessments",
      description: "Creating quiz questions",
      status: "pending",
    },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    startProcessing();
  }, []);

  const updateStep = (stepId: string, status: "pending" | "active" | "complete" | "error") => {
    setSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, status } : step))
    );
  };

  const startProcessing = async () => {
    try {
      setStage("processing");
      updateStep("process", "active");

      // Simulate processing stages with delays
      // In production, this would call the actual API endpoints

      // Stage 1: Process content
      await new Promise((resolve) => setTimeout(resolve, 2000));
      updateStep("process", "complete");
      setProgress(20);

      // Stage 2: Extract concepts
      setStage("extracting");
      updateStep("extract", "active");
      await new Promise((resolve) => setTimeout(resolve, 3000));
      updateStep("extract", "complete");
      setProgress(40);

      // Stage 3: Generate teaching plan
      setStage("planning");
      updateStep("plan", "active");
      await new Promise((resolve) => setTimeout(resolve, 3000));
      updateStep("plan", "complete");
      setProgress(60);

      // Stage 4: Generate storyboards
      setStage("generating");
      updateStep("storyboard", "active");
      await new Promise((resolve) => setTimeout(resolve, 4000));
      updateStep("storyboard", "complete");
      setProgress(80);

      // Stage 5: Generate assessments
      updateStep("assessment", "active");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      updateStep("assessment", "complete");
      setProgress(100);

      // Complete
      setStage("complete");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Mock result
      setResult({
        title: "Your Learning Path",
        topic: params.topic || "Custom Content",
        steps: 5,
        estimatedTime: 45,
        conceptsExtracted: 8,
      });
    } catch (err) {
      console.error("Processing error:", err);
      setStage("error");
      setError("Failed to process content. Please try again.");
      updateStep(steps.find((s) => s.status === "active")?.id || "process", "error");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleRetry = () => {
    setStage("idle");
    setProgress(0);
    setError(null);
    setSteps((prev) => prev.map((step) => ({ ...step, status: "pending" })));
    startProcessing();
  };

  const handleViewResult = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "./arxivisuals-result",
      params: {
        result: JSON.stringify(result),
      },
    });
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-foreground mb-2">
            {stage === "complete" ? "✨ Ready!" : "Processing..."}
          </Text>
          <Text className="text-base text-muted">
            {stage === "complete"
              ? "Your learning path is ready to explore"
              : "Creating your personalized learning path"}
          </Text>
        </View>

        {/* Progress Bar */}
        <View className="px-6 mb-8">
          <View className="bg-surface rounded-full h-2 overflow-hidden mb-2">
            <View
              className="bg-primary h-full"
              style={{ width: `${progress}%` }}
            />
          </View>
          <Text className="text-sm text-muted text-center">{progress}% Complete</Text>
        </View>

        {/* Processing Steps */}
        <View className="px-6 mb-8">
          {steps.map((step, index) => (
            <View key={step.id} className="mb-4">
              <View className="flex-row items-start gap-4">
                {/* Step Indicator */}
                <View className="items-center">
                  <View
                    className={cn(
                      "w-10 h-10 rounded-full items-center justify-center border-2",
                      step.status === "complete"
                        ? "bg-success border-success"
                        : step.status === "active"
                          ? "bg-primary border-primary"
                          : step.status === "error"
                            ? "bg-error border-error"
                            : "bg-surface border-border"
                    )}
                  >
                    {step.status === "complete" ? (
                      <Text className="text-white font-bold">✓</Text>
                    ) : step.status === "active" ? (
                      <ActivityIndicator color={colors.background} size="small" />
                    ) : step.status === "error" ? (
                      <Text className="text-white font-bold">!</Text>
                    ) : (
                      <Text className="text-muted font-semibold">{index + 1}</Text>
                    )}
                  </View>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <View
                      className={cn(
                        "w-0.5 h-12 mt-2",
                        step.status === "complete" ? "bg-success" : "bg-border"
                      )}
                    />
                  )}
                </View>

                {/* Step Content */}
                <View className="flex-1 pt-1">
                  <Text
                    className={cn(
                      "font-semibold",
                      step.status === "complete" || step.status === "active"
                        ? "text-foreground"
                        : "text-muted"
                    )}
                  >
                    {step.label}
                  </Text>
                  <Text className="text-sm text-muted mt-1">{step.description}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Error State */}
        {error && (
          <View className="px-6 mb-6">
            <View className="bg-error bg-opacity-10 border border-error rounded-lg p-4">
              <Text className="text-error font-semibold mb-2">Processing Failed</Text>
              <Text className="text-error text-sm mb-4">{error}</Text>
              <TouchableOpacity
                onPress={handleRetry}
                className="bg-error py-2 px-4 rounded-lg items-center"
              >
                <Text className="text-background font-semibold">Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Success State */}
        {stage === "complete" && result && (
          <View className="px-6 mb-8">
            <View className="bg-success bg-opacity-10 border border-success rounded-lg p-4 mb-6">
              <View className="flex-row items-center gap-3 mb-3">
                <Text className="text-2xl">🎉</Text>
                <Text className="text-success font-bold flex-1">Success!</Text>
              </View>

              <View className="gap-3">
                <View className="flex-row justify-between">
                  <Text className="text-muted">Learning Steps</Text>
                  <Text className="text-foreground font-semibold">{result.steps}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted">Estimated Time</Text>
                  <Text className="text-foreground font-semibold">{result.estimatedTime} min</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted">Concepts Extracted</Text>
                  <Text className="text-foreground font-semibold">
                    {result.conceptsExtracted}
                  </Text>
                </View>
              </View>
            </View>

            {/* View Result Button */}
            <TouchableOpacity
              onPress={handleViewResult}
              className="bg-primary py-4 px-6 rounded-lg items-center mb-3"
            >
              <Text className="text-background font-bold text-base">View Learning Path →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-surface border border-border py-4 px-6 rounded-lg items-center"
            >
              <Text className="text-foreground font-semibold">Create Another</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Idle/Loading State */}
        {stage !== "complete" && !error && (
          <View className="px-6 pb-8">
            <View className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <Text className="text-xs text-blue-900 leading-relaxed">
                💡 Tip: This process extracts key concepts, creates a structured learning path,
                and generates video storyboards. You can start learning once it's complete!
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
