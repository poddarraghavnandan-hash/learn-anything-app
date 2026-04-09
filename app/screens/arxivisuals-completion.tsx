/**
 * ArxiVisuals Completion Screen
 * Celebrates completion of learning path and shows achievements
 */

import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

export default function ArxivisualsCompletionScreen() {
  const router = useRouter();
  const colors = useColors();

  React.useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace("/(tabs)");
  };

  const handleCreateAnother = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/arxivisuals-input");
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration Animation */}
        <View className="px-6 pt-12 pb-6 items-center">
          <Text className="text-7xl mb-4">🎉</Text>
          <Text className="text-4xl font-bold text-foreground mb-2 text-center">
            Congratulations!
          </Text>
          <Text className="text-lg text-muted text-center">
            You've completed the learning path
          </Text>
        </View>

        {/* Stats */}
        <View className="px-6 mb-8">
          <View className="gap-3">
            <View className="bg-success bg-opacity-10 border border-success rounded-lg p-4 flex-row items-center gap-3">
              <Text className="text-3xl">✓</Text>
              <View className="flex-1">
                <Text className="text-sm text-muted">Steps Completed</Text>
                <Text className="text-2xl font-bold text-foreground">5 / 5</Text>
              </View>
            </View>

            <View className="bg-primary bg-opacity-10 border border-primary rounded-lg p-4 flex-row items-center gap-3">
              <Text className="text-3xl">⏱</Text>
              <View className="flex-1">
                <Text className="text-sm text-muted">Time Invested</Text>
                <Text className="text-2xl font-bold text-foreground">45 minutes</Text>
              </View>
            </View>

            <View className="bg-blue-100 border border-blue-300 rounded-lg p-4 flex-row items-center gap-3">
              <Text className="text-3xl">🧠</Text>
              <View className="flex-1">
                <Text className="text-sm text-muted">Concepts Mastered</Text>
                <Text className="text-2xl font-bold text-foreground">8 concepts</Text>
              </View>
            </View>

            <View className="bg-purple-100 border border-purple-300 rounded-lg p-4 flex-row items-center gap-3">
              <Text className="text-3xl">⭐</Text>
              <View className="flex-1">
                <Text className="text-sm text-muted">Quiz Performance</Text>
                <Text className="text-2xl font-bold text-foreground">92% Average</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View className="px-6 mb-8">
          <Text className="text-lg font-bold text-foreground mb-4">Achievements Unlocked</Text>
          <View className="gap-3">
            <View className="bg-surface border border-border rounded-lg p-4 flex-row items-center gap-3">
              <Text className="text-4xl">🏅</Text>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">First Learning Path</Text>
                <Text className="text-sm text-muted">Complete your first ArxiVisuals path</Text>
              </View>
            </View>

            <View className="bg-surface border border-border rounded-lg p-4 flex-row items-center gap-3">
              <Text className="text-4xl">🔥</Text>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">Quick Learner</Text>
                <Text className="text-sm text-muted">Complete 5 steps in under 1 hour</Text>
              </View>
            </View>

            <View className="bg-surface border border-border rounded-lg p-4 flex-row items-center gap-3">
              <Text className="text-4xl">🎯</Text>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">Quiz Master</Text>
                <Text className="text-sm text-muted">Score 90%+ on all quizzes</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Next Steps */}
        <View className="px-6 mb-8">
          <Text className="text-lg font-bold text-foreground mb-4">What's Next?</Text>
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <Text className="text-sm text-blue-900 leading-relaxed mb-3">
              💡 You've built a strong foundation! Here are your next steps:
            </Text>
            <View className="gap-2">
              <Text className="text-sm text-blue-900">
                • Review your notes and revisit tricky concepts
              </Text>
              <Text className="text-sm text-blue-900">
                • Practice with spaced repetition quizzes
              </Text>
              <Text className="text-sm text-blue-900">
                • Create another learning path on a related topic
              </Text>
              <Text className="text-sm text-blue-900">
                • Share your achievement with friends
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-6 pb-6 gap-3">
          <TouchableOpacity
            onPress={handleContinue}
            className="bg-primary py-4 px-6 rounded-lg items-center"
          >
            <Text className="text-background font-bold text-base">
              Continue Learning →
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCreateAnother}
            className="bg-surface border border-border py-4 px-6 rounded-lg items-center"
          >
            <Text className="text-foreground font-semibold">Create Another Path</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Summary */}
        <View className="px-6 pb-6">
          <View className="bg-surface border border-border rounded-lg p-4">
            <Text className="text-sm font-semibold text-muted mb-3">Your Learning Stats</Text>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Total Paths Completed</Text>
                <Text className="text-sm font-semibold text-foreground">1</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Total Time Invested</Text>
                <Text className="text-sm font-semibold text-foreground">45 min</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Concepts Learned</Text>
                <Text className="text-sm font-semibold text-foreground">8</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Average Score</Text>
                <Text className="text-sm font-semibold text-foreground">92%</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
