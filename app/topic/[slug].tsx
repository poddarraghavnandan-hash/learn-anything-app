import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Image,
  ScrollView,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useLearning } from "@/lib/learning-store";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState, useMemo } from "react";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import type { LadderStep, SkillLevel, TopicProgress } from "@/shared/types";

export default function TopicDetailScreen() {
  const { slug, name, emoji, level, startStep } = useLocalSearchParams<{
    slug: string;
    name: string;
    emoji: string;
    level: string;
    startStep: string;
  }>();
  const router = useRouter();
  const colors = useColors();
  const { state, dispatch } = useLearning();

  const [ladderLoading, setLadderLoading] = useState(false);
  const [stepContentLoading, setStepContentLoading] = useState<number | null>(null);
  const [stepContent, setStepContent] = useState<Record<number, any[]>>({});
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const generateLadder = trpc.learningPath.generate.useMutation();
  const fetchStepContent = trpc.feed.refreshForStep.useMutation();

  const topicSlug = slug || "";
  const topicName = name || topicSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const topicEmoji = emoji || "📚";
  const skillLevel = (level as SkillLevel) || state.curiosityResults[topicSlug]?.determinedLevel || "beginner";
  const startingStep = parseInt(startStep || "0", 10) || state.curiosityResults[topicSlug]?.startingStep || 0;

  // Get or generate the learning ladder
  const ladder = state.ladders[topicSlug];
  const progress: TopicProgress | undefined = state.topicProgress[topicSlug];

  // Generate ladder on first visit
  useEffect(() => {
    if (!ladder && !ladderLoading) {
      setLadderLoading(true);
      generateLadder.mutate(
        { topicSlug, topicName, skillLevel, startingStep },
        {
          onSuccess: (data) => {
            dispatch({
              type: "SAVE_LADDER",
              payload: {
                topicSlug,
                ladder: {
                  topicSlug,
                  topicName,
                  steps: data.steps,
                  totalEstimatedHours: data.totalEstimatedHours,
                  encouragement: data.encouragement,
                  generatedAt: new Date().toISOString(),
                },
              },
            });
            // Initialize topic progress
            if (!progress) {
              dispatch({
                type: "SAVE_TOPIC_PROGRESS",
                payload: {
                  topicSlug,
                  progress: {
                    topicSlug,
                    currentStepIndex: startingStep,
                    completedSteps: [],
                    baselineLevel: skillLevel,
                    curiosityCheckDone: true,
                    videosWatchedPerStep: {},
                    quizPassedPerStep: {},
                    startedAt: new Date().toISOString(),
                    lastActivityAt: new Date().toISOString(),
                  },
                },
              });
            }
            setLadderLoading(false);
          },
          onError: () => setLadderLoading(false),
        }
      );
    }
  }, [topicSlug, ladder, ladderLoading]);

  const currentStep = progress?.currentStepIndex ?? startingStep;

  // Follow topic automatically
  useEffect(() => {
    if (!state.profile.interests.includes(topicSlug)) {
      dispatch({ type: "SET_INTERESTS", payload: [...state.profile.interests, topicSlug] });
    }
  }, [topicSlug]);

  // Fetch content for a specific step
  const handleExpandStep = useCallback(
    (stepIndex: number) => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (expandedStep === stepIndex) {
        setExpandedStep(null);
        return;
      }

      setExpandedStep(stepIndex);

      // Fetch content if not already loaded
      if (!stepContent[stepIndex] && ladder) {
        const step = ladder.steps[stepIndex];
        if (!step) return;
        setStepContentLoading(stepIndex);
        fetchStepContent.mutate(
          { topicSlug, stepSearchQuery: step.searchQuery, stepTitle: step.title },
          {
            onSuccess: (data) => {
              setStepContent((prev) => ({ ...prev, [stepIndex]: data.items || [] }));
              setStepContentLoading(null);
            },
            onError: () => setStepContentLoading(null),
          }
        );
      }
    },
    [expandedStep, stepContent, ladder, topicSlug, fetchStepContent]
  );

  const handleVideoPress = useCallback(
    (item: any, stepIndex: number) => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      dispatch({ type: "RECORD_STEP_VIDEO", payload: { topicSlug, stepIndex } });
      dispatch({ type: "INCREMENT_VIDEOS" });
      dispatch({ type: "ADD_XP", payload: 15 });
      dispatch({ type: "UPDATE_STREAK" });
      // Navigate to content detail
      if (item.id) {
        router.push(`/content/${item.id}` as any);
      } else {
        // For items just fetched that don't have a DB id yet, open the URL
        const { openBrowserAsync } = require("expo-web-browser");
        openBrowserAsync(item.url);
      }
    },
    [topicSlug, dispatch, router]
  );

  const completedSteps = progress?.completedSteps || [];
  const totalSteps = ladder?.steps?.length || 0;
  const overallProgress = totalSteps > 0 ? completedSteps.length / totalSteps : 0;

  // Check if a step is unlocked (current or completed, or previous step completed)
  const isStepUnlocked = (stepIndex: number) => {
    if (stepIndex <= currentStep) return true;
    if (completedSteps.includes(stepIndex - 1)) return true;
    return false;
  };

  const isStepCompleted = (stepIndex: number) => completedSteps.includes(stepIndex);

  if (ladderLoading || !ladder) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1">
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 8 }]}>
            <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
          </Pressable>
        </View>
        <View style={styles.loadingCenter}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>{topicEmoji}</Text>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-muted mt-4 text-base text-center px-8">
            Building your personalized learning path for {topicName}...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 8 }]}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {topicEmoji} {topicName}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Topic Hero */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.heroSection}>
          <Text className="text-sm text-muted text-center uppercase tracking-wider">Your Learning Path</Text>
          <Text className="text-2xl font-bold text-foreground text-center mt-1">{topicName}</Text>

          {/* Progress bar */}
          <View style={[styles.overallProgressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.overallProgressFill,
                { backgroundColor: colors.primary, width: `${overallProgress * 100}%` },
              ]}
            />
          </View>
          <Text className="text-xs text-muted text-center mt-1">
            {completedSteps.length} of {totalSteps} steps completed
            {ladder.totalEstimatedHours > 0 ? ` · ~${ladder.totalEstimatedHours}h total` : ""}
          </Text>

          {/* Encouragement */}
          <Text className="text-sm text-primary text-center mt-3 px-6 italic">
            "{ladder.encouragement}"
          </Text>
        </Animated.View>

        {/* Learning Ladder */}
        <View style={styles.ladderContainer}>
          {ladder.steps.map((step, index) => {
            const unlocked = isStepUnlocked(index);
            const completed = isStepCompleted(index);
            const isCurrent = index === currentStep && !completed;
            const isExpanded = expandedStep === index;
            const videosWatched = progress?.videosWatchedPerStep[index] || 0;
            const quizPassed = progress?.quizPassedPerStep[index] || false;

            return (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(index * 60).duration(300)}
              >
                {/* Connector line */}
                {index > 0 && (
                  <View style={styles.connectorContainer}>
                    <View
                      style={[
                        styles.connectorLine,
                        {
                          backgroundColor: completed || (unlocked && index <= currentStep)
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                    />
                  </View>
                )}

                {/* Step card */}
                <Pressable
                  onPress={() => unlocked ? handleExpandStep(index) : null}
                  style={({ pressed }) => [
                    styles.stepCard,
                    {
                      backgroundColor: isCurrent
                        ? colors.primary + "10"
                        : completed
                        ? colors.success + "10"
                        : colors.surface,
                      borderColor: isCurrent
                        ? colors.primary
                        : completed
                        ? colors.success
                        : unlocked
                        ? colors.border
                        : colors.border + "60",
                      opacity: unlocked ? (pressed ? 0.9 : 1) : 0.5,
                    },
                  ]}
                  disabled={!unlocked}
                >
                  <View style={styles.stepHeader}>
                    {/* Step number circle */}
                    <View
                      style={[
                        styles.stepCircle,
                        {
                          backgroundColor: completed
                            ? colors.success
                            : isCurrent
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                    >
                      <Text style={styles.stepCircleText}>
                        {completed ? "✓" : index + 1}
                      </Text>
                    </View>

                    <View style={styles.stepInfo}>
                      <Text
                        style={[
                          styles.stepTitle,
                          {
                            color: unlocked ? colors.foreground : colors.muted,
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {step.title}
                      </Text>
                      <Text style={[styles.stepMeta, { color: colors.muted }]}>
                        {step.estimatedMinutes}min
                        {isCurrent ? " · Current Step" : ""}
                        {completed ? " · Completed ✓" : ""}
                        {!unlocked ? " · 🔒 Locked" : ""}
                      </Text>
                    </View>

                    {unlocked && (
                      <Text style={{ color: colors.muted, fontSize: 16 }}>
                        {isExpanded ? "▲" : "▼"}
                      </Text>
                    )}
                  </View>

                  {/* Expanded content */}
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <Text className="text-sm text-foreground leading-relaxed mb-2">
                        {step.description}
                      </Text>
                      <Text className="text-xs text-primary italic mb-3">
                        {step.whyItMatters}
                      </Text>

                      {/* Progress indicators for this step */}
                      <View style={styles.stepProgressRow}>
                        <View style={[styles.stepProgressChip, { backgroundColor: videosWatched > 0 ? colors.success + "20" : colors.surface, borderColor: videosWatched > 0 ? colors.success : colors.border }]}>
                          <Text style={{ fontSize: 12, color: videosWatched > 0 ? colors.success : colors.muted }}>
                            🎬 {videosWatched} video{videosWatched !== 1 ? "s" : ""} watched
                          </Text>
                        </View>
                        <View style={[styles.stepProgressChip, { backgroundColor: quizPassed ? colors.success + "20" : colors.surface, borderColor: quizPassed ? colors.success : colors.border }]}>
                          <Text style={{ fontSize: 12, color: quizPassed ? colors.success : colors.muted }}>
                            {quizPassed ? "✅ Quiz passed" : "📝 Quiz pending"}
                          </Text>
                        </View>
                      </View>

                      {/* Prerequisites */}
                      {step.prerequisites.length > 0 && (
                        <View style={styles.prereqRow}>
                          <Text className="text-xs text-muted">Prerequisites: {step.prerequisites.join(", ")}</Text>
                        </View>
                      )}

                      {/* Content list for this step */}
                      {stepContentLoading === index ? (
                        <View style={styles.contentLoading}>
                          <ActivityIndicator size="small" color={colors.primary} />
                          <Text className="text-xs text-muted ml-2">Finding the best content for this step...</Text>
                        </View>
                      ) : stepContent[index] && stepContent[index].length > 0 ? (
                        <View style={styles.contentList}>
                          <Text className="text-xs text-muted font-semibold uppercase tracking-wider mb-2">
                            Content for this step
                          </Text>
                          {stepContent[index].slice(0, 6).map((item: any, ci: number) => (
                            <Pressable
                              key={ci}
                              onPress={() => handleVideoPress(item, index)}
                              style={({ pressed }) => [
                                styles.contentItem,
                                { backgroundColor: colors.background, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
                              ]}
                            >
                              {item.thumbnailUrl && (
                                <Image source={{ uri: item.thumbnailUrl }} style={styles.contentThumb} resizeMode="cover" />
                              )}
                              <View style={styles.contentInfo}>
                                <Text style={[styles.contentTitle, { color: colors.foreground }]} numberOfLines={2}>
                                  {item.title}
                                </Text>
                                <Text style={[styles.contentMeta, { color: colors.muted }]} numberOfLines={1}>
                                  {item.channelOrAuthor || "YouTube"}
                                  {item.durationSeconds ? ` · ${Math.round(item.durationSeconds / 60)}min` : ""}
                                </Text>
                              </View>
                            </Pressable>
                          ))}
                        </View>
                      ) : stepContent[index] && stepContent[index].length === 0 ? (
                        <Text className="text-xs text-muted text-center mt-2">
                          No content found yet. Try again later.
                        </Text>
                      ) : null}

                      {/* Mark as complete button */}
                      {!completed && videosWatched >= 1 && (
                        <Pressable
                          onPress={() => {
                            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            dispatch({ type: "COMPLETE_STEP", payload: { topicSlug, stepIndex: index } });
                            dispatch({ type: "ADD_XP", payload: 50 });
                            setExpandedStep(null);
                          }}
                          style={({ pressed }) => [
                            styles.completeButton,
                            { backgroundColor: colors.success, opacity: pressed ? 0.9 : 1 },
                          ]}
                        >
                          <Text style={styles.completeButtonText}>
                            ✓ Complete Step {index + 1}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* All steps completed */}
        {completedSteps.length === totalSteps && totalSteps > 0 && (
          <Animated.View entering={FadeIn.duration(500)} style={[styles.completionCard, { backgroundColor: colors.success + "15", borderColor: colors.success }]}>
            <Text style={{ fontSize: 48, textAlign: "center" }}>🎓</Text>
            <Text className="text-xl font-bold text-foreground text-center mt-2">
              Path Complete!
            </Text>
            <Text className="text-sm text-muted text-center mt-1">
              You've completed all {totalSteps} steps in {topicName}. Amazing work!
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backText: { fontSize: 16, fontWeight: "600" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", textAlign: "center" },
  loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  heroSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  overallProgressBar: { height: 6, borderRadius: 3, marginTop: 12, overflow: "hidden" },
  overallProgressFill: { height: "100%", borderRadius: 3 },
  ladderContainer: { paddingHorizontal: 20, paddingTop: 8 },
  connectorContainer: { alignItems: "center", height: 24 },
  connectorLine: { width: 2, height: 24 },
  stepCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    overflow: "hidden",
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepCircleText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  stepInfo: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: "700", lineHeight: 22 },
  stepMeta: { fontSize: 12, marginTop: 2 },
  expandedContent: { marginTop: 14, paddingTop: 14, borderTopWidth: 0.5, borderTopColor: "#E5E7EB30" },
  stepProgressRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  stepProgressChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  prereqRow: { marginBottom: 10 },
  contentLoading: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16 },
  contentList: { marginTop: 4 },
  contentItem: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 8,
  },
  contentThumb: { width: 100, height: 64 },
  contentInfo: { flex: 1, padding: 8, justifyContent: "center" },
  contentTitle: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  contentMeta: { fontSize: 11, marginTop: 2 },
  completeButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  completeButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  completionCard: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1.5,
  },
});
