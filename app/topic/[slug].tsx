import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator, Platform, Image } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useLearning } from "@/lib/learning-store";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";

export default function TopicDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const colors = useColors();
  const { state, dispatch } = useLearning();
  const [refreshing, setRefreshing] = useState(false);

  const feedQuery = trpc.feed.get.useQuery(
    { topicSlugs: [slug], cursor: 0, limit: 30 },
    { enabled: !!slug }
  );

  const refreshMutation = trpc.feed.refresh.useMutation();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshMutation.mutateAsync({ topicSlugs: [slug] });
      await feedQuery.refetch();
    } catch (e) {}
    setRefreshing(false);
  }, [slug, refreshMutation, feedQuery]);

  useEffect(() => {
    if (feedQuery.data?.items?.length === 0 && !refreshing) {
      handleRefresh();
    }
  }, [feedQuery.data, refreshing, handleRefresh]);

  const isFollowing = state.profile.interests.includes(slug);

  const toggleFollow = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newInterests = isFollowing
      ? state.profile.interests.filter((s) => s !== slug)
      : [...state.profile.interests, slug];
    dispatch({ type: "SET_INTERESTS", payload: newInterests });
  }, [isFollowing, state.profile.interests, slug, dispatch]);

  const items = feedQuery.data?.items || [];

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 8 }]}
        >
          <Text style={[styles.backArrow, { color: colors.primary }]}>Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        </Text>
        <Pressable
          onPress={toggleFollow}
          style={({ pressed }) => [
            styles.followBtn,
            {
              backgroundColor: isFollowing ? colors.surface : colors.primary,
              borderColor: isFollowing ? colors.border : colors.primary,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={[styles.followText, { color: isFollowing ? colors.foreground : "#FFF" }]}>
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </Pressable>
      </View>

      {feedQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/content/${item.id}` as any)}
              style={({ pressed }) => [
                styles.listCard,
                { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              {item.thumbnailUrl && (
                <Image source={{ uri: item.thumbnailUrl }} style={styles.listThumb} resizeMode="cover" />
              )}
              <View style={styles.listInfo}>
                <Text style={[styles.listTitle, { color: colors.foreground }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[styles.listMeta, { color: colors.muted }]} numberOfLines={1}>
                  {item.channelOrAuthor} {item.publishedAt ? `· ${item.publishedAt}` : ""}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>No content yet. Pull to refresh!</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  backArrow: { fontSize: 16, fontWeight: "600" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700" },
  followBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  followText: { fontSize: 13, fontWeight: "600" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 },
  listCard: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  listThumb: { width: 120, height: 80 },
  listInfo: { flex: 1, padding: 10, justifyContent: "center" },
  listTitle: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  listMeta: { fontSize: 12, marginTop: 4 },
  emptyText: { fontSize: 14 },
});
