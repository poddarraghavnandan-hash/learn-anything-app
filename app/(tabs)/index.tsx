import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLearning } from "@/lib/learning-store";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, FadeInRight } from "react-native-reanimated";
import {
  getResponsiveFontSize,
  getResponsiveSpacing,
  isSmallScreen,
  isMediumScreen,
  isLargeScreen,
  getResponsiveContainerWidth,
} from "@/lib/responsive";

// ─── Category filter data ────────────────────────────────────────────────────

const TOPIC_CATEGORIES = [
  { key: "all", label: "For You", emoji: "\u2728" },
  { key: "Science", label: "Science", emoji: "\ud83d\udd2c" },
  { key: "Programming", label: "Code", emoji: "\ud83d\udcbb" },
  { key: "AI & Data", label: "AI", emoji: "\ud83e\udd16" },
  { key: "Humanities", label: "Humanities", emoji: "\ud83d\udcdc" },
  { key: "Creative", label: "Creative", emoji: "\ud83c\udfa8" },
  { key: "Business", label: "Business", emoji: "\ud83d\udcbc" },
  { key: "Health", label: "Health", emoji: "\ud83d\udcaa" },
];

// ─── Journey Topic Card ──────────────────────────────────────────────────────

interface JourneyTopic {
  title: string;
  hook: string;
  category: string;
  emoji: string;
  searchQuery: string;
  estimatedMinutes: number;
  thumbnailUrl?: string;
  channelName?: string;
  videoTitle?: string;
}

function JourneyTopicCard({
  topic,
  colors,
  onPress,
  index,
}: {
  topic: JourneyTopic;
  colors: ReturnType<typeof useColors>;
  onPress: (topic: JourneyTopic) => void;
  index: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(350)}>
      <Pressable
        onPress={() => onPress(topic)}
        style={({ pressed }) => [
          styles.journeyCard,
          { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.95 : 1 },
        ]}
      >
        {/* Thumbnail */}
        {topic.thumbnailUrl ? (
          <View style={styles.journeyThumbWrap}>
            <Image source={{ uri: topic.thumbnailUrl }} style={styles.journeyThumb} contentFit="cover" />
            {/* Gradient overlay for text readability */}
            <View style={styles.journeyThumbOverlay} />
            {/* Time badge */}
            <View style={styles.timeBadge}>
              <Text style={styles.timeBadgeText}>{topic.estimatedMinutes} min journey</Text>
            </View>
            {/* Category badge */}
            <View style={[styles.categoryBadge, { backgroundColor: colors.primary + "E0" }]}>
              <Text style={styles.categoryBadgeText}>{topic.emoji} {topic.category}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.journeyThumbPlaceholder, { backgroundColor: colors.primary + "15" }]}>
            <Text style={styles.journeyThumbEmoji}>{topic.emoji}</Text>
            <View style={styles.timeBadge}>
              <Text style={styles.timeBadgeText}>{topic.estimatedMinutes} min journey</Text>
            </View>
          </View>
        )}

        {/* Content */}
        <View style={styles.journeyBody}>
          <Text numberOfLines={2} style={[styles.journeyTitle, { color: colors.foreground }]}>
            {topic.title}
          </Text>
          <Text numberOfLines={2} style={[styles.journeyHook, { color: colors.muted }]}>
            {topic.hook}
          </Text>
          <View style={styles.journeyFooter}>
            <View style={[styles.learnBadge, { backgroundColor: colors.primary + "15" }]}>
              <Text style={[styles.learnBadgeText, { color: colors.primary }]}>Start Learning</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Suggestion Chip ─────────────────────────────────────────────────────────

