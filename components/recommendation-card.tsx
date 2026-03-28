import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  GestureResponderEvent,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";
import * as Haptics from "expo-haptics";

export interface RecommendationCardProps {
  id: string;
  conceptName: string;
  type:
    | "knowledge_gap"
    | "spaced_repetition"
    | "next_concept"
    | "challenge"
    | "reinforcement"
    | "learning_style_match";
  priority: "critical" | "high" | "medium" | "low";
  reason: string;
  estimatedTime: number; // minutes
  successProbability: number; // 0-1
  engagementScore: number; // 0-1
  difficulty: "foundation" | "intermediate" | "advanced" | "expert";
  onAccept?: (id: string) => void;
  onDismiss?: (id: string, reason?: string) => void;
}

const typeIcons: Record<RecommendationCardProps["type"], string> = {
  knowledge_gap: "lightbulb",
  spaced_repetition: "repeat",
  next_concept: "trending-up",
  challenge: "star",
  reinforcement: "build",
  learning_style_match: "favorite",
};

const typeLabels: Record<RecommendationCardProps["type"], string> = {
  knowledge_gap: "Knowledge Gap",
  spaced_repetition: "Review Time",
  next_concept: "Next Step",
  challenge: "Challenge",
  reinforcement: "Reinforce",
  learning_style_match: "Your Style",
};

const priorityColors: Record<RecommendationCardProps["priority"], string> = {
  critical: "#EF4444",
  high: "#F59E0B",
  medium: "#3B82F6",
  low: "#10B981",
};

const difficultyLabels: Record<RecommendationCardProps["difficulty"], string> =
  {
    foundation: "Foundation",
    intermediate: "Intermediate",
    advanced: "Advanced",
    expert: "Expert",
  };

/**
 * RecommendationCard
 *
 * Displays a personalized learning recommendation with:
 * - Concept name and recommendation type
 * - Priority indicator
 * - Estimated time and success probability
 * - Engagement score and difficulty level
 * - Accept/Dismiss actions with haptic feedback
 */
export function RecommendationCard({
  id,
  conceptName,
  type,
  priority,
  reason,
  estimatedTime,
  successProbability,
  engagementScore,
  difficulty,
  onAccept,
  onDismiss,
}: RecommendationCardProps) {
  const colors = useColors();
  const [isPressed, setIsPressed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleAccept = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAccept?.(id);
  };

  const handleDismiss = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsDismissed(true);
    onDismiss?.(id, "dismissed");
  };

  if (isDismissed) {
    return null;
  }

  const successPercentage = Math.round(successProbability * 100);
  const engagementPercentage = Math.round(engagementScore * 100);

  return (
    <Pressable
      onPress={handleAccept}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: priorityColors[priority],
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {/* Header: Type Badge + Priority Indicator */}
      <View style={styles.header}>
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: colors.primary + "20" },
          ]}
        >
          <MaterialIcons
            name={typeIcons[type] as any}
            size={16}
            color={colors.primary}
          />
          <Text
            style={[
              styles.typeLabel,
              { color: colors.primary, fontWeight: "600" },
            ]}
          >
            {typeLabels[type]}
          </Text>
        </View>

        {/* Priority Dot */}
        <View
          style={[
            styles.priorityDot,
            { backgroundColor: priorityColors[priority] },
          ]}
        />
      </View>

      {/* Concept Name */}
      <Text
        style={[styles.conceptName, { color: colors.foreground }]}
        numberOfLines={2}
      >
        {conceptName}
      </Text>

      {/* Reason */}
      <Text
        style={[styles.reason, { color: colors.muted }]}
        numberOfLines={2}
      >
        {reason}
      </Text>

      {/* Stats Row: Time + Success + Engagement */}
      <View style={styles.statsRow}>
        {/* Estimated Time */}
        <View style={styles.stat}>
          <MaterialIcons name="schedule" size={14} color={colors.muted} />
          <Text style={[styles.statLabel, { color: colors.muted }]}>
            {estimatedTime}m
          </Text>
        </View>

        {/* Success Probability */}
        <View style={styles.stat}>
          <MaterialIcons name="trending-up" size={14} color={colors.success} />
          <Text style={[styles.statLabel, { color: colors.success }]}>
            {successPercentage}%
          </Text>
        </View>

        {/* Engagement Score */}
        <View style={styles.stat}>
          <MaterialIcons name="favorite" size={14} color={colors.primary} />
          <Text style={[styles.statLabel, { color: colors.primary }]}>
            {engagementPercentage}%
          </Text>
        </View>

        {/* Difficulty Badge */}
        <View
          style={[
            styles.difficultyBadge,
            { backgroundColor: colors.border },
          ]}
        >
          <Text style={[styles.difficultyLabel, { color: colors.muted }]}>
            {difficultyLabels[difficulty]}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {/* Dismiss Button */}
        <Pressable
          onPress={handleDismiss}
          style={({ pressed }) => [
            styles.dismissButton,
            {
              backgroundColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <MaterialIcons name="close" size={18} color={colors.muted as any} />
          <Text style={[styles.buttonLabel, { color: colors.muted }]}>
            Dismiss
          </Text>
        </Pressable>

        {/* Accept Button */}
        <Pressable
          onPress={handleAccept}
          style={({ pressed }) => [
            styles.acceptButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <MaterialIcons name="arrow-forward" size={18} color="white" />
          <Text style={[styles.buttonLabel, { color: "white" }]}>
            Start Learning
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeLabel: {
    fontSize: 12,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  conceptName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  reason: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  dismissButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  acceptButton: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
});
