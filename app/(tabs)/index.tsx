import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useLearning } from "@/lib/learning-store";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { XP_VALUES, getLevel } from "@/shared/types";
import type { FeedCard, ContentItemData, QuizData } from "@/shared/types";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

const { width, height } = Dimensions.get("window");
const CARD_HEIGHT = height - 180;

export default function FeedScreen() {
  const { state, dispatch, addXp, updateStreak } = useLearning();
  const colors = useColors();
  const router = useRouter();
  const [feedCards, setFeedCards] = useState<FeedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const interests = state.profile.interests;

  // Redirect to onboarding if not done
  useEffect(() => {
    if (state.loaded && !state.profile.onboardingDone) {
      router.replace("/onboarding");
    }
  }, [state.loaded, state.profile.onboardingDone, router]);

  // Update streak on mount
  useEffect(() => {
    if (state.loaded && state.profile.onboardingDone) {
      updateStreak();
    }
  }, [state.loaded, state.profile.onboardingDone, updateStreak]);

  const feedQuery = trpc.feed.get.useQuery(
    { topicSlugs: interests.length > 0 ? interests : ["python"], cursor: 0, limit: 20 },
    { enabled: state.loaded && state.profile.onboardingDone && interests.length > 0 }
  );

  const refreshMutation = trpc.feed.refresh.useMutation();
  const quizMutation = trpc.quiz.generate.useMutation();

  // Build feed cards from content
  useEffect(() => {
    if (!feedQuery.data?.items) return;
    const items = feedQuery.data.items;
    const cards: FeedCard[] = [];
    let quizInsertCounter = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      cards.push({
        id: `content-${item.id}`,
        cardType: item.type === "video" ? "video" : "article",
        content: {
          id: item.id,
          externalId: item.externalId,
          type: item.type as "video" | "article",
          title: item.title,
          description: item.description || "",
          url: item.url || "",
          thumbnailUrl: item.thumbnailUrl || "",
          source: item.source,
          channelOrAuthor: item.channelOrAuthor || "",
          durationSeconds: item.durationSeconds || 0,
          topicSlug: item.topicSlug || "",
          publishedAt: item.publishedAt || "",
        },
      });

      quizInsertCounter++;
      // Insert quiz card every 3 content cards
      if (quizInsertCounter >= 3 && i < items.length - 1) {
        cards.push({
          id: `quiz-placeholder-${i}`,
          cardType: "quiz",
          quiz: {
            id: `quiz-${i}`,
            question: `Quick check: What did you learn from "${item.title}"?`,
            options: [
              "I understood the key concepts",
              "I need to review this again",
              "This was completely new to me",
              "I already knew this material",
            ],
            correctIndex: 0,
            explanation: "Every interaction helps us personalize your learning path!",
            relatedContentTitle: item.title,
            topicSlug: item.topicSlug || "",
            difficulty: "easy",
          },
        });
        quizInsertCounter = 0;
      }
    }

    setFeedCards(cards);
    setLoading(false);
  }, [feedQuery.data]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshMutation.mutateAsync({ topicSlugs: interests.slice(0, 5) });
      await feedQuery.refetch();
    } catch (e) {
      // silently fail
    }
    setRefreshing(false);
  }, [interests, refreshMutation, feedQuery]);

  // Auto-refresh on first load if no content
  useEffect(() => {
    if (state.loaded && state.profile.onboardingDone && feedQuery.data?.items?.length === 0 && !refreshing) {
      handleRefresh();
    }
  }, [state.loaded, state.profile.onboardingDone, feedQuery.data, refreshing, handleRefresh]);

  const handleContentPress = useCallback(
    (content: ContentItemData) => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (content.type === "video" && content.url) {
        router.push(`/content/${content.id}`);
      }
    },
    [router]
  );

  const handleReaction = useCallback(
    (cardId: string, reaction: string) => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      addXp(XP_VALUES.videoComplete);
      dispatch({
        type: "RECORD_ENGAGEMENT",
        payload: {
          cardId,
          cardType: "video",
          timeSpentMs: 5000,
          reaction: reaction as any,
          timestamp: Date.now(),
          hourOfDay: new Date().getHours(),
        },
      });
    },
    [addXp, dispatch]
  );

  const handleQuizAnswer = useCallback(
    (quizId: string, answerIndex: number, correctIndex: number) => {
      const correct = answerIndex === correctIndex;
      if (Platform.OS !== "web") {
        if (correct) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      addXp(correct ? XP_VALUES.quizCorrect : XP_VALUES.quizWrong);
      dispatch({ type: "RECORD_QUIZ", payload: { correct } });
    },
    [addXp, dispatch]
  );

  const handleSave = useCallback(
    (contentId: number) => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      dispatch({ type: "TOGGLE_SAVE", payload: contentId });
    },
    [dispatch]
  );

  const levelInfo = getLevel(state.profile.totalXp);

  const renderCard = useCallback(
    ({ item, index }: { item: FeedCard; index: number }) => {
      if (item.cardType === "quiz" && item.quiz) {
        return (
          <QuizCard
            quiz={item.quiz}
            colors={colors}
            onAnswer={(idx) => handleQuizAnswer(item.id, idx, item.quiz!.correctIndex)}
          />
        );
      }

      if (item.content) {
        const isSaved = state.savedContentIds.includes(item.content.id);
        return (
          <ContentCard
            content={item.content}
            colors={colors}
            isSaved={isSaved}
            onPress={() => handleContentPress(item.content!)}
            onReaction={(r) => handleReaction(item.id, r)}
            onSave={() => handleSave(item.content!.id)}
          />
        );
      }

      return null;
    },
    [colors, state.savedContentIds, handleContentPress, handleReaction, handleQuizAnswer, handleSave]
  );

  if (!state.loaded || !state.profile.onboardingDone) {
    return (
      <ScreenContainer className="flex-1">
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Learn</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.xpBadge, { backgroundColor: colors.primary + "20" }]}>
            <Text style={[styles.xpText, { color: colors.primary }]}>
              {state.profile.totalXp} XP
            </Text>
          </View>
          {state.profile.currentStreak > 0 && (
            <View style={[styles.streakBadge, { backgroundColor: "#FF950020" }]}>
              <Text style={styles.streakText}>
                {state.profile.currentStreak}
              </Text>
            </View>
          )}
        </View>
      </View>

      {loading || feedQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            Curating your feed...
          </Text>
        </View>
      ) : feedCards.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔍</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Loading content...</Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            We're fetching the best content for your interests
          </Text>
          <Pressable
            onPress={handleRefresh}
            style={({ pressed }) => [
              styles.refreshBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Text style={styles.refreshBtnText}>
              {refreshing ? "Fetching..." : "Refresh Feed"}
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={feedCards}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 16, gap: 16 }}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      )}
    </ScreenContainer>
  );
}

