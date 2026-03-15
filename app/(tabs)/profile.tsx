import { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Switch, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLearning } from "@/lib/learning-store";
import { getLevel } from "@/shared/types";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeInDown } from "react-native-reanimated";

const GOALS = [5, 10, 15, 20, 30];

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state, dispatch } = useLearning();
  const { profile } = state;
  const levelInfo = getLevel(profile.totalXp);

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

  const handleResetProgress = useCallback(() => {
    if (Platform.OS === "web") {
      if (confirm("Reset all progress? This cannot be undone.")) {
        AsyncStorage.removeItem("learn_anything_state").then(() => {
          dispatch({
            type: "LOAD_STATE",
            payload: {
              profile: {
                interests: [],
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
              },
              engagements: [],
              spacedRep: [],
              savedContentIds: [],
            },
          });
          router.replace("/onboarding");
        });
      }
    } else {
      Alert.alert("Reset Progress", "Reset all progress? This cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            AsyncStorage.removeItem("learn_anything_state").then(() => {
              dispatch({
                type: "LOAD_STATE",
                payload: {
                  profile: {
                    interests: [],
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
                  },
                  engagements: [],
                  spacedRep: [],
                  savedContentIds: [],
                },
              });
              router.replace("/onboarding");
            });
          },
        },
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
            <Text style={styles.avatarEmoji}>🧠</Text>
          </View>
          <Text style={[styles.levelText, { color: colors.foreground }]}>
            Level {levelInfo.level} — {levelInfo.name}
          </Text>
          <Text style={[styles.xpText, { color: colors.muted }]}>{profile.totalXp} XP total</Text>
        </Animated.View>

        {/* Interests */}
        <Animated.View entering={FadeInDown.duration(300).delay(100)} style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Interests</Text>
            <Pressable
              onPress={() => router.push("/(tabs)/discover")}
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
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Daily Goal</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Preferred Format</Text>
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
                  {f === "videos" ? "🎬 Videos" : f === "articles" ? "📖 Articles" : "🔀 Mixed"}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Saved Content */}
        <Animated.View entering={FadeInDown.duration(300).delay(400)} style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Saved Content</Text>
            <Text style={[styles.savedCount, { color: colors.muted }]}>
              {state.savedContentIds.length} items
            </Text>
          </View>
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
  scrollContent: { paddingHorizontal: 16 },
  header: { paddingTop: 8, paddingBottom: 4, paddingHorizontal: 4 },
  headerTitle: { fontSize: 26, fontWeight: "800" },
  avatarSection: { alignItems: "center", paddingVertical: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarEmoji: { fontSize: 36 },
  levelText: { fontSize: 18, fontWeight: "700" },
  xpText: { fontSize: 13, marginTop: 4 },
  section: { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  editLink: { fontSize: 14, fontWeight: "600" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  interestChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  interestText: { fontSize: 13, fontWeight: "600", textTransform: "capitalize" },
  emptyText: { fontSize: 13 },
  goalRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  goalPill: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  goalPillText: { fontSize: 14, fontWeight: "600" },
  formatRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  formatPill: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  formatPillText: { fontSize: 12, fontWeight: "600" },
  savedCount: { fontSize: 13 },
  dangerSection: { marginTop: 24, alignItems: "center" },
  resetBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5 },
  resetText: { fontSize: 14, fontWeight: "600" },
});
