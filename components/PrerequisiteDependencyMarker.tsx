/**
 * Prerequisite Dependency Marker Component
 * 
 * Visual indicator showing prerequisite relationships and knowledge gaps
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";

interface Prerequisite {
  conceptId: number;
  conceptName: string;
  severity: "low" | "medium" | "high";
  userKnows: boolean;
  confidence?: number; // 0-1
}

interface PrerequisiteDependencyMarkerProps {
  prerequisites: Prerequisite[];
  onPrerequisitePress?: (conceptId: number) => void;
  compact?: boolean;
  className?: string;
}

export function PrerequisiteDependencyMarker({
  prerequisites,
  onPrerequisitePress,
  compact = false,
  className,
}: PrerequisiteDependencyMarkerProps) {
  const colors = useColors();

  if (prerequisites.length === 0) {
    return null;
  }

  const knownCount = prerequisites.filter((p) => p.userKnows).length;
  const highSeverityGaps = prerequisites.filter((p) => !p.userKnows && p.severity === "high");

  // Get severity color
  const getSeverityColor = (severity: "low" | "medium" | "high", userKnows: boolean) => {
    if (userKnows) return colors.success;
    if (severity === "high") return colors.error;
    if (severity === "medium") return colors.warning;
    return colors.muted;
  };

  // Get severity icon
  const getSeverityIcon = (severity: "low" | "medium" | "high", userKnows: boolean) => {
    if (userKnows) return "✓";
    if (severity === "high") return "!";
    if (severity === "medium") return "?";
    return "○";
  };

  if (compact) {
    return (
      <View className={cn("flex-row items-center gap-2", className)}>
        <View className="flex-row items-center gap-1">
          <Text className="text-xs font-semibold text-muted">Prerequisites:</Text>
          <View className="bg-primary/10 rounded-full px-2 py-0.5">
            <Text className="text-xs font-bold text-primary">
              {knownCount}/{prerequisites.length}
            </Text>
          </View>
        </View>

        {highSeverityGaps.length > 0 && (
          <View className="bg-error/10 rounded-full px-2 py-0.5">
            <Text className="text-xs font-bold text-error">
              {highSeverityGaps.length} gap{highSeverityGaps.length !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View className={cn("gap-3", className)}>
      {/* Summary */}
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-foreground">Prerequisites</Text>
        <View className="flex-row items-center gap-2">
          <View className="bg-success/10 rounded-full px-2.5 py-1">
            <Text className="text-xs font-bold text-success">
              {knownCount} known
            </Text>
          </View>
          {highSeverityGaps.length > 0 && (
            <View className="bg-error/10 rounded-full px-2.5 py-1">
              <Text className="text-xs font-bold text-error">
                {highSeverityGaps.length} gap{highSeverityGaps.length !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Prerequisite List */}
      <View className="gap-2">
        {prerequisites.map((prereq) => {
          const color = getSeverityColor(prereq.severity, prereq.userKnows);
          const icon = getSeverityIcon(prereq.severity, prereq.userKnows);

          return (
            <Pressable
              key={prereq.conceptId}
              onPress={() => onPrerequisitePress?.(prereq.conceptId)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <View
                className={cn(
                  "flex-row items-center gap-3 p-3 rounded-lg border",
                  prereq.userKnows
                    ? "bg-success/5 border-success/30"
                    : prereq.severity === "high"
                      ? "bg-error/5 border-error/30"
                      : prereq.severity === "medium"
                        ? "bg-warning/5 border-warning/30"
                        : "bg-muted/5 border-muted/30"
                )}
              >
                {/* Status Icon */}
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Text style={{ color, fontSize: 14, fontWeight: "bold" }}>
                    {icon}
                  </Text>
                </View>

                {/* Concept Info */}
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    {prereq.conceptName}
                  </Text>
                  {prereq.confidence !== undefined && (
                    <View className="flex-row items-center gap-1 mt-1">
                      <View className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${prereq.confidence * 100}%`,
                            backgroundColor: color,
                          }}
                        />
                      </View>
                      <Text className="text-xs text-muted">
                        {Math.round(prereq.confidence * 100)}%
                      </Text>
                    </View>
                  )}
                </View>

                {/* Severity Badge */}
                {!prereq.userKnows && (
                  <View
                    className="px-2 py-1 rounded"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Text
                      className="text-xs font-bold uppercase"
                      style={{ color }}
                    >
                      {prereq.severity}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Action Suggestion */}
      {highSeverityGaps.length > 0 && (
        <View className="bg-error/5 border border-error/30 rounded-lg p-3">
          <Text className="text-xs text-error font-semibold">
            💡 Suggestion: Learn {highSeverityGaps[0].conceptName} first to better understand this concept
          </Text>
        </View>
      )}
    </View>
  );
}
