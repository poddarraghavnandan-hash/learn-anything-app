import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLearning } from "@/lib/learning-store";
import type { SpacedRepItem } from "@/shared/types";

// ─── SM-2 Rating Scale ──────────────────────────────────────────────────────
const RATINGS = [
  { value: 1, label: "Forgot", color: "#EF4444", emoji: "😵" },
  { value: 2, label: "Hard", color: "#F59E0B", emoji: "😓" },
  { value: 3, label: "Good", color: "#3B82F6", emoji: "🤔" },
  { value: 4, label: "Easy", color: "#22C55E", emoji: "😊" },
  { value: 5, label: "Perfect", color: "#8B5CF6", emoji: "🧠" },
];

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export default function ReviewSessionScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state, dispatch } = useLearning();

  // Get due review items
  const dueItems = useMemo(() => {
    const today = getToday();
    return state.spacedRep.filter(
      (item) => item.nextReviewDate <= today
    );
  }, [state.spacedRep]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionResults, setSessionResults] = useState<
    { contentId: number; rating: number; title: string }[]
  >([]);
  const [isComplete, setIsComplete] = useState(false);

  const flipProgress = useSharedValue(0);

  const currentCard = dueItems[currentIndex];

  const handleFlip = useCallback(() => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFlipped((prev) => !prev);
    flipProgress.value = withTiming(isFlipped ? 0 : 1, { duration: 300 });
  }, [isFlipped, flipProgress]);

  const handleRate = useCallback(
    (rating: number) => {
      if (!currentCard) return;
      if (Platform.OS !== "web")
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Update spaced rep in store
      dispatch({
        type: "UPDATE_SPACED_REP",
        payload: { contentId: currentCard.contentId, rating },
      });

      // Track result
      setSessionResults((prev) => [
        ...prev,
        { contentId: currentCard.contentId, rating, title: currentCard.title },
      ]);

      // Move to next card or complete
      if (currentIndex + 1 < dueItems.length) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
        flipProgress.value = 0;
      } else {
        setIsComplete(true);
      }
    },
    [currentCard, currentIndex, dueItems.length, dispatch, flipProgress]
  );

  const frontStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flipProgress.value, [0, 0.5, 1], [1, 0, 0]),
    transform: [
      { rotateY: `${interpolate(flipProgress.value, [0, 1], [0, 180])}deg` },
    ],
  }));

  const backStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flipProgress.value, [0, 0.5, 1], [0, 0, 1]),
    transform: [
      { rotateY: `${interpolate(flipProgress.value, [0, 1], [180, 360])}deg` },
    ],
  }));

  // ─── Empty State ────────────────────────────────────────────────────────────
  if (dueItems.length === 0 && !isComplete) {
    return (
      <ScreenContainer
        edges={["top", "bottom", "left", "right"]}
        className="p-6"
      >
        <View style={styles.emptyContainer}>
          <Animated.View entering={FadeInDown.delay(100)}>
            <Text style={[styles.emptyEmoji]}>🎉</Text>
            <Text
              style={[
                styles.emptyTitle,
                { color: colors.foreground },
              ]}
            >
              All Caught Up!
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { color: colors.muted },
              ]}
            >
              No reviews due right now. Keep learning and new review cards will
              appear as you complete lessons.
            </Text>
          </Animated.View>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.backButtonText}>Back to Home</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  // ─── Session Complete ───────────────────────────────────────────────────────
  if (isComplete) {
    const avgRating =
      sessionResults.reduce((sum, r) => sum + r.rating, 0) /
      sessionResults.length;
    const perfectCount = sessionResults.filter((r) => r.rating >= 4).length;
    const needsWorkCount = sessionResults.filter((r) => r.rating <= 2).length;

    return (
      <ScreenContainer
        edges={["top", "bottom", "left", "right"]}
        className="p-6"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <Animated.View
            entering={FadeIn.delay(100)}
            style={styles.completeContainer}
          >
            <Text style={styles.completeEmoji}>
              {avgRating >= 4 ? "🏆" : avgRating >= 3 ? "👍" : "💪"}
            </Text>
            <Text
              style={[styles.completeTitle, { color: colors.foreground }]}
            >
              Review Complete!
            </Text>
            <Text
              style={[styles.completeSubtitle, { color: colors.muted }]}
            >
              You reviewed {sessionResults.length} card
              {sessionResults.length !== 1 ? "s" : ""}
            </Text>

            {/* Stats */}
            <View
              style={[
                styles.statsRow,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {perfectCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>
                  Mastered
                </Text>
              </View>
              <View
                style={[styles.statDivider, { backgroundColor: colors.border }]}
              />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {sessionResults.length - perfectCount - needsWorkCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>
                  Good
                </Text>
              </View>
              <View
                style={[styles.statDivider, { backgroundColor: colors.border }]}
              />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.warning }]}>
                  {needsWorkCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>
                  Needs Work
                </Text>
              </View>
            </View>

            {/* Individual Results */}
            <View style={styles.resultsList}>
              {sessionResults.map((result, idx) => {
                const ratingInfo = RATINGS.find(
                  (r) => r.value === result.rating
                );
                return (
                  <Animated.View
                    key={result.contentId}
                    entering={FadeInUp.delay(200 + idx * 80)}
                    style={[
                      styles.resultItem,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.resultTitle, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {result.title}
                    </Text>
                    <View
                      style={[
                        styles.resultBadge,
                        { backgroundColor: ratingInfo?.color + "20" },
                      ]}
                    >
                      <Text style={{ color: ratingInfo?.color, fontSize: 12, fontWeight: "600" }}>
                        {ratingInfo?.label}
                      </Text>
                    </View>
                  </Animated.View>
                );
              })}
            </View>

            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.8 : 1,
                  marginTop: 24,
                },
              ]}
            >
              <Text style={styles.backButtonText}>Done</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ─── Review Card ────────────────────────────────────────────────────────────
  return (
    <ScreenContainer
      edges={["top", "bottom", "left", "right"]}
      className="p-6"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.headerBack, { color: colors.primary }]}>
              ← Back
            </Text>
          </Pressable>
          <Text style={[styles.headerProgress, { color: colors.muted }]}>
            {currentIndex + 1} / {dueItems.length}
          </Text>
        </View>

        {/* Progress Bar */}
        <View
          style={[styles.progressBar, { backgroundColor: colors.border }]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${((currentIndex + 1) / dueItems.length) * 100}%`,
              },
            ]}
          />
        </View>

        {/* Card */}
        <Pressable onPress={handleFlip} style={styles.cardContainer}>
          {/* Front */}
          <Animated.View
            style={[
              styles.card,
              frontStyle,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.cardLabel, { color: colors.muted }]}>
              TAP TO REVEAL
            </Text>
            <Text
              style={[styles.cardTitle, { color: colors.foreground }]}
            >
              {currentCard?.title}
            </Text>
            <Text style={[styles.cardHint, { color: colors.muted }]}>
              Topic: {currentCard?.topicSlug?.replace(/-/g, " ")}
            </Text>
            <View style={styles.cardMemory}>
              <Text style={[styles.memoryLabel, { color: colors.muted }]}>
                Memory Strength
              </Text>
              <View
                style={[
                  styles.memoryBar,
                  { backgroundColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.memoryFill,
                    {
                      backgroundColor:
                        (currentCard?.memoryStrength ?? 0) > 70
                          ? colors.success
                          : (currentCard?.memoryStrength ?? 0) > 40
                          ? colors.warning
                          : colors.error,
                      width: `${currentCard?.memoryStrength ?? 0}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.memoryValue, { color: colors.muted }]}>
                {currentCard?.memoryStrength ?? 0}%
              </Text>
            </View>
          </Animated.View>

          {/* Back */}
          <Animated.View
            style={[
              styles.card,
              styles.cardBack,
              backStyle,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.cardLabel, { color: colors.primary }]}>
              RECALL CHECK
            </Text>
            <Text
              style={[styles.cardQuestion, { color: colors.foreground }]}
            >
              How well do you remember this concept?
            </Text>
            <Text
              style={[styles.cardTitle, { color: colors.foreground }]}
            >
              {currentCard?.title}
            </Text>
            <Text style={[styles.cardDetail, { color: colors.muted }]}>
              Think about the key ideas, examples, and how you would explain
              this to someone else. Then rate your recall below.
            </Text>
          </Animated.View>
        </Pressable>

        {/* Rating Buttons (only show when flipped) */}
        {isFlipped && (
          <Animated.View entering={FadeInUp.delay(100)} style={styles.ratingContainer}>
            <Text style={[styles.ratingLabel, { color: colors.muted }]}>
              How well did you remember?
            </Text>
            <View style={styles.ratingRow}>
              {RATINGS.map((rating) => (
                <Pressable
                  key={rating.value}
                  onPress={() => handleRate(rating.value)}
                  style={({ pressed }) => [
                    styles.ratingButton,
                    {
                      backgroundColor: rating.color + "15",
                      borderColor: rating.color + "40",
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                    },
                  ]}
                >
                  <Text style={styles.ratingEmoji}>{rating.emoji}</Text>
                  <Text
                    style={[styles.ratingText, { color: rating.color }]}
                  >
                    {rating.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Tap hint when not flipped */}
        {!isFlipped && (
          <Animated.View entering={FadeIn} style={styles.tapHint}>
            <Text style={[styles.tapHintText, { color: colors.muted }]}>
              Tap the card to flip it
            </Text>
          </Animated.View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerBack: { fontSize: 16, fontWeight: "600" },
  headerProgress: { fontSize: 14, fontWeight: "500" },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 24,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2 },
  cardContainer: { flex: 1, maxHeight: 400, marginBottom: 24 },
  card: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    justifyContent: "center",
    alignItems: "center",
    backfaceVisibility: "hidden",
  },
  cardBack: {},
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 30,
    marginBottom: 12,
  },
  cardHint: { fontSize: 14, textTransform: "capitalize", marginBottom: 24 },
  cardQuestion: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
  },
  cardDetail: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },
  cardMemory: { width: "100%", alignItems: "center", marginTop: 8 },
  memoryLabel: { fontSize: 12, marginBottom: 6 },
  memoryBar: {
    width: "80%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  memoryFill: { height: "100%", borderRadius: 3 },
  memoryValue: { fontSize: 12, marginTop: 4 },
  ratingContainer: { paddingBottom: 16 },
  ratingLabel: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  ratingButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  ratingEmoji: { fontSize: 20, marginBottom: 4 },
  ratingText: { fontSize: 11, fontWeight: "600" },
  tapHint: { alignItems: "center", paddingBottom: 24 },
  tapHintText: { fontSize: 14 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 64, textAlign: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 24, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignSelf: "center",
  },
  backButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  completeContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: 32,
  },
  completeEmoji: { fontSize: 64, marginBottom: 12 },
  completeTitle: { fontSize: 26, fontWeight: "700", marginBottom: 4 },
  completeSubtitle: { fontSize: 15, marginBottom: 24 },
  statsRow: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    width: "100%",
    marginBottom: 24,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 28, fontWeight: "700", marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: "500" },
  statDivider: { width: 1, marginVertical: 4 },
  resultsList: { width: "100%", gap: 8 },
  resultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  resultTitle: { fontSize: 14, fontWeight: "500", flex: 1, marginRight: 12 },
  resultBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
});
