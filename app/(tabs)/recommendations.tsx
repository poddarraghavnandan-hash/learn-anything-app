import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Pressable } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { RecommendationCard } from "@/components/recommendation-card";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

export default function RecommendationsScreen() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<
    | "all"
    | "knowledge_gap"
    | "spaced_repetition"
    | "next_concept"
    | "challenge"
    | "reinforcement"
    | "learning_style_match"
  >("all");

  // Fetch personalized recommendations
  const { data: recommendations, isLoading, refetch } = trpc.recommendations.getPersonalized.useQuery(
    {
      limit: 20,
      includeTypes: filterType === "all" ? undefined : [filterType as any],
    },
    { enabled: true }
  );

  // Dismiss recommendation
  const dismissMutation = trpc.recommendations.dismiss.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Accept recommendation
  const acceptMutation = trpc.recommendations.accept.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleDismiss = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dismissMutation.mutate({ recommendationId: id, reason: "not_interested" });
  };

  const handleAccept = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Find the recommendation to get conceptId
    const rec = recommendations?.find((r) => r.id === id);
    if (rec) {
      acceptMutation.mutate({ recommendationId: id, conceptId: rec.conceptId });
    }
  };

  const filterTypes = [
    { label: "All", value: "all" },
    { label: "Knowledge Gaps", value: "knowledge_gap" },
    { label: "Review", value: "spaced_repetition" },
    { label: "Next Steps", value: "next_concept" },
    { label: "Challenges", value: "challenge" },
  ] as const;

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: colors.foreground,
              marginBottom: 8,
            }}
          >
            Recommended for You
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.muted,
              lineHeight: 20,
            }}
          >
            Personalized learning suggestions based on your progress and learning style
          </Text>
        </View>

        {/* Filter Tabs */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 12,
            paddingVertical: 8,
            gap: 8,
            marginBottom: 16,
          }}
        >
          {filterTypes.map((filter) => (
            <Pressable
              key={filter.value}
              onPress={() => setFilterType(filter.value as any)}
              style={({ pressed }) => ({
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor:
                  filterType === filter.value ? colors.primary : colors.surface,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color:
                    filterType === filter.value ? "white" : colors.foreground,
                }}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Loading State */}
        {isLoading && (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 40,
            }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              style={{
                marginTop: 12,
                color: colors.muted,
                fontSize: 14,
              }}
            >
              Loading recommendations...
            </Text>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && (!recommendations || recommendations.length === 0) && (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 40,
              paddingHorizontal: 32,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.foreground,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              No recommendations yet
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.muted,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              Keep learning and completing quizzes to unlock personalized recommendations
            </Text>
          </View>
        )}

        {/* Recommendations List */}
        {!isLoading && recommendations && recommendations.length > 0 && (
          <View style={{ paddingHorizontal: 12, paddingBottom: 24 }}>
            {recommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                id={rec.id}
                conceptName={rec.conceptName}
                type={rec.type}
                priority={rec.priority}
                reason={rec.reason}
                estimatedTime={rec.estimatedTime}
                successProbability={rec.successProbability}
                engagementScore={rec.engagementScore}
                difficulty={rec.difficulty}
                onAccept={handleAccept}
                onDismiss={handleDismiss}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}


