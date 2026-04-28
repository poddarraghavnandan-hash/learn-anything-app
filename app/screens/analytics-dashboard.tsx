import { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLearning } from "@/lib/learning-store";
import { getLevel } from "@/shared/types";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getDaysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2.getTime() - d1.getTime()) / 86400000);
}

// ─── Progress Bar Component ─────────────────────────────────────────────────
function ProgressBar({
  value,
  max,
  color,
  backgroundColor,
}: {
  value: number;
  max: number;
  color: string;
  backgroundColor: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <View style={[styles.progressBar, { backgroundColor }]}>
      <View
        style={[styles.progressFill, { backgroundColor: color, width: `${pct}%` }]}
      />
    </View>
  );
}

export default function AnalyticsDashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state } = useLearning();
  const { profile, spacedRep, journeys, engagements } = state;

  const levelInfo = getLevel(profile.totalXp);

  // ─── Compute Analytics ──────────────────────────────────────────────────────
  const analytics = useMemo(() => {
    const today = getToday();

    // Streak info
    const streak = profile.currentStreak;
    const longestStreak = profile.longestStreak;

    // Review stats
    const totalReviewCards = spacedRep.length;
    const dueToday = spacedRep.filter((item) => item.nextReviewDate <= today).length;
    const mastered = spacedRep.filter((item) => item.memoryStrength >= 80).length;
    const learning = spacedRep.filter(
      (item) => item.memoryStrength >= 40 && item.memoryStrength < 80
    ).length;
    const weak = spacedRep.filter((item) => item.memoryStrength < 40).length;
    const avgMemory =
      totalReviewCards > 0
        ? Math.round(
            spacedRep.reduce((sum, item) => sum + item.memoryStrength, 0) /
              totalReviewCards
          )
        : 0;

    // Topic breakdown
    const topicMap = new Map<
      string,
      { count: number; totalMemory: number; mastered: number }
    >();
    spacedRep.forEach((item) => {
      const slug = item.topicSlug || "general";
      const existing = topicMap.get(slug) || {
        count: 0,
        totalMemory: 0,
        mastered: 0,
      };
      existing.count += 1;
      existing.totalMemory += item.memoryStrength;
      if (item.memoryStrength >= 80) existing.mastered += 1;
      topicMap.set(slug, existing);
    });
    const topicBreakdown = Array.from(topicMap.entries())
      .map(([slug, data]) => ({
        slug,
        name: slug.replace(/-/g, " "),
        count: data.count,
        avgMemory: Math.round(data.totalMemory / data.count),
        mastered: data.mastered,
        progress: Math.round((data.mastered / data.count) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // Journey stats
    const completedJourneys = journeys.filter(
      (j) => j.stages && j.stages.every((s: any) => s.completed)
    ).length;
    const totalJourneys = journeys.length;

    // Quiz accuracy
    const quizAccuracy =
      profile.totalQuizAttempted > 0
        ? Math.round(
            (profile.totalQuizCorrect / profile.totalQuizAttempted) * 100
          )
        : 0;

    // Time stats
    const totalMinutes = profile.totalMinutes;
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    return {
      streak,
      longestStreak,
      totalReviewCards,
      dueToday,
      mastered,
      learning,
      weak,
      avgMemory,
      topicBreakdown,
      completedJourneys,
      totalJourneys,
      quizAccuracy,
      totalHours,
      remainingMinutes,
      totalMinutes,
      totalXp: profile.totalXp,
      level: levelInfo.level,
      xpToNext: levelInfo.xpForNext,
      xpForLevel: 500,
    };
  }, [profile, spacedRep, journeys, engagements, levelInfo]);

  return (
    <ScreenContainer
      edges={["top", "bottom", "left", "right"]}
      className="p-4"
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web")
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.headerBack, { color: colors.primary }]}>
              ← Back
            </Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Learning Analytics
          </Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Level & XP Card */}
        <Animated.View
          entering={FadeInDown.delay(100)}
          style={[
            styles.card,
            { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" },
          ]}
        >
          <View style={styles.levelRow}>
            <View>
              <Text style={[styles.levelLabel, { color: colors.primary }]}>
                Level {analytics.level}
              </Text>
              <Text style={[styles.xpText, { color: colors.foreground }]}>
                {analytics.totalXp.toLocaleString()} XP
              </Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelEmoji}>
                {analytics.level >= 10
                  ? "🏆"
                  : analytics.level >= 5
                  ? "⭐"
                  : "🌱"}
              </Text>
            </View>
          </View>
          <ProgressBar
            value={analytics.xpForLevel - analytics.xpToNext}
            max={analytics.xpForLevel}
            color={colors.primary}
            backgroundColor={colors.primary + "20"}
          />
          <Text style={[styles.xpRemaining, { color: colors.muted }]}>
            {analytics.xpToNext} XP to next level
          </Text>
        </Animated.View>

        {/* Streak & Time */}
        <Animated.View
          entering={FadeInDown.delay(200)}
          style={styles.statsGrid}
        >
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {analytics.streak}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>
              Day Streak
            </Text>
            <Text style={[styles.statSub, { color: colors.muted }]}>
              Best: {analytics.longestStreak}
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={styles.statEmoji}>⏱️</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {analytics.totalHours > 0
                ? `${analytics.totalHours}h ${analytics.remainingMinutes}m`
                : `${analytics.remainingMinutes}m`}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>
              Total Time
            </Text>
            <Text style={[styles.statSub, { color: colors.muted }]}>
              Learning
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={styles.statEmoji}>🎯</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {analytics.quizAccuracy}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>
              Quiz Accuracy
            </Text>
            <Text style={[styles.statSub, { color: colors.muted }]}>
              {profile.totalQuizAttempted} attempted
            </Text>
          </View>
        </Animated.View>

        {/* Memory Overview */}
        <Animated.View
          entering={FadeInDown.delay(300)}
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Memory Overview
          </Text>
          <View style={styles.memoryStats}>
            <View style={styles.memoryRow}>
              <View
                style={[styles.memoryDot, { backgroundColor: colors.success }]}
              />
              <Text style={[styles.memoryLabel, { color: colors.foreground }]}>
                Mastered
              </Text>
              <Text style={[styles.memoryCount, { color: colors.success }]}>
                {analytics.mastered}
              </Text>
            </View>
            <View style={styles.memoryRow}>
              <View
                style={[styles.memoryDot, { backgroundColor: colors.warning }]}
              />
              <Text style={[styles.memoryLabel, { color: colors.foreground }]}>
                Learning
              </Text>
              <Text style={[styles.memoryCount, { color: colors.warning }]}>
                {analytics.learning}
              </Text>
            </View>
            <View style={styles.memoryRow}>
              <View
                style={[styles.memoryDot, { backgroundColor: colors.error }]}
              />
              <Text style={[styles.memoryLabel, { color: colors.foreground }]}>
                Needs Review
              </Text>
              <Text style={[styles.memoryCount, { color: colors.error }]}>
                {analytics.weak}
              </Text>
            </View>
          </View>
          {analytics.totalReviewCards > 0 && (
            <View style={styles.avgMemoryRow}>
              <Text style={[styles.avgMemoryLabel, { color: colors.muted }]}>
                Average Memory Strength
              </Text>
              <Text
                style={[
                  styles.avgMemoryValue,
                  {
                    color:
                      analytics.avgMemory >= 70
                        ? colors.success
                        : analytics.avgMemory >= 40
                        ? colors.warning
                        : colors.error,
                  },
                ]}
              >
                {analytics.avgMemory}%
              </Text>
            </View>
          )}
          {analytics.dueToday > 0 && (
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web")
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/screens/review-session" as any);
              }}
              style={({ pressed }) => [
                styles.reviewButton,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={styles.reviewButtonText}>
                Review {analytics.dueToday} Due Card
                {analytics.dueToday !== 1 ? "s" : ""}
              </Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Topics Mastered */}
        <Animated.View
          entering={FadeInDown.delay(400)}
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Topics Progress
          </Text>
          {analytics.topicBreakdown.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              Complete lessons to see topic progress here.
            </Text>
          ) : (
            analytics.topicBreakdown.map((topic, idx) => (
              <Animated.View
                key={topic.slug}
                entering={FadeInDown.delay(450 + idx * 60)}
                style={styles.topicItem}
              >
                <View style={styles.topicHeader}>
                  <Text
                    style={[
                      styles.topicName,
                      { color: colors.foreground },
                    ]}
                  >
                    {topic.name}
                  </Text>
                  <Text style={[styles.topicProgress, { color: colors.muted }]}>
                    {topic.mastered}/{topic.count} mastered
                  </Text>
                </View>
                <ProgressBar
                  value={topic.progress}
                  max={100}
                  color={
                    topic.progress >= 80
                      ? colors.success
                      : topic.progress >= 50
                      ? colors.primary
                      : colors.warning
                  }
                  backgroundColor={colors.border}
                />
                <Text style={[styles.topicMemory, { color: colors.muted }]}>
                  Avg memory: {topic.avgMemory}%
                </Text>
              </Animated.View>
            ))
          )}
        </Animated.View>

        {/* Journey Stats */}
        <Animated.View
          entering={FadeInDown.delay(500)}
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Learning Journeys
          </Text>
          <View style={styles.journeyStats}>
            <View style={styles.journeyStat}>
              <Text
                style={[styles.journeyValue, { color: colors.foreground }]}
              >
                {analytics.completedJourneys}
              </Text>
              <Text style={[styles.journeyLabel, { color: colors.muted }]}>
                Completed
              </Text>
            </View>
            <View
              style={[
                styles.journeyDivider,
                { backgroundColor: colors.border },
              ]}
            />
            <View style={styles.journeyStat}>
              <Text
                style={[styles.journeyValue, { color: colors.foreground }]}
              >
                {analytics.totalJourneys}
              </Text>
              <Text style={[styles.journeyLabel, { color: colors.muted }]}>
                Total
              </Text>
            </View>
            <View
              style={[
                styles.journeyDivider,
                { backgroundColor: colors.border },
              ]}
            />
            <View style={styles.journeyStat}>
              <Text
                style={[styles.journeyValue, { color: colors.foreground }]}
              >
                {profile.perfectJourneys}
              </Text>
              <Text style={[styles.journeyLabel, { color: colors.muted }]}>
                Perfect
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerBack: { fontSize: 16, fontWeight: "600" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  levelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  levelLabel: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  xpText: { fontSize: 28, fontWeight: "700" },
  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  levelEmoji: { fontSize: 32 },
  xpRemaining: { fontSize: 12, marginTop: 6 },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
  },
  statEmoji: { fontSize: 24, marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: "700", marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: "500" },
  statSub: { fontSize: 10, marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 16 },
  memoryStats: { gap: 10, marginBottom: 16 },
  memoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  memoryDot: { width: 10, height: 10, borderRadius: 5 },
  memoryLabel: { fontSize: 14, flex: 1 },
  memoryCount: { fontSize: 16, fontWeight: "700" },
  avgMemoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  avgMemoryLabel: { fontSize: 13 },
  avgMemoryValue: { fontSize: 18, fontWeight: "700" },
  reviewButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  reviewButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  topicItem: { marginBottom: 16 },
  topicHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  topicName: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  topicProgress: { fontSize: 12 },
  topicMemory: { fontSize: 11, marginTop: 4 },
  emptyText: { fontSize: 14, textAlign: "center", paddingVertical: 16 },
  journeyStats: { flexDirection: "row", alignItems: "center" },
  journeyStat: { flex: 1, alignItems: "center" },
  journeyValue: { fontSize: 24, fontWeight: "700", marginBottom: 4 },
  journeyLabel: { fontSize: 12 },
  journeyDivider: { width: 1, height: 40 },
});
