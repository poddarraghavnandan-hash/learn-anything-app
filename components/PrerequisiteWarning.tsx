/**
 * PrerequisiteWarning Component
 * 
 * Displays a warning when user tries to access content without required prerequisites.
 * Offers options to learn prerequisites first or continue anyway.
 */

import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { getResponsiveFontSize, getResponsiveSpacing } from "@/lib/responsive";

interface Prerequisite {
  conceptId: number;
  conceptName: string;
  userKnows: boolean;
  severity: "low" | "medium" | "high";
}

interface PrerequisiteWarningProps {
  prerequisites: Prerequisite[];
  conceptName: string;
  onLearnPrerequisite?: (conceptId: number, conceptName: string) => void;
  onContinueAnyway?: () => void;
  loading?: boolean;
}

export function PrerequisiteWarning({
  prerequisites,
  conceptName,
  onLearnPrerequisite,
  onContinueAnyway,
  loading = false,
}: PrerequisiteWarningProps) {
  const colors = useColors();
  const [selectedPrerequisite, setSelectedPrerequisite] = useState<number | null>(null);

  // Filter to show only missing prerequisites
  const missingPrerequisites = prerequisites.filter((p) => !p.userKnows);
  const highSeverityGaps = missingPrerequisites.filter((p) => p.severity === "high");
  const mediumSeverityGaps = missingPrerequisites.filter((p) => p.severity === "medium");

  if (missingPrerequisites.length === 0) {
    return null; // No prerequisites needed
  }

  const getSeverityColor = (severity: "low" | "medium" | "high") => {
    switch (severity) {
      case "high":
        return { bg: "bg-error/10", border: "border-error", text: "text-error" };
      case "medium":
        return { bg: "bg-warning/10", border: "border-warning", text: "text-warning" };
      case "low":
        return { bg: "bg-success/10", border: "border-success", text: "text-success" };
    }
  };

  const getSeverityLabel = (severity: "low" | "medium" | "high") => {
    switch (severity) {
      case "high":
        return "Essential";
      case "medium":
        return "Recommended";
      case "low":
        return "Optional";
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="mb-6">
          <Text
            className="text-4xl mb-3"
            style={{ fontSize: getResponsiveFontSize(32) }}
          >
            ⚠️
          </Text>
          <Text
            className="font-bold text-foreground mb-2"
            style={{ fontSize: getResponsiveFontSize(20) }}
          >
            Prerequisites Needed
          </Text>
          <Text
            className="text-muted"
            style={{ fontSize: getResponsiveFontSize(14) }}
          >
            We recommend learning these concepts before diving into {conceptName}.
          </Text>
        </View>

        {/* High Severity */}
        {highSeverityGaps.length > 0 && (
          <View className="mb-6">
            <Text
              className="font-bold text-error mb-3"
              style={{ fontSize: getResponsiveFontSize(15) }}
            >
              🔴 Essential ({highSeverityGaps.length})
            </Text>
            {highSeverityGaps.map((prereq) => {
              const colors_severity = getSeverityColor(prereq.severity);
              const isSelected = selectedPrerequisite === prereq.conceptId;

              return (
                <Pressable
                  key={prereq.conceptId}
                  onPress={() => setSelectedPrerequisite(prereq.conceptId)}
                  className={cn(
                    "mb-2 p-3 rounded-lg border",
                    isSelected
                      ? `${colors_severity.bg} ${colors_severity.border} border-2`
                      : `${colors_severity.bg} ${colors_severity.border}`
                  )}
                  style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={cn("font-semibold flex-1", colors_severity.text)}
                      style={{ fontSize: getResponsiveFontSize(13) }}
                    >
                      {prereq.conceptName}
                    </Text>
                    <Text
                      className={cn("text-xs font-semibold", colors_severity.text)}
                      style={{ fontSize: getResponsiveFontSize(11) }}
                    >
                      {getSeverityLabel(prereq.severity)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Medium Severity */}
        {mediumSeverityGaps.length > 0 && (
          <View className="mb-6">
            <Text
              className="font-bold text-warning mb-3"
              style={{ fontSize: getResponsiveFontSize(15) }}
            >
              🟡 Recommended ({mediumSeverityGaps.length})
            </Text>
            {mediumSeverityGaps.map((prereq) => {
              const colors_severity = getSeverityColor(prereq.severity);
              const isSelected = selectedPrerequisite === prereq.conceptId;

              return (
                <Pressable
                  key={prereq.conceptId}
                  onPress={() => setSelectedPrerequisite(prereq.conceptId)}
                  className={cn(
                    "mb-2 p-3 rounded-lg border",
                    isSelected
                      ? `${colors_severity.bg} ${colors_severity.border} border-2`
                      : `${colors_severity.bg} ${colors_severity.border}`
                  )}
                  style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={cn("font-semibold flex-1", colors_severity.text)}
                      style={{ fontSize: getResponsiveFontSize(13) }}
                    >
                      {prereq.conceptName}
                    </Text>
                    <Text
                      className={cn("text-xs font-semibold", colors_severity.text)}
                      style={{ fontSize: getResponsiveFontSize(11) }}
                    >
                      {getSeverityLabel(prereq.severity)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Info Box */}
        <View className="mb-6 p-4 bg-surface rounded-lg border border-border">
          <Text
            className="text-foreground font-semibold mb-2"
            style={{ fontSize: getResponsiveFontSize(13) }}
          >
            💡 Why These Prerequisites?
          </Text>
          <Text
            className="text-muted"
            style={{ fontSize: getResponsiveFontSize(12) }}
          >
            Learning these concepts first will help you understand {conceptName} much better and
            avoid confusion.
          </Text>
        </View>

        {/* Buttons */}
        <View className="gap-3 mt-auto">
          {/* Learn Prerequisites Button */}
          <Pressable
            onPress={() => {
              if (selectedPrerequisite !== null) {
                const selected = prerequisites.find((p) => p.conceptId === selectedPrerequisite);
                if (selected) {
                  onLearnPrerequisite?.(selected.conceptId, selected.conceptName);
                }
              }
            }}
            disabled={selectedPrerequisite === null || loading}
            className={cn(
              "py-3 px-4 rounded-lg items-center justify-center",
              selectedPrerequisite === null || loading
                ? "bg-muted opacity-50"
                : "bg-primary"
            )}
            style={({ pressed }) => [
              {
                opacity: pressed && selectedPrerequisite !== null ? 0.8 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Text
                className={cn(
                  "font-semibold",
                  selectedPrerequisite === null ? "text-muted" : "text-background"
                )}
                style={{ fontSize: getResponsiveFontSize(14) }}
              >
                📚 Learn Selected
              </Text>
            )}
          </Pressable>

          {/* Continue Anyway Button */}
          <Pressable
            onPress={onContinueAnyway}
            disabled={loading}
            className="py-3 px-4 rounded-lg items-center justify-center border-2 border-primary"
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text
              className="font-semibold text-primary"
              style={{ fontSize: getResponsiveFontSize(14) }}
            >
              ⏭️ Continue Anyway
            </Text>
          </Pressable>
        </View>

        {/* Warning Note */}
        <Text
          className="text-muted text-center mt-4 text-xs"
          style={{ fontSize: getResponsiveFontSize(11) }}
        >
          Note: Skipping prerequisites may make the content harder to understand.
        </Text>
      </View>
    </ScrollView>
  );
}
