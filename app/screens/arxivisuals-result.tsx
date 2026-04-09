/**
 * ArxiVisuals Result Screen
 * Displays the generated learning path with concepts, steps, and video previews
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";
import * as Haptics from "expo-haptics";

interface LearningStep {
  stepNumber: number;
  title: string;
  learningObjective: string;
  keyInsight: string;
  estimatedTime: number;
  difficulty: string;
  concepts: string[];
}

export default function ArxivisualsResultScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams();

  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Parse result from params
  const result = params.result ? JSON.parse(params.result as string) : null;

  const mockSteps: LearningStep[] = [
    {
      stepNumber: 1,
      title: "Foundations & Core Concepts",
      learningObjective: "Understand the fundamental principles",
      keyInsight: "Master the building blocks before advanced topics",
      estimatedTime: 8,
      difficulty: "beginner",
      concepts: ["Concept A", "Concept B", "Concept C"],
    },
    {
      stepNumber: 2,
      title: "Deep Dive into Applications",
      learningObjective: "Explore real-world applications",
      keyInsight: "See how theory connects to practice",
      estimatedTime: 10,
      difficulty: "intermediate",
      concepts: ["Application 1", "Application 2"],
    },
    {
      stepNumber: 3,
      title: "Advanced Techniques",
      learningObjective: "Learn cutting-edge approaches",
      keyInsight: "Push beyond the basics",
      estimatedTime: 12,
      difficulty: "advanced",
      concepts: ["Advanced Concept 1", "Advanced Concept 2"],
    },
    {
      stepNumber: 4,
      title: "Synthesis & Integration",
      learningObjective: "Connect all concepts together",
      keyInsight: "Build a complete mental model",
      estimatedTime: 10,
      difficulty: "advanced",
      concepts: ["Integration", "Synthesis"],
    },
    {
      stepNumber: 5,
      title: "Mastery & Beyond",
      learningObjective: "Achieve deep mastery",
      keyInsight: "Ready for independent exploration",
      estimatedTime: 5,
      difficulty: "advanced",
      concepts: ["Mastery", "Next Steps"],
    },
  ];

  const handleStartLearning = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/arxivisuals-lesson",
      params: {
        step: "1",
        totalSteps: mockSteps.length,
      },
    });
  };

  const handleStepPress = (stepNumber: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedStep(selectedStep === stepNumber ? null : stepNumber);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-900";
      case "intermediate":
        return "bg-blue-100 text-blue-900";
      case "advanced":
        return "bg-purple-100 text-purple-900";
      default:
        return "bg-gray-100 text-gray-900";
    }
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
            {result?.title || "Your Learning Path"}
          </Text>
          <Text className="text-base text-muted">
            {result?.topic || "Custom Content"}
          </Text>
        </View>

        {/* Summary Stats */}
        <View className="px-6 mb-6">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-surface border border-border rounded-lg p-4">
              <Text className="text-xs text-muted mb-1">Total Steps</Text>
              <Text className="text-2xl font-bold text-foreground">
                {result?.steps || mockSteps.length}
              </Text>
            </View>
            <View className="flex-1 bg-surface border border-border rounded-lg p-4">
              <Text className="text-xs text-muted mb-1">Est. Time</Text>
              <Text className="text-2xl font-bold text-foreground">
                {result?.estimatedTime || 45}m
              </Text>
            </View>
            <View className="flex-1 bg-surface border border-border rounded-lg p-4">
              <Text className="text-xs text-muted mb-1">Concepts</Text>
              <Text className="text-2xl font-bold text-foreground">
                {result?.conceptsExtracted || 8}
              </Text>
            </View>
          </View>
        </View>

        {/* Learning Path Steps */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold text-foreground mb-4">Learning Path</Text>

          {mockSteps.map((step, index) => (
            <View key={step.stepNumber} className="mb-3">
              <TouchableOpacity
                onPress={() => handleStepPress(step.stepNumber)}
                className="bg-surface border border-border rounded-lg p-4 flex-row items-center justify-between"
              >
                <View className="flex-1">
                  <View className="flex-row items-center gap-3 mb-2">
                    <View className="w-8 h-8 rounded-full bg-primary items-center justify-center">
                      <Text className="text-background font-bold text-sm">
                        {step.stepNumber}
                      </Text>
                    </View>
                    <Text className="text-foreground font-semibold flex-1">{step.title}</Text>
                  </View>

                  <View className="flex-row items-center gap-2 ml-11">
                    <View
                      className={cn(
                        "px-2 py-1 rounded text-xs font-semibold",
                        getDifficultyColor(step.difficulty)
                      )}
                    >
                      <Text>{step.difficulty}</Text>
                    </View>
                    <Text className="text-xs text-muted">{step.estimatedTime} min</Text>
                  </View>
                </View>

                <Text className="text-lg ml-2">
                  {selectedStep === step.stepNumber ? "▼" : "▶"}
                </Text>
              </TouchableOpacity>

              {/* Expanded Step Details */}
              {selectedStep === step.stepNumber && (
                <View className="bg-surface border border-t-0 border-border rounded-b-lg p-4 mt-0">
                  <View className="mb-4">
                    <Text className="text-sm text-muted mb-1">Learning Objective</Text>
                    <Text className="text-foreground">{step.learningObjective}</Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm text-muted mb-1">Key Insight</Text>
                    <Text className="text-foreground italic">{step.keyInsight}</Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm text-muted mb-2">Concepts Covered</Text>
                    <View className="flex-row gap-2 flex-wrap">
                      {step.concepts.map((concept) => (
                        <View
                          key={concept}
                          className="bg-primary bg-opacity-10 border border-primary rounded-full px-3 py-1"
                        >
                          <Text className="text-xs text-primary font-medium">{concept}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({
                        pathname: "/arxivisuals-lesson",
                        params: {
                          step: step.stepNumber.toString(),
                          totalSteps: mockSteps.length,
                        },
                      });
                    }}
                    className="bg-primary py-2 px-4 rounded-lg items-center"
                  >
                    <Text className="text-background font-semibold text-sm">
                      Start This Step →
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Start Learning Button */}
        <View className="px-6 pb-6">
          <TouchableOpacity
            onPress={handleStartLearning}
            className="bg-primary py-4 px-6 rounded-lg items-center mb-3"
          >
            <Text className="text-background font-bold text-base">
              Start Learning Journey →
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-surface border border-border py-4 px-6 rounded-lg items-center"
          >
            <Text className="text-foreground font-semibold">Back</Text>
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View className="px-6 pb-6">
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <Text className="text-xs text-blue-900 leading-relaxed">
              💡 Each step includes animated video explanations, interactive quizzes, and
              real-world examples. You can pause, rewind, and review anytime.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
