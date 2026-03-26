/**
 * MultiLayerLadderStage Component
 * 
 * Displays a single learning ladder stage with Foundation/DeepDive/Expert layers.
 * Shows prerequisite badges, recommended layer, and progress tracking.
 */

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { getResponsiveFontSize, getResponsiveSpacing } from "@/lib/responsive";
import { MultiLayerContentCard } from "./MultiLayerContentCard";
import { PrerequisiteDependencyMarker } from "./PrerequisiteDependencyMarker";

interface Stage {
  stageId: number;
  stageName: string;
  stageDescription: string;
  conceptId: number;
  conceptName: string;
  foundation?: {
    content: string;
    keyPoints: string[];
    estimatedReadTime: number;
  };
  deepDive?: {
    content: string;
    keyPoints: string[];
    estimatedReadTime: number;
  };
  expert?: {
    content: string;
    keyPoints: string[];
    estimatedReadTime: number;
  };
  userConfidence: number;
  recommendedLayer: "foundation" | "deepDive" | "expert";
  prerequisites: Array<{
    conceptId: number;
    conceptName: string;
    userKnows: boolean;
    severity: "low" | "medium" | "high";
  }>;
}

interface MultiLayerLadderStageProps {
  stage: Stage;
  stageNumber: number;
  totalStages: number;
  onLayerComplete?: (layer: "foundation" | "deepDive" | "expert") => void;
  onNextStage?: () => void;
}

