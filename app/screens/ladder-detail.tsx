/**
 * Ladder Detail Screen
 * Shows detailed information about learning ladder levels and achievements
 */

import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

interface LadderLevelDetail {
  level: number;
  name: string;
  icon: string;
  description: string;
  masteryRequired: number;
  skills: string[];
  achievements: string[];
  estimatedTime: string;
  nextMilestone: string;
}

const LADDER_DETAILS: LadderLevelDetail[] = [
  {
    level: 1,
    name: "Foundation",
    icon: "🌱",
    description: "Learn the basics and core concepts",
    masteryRequired: 0,
    skills: [
      "Understand basic terminology",
      "Grasp fundamental principles",
      "Follow simple examples",
    ],
    achievements: [
      "🎖️ First Steps - Complete your first lesson",
      "📖 Knowledge Seeker - Finish 5 lessons",
      "🎯 Curious Mind - Ask 10 questions",
    ],
    estimatedTime: "2-3 hours",
    nextMilestone: "Reach 60% mastery to advance to Understanding",
  },
  {
    level: 2,
    name: "Understanding",
    icon: "📚",
    description: "Understand how concepts work",
    masteryRequired: 60,
    skills: [
      "Explain concepts in your own words",
      "Connect related ideas",
      "Solve guided problems",
    ],
    achievements: [
      "🧠 Deep Thinker - Reach 60% mastery",
      "🔗 Connector - Link 5 concepts together",
      "📝 Note Master - Create 20 notes",
    ],
    estimatedTime: "3-4 hours",
    nextMilestone: "Reach 75% mastery to advance to Application",
  },
  {
    level: 3,
    name: "Application",
    icon: "🎯",
    description: "Apply concepts to real-world scenarios",
    masteryRequired: 75,
    skills: [
      "Apply concepts to new situations",
      "Solve complex problems",
      "Create practical examples",
    ],
    achievements: [
      "🎯 Practitioner - Reach 75% mastery",
      "💡 Problem Solver - Solve 10 complex problems",
      "🌍 Real-World Expert - Apply to 5 scenarios",
    ],
    estimatedTime: "4-5 hours",
    nextMilestone: "Reach 85% mastery to advance to Deep Dive",
  },
  {
    level: 4,
    name: "Deep Dive",
    icon: "🔬",
    description: "Master advanced theory and principles",
    masteryRequired: 85,
    skills: [
      "Understand underlying theory",
      "Analyze complex systems",
      "Evaluate different approaches",
    ],
    achievements: [
      "🔬 Researcher - Reach 85% mastery",
      "📊 Analyst - Analyze 5 complex systems",
      "🏆 Expert - Score 90%+ on advanced quizzes",
    ],
    estimatedTime: "5-6 hours",
    nextMilestone: "Reach 95% mastery to achieve Mastery",
  },
  {
    level: 5,
    name: "Mastery",
    icon: "👑",
    description: "Become an expert and teach others",
    masteryRequired: 95,
    skills: [
      "Teach concepts to others",
      "Create original content",
      "Contribute to the community",
    ],
    achievements: [
      "👑 Master - Reach 95% mastery",
      "📚 Teacher - Help 10 learners",
      "🌟 Legend - Create 5 pieces of content",
      "🏅 Hall of Fame - Join the elite learners",
    ],
    estimatedTime: "6-8 hours",
    nextMilestone: "You've reached the highest level!",
  },
];

export default function LadderDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { level = "1" } = useLocalSearchParams();
  const currentLevel = parseInt(level as string, 10);
  const levelDetail = LADDER_DETAILS[currentLevel - 1];

  if (!levelDetail) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground">Level not found</Text>
      </ScreenContainer>
    );
  }

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <ScreenContainer className="p-0">
      {/* Header */}
      <View className="bg-primary bg-opacity-10 border-b border-border px-6 py-6">
        <TouchableOpacity onPress={handleBack} className="mb-4">
          <Text className="text-primary text-lg">← Back</Text>
        </TouchableOpacity>
        <View className="flex-row items-center gap-4">
          <Text className="text-6xl">{levelDetail.icon}</Text>
          <View className="flex-1">
            <Text className="text-3xl font-bold text-foreground">
              Level {levelDetail.level}
            </Text>
            <Text className="text-lg font-semibold text-primary">
              {levelDetail.name}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 py-6 gap-6">
          {/* Description */}
          <View className="bg-surface border border-border rounded-lg p-4">
            <Text className="text-sm font-semibold text-muted mb-2">
              ABOUT THIS LEVEL
            </Text>
            <Text className="text-base text-foreground leading-relaxed">
              {levelDetail.description}
            </Text>
          </View>

          {/* Mastery Requirement */}
          <View className="bg-primary bg-opacity-10 border border-primary rounded-lg p-4">
            <Text className="text-sm font-semibold text-primary mb-2">
              📊 MASTERY REQUIREMENT
            </Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-base text-foreground">
                Minimum Mastery
              </Text>
              <Text className="text-2xl font-bold text-primary">
                {levelDetail.masteryRequired}%
              </Text>
            </View>
          </View>

          {/* Skills */}
          <View>
            <Text className="text-lg font-bold text-foreground mb-3">
              🎯 Skills You'll Develop
            </Text>
            <View className="gap-2">
              {levelDetail.skills.map((skill, index) => (
                <View
                  key={index}
                  className="bg-surface border border-border rounded-lg p-3 flex-row items-center gap-3"
                >
                  <Text className="text-lg">✓</Text>
                  <Text className="text-sm text-foreground flex-1">
                    {skill}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Achievements */}
          <View>
            <Text className="text-lg font-bold text-foreground mb-3">
              🏆 Achievements to Unlock
            </Text>
            <View className="gap-2">
              {levelDetail.achievements.map((achievement, index) => (
                <View
                  key={index}
                  className="bg-surface border border-border rounded-lg p-3 flex-row items-center gap-3"
                >
                  <Text className="text-lg">{achievement.split(" ")[0]}</Text>
                  <Text className="text-sm text-foreground flex-1">
                    {achievement.substring(achievement.indexOf(" ") + 1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Time & Milestone */}
          <View className="gap-3">
            <View className="bg-surface border border-border rounded-lg p-4">
              <Text className="text-sm font-semibold text-muted mb-2">
                ⏱️ ESTIMATED TIME
              </Text>
              <Text className="text-base font-bold text-foreground">
                {levelDetail.estimatedTime}
              </Text>
            </View>

            <View className="bg-surface border border-border rounded-lg p-4">
              <Text className="text-sm font-semibold text-muted mb-2">
                🎯 NEXT MILESTONE
              </Text>
              <Text className="text-base text-foreground">
                {levelDetail.nextMilestone}
              </Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            onPress={handleBack}
            className="bg-primary py-4 px-6 rounded-lg items-center mb-6"
          >
            <Text className="text-background font-bold text-base">
              Start Learning →
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