// ─── Content Card Component ──────────────────────────────────────────────────

function ContentCard({
  content,
  colors,
  isSaved,
  onPress,
  onReaction,
  onSave,
}: {
  content: ContentItemData;
  colors: any;
  isSaved: boolean;
  onPress: () => void;
  onReaction: (r: string) => void;
  onSave: () => void;
}) {
  const isVideo = content.type === "video";
  const duration = content.durationSeconds
    ? `${Math.floor(content.durationSeconds / 60)}:${String(content.durationSeconds % 60).padStart(2, "0")}`
    : null;

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.95 : 1 }]}>
        {/* Thumbnail */}
        <View style={styles.thumbnailContainer}>
          {content.thumbnailUrl ? (
            <Image source={{ uri: content.thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <View style={[styles.thumbnail, { backgroundColor: colors.primary + "30" }]}>
              <Text style={{ fontSize: 40 }}>{isVideo ? "🎬" : "📖"}</Text>
            </View>
          )}
          {isVideo && duration && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{duration}</Text>
            </View>
          )}
          {isVideo && (
            <View style={styles.playOverlay}>
              <Text style={{ fontSize: 36 }}>▶</Text>
            </View>
          )}
        </View>

        {/* Content info */}
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
            {content.title}
          </Text>
          <View style={styles.cardMeta}>
            <Text style={[styles.cardSource, { color: colors.muted }]} numberOfLines={1}>
              {content.channelOrAuthor || content.source}
            </Text>
            {content.publishedAt && (
              <Text style={[styles.cardDate, { color: colors.muted }]}>{content.publishedAt}</Text>
            )}
          </View>
        </View>
      </Pressable>

      {/* Reaction bar */}
      <View style={[styles.reactionBar, { borderTopColor: colors.border }]}>
        <Pressable
          onPress={() => onReaction("mind_blown")}
          style={({ pressed }) => [styles.reactionBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={styles.reactionEmoji}>🤯</Text>
          <Text style={[styles.reactionLabel, { color: colors.muted }]}>Mind blown</Text>
        </Pressable>
        <Pressable
          onPress={() => onReaction("knew_this")}
          style={({ pressed }) => [styles.reactionBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={styles.reactionEmoji}>✅</Text>
          <Text style={[styles.reactionLabel, { color: colors.muted }]}>Knew this</Text>
        </Pressable>
        <Pressable
          onPress={onSave}
          style={({ pressed }) => [styles.reactionBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={styles.reactionEmoji}>{isSaved ? "💾" : "🔖"}</Text>
          <Text style={[styles.reactionLabel, { color: isSaved ? colors.primary : colors.muted }]}>
            {isSaved ? "Saved" : "Save"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onReaction("skip")}
          style={({ pressed }) => [styles.reactionBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={styles.reactionEmoji}>⏭️</Text>
          <Text style={[styles.reactionLabel, { color: colors.muted }]}>Skip</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ─── Quiz Card Component ─────────────────────────────────────────────────────

function QuizCard({
  quiz,
  colors,
  onAnswer,
}: {
  quiz: QuizData;
  colors: any;
  onAnswer: (idx: number) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    onAnswer(idx);
  };

  return (
    <Animated.View entering={FadeIn.duration(300)} style={[styles.card, styles.quizCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "40" }]}>
      <View style={styles.quizHeader}>
        <Text style={{ fontSize: 20 }}>🧠</Text>
        <Text style={[styles.quizLabel, { color: colors.primary }]}>Quick Check</Text>
      </View>
      <Text style={[styles.quizQuestion, { color: colors.foreground }]}>{quiz.question}</Text>
      <View style={styles.quizOptions}>
        {quiz.options.map((opt, idx) => {
          let bgColor = colors.surface;
          let borderCol = colors.border;
          if (revealed) {
            if (idx === quiz.correctIndex) {
              bgColor = colors.success + "30";
              borderCol = colors.success;
            } else if (idx === selected) {
              bgColor = colors.error + "30";
              borderCol = colors.error;
            }
          }
          return (
            <Pressable
              key={idx}
              onPress={() => handleSelect(idx)}
              style={({ pressed }) => [
                styles.quizOption,
                {
                  backgroundColor: bgColor,
                  borderColor: borderCol,
                  opacity: pressed && !revealed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={[styles.quizOptionText, { color: colors.foreground }]}>{opt}</Text>
              {revealed && idx === quiz.correctIndex && <Text style={{ marginLeft: 8 }}>✓</Text>}
            </Pressable>
          );
        })}
      </View>
      {revealed && (
        <View style={[styles.quizExplanation, { backgroundColor: colors.surface }]}>
          <Text style={[styles.quizExplanationText, { color: colors.muted }]}>
            {quiz.explanation}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 26, fontWeight: "800" },
  headerRight: { flexDirection: "row", gap: 8, alignItems: "center" },
  xpBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  xpText: { fontSize: 13, fontWeight: "700" },
  streakBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  streakText: { fontSize: 13, fontWeight: "700", color: "#FF9500" },
  loadingText: { marginTop: 12, fontSize: 15 },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: "center", marginBottom: 20 },
  refreshBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  refreshBtnText: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  thumbnailContainer: { position: "relative", width: "100%", height: 200 },
  thumbnail: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
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
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  cardContent: { padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: "700", lineHeight: 22 },
  cardMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  cardSource: { fontSize: 13, flex: 1 },
  cardDate: { fontSize: 12, marginLeft: 8 },
  reactionBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 0.5,
  },
  reactionBtn: { alignItems: "center", paddingHorizontal: 8 },
  reactionEmoji: { fontSize: 20, marginBottom: 2 },
  reactionLabel: { fontSize: 10, fontWeight: "500" },
  quizCard: { padding: 20 },
  quizHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  quizLabel: { fontSize: 14, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  quizQuestion: { fontSize: 18, fontWeight: "700", lineHeight: 26, marginBottom: 16 },
  quizOptions: { gap: 10 },
  quizOption: { padding: 14, borderRadius: 12, borderWidth: 1.5, flexDirection: "row", alignItems: "center" },
  quizOptionText: { fontSize: 15, fontWeight: "500", flex: 1 },
  quizExplanation: { marginTop: 12, padding: 12, borderRadius: 10 },
  quizExplanationText: { fontSize: 13, lineHeight: 20 },
});
