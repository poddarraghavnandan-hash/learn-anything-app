/**
 * MultiLayerLadderStage Component
 * 
 * Displays a single learning ladder stage with Foundation/DeepDive/Expert layers.
 * Fetches data from backend via useLearningLadder hook.
 */

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { getResponsiveFontSize, getResponsiveSpacing } from "@/lib/responsive";
import { useLearningLadder } from "@/hooks/use-learning-ladder-api";
import { MultiLayerContentCard } from "./MultiLayerContentCard";
import { PrerequisiteDependencyMarker } from "./PrerequisiteDependencyMarker";

interface MultiLayerLadderStageProps {
  topicSlug: string;
  stageNumber?: number;
  onNextStage?: () => void;
  onStageComplete?: (stageNumber: number, layer: "foundation" | "deepDive" | "expert") => void;
}

export function MultiLayerLadderStage({
  topicSlug,
  stageNumber = 1,
  onNextStage,
  onStageComplete,
}: MultiLayerLadderStageProps) {
  const colors = useColors();
  const { stages, isLoadingLadder, progress, recordCompletion, isRecordingCompletion } = useLearningLadder({
    topicSlug,
    enabled: true,
  });

  const [selectedLayer, setSelectedLayer] = useState<"foundation" | "deepDive" | "expert">("foundation");
  const [completedLayers, setCompletedLayers] = useState<Set<"foundation" | "deepDive" | "expert">>(new Set());

  const currentStage = stages?.stages?.[stageNumber - 1];

  useEffect(() => {
    // Initialize completed layers from current stage if available
    if (currentStage) {
      setCompletedLayers(new Set());
    }
  }, [currentStage]);

  const handleMarkComplete = () => {
    const newCompleted = new Set([...completedLayers, selectedLayer]);
    setCompletedLayers(newCompleted);
    recordCompletion({ topicSlug, stageNumber, layerCompleted: selectedLayer });
    onStageComplete?.(stageNumber, selectedLayer);
  };

  const handleNextStage = () => {
    onNextStage?.();
  };

  if (isLoadingLadder) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4" style={{ fontSize: getResponsiveFontSize(14) }}>
          Loading learning ladder...
        </Text>
      </View>
    );
  }

  if (!currentStage) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-4">
        <Text className="text-2xl font-bold text-foreground mb-2" style={{ fontSize: getResponsiveFontSize(20) }}>
          🎉 Complete!
        </Text>
        <Text className="text-muted text-center" style={{ fontSize: getResponsiveFontSize(14) }}>
          You've completed all stages of this learning journey.
        </Text>
      </View>
    );
  }

  const stage = currentStage;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1">
        {/* Header */}
        <View className="bg-surface border-b border-border" style={{ paddingVertical: getResponsiveSpacing(12) }}>
          <View className="px-3">
            {/* Stage Title */}
            <Text
              className="font-bold text-foreground"
              style={{ fontSize: getResponsiveFontSize(20) }}
              numberOfLines={2}
            >
              Stage {stageNumber}: {stage.stageName}
            </Text>

            {/* Stage Description */}
            {stage.stageDescription && (
              <Text
                className="text-muted mt-1"
                style={{ fontSize: getResponsiveFontSize(12) }}
                numberOfLines={2}
              >
                {stage.stageDescription}
              </Text>
            )}

            {/* Progress Bar */}
            <View className="mt-4 h-2 bg-border rounded-full overflow-hidden">
              <View
                className="bg-primary h-full rounded-full"
                style={{
                  width: `${progress ? (progress.currentStage / progress.totalStages) * 100 : (stageNumber / 5) * 100}%`,
                }}
              />
            </View>
          </View>
        </View>

        {/* Content */}
        <View className="flex-1 px-3 py-3">
              {currentStage && (stage.foundation || stage.deepDive || stage.expert) ? (
            <>
              {/* Layer Tabs */}
              <View className="flex-row gap-1 mb-3">
                {[
                  { layer: "foundation" as const, emoji: "🌱", label: "Found" },
                  { layer: "deepDive" as const, emoji: "🔍", label: "Deep" },
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
                        "flex-1 py-1.5 px-1 rounded-lg border",
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
                        style={{ fontSize: getResponsiveFontSize(10) }}
                        numberOfLines={1}
                      >
                        {emoji}
                      </Text>
                      <Text
                        className={cn(
                          "text-center font-semibold text-xs",
                          isSelected ? "text-background" : "text-foreground"
                        )}
                        style={{ fontSize: getResponsiveFontSize(9) }}
                        numberOfLines={1}
                      >
                        {label}{isCompleted && "✓"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Content Card */}
              <MultiLayerContentCard
                conceptName={stage.stageName}
                foundation={stage.foundation ? { layer: "foundation" as const, ...stage.foundation } : undefined}
                deepDive={stage.deepDive ? { layer: "deepDive" as const, ...stage.deepDive } : undefined}
                expert={stage.expert ? { layer: "expert" as const, ...stage.expert } : undefined}
                prerequisites={stage.prerequisites}
                userConfidence={stage.userConfidence}
                onLayerChange={setSelectedLayer}
              />

              {/* Mark Complete Button */}
              <Pressable
                onPress={handleMarkComplete}
                disabled={completedLayers.has(selectedLayer) || isRecordingCompletion}
                className={cn(
                  "py-2 px-3 rounded-lg items-center justify-center mb-4",
                  completedLayers.has(selectedLayer) ? "bg-success" : "bg-primary"
                )}
                style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              >
                {isRecordingCompletion ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text
                    className={cn(
                      "font-semibold text-xs",
                      completedLayers.has(selectedLayer) ? "text-background" : "text-background"
                    )}
                    style={{ fontSize: getResponsiveFontSize(12) }}
                  >
                    {completedLayers.has(selectedLayer) ? "✓ Completed" : "Mark Complete"}
                  </Text>
                )}
              </Pressable>

              {/* Recommended Layer Badge */}
              {selectedLayer !== stage.recommendedLayer && (
                <View className="mt-2 p-2 bg-warning/10 border border-warning rounded-lg">
                  <Text
                    className="text-warning font-semibold text-xs"
                    style={{ fontSize: getResponsiveFontSize(11) }}
                  >
                    💡 Try: {stage.recommendedLayer.charAt(0).toUpperCase() + stage.recommendedLayer.slice(1)}
                  </Text>
                </View>
              )}

              {/* Prerequisites */}
              {stage.prerequisites && stage.prerequisites.length > 0 && (
                <View className="mt-2">
                  <Text
                    className="font-semibold text-foreground mb-1"
                    style={{ fontSize: getResponsiveFontSize(12) }}
                  >
                    Prerequisites
                  </Text>
                  <PrerequisiteDependencyMarker
                    prerequisites={stage.prerequisites}
                  />
                </View>
              )}
            </>
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted" style={{ fontSize: getResponsiveFontSize(14) }}>
                No content available for this stage yet.
              </Text>
            </View>
          )}
        </View>

        {/* Footer: Next Stage Button */}
        <View className="px-3 py-3 border-t border-border">
          <Pressable
            onPress={handleNextStage}
            disabled={!progress || stageNumber >= progress.totalStages}
            className={cn(
              "py-2 px-3 rounded-lg items-center justify-center",
              !progress || stageNumber >= progress.totalStages ? "bg-muted opacity-50" : "bg-primary"
            )}
            style={({ pressed }) => [
              {
                opacity: pressed && progress && stageNumber < progress.totalStages ? 0.8 : 1,
              },
            ]}
          >
            <Text
              className={cn(
                "font-semibold",
                !progress || stageNumber >= progress.totalStages ? "text-muted" : "text-background"
              )}
              style={{ fontSize: getResponsiveFontSize(12) }}
            >
              {!progress || stageNumber >= progress.totalStages ? "🎉 Done!" : `Next →`}
            </Text>
          </Pressable>

          {progress && stageNumber >= progress.totalStages && (
            <Text
              className="text-center text-muted mt-1 text-xs"
              style={{ fontSize: getResponsiveFontSize(10) }}
            >
              All stages complete! 🚀
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
