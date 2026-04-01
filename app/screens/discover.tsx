import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useLearning } from "@/lib/learning-store";
import * as Haptics from "expo-haptics";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "Programming", label: "Code" },
  { key: "AI & Data", label: "AI" },
  { key: "Science", label: "Science" },
  { key: "Humanities", label: "Humanities" },
  { key: "Business", label: "Business" },
  { key: "Creative", label: "Creative" },
  { key: "Health", label: "Health" },
  { key: "Skills", label: "Skills" },
];

export default function DiscoverScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state, dispatch } = useLearning();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const topicsQuery = trpc.topics.list.useQuery();
  const topics = topicsQuery.data || [];

  const filteredTopics =
    selectedCategory === "all"
      ? topics
      : topics.filter((t) => t.category === selectedCategory);

  const searchedTopics = searchQuery
    ? filteredTopics.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredTopics;

  const handleTopicPress = useCallback(
    (slug: string, name: string, emoji: string) => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Check if user has done the curiosity check for this topic
      const hasCuriosityResult = !!state.curiosityResults?.[slug];
      if (hasCuriosityResult) {
        // Already assessed — go straight to topic ladder
        router.push({ pathname: "/topic/[slug]", params: { slug, name, emoji } } as any);
      } else {
        // First time — do the curiosity check
        router.push({ pathname: "/curiosity-check", params: { slug, name, emoji } } as any);
      }
    },
    [router, state.curiosityResults]
  );

  const toggleFollow = useCallback(
    (slug: string) => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const isFollowing = state.profile.interests.includes(slug);
      const newInterests = isFollowing
        ? state.profile.interests.filter((s) => s !== slug)
        : [...state.profile.interests, slug];
      dispatch({ type: "SET_INTERESTS", payload: newInterests });
    },
    [state.profile.interests, dispatch]
  );

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Discover</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search topics..."
            placeholderTextColor={colors.muted}
            style={[styles.searchInput, { color: colors.foreground }]}
            returnKeyType="done"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}>
              <Text style={{ fontSize: 16, color: colors.muted }}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Category pills */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => {
          const isActive = selectedCategory === item.key;
          return (
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategory(item.key);
              }}
              style={({ pressed }) => [
                styles.categoryPill,
                {
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text
                style={[styles.categoryText, { color: isActive ? "#FFF" : colors.foreground }]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />

      {/* Topics grid */}
      {topicsQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={searchedTopics}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={styles.topicGrid}
          columnWrapperStyle={styles.topicRow}
          renderItem={({ item }) => {
            const isFollowing = state.profile.interests.includes(item.slug);
            return (
              <Pressable
                onPress={() => handleTopicPress(item.slug, item.name, item.emoji)}
                style={({ pressed }) => [
                  styles.topicCard,
                  {
                    backgroundColor: isFollowing ? colors.primary + "15" : colors.surface,
                    borderColor: isFollowing ? colors.primary + "40" : colors.border,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <Text style={styles.topicEmoji}>{item.emoji}</Text>
                <Text style={[styles.topicName, { color: colors.foreground }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.topicCategory, { color: colors.muted }]}>{item.category}</Text>
                <Pressable
                  onPress={() => toggleFollow(item.slug)}
                  style={({ pressed }) => [
                    styles.followChip,
                    {
                      backgroundColor: isFollowing ? colors.primary : "transparent",
                      borderColor: isFollowing ? colors.primary : colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.followChipText, { color: isFollowing ? "#FFF" : colors.muted }]}>
                    {isFollowing ? "Following" : "Follow"}
                  </Text>
                </Pressable>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>No topics found</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  headerTitle: { fontSize: 26, fontWeight: "800" },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 8 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  categoryList: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  categoryPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  categoryText: { fontSize: 13, fontWeight: "600" },
  topicGrid: { paddingHorizontal: 16, paddingBottom: 20 },
  topicRow: { gap: 12, marginBottom: 12 },
  topicCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  topicEmoji: { fontSize: 32, marginBottom: 8 },
  topicName: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  topicCategory: { fontSize: 11, marginBottom: 10 },
  followChip: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  followChipText: { fontSize: 11, fontWeight: "600" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14 },
});
