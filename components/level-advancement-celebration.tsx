/**
 * Level Advancement Celebration Component
 * Shows celebration animation when user advances to next level
 */

import React, { useEffect } from "react";
import { View, Text, Animated, Dimensions } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";

interface LevelAdvancementCelebrationProps {
  level: number;
  levelName: string;
  levelIcon: string;
  onComplete?: () => void;
}

const { height, width } = Dimensions.get("window");

export function LevelAdvancementCelebration({
  level,
  levelName,
  levelIcon,
  onComplete,
}: LevelAdvancementCelebrationProps) {
  const colors = useColors();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const bounceAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Scale in animation
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
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onComplete?.();
        });
      }, 2000);
    });
  }, [scaleAnim, opacityAnim, rotateAnim, bounceAnim, onComplete]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const translateY = bounceAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [50, -20, 0],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        opacity: opacityAnim,
        zIndex: 1000,
      }}
      pointerEvents="none"
    >
      {/* Overlay */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
        }}
      />

      {/* Celebration Content */}
      <Animated.View
        style={{
          transform: [
            { scale: scaleAnim },
            { translateY },
          ],
        }}
      >
        <View className="items-center gap-6">
          {/* Icon */}
          <Animated.Text
            style={{
              fontSize: 80,
              transform: [{ rotate: rotation }],
            }}
          >
            {levelIcon}
          </Animated.Text>

          {/* Text */}
          <View className="items-center gap-2">
            <Text className="text-3xl font-bold text-foreground">
              Level Up! 🎉
            </Text>
            <Text className="text-xl font-semibold text-primary">
              {levelName}
            </Text>
            <Text className="text-sm text-muted text-center max-w-xs">
              You've reached Level {level}. Keep learning to unlock the next level!
            </Text>
          </View>

          {/* Achievement Badge */}
          <View
            className="w-24 h-24 rounded-full items-center justify-center border-4"
            style={{
              backgroundColor: `${colors.primary}20`,
              borderColor: colors.primary,
            }}
          >
            <Text className="text-5xl">⭐</Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}
