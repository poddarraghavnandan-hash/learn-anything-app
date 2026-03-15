import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Image,
  ScrollView,
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

export default function FeedScreen() {
  const { state, dispatch, addXp, updateStreak } = useLearning();
  const colors = useColors();
  const router = useRouter();
  const [feedCards, setFeedCards] = useState<FeedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const quizzesGenerated = useRef(false);

  const interests = state.profile.interests;
  const skillLevel = state.profile.skillLevel;

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

  // Get active learning paths (topics with ladders)
  const activePaths = useMemo(() => {
    return Object.entries(state.ladders)
      .map(([slug, ladder]) => {
        const progress = state.topicProgress[slug];
        if (!progress || !ladder) return null;
        const totalSteps = ladder.steps.length;
        const completedCount = progress.completedSteps.length;
        if (completedCount >= totalSteps) return null; // fully completed
        const currentStep = ladder.steps[progress.currentStepIndex];
        return {
          slug,
          name: ladder.topicName,
          currentStepIndex: progress.currentStepIndex,
          currentStepTitle: currentStep?.title || "Next step",
          completedCount,
          totalSteps,
          progress: totalSteps > 0 ? completedCount / totalSteps : 0,
          lastActivity: progress.lastActivityAt,
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b!.lastActivity).getTime() - new Date(a!.lastActivity).getTime())
      .slice(0, 5) as {
        slug: string;
        name: string;
        currentStepIndex: number;
        currentStepTitle: string;
        completedCount: number;
        totalSteps: number;
        progress: number;
        lastActivity: string;
      }[];
  }, [state.ladders, state.topicProgress]);

  const feedQuery = trpc.feed.get.useQuery(
    { topicSlugs: interests.length > 0 ? interests : ["python"], cursor: 0, limit: 20, skillLevel },
    { enabled: state.loaded && state.profile.onboardingDone && interests.length > 0 }
  );

  const refreshMutation = trpc.feed.refresh.useMutation();
  const quizBatchMutation = trpc.quiz.generateBatch.useMutation();

  // Build feed cards from content, then generate real quizzes via LLM
  useEffect(() => {
    if (!feedQuery.data?.items) return;
    const items = feedQuery.data.items;
    if (items.length === 0) {
      setFeedCards([]);
      setLoading(false);
      return;
    }

    const cards: FeedCard[] = [];
    const quizSourceItems: { idx: number; title: string; desc: string; slug: string }[] = [];
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
      if (quizInsertCounter >= 3 && i < items.length - 1) {
        const placeholderIdx = cards.length;
        cards.push({
          id: `quiz-placeholder-${i}`,
          cardType: "quiz",
          quiz: {
            id: `quiz-loading-${i}`,
            question: "Generating a quiz based on what you just saw...",
            options: ["Loading...", "Loading...", "Loading...", "Loading..."],
            correctIndex: 0,
            explanation: "",
            relatedContentTitle: item.title,
            topicSlug: item.topicSlug || "",
            difficulty: "medium",
          },
        });
        quizSourceItems.push({
          idx: placeholderIdx,
          title: item.title,
          desc: item.description || item.title,
          slug: item.topicSlug || "",
        });
        quizInsertCounter = 0;
      }
    }

    setFeedCards(cards);
    setLoading(false);

    // Generate real quizzes via LLM in background
    if (quizSourceItems.length > 0 && !quizzesGenerated.current) {
      quizzesGenerated.current = true;
      const batchItems = quizSourceItems.slice(0, 5).map((q) => ({
        contentTitle: q.title,
        contentDescription: q.desc,
        topicSlug: q.slug,
      }));

      quizBatchMutation
        .mutateAsync({ items: batchItems, skillLevel })
        .then((result) => {
          if (result.quizzes && result.quizzes.length > 0) {
            setFeedCards((prev) => {
              const updated = [...prev];
              result.quizzes.forEach((quiz: any, i: number) => {
                if (i < quizSourceItems.length) {
                  const targetIdx = quizSourceItems[i].idx;
                  if (targetIdx < updated.length && updated[targetIdx].cardType === "quiz") {
                    updated[targetIdx] = {
                      ...updated[targetIdx],
                      quiz: {
                        id: quiz.id,
                        question: quiz.question,
                        options: quiz.options,
                        correctIndex: quiz.correctIndex,
                        explanation: quiz.explanation,
                        relatedContentTitle: quiz.relatedContentTitle,
                        topicSlug: quiz.topicSlug,
                        difficulty: quiz.difficulty || "medium",
                      },
                    };
                  }
                }
              });
              return updated;
            });
          }
        })
        .catch(() => {});
    }
  }, [feedQuery.data, skillLevel]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    quizzesGenerated.current = false;
    try {
      await refreshMutation.mutateAsync({ topicSlugs: interests.slice(0, 5), skillLevel });
      await feedQuery.refetch();
    } catch (e) {}
    setRefreshing(false);
  }, [interests, skillLevel, refreshMutation, feedQuery]);

  // Auto-refresh on first load if no content
  useEffect(() => {
    if (state.loaded && state.profile.onboardingDone && feedQuery.data?.items?.length === 0 && !refreshing) {
      handleRefresh();
    }
  }, [state.loaded, state.profile.onboardingDone, feedQuery.data, refreshing, handleRefresh]);

  const handleContentPress = useCallback(
    (content: ContentItemData) => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/content/${content.id}` as any);
    },
    [router]
  );

  const handleReaction = useCallback(
    (cardId: string, reaction: string, content?: ContentItemData) => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (reaction === "mind_blown") {
        addXp(XP_VALUES.videoComplete);
        dispatch({ type: "INCREMENT_MIND_BLOWN" });
      } else if (reaction === "knew_this") {
        addXp(5);
      } else {
        addXp(3);
      }
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
      if (reaction === "mind_blown" && content) {
        dispatch({
          type: "ADD_SPACED_REP",
          payload: {
            contentId: content.id,
            title: content.title,
            thumbnailUrl: content.thumbnailUrl,
            topicSlug: content.topicSlug,
            easeFactor: 2.5,
            interval: 1,
            repetition: 0,
            lastReviewDate: new Date().toISOString().split("T")[0],
            nextReviewDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
            memoryStrength: 20,
          },
        });
      }
    },
    [addXp, dispatch]
  );

  const handleQuizAnswer = useCallback(
    (quizId: string, answerIndex: number, correctIndex: number, topicSlug?: string) => {
      const correct = answerIndex === correctIndex;
      if (Platform.OS !== "web") {
        if (correct) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      addXp(correct ? XP_VALUES.quizCorrect : XP_VALUES.quizWrong);
      dispatch({ type: "RECORD_QUIZ", payload: { correct, topicSlug } });
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

  const handleContinuePath = useCallback(
    (slug: string) => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const ladder = state.ladders[slug];
      router.push({
        pathname: "/topic/[slug]",
        params: { slug, name: ladder?.topicName || slug, emoji: "" },
      } as any);
    },
    [router, state.ladders]
  );

  const levelInfo = getLevel(state.profile.totalXp);

  const renderCard = useCallback(
    ({ item }: { item: FeedCard }) => {
      if (item.cardType === "quiz" && item.quiz) {
        return (
          <QuizCard
            quiz={item.quiz}
            colors={colors}
            onAnswer={(idx) => handleQuizAnswer(item.id, idx, item.quiz!.correctIndex, item.quiz!.topicSlug)}
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
            onReaction={(r) => handleReaction(item.id, r, item.content)}
            onSave={() => handleSave(item.content!.id)}
          />
        );
      }
      return null;
    },
    [colors, state.savedContentIds, handleContentPress, handleReaction, handleQuizAnswer, handleSave]
  );

  if (!state.loaded) {
    return (
      <ScreenContainer className="flex-1">
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  // Header component for FlatList
  const ListHeader = () => (
    <View>
      {/* Continue Learning Section */}
      {activePaths.length > 0 && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.continueSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Continue Learning</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>Pick up where you left off</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pathsScroll}
          >
            {activePaths.map((path) => (
              <Pressable
                key={path.slug}
                onPress={() => handleContinuePath(path.slug)}
                style={({ pressed }) => [
                  styles.pathCard,
                  {
                    backgroundColor: colors.primary + "08",
                    borderColor: colors.primary + "30",
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <View style={styles.pathHeader}>
                  <Text style={[styles.pathName, { color: colors.foreground }]} numberOfLines={1}>
                    {path.name}
                  </Text>
                  <Text style={[styles.pathProgress, { color: colors.primary }]}>
                    {path.completedCount}/{path.totalSteps}
                  </Text>
                </View>

                {/* Progress bar */}
                <View style={[styles.pathProgressBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.pathProgressFill,
                      { backgroundColor: colors.primary, width: `${path.progress * 100}%` },
                    ]}
                  />
                </View>

                <Text style={[styles.pathStep, { color: colors.muted }]} numberOfLines={1}>
                  Step {path.currentStepIndex + 1}: {path.currentStepTitle}
                </Text>

                <View style={[styles.pathContinueBtn, { backgroundColor: colors.primary }]}>
                  <Text style={styles.pathContinueBtnText}>Continue →</Text>
                </View>
              </Pressable>
            ))}

            {/* Discover new topics card */}
            <Pressable
              onPress={() => router.push("/(tabs)/discover" as any)}
              style={({ pressed }) => [
                styles.pathCard,
                styles.discoverCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>+</Text>
              <Text style={[styles.discoverText, { color: colors.foreground }]}>Start a new{"\n"}learning path</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      )}

      {/* Feed section header */}
      <View style={styles.feedSectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Feed</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
          Curated content based on your interests and level
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Learn</Text>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
            {activePaths.length > 0
              ? `${activePaths.length} active path${activePaths.length > 1 ? "s" : ""}`
              : skillLevel === "beginner"
              ? "Building foundations"
              : skillLevel === "intermediate"
              ? "Growing stronger"
              : "Going deep"}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.xpBadge, { backgroundColor: colors.primary + "20" }]}>
            <Text style={[styles.xpText, { color: colors.primary }]}>
              Lv.{levelInfo.level} {state.profile.totalXp} XP
            </Text>
          </View>
          {state.profile.currentStreak > 0 && (
            <View style={[styles.streakBadge, { backgroundColor: "#FF950020" }]}>
              <Text style={styles.streakText}>{state.profile.currentStreak}d</Text>
            </View>
          )}
        </View>
      </View>

      {loading || feedQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            Curating your personalized feed...
          </Text>
        </View>
      ) : feedCards.length === 0 && activePaths.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔍</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Finding the best content for you</Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            We're searching for {skillLevel}-level content on your topics
          </Text>
          <Pressable
            onPress={handleRefresh}
            style={({ pressed }) => [
              styles.refreshBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Text style={styles.refreshBtnText}>{refreshing ? "Fetching..." : "Refresh Feed"}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={feedCards}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          showsVerticalScrollIndicator={false}
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
          <View style={[styles.tapBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.tapBadgeText}>Tap to learn</Text>
          </View>
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
            {content.topicSlug && (
              <View style={[styles.topicPill, { backgroundColor: colors.primary + "15" }]}>
                <Text style={[styles.topicPillText, { color: colors.primary }]}>
                  {content.topicSlug.replace(/-/g, " ")}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>

      {/* Reaction bar */}
      <View style={[styles.reactionBar, { borderTopColor: colors.border }]}>
        <Pressable onPress={() => onReaction("mind_blown")} style={({ pressed }) => [styles.reactionBtn, { opacity: pressed ? 0.6 : 1 }]}>
          <Text style={styles.reactionEmoji}>🤯</Text>
          <Text style={[styles.reactionLabel, { color: colors.muted }]}>Mind blown</Text>
        </Pressable>
        <Pressable onPress={() => onReaction("knew_this")} style={({ pressed }) => [styles.reactionBtn, { opacity: pressed ? 0.6 : 1 }]}>
          <Text style={styles.reactionEmoji}>✅</Text>
          <Text style={[styles.reactionLabel, { color: colors.muted }]}>Knew this</Text>
        </Pressable>
        <Pressable onPress={onSave} style={({ pressed }) => [styles.reactionBtn, { opacity: pressed ? 0.6 : 1 }]}>
          <Text style={styles.reactionEmoji}>{isSaved ? "💾" : "🔖"}</Text>
          <Text style={[styles.reactionLabel, { color: isSaved ? colors.primary : colors.muted }]}>
            {isSaved ? "Saved" : "Save"}
          </Text>
        </Pressable>
        <Pressable onPress={() => onReaction("skip")} style={({ pressed }) => [styles.reactionBtn, { opacity: pressed ? 0.6 : 1 }]}>
          <Text style={styles.reactionEmoji}>⏭️</Text>
          <Text style={[styles.reactionLabel, { color: colors.muted }]}>Skip</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ─── Quiz Card Component (LearnLM-powered) ──────────────────────────────────

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
  const [showThinkAbout, setShowThinkAbout] = useState(true);
  const isLoading = quiz.question.includes("Generating");

  const handleSelect = (idx: number) => {
    if (revealed || isLoading) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(idx);
    setRevealed(true);
    setShowThinkAbout(false);
    onAnswer(idx);
  };

  const isCorrect = selected === quiz.correctIndex;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={[styles.card, styles.quizCard, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "30" }]}>
      <View style={styles.quizHeader}>
        <Text style={{ fontSize: 20 }}>🧠</Text>
        <Text style={[styles.quizLabel, { color: colors.primary }]}>Quick Check</Text>
        {quiz.difficulty && (
          <View style={[styles.difficultyBadge, {
            backgroundColor: quiz.difficulty === "easy" ? colors.success + "20" : quiz.difficulty === "hard" ? colors.error + "20" : colors.warning + "20",
          }]}>
            <Text style={[styles.difficultyText, {
              color: quiz.difficulty === "easy" ? colors.success : quiz.difficulty === "hard" ? colors.error : colors.warning,
            }]}>
              {quiz.difficulty}
            </Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.quizLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.quizLoadingText, { color: colors.muted }]}>
            Creating a quiz from what you just watched...
          </Text>
        </View>
      ) : (
        <>
          <Text style={[styles.quizQuestion, { color: colors.foreground }]}>{quiz.question}</Text>

          {showThinkAbout && !revealed && (
            <View style={[styles.thinkAbout, { backgroundColor: colors.surface }]}>
              <Text style={[styles.thinkAboutText, { color: colors.muted }]}>
                💡 Think about: {quiz.relatedContentTitle ? `What did you learn from "${quiz.relatedContentTitle}"?` : "What do you already know about this?"}
              </Text>
            </View>
          )}

          <View style={styles.quizOptions}>
            {quiz.options.map((opt, idx) => {
              let bgColor = colors.surface;
              let borderCol = colors.border;
              let textColor = colors.foreground;
              if (revealed) {
                if (idx === quiz.correctIndex) {
                  bgColor = colors.success + "20";
                  borderCol = colors.success;
                  textColor = colors.success;
                } else if (idx === selected) {
                  bgColor = colors.error + "20";
                  borderCol = colors.error;
                  textColor = colors.error;
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
                  <View style={[styles.optionLetter, { backgroundColor: revealed && idx === quiz.correctIndex ? colors.success : colors.primary + "15" }]}>
                    <Text style={[styles.optionLetterText, { color: revealed && idx === quiz.correctIndex ? "#FFF" : colors.primary }]}>
                      {String.fromCharCode(65 + idx)}
                    </Text>
                  </View>
                  <Text style={[styles.quizOptionText, { color: textColor }]}>{opt}</Text>
                  {revealed && idx === quiz.correctIndex && <Text style={{ marginLeft: 8 }}>✓</Text>}
                </Pressable>
              );
            })}
          </View>

          {revealed && (
            <Animated.View entering={FadeInDown.duration(250)} style={[styles.quizExplanation, { backgroundColor: isCorrect ? colors.success + "10" : colors.error + "10" }]}>
              <Text style={styles.resultEmoji}>{isCorrect ? "🎉" : "💪"}</Text>
              <Text style={[styles.resultText, { color: isCorrect ? colors.success : colors.foreground }]}>
                {isCorrect ? "Correct!" : "Not quite — but that's how we learn!"}
              </Text>
              <Text style={[styles.quizExplanationText, { color: colors.foreground }]}>
                {quiz.explanation}
              </Text>
            </Animated.View>
          )}
        </>
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
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  headerRight: { flexDirection: "row", gap: 8, alignItems: "center" },
  xpBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  xpText: { fontSize: 12, fontWeight: "700" },
  streakBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  streakText: { fontSize: 13, fontWeight: "700", color: "#FF9500" },
  loadingText: { marginTop: 12, fontSize: 15 },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: "center", marginBottom: 20 },
  refreshBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  refreshBtnText: { color: "#FFF", fontSize: 15, fontWeight: "600" },

  // Continue Learning section
  continueSection: { paddingTop: 16, paddingBottom: 8 },
  sectionTitle: { fontSize: 20, fontWeight: "800" },
  sectionSubtitle: { fontSize: 13, marginTop: 2, marginBottom: 12 },
  pathsScroll: { gap: 12, paddingRight: 16 },
  pathCard: {
    width: 220,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  pathHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  pathName: { fontSize: 15, fontWeight: "700", flex: 1, marginRight: 8 },
  pathProgress: { fontSize: 13, fontWeight: "700" },
  pathProgressBar: { height: 4, borderRadius: 2, overflow: "hidden", marginBottom: 8 },
  pathProgressFill: { height: "100%", borderRadius: 2 },
  pathStep: { fontSize: 12, marginBottom: 10, lineHeight: 16 },
  pathContinueBtn: { paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  pathContinueBtnText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  discoverCard: { justifyContent: "center", alignItems: "center" },
  discoverText: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  feedSectionHeader: { paddingTop: 8, paddingBottom: 4 },

  // Content cards
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
  tapBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tapBadgeText: { color: "#FFF", fontSize: 11, fontWeight: "600" },
  cardContent: { padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: "700", lineHeight: 22 },
  cardMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  cardSource: { fontSize: 13, flex: 1 },
  topicPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 8 },
  topicPillText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  reactionBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 0.5,
  },
  reactionBtn: { alignItems: "center", paddingHorizontal: 8 },
  reactionEmoji: { fontSize: 20, marginBottom: 2 },
  reactionLabel: { fontSize: 10, fontWeight: "500" },

  // Quiz cards
  quizCard: { padding: 20 },
  quizHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  quizLabel: { fontSize: 14, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  difficultyBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: "auto" },
  difficultyText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  quizLoading: { alignItems: "center", paddingVertical: 20, gap: 12 },
  quizLoadingText: { fontSize: 14, textAlign: "center" },
  quizQuestion: { fontSize: 18, fontWeight: "700", lineHeight: 26, marginBottom: 12 },
  thinkAbout: { padding: 12, borderRadius: 10, marginBottom: 14 },
  thinkAboutText: { fontSize: 13, lineHeight: 18, fontStyle: "italic" },
  quizOptions: { gap: 10 },
  quizOption: { padding: 14, borderRadius: 12, borderWidth: 1.5, flexDirection: "row", alignItems: "center" },
  optionLetter: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: 12 },
  optionLetterText: { fontSize: 13, fontWeight: "700" },
  quizOptionText: { fontSize: 15, fontWeight: "500", flex: 1 },
  quizExplanation: { marginTop: 14, padding: 14, borderRadius: 12 },
  resultEmoji: { fontSize: 24, textAlign: "center", marginBottom: 6 },
  resultText: { fontSize: 16, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  quizExplanationText: { fontSize: 14, lineHeight: 22 },
});
