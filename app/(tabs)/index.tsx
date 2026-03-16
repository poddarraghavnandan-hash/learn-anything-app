import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Linking,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLearning } from "@/lib/learning-store";
import { trpc } from "@/lib/trpc";
import type { FeedCard, ContentItemData, QuizData, InsightData, ReviewData } from "@/shared/types";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, FadeInRight } from "react-native-reanimated";
import { SkeletonFeed } from "@/components/skeleton-card";

// ─── Topic pill data (matches onboarding + discover) ──────────────────────────

const TOPIC_CATEGORIES = [
  { key: "all", label: "For You", emoji: "✨" },
  { key: "Science", label: "Science", emoji: "🔬" },
  { key: "Programming", label: "Code", emoji: "💻" },
  { key: "AI & Data", label: "AI", emoji: "🤖" },
  { key: "Humanities", label: "Humanities", emoji: "📜" },
  { key: "Creative", label: "Creative", emoji: "🎨" },
  { key: "Business", label: "Business", emoji: "💼" },
  { key: "Health", label: "Health", emoji: "💪" },
];

// ─── Feed Card Components ─────────────────────────────────────────────────────

function VideoCard({
  card,
  colors,
  onPress,
}: {
  card: FeedCard;
  colors: ReturnType<typeof useColors>;
  onPress: (card: FeedCard) => void;
}) {
  const content = card.content;
  if (!content) return null;

  const duration = content.durationSeconds
    ? `${Math.floor(content.durationSeconds / 60)}:${String(content.durationSeconds % 60).padStart(2, "0")}`
    : null;

  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      <Pressable
        onPress={() => onPress(card)}
        style={({ pressed }) => [
          styles.feedCard,
          { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.95 : 1 },
        ]}
      >
        {content.thumbnailUrl ? (
          <View style={styles.thumbWrap}>
            <Image source={{ uri: content.thumbnailUrl }} style={styles.thumb} contentFit="cover" />
            {duration && (
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{duration}</Text>
              </View>
            )}
            {content.topicEmoji && (
              <View style={[styles.topicBadge, { backgroundColor: colors.primary + "E0" }]}>
                <Text style={styles.topicBadgeText}>
                  {content.topicEmoji} {content.topicName || content.topicSlug}
                </Text>
              </View>
            )}
          </View>
        ) : null}
        <View style={styles.cardBody}>
          <Text numberOfLines={2} style={[styles.cardTitle, { color: colors.foreground }]}>
            {content.title}
          </Text>
          <View style={styles.cardMeta}>
            <Text numberOfLines={1} style={[styles.cardSource, { color: colors.muted }]}>
              {content.channelOrAuthor || content.source}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function QuizCard({
  card,
  colors,
  onAnswer,
}: {
  card: FeedCard;
  colors: ReturnType<typeof useColors>;
  onAnswer: (correct: boolean, topicSlug: string) => void;
}) {
  const quiz = card.quiz;
  const [selected, setSelected] = useState<number | null>(null);
  if (!quiz) return null;
  const answered = selected !== null;

  const handleSelect = (idx: number) => {
    if (answered) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(idx);
    onAnswer(idx === quiz.correctIndex, quiz.topicSlug);
  };

  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      <View style={[styles.quizFeedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.quizHeader}>
          <Text style={[styles.quizLabel, { color: colors.primary }]}>Quick Check</Text>
          {quiz.topicEmoji && <Text style={{ fontSize: 18 }}>{quiz.topicEmoji}</Text>}
        </View>
        <Text style={[styles.quizQuestion, { color: colors.foreground }]}>{quiz.question}</Text>

        {quiz.options.map((opt, idx) => {
          const isCorrect = idx === quiz.correctIndex;
          const isSelected = idx === selected;
          let bg = "transparent";
          let border = colors.border;
          let textColor = colors.foreground;

          if (answered) {
            if (isCorrect) { bg = colors.success + "20"; border = colors.success; textColor = colors.success; }
            else if (isSelected) { bg = colors.error + "20"; border = colors.error; textColor = colors.error; }
          }

          return (
            <Pressable
              key={idx}
              onPress={() => handleSelect(idx)}
              style={({ pressed }) => [
                styles.quizOption,
                { backgroundColor: bg, borderColor: border, opacity: pressed && !answered ? 0.8 : 1 },
              ]}
            >
              <Text style={[styles.quizOptionText, { color: textColor }]}>{opt}</Text>
            </Pressable>
          );
        })}

        {answered && (
          <Animated.View entering={FadeIn.duration(250)} style={[styles.explanationBox, { backgroundColor: colors.primary + "08" }]}>
            <Text style={[styles.explanationText, { color: colors.muted }]}>{quiz.explanation}</Text>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

function InsightCard({ card, colors }: { card: FeedCard; colors: ReturnType<typeof useColors> }) {
  const insight = card.insight;
  if (!insight) return null;

  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      <View style={[styles.insightCard, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "20" }]}>
        <View style={styles.insightHeader}>
          <Text style={{ fontSize: 18 }}>{insight.emojiA || "💡"}</Text>
          <Text style={[styles.insightConnector, { color: colors.primary }]}>connects to</Text>
          <Text style={{ fontSize: 18 }}>{insight.emojiB || "🔗"}</Text>
        </View>
        <Text style={[styles.insightTitle, { color: colors.foreground }]}>{insight.title}</Text>
        <Text style={[styles.insightBody, { color: colors.muted }]}>{insight.body}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Main Home Screen ─────────────────────────────────────────────────────────

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state, dispatch, addXp } = useLearning();
  const { profile } = state;
  const [askInput, setAskInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  // Feed data — poll every 3s while feed is empty (waiting for background refresh to populate DB)
  const [feedPollEnabled, setFeedPollEnabled] = useState(true);
  const feedQuery = trpc.feed.get.useQuery(
    { topicSlugs: profile.interests, skillLevel: profile.skillLevel },
    {
      enabled: profile.onboardingDone && profile.interests.length > 0,
      refetchInterval: feedPollEnabled ? 3000 : false,
    }
  );
  const refreshMutation = trpc.feed.refresh.useMutation();
  const autoRefreshState = useRef<"idle" | "loading" | "done">("idle");
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  // Stop polling once we have feed items
  useEffect(() => {
    if (feedQuery.data?.items?.length) {
      setFeedPollEnabled(false);
    }
  }, [feedQuery.data?.items?.length]);

  // Topics for the pills
  const topicsQuery = trpc.topics.list.useQuery(undefined, { enabled: profile.onboardingDone });
  const allTopics = topicsQuery.data || [];

  // Transform feed items into FeedCard format
  const feedCards: FeedCard[] = useMemo(() => {
    const items = feedQuery.data?.items || [];
    const cards: FeedCard[] = items.map((item: any, idx: number) => ({
      id: `feed-${item.id || idx}`,
      cardType: (item.type === "video" ? "video" : "article") as FeedCard["cardType"],
      content: {
        id: item.id,
        externalId: item.externalId,
        type: item.type,
        title: item.title,
        description: item.description,
        url: item.url,
        thumbnailUrl: item.thumbnailUrl,
        source: item.source,
        channelOrAuthor: item.channelOrAuthor,
        durationSeconds: item.durationSeconds,
        topicSlug: item.topicSlug,
        topicEmoji: allTopics.find((t) => t.slug === item.topicSlug)?.emoji || "",
        topicName: allTopics.find((t) => t.slug === item.topicSlug)?.name || "",
        publishedAt: item.publishedAt,
      },
    }));
    if (selectedCategory === "all") return cards;
    return cards.filter((c) => {
      const slug = c.content?.topicSlug || "";
      const topic = allTopics.find((t) => t.slug === slug);
      return topic?.category === selectedCategory;
    });
  }, [feedQuery.data, selectedCategory, allTopics]);

  // Auto-refresh on cold start: if onboarding done + interests exist but feed is empty
  // This runs when the feed query resolves with empty data (no content in DB yet)
  useEffect(() => {
    const hasInterests = profile.onboardingDone && profile.interests.length > 0;
    const feedResolved = !feedQuery.isLoading && feedQuery.isFetched;
    const feedEmpty = !feedQuery.data?.items?.length;
    const canAutoRefresh = autoRefreshState.current === "idle" && !refreshMutation.isPending;

    if (hasInterests && feedResolved && feedEmpty && canAutoRefresh) {
      autoRefreshState.current = "loading";
      setIsAutoRefreshing(true);
      refreshMutation
        .mutateAsync({
          topicSlugs: profile.interests.slice(0, 5),
          skillLevel: profile.skillLevel,
        })
        .then(() => {
          autoRefreshState.current = "done";
          // Wait a moment for the DB to be ready, then refetch
          setTimeout(() => {
            feedQuery.refetch().finally(() => setIsAutoRefreshing(false));
          }, 500);
        })
        .catch(() => {
          // Allow retry on failure
          autoRefreshState.current = "idle";
          setIsAutoRefreshing(false);
        });
    }
  }, [profile.onboardingDone, profile.interests.length, feedQuery.isLoading, feedQuery.isFetched, feedQuery.data?.items?.length]);

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const displayName = profile.displayName || (profile.age && profile.age < 16 ? "learner" : null);

  // Handle ask submission — navigate to Ask tab with the question
  const handleAskSubmit = useCallback(() => {
    if (!askInput.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/(tabs)/ask", params: { q: askInput.trim() } } as any);
    setAskInput("");
  }, [askInput, router]);

  // Handle card press
  const handleCardPress = useCallback(
    (card: FeedCard) => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (card.content?.url) {
        router.push({
          pathname: "/content/[id]",
          params: {
            id: String(card.content.id || 0),
            title: card.content.title,
            url: card.content.url,
            thumbnailUrl: card.content.thumbnailUrl || "",
            source: card.content.source || "",
            channelOrAuthor: card.content.channelOrAuthor || "",
            topicSlug: card.content.topicSlug || "",
            topicEmoji: card.content.topicEmoji || "",
            description: card.content.description || "",
          },
        } as any);
      }
    },
    [router]
  );

  // Handle quiz answer
  const handleQuizAnswer = useCallback(
    (correct: boolean, topicSlug: string) => {
      addXp(correct ? 15 : 5);
      dispatch({ type: "RECORD_QUIZ", payload: { correct, topicSlug } });
    },
    [addXp, dispatch]
  );

  // Handle topic pill press — navigate to topic detail
  const handleTopicPress = useCallback(
    (slug: string, name: string, emoji: string) => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const hasCuriosityResult = !!state.curiosityResults?.[slug];
      if (hasCuriosityResult) {
        router.push({ pathname: "/topic/[slug]", params: { slug, name, emoji } } as any);
      } else {
        router.push({ pathname: "/curiosity-check", params: { slug, name, emoji } } as any);
      }
    },
    [router, state.curiosityResults]
  );

  // Refresh feed
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshMutation.mutateAsync({
        topicSlugs: profile.interests.slice(0, 5),
        skillLevel: profile.skillLevel,
      });
      feedQuery.refetch();
    } catch {}
    setRefreshing(false);
  }, [profile.interests, profile.skillLevel, refreshMutation, feedQuery]);

  // ─── Render Feed Item ────────────────────────────────────────────────────────

  const renderFeedItem = useCallback(
    ({ item }: { item: FeedCard }) => {
      switch (item.cardType) {
        case "video":
        case "article":
          return <VideoCard card={item} colors={colors} onPress={handleCardPress} />;
        case "quiz":
          return <QuizCard card={item} colors={colors} onAnswer={handleQuizAnswer} />;
        case "insight":
          return <InsightCard card={item} colors={colors} />;
        default:
          return <VideoCard card={item} colors={colors} onPress={handleCardPress} />;
      }
    },
    [colors, handleCardPress, handleQuizAnswer]
  );

  // ─── Header Component (Ask bar + Topics) ─────────────────────────────────────

  const ListHeader = useMemo(
    () => (
      <View style={styles.headerSection}>
        {/* Greeting */}
        <Animated.View entering={FadeIn.duration(400)}>
          <Text style={[styles.greeting, { color: colors.foreground }]}>
            {greeting}{displayName ? `, ${displayName}` : ""}
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            What would you like to learn today?
          </Text>
        </Animated.View>

        {/* Ask Input Bar */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={[styles.askBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.askIcon}>💬</Text>
            <TextInput
              value={askInput}
              onChangeText={setAskInput}
              placeholder="Ask anything..."
              placeholderTextColor={colors.muted}
              style={[styles.askInput, { color: colors.foreground }]}
              returnKeyType="send"
              onSubmitEditing={handleAskSubmit}
              blurOnSubmit
            />
            {askInput.trim().length > 0 && (
              <Pressable
                onPress={handleAskSubmit}
                style={({ pressed }) => [
                  styles.askSendBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={styles.askSendIcon}>→</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Quick Burst */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/quick-burst" as any);
            }}
            style={({ pressed }) => [
              styles.burstBtn,
              { backgroundColor: colors.warning + "12", borderColor: colors.warning + "30", opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.burstEmoji}>{"\u26A1"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.burstTitle, { color: colors.foreground }]}>Quick Burst</Text>
              <Text style={[styles.burstDesc, { color: colors.muted }]}>60 seconds. Learn one concept.</Text>
            </View>
            <Text style={[styles.burstArrow, { color: colors.muted }]}>{"\u203A"}</Text>
          </Pressable>
        </Animated.View>

        {/* Your Topics (horizontal scroll) */}
        {profile.interests.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>Your Topics</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topicPillsContainer}
            >
              {allTopics
                .filter((t) => profile.interests.includes(t.slug))
                .map((topic) => (
                  <Pressable
                    key={topic.slug}
                    onPress={() => handleTopicPress(topic.slug, topic.name, topic.emoji)}
                    style={({ pressed }) => [
                      styles.topicPill,
                      {
                        backgroundColor: colors.primary + "12",
                        borderColor: colors.primary + "30",
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text style={styles.topicPillEmoji}>{topic.emoji}</Text>
                    <Text style={[styles.topicPillName, { color: colors.foreground }]}>{topic.name}</Text>
                  </Pressable>
                ))}
              {/* Explore more pill */}
              <Pressable
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCategory("all");
                }}
                style={({ pressed }) => [
                  styles.topicPill,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={styles.topicPillEmoji}>+</Text>
                <Text style={[styles.topicPillName, { color: colors.muted }]}>Explore</Text>
              </Pressable>
            </ScrollView>
          </Animated.View>
        )}

        {/* Category Filter Pills */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
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
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategory(cat.key);
                  }}
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

        {/* Feed section label */}
        <View style={styles.feedLabelRow}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>
            {selectedCategory === "all" ? "Your Feed" : `${TOPIC_CATEGORIES.find((c) => c.key === selectedCategory)?.label || ""} Feed`}
          </Text>
        </View>
      </View>
    ),
    [greeting, displayName, askInput, colors, profile.interests, allTopics, selectedCategory, handleAskSubmit, handleTopicPress]
  );

  // ─── Empty State ─────────────────────────────────────────────────────────────

  const isLoadingFeed = feedQuery.isLoading || isAutoRefreshing || refreshMutation.isPending;

  const EmptyFeed = useMemo(
    () => (
      <View style={styles.emptyWrap}>
        {isLoadingFeed ? (
          <View style={styles.emptyContent}>
            <Text style={[styles.emptyTitle, { color: colors.foreground, marginBottom: 4 }]}>
              Loading your feed...
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.muted, marginBottom: 16 }]}>
              Finding the best content for your interests
            </Text>
            <SkeletonFeed />
          </View>
        ) : (
          <Animated.View entering={FadeIn.duration(300)} style={styles.emptyContent}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Your feed is growing
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.muted }]}>
              As you explore topics and ask questions, your personalized feed will fill with content matched to your level and interests.
            </Text>
            <Pressable
              onPress={handleRefresh}
              style={({ pressed }) => [
                styles.refreshBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.refreshBtnText}>Load Content</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    ),
    [isLoadingFeed, colors, handleRefresh]
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <ScreenContainer className="flex-1">
      <FlatList
        data={feedCards}
        renderItem={renderFeedItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyFeed}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </ScreenContainer>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  listContent: { paddingBottom: 20 },

  // Header Section
  headerSection: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  greeting: { fontSize: 26, fontWeight: "800", lineHeight: 32 },
  subtitle: { fontSize: 15, marginTop: 4, marginBottom: 16, lineHeight: 20 },

  // Ask Bar
  askBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    gap: 10,
  },
  askIcon: { fontSize: 18 },
  askInput: { flex: 1, fontSize: 16, padding: 0, lineHeight: 20 },
  askSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  askSendIcon: { color: "#FFF", fontSize: 16, fontWeight: "700" },

  // Section Labels
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  // Topic Pills (your topics)
  topicPillsContainer: { gap: 8, paddingBottom: 16 },
  topicPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  topicPillEmoji: { fontSize: 16 },
  topicPillName: { fontSize: 14, fontWeight: "600" },

  // Category Pills
  categoryPillsContainer: { gap: 8, paddingBottom: 16 },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryPillText: { fontSize: 13, fontWeight: "600" },

  // Feed Label
  feedLabelRow: { marginTop: 4 },

  // Feed Cards
  feedCard: {
    marginHorizontal: 20,
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  thumbWrap: { position: "relative" },
  thumb: { width: "100%", height: 180, borderTopLeftRadius: 15, borderTopRightRadius: 15 },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
  topicBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  topicBadgeText: { color: "#FFF", fontSize: 11, fontWeight: "600" },
  cardBody: { padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: "700", lineHeight: 22 },
  cardMeta: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  cardSource: { fontSize: 13 },

  // Quiz Feed Card
  quizFeedCard: {
    marginHorizontal: 20,
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  quizHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  quizLabel: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  quizQuestion: { fontSize: 17, fontWeight: "700", lineHeight: 24, marginBottom: 14 },
  quizOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  quizOptionText: { fontSize: 15, fontWeight: "500" },
  explanationBox: { marginTop: 8, padding: 12, borderRadius: 10 },
  explanationText: { fontSize: 13, lineHeight: 20 },

  // Insight Card
  insightCard: {
    marginHorizontal: 20,
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  insightHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  insightConnector: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  insightTitle: { fontSize: 16, fontWeight: "700", lineHeight: 22, marginBottom: 6 },
  insightBody: { fontSize: 14, lineHeight: 21 },

  // Empty State
  emptyWrap: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 20 },
  emptyContent: { alignItems: "center" },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 21, maxWidth: 280, marginBottom: 20 },
  refreshBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  refreshBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  burstBtn: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 12, gap: 12 },
  burstEmoji: { fontSize: 28 },
  burstTitle: { fontSize: 15, fontWeight: "700" },
  burstDesc: { fontSize: 12, marginTop: 2 },
  burstArrow: { fontSize: 24, fontWeight: "300" },
});
