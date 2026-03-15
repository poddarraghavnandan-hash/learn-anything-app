import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLearning } from "@/lib/learning-store";
import { getLevel } from "@/shared/types";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function ProgressScreen() {
  const colors = useColors();
  const { state } = useLearning();
  const { profile } = state;
  const levelInfo = getLevel(profile.totalXp);

  const quizAccuracy =
    profile.totalQuizAttempted > 0
      ? Math.round((profile.totalQuizCorrect / profile.totalQuizAttempted) * 100)
      : 0;

  const dailyProgress = Math.min(1, state.sessionMinutes / profile.dailyGoalMinutes);

  // Generate last 7 days streak data
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dayName = d.toLocaleDateString("en", { weekday: "short" });
    const dateStr = d.toISOString().split("T")[0];
    const isToday = i === 6;
    const isActive = profile.lastActiveDate === dateStr || (isToday && state.sessionMinutes > 0);
    return { dayName, isActive, isToday };
  });

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Progress</Text>
        </View>

        {/* Level Card */}
        <Animated.View entering={FadeInDown.duration(300).delay(0)} style={[styles.levelCard, { backgroundColor: colors.primary }]}>
          <View style={styles.levelTop}>
            <View>
              <Text style={styles.levelLabel}>Level {levelInfo.level}</Text>
              <Text style={styles.levelName}>{levelInfo.name}</Text>
            </View>
            <View style={styles.xpCircle}>
              <Text style={styles.xpNumber}>{profile.totalXp}</Text>
              <Text style={styles.xpUnit}>XP</Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.round(levelInfo.progress * 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {levelInfo.xpForNext} XP to next level
          </Text>
        </Animated.View>

        {/* Daily Goal */}
        <Animated.View entering={FadeInDown.duration(300).delay(100)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={{ fontSize: 20 }}>🎯</Text>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Daily Goal</Text>
          </View>
          <View style={styles.dailyGoalContent}>
            <View style={[styles.dailyProgressBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.dailyProgressFill,
                  { width: `${Math.round(dailyProgress * 100)}%`, backgroundColor: dailyProgress >= 1 ? colors.success : colors.primary },
                ]}
              />
            </View>
            <Text style={[styles.dailyGoalText, { color: colors.foreground }]}>
              {state.sessionMinutes} / {profile.dailyGoalMinutes} min
            </Text>
            {dailyProgress >= 1 && (
              <Text style={[styles.goalComplete, { color: colors.success }]}>Goal reached! +50 XP</Text>
            )}
          </View>
        </Animated.View>

        {/* Streak */}
        <Animated.View entering={FadeInDown.duration(300).delay(200)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={{ fontSize: 20 }}>🔥</Text>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {profile.currentStreak} Day Streak
            </Text>
          </View>
          <View style={styles.weekRow}>
            {weekDays.map((day, i) => (
              <View key={i} style={styles.dayCol}>
                <View
                  style={[
                    styles.dayDot,
                    {
                      backgroundColor: day.isActive ? "#FF9500" : colors.border,
                      borderWidth: day.isToday ? 2 : 0,
                      borderColor: colors.primary,
                    },
                  ]}
                />
                <Text style={[styles.dayLabel, { color: day.isToday ? colors.foreground : colors.muted }]}>
                  {day.dayName}
                </Text>
              </View>
            ))}
          </View>
          <Text style={[styles.streakRecord, { color: colors.muted }]}>
            Longest streak: {profile.longestStreak} days
          </Text>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.duration(300).delay(300)} style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.statEmoji}>🎬</Text>
            <Text style={[styles.statNumber, { color: colors.foreground }]}>{profile.totalVideos}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Videos</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.statEmoji}>📖</Text>
            <Text style={[styles.statNumber, { color: colors.foreground }]}>{profile.totalArticles}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Articles</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.statEmoji}>🧠</Text>
            <Text style={[styles.statNumber, { color: colors.foreground }]}>{quizAccuracy}%</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Quiz Accuracy</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.statEmoji}>⏱️</Text>
            <Text style={[styles.statNumber, { color: colors.foreground }]}>{profile.totalMinutes}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Minutes</Text>
          </View>
        </Animated.View>

        {/* Spaced Repetition Queue */}
        {state.spacedRep.length > 0 && (
          <Animated.View entering={FadeInDown.duration(300).delay(400)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={{ fontSize: 20 }}>🔄</Text>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Review Queue</Text>
            </View>
            <Text style={[styles.reviewCount, { color: colors.muted }]}>
              {state.spacedRep.filter((s) => s.nextReviewDate <= new Date().toISOString().split("T")[0]).length} items due for review
            </Text>
            {state.spacedRep.slice(0, 3).map((item) => (
              <View key={item.contentId} style={[styles.reviewItem, { borderTopColor: colors.border }]}>
                <View style={styles.reviewInfo}>
                  <Text style={[styles.reviewTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.reviewMeta, { color: colors.muted }]}>
                    Memory: {item.memoryStrength}%
                  </Text>
                </View>
                <View style={[styles.memoryBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.memoryFill,
                      {
                        width: `${item.memoryStrength}%`,
                        backgroundColor:
                          item.memoryStrength > 70 ? colors.success : item.memoryStrength > 40 ? colors.warning : colors.error,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 16 },
  header: { paddingTop: 8, paddingBottom: 4, paddingHorizontal: 4 },
  headerTitle: { fontSize: 26, fontWeight: "800" },
  levelCard: { borderRadius: 20, padding: 20, marginTop: 12 },
  levelTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  levelLabel: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600" },
  levelName: { color: "#FFF", fontSize: 24, fontWeight: "800", marginTop: 2 },
  xpCircle: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", width: 64, height: 64, borderRadius: 32, justifyContent: "center" },
  xpNumber: { color: "#FFF", fontSize: 18, fontWeight: "800" },
  xpUnit: { color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: "600" },
  progressBarBg: { height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.25)" },
  progressBarFill: { height: 8, borderRadius: 4, backgroundColor: "#FFF" },
  progressText: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 8, textAlign: "center" },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 17, fontWeight: "700" },
  dailyGoalContent: { gap: 8 },
  dailyProgressBg: { height: 10, borderRadius: 5 },
  dailyProgressFill: { height: 10, borderRadius: 5 },
  dailyGoalText: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  goalComplete: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  weekRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 12 },
  dayCol: { alignItems: "center", gap: 6 },
  dayDot: { width: 28, height: 28, borderRadius: 14 },
  dayLabel: { fontSize: 11, fontWeight: "500" },
  streakRecord: { fontSize: 12, textAlign: "center" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 12 },
  statCard: { width: "47%", borderRadius: 14, borderWidth: 1, padding: 16, alignItems: "center" },
  statEmoji: { fontSize: 24, marginBottom: 6 },
  statNumber: { fontSize: 24, fontWeight: "800" },
  statLabel: { fontSize: 12, marginTop: 2 },
  reviewCount: { fontSize: 13, marginBottom: 8 },
  reviewItem: { paddingTop: 10, marginTop: 8, borderTopWidth: 0.5 },
  reviewInfo: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  reviewTitle: { fontSize: 14, fontWeight: "600", flex: 1 },
  reviewMeta: { fontSize: 12, marginLeft: 8 },
  memoryBar: { height: 4, borderRadius: 2 },
  memoryFill: { height: 4, borderRadius: 2 },
});
