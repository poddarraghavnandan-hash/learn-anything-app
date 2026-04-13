/**
 * Learning Ladder Component
 * Displays 5-level learning progression with visual ladder
 */

import React, { useEffect } from "react";
import { View, Text, Dimensions, Animated, Pressable } from "react-native";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

interface LadderLevel {
  level: number;
  name: string;
  description: string;
  icon: string;
  masteryPercentage: number;
  isCurrentLevel: boolean;
  isUnlocked: boolean;
}

interface LearningLadderProps {
  currentLevel: number;
  masteryPercentage: number;
  levels: LadderLevel[];
  onLevelPress?: (level: number) => void;
  showAnimation?: boolean;
}

const { width } = Dimensions.get("window");
const LADDER_WIDTH = width - 32;
const RUNG_HEIGHT = 80;
const RUNG_SPACING = 20;

export function LearningLadder({
  currentLevel,
  masteryPercentage,
  levels,
  onLevelPress,
  showAnimation = true,
}: LearningLadderProps) {
  const colors = useColors();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showAnimation) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showAnimation, scaleAnim, opacityAnim]);

  const getLevelColor = (level: number, isCurrentLevel: boolean) => {
    if (isCurrentLevel) return colors.primary;
    if (level < currentLevel) return colors.success;
    return colors.border;
  };

  const getLevelBgColor = (level: number, isCurrentLevel: boolean) => {
    if (isCurrentLevel) return `${colors.primary}20`;
    if (level < currentLevel) return `${colors.success}20`;
    return `${colors.border}20`;
  };

  const handleLevelPress = (level: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLevelPress?.(level);
  };

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <View className="px-4 py-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground mb-2">
            Learning Ladder
          </Text>
          <Text className="text-sm text-muted">
            Level {currentLevel} of {levels.length}
          </Text>
        </View>

        {/* Progress Bar */}
        <View className="mb-8 bg-surface rounded-lg p-4 border border-border">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm font-semibold text-foreground">
              Mastery Progress
            </Text>
            <Text className="text-sm font-bold text-primary">
              {masteryPercentage}%
            </Text>
          </View>
          <View className="h-2 bg-background rounded-full overflow-hidden">
            <Animated.View
              style={{
                width: `${masteryPercentage}%`,
                height: "100%",
                backgroundColor: colors.primary,
              }}
            />
          </View>
        </View>

        {/* Ladder Visualization */}
        <View className="bg-surface rounded-lg p-4 border border-border">
          {/* Ladder Rungs */}
          <View className="gap-2">
            {levels.map((level) => {
              const isCurrentLevel = level.level === currentLevel;
              const isCompleted = level.level < currentLevel;
              const isUnlocked = level.isUnlocked;

              return (
                <Pressable
                  key={level.level}
                  onPress={() => handleLevelPress(level.level)}
                  disabled={!isUnlocked}
                  className="mb-1"
                >
                  <View
                    className="flex-row items-center gap-3 p-3 rounded-lg border"
                    style={{
                      backgroundColor: getLevelBgColor(level.level, isCurrentLevel),
                      borderColor: getLevelColor(level.level, isCurrentLevel),
                      opacity: isUnlocked ? 1 : 0.5,
                    }}
                  >
                    {/* Level Indicator */}
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center border-2"
                      style={{
                        backgroundColor: getLevelBgColor(level.level, isCurrentLevel),
                        borderColor: getLevelColor(level.level, isCurrentLevel),
                      }}
                    >
                      <Text className="text-2xl">{level.icon}</Text>
                    </View>

                    {/* Level Info */}
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-1">
                        <Text
                          className="text-base font-bold text-foreground"
                          numberOfLines={1}
                        >
                          {level.name}
                        </Text>
                        {isCurrentLevel && (
                          <View className="bg-primary rounded-full px-2 py-1">
                            <Text className="text-xs font-bold text-background">
                              Current
                            </Text>
                          </View>
                        )}
                        {isCompleted && (
                          <Text className="text-lg">✓</Text>
                        )}
                      </View>
                      <Text
                        className="text-xs text-muted"
                        numberOfLines={1}
                      >
                        {level.description}
                      </Text>
                    </View>

                    {/* Mastery Percentage */}
                    <View className="items-end">
                      <Text className="text-sm font-bold text-foreground">
                        {level.masteryPercentage}%
                      </Text>
                      <Text className="text-xs text-muted">mastery</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Current Level Details */}
        {levels[currentLevel - 1] && (
          <View className="mt-6 bg-primary bg-opacity-10 border border-primary rounded-lg p-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              🎯 Current Level: {levels[currentLevel - 1].name}
            </Text>
            <Text className="text-xs text-muted leading-relaxed">
              {levels[currentLevel - 1].description}
            </Text>
            <View className="mt-3 pt-3 border-t border-primary border-opacity-20">
              <Text className="text-xs font-semibold text-primary mb-2">
                What's Next?
              </Text>
              <Text className="text-xs text-muted">
                Complete lessons and quizzes to progress to the next level. Your mastery is tracked automatically based on your interactions.
              </Text>
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );
}
