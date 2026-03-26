/**
 * Multi-Layer Content Card Component
 * 
 * Displays Foundation, DeepDive, and Expert content in expandable tabs.
 * Shows prerequisite badges and dependency markers.
 */

import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { getResponsiveFontSize, getResponsiveSpacing } from "@/lib/responsive";

type ContentLayer = "foundation" | "deepDive" | "expert";

interface ContentLayerData {
  layer: ContentLayer;
  content: string;
  keyPoints: string[];
  estimatedReadTime: number;
}

interface PrerequisiteBadge {
  conceptId: number;
  conceptName: string;
  severity: "low" | "medium" | "high";
  userKnows: boolean;
}

interface MultiLayerContentCardProps {
  conceptName: string;
  conceptDescription?: string;
  foundation?: ContentLayerData;
  deepDive?: ContentLayerData;
  expert?: ContentLayerData;
  prerequisites?: PrerequisiteBadge[];
  userConfidence?: number; // 0-1
  isLoading?: boolean;
  onLayerChange?: (layer: ContentLayer) => void;
  className?: string;
}

const LAYER_TABS: Array<{ id: ContentLayer; label: string; icon: string; color: string }> = [
  { id: "foundation", label: "Foundation", icon: "🌱", color: "#10B981" },
  { id: "deepDive", label: "Deep Dive", icon: "🔍", color: "#3B82F6" },
  { id: "expert", label: "Expert", icon: "🚀", color: "#8B5CF6" },
];

export function MultiLayerContentCard({
  conceptName,
  conceptDescription,
  foundation,
  deepDive,
  expert,
  prerequisites = [],
  userConfidence = 0,
  isLoading = false,
  onLayerChange,
  className,
}: MultiLayerContentCardProps) {
  const colors = useColors();
  const [activeLayer, setActiveLayer] = useState<ContentLayer>("foundation");
  const [expandedKeyPoints, setExpandedKeyPoints] = useState(false);

  const handleLayerChange = (layer: ContentLayer) => {
    setActiveLayer(layer);
    onLayerChange?.(layer);
  };

  const getLayerData = (): ContentLayerData | undefined => {
    switch (activeLayer) {
      case "foundation":
        return foundation;
      case "deepDive":
        return deepDive;
      case "expert":
        return expert;
    }
  };

  const currentLayer = getLayerData();

  // Determine recommended layer based on user confidence
  const getRecommendedLayer = (): ContentLayer => {
    if (userConfidence < 0.4) return "foundation";
    if (userConfidence < 0.7) return "deepDive";
    return "expert";
  };

  const recommendedLayer = getRecommendedLayer();
  const isRecommended = activeLayer === recommendedLayer;

  return (
    <View className={cn("bg-surface rounded-2xl overflow-hidden border border-border", className)}>
      {/* Header */}
      <View className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b border-border">
        <Text className="text-lg font-bold text-foreground">{conceptName}</Text>
        {conceptDescription && (
          <Text className="text-sm text-muted mt-1">{conceptDescription}</Text>
        )}
      </View>

      {/* Layer Tabs */}
      <View className="flex-row border-b border-border bg-background">
        {LAYER_TABS.map((tab) => {
          const isActive = activeLayer === tab.id;
          const isRecommendedTab = tab.id === recommendedLayer;

          return (
            <Pressable
              key={tab.id}
              onPress={() => handleLayerChange(tab.id)}
              style={({ pressed }) => [
                {
                  flex: 1,
                  paddingVertical: getResponsiveSpacing(8),
                  paddingHorizontal: getResponsiveSpacing(4),
                  borderBottomWidth: isActive ? 3 : 0,
                  borderBottomColor: isActive ? tab.color : "transparent",
                  backgroundColor: isActive ? colors.surface : colors.background,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View className="items-center gap-1">
                <Text style={{ fontSize: getResponsiveFontSize(20) }}>{tab.icon}</Text>
                <Text
                  className={cn(
                    "text-xs font-semibold text-center",
                    isActive ? "text-foreground" : "text-muted"
                  )}
                >
                  {tab.label}
                </Text>
                {isRecommendedTab && !isActive && (
                  <View className="w-1.5 h-1.5 rounded-full bg-warning" />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Content Area */}
      {isLoading ? (
        <View className="items-center justify-center p-6">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-sm text-muted mt-2">Loading content...</Text>
        </View>
      ) : currentLayer ? (
        <ScrollView className="max-h-96">
          <View className="p-4 gap-4">
            {/* Recommended Badge */}
            {isRecommended && (
              <View className="bg-warning/10 border border-warning rounded-lg p-3 flex-row items-center gap-2">
                <Text className="text-lg">💡</Text>
                <Text className="text-xs text-warning font-semibold flex-1">
                  Recommended for your level
                </Text>
              </View>
            )}

            {/* Main Content */}
            <View className="gap-3">
              <Text
                className="text-sm leading-relaxed text-foreground"
                style={{ fontSize: getResponsiveFontSize(14) }}
              >
                {currentLayer.content}
              </Text>

              {/* Read Time */}
              <View className="flex-row items-center gap-2">
                <Text className="text-xs text-muted">⏱️</Text>
                <Text className="text-xs text-muted">
                  {currentLayer.estimatedReadTime} min read
                </Text>
              </View>
            </View>

            {/* Key Points */}
            {currentLayer.keyPoints.length > 0 && (
              <View className="gap-2">
                <Pressable
                  onPress={() => setExpandedKeyPoints(!expandedKeyPoints)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                  <View className="flex-row items-center justify-between bg-primary/5 rounded-lg p-3">
                    <Text className="text-sm font-semibold text-foreground" style={{ fontSize: getResponsiveFontSize(14) }}>
                      Key Points ({currentLayer.keyPoints.length})
                    </Text>
                    <Text className="text-lg">
                      {expandedKeyPoints ? "▼" : "▶"}
                    </Text>
                  </View>
                </Pressable>

                {expandedKeyPoints && (
                  <View className="gap-2 pl-3 border-l-2 border-primary/30">
                    {currentLayer.keyPoints.map((point, idx) => (
                      <View key={idx} className="flex-row gap-2">
                        <Text className="text-primary font-bold">•</Text>
                        <Text
                          className="text-xs text-foreground flex-1"
                          style={{ fontSize: getResponsiveFontSize(12) }}
                        >
                          {point}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        <View className="items-center justify-center p-6">
          <Text className="text-sm text-muted">No content available for this layer</Text>
        </View>
      )}

      {/* Prerequisites Section */}
      {prerequisites.length > 0 && (
        <View className="border-t border-border p-4 gap-2">
          <Text className="text-xs font-semibold text-muted uppercase">Prerequisites</Text>
          <View className="flex-row flex-wrap gap-2">
            {prerequisites.map((prereq) => (
              <View
                key={prereq.conceptId}
                className={cn(
                  "rounded-full px-3 py-1.5 flex-row items-center gap-1.5",
                  prereq.userKnows
                    ? "bg-success/10 border border-success"
                    : prereq.severity === "high"
                      ? "bg-error/10 border border-error"
                      : prereq.severity === "medium"
                        ? "bg-warning/10 border border-warning"
                        : "bg-muted/10 border border-muted"
                )}
              >
                <Text className="text-xs">
                  {prereq.userKnows ? "✓" : prereq.severity === "high" ? "!" : "○"}
                </Text>
                <Text className="text-xs font-medium text-foreground">
                  {prereq.conceptName}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
