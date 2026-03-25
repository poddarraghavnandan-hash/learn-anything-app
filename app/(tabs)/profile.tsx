import { useCallback, useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Alert, Linking, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLearning } from "@/lib/learning-store";
import { getLevel, BADGE_DEFINITIONS } from "@/shared/types";
import type { BadgeId, SkillLevel } from "@/shared/types";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeInDown } from "react-native-reanimated";
import Constants from "expo-constants";
import { trpc } from "@/lib/trpc";
import { useThemeContext, type ThemePreference } from "@/lib/theme-provider";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getResponsiveFontSize, getResponsiveSpacing } from "@/lib/responsive";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

const GOALS = [5, 10, 15, 20, 30];
const SKILL_LEVELS: { value: SkillLevel; label: string; desc: string; emoji: string }[] = [
  { value: "beginner", label: "Beginner", desc: "New to this topic", emoji: "\u{1F331}" },
  { value: "intermediate", label: "Intermediate", desc: "Some background", emoji: "\u{1F333}" },
  { value: "advanced", label: "Advanced", desc: "Deep knowledge", emoji: "\u{1F3C6}" },
];

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state, dispatch } = useLearning();
  const { profile } = state;
  const levelInfo = getLevel(profile.totalXp);
  const { themePreference, setThemePreference } = useThemeContext();

  const handleThemeChange = useCallback((pref: ThemePreference) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setThemePreference(pref);
  }, [setThemePreference]);

  // Update check state
  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "available" | "latest" | "error">("idle");
  const [updateInfo, setUpdateInfo] = useState<{ latestVersion: string; downloadUrl: string; releaseNotes: string } | null>(null);
  const [checkEnabled, setCheckEnabled] = useState(false);

  const updateQuery = trpc.appUpdate.check.useQuery(
    { currentVersion: APP_VERSION },
    { enabled: checkEnabled, retry: false }
  );

  useEffect(() => {
    if (!checkEnabled) return;
    if (updateQuery.isLoading) {
      setUpdateStatus("checking");
    } else if (updateQuery.isError) {
      setUpdateStatus("error");
      setUpdateInfo(null);
      setCheckEnabled(false);
    } else if (updateQuery.data) {
      const result = updateQuery.data;
      if (result.hasUpdate && result.downloadUrl) {
        setUpdateStatus("available");
        setUpdateInfo({
          latestVersion: result.latestVersion,
          downloadUrl: result.downloadUrl,
          releaseNotes: result.releaseNotes,
        });
      } else {
        setUpdateStatus("latest");
        setUpdateInfo(null);
      }
      setCheckEnabled(false);
    }
  }, [checkEnabled, updateQuery.isLoading, updateQuery.isError, updateQuery.data]);

  const checkForUpdates = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUpdateStatus("checking");
    setCheckEnabled(true);
  }, []);

  const handleDownloadUpdate = useCallback(async () => {
    if (!updateInfo?.downloadUrl) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await Linking.openURL(updateInfo.downloadUrl);
    } catch {
      Alert.alert("Error", "Could not open the download link. Please try again later.");
    }
  }, [updateInfo]);

  // Badge checking
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
      default: return false;
    }
  };
  const unlockedCount = BADGE_DEFINITIONS.filter((b) => checkBadge(b.id)).length;

  const handleGoalChange = useCallback(
    (goal: number) => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      dispatch({ type: "SET_DAILY_GOAL", payload: goal });
    },
    [dispatch]
  );

  const handleFormatChange = useCallback(
    (format: "videos" | "articles" | "mixed") => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      dispatch({ type: "SET_FORMAT", payload: format });
    },
    [dispatch]
  );

  const handleSkillChange = useCallback(
    (level: SkillLevel) => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      dispatch({ type: "SET_SKILL_LEVEL", payload: level });
    },
    [dispatch]
  );

  const handleResetProgress = useCallback(() => {
    const doReset = () => {
      AsyncStorage.removeItem("learn_anything_state").then(() => {
        dispatch({
          type: "LOAD_STATE",
          payload: {
            profile: {
              interests: [],
              skillLevel: "beginner",
              dailyGoalMinutes: 10,
              preferredFormat: "mixed",
              onboardingDone: false,
              currentStreak: 0,
              longestStreak: 0,
              lastActiveDate: "",
              totalXp: 0,
              totalMinutes: 0,
              totalVideos: 0,
              totalArticles: 0,
              totalQuizCorrect: 0,
              totalQuizAttempted: 0,
              dailyGoalsCompleted: 0,
              mindBlownCount: 0,
              streakFreezes: 1,
              checkStreak: 0,
              bestCheckStreak: 0,
              perfectJourneys: 0,
              totalJourneysCompleted: 0,
            },
            engagements: [],
            spacedRep: [],
            savedContentIds: [],
            topicDifficulties: [],
            unlockedBadges: [],
          },
        });
        router.replace("/onboarding");
      });
    };

    if (Platform.OS === "web") {
      if (confirm("Reset all progress? This cannot be undone.")) doReset();
    } else {
      Alert.alert("Reset Progress", "Reset all progress? This cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: doReset },
      ]);
    }
  }, [dispatch, router]);

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
        </View>

        {/* Avatar + Level */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarEmoji}>{"\u{1F9E0}"}</Text>
          </View>
          <Text style={[styles.levelText, { color: colors.foreground }]}>
            Level {levelInfo.level} — {levelInfo.name}
          </Text>
          <Text style={[styles.xpText, { color: colors.muted }]}>
            {profile.totalXp} XP | {unlockedCount}/{BADGE_DEFINITIONS.length} badges
          </Text>
        </Animated.View>

        {/* Skill Level */}
        <Animated.View entering={FadeInDown.duration(300).delay(50)} style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {"\u{1F4DA}"} Skill Level
          </Text>
          <Text style={[styles.sectionDesc, { color: colors.muted }]}>
            This adjusts content difficulty across all topics
          </Text>
          <View style={styles.skillRow}>
            {SKILL_LEVELS.map((sl) => (
              <Pressable
                key={sl.value}
                onPress={() => handleSkillChange(sl.value)}
                style={({ pressed }) => [
                  styles.skillCard,
                  {
                    backgroundColor: profile.skillLevel === sl.value ? colors.primary + "15" : "transparent",
                    borderColor: profile.skillLevel === sl.value ? colors.primary : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={{ fontSize: getResponsiveFontSize(20) }}>{sl.emoji}</Text>
                <Text style={[styles.skillLabel, {
                  color: profile.skillLevel === sl.value ? colors.primary : colors.foreground,
                }]}>
                  {sl.label}
                </Text>
                <Text style={[styles.skillDesc, { color: colors.muted }]}>{sl.desc}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Interests */}
        <Animated.View entering={FadeInDown.duration(300).delay(100)} style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Interests</Text>
            <Pressable
              onPress={() => router.push("/onboarding")}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={[styles.editLink, { color: colors.primary }]}>Edit</Text>
            </Pressable>
          </View>
          <View style={styles.chipRow}>
            {profile.interests.length > 0 ? (
              profile.interests.map((slug) => (
                <View key={slug} style={[styles.interestChip, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
                  <Text style={[styles.interestText, { color: colors.primary }]}>
                    {slug.replace(/-/g, " ")}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: colors.muted }]}>No interests selected</Text>
            )}
          </View>
        </Animated.View>

        {/* Daily Goal */}
        <Animated.View entering={FadeInDown.duration(300).delay(200)} style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {"\u{1F3AF}"} Daily Goal
          </Text>
          <View style={styles.goalRow}>
            {GOALS.map((g) => (
              <Pressable
                key={g}
                onPress={() => handleGoalChange(g)}
                style={({ pressed }) => [
                  styles.goalPill,
                  {
                    backgroundColor: profile.dailyGoalMinutes === g ? colors.primary : "transparent",
                    borderColor: profile.dailyGoalMinutes === g ? colors.primary : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.goalPillText,
                    { color: profile.dailyGoalMinutes === g ? "#FFF" : colors.foreground },
                  ]}
                >
                  {g}m
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Preferred Format */}
        <Animated.View entering={FadeInDown.duration(300).delay(300)} style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {"\u{1F3AC}"} Preferred Format
          </Text>
          <View style={styles.formatRow}>
            {(["videos", "articles", "mixed"] as const).map((f) => (
              <Pressable
                key={f}
                onPress={() => handleFormatChange(f)}
                style={({ pressed }) => [
                  styles.formatPill,
                  {
                    backgroundColor: profile.preferredFormat === f ? colors.primary : "transparent",
                    borderColor: profile.preferredFormat === f ? colors.primary : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.formatPillText,
                    { color: profile.preferredFormat === f ? "#FFF" : colors.foreground },
                  ]}
                >
                  {f === "videos" ? "\u{1F3AC} Videos" : f === "articles" ? "\u{1F4D6} Articles" : "\u{1F500} Mixed"}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Appearance / Theme Toggle */}
        <Animated.View entering={FadeInDown.duration(300).delay(325)} style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Appearance
          </Text>
          <View style={styles.themeRow}>
            {(["light", "dark", "system"] as ThemePreference[]).map((pref) => {
              const isActive = themePreference === pref;
              const icon = pref === "light" ? "sun.max.fill" : pref === "dark" ? "moon.fill" : "gearshape.fill";
              const label = pref === "light" ? "Light" : pref === "dark" ? "Dark" : "System";
              return (
                <Pressable
                  key={pref}
                  onPress={() => handleThemeChange(pref)}
                  style={({ pressed }) => [
                    styles.themePill,
                    {
                      backgroundColor: isActive ? colors.primary : "transparent",
                      borderColor: isActive ? colors.primary : colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <IconSymbol name={icon as any} size={16} color={isActive ? "#FFF" : colors.foreground} />
                  <Text style={[styles.themePillText, { color: isActive ? "#FFF" : colors.foreground }]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Streak Freeze */}
        <Animated.View entering={FadeInDown.duration(300).delay(340)} style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Streak Protection
          </Text>
          <Text style={[styles.sectionDesc, { color: colors.muted }]}>
            Freezes protect your streak when you miss a day. Earn more by completing 7-day streaks.
          </Text>
          <View style={styles.freezeRow}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.freezeIcon,
                  {
                    backgroundColor: i < (profile.streakFreezes || 0) ? "#60A5FA" + "25" : colors.border + "30",
                    borderColor: i < (profile.streakFreezes || 0) ? "#60A5FA" : colors.border,
                  },
                ]}
              >
                <Text style={{ fontSize: getResponsiveFontSize(20), opacity: i < (profile.streakFreezes || 0) ? 1 : 0.3 }}>
                  {"\u2744\uFE0F"}
                </Text>
              </View>
            ))}
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.freezeCount, { color: colors.foreground }]}>
                {profile.streakFreezes || 0} / 3 freezes
              </Text>
              <Text style={[styles.freezeHint, { color: colors.muted }]}>
                {profile.currentStreak === 0 && profile.longestStreak > 0
                  ? `Repair streak for ${Math.min(profile.longestStreak * 50, 500)} XP`
                  : profile.streakFreezes >= 3 ? "Fully stocked!" : "Complete 7-day streaks to earn more"}
              </Text>
            </View>
          </View>
          {profile.currentStreak === 0 && profile.longestStreak > 0 && profile.totalXp >= Math.min(profile.longestStreak * 50, 500) && (
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                const cost = Math.min(profile.longestStreak * 50, 500);
                dispatch({ type: "REPAIR_STREAK", payload: cost });
              }}
              style={({ pressed }) => [
                styles.repairBtn,
                { backgroundColor: colors.warning + "15", borderColor: colors.warning + "40", opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[styles.repairBtnText, { color: colors.warning }]}>
                Repair Streak ({Math.min(profile.longestStreak * 50, 500)} XP)
              </Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Saved Content */}
        <Animated.View entering={FadeInDown.duration(300).delay(350)} style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {"\u{1F516}"} Saved Content
            </Text>
            <Text style={[styles.savedCount, { color: colors.muted }]}>
              {state.savedContentIds.length} items
            </Text>
          </View>
        </Animated.View>

        {/* App Update */}
        <Animated.View entering={FadeInDown.duration(300).delay(400)} style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {"\u{1F504}"} App Updates
          </Text>
          <Text style={[styles.versionText, { color: colors.muted }]}>
            Current version: {APP_VERSION}
          </Text>

          {updateStatus === "idle" && (
            <Pressable
              onPress={checkForUpdates}
              style={({ pressed }) => [
                styles.updateBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.updateBtnText}>Check for Updates</Text>
            </Pressable>
          )}

          {updateStatus === "checking" && (
            <View style={styles.updateStatusRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.updateStatusText, { color: colors.muted }]}>
                Checking for updates...
              </Text>
            </View>
          )}

          {updateStatus === "latest" && (
            <View style={styles.updateStatusRow}>
              <Text style={{ fontSize: getResponsiveFontSize(18) }}>{"\u2705"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.updateStatusText, { color: colors.success }]}>
                  You're on the latest version!
                </Text>
                <Pressable
                  onPress={() => { setUpdateStatus("idle"); }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginTop: 6 }]}
                >
                  <Text style={[styles.checkAgainText, { color: colors.primary }]}>Check again</Text>
                </Pressable>
              </View>
            </View>
          )}

          {updateStatus === "available" && updateInfo && (
            <View style={[styles.updateCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
              <View style={styles.updateCardHeader}>
                <Text style={{ fontSize: getResponsiveFontSize(20) }}>{"\u{1F389}"}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.updateCardTitle, { color: colors.foreground }]}>
                    Version {updateInfo.latestVersion} Available
                  </Text>
                  <Text style={[styles.updateCardNotes, { color: colors.muted }]}>
                    {updateInfo.releaseNotes}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={handleDownloadUpdate}
                style={({ pressed }) => [
                  styles.downloadBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={styles.downloadBtnText}>Download Update</Text>
              </Pressable>
              <Pressable
                onPress={() => { setUpdateStatus("idle"); }}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, alignSelf: "center", marginTop: 8 }]}
              >
                <Text style={[styles.checkAgainText, { color: colors.muted }]}>Dismiss</Text>
              </Pressable>
            </View>
          )}

          {updateStatus === "error" && (
            <View style={styles.updateStatusRow}>
              <Text style={{ fontSize: getResponsiveFontSize(18) }}>{"\u26A0\uFE0F"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.updateStatusText, { color: colors.warning }]}>
                  Could not check for updates. Please try again later.
                </Text>
                <Pressable
                  onPress={() => { setUpdateStatus("idle"); }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginTop: 6 }]}
                >
                  <Text style={[styles.checkAgainText, { color: colors.primary }]}>Try again</Text>
                </Pressable>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Optional Sign In */}
        <Animated.View entering={FadeInDown.duration(300).delay(425)} style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {"\u{1F511}"} Account
            </Text>
          </View>
          <Text style={[styles.sectionDesc, { color: colors.muted }]}>
            Sign in to sync your progress across devices. Everything works offline too — this is optional.
          </Text>
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // TODO: Implement auth flow when backend auth is connected
              if (Platform.OS === "web") {
                alert("Sign in coming soon! Your progress is saved locally.");
              } else {
                Alert.alert("Coming Soon", "Sign in will be available in a future update. Your progress is saved locally on this device.");
              }
            }}
            style={({ pressed }) => [
              styles.signInBtn,
              { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30", opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.signInText, { color: colors.primary }]}>Sign In (Optional)</Text>
          </Pressable>
        </Animated.View>

        {/* Learning Reminders */}
        <Animated.View entering={FadeInDown.duration(300).delay(440)} style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {"\u{1F514}"} Learning Reminders
            </Text>
          </View>
          <Text style={[styles.sectionDesc, { color: colors.muted }]}>
            Get a gentle nudge to keep your learning habit going.
          </Text>
          <View style={styles.reminderToggleRow}>
            <Text style={[styles.reminderLabel, { color: colors.foreground }]}>Daily Reminder</Text>
            <Pressable
              onPress={async () => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const { getReminderSettings, saveReminderSettings, requestNotificationPermission } = await import("@/lib/notifications");
                const current = await getReminderSettings();
                if (!current.enabled) {
                  const granted = await requestNotificationPermission();
                  if (!granted) {
                    if (Platform.OS === "web") alert("Please enable notifications in your device settings.");
                    else Alert.alert("Notifications Disabled", "Please enable notifications in your device settings to receive reminders.");
                    return;
                  }
                }
                await saveReminderSettings({ ...current, enabled: !current.enabled });
                if (Platform.OS === "web") alert(!current.enabled ? "Reminders enabled!" : "Reminders disabled.");
                else Alert.alert(!current.enabled ? "Reminders On" : "Reminders Off", !current.enabled ? "You'll get a daily learning nudge." : "No more reminders.");
              }}
              style={({ pressed }) => [
                styles.reminderToggle,
                { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30", opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[styles.reminderToggleText, { color: colors.primary }]}>Toggle</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={async () => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const { getReminderSettings, saveReminderSettings } = await import("@/lib/notifications");
              const current = await getReminderSettings();
              await saveReminderSettings({ ...current, useSmartTiming: !current.useSmartTiming });
              if (Platform.OS === "web") alert(!current.useSmartTiming ? "Smart timing enabled! Reminders will match your peak learning hours." : "Smart timing disabled. Using default schedule.");
              else Alert.alert(!current.useSmartTiming ? "Smart Timing On" : "Smart Timing Off", !current.useSmartTiming ? "Reminders will be sent based on when you usually learn." : "Using default reminder time.");
            }}
            style={({ pressed }) => [
              styles.smartTimingBtn,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={{ fontSize: getResponsiveFontSize(16) }}>{"\u{1F9E0}"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.smartTimingLabel, { color: colors.foreground }]}>Smart Timing</Text>
              <Text style={[styles.smartTimingDesc, { color: colors.muted }]}>Send reminders when you're most likely to learn</Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* About */}
        <Animated.View entering={FadeInDown.duration(300).delay(450)} style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About</Text>
          <Text style={[styles.aboutText, { color: colors.muted }]}>
            Learn Anything uses AI-powered adaptive learning to curate free content from YouTube and the web, personalized to your skill level and learning patterns. Built on principles from Google's LearnLM, spaced repetition research, and the science of how people actually learn.
          </Text>
          <Text style={[styles.aboutText, { color: colors.muted, marginTop: 8, fontStyle: "italic" }]}>
            Core belief: Anyone can learn anything. Teaching must be fine-tuned to the individual.
          </Text>
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View entering={FadeInDown.duration(300).delay(500)} style={styles.dangerSection}>
          <Pressable
            onPress={handleResetProgress}
            style={({ pressed }) => [
              styles.resetBtn,
              { borderColor: colors.error, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={[styles.resetText, { color: colors.error }]}>Reset All Progress</Text>
          </Pressable>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  header: { paddingTop: 8, paddingBottom: 4, paddingHorizontal: 4 },
  headerTitle: { fontSize: 26, fontWeight: "800" },
  avatarSection: { alignItems: "center", paddingVertical: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: getResponsiveSpacing(12) },
  avatarEmoji: { fontSize: 36 },
  levelText: { fontSize: getResponsiveFontSize(18), fontWeight: "700" },
  xpText: { fontSize: 13, marginTop: 4 },
  section: { borderRadius: 14, borderWidth: 1, padding: getResponsiveSpacing(16), marginTop: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: getResponsiveSpacing(8) },
  sectionTitle: { fontSize: getResponsiveFontSize(16), fontWeight: "700" },
  sectionDesc: { fontSize: 13, marginTop: 2, marginBottom: 10 },
  editLink: { fontSize: getResponsiveFontSize(14), fontWeight: "600" },
  skillRow: { flexDirection: "row", gap: getResponsiveSpacing(8) },
  skillCard: { flex: 1, padding: getResponsiveSpacing(12), borderRadius: 12, borderWidth: 1.5, alignItems: "center", gap: 4 },
  skillLabel: { fontSize: 13, fontWeight: "700" },
  skillDesc: { fontSize: 10, textAlign: "center" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: getResponsiveSpacing(8) },
  interestChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  interestText: { fontSize: 13, fontWeight: "600", textTransform: "capitalize" },
  emptyText: { fontSize: 13 },
  goalRow: { flexDirection: "row", gap: getResponsiveSpacing(8), marginTop: 8 },
  goalPill: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  goalPillText: { fontSize: getResponsiveFontSize(14), fontWeight: "600" },
  formatRow: { flexDirection: "row", gap: getResponsiveSpacing(8), marginTop: 8 },
  formatPill: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  formatPillText: { fontSize: getResponsiveFontSize(12), fontWeight: "600" },
  savedCount: { fontSize: 13 },
  versionText: { fontSize: 13, marginTop: 4, marginBottom: getResponsiveSpacing(12) },
  updateBtn: { paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  updateBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  updateStatusRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 4 },
  updateStatusText: { fontSize: getResponsiveFontSize(14), fontWeight: "600", lineHeight: 20 },
  checkAgainText: { fontSize: 13, fontWeight: "600" },
  updateCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 4 },
  updateCardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: getResponsiveSpacing(12) },
  updateCardTitle: { fontSize: 15, fontWeight: "700" },
  updateCardNotes: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  downloadBtn: { paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  downloadBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  aboutText: { fontSize: 13, lineHeight: 20 },
  dangerSection: { marginTop: 24, alignItems: "center" },
  signInBtn: { paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: "center", marginTop: 4 },
  signInText: { fontSize: 15, fontWeight: "700" },
  resetBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5 },
  resetText: { fontSize: getResponsiveFontSize(14), fontWeight: "600" },
  themeRow: { flexDirection: "row", gap: getResponsiveSpacing(8), marginTop: 8 },
  themePill: { flex: 1, flexDirection: "row", paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  themePillText: { fontSize: 13, fontWeight: "600" },
  freezeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  freezeIcon: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, justifyContent: "center", alignItems: "center" },
  freezeCount: { fontSize: 15, fontWeight: "700" },
  freezeHint: { fontSize: getResponsiveFontSize(12), marginTop: 2 },
  repairBtn: { paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: "center", marginTop: 12 },
  repairBtnText: { fontSize: getResponsiveFontSize(14), fontWeight: "700" },
  reminderToggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: getResponsiveSpacing(12) },
  reminderLabel: { fontSize: 15, fontWeight: "600" },
  reminderToggle: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  reminderToggleText: { fontSize: 13, fontWeight: "700" },
  smartTimingBtn: { flexDirection: "row", alignItems: "center", gap: 10, padding: getResponsiveSpacing(12), borderRadius: 12, borderWidth: 1 },
  smartTimingLabel: { fontSize: getResponsiveFontSize(14), fontWeight: "600" },
  smartTimingDesc: { fontSize: 11, marginTop: 2 },
});