export function MultiLayerLadderStage({
  stage,
  stageNumber,
  totalStages,
  onLayerComplete,
  onNextStage,
}: MultiLayerLadderStageProps) {
  const colors = useColors();
  const [selectedLayer, setSelectedLayer] = useState<"foundation" | "deepDive" | "expert">(
    stage.recommendedLayer
  );
  const [completedLayers, setCompletedLayers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Check for high-severity prerequisites
  const highSeverityGaps = stage.prerequisites.filter((p) => !p.userKnows && p.severity === "high");
  const shouldWarnPrerequisites = highSeverityGaps.length > 0;

  // Calculate progress
  const progressPercentage = Math.round(((stageNumber - 1) / totalStages) * 100);

  const handleLayerComplete = async (layer: "foundation" | "deepDive" | "expert") => {
    setLoading(true);
    try {
      // Mark layer as completed
      setCompletedLayers((prev) => new Set([...prev, layer]));

      // Call callback if provided
      if (onLayerComplete) {
        onLayerComplete(layer);
      }
    } catch (error) {
      console.error("[MultiLayerLadderStage] Failed to complete layer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStage = () => {
    if (onNextStage) {
      onNextStage();
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1">
        {/* Header */}
        <View
        className="bg-surface border-b border-border"
            style={{ paddingVertical: getResponsiveSpacing(16) }}
        >
          <View className="px-4">
            {/* Stage Title */}
            <Text
              className="font-bold text-foreground"
              style={{ fontSize: getResponsiveFontSize(24) }}
            >
              {stage.stageName}
            </Text>

            {/* Stage Description */}
            {stage.stageDescription && (
              <Text
                className="text-muted mt-2"
                style={{ fontSize: getResponsiveFontSize(14) }}
              >
                {stage.stageDescription}
              </Text>
            )}

            {/* Progress Bar */}
            <View className="mt-4 h-2 bg-border rounded-full overflow-hidden">
              <View
                className="h-full bg-primary"
                style={{ width: `${Math.round(progressPercentage)}%` }}
              />
            </View>

            <Text
              className="text-muted text-center mt-2"
              style={{ fontSize: getResponsiveFontSize(12) }}
            >
              Stage {stageNumber} of {totalStages} ({progressPercentage}%)
            </Text>
          </View>
        </View>

        {/* Prerequisite Warning */}
        {shouldWarnPrerequisites && (
          <View className="mx-4 mt-4 p-3 bg-error/10 border border-error rounded-lg">
            <Text
              className="text-error font-semibold"
              style={{ fontSize: getResponsiveFontSize(13) }}
            >
              ⚠️ Prerequisites Needed
            </Text>
            <Text
              className="text-error mt-1"
              style={{ fontSize: getResponsiveFontSize(12) }}
            >
              We recommend learning {highSeverityGaps.map((p) => p.conceptName).join(", ")} first.
            </Text>
          </View>
        )}

        {/* Content */}
        <View className="flex-1 px-4 py-4">
          {stage.foundation || stage.deepDive || stage.expert ? (
            <>
              {/* Layer Tabs */}
              <View className="flex-row gap-2 mb-4">
                {[
                  { layer: "foundation" as const, emoji: "🌱", label: "Foundation" },
                  { layer: "deepDive" as const, emoji: "🔍", label: "Deep Dive" },
                  { layer: "expert" as const, emoji: "🚀", label: "Expert" },
                ].map(({ layer, emoji, label }) => {
                  const hasContent = stage[layer];
                  const isSelected = selectedLayer === layer;
                  const isCompleted = completedLayers.has(layer);

                  return (
                    <Pressable
                      key={layer}
                      onPress={() => hasContent && setSelectedLayer(layer)}
                      disabled={!hasContent}
                      className={cn(
                        "flex-1 py-2 px-2 rounded-lg border",
                        isSelected
                          ? "bg-primary border-primary"
                          : hasContent
                            ? "bg-surface border-border"
                            : "bg-muted/20 border-border opacity-50"
                      )}
                      style={({ pressed }) => [
                        {
                          opacity: pressed && hasContent ? 0.8 : 1,
                        },
                      ]}
                    >
                      <Text
                        className={cn(
                          "text-center font-semibold",
                          isSelected ? "text-background" : "text-foreground"
                        )}
                        style={{ fontSize: getResponsiveFontSize(12) }}
                      >
                        {emoji} {label}
                        {isCompleted && " ✓"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Content Card */}
              {stage[selectedLayer] && (
                <View>
                  <Text
                    className="font-semibold text-foreground mb-2"
                    style={{ fontSize: getResponsiveFontSize(14) }}
                  >
                    {stage[selectedLayer]!.content}
                  </Text>
                  {stage[selectedLayer]!.keyPoints.length > 0 && (
                    <View className="mt-3">
                      <Text
                        className="font-semibold text-foreground mb-2"
                        style={{ fontSize: getResponsiveFontSize(13) }}
                      >
                        Key Points:
                      </Text>
                      {stage[selectedLayer]!.keyPoints.map((point, idx) => (
                        <Text
                          key={idx}
                          className="text-muted ml-2 mb-1"
                          style={{ fontSize: getResponsiveFontSize(12) }}
                        >
                          • {point}
                        </Text>
                      ))}
                    </View>
                  )}
                  <Text
                    className="text-muted mt-3"
                    style={{ fontSize: getResponsiveFontSize(12) }}
                  >
                    Time: {stage[selectedLayer]!.estimatedReadTime} min
                  </Text>
                  <Pressable
                    onPress={() => handleLayerComplete(selectedLayer)}
                    className="mt-4 py-2 px-4 bg-primary rounded-lg items-center"
                    style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                  >
                    <Text
                      className="font-semibold text-background"
                      style={{ fontSize: getResponsiveFontSize(13) }}
                    >
                      Mark as Complete
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Recommended Layer Badge */}
              {selectedLayer !== stage.recommendedLayer && (
                <View className="mt-4 p-3 bg-warning/10 border border-warning rounded-lg">
                  <Text
                    className="text-warning font-semibold"
                    style={{ fontSize: getResponsiveFontSize(12) }}
                  >
                    💡 Recommended: {stage.recommendedLayer.charAt(0).toUpperCase() +
                      stage.recommendedLayer.slice(1)}
                  </Text>
                </View>
              )}

              {/* Prerequisites */}
              {stage.prerequisites.length > 0 && (
                <View className="mt-4">
                  <Text
                    className="font-semibold text-foreground mb-2"
                    style={{ fontSize: getResponsiveFontSize(13) }}
                  >
                    Prerequisites
                  </Text>
                  <PrerequisiteDependencyMarker
                    prerequisites={stage.prerequisites}
                    compact={false}
                  />
                </View>
              )}
            </>
          ) : (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                className="text-muted mt-4"
                style={{ fontSize: getResponsiveFontSize(14) }}
              >
                Loading content...
              </Text>
            </View>
          )}
        </View>

        {/* Footer: Next Stage Button */}
        <View className="px-4 py-4 border-t border-border">
          <Pressable
            onPress={handleNextStage}
            disabled={stageNumber >= totalStages || loading}
            className={cn(
              "py-3 px-4 rounded-lg items-center justify-center",
              stageNumber >= totalStages
                ? "bg-muted opacity-50"
                : "bg-primary"
            )}
            style={({ pressed }) => [
              {
                opacity: pressed && stageNumber < totalStages ? 0.8 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Text
                className={cn(
                  "font-semibold",
                  stageNumber >= totalStages ? "text-muted" : "text-background"
                )}
                style={{ fontSize: getResponsiveFontSize(14) }}
              >
                {stageNumber >= totalStages ? "🎉 Complete!" : `Next Stage →`}
              </Text>
            )}
          </Pressable>

          {stageNumber >= totalStages && (
            <Text
              className="text-center text-muted mt-2"
              style={{ fontSize: getResponsiveFontSize(12) }}
            >
              You've completed all stages! 🚀
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
