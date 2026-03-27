import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { getResponsiveFontSize, getResponsiveSpacing } from "@/lib/responsive";
import { PersonalizedRefresherCard, type RefresherSection } from "./PersonalizedRefresherCard";
import { PrerequisiteTestingQuiz, type QuizQuestion } from "./PrerequisiteTestingQuiz";
import { useModuleReentry } from "@/hooks/use-module-reentry";

export interface ModuleReentryFlowProps {
  topicSlug: string;
  userId: string | null;
  onReentryComplete?: () => void;
  onSkipReentry?: () => void;
}

type FlowStep = "loading" | "refresher" | "prerequisite" | "complete";

export function ModuleReentryFlow({
  topicSlug,
  userId,
  onReentryComplete,
  onSkipReentry,
}: ModuleReentryFlowProps) {
  const colors = useColors();
  const [currentStep, setCurrentStep] = useState<FlowStep>("loading");

  const {
    needsRefresher,
    needsPrerequisiteTest,
    refresherData,
    prerequisiteQuestions,
    isLoading,
    error,
    completeRefresher,
    completePrerequisiteTest,
    skipRefresher,
    skipPrerequisiteTest,
  } = useModuleReentry(topicSlug, userId);

  // Determine which step to show
  useEffect(() => {
    if (isLoading) {
      setCurrentStep("loading");
    } else if (needsRefresher) {
      setCurrentStep("refresher");
    } else if (needsPrerequisiteTest) {
      setCurrentStep("prerequisite");
    } else {
      setCurrentStep("complete");
      onReentryComplete?.();
    }
  }, [isLoading, needsRefresher, needsPrerequisiteTest, onReentryComplete]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-red-500 text-center" style={{ fontSize: getResponsiveFontSize(14) }}>
          Error loading module: {error}
        </Text>
      </View>
    );
  }

  if (currentStep === "loading") {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4" style={{ fontSize: getResponsiveFontSize(12) }}>
          Preparing your learning session...
        </Text>
      </View>
    );
  }

  if (currentStep === "refresher" && refresherData) {
    const sections: RefresherSection[] = refresherData.sections || [];
    const keyTakeaways = refresherData.keyTakeaways || [];

    return (
      <View className="flex-1">
        <View className="px-3 py-2 bg-primary/10 border-b border-border">
          <Text className="text-xs font-semibold text-primary" style={{ fontSize: getResponsiveFontSize(11) }}>
            Welcome back! Let's refresh your memory.
          </Text>
        </View>
        <PersonalizedRefresherCard
          title={refresherData.title || "Quick Refresher"}
          intensity={refresherData.intensity || "quick"}
          sections={sections}
          estimatedTime={refresherData.estimatedTime || 5}
          keyTakeaways={keyTakeaways}
          onComplete={() => {
            completeRefresher();
            if (needsPrerequisiteTest) {
              setCurrentStep("prerequisite");
            } else {
              setCurrentStep("complete");
              onReentryComplete?.();
            }
          }}
          onNeedMore={() => {
            // Could show extended content here
            completeRefresher();
          }}
        />
      </View>
    );
  }

  if (currentStep === "prerequisite" && prerequisiteQuestions && prerequisiteQuestions.length > 0) {
    return (
      <View className="flex-1">
        <View className="px-3 py-2 bg-primary/10 border-b border-border">
          <Text className="text-xs font-semibold text-primary" style={{ fontSize: getResponsiveFontSize(11) }}>
            Quick prerequisite check before we continue
          </Text>
        </View>
        <PrerequisiteTestingQuiz
          questions={prerequisiteQuestions}
          onComplete={(score, total) => {
            completePrerequisiteTest(score, total);
            setCurrentStep("complete");
            onReentryComplete?.();
          }}
          onSkip={() => {
            skipPrerequisiteTest();
            setCurrentStep("complete");
            onReentryComplete?.();
          }}
        />
      </View>
    );
  }

  // Complete - no reentry needed
  return null;
}
