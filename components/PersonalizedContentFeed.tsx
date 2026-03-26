/**
 * PersonalizedContentFeed Component
 * 
 * Displays a personalized feed of content recommendations based on user's
 * knowledge gaps and learning history. Content is sorted by relevance.
 */

import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { getResponsiveFontSize, getResponsiveSpacing } from "@/lib/responsive";

interface ContentItem {
  contentId: number;
  title: string;
  description: string;
  summary: string;
  keyTakeaways: string[];
  prerequisites: Array<{
    conceptId: number;
    conceptName: string;
    userKnows: boolean;
    severity: "low" | "medium" | "high";
  }>;
  recommendedLayer: "foundation" | "deepDive" | "expert";
  suggestedNextTopics: string[];
  estimatedReadTime: number;
  userConfidence: number;
  shouldOfferPrimer: boolean;
  primerConcepts: string[];
}

interface PersonalizedContentFeedProps {
  items: ContentItem[];
  loading?: boolean;
  onRefresh?: () => Promise<void>;
  onSelectContent?: (contentId: number) => void;
  onSelectLayer?: (contentId: number, layer: "foundation" | "deepDive" | "expert") => void;
}

export function PersonalizedContentFeed({
  items,
  loading = false,
  onRefresh,
  onSelectContent,
  onSelectLayer,
}: PersonalizedContentFeedProps) {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
  };

  const getSeverityColor = (severity: "low" | "medium" | "high") => {
    switch (severity) {
      case "high":
        return "text-error";
      case "medium":
        return "text-warning";
      case "low":
        return "text-success";
    }
  };

  const getLayerEmoji = (layer: "foundation" | "deepDive" | "expert") => {
    switch (layer) {
      case "foundation":
        return "🌱";
      case "deepDive":
        return "🔍";
      case "expert":
        return "🚀";
    }
  };

  const renderContentCard = ({ item }: { item: ContentItem }) => {
    const highSeverityGaps = item.prerequisites.filter((p) => !p.userKnows && p.severity === "high");

    return (
      <Pressable
        onPress={() => onSelectContent?.(item.contentId)}
        className="mx-4 mb-3 p-4 bg-surface rounded-lg border border-border active:opacity-70"
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      >
        {/* Header: Title + Layer */}
        <View className="flex-row items-start justify-between gap-2 mb-2">
          <View className="flex-1">
            <Text
              className="font-bold text-foreground"
              style={{ fontSize: getResponsiveFontSize(15) }}
              numberOfLines={2}
            >
              {item.title}
            </Text>
          </View>
          <View className="px-2 py-1 bg-primary/10 rounded">
            <Text
              className="text-primary font-semibold"
              style={{ fontSize: getResponsiveFontSize(12) }}
            >
              {getLayerEmoji(item.recommendedLayer)}
            </Text>
          </View>
        </View>

        {/* Summary */}
        <Text
          className="text-muted mb-3"
          style={{ fontSize: getResponsiveFontSize(13) }}
          numberOfLines={2}
        >
          {item.summary}
        </Text>

        {/* Prerequisite Warning */}
        {highSeverityGaps.length > 0 && (
          <View className="mb-3 p-2 bg-error/10 rounded border border-error/30">
            <Text
              className="text-error text-xs font-semibold"
              style={{ fontSize: getResponsiveFontSize(11) }}
            >
              ⚠️ Learn {highSeverityGaps.map((p) => p.conceptName).join(", ")} first
            </Text>
          </View>
        )}

        {/* Key Takeaways */}
        {item.keyTakeaways.length > 0 && (
          <View className="mb-3">
            <Text
              className="text-foreground text-xs font-semibold mb-1"
              style={{ fontSize: getResponsiveFontSize(11) }}
            >
              Key Takeaways:
            </Text>
            {item.keyTakeaways.slice(0, 2).map((takeaway, idx) => (
              <Text
                key={idx}
                className="text-muted text-xs ml-2"
                style={{ fontSize: getResponsiveFontSize(11) }}
                numberOfLines={1}
              >
                • {takeaway}
              </Text>
            ))}
          </View>
        )}

        {/* Footer: Read Time + Confidence */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Text
              className="text-muted text-xs"
              style={{ fontSize: getResponsiveFontSize(11) }}
            >
              ⏱️ {item.estimatedReadTime} min
            </Text>
            <View className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
              <View
                className="h-full bg-primary"
                style={{ width: `${Math.round(item.userConfidence * 100)}%` }}
              />
            </View>
            <Text
              className="text-muted text-xs"
              style={{ fontSize: getResponsiveFontSize(11) }}
            >
              {Math.round(item.userConfidence * 100)}%
            </Text>
          </View>
          <Text
            className="text-primary font-semibold text-xs"
            style={{ fontSize: getResponsiveFontSize(11) }}
          >
            Read →
          </Text>
        </View>
      </Pressable>
    );
  };

  if (loading && items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          className="text-muted mt-4"
          style={{ fontSize: getResponsiveFontSize(14) }}
        >
          Loading personalized content...
        </Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text
          className="text-2xl mb-2"
          style={{ fontSize: getResponsiveFontSize(24) }}
        >
          🎉
        </Text>
        <Text
          className="font-bold text-foreground text-center mb-2"
          style={{ fontSize: getResponsiveFontSize(16) }}
        >
          No Content Gaps
        </Text>
        <Text
          className="text-muted text-center"
          style={{ fontSize: getResponsiveFontSize(13) }}
        >
          You're doing great! Keep exploring advanced topics or revisit previous concepts.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      renderItem={renderContentCard}
      keyExtractor={(item) => item.contentId.toString()}
      contentContainerStyle={{
        paddingVertical: getResponsiveSpacing(8),
        flexGrow: 1,
      }}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      ListHeaderComponent={
        <View className="mx-4 mb-4">
          <Text
            className="font-bold text-foreground"
            style={{ fontSize: getResponsiveFontSize(18) }}
          >
            📚 For You
          </Text>
          <Text
            className="text-muted mt-1"
            style={{ fontSize: getResponsiveFontSize(13) }}
          >
            Content tailored to your learning gaps
          </Text>
        </View>
      }
      ListFooterComponent={
        items.length > 0 ? (
          <View className="mx-4 mb-4 p-4 bg-surface rounded-lg border border-border">
            <Text
              className="text-muted text-center"
              style={{ fontSize: getResponsiveFontSize(12) }}
            >
              💡 Tip: Start with content marked with 🌱 (Foundation) if you're new to the topic.
            </Text>
          </View>
        ) : null
      }
    />
  );
}
