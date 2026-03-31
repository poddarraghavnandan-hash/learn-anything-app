import React, { useEffect } from "react";
import { View, Text, Pressable, Dimensions } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Achievement Celebration - Full screen celebration for major wins
 */
export function AchievementCelebration({
  visible,
  title,
  subtitle,
  icon,
  color,
  onComplete,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  icon: string;
  color: string;
  onComplete?: () => void;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      scale.value = withSpring(1, { damping: 6, mass: 1 });
      opacity.value = withTiming(1, { duration: 300 });

      const timer = setTimeout(() => {
        scale.value = withTiming(0, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        onComplete?.();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          alignItems: "center",
          backgroundColor: "#FFFFFF",
          borderRadius: 24,
          padding: 32,
          width: SCREEN_WIDTH * 0.8,
          maxWidth: 300,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 15,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: color + "20",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <MaterialIcons name={icon as any} size={48} color={color} />
        </View>

        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            color: "#0F172A",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {title}
        </Text>

        {subtitle && (
          <Text
            style={{
              fontSize: 14,
              color: "#64748B",
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

/**
 * Streak Badge - Shows current learning streak
 */
export function StreakBadge({
  count,
  color,
}: {
  count: number;
  color?: string;
}) {
  const colors = useColors();
  const badgeColor = color || colors.primary;

  return (
    <Animated.View entering={ZoomIn.springify()}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: badgeColor + "20",
          borderRadius: 20,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderWidth: 2,
          borderColor: badgeColor,
        }}
      >
        <MaterialIcons name="whatshot" size={20} color={badgeColor} style={{ marginRight: 6 }} />
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: badgeColor,
          }}
        >
          {count} day streak
        </Text>
      </View>
    </Animated.View>
  );
}

/**
 * Progress Celebration - Shows progress with celebration
 */
export function ProgressCelebration({
  progress,
  label,
  color,
}: {
  progress: number; // 0-100
  label: string;
  color: string;
}) {
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress / 100, { duration: 1000 });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%`,
  }));

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: "#0F172A",
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: color,
          }}
        >
          {Math.round(progress)}%
        </Text>
      </View>

      <View
        style={{
          height: 8,
          backgroundColor: "#E2E8F0",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={[
            {
              height: "100%",
              backgroundColor: color,
              borderRadius: 4,
            },
            animatedStyle,
          ]}
        />
      </View>
    </View>
  );
}

/**
 * Achievement Card - Displays unlocked achievement
 */
export function AchievementCard({
  title,
  description,
  icon,
  color,
  unlocked,
  progress,
  onPress,
}: {
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  progress?: number; // 0-100, if not unlocked
  onPress?: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: unlocked ? color + "15" : colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 2,
          borderColor: unlocked ? color : colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: color + "25",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
            opacity: unlocked ? 1 : 0.5,
          }}
        >
          <MaterialIcons name={icon as any} size={32} color={unlocked ? color : colors.muted} />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: colors.foreground,
              marginBottom: 4,
            }}
          >
            {title}
          </Text>

          <Text
            style={{
              fontSize: 12,
              color: colors.muted,
              lineHeight: 16,
              marginBottom: 8,
            }}
          >
            {description}
          </Text>

          {!unlocked && progress !== undefined && (
            <View
              style={{
                height: 4,
                backgroundColor: colors.border,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: "100%",
                  backgroundColor: color,
                  width: `${progress}%`,
                }}
              />
            </View>
          )}

          {unlocked && (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="check-circle" size={16} color={color} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: color,
                  marginLeft: 4,
                }}
              >
                Unlocked
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Confetti Animation - Celebratory confetti effect
 */
export function ConfettiAnimation({
  visible,
  duration = 2000,
}: {
  visible: boolean;
  duration?: number;
}) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(duration - 300, withTiming(0, { duration: 300 }))
      );
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: "none",
        },
        animatedStyle,
      ]}
    >
      {[...Array(12)].map((_, i) => (
        <ConfettiPiece key={i} delay={i * 50} />
      ))}
    </Animated.View>
  );
}

function ConfettiPiece({ delay }: { delay: number }) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const randomX = Math.random() * 200 - 100;
    const randomY = Math.random() * -300;

    translateX.value = withDelay(delay, withTiming(randomX, { duration: 1500 }));
    translateY.value = withDelay(delay, withTiming(randomY, { duration: 1500 }));
    rotation.value = withDelay(delay, withTiming(Math.random() * 360, { duration: 1500 }));
    opacity.value = withDelay(delay, withTiming(0, { duration: 300 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const colors = ["#EC4899", "#F59E0B", "#10B981", "#06B6D4", "#8B5CF6"];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

/**
 * Reward Popup - Shows reward earned
 */
export function RewardPopup({
  visible,
  amount,
  type = "xp",
  onComplete,
}: {
  visible: boolean;
  amount: number;
  type?: "xp" | "points" | "streak";
  onComplete?: () => void;
}) {
  const scale = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scale.value = withSpring(1, { damping: 8 });
      translateY.value = withSequence(
        withTiming(-50, { duration: 500 }),
        withDelay(1000, withTiming(-100, { duration: 300 }))
      );

      const timer = setTimeout(() => {
        onComplete?.();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  if (!visible) return null;

  const typeConfig = {
    xp: { icon: "star", color: "#FBBF24", label: "XP" },
    points: { icon: "favorite", color: "#EC4899", label: "Points" },
    streak: { icon: "local-fire", color: "#F59E0B", label: "Streak" },
  };

  const config = typeConfig[type];

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          bottom: 100,
          left: "50%",
          marginLeft: -50,
          alignItems: "center",
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <MaterialIcons name={config.icon as any} size={20} color={config.color} style={{ marginRight: 8 }} />
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: config.color,
          }}
        >
          +{amount} {config.label}
        </Text>
      </View>
    </Animated.View>
  );
}
