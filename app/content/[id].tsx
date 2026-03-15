import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Linking,
  Image,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useLearning } from "@/lib/learning-store";
import { XP_VALUES } from "@/shared/types";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function ContentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { state, dispatch, addXp } = useLearning();
  const [summaryData, setSummaryData] = useState<any>(null);
  const [simplifyData, setSimplifyData] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingSimplify, setLoadingSimplify] = useState(false);
  const [showEli5, setShowEli5] = useState(false);

  const contentQuery = trpc.content.getById.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );
  const summarizeMutation = trpc.content.summarize.useMutation();
  const simplifyMutation = trpc.content.simplify.useMutation();

  const content = contentQuery.data;
  const skillLevel = state.profile.skillLevel;
  const isSaved = content ? state.savedContentIds.includes(content.id) : false;

  // Auto-generate summary when content loads
  useEffect(() => {
    if (content && !summaryData && !loadingSummary) {
      setLoadingSummary(true);
      summarizeMutation
        .mutateAsync({
          title: content.title,
          description: content.description || content.title,
          topicSlug: content.topicSlug || "",
          skillLevel,
        })
        .then((data) => {
          setSummaryData(data);
          setLoadingSummary(false);
        })
        .catch(() => setLoadingSummary(false));
    }
  }, [content, summaryData, loadingSummary, skillLevel]);

  const handleSimplify = useCallback(() => {
    if (!content || loadingSimplify) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingSimplify(true);
    simplifyMutation
      .mutateAsync({
        title: content.title,
        description: content.description || content.title,
        topicSlug: content.topicSlug || "",
        currentLevel: skillLevel,
      })
      .then((data) => {
        setSimplifyData(data);
        setLoadingSimplify(false);
      })
      .catch(() => setLoadingSimplify(false));
  }, [content, skillLevel, loadingSimplify, simplifyMutation]);

  const handleWatch = useCallback(() => {
    if (!content?.url) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addXp(XP_VALUES.videoComplete);
    dispatch({
      type: "RECORD_ENGAGEMENT",
      payload: {
        cardId: `content-${content.id}`,
        cardType: "video",
        timeSpentMs: (content.durationSeconds || 300) * 1000,
        timestamp: Date.now(),
        hourOfDay: new Date().getHours(),
      },
    });
    Linking.openURL(content.url);
  }, [content, addXp, dispatch]);

  const handleSave = useCallback(() => {
    if (!content) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch({ type: "TOGGLE_SAVE", payload: content.id });
  }, [content, dispatch]);

  const handleMindBlown = useCallback(() => {
    if (!content) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    addXp(XP_VALUES.videoComplete);
    dispatch({ type: "INCREMENT_MIND_BLOWN" });
    dispatch({
      type: "ADD_SPACED_REP",
      payload: {
        contentId: content.id,
        title: content.title,
        thumbnailUrl: content.thumbnailUrl || "",
        topicSlug: content.topicSlug || "",
        easeFactor: 2.5,
        interval: 1,
        repetition: 0,
        lastReviewDate: new Date().toISOString().split("T")[0],
        nextReviewDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        memoryStrength: 20,
      },
    });
  }, [content, addXp, dispatch]);

  if (contentQuery.isLoading) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1">
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!content) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1">
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.muted }]}>Content not found</Text>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }]}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const isVideo = content.type === "video";
  const duration = content.durationSeconds
    ? `${Math.floor(content.durationSeconds / 60)}:${String(content.durationSeconds % 60).padStart(2, "0")}`
    : null;

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 8 }]}
        >
          <Text style={[styles.backArrow, { color: colors.primary }]}>{"< Back"}</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 8 }]}
        >
          <Text style={{ fontSize: 22 }}>{isSaved ? "\u{1F4BE}" : "\u{1F516}"}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Thumbnail / Video Preview */}
        <Pressable onPress={handleWatch} style={({ pressed }) => [{ opacity: pressed ? 0.95 : 1 }]}>
          <View style={styles.videoContainer}>
            {content.thumbnailUrl ? (
              <Image source={{ uri: content.thumbnailUrl }} style={styles.videoThumb} resizeMode="cover" />
            ) : (
              <View style={[styles.videoThumb, { backgroundColor: colors.primary + "30", justifyContent: "center", alignItems: "center" }]}>
                <Text style={{ fontSize: 48 }}>{isVideo ? "\u{1F3AC}" : "\u{1F4D6}"}</Text>
              </View>
            )}
            <View style={styles.playOverlay}>
              <View style={styles.playButton}>
                <Text style={{ fontSize: 28, color: "#FFF" }}>{"\u25B6"}</Text>
              </View>
              <Text style={styles.watchText}>Watch on YouTube</Text>
            </View>
            {duration && (
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{duration}</Text>
              </View>
            )}
          </View>
        </Pressable>

        {/* Title & Meta */}
        <View style={styles.contentSection}>
          <Text style={[styles.title, { color: colors.foreground }]}>{content.title}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.channel, { color: colors.muted }]}>
              {content.channelOrAuthor || "Unknown"}
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

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <Pressable
            onPress={handleWatch}
            style={({ pressed }) => [styles.primaryAction, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }]}
          >
            <Text style={styles.primaryActionText}>
              {isVideo ? "\u25B6  Watch Now" : "\u{1F4D6}  Read Now"}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleMindBlown}
            style={({ pressed }) => [styles.secondaryAction, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={{ fontSize: 22 }}>{"\u{1F92F}"}</Text>
          </Pressable>
        </View>

        {/* AI Summary Section */}
        <View style={[styles.summarySection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.summaryHeader}>
            <Text style={{ fontSize: 18 }}>{"\u{1F916}"}</Text>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>AI Learning Summary</Text>
            {loadingSummary && <ActivityIndicator size="small" color={colors.primary} />}
          </View>

          {summaryData ? (
            <Animated.View entering={FadeInDown.duration(300)}>
              {/* Summary */}
              <Text style={[styles.summaryText, { color: colors.foreground }]}>
                {summaryData.summary}
              </Text>

              {/* Why it matters */}
              {summaryData.whyItMatters && (
                <View style={[styles.whyBox, { backgroundColor: colors.primary + "10" }]}>
                  <Text style={[styles.whyLabel, { color: colors.primary }]}>Why this matters</Text>
                  <Text style={[styles.whyText, { color: colors.foreground }]}>{summaryData.whyItMatters}</Text>
                </View>
              )}

              {/* ELI5 toggle */}
              {summaryData.eli5 && (
                <Pressable
                  onPress={() => setShowEli5(!showEli5)}
                  style={({ pressed }) => [styles.eli5Toggle, { backgroundColor: colors.warning + "15", opacity: pressed ? 0.8 : 1 }]}
                >
                  <Text style={{ fontSize: 16 }}>{"\u{1F476}"}</Text>
                  <Text style={[styles.eli5ToggleText, { color: colors.warning }]}>
                    {showEli5 ? "Hide" : "Show"} Explain Like I'm 5
                  </Text>
                </Pressable>
              )}
              {showEli5 && summaryData.eli5 && (
                <Animated.View entering={FadeInDown.duration(200)} style={[styles.eli5Box, { backgroundColor: colors.warning + "10" }]}>
                  <Text style={[styles.eli5Text, { color: colors.foreground }]}>{summaryData.eli5}</Text>
                </Animated.View>
              )}

              {/* Key Takeaways */}
              {summaryData.keyTakeaways?.length > 0 && (
                <View style={styles.takeawaysSection}>
                  <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Key Takeaways</Text>
                  {summaryData.keyTakeaways.map((t: string, i: number) => (
                    <View key={i} style={styles.takeawayRow}>
                      <Text style={[styles.takeawayBullet, { color: colors.primary }]}>{"\u2713"}</Text>
                      <Text style={[styles.takeawayText, { color: colors.foreground }]}>{t}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Prerequisites */}
              {summaryData.prerequisites?.length > 0 && (
                <View style={styles.prereqSection}>
                  <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
                    {"\u{1F4DA}"} Prerequisites
                  </Text>
                  {summaryData.prerequisites.map((p: string, i: number) => (
                    <Text key={i} style={[styles.prereqItem, { color: colors.muted }]}>
                      {"  \u2022  "}{p}
                    </Text>
                  ))}
                </View>
              )}

              {/* Next Steps */}
              {summaryData.nextSteps?.length > 0 && (
                <View style={styles.nextSection}>
                  <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
                    {"\u{1F680}"} What to Learn Next
                  </Text>
                  {summaryData.nextSteps.map((s: string, i: number) => (
                    <Text key={i} style={[styles.nextItem, { color: colors.primary }]}>
                      {`${i + 1}. ${s}`}
                    </Text>
                  ))}
                </View>
              )}
            </Animated.View>
          ) : loadingSummary ? (
            <View style={styles.summaryLoading}>
              <Text style={[styles.summaryLoadingText, { color: colors.muted }]}>
                Analyzing this content for your {skillLevel} level...
              </Text>
            </View>
          ) : null}
        </View>

        {/* "I Don't Understand" Button */}
        <View style={styles.simplifySection}>
          <Pressable
            onPress={handleSimplify}
            style={({ pressed }) => [
              styles.simplifyBtn,
              {
                backgroundColor: colors.error + "10",
                borderColor: colors.error + "30",
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            {loadingSimplify ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <>
                <Text style={{ fontSize: 20 }}>{"\u{1F914}"}</Text>
                <Text style={[styles.simplifyBtnText, { color: colors.error }]}>
                  I don't understand — explain simpler
                </Text>
              </>
            )}
          </Pressable>

          {simplifyData && (
            <Animated.View entering={FadeInDown.duration(300)} style={[styles.simplifyResult, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.simplifyResultTitle, { color: colors.foreground }]}>
                {"\u{1F4A1}"} Simpler Explanation
              </Text>
              <Text style={[styles.simplifyResultText, { color: colors.foreground }]}>
                {simplifyData.explanation}
              </Text>
              {simplifyData.analogy && (
                <View style={[styles.analogyBox, { backgroundColor: colors.primary + "10" }]}>
                  <Text style={[styles.analogyLabel, { color: colors.primary }]}>Think of it like this:</Text>
                  <Text style={[styles.analogyText, { color: colors.foreground }]}>{simplifyData.analogy}</Text>
                </View>
              )}
              {simplifyData.tryThis && (
                <View style={[styles.tryBox, { backgroundColor: colors.success + "10" }]}>
                  <Text style={[styles.tryLabel, { color: colors.success }]}>Try this:</Text>
                  <Text style={[styles.tryText, { color: colors.foreground }]}>{simplifyData.tryThis}</Text>
                </View>
              )}
            </Animated.View>
          )}
        </View>

        {/* Description */}
        {content.description && (
          <View style={styles.descSection}>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Description</Text>
            <Text style={[styles.descText, { color: colors.muted }]}>{content.description}</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 16, marginBottom: 16 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  backBtnText: { color: "#FFF", fontWeight: "600" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  backArrow: { fontSize: 16, fontWeight: "600" },
  videoContainer: { position: "relative", width: "100%", height: 220 },
  videoThumb: { width: "100%", height: "100%" },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 4,
  },
  watchText: { color: "#FFF", fontSize: 14, fontWeight: "600", marginTop: 8 },
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
  contentSection: { padding: 16 },
  title: { fontSize: 20, fontWeight: "800", lineHeight: 28 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 },
  channel: { fontSize: 14 },
  topicPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  topicPillText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  actionRow: { flexDirection: "row", paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  primaryAction: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  primaryActionText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  secondaryAction: { width: 52, height: 52, borderRadius: 12, borderWidth: 1, justifyContent: "center", alignItems: "center" },
  summarySection: { marginHorizontal: 16, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  summaryHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  summaryTitle: { fontSize: 16, fontWeight: "700", flex: 1 },
  summaryText: { fontSize: 15, lineHeight: 24, marginBottom: 12 },
  summaryLoading: { paddingVertical: 16, alignItems: "center" },
  summaryLoadingText: { fontSize: 14 },
  whyBox: { padding: 12, borderRadius: 10, marginBottom: 12 },
  whyLabel: { fontSize: 12, fontWeight: "700", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  whyText: { fontSize: 14, lineHeight: 22 },
  eli5Toggle: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, marginBottom: 8 },
  eli5ToggleText: { fontSize: 14, fontWeight: "600" },
  eli5Box: { padding: 12, borderRadius: 10, marginBottom: 12 },
  eli5Text: { fontSize: 15, lineHeight: 24, fontStyle: "italic" },
  takeawaysSection: { marginBottom: 12 },
  sectionLabel: { fontSize: 15, fontWeight: "700", marginBottom: 8 },
  takeawayRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  takeawayBullet: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  takeawayText: { fontSize: 14, lineHeight: 22, flex: 1 },
  prereqSection: { marginBottom: 12 },
  prereqItem: { fontSize: 14, lineHeight: 22, marginBottom: 2 },
  nextSection: { marginBottom: 8 },
  nextItem: { fontSize: 14, lineHeight: 22, marginBottom: 4, fontWeight: "500" },
  simplifySection: { paddingHorizontal: 16, marginBottom: 16 },
  simplifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  simplifyBtnText: { fontSize: 15, fontWeight: "600" },
  simplifyResult: { marginTop: 12, padding: 16, borderRadius: 14, borderWidth: 1 },
  simplifyResultTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  simplifyResultText: { fontSize: 15, lineHeight: 24, marginBottom: 12 },
  analogyBox: { padding: 12, borderRadius: 10, marginBottom: 10 },
  analogyLabel: { fontSize: 12, fontWeight: "700", marginBottom: 4, textTransform: "uppercase" },
  analogyText: { fontSize: 14, lineHeight: 22 },
  tryBox: { padding: 12, borderRadius: 10 },
  tryLabel: { fontSize: 12, fontWeight: "700", marginBottom: 4, textTransform: "uppercase" },
  tryText: { fontSize: 14, lineHeight: 22 },
  descSection: { paddingHorizontal: 16, marginBottom: 16 },
  descText: { fontSize: 14, lineHeight: 22 },
});
