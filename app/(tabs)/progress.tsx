import { View, Text, ScrollView, StyleSheet, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getResponsiveFontSize, getResponsiveSpacing } from "@/lib/responsive";
import { useLearning } from "@/lib/learning-store";
import { getLevel, BADGE_DEFINITIONS } from "@/shared/types";
import type { BadgeId } from "@/shared/types";
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

  const dailyProgress = Math.min(1, (state.sessionMinutes || 0) / profile.dailyGoalMinutes);

  // Generate last 7 days streak data
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dayName = d.toLocaleDateString("en", { weekday: "short" });
    const dateStr = d.toISOString().split("T")[0];
    const isToday = i === 6;
    const isActive = profile.lastActiveDate === dateStr || (isToday && (state.sessionMinutes || 0) > 0);
    return { dayName, isActive, isToday };
  });

  // Badge checking logic
  const checkBadge = (id: BadgeId): boolean => {
    switch (id) {
      case "first_quiz": return profile.totalQuizAttempted >= 1;
      case "streak_7": return profile.longestStreak >= 7;
      case "streak_30": return profile.longestStreak >= 30;
      case "streak_100": return profile.longestStreak >= 100;
      case "quiz_master_50": return profile.totalQuizCorrect >= 50;
      case "quiz_master_100": return profile.totalQuizCorrect >= 100;
      case "explorer_5": return profile.interests.length >= 5;
      case "explorer_10": return profile.interests.length >= 10;
      case "video_50": return profile.totalVideos >= 50;
      case "article_25": return profile.totalArticles >= 25;
      case "level_5": return levelInfo.level >= 5;
      case "level_10": return levelInfo.level >= 10;
      case "mind_blown_10": return profile.mindBlownCount >= 10;
      case "daily_goal_7": return profile.dailyGoalsCompleted >= 7;
      case "perfect_journey": return (profile.perfectJourneys ?? 0) >= 1;
      case "journey_5": return (profile.totalJourneysCompleted ?? 0) >= 5;
      case "journey_25": return (profile.totalJourneysCompleted ?? 0) >= 25;
      case "check_streak_5": return (profile.bestCheckStreak ?? 0) >= 5;
      case "check_streak_10": return (profile.bestCheckStreak ?? 0) >= 10;
      default: return false;
    }
  };

  const unlockedBadges = BADGE_DEFINITIONS.filter((b) => checkBadge(b.id));
  const lockedBadges = BADGE_DEFINITIONS.filter((b) => !checkBadge(b.id));

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Your Progress</Text>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
            Every step forward is a step toward mastery
          </Text>
        </View>

        {/* Level Card */}
        <Animated.View entering={FadeInDown.duration(300)} style={[styles.levelCard, { backgroundColor: colors.primary }]}>
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
            <Text style={{ fontSize: getResponsiveFontSize(20) }}>{"\u{1F3AF}"}</Text>
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
              {state.sessionMinutes || 0} / {profile.dailyGoalMinutes} min
            </Text>
            {dailyProgress >= 1 && (
              <Text style={[styles.goalComplete, { color: colors.success }]}>Goal reached! +50 XP</Text>
            )}
          </View>
        </Animated.View>

        {/* Streak */}
        <Animated.View entering={FadeInDown.duration(300).delay(200)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={{ fontSize: getResponsiveFontSize(20) }}>{"\u{1F525}"}</Text>
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
            <Text style={styles.statEmoji}>{"\u{1F3AC}"}</Text>
            <Text style={[styles.statNumber, { color: colors.foreground }]}>{profile.totalVideos}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Videos</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.statEmoji}>{"\u{1F4D6}"}</Text>
            <Text style={[styles.statNumber, { color: colors.foreground }]}>{profile.totalArticles}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Articles</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.statEmoji}>{"\u{1F9E0}"}</Text>
            <Text style={[styles.statNumber, { color: colors.foreground }]}>{quizAccuracy}%</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Quiz Accuracy</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.statEmoji}>{"\u{1F92F}"}</Text>
            <Text style={[styles.statNumber, { color: colors.foreground }]}>{profile.mindBlownCount}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Mind Blown</Text>
          </View>
        </Animated.View>

        {/* Journey Stats */}
        <Animated.View entering={FadeInDown.duration(300).delay(350)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={{ fontSize: getResponsiveFontSize(20) }}>{"\u{1F680}"}</Text>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Learning Journeys</Text>
          </View>
          <View style={[styles.statsGrid, { marginTop: 8 }]}>
            <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={styles.statEmoji}>{"\u2705"}</Text>
              <Text style={[styles.statNumber, { color: colors.foreground }]}>{profile.totalJourneysCompleted ?? 0}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Completed</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={styles.statEmoji}>{"\u{1F31F}"}</Text>
              <Text style={[styles.statNumber, { color: colors.foreground }]}>{profile.perfectJourneys ?? 0}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Perfect</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={styles.statEmoji}>{"\u26A1"}</Text>
              <Text style={[styles.statNumber, { color: colors.foreground }]}>{profile.bestCheckStreak ?? 0}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Best Streak</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={styles.statEmoji}>{"\u{1F3C6}"}</Text>
              <Text style={[styles.statNumber, { color: colors.foreground }]}>{profile.checkStreak ?? 0}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Current Streak</Text>
            </View>
          </View>
        </Animated.View>

        {/* Topic Mastery */}
        {state.topicDifficulties.length > 0 && (
          <Animated.View entering={FadeInDown.duration(300).delay(350)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={{ fontSize: getResponsiveFontSize(20) }}>{"\u{1F4CA}"}</Text>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Topic Mastery</Text>
            </View>
            {state.topicDifficulties.map((td) => (
              <View key={td.topicSlug} style={[styles.topicRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.topicName, { color: colors.foreground }]}>
                    {td.topicSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Text>
                  <Text style={[styles.topicMeta, { color: colors.muted }]}>
                    {td.quizCorrect}/{td.quizAttempted} correct ({Math.round(td.accuracy * 100)}%)
                  </Text>
                </View>
                <View style={[styles.topicLevelBadge, {
                  backgroundColor: td.currentLevel === "advanced" ? colors.success + "20" :
                    td.currentLevel === "intermediate" ? colors.primary + "20" : colors.warning + "20",
                }]}>
                  <Text style={[styles.topicLevelText, {
                    color: td.currentLevel === "advanced" ? colors.success :
                      td.currentLevel === "intermediate" ? colors.primary : colors.warning,
                  }]}>
                    {td.currentLevel}
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Spaced Repetition Queue */}
        {state.spacedRep.length > 0 && (
          <Animated.View entering={FadeInDown.duration(300).delay(400)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={{ fontSize: getResponsiveFontSize(20) }}>{"\u{1F504}"}</Text>
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
                    {Math.round(item.memoryStrength)}%
                  </Text>
                </View>
                <View style={[styles.memoryBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.memoryFill,
                      {
                        width: `${Math.min(item.memoryStrength, 100)}%`,
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

        {/* Achievement Badges */}
        <Animated.View entering={FadeInDown.duration(300).delay(450)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={{ fontSize: getResponsiveFontSize(20) }}>{"\u{1F3C6}"}</Text>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Achievements ({unlockedBadges.length}/{BADGE_DEFINITIONS.length})
            </Text>
          </View>

          {unlockedBadges.length > 0 && (
            <View style={styles.badgeGrid}>
              {unlockedBadges.map((badge) => (
                <View
                  key={badge.id}
                  style={[styles.badgeCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}
                >
                  <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                  <Text style={[styles.badgeName, { color: colors.foreground }]}>{badge.name}</Text>
                  <Text style={[styles.badgeDesc, { color: colors.muted }]}>{badge.description}</Text>
                </View>
              ))}
            </View>
          )}

          {lockedBadges.length > 0 && (
            <>
              <Text style={[styles.lockedLabel, { color: colors.muted }]}>
                {lockedBadges.length} more to unlock
              </Text>
              <View style={styles.badgeGrid}>
                {lockedBadges.slice(0, 6).map((badge) => (
                  <View
                    key={badge.id}
                    style={[styles.badgeCard, { backgroundColor: colors.background, borderColor: colors.border, opacity: 0.6 }]}
                  >
                    <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                    <Text style={[styles.badgeName, { color: colors.muted }]}>{badge.name}</Text>
                    <Text style={[styles.badgeReq, { color: colors.muted }]}>{badge.requirement}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </Animated.View>

        {/* Daily Digest */}
        <Animated.View entering={FadeInDown.duration(300).delay(500)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={{ fontSize: getResponsiveFontSize(20) }}>{"\u{1F4CB}"}</Text>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Today's Summary</Text>
          </View>
          <View style={styles.digestGrid}>
            <View style={styles.digestItem}>
              <Text style={[styles.digestValue, { color: colors.primary }]}>{state.sessionMinutes || 0}</Text>
              <Text style={[styles.digestLabel, { color: colors.muted }]}>min learned</Text>
            </View>
            <View style={styles.digestItem}>
              <Text style={[styles.digestValue, { color: colors.success }]}>{profile.interests.length}</Text>
              <Text style={[styles.digestLabel, { color: colors.muted }]}>topics</Text>
            </View>
            <View style={styles.digestItem}>
              <Text style={[styles.digestValue, { color: colors.warning }]}>{quizAccuracy}%</Text>
              <Text style={[styles.digestLabel, { color: colors.muted }]}>accuracy</Text>
            </View>
            <View style={styles.digestItem}>
              <Text style={[styles.digestValue, { color: colors.foreground }]}>{profile.totalXp}</Text>
              <Text style={[styles.digestLabel, { color: colors.muted }]}>total XP</Text>
            </View>
          </View>
          <Text style={[styles.digestEncouragement, { color: colors.muted }]}>
            {profile.currentStreak >= 30
              ? "Incredible consistency! Your deep knowledge is building."
              : profile.currentStreak >= 7
              ? "A week-long streak! Powerful learning habit forming."
              : profile.currentStreak >= 3
              ? "Momentum is building. Keep it up!"
              : profile.currentStreak >= 1
              ? "Great job showing up today. Every session counts."
              : "Welcome back! Today is a fresh start."}
          </Text>
        </Animated.View>

        {/* Motivational footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.muted }]}>
            {profile.totalXp === 0
              ? "Start learning to see your progress here!"
              : profile.totalXp < 100
              ? "Great start! Keep the momentum going."
              : profile.totalXp < 500
              ? "You're building real knowledge. Keep going!"
              : profile.totalXp < 1000
              ? "Impressive dedication! You're becoming an expert."
              : "You're a learning machine! Knowledge is your superpower."}
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  header: { paddingTop: 8, paddingBottom: 4, paddingHorizontal: 4 },
  headerTitle: { fontSize: 26, fontWeight: "800" },
  headerSubtitle: { fontSize: getResponsiveFontSize(14), marginTop: 4 },
  levelCard: { borderRadius: 20, padding: 20, marginTop: 12 },
  levelTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: getResponsiveSpacing(16) },
  levelLabel: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600" },
  levelName: { color: "#FFF", fontSize: getResponsiveFontSize(24), fontWeight: "800", marginTop: 2 },
  xpCircle: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", width: 64, height: 64, borderRadius: 32, justifyContent: "center" },
  xpNumber: { color: "#FFF", fontSize: getResponsiveFontSize(18), fontWeight: "800" },
  xpUnit: { color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: "600" },
  progressBarBg: { height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.25)" },
  progressBarFill: { height: 8, borderRadius: 4, backgroundColor: "#FFF" },
  progressText: { color: "rgba(255,255,255,0.8)", fontSize: getResponsiveFontSize(12), marginTop: 8, textAlign: "center" },
  card: { borderRadius: 16, borderWidth: 1, padding: getResponsiveSpacing(16), marginTop: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: getResponsiveSpacing(8), marginBottom: getResponsiveSpacing(12) },
  cardTitle: { fontSize: 17, fontWeight: "700" },
  dailyGoalContent: { gap: getResponsiveSpacing(8) },
  dailyProgressBg: { height: 10, borderRadius: 5 },
  dailyProgressFill: { height: 10, borderRadius: 5 },
  dailyGoalText: { fontSize: getResponsiveFontSize(14), fontWeight: "600", textAlign: "center" },
  goalComplete: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  weekRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: getResponsiveSpacing(12) },
  dayCol: { alignItems: "center", gap: 6 },
  dayDot: { width: 28, height: 28, borderRadius: 14 },
  dayLabel: { fontSize: 11, fontWeight: "500" },
  streakRecord: { fontSize: getResponsiveFontSize(12), textAlign: "center" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: getResponsiveSpacing(12), marginTop: 12 },
  statCard: { width: "47%", flexGrow: 1, borderRadius: 14, borderWidth: 1, padding: getResponsiveSpacing(16), alignItems: "center" },
  statEmoji: { fontSize: getResponsiveFontSize(24), marginBottom: 6 },
  statNumber: { fontSize: getResponsiveFontSize(24), fontWeight: "800" },
  statLabel: { fontSize: getResponsiveFontSize(12), marginTop: 2 },
  topicRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5 },
  topicName: { fontSize: getResponsiveFontSize(14), fontWeight: "600", textTransform: "capitalize" },
  topicMeta: { fontSize: getResponsiveFontSize(12), marginTop: 2 },
  topicLevelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  topicLevelText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  reviewCount: { fontSize: 13, marginBottom: getResponsiveSpacing(8) },
  reviewItem: { paddingTop: 10, marginTop: 8, borderTopWidth: 0.5 },
  reviewInfo: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  reviewTitle: { fontSize: getResponsiveFontSize(14), fontWeight: "600", flex: 1 },
  reviewMeta: { fontSize: getResponsiveFontSize(12), marginLeft: 8 },
  memoryBar: { height: 4, borderRadius: 2 },
  memoryFill: { height: 4, borderRadius: 2 },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badgeCard: { width: "30%", flexGrow: 1, padding: getResponsiveSpacing(12), borderRadius: 12, borderWidth: 1, alignItems: "center" },
  badgeEmoji: { fontSize: 28, marginBottom: 6 },
  badgeName: { fontSize: getResponsiveFontSize(12), fontWeight: "700", textAlign: "center" },
  badgeDesc: { fontSize: 10, textAlign: "center", marginTop: 2 },
  badgeReq: { fontSize: 10, textAlign: "center", marginTop: 2, fontStyle: "italic" },
  lockedLabel: { fontSize: 13, marginTop: 12, marginBottom: getResponsiveSpacing(8) },
  footer: { paddingVertical: 20, alignItems: "center" },
  footerText: { fontSize: getResponsiveFontSize(14), textAlign: "center", lineHeight: 22, fontStyle: "italic" },
  digestGrid: { flexDirection: "row", flexWrap: "wrap", gap: getResponsiveSpacing(12), marginTop: 8 },
  digestItem: { width: "45%", alignItems: "center", paddingVertical: 8 },
  digestValue: { fontSize: getResponsiveFontSize(24), fontWeight: "800" },
  digestLabel: { fontSize: getResponsiveFontSize(12), marginTop: 2 },
  digestEncouragement: { fontSize: 13, fontStyle: "italic", textAlign: "center", marginTop: 12, lineHeight: 20 },
});