function SuggestionChip({
  text,
  colors,
  onPress,
  index,
}: {
  text: string;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
  index: number;
}) {
  return (
    <Animated.View entering={FadeInRight.delay(index * 60).duration(300)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.suggestionChip,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Text numberOfLines={1} style={[styles.suggestionText, { color: colors.foreground }]}>
          {text}
        </Text>
        <Text style={[styles.suggestionArrow, { color: colors.primary }]}>{"\u2192"}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Skeleton for loading journey topics ─────────────────────────────────────

function JourneyTopicSkeleton({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.journeyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.journeyThumbPlaceholder, { backgroundColor: colors.muted + "20", height: 160 }]} />
          <View style={styles.journeyBody}>
            <View style={[styles.skeletonLine, { backgroundColor: colors.muted + "25", width: "85%" }]} />
            <View style={[styles.skeletonLine, { backgroundColor: colors.muted + "18", width: "65%", marginTop: 8 }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Main Home Screen ────────────────────────────────────────────────────────

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state, dispatch, addXp } = useLearning();
  const { profile } = state;
  const [askInput, setAskInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const askInputRef = useRef<TextInput>(null);

  // ─── Smart Suggestions (personalized question ideas) ─────────────────────
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const suggestionsMutation = trpc.chat.suggestions.useMutation();

  useEffect(() => {
    if (!profile.onboardingDone || profile.interests.length === 0) return;
    loadSuggestions();
  }, [profile.onboardingDone, profile.interests.length]);

  const loadSuggestions = useCallback(async () => {
    setSuggestionsLoading(true);
    try {
      const result = await suggestionsMutation.mutateAsync({
        interests: profile.interests,
        pastTopics: state.learnerModel.pastTopics.slice(-10),
        confusionPoints: state.learnerModel.confusionPoints.slice(-5),
        strengthAreas: state.learnerModel.strengthAreas.slice(-5),
        questionsAsked: state.learnerModel.questionsAsked,
      });
      if (result.suggestions.length > 0) {
        setSuggestions(result.suggestions);
      }
    } catch {
      // Use interest-based fallbacks
      const fallbacks = profile.interests.slice(0, 4).map((i) => `How does ${i.replace(/-/g, " ")} work?`);
      setSuggestions(fallbacks);
    } finally {
      setSuggestionsLoading(false);
    }
  }, [profile.interests, state.learnerModel]);

  // ─── Journey Topic Suggestions (the main feed) ──────────────────────────
  const [journeyTopics, setJourneyTopics] = useState<JourneyTopic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsLoaded, setTopicsLoaded] = useState(false);
  const journeyTopicsMutation = trpc.journeyTopics.suggest.useMutation();

  useEffect(() => {
    if (!profile.onboardingDone || profile.interests.length === 0) return;
    loadJourneyTopics();
  }, [profile.onboardingDone, profile.interests.length]);

  const loadJourneyTopics = useCallback(async (category?: string) => {
    setTopicsLoading(true);
    try {
      const result = await journeyTopicsMutation.mutateAsync({
        interests: profile.interests,
        skillLevel: profile.skillLevel,
        age: profile.age,
        pastTopics: state.learnerModel.pastTopics.slice(-10),
        strengthAreas: state.learnerModel.strengthAreas.slice(-5),
        confusionPoints: state.learnerModel.confusionPoints.slice(-5),
        category: category || selectedCategory,
      });
      setJourneyTopics(result.topics || []);
      setTopicsLoaded(true);
    } catch {
      setTopicsLoaded(true);
    } finally {
      setTopicsLoading(false);
    }
  }, [profile, state.learnerModel, selectedCategory, journeyTopicsMutation]);

  // ─── Filter by category ────────────────────────────────────────────────────

  const filteredTopics = useMemo(() => {
    if (selectedCategory === "all") return journeyTopics;
    return journeyTopics.filter((t) => t.category === selectedCategory);
  }, [journeyTopics, selectedCategory]);

  // ─── Greeting ──────────────────────────────────────────────────────────────

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const displayName = profile.displayName || (profile.age && profile.age < 16 ? "learner" : null);

  // ─── Quick Burst topic (personalized) ──────────────────────────────────────

  const burstTopic = useMemo(() => {
    if (profile.interests.length === 0) return null;
    const interest = profile.interests[Math.floor(Math.random() * profile.interests.length)];
    return interest.replace(/-/g, " ");
  }, [profile.interests]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleAskSubmit = useCallback(() => {
    if (!askInput.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/(tabs)/ask", params: { q: askInput.trim() } } as any);
    setAskInput("");
  }, [askInput, router]);

  const handleSuggestionPress = useCallback((suggestion: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/(tabs)/ask", params: { q: suggestion } } as any);
  }, [router]);

  const handleJourneyTopicPress = useCallback((topic: JourneyTopic) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to the Ask tab with this topic as the question — starts a full learning journey
    router.push({ pathname: "/(tabs)/ask", params: { q: topic.title } } as any);
  }, [router]);

  const handleCategoryChange = useCallback((key: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(key);
    // Reload topics for the new category
    loadJourneyTopics(key);
  }, [loadJourneyTopics]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadSuggestions(),
      loadJourneyTopics(selectedCategory),
    ]);
    setRefreshing(false);
  }, [loadSuggestions, loadJourneyTopics, selectedCategory]);

  // ─── Render ────────────────────────────────────────────────────────────────

  const renderJourneyTopic = useCallback(
    ({ item, index }: { item: JourneyTopic; index: number }) => (
      <JourneyTopicCard
        topic={item}
        colors={colors}
        onPress={handleJourneyTopicPress}
        index={index}
      />
    ),
    [colors, handleJourneyTopicPress]
  );

  const ListHeader = useMemo(
    () => (
      <View style={styles.headerSection}>
        {/* Greeting */}
        <Animated.View entering={FadeIn.duration(400)}>
          <Text style={[styles.greeting, { color: colors.foreground }]}>
            {greeting}{displayName ? `, ${displayName}` : ""}
          </Text>
        </Animated.View>

        {/* Big Ask Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={[styles.askPrompt, { color: colors.muted }]}>
            What would you like to learn about today?
          </Text>
          <View style={[styles.askBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              ref={askInputRef}
              value={askInput}
              onChangeText={setAskInput}
              placeholder="Type a question or topic..."
              placeholderTextColor={colors.muted + "80"}
              style={[styles.askInput, { color: colors.foreground }]}
              returnKeyType="send"
              onSubmitEditing={handleAskSubmit}
              blurOnSubmit
              multiline={false}
            />
            {askInput.trim().length > 0 && (
              <Pressable
                onPress={handleAskSubmit}
                style={({ pressed }) => [
                  styles.askSendBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={styles.askSendIcon}>{"\u2192"}</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Suggestion Chips */}
        {suggestions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsContainer}
            >
              {suggestions.map((s, i) => (
                <SuggestionChip
                  key={`sug-${i}`}
                  text={s}
                  colors={colors}
                  onPress={() => handleSuggestionPress(s)}
                  index={i}
                />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Quick Burst — personalized */}
        {burstTopic && (
          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/quick-burst" as any);
              }}
              style={({ pressed }) => [
                styles.burstBtn,
                { backgroundColor: colors.warning + "10", borderColor: colors.warning + "25", opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.burstEmoji}>{"\u26A1"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.burstTitle, { color: colors.foreground }]}>Quick Burst</Text>
                <Text numberOfLines={1} style={[styles.burstDesc, { color: colors.muted }]}>
                  60 sec challenge about {burstTopic}
                </Text>
              </View>
              <Text style={[styles.burstArrow, { color: colors.muted }]}>{"\u203A"}</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Category Filter Pills */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>Explore Learning Journeys</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryPillsContainer}
          >
            {TOPIC_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => handleCategoryChange(cat.key)}
                  style={({ pressed }) => [
                    styles.categoryPill,
                    {
                      backgroundColor: isActive ? colors.primary : colors.surface,
                      borderColor: isActive ? colors.primary : colors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.categoryPillText, { color: isActive ? "#FFF" : colors.foreground }]}>
                    {cat.emoji} {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    ),
    [greeting, displayName, askInput, colors, suggestions, burstTopic, selectedCategory, handleAskSubmit, handleSuggestionPress, handleCategoryChange, router]
  );

  // ─── Empty / Loading State ─────────────────────────────────────────────────

  const EmptyFeed = useMemo(() => {
    if (topicsLoading) {
      return <JourneyTopicSkeleton colors={colors} />;
    }
    if (!profile.onboardingDone || profile.interests.length === 0) {
      return (
        <View style={styles.emptyWrap}>
          <Animated.View entering={FadeIn.duration(300)} style={styles.emptyContent}>
            <Text style={styles.emptyEmoji}>{"\ud83c\udf31"}</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Complete onboarding to get started
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.muted }]}>
              Tell us what you're curious about and we'll create personalized learning journeys just for you.
            </Text>
          </Animated.View>
        </View>
      );
    }
    return (
      <View style={styles.emptyWrap}>
        <Animated.View entering={FadeIn.duration(300)} style={styles.emptyContent}>
          <Text style={styles.emptyEmoji}>{"\ud83d\ude80"}</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Preparing your journeys
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.muted }]}>
            We're crafting personalized learning paths based on your interests. Pull down to refresh.
          </Text>
          <Pressable
            onPress={() => loadJourneyTopics(selectedCategory)}
            style={({ pressed }) => [
              styles.refreshBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.refreshBtnText}>Load Journeys</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }, [topicsLoading, profile.onboardingDone, profile.interests.length, colors, selectedCategory, loadJourneyTopics]);

  return (
    <ScreenContainer className="flex-1">
      <FlatList
        data={filteredTopics}
        renderItem={renderJourneyTopic}
        keyExtractor={(item, idx) => `journey-${idx}-${item.title.slice(0, 20)}`}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyFeed}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </ScreenContainer>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  listContent: { paddingBottom: 30 },

  // Header Section
  headerSection: { paddingHorizontal: getResponsiveSpacing(20), paddingTop: getResponsiveSpacing(12), paddingBottom: getResponsiveSpacing(4) },
  greeting: { fontSize: getResponsiveFontSize(28), fontWeight: "800", lineHeight: getResponsiveFontSize(34) },

  // Ask Section
  askPrompt: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: "500",
    marginTop: getResponsiveSpacing(6),
    marginBottom: getResponsiveSpacing(14),
    lineHeight: getResponsiveFontSize(22),
  },
  askBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: getResponsiveSpacing(16),
    paddingVertical: getResponsiveSpacing(14),
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: getResponsiveSpacing(14),
    gap: getResponsiveSpacing(10),
  },
  askInput: {
    flex: 1,
    fontSize: 17,
    padding: 0,
    lineHeight: 22,
    fontWeight: "400",
  },
  askSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  askSendIcon: { color: "#FFF", fontSize: 18, fontWeight: "700" },

  // Suggestion Chips
  suggestionsContainer: { gap: 8, paddingBottom: 16 },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    maxWidth: 260,
  },
  suggestionText: { fontSize: 14, fontWeight: "500", flexShrink: 1 },
  suggestionArrow: { fontSize: 14, fontWeight: "700" },

  // Section Labels
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 8,
  },

  // Category Pills
  categoryPillsContainer: { gap: 8, paddingBottom: 16 },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryPillText: { fontSize: 13, fontWeight: "600" },

  // Journey Topic Cards
  journeyCard: {
    marginHorizontal: getResponsiveSpacing(20),
    marginBottom: getResponsiveSpacing(16),
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  journeyThumbWrap: { position: "relative" },
  journeyThumb: {
    width: "100%",
    height: isSmallScreen() ? 120 : 160,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  journeyThumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  journeyThumbPlaceholder: {
    width: "100%",
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    position: "relative",
  },
  journeyThumbEmoji: { fontSize: 48 },
  timeBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeBadgeText: { color: "#FFF", fontSize: 11, fontWeight: "600" },
  categoryBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryBadgeText: { color: "#FFF", fontSize: 11, fontWeight: "600" },
  journeyBody: { padding: 14 },
  journeyTitle: { fontSize: getResponsiveFontSize(17), fontWeight: "700", lineHeight: getResponsiveFontSize(23) },
  journeyHook: { fontSize: getResponsiveFontSize(14), lineHeight: getResponsiveFontSize(20), marginTop: getResponsiveSpacing(4) },
  journeyFooter: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  learnBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  learnBadgeText: { fontSize: 13, fontWeight: "700" },

  // Quick Burst
  burstBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  burstEmoji: { fontSize: 28 },
  burstTitle: { fontSize: 15, fontWeight: "700" },
  burstDesc: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  burstArrow: { fontSize: 24, fontWeight: "300" },

  // Empty State
  emptyWrap: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 20 },
  emptyContent: { alignItems: "center" },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 21, maxWidth: 300, marginBottom: 20 },
  refreshBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  refreshBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },

  // Skeleton
  skeletonWrap: { paddingHorizontal: 0 },
  skeletonLine: { height: 16, borderRadius: 8 },
});
