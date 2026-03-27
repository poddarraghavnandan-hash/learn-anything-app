import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { cn } from "@/lib/utils";
import { getResponsiveFontSize, getResponsiveSpacing } from "@/lib/responsive";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

export interface RefresherSection {
  title: string;
  content: string;
  conceptId: number;
  difficulty: "foundation" | "intermediate" | "advanced";
  keyPoints: string[];
}

export interface PersonalizedRefresherCardProps {
  title: string;
  intensity: "quick" | "medium" | "full";
  sections: RefresherSection[];
  estimatedTime: number;
  keyTakeaways: string[];
  onComplete?: () => void;
  onNeedMore?: () => void;
}

export function PersonalizedRefresherCard({
  title,
  intensity,
  sections,
  estimatedTime,
  keyTakeaways,
  onComplete,
  onNeedMore,
}: PersonalizedRefresherCardProps) {
  const colors = useColors();
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const intensityLabel = {
    quick: "Quick Recap",
    medium: "Medium Refresher",
    full: "Full Refresher",
  }[intensity];

  const intensityColor = {
    quick: "#4ADE80",
    medium: "#FBBF24",
    full: "#60A5FA",
  }[intensity];

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} scrollEnabled={true} showsVerticalScrollIndicator={true}>
      <View
        className="bg-surface rounded-2xl p-3 mb-4 border border-border"
        style={{ marginHorizontal: getResponsiveSpacing(12) }}
      >
        {/* Header */}
        <View className="mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text
              className="font-bold text-foreground flex-1"
              style={{ fontSize: getResponsiveFontSize(16) }}
              numberOfLines={2}
            >
              {title}
            </Text>
          </View>

          {/* Metadata */}
          <View className="flex-row items-center gap-2 flex-wrap">
            <View
              className="px-2 py-1 rounded-full"
              style={{ backgroundColor: intensityColor + "20" }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: intensityColor, fontSize: getResponsiveFontSize(11) }}
              >
                {intensityLabel}
              </Text>
            </View>
            <Text className="text-muted text-xs" style={{ fontSize: getResponsiveFontSize(11) }}>
              {estimatedTime} min read
            </Text>
          </View>
        </View>

        {/* Sections */}
        <View className="gap-2 mb-3">
          {sections.map((section, index) => (
            <View key={index} className="border border-border rounded-lg overflow-hidden">
              <Pressable
                onPress={() => toggleSection(index)}
                style={({ pressed }) => [
                  {
                    backgroundColor: pressed ? colors.border : colors.background,
                    padding: getResponsiveSpacing(10),
                  },
                ]}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text
                      className="font-semibold text-foreground"
                      style={{ fontSize: getResponsiveFontSize(13) }}
                      numberOfLines={1}
                    >
                      {section.title}
                    </Text>
                    <Text className="text-muted text-xs mt-1" style={{ fontSize: getResponsiveFontSize(10) }}>
                      {section.difficulty === "foundation"
                        ? "Foundation"
                        : section.difficulty === "intermediate"
                          ? "Intermediate"
                          : "Advanced"}
                    </Text>
                  </View>
                  <Text className="text-primary font-bold ml-2" style={{ fontSize: getResponsiveFontSize(16) }}>
                    {expandedSections.has(index) ? "−" : "+"}
                  </Text>
                </View>
              </Pressable>

              {/* Expanded Content */}
              {expandedSections.has(index) && (
                <View
                  className="px-3 py-2 bg-background border-t border-border"
                  style={{ paddingHorizontal: getResponsiveSpacing(12) }}
                >
                  <Text
                    className="text-foreground leading-relaxed mb-2"
                    style={{ fontSize: getResponsiveFontSize(12) }}
                  >
                    {section.content}
                  </Text>

                  {/* Key Points */}
                  {section.keyPoints.length > 0 && (
                    <View className="mt-2 pt-2 border-t border-border">
                      <Text
                        className="text-muted font-semibold text-xs mb-1"
                        style={{ fontSize: getResponsiveFontSize(11) }}
                      >
                        Key Points:
                      </Text>
                      {section.keyPoints.map((point, idx) => (
                        <View key={idx} className="flex-row gap-2 mb-1">
                          <Text
                            className="text-primary font-bold"
                            style={{ fontSize: getResponsiveFontSize(11) }}
                          >
                            •
                          </Text>
                          <Text
                            className="text-foreground flex-1"
                            style={{ fontSize: getResponsiveFontSize(11) }}
                            numberOfLines={2}
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
          ))}
        </View>

        {/* Key Takeaways */}
        {keyTakeaways.length > 0 && (
          <View className="mb-3 p-2 bg-primary/10 rounded-lg">
            <Text
              className="text-primary font-semibold text-xs mb-1"
              style={{ fontSize: getResponsiveFontSize(11) }}
            >
              Takeaways:
            </Text>
            {keyTakeaways.map((takeaway, idx) => (
              <Text
                key={idx}
                className="text-foreground text-xs mb-1"
                style={{ fontSize: getResponsiveFontSize(11) }}
                numberOfLines={2}
              >
                • {takeaway}
              </Text>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row gap-2 mt-3">
          <Pressable
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onComplete?.();
            }}
            style={({ pressed }) => [
              {
                flex: 1,
                backgroundColor: colors.primary,
                paddingVertical: getResponsiveSpacing(12),
                borderRadius: 8,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text className="text-background font-semibold text-center" style={{ fontSize: getResponsiveFontSize(12) }}>
              Got It
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onNeedMore?.();
            }}
            style={({ pressed }) => [
              {
                flex: 1,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                paddingVertical: getResponsiveSpacing(12),
                borderRadius: 8,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text className="text-foreground font-semibold text-center" style={{ fontSize: getResponsiveFontSize(12) }}>
              More Help
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
