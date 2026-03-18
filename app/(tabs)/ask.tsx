import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useLearning } from "@/lib/learning-store";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { trpc } from "@/lib/trpc";
import { openVideoInApp } from "@/lib/video-utils";
import type {
  JourneyStage,
  LearningJourney,
  ContentItemData,
} from "@/shared/types";
import {
  JOURNEY_STAGE_XP,
  CHECK_INCORRECT_XP,
  CHALLENGE_TIMER_SECONDS,
  CHALLENGE_BONUS_XP,
  getStreakMultiplier,
  calculateMasteryScore,
  computeDifficultyLevel,
  DIFFICULTY_LEVELS,
} from "@/shared/types";
import type { DifficultyLevel } from "@/shared/types";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId() {
  return `journey-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Render text with **bold** markdown support */
function RichText({ text, style, boldStyle }: { text: string; style: any; boldStyle?: any }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return (
    <Text style={style}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <Text key={i} style={[style, { fontWeight: "700" }, boldStyle]}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}

// Stage accent colors mapped to stage types
const STAGE_ACCENTS: Record<string, { bg: string; text: string; label: string }> = {
  hook: { bg: "#FEF3C7", text: "#92400E", label: "The Hook" },
  foundation: { bg: "#DBEAFE", text: "#1E40AF", label: "Foundation" },
  explanation: { bg: "#EDE9FE", text: "#5B21B6", label: "The Answer" },
  real_world: { bg: "#D1FAE5", text: "#065F46", label: "See It" },
  check: { bg: "#FCE7F3", text: "#9D174D", label: "Quick Check" },
  video: { bg: "#FEE2E2", text: "#991B1B", label: "Go Deeper" },
  next_steps: { bg: "#E0E7FF", text: "#3730A3", label: "Keep Exploring" },
};

const STAGE_ACCENTS_DARK: Record<string, { bg: string; text: string; label: string }> = {
  hook: { bg: "#78350F30", text: "#FCD34D", label: "The Hook" },
  foundation: { bg: "#1E3A5F30", text: "#93C5FD", label: "Foundation" },
  explanation: { bg: "#4C1D9530", text: "#C4B5FD", label: "The Answer" },
  real_world: { bg: "#064E3B30", text: "#6EE7B7", label: "See It" },
  check: { bg: "#83185830", text: "#F9A8D4", label: "Quick Check" },
  video: { bg: "#7F1D1D30", text: "#FCA5A5", label: "Go Deeper" },
  next_steps: { bg: "#312E8130", text: "#A5B4FC", label: "Keep Exploring" },
};

// ─── XP Popup Animation ──────────────────────────────────────────────────────

function XpPopup({ amount, multiplier }: { amount: number; multiplier: number }) {
  const colors = useColors();
  // amount already includes multiplier, just display it
  return (
    <Animated.View
      entering={FadeInUp.duration(400).springify()}
      exiting={FadeOut.delay(1200).duration(300)}
      style={styles.xpPopup}
    >
      <Text style={[styles.xpPopupText, { color: colors.success }]}>
        +{amount} XP{multiplier > 1 ? ` (${multiplier}x)` : ""}
      </Text>
    </Animated.View>
  );
}

// ─── Streak Multiplier Badge ─────────────────────────────────────────────────

function StreakBadge({ streak, multiplier }: { streak: number; multiplier: number }) {
  const colors = useColors();
  if (streak < 3) return null;

  const badgeColor = streak >= 10 ? "#EF4444" : streak >= 5 ? "#F59E0B" : "#22C55E";
  const label = streak >= 10 ? "ON FIRE" : streak >= 5 ? "HOT STREAK" : "STREAK";

  return (
    <Animated.View entering={FadeIn.duration(300)} style={[styles.streakBadge, { backgroundColor: badgeColor + "20", borderColor: badgeColor + "40" }]}>
      <Text style={[styles.streakBadgeIcon]}>{"⚡"}</Text>
      <View>
        <Text style={[styles.streakBadgeLabel, { color: badgeColor }]}>{label}</Text>
        <Text style={[styles.streakBadgeValue, { color: badgeColor }]}>{streak} correct \u00B7 {multiplier}x XP</Text>
      </View>
    </Animated.View>
  );
}

// ─── Challenge Timer ─────────────────────────────────────────────────────────

function ChallengeTimer({
  seconds,
  onExpire,
  active,
}: {
  seconds: number;
  onExpire: () => void;
  active: boolean;
}) {
  const colors = useColors();
  const [remaining, setRemaining] = useState(seconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) return;
    setRemaining(seconds);
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [active, seconds]);

  if (!active) return null;

  const pct = remaining / seconds;
  const timerColor = pct > 0.5 ? colors.success : pct > 0.2 ? "#F59E0B" : colors.error;

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.timerWrap}>
      <View style={[styles.timerBar, { backgroundColor: timerColor + "20" }]}>
        <Animated.View style={[styles.timerFill, { backgroundColor: timerColor, width: `${pct * 100}%` }]} />
      </View>
      <View style={styles.timerRow}>
        <Text style={[styles.timerLabel, { color: timerColor }]}>
          {"⏱"} Challenge Mode
        </Text>
        <Text style={[styles.timerValue, { color: timerColor }]}>
          {remaining}s {remaining > 0 ? `(+${CHALLENGE_BONUS_XP} bonus XP)` : "Time's up!"}
        </Text>
      </View>
    </Animated.View>
  );
}

// ─── Difficulty Badge ─────────────────────────────────────────────────────

const DIFFICULTY_COLORS: Record<number, string> = {
  1: "#22C55E", // green
  2: "#0EA5E9", // blue
  3: "#8B5CF6", // purple
  4: "#F59E0B", // amber
  5: "#EF4444", // red
};

function DifficultyBadge({ level, label }: { level: number; label: string }) {
  const badgeColor = DIFFICULTY_COLORS[level] || "#8B5CF6";
  const levelEmoji = DIFFICULTY_LEVELS[level - 1]?.emoji || "📚";

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.difficultyBadge, { backgroundColor: badgeColor + "15", borderColor: badgeColor + "30" }]}
    >
      <Text style={styles.difficultyBadgeEmoji}>{levelEmoji}</Text>
      <Text style={[styles.difficultyBadgeText, { color: badgeColor }]}>{label}</Text>
    </Animated.View>
  );
}

// ─── Journey Completion Card ─────────────────────────────────────────────────

function JourneyCompleteCard({
  journey,
  xpEarned,
  masteryScore,
  isPerfect,
  checkStreak,
  isDark,
  onNewJourney,
}: {
  journey: LearningJourney;
  xpEarned: number;
  masteryScore: number;
  isPerfect: boolean;
  checkStreak: number;
  isDark: boolean;
  onNewJourney: () => void;
}) {
  const colors = useColors();

  const masteryLabel =
    masteryScore >= 90 ? "Mastery" : masteryScore >= 70 ? "Proficient" : masteryScore >= 50 ? "Developing" : "Exploring";
  const masteryColor =
    masteryScore >= 90 ? "#22C55E" : masteryScore >= 70 ? "#0EA5E9" : masteryScore >= 50 ? "#F59E0B" : colors.muted;

  return (
    <Animated.View entering={FadeIn.duration(500)} style={[styles.completeCard, { backgroundColor: isDark ? "#1A1A2E" : "#FFFFFF" }]}>
      {/* Celebration header */}
      <View style={styles.completeHeader}>
        <Text style={styles.completeEmoji}>{isPerfect ? "🌟" : "🎉"}</Text>
        <Text style={[styles.completeTitle, { color: colors.foreground }]}>
          {isPerfect ? "Perfect Journey!" : "Journey Complete!"}
        </Text>
        <Text style={[styles.completeQuestion, { color: colors.muted }]}>
          {journey.question}
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { backgroundColor: isDark ? colors.surface : "#F0FDF4" }]}>
          <Text style={[styles.statValue, { color: "#22C55E" }]}>+{xpEarned}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>XP Earned</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: isDark ? colors.surface : "#EFF6FF" }]}>
          <Text style={[styles.statValue, { color: masteryColor }]}>{masteryScore}%</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>{masteryLabel}</Text>
        </View>
      </View>

      {/* Streak info */}
      {checkStreak >= 3 && (
        <View style={[styles.completeStreak, { backgroundColor: isDark ? "#F59E0B15" : "#FFFBEB" }]}>
          <Text style={styles.completeStreakIcon}>{"⚡"}</Text>
          <Text style={[styles.completeStreakText, { color: "#F59E0B" }]}>
            {checkStreak} correct answers in a row! {getStreakMultiplier(checkStreak)}x XP multiplier active
          </Text>
        </View>
      )}

      {/* Difficulty level */}
      <View style={[styles.completeDifficulty, { backgroundColor: isDark ? (DIFFICULTY_COLORS[journey.difficultyLevel] || "#8B5CF6") + "10" : (DIFFICULTY_COLORS[journey.difficultyLevel] || "#8B5CF6") + "08" }]}>
        <Text style={styles.completeDifficultyEmoji}>{DIFFICULTY_LEVELS[(journey.difficultyLevel || 1) - 1]?.emoji || "📚"}</Text>
        <View>
          <Text style={[styles.completeDifficultyLabel, { color: DIFFICULTY_COLORS[journey.difficultyLevel] || "#8B5CF6" }]}>Level {journey.difficultyLevel || 1}</Text>
          <Text style={[styles.completeDifficultyName, { color: colors.muted }]}>{journey.difficultyLabel || "Curious Beginner"}</Text>
        </View>
      </View>

      {/* Concepts learned */}
      <View style={styles.completeConcepts}>
        <Text style={[styles.completeConceptsTitle, { color: colors.foreground }]}>Concepts Explored</Text>
        <View style={styles.conceptTags}>
          {journey.mappedConcepts.map((c, i) => (
            <View key={i} style={[styles.conceptTag, { backgroundColor: isDark ? colors.primary + "20" : "#EDE9FE" }]}>
              <Text style={[styles.conceptTagText, { color: isDark ? colors.primary : "#5B21B6" }]}>{c}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Action */}
      <TouchableOpacity
        onPress={onNewJourney}
        activeOpacity={0.7}
        style={[styles.completeBtn, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.completeBtnText}>Start New Journey</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Suggestion Chips ─────────────────────────────────────────────────────────

const FALLBACK_SUGGESTIONS = [
  "Why is the sky blue?",
  "How do airplanes stay in the air?",
  "What is quantum physics, really?",
  "How does the internet actually work?",
];

function SuggestionChips({
  onSelect,
  suggestions,
  reasons,
  loading,
}: {
  onSelect: (q: string) => void;
  suggestions: string[];
  reasons: string[];
  loading: boolean;
}) {
  const colors = useColors();
  const items = suggestions.length > 0 ? suggestions : FALLBACK_SUGGESTIONS;

  return (
    <View style={styles.suggestionsWrap}>
      {loading ? (
        <Animated.View entering={FadeIn.duration(200)} style={styles.suggestionsLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.suggestionsLoadingText, { color: colors.muted }]}>
            Personalizing for you...
          </Text>
        </Animated.View>
      ) : (
        items.map((q, i) => (
          <Animated.View key={q} entering={FadeInUp.delay(i * 80).duration(300)}>
            <TouchableOpacity
              onPress={() => onSelect(q)}
              style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, { color: colors.foreground }]}>{q}</Text>
              {reasons[i] && suggestions.length > 0 ? (
                <Text style={[styles.chipReason, { color: colors.muted }]}>{reasons[i]}</Text>
              ) : null}
            </TouchableOpacity>
          </Animated.View>
        ))
      )}
    </View>
  );
}

// ─── Progress Dots ────────────────────────────────────────────────────────────

function ProgressDots({
  total,
  current,
  onDotPress,
}: {
  total: number;
  current: number;
  onDotPress: (idx: number) => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i === current;
        const isPast = i < current;
        return (
          <TouchableOpacity
            key={i}
            onPress={() => {
              if (isPast) onDotPress(i);
            }}
            activeOpacity={isPast ? 0.6 : 1}
            style={[
              styles.dot,
              {
                backgroundColor: isActive
                  ? colors.primary
                  : isPast
                  ? colors.primary + "60"
                  : colors.border,
                width: isActive ? 24 : 8,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

// ─── Stage Cards ──────────────────────────────────────────────────────────────

function HookCard({ stage, isDark }: { stage: JourneyStage; isDark: boolean }) {
  const colors = useColors();
  const accent = isDark ? STAGE_ACCENTS_DARK.hook : STAGE_ACCENTS.hook;
  return (
    <View style={[styles.stageCard, { backgroundColor: accent.bg }]}>
      <Text style={styles.stageEmoji}>{stage.emoji}</Text>
      <Text style={[styles.stageLabel, { color: accent.text }]}>{accent.label}</Text>
      <Text style={[styles.stageTitle, { color: isDark ? colors.foreground : "#1A1A2E" }]}>{stage.title}</Text>
      <RichText text={stage.content} style={[styles.stageContent, { color: isDark ? colors.foreground + "DD" : "#374151" }]} />
    </View>
  );
}

function FoundationCard({ stage, isDark }: { stage: JourneyStage; isDark: boolean }) {
  const colors = useColors();
  const accent = isDark ? STAGE_ACCENTS_DARK.foundation : STAGE_ACCENTS.foundation;
  return (
    <View style={[styles.stageCard, { backgroundColor: accent.bg }]}>
      <Text style={styles.stageEmoji}>{stage.emoji}</Text>
      <Text style={[styles.stageLabel, { color: accent.text }]}>{accent.label}</Text>
      <Text style={[styles.stageTitle, { color: isDark ? colors.foreground : "#1A1A2E" }]}>{stage.title}</Text>
      <RichText text={stage.content} style={[styles.stageContent, { color: isDark ? colors.foreground + "DD" : "#374151" }]} />
      {stage.keyTakeaway ? (
        <View style={[styles.takeawayBox, { backgroundColor: isDark ? accent.text + "20" : "#ECFDF5", borderColor: isDark ? accent.text + "40" : "#6EE7B7" }]}>
          <Text style={[styles.takeawayLabel, { color: accent.text }]}>Key Concept</Text>
          <Text style={[styles.takeawayText, { color: isDark ? colors.foreground : "#374151" }]}>{stage.keyTakeaway}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ExplanationCard({ stage, isDark }: { stage: JourneyStage; isDark: boolean }) {
  const colors = useColors();
  const accent = isDark ? STAGE_ACCENTS_DARK.explanation : STAGE_ACCENTS.explanation;
  return (
    <View style={[styles.stageCard, { backgroundColor: accent.bg }]}>
      <Text style={styles.stageEmoji}>{stage.emoji}</Text>
      <Text style={[styles.stageLabel, { color: accent.text }]}>{accent.label}</Text>
      <Text style={[styles.stageTitle, { color: isDark ? colors.foreground : "#1A1A2E" }]}>{stage.title}</Text>
      <RichText text={stage.content} style={[styles.stageContent, { color: isDark ? colors.foreground + "DD" : "#374151" }]} />
      {stage.keyTakeaway ? (
        <View style={[styles.takeawayBox, { backgroundColor: isDark ? colors.primary + "20" : "#F5F3FF", borderColor: isDark ? colors.primary + "40" : "#C4B5FD" }]}>
          <Text style={[styles.takeawayLabel, { color: accent.text }]}>Key Takeaway</Text>
          <Text style={[styles.takeawayText, { color: isDark ? colors.foreground : "#374151" }]}>{stage.keyTakeaway}</Text>
        </View>
      ) : null}
    </View>
  );
}

function RealWorldCard({ stage, isDark }: { stage: JourneyStage; isDark: boolean }) {
  const colors = useColors();
  const accent = isDark ? STAGE_ACCENTS_DARK.real_world : STAGE_ACCENTS.real_world;
  return (
    <View style={[styles.stageCard, { backgroundColor: accent.bg }]}>
      <Text style={styles.stageEmoji}>{stage.emoji}</Text>
      <Text style={[styles.stageLabel, { color: accent.text }]}>{accent.label}</Text>
      <Text style={[styles.stageTitle, { color: isDark ? colors.foreground : "#1A1A2E" }]}>{stage.title}</Text>
      <RichText text={stage.content} style={[styles.stageContent, { color: isDark ? colors.foreground + "DD" : "#374151" }]} />
      {stage.keyTakeaway ? (
        <View style={[styles.takeawayBox, { backgroundColor: isDark ? accent.text + "20" : "#ECFDF5", borderColor: isDark ? accent.text + "40" : "#6EE7B7" }]}>
          <Text style={[styles.takeawayLabel, { color: accent.text }]}>Real-World Example</Text>
          <Text style={[styles.takeawayText, { color: isDark ? colors.foreground : "#374151" }]}>{stage.keyTakeaway}</Text>
        </View>
      ) : null}
    </View>
  );
}

function CheckCard({
  stage,
  isDark,
  onAnswer,
}: {
  stage: JourneyStage;
  isDark: boolean;
  onAnswer: (correct: boolean) => void;
}) {
  const colors = useColors();
  const accent = isDark ? STAGE_ACCENTS_DARK.check : STAGE_ACCENTS.check;
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;

  const handleSelect = (idx: number) => {
    if (answered) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(idx);
    onAnswer(idx === stage.correctIndex);
  };

  return (
    <View style={[styles.stageCard, { backgroundColor: accent.bg }]}>
      <Text style={styles.stageEmoji}>{stage.emoji}</Text>
      <Text style={[styles.stageLabel, { color: accent.text }]}>{accent.label}</Text>
      <Text style={[styles.stageTitle, { color: isDark ? colors.foreground : "#1A1A2E" }]}>{stage.question || stage.title}</Text>
      {stage.content ? (
        <RichText text={stage.content} style={[styles.stageContent, { color: isDark ? colors.foreground + "DD" : "#374151", marginBottom: 20 }]} />
      ) : null}

      {(stage.options || []).map((opt, idx) => {
        const isCorrect = idx === stage.correctIndex;
        const isSelected = idx === selected;
        let optBg = isDark ? colors.surface : "#FFFFFF";
        let optBorder = isDark ? colors.border : "#E5E7EB";
        let optText = isDark ? colors.foreground : "#374151";

        if (answered) {
          if (isCorrect) {
            optBg = colors.success + "20";
            optBorder = colors.success;
            optText = colors.success;
          } else if (isSelected && !isCorrect) {
            optBg = colors.error + "20";
            optBorder = colors.error;
            optText = colors.error;
          }
        }

        return (
          <TouchableOpacity
            key={idx}
            onPress={() => handleSelect(idx)}
            activeOpacity={0.7}
            style={[styles.checkOption, { backgroundColor: optBg, borderColor: optBorder }]}
          >
            <Text style={[styles.checkOptionText, { color: optText }]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}

      {answered && stage.explanation ? (
        <Animated.View entering={FadeIn.duration(250)} style={[styles.checkExplanation, { backgroundColor: isDark ? colors.surface : "#FFFFFF80" }]}>
          <Text style={[styles.checkExplanationText, { color: isDark ? colors.foreground + "DD" : "#374151" }]}>
            {stage.explanation}
          </Text>
        </Animated.View>
      ) : null}

      {/* Gamification feedback */}
      {answered && (
        <Animated.View entering={FadeInUp.delay(300).duration(300)} style={{ marginTop: 16, alignItems: "center" }}>
          <Text style={{ fontSize: 32, marginBottom: 4 }}>
            {selected === stage.correctIndex ? "🌟" : "💪"}
          </Text>
          <Text style={{ fontSize: 15, fontWeight: "700", color: selected === stage.correctIndex ? colors.success : colors.warning, textAlign: "center" }}>
            {selected === stage.correctIndex ? "Nailed it!" : "Good try — now you know!"}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

function VideoCard({
  stage,
  isDark,
  videos,
  videosLoading,
  onWatch,
}: {
  stage: JourneyStage;
  isDark: boolean;
  videos: ContentItemData[];
  videosLoading: boolean;
  onWatch: (url: string, title: string) => void;
}) {
  const colors = useColors();
  const accent = isDark ? STAGE_ACCENTS_DARK.video : STAGE_ACCENTS.video;
  const video = videos.length > 0 ? videos[0] : null;
  const duration = video?.durationSeconds
    ? `${Math.floor(video.durationSeconds / 60)}:${String(video.durationSeconds % 60).padStart(2, "0")}`
    : null;

  return (
    <View style={[styles.stageCard, { backgroundColor: accent.bg }]}>
      <Text style={styles.stageEmoji}>{stage.emoji}</Text>
      <Text style={[styles.stageLabel, { color: accent.text }]}>{accent.label}</Text>
      <Text style={[styles.stageTitle, { color: isDark ? colors.foreground : "#1A1A2E" }]}>{stage.title}</Text>
      {stage.videoContext ? (
        <RichText text={stage.videoContext} style={[styles.stageContent, { color: isDark ? colors.foreground + "DD" : "#374151", marginBottom: 20 }]} />
      ) : null}

      {videosLoading ? (
        <View style={styles.videoLoading}>
          <ActivityIndicator size="small" color={accent.text} />
          <Text style={[styles.videoLoadingText, { color: isDark ? colors.muted : "#6B7280" }]}>Finding the best video...</Text>
        </View>
      ) : video ? (
        <TouchableOpacity
          onPress={() => onWatch(video.url, video.title)}
          activeOpacity={0.8}
          style={[styles.videoPreview, { borderColor: isDark ? colors.border : "#E5E7EB" }]}
        >
          {video.thumbnailUrl ? (
            <View style={styles.videoThumbWrap}>
              <Image source={{ uri: video.thumbnailUrl }} style={styles.videoThumb} contentFit="cover" />
              <View style={styles.playOverlay}>
                <View style={styles.playButton}>
                  <Text style={styles.playIcon}>{"▶"}</Text>
                </View>
              </View>
              {duration ? (
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{duration}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
          <View style={styles.videoMeta}>
            <Text numberOfLines={2} style={[styles.videoMetaTitle, { color: isDark ? colors.foreground : "#1A1A2E" }]}>
              {video.title}
            </Text>
            <Text numberOfLines={1} style={[styles.videoMetaChannel, { color: isDark ? colors.muted : "#6B7280" }]}>
              {video.channelOrAuthor || video.source}
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        <Text style={[styles.stageContent, { color: isDark ? colors.muted : "#6B7280" }]}>
          No video found for this topic. Try the next steps below!
        </Text>
      )}
    </View>
  );
}

function NextStepsCard({
  stage,
  isDark,
  onSelect,
  onComplete,
}: {
  stage: JourneyStage;
  isDark: boolean;
  onSelect: (question: string) => void;
  onComplete: () => void;
}) {
  const colors = useColors();
  const accent = isDark ? STAGE_ACCENTS_DARK.next_steps : STAGE_ACCENTS.next_steps;
  const paths = stage.paths || [];

  return (
    <View style={[styles.stageCard, { backgroundColor: accent.bg }]}>
      <Text style={styles.stageEmoji}>{stage.emoji}</Text>
      <Text style={[styles.stageLabel, { color: accent.text }]}>{accent.label}</Text>
      <Text style={[styles.stageTitle, { color: isDark ? colors.foreground : "#1A1A2E" }]}>{stage.title}</Text>

      {paths.map((path, idx) => (
        <Animated.View key={idx} entering={FadeInUp.delay(idx * 100).duration(300)}>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(path.question);
            }}
            activeOpacity={0.7}
            style={[styles.nextPath, { backgroundColor: isDark ? colors.surface : "#FFFFFF", borderColor: isDark ? colors.border : "#E5E7EB" }]}
          >
            <Text style={[styles.nextPathQuestion, { color: isDark ? colors.foreground : "#1A1A2E" }]}>
              {path.question}
            </Text>
            <Text style={[styles.nextPathReason, { color: isDark ? colors.muted : "#6B7280" }]}>
              {path.reason}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      ))}

      {/* Complete Journey button */}
      <Animated.View entering={FadeInUp.delay(paths.length * 100 + 100).duration(300)}>
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onComplete();
          }}
          activeOpacity={0.7}
          style={[styles.completeJourneyBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.completeJourneyBtnText}>{"\u2728"} Complete Journey</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── Recent Journeys ──────────────────────────────────────────────────────────

function RecentJourneys({
  journeys,
  onSelect,
}: {
  journeys: LearningJourney[];
  onSelect: (j: LearningJourney) => void;
}) {
  const colors = useColors();
  if (journeys.length === 0) return null;

  return (
    <View style={styles.recentWrap}>
      <Text style={[styles.recentTitle, { color: colors.muted }]}>Recent Journeys</Text>
      {journeys.slice(0, 5).map((j) => (
        <TouchableOpacity
          key={j.id}
          onPress={() => onSelect(j)}
          activeOpacity={0.7}
          style={[styles.recentItem, { borderColor: colors.border }]}
        >
          <View style={styles.recentItemRow}>
            <Text style={styles.recentEmoji}>{j.emoji}</Text>
            <View style={styles.recentItemContent}>
              <Text numberOfLines={1} style={[styles.recentQuestion, { color: colors.foreground }]}>
                {j.question}
              </Text>
              <Text style={[styles.recentMeta, { color: colors.muted }]}>
                {j.completed ? "Completed" : `${j.currentStageIndex + 1}/${j.stages.length} stages`}
                {" \u00B7 "}
                {j.mappedConcepts.slice(0, 2).join(", ")}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Main Ask Screen ──────────────────────────────────────────────────────────

export default function AskScreen() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { state, dispatch, addXp } = useLearning();
  const params = useLocalSearchParams<{ q?: string }>();
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [suggestionReasons, setSuggestionReasons] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const hasAutoAsked = useRef(false);

  // Journey state
  const [activeJourney, setActiveJourney] = useState<LearningJourney | null>(null);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [stageVideos, setStageVideos] = useState<ContentItemData[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [checkAnswered, setCheckAnswered] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Gamification state
  const [journeyXp, setJourneyXp] = useState(0);
  const [showXpPopup, setShowXpPopup] = useState(false);
  const [lastXpGain, setLastXpGain] = useState(0);
  const [challengeTimerActive, setChallengeTimerActive] = useState(false);
  const [challengeTimerExpired, setChallengeTimerExpired] = useState(false);
  const [checkStartTime, setCheckStartTime] = useState(0);
  const [journeyCheckCorrect, setJourneyCheckCorrect] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [videoWatched, setVideoWatched] = useState(false);
  // Compute multiplier fresh each render (avoid stale closure)
  const currentMultiplierRef = useRef(getStreakMultiplier(state.profile.checkStreak ?? 0));
  currentMultiplierRef.current = getStreakMultiplier(state.profile.checkStreak ?? 0);

  const learnMutation = trpc.chat.learn.useMutation();
  const fetchContentMutation = trpc.chat.fetchStepContent.useMutation();
  const suggestionsMutation = trpc.chat.suggestions.useMutation();

  // ─── XP Award Helper ─────────────────────────────────────────────────────────

  const awardStageXp = useCallback(
    (stageType: string, bonusXp: number = 0) => {
      const mult = currentMultiplierRef.current;
      const baseXp = JOURNEY_STAGE_XP[stageType as keyof typeof JOURNEY_STAGE_XP] ?? 5;
      const total = Math.round((baseXp + bonusXp) * mult);
      setJourneyXp((prev) => prev + total);
      setLastXpGain(total);
      setShowXpPopup(true);
      addXp(total);
      setTimeout(() => setShowXpPopup(false), 1800);
    },
    [addXp]
  );

  // ─── Load Smart Suggestions ─────────────────────────────────────────────────

  useEffect(() => {
    loadSmartSuggestions();
  }, []);

  const loadSmartSuggestions = useCallback(async () => {
    if (state.learnerModel.questionsAsked === 0 && state.profile.interests.length === 0) return;
    setSuggestionsLoading(true);
    try {
      const result = await suggestionsMutation.mutateAsync({
        interests: state.profile.interests,
        pastTopics: state.learnerModel.pastTopics.slice(-10),
        confusionPoints: state.learnerModel.confusionPoints.slice(-5),
        strengthAreas: state.learnerModel.strengthAreas.slice(-5),
        questionsAsked: state.learnerModel.questionsAsked,
      });
      if (result.suggestions.length > 0) {
        setSmartSuggestions(result.suggestions);
        setSuggestionReasons(result.reasons);
      }
    } catch {
      // Fallback to defaults
    } finally {
      setSuggestionsLoading(false);
    }
  }, [state.learnerModel, state.profile.interests]);

  // ─── Auto-ask from Home search bar ──────────────────────────────────────────

  useEffect(() => {
    if (params.q && !hasAutoAsked.current) {
      hasAutoAsked.current = true;
      startJourney(params.q);
    }
  }, [params.q]);

  // ─── Load existing journey ──────────────────────────────────────────────────

  useEffect(() => {
    if (state.activeJourneyId) {
      const j = state.journeys.find((j) => j.id === state.activeJourneyId);
      if (j) {
        setActiveJourney(j);
        setCurrentStageIdx(j.currentStageIndex);
        setShowWelcome(false);
        // Pre-fetch video if current stage is video
        if (j.stages[j.currentStageIndex]?.type === "video") {
          fetchVideoForStage(j.stages[j.currentStageIndex]);
        }
      }
    }
  }, []);

  // ─── Learner Model Snapshot ─────────────────────────────────────────────────

  const getLearnerSnapshot = useCallback(() => {
    const lm = state.learnerModel;
    return {
      preferredPace: lm.preferredPace,
      preferredTone: lm.preferredTone,
      preferredDepth: lm.preferredDepth,
      strengthAreas: lm.strengthAreas.slice(-10),
      confusionPoints: lm.confusionPoints.slice(-10),
      conceptConfidence: lm.conceptConfidence,
      realWorldConnections: lm.realWorldConnections.slice(-5),
      learningStyle: lm.learningStyle,
      explainSimplerCount: lm.explainSimplerCount,
      questionsAsked: lm.questionsAsked,
    };
  }, [state.learnerModel]);

  const getPastConversationSummaries = useCallback(() => {
    return state.journeys
      .slice(0, 5)
      .map((j) => ({
        question: j.question,
        concepts: j.mappedConcepts,
        timestamp: j.createdAt,
      }));
  }, [state.journeys]);

  // ─── Fetch Video for Stage ──────────────────────────────────────────────────

  const fetchVideoForStage = useCallback(async (stage: JourneyStage) => {
    if (!stage.searchQuery) return;
    setVideosLoading(true);
    try {
      const result = await fetchContentMutation.mutateAsync({
        searchQuery: stage.searchQuery,
      });
      setStageVideos(result.items as ContentItemData[]);
    } catch {
      setStageVideos([]);
    } finally {
      setVideosLoading(false);
    }
  }, [fetchContentMutation]);

  // ─── Start a New Journey ────────────────────────────────────────────────────

  const startJourney = useCallback(
    async (question: string) => {
      if (!question.trim() || isLoading) return;

      setShowWelcome(false);
      setInputText("");
      setIsLoading(true);
      setCheckAnswered(false);
      setStageVideos([]);
      // Reset gamification state
      setJourneyXp(0);
      setShowCompletion(false);
      setJourneyCheckCorrect(false);
      setVideoWatched(false);
      setChallengeTimerActive(false);
      setChallengeTimerExpired(false);

      try {
        // Compute adaptive difficulty from learner signals
        const currentDifficulty = computeDifficultyLevel(state.profile, state.learnerModel);

        const result = await learnMutation.mutateAsync({
          question: question.trim(),
          skillLevel: state.profile.skillLevel,
          difficultyLevel: currentDifficulty.level,
          difficultyLabel: currentDifficulty.label,
          learnerModel: getLearnerSnapshot(),
          pastConversations: getPastConversationSummaries(),
        });

        const journey: LearningJourney = {
          id: genId(),
          question: question.trim(),
          stages: result.stages as JourneyStage[],
          mappedConcepts: result.mappedConcepts,
          difficulty: result.difficulty as any,
          difficultyLevel: currentDifficulty.level,
          difficultyLabel: currentDifficulty.label,
          emoji: result.emoji,
          createdAt: new Date().toISOString(),
          currentStageIndex: 0,
          completed: false,
          xpEarned: 0,
          masteryScore: 0,
          perfectJourney: false,
          streakMultiplier: getStreakMultiplier(state.profile.checkStreak ?? 0),
        };

        setActiveJourney(journey);
        setCurrentStageIdx(0);
        dispatch({ type: "SAVE_JOURNEY", payload: journey });
        dispatch({
          type: "UPDATE_LEARNER_MODEL",
          payload: {
            questionsAsked: state.learnerModel.questionsAsked + 1,
            pastTopics: [...state.learnerModel.pastTopics, question.trim().slice(0, 50)],
          },
        });

        // Update concepts
        for (const concept of result.mappedConcepts) {
          dispatch({ type: "ADD_CONCEPT_CONFIDENCE", payload: { concept, confidence: 0.3 } });
        }

        // Award XP for starting a journey (hook stage)
        awardStageXp("hook");
        dispatch({ type: "UPDATE_STREAK" });
      } catch {
        // Fallback
        setShowWelcome(true);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, state.profile.skillLevel, state.learnerModel, dispatch, learnMutation, addXp, getLearnerSnapshot, getPastConversationSummaries]
  );

  // ─── Navigate Stages ────────────────────────────────────────────────────────

  const goToStage = useCallback(
    (idx: number) => {
      if (!activeJourney || idx < 0 || idx >= activeJourney.stages.length) return;
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Award XP for the stage we're advancing FROM (only when moving forward)
      if (idx > currentStageIdx) {
        const prevStage = activeJourney.stages[currentStageIdx];
        // hook is awarded at start, check is awarded on answer, video is awarded on watch
        if (prevStage && prevStage.type !== "hook" && prevStage.type !== "check" && prevStage.type !== "video") {
          awardStageXp(prevStage.type);
        }
      }

      setCurrentStageIdx(idx);
      setCheckAnswered(false);
      setChallengeTimerActive(false);
      setChallengeTimerExpired(false);
      scrollRef.current?.scrollTo({ y: 0, animated: true });

      // Update journey progress
      dispatch({
        type: "UPDATE_JOURNEY",
        payload: {
          id: activeJourney.id,
          updates: {
            currentStageIndex: idx,
          },
        },
      });

      // Pre-fetch video if needed
      const stage = activeJourney.stages[idx];
      if (stage.type === "video") {
        fetchVideoForStage(stage);
      }
      // Start challenge timer for check stages
      if (stage.type === "check") {
        setCheckStartTime(Date.now());
        setChallengeTimerActive(true);
        setChallengeTimerExpired(false);
      }
    },
    [activeJourney, currentStageIdx, dispatch, fetchVideoForStage, awardStageXp, state.profile.checkStreak]
  );

  const goNext = useCallback(() => {
    if (!activeJourney) return;
    const nextIdx = currentStageIdx + 1;
    if (nextIdx < activeJourney.stages.length) {
      goToStage(nextIdx);
    }
    // Journey completion is handled by handleCompleteJourney (via NextStepsCard)
  }, [activeJourney, currentStageIdx, goToStage]);

  const goPrev = useCallback(() => {
    if (currentStageIdx > 0) {
      goToStage(currentStageIdx - 1);
    }
  }, [currentStageIdx, goToStage]);

  // ─── Handle Check Answer ────────────────────────────────────────────────────

  const handleCheckAnswer = useCallback(
    (correct: boolean) => {
      setCheckAnswered(true);
      setChallengeTimerActive(false);
      setJourneyCheckCorrect(correct);

      // Calculate time bonus
      const timeMs = Date.now() - checkStartTime;
      const withinChallenge = timeMs < CHALLENGE_TIMER_SECONDS * 1000 && !challengeTimerExpired;
      const bonusXp = correct && withinChallenge ? CHALLENGE_BONUS_XP : 0;

      // Award check XP
      const checkXp = correct ? JOURNEY_STAGE_XP.check : CHECK_INCORRECT_XP;
      const total = Math.round((checkXp + bonusXp) * currentMultiplierRef.current);
      setJourneyXp((prev) => prev + total);
      setLastXpGain(total);
      setShowXpPopup(true);
      addXp(total);
      setTimeout(() => setShowXpPopup(false), 1800);

      // Update streak
      dispatch({ type: "RECORD_CHECK_RESULT", payload: { correct } });
      dispatch({ type: "RECORD_QUIZ", payload: { correct } });

      // Haptic feedback
      if (Platform.OS !== "web") {
        if (correct) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }

      if (correct && activeJourney) {
        for (const concept of activeJourney.mappedConcepts) {
          dispatch({ type: "ADD_CONCEPT_CONFIDENCE", payload: { concept, confidence: 0.8 } });
        }
      }
    },
    [addXp, dispatch, activeJourney, checkStartTime, challengeTimerExpired]
  );

  // ─── Handle Video Watch ─────────────────────────────────────────────────

  const handleVideoWatch = useCallback(
    (url: string, title: string) => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      openVideoInApp(url, title);
      setVideoWatched(true);
      awardStageXp("video");
      dispatch({ type: "INCREMENT_VIDEOS" });
    },
    [awardStageXp, dispatch]
  );

  // ─── Handle Complete Journey ─────────────────────────────────────────────

  const handleCompleteJourney = useCallback(() => {
    if (!activeJourney) return;
    const mastery = calculateMasteryScore({
      stagesCompleted: activeJourney.stages.length,
      totalStages: activeJourney.stages.length,
      checkCorrect: journeyCheckCorrect,
      videoWatched: videoWatched,
    });
    const isPerfect = journeyCheckCorrect && videoWatched;

    // Award next_steps XP
    awardStageXp("next_steps");

    dispatch({
      type: "COMPLETE_JOURNEY",
      payload: {
        journeyId: activeJourney.id,
        xpEarned: journeyXp,
        masteryScore: mastery,
        perfect: isPerfect,
      },
    });

    // Post-journey adaptive model update:
    // If mastery is high, boost concept confidence further (learner is advancing)
    // If mastery is low, add concepts to confusion points (needs reinforcement)
    if (mastery >= 80) {
      for (const concept of activeJourney.mappedConcepts) {
        dispatch({ type: "ADD_CONCEPT_CONFIDENCE", payload: { concept, confidence: 0.95 } });
      }
      // Promote strengths
      dispatch({
        type: "UPDATE_LEARNER_MODEL",
        payload: {
          strengthAreas: [
            ...new Set([...(state.learnerModel.strengthAreas || []), ...activeJourney.mappedConcepts]),
          ].slice(-20),
        },
      });
    } else if (mastery < 50) {
      // Add to confusion points for gentler treatment next time
      dispatch({
        type: "UPDATE_LEARNER_MODEL",
        payload: {
          confusionPoints: [
            ...new Set([...(state.learnerModel.confusionPoints || []), ...activeJourney.mappedConcepts]),
          ].slice(-10),
        },
      });
    }

    setShowCompletion(true);
  }, [activeJourney, journeyCheckCorrect, videoWatched, journeyXp, awardStageXp, dispatch, state.learnerModel]);

  // ─── Handle Next Steps Selection ────────────────────────────────────────────

  const handleNextStepSelect = useCallback(
    (question: string) => {
      // Complete current journey first, then start new one
      if (activeJourney && !activeJourney.completed) {
        const mastery = calculateMasteryScore({
          stagesCompleted: activeJourney.stages.length,
          totalStages: activeJourney.stages.length,
          checkCorrect: journeyCheckCorrect,
          videoWatched: videoWatched,
        });
        dispatch({
          type: "COMPLETE_JOURNEY",
          payload: {
            journeyId: activeJourney.id,
            xpEarned: journeyXp,
            masteryScore: mastery,
            perfect: journeyCheckCorrect && videoWatched,
          },
        });
      }
      setActiveJourney(null);
      setCurrentStageIdx(0);
      dispatch({ type: "SET_ACTIVE_JOURNEY", payload: null });
      startJourney(question);
    },
    [dispatch, startJourney, activeJourney, journeyCheckCorrect, videoWatched, journeyXp]
  );

  // ─── New Journey ────────────────────────────────────────────────────────────

  const handleNewJourney = useCallback(() => {
    setActiveJourney(null);
    setCurrentStageIdx(0);
    setShowWelcome(true);
    setStageVideos([]);
    setCheckAnswered(false);
    setShowCompletion(false);
    setJourneyXp(0);
    setJourneyCheckCorrect(false);
    setVideoWatched(false);
    setChallengeTimerActive(false);
    setChallengeTimerExpired(false);
    dispatch({ type: "SET_ACTIVE_JOURNEY", payload: null });
    loadSmartSuggestions();
  }, [dispatch, loadSmartSuggestions]);

  // ─── Resume Journey ─────────────────────────────────────────────────────────

  const handleResumeJourney = useCallback(
    (journey: LearningJourney) => {
      setActiveJourney(journey);
      setCurrentStageIdx(journey.currentStageIndex);
      setShowWelcome(false);
      dispatch({ type: "SET_ACTIVE_JOURNEY", payload: journey.id });
      if (journey.stages[journey.currentStageIndex]?.type === "video") {
        fetchVideoForStage(journey.stages[journey.currentStageIndex]);
      }
    },
    [dispatch, fetchVideoForStage]
  );

  // ─── Handle Submit ──────────────────────────────────────────────────────────

  const handleSubmit = useCallback(() => {
    if (!inputText.trim()) return;
    startJourney(inputText);
  }, [inputText, startJourney]);

  // ─── Current Stage ──────────────────────────────────────────────────────────

  const currentStage = activeJourney?.stages[currentStageIdx];
  const isLastStage = activeJourney ? currentStageIdx === activeJourney.stages.length - 1 : false;
  const isCheckStage = currentStage?.type === "check";
  const canAdvance = isCheckStage ? checkAnswered : true;

  // ─── Render Stage ───────────────────────────────────────────────────────────

  const renderStage = () => {
    if (!currentStage) return null;

    switch (currentStage.type) {
      case "hook":
        return <HookCard stage={currentStage} isDark={isDark} />;
      case "foundation":
        return <FoundationCard stage={currentStage} isDark={isDark} />;
      case "explanation":
        return <ExplanationCard stage={currentStage} isDark={isDark} />;
      case "real_world":
        return <RealWorldCard stage={currentStage} isDark={isDark} />;
      case "check":
        return <CheckCard stage={currentStage} isDark={isDark} onAnswer={handleCheckAnswer} />;
      case "video":
        return (
          <VideoCard
            stage={currentStage}
            isDark={isDark}
            videos={stageVideos}
            videosLoading={videosLoading}
            onWatch={handleVideoWatch}
          />
        );
      case "next_steps":
        return <NextStepsCard stage={currentStage} isDark={isDark} onSelect={handleNextStepSelect} onComplete={handleCompleteJourney} />;
      default:
        return <ExplanationCard stage={currentStage} isDark={isDark} />;
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {activeJourney ? activeJourney.emoji + " Learning Journey" : "Learn Anything"}
            </Text>
            {activeJourney ? (
              <Text numberOfLines={1} style={[styles.headerSub, { color: colors.muted }]}>
                {activeJourney.question}
              </Text>
            ) : (
              <Text style={[styles.headerSub, { color: colors.muted }]}>
                {state.learnerModel.questionsAsked > 0
                  ? `${state.learnerModel.questionsAsked} topics explored`
                  : "Ask a question, start a journey"}
              </Text>
            )}
          </View>
          {activeJourney && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {/* XP Badge */}
              <View style={styles.xpHeaderBadge}>
                <Text style={styles.xpHeaderIcon}>{"\u2B50"}</Text>
                <Text style={[styles.xpHeaderText, { color: "#22C55E" }]}>{journeyXp}</Text>
              </View>
              <TouchableOpacity
                onPress={handleNewJourney}
                activeOpacity={0.7}
                style={[styles.newBtn, { backgroundColor: colors.primary + "15" }]}
              >
                <Text style={[styles.newBtnText, { color: colors.primary }]}>New</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* XP Popup */}
        {showXpPopup && <XpPopup amount={lastXpGain} multiplier={currentMultiplierRef.current} />}

        {/* Loading State */}
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <Animated.View entering={FadeIn.duration(300)} style={styles.loadingInner}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingTitle, { color: colors.foreground }]}>
                Building your learning journey...
              </Text>
              <Text style={[styles.loadingDesc, { color: colors.muted }]}>
                Crafting the perfect path from curiosity to understanding
              </Text>
            </Animated.View>
          </View>
        ) : showWelcome ? (
          /* Welcome State */
          <ScrollView style={styles.flex1} contentContainerStyle={styles.welcomeContent} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeIn.duration(400)} style={styles.welcomeInner}>
              <Text style={styles.welcomeEmoji}>{"💡"}</Text>
              <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>
                What do you want to learn?
              </Text>
              <Text style={[styles.welcomeDesc, { color: colors.muted }]}>
                Ask any question and I'll build a guided learning journey — from a curiosity-sparking hook to a deep-dive video.
              </Text>
            </Animated.View>

            <SuggestionChips
              onSelect={startJourney}
              suggestions={smartSuggestions}
              reasons={suggestionReasons}
              loading={suggestionsLoading}
            />
            <RecentJourneys journeys={state.journeys} onSelect={handleResumeJourney} />
          </ScrollView>
        ) : activeJourney && showCompletion ? (
          /* Journey Completion */
          <ScrollView style={styles.flex1} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <JourneyCompleteCard
              journey={activeJourney}
              xpEarned={journeyXp}
              masteryScore={calculateMasteryScore({
                stagesCompleted: activeJourney.stages.length,
                totalStages: activeJourney.stages.length,
                checkCorrect: journeyCheckCorrect,
                videoWatched: videoWatched,
              })}
              isPerfect={journeyCheckCorrect && videoWatched}
              checkStreak={state.profile.checkStreak ?? 0}
              isDark={isDark}
              onNewJourney={handleNewJourney}
            />
          </ScrollView>
        ) : activeJourney ? (
          /* Journey View */
          <View style={styles.flex1}>
            {/* Progress Dots */}
            <ProgressDots
              total={activeJourney.stages.length}
              current={currentStageIdx}
              onDotPress={goToStage}
            />

            {/* Difficulty & Streak */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 4 }}>
              <DifficultyBadge level={activeJourney.difficultyLevel || 1} label={activeJourney.difficultyLabel || "Curious Beginner"} />
              <StreakBadge streak={state.profile.checkStreak ?? 0} multiplier={currentMultiplierRef.current} />
            </View>

            {/* Challenge Timer (on check stages) */}
            {currentStage?.type === "check" && !checkAnswered && (
              <ChallengeTimer
                seconds={CHALLENGE_TIMER_SECONDS}
                onExpire={() => setChallengeTimerExpired(true)}
                active={challengeTimerActive}
              />
            )}

            {/* Stage Content */}
            <ScrollView
              ref={scrollRef}
              style={styles.flex1}
              contentContainerStyle={styles.stageScroll}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View
                key={`stage-${currentStageIdx}`}
                entering={FadeInDown.duration(300)}
              >
                {renderStage()}
              </Animated.View>
            </ScrollView>

            {/* Navigation */}
            {currentStage?.type !== "next_steps" && (
              <View style={[styles.navBar, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
                <TouchableOpacity
                  onPress={goPrev}
                  disabled={currentStageIdx === 0}
                  activeOpacity={0.7}
                  style={[
                    styles.navBtnBack,
                    {
                      backgroundColor: currentStageIdx === 0 ? "transparent" : colors.surface,
                      borderColor: colors.border,
                      opacity: currentStageIdx === 0 ? 0.3 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.navBtnBackText, { color: colors.foreground }]}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={goNext}
                  disabled={!canAdvance}
                  activeOpacity={0.7}
                  style={[
                    styles.navBtnNext,
                    {
                      backgroundColor: canAdvance ? colors.primary : colors.surface,
                      opacity: canAdvance ? 1 : 0.4,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.navBtnNextText,
                      { color: canAdvance ? "#FFFFFF" : colors.muted },
                    ]}
                  >
                    {isCheckStage && !checkAnswered
                      ? "Answer to continue"
                      : isLastStage
                      ? "Complete Journey"
                      : "Continue"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : null}

        {/* Input Bar (only on welcome) */}
        {showWelcome && !isLoading && (
          <View style={[styles.inputBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask anything you want to learn..."
              placeholderTextColor={colors.muted}
              style={[
                styles.input,
                { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border },
              ]}
              multiline
              maxLength={500}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              blurOnSubmit
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!inputText.trim() || isLoading}
              activeOpacity={0.7}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: inputText.trim() && !isLoading ? colors.primary : colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.sendIcon,
                  { color: inputText.trim() && !isLoading ? "#FFFFFF" : colors.muted },
                ]}
              >
                {"↑"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex1: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flex: 1, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  headerSub: { fontSize: 13, marginTop: 2 },
  newBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  newBtnText: { fontSize: 14, fontWeight: "600" },

  // Loading
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  loadingInner: { alignItems: "center", gap: 16 },
  loadingTitle: { fontSize: 18, fontWeight: "600", textAlign: "center" },
  loadingDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },

  // Welcome
  welcomeContent: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20 },
  welcomeInner: { alignItems: "center", marginBottom: 32 },
  welcomeEmoji: { fontSize: 48, marginBottom: 16 },
  welcomeTitle: { fontSize: 24, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  welcomeDesc: { fontSize: 15, textAlign: "center", lineHeight: 22, maxWidth: 320 },

  // Suggestions
  suggestionsWrap: { gap: 8, marginBottom: 24 },
  suggestionsLoading: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12 },
  suggestionsLoadingText: { fontSize: 13 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1 },
  chipText: { fontSize: 14, fontWeight: "500", lineHeight: 20 },
  chipReason: { fontSize: 11, marginTop: 4, lineHeight: 15 },

  // Recent Journeys
  recentWrap: { marginTop: 8 },
  recentTitle: { fontSize: 13, fontWeight: "600", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  recentItem: { paddingVertical: 12, borderBottomWidth: 0.5 },
  recentItemRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  recentEmoji: { fontSize: 24 },
  recentItemContent: { flex: 1 },
  recentQuestion: { fontSize: 15, fontWeight: "600" },
  recentMeta: { fontSize: 12, marginTop: 2 },

  // Progress Dots
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },

  // Stage Cards
  stageScroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 },
  stageCard: {
    borderRadius: 20,
    padding: 24,
  },
  stageEmoji: { fontSize: 36, marginBottom: 12 },
  stageLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  stageTitle: { fontSize: 22, fontWeight: "700", lineHeight: 30, marginBottom: 16 },
  stageContent: { fontSize: 16, lineHeight: 28 },

  // Key Takeaway
  takeawayBox: {
    marginTop: 24,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
  },
  takeawayLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  takeawayText: { fontSize: 15, lineHeight: 24, fontWeight: "500" },

  // Check Options
  checkOption: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  checkOptionText: { fontSize: 15, fontWeight: "500", lineHeight: 24 },
  checkExplanation: {
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
  },
  checkExplanationText: { fontSize: 14, lineHeight: 24 },

  // Video
  videoLoading: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 20 },
  videoLoadingText: { fontSize: 14 },
  videoPreview: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  videoThumbWrap: { position: "relative" },
  videoThumb: { width: "100%", height: 200, borderTopLeftRadius: 13, borderTopRightRadius: 13 },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  playIcon: { color: "#FFFFFF", fontSize: 22, marginLeft: 3 },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  durationText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
  videoMeta: { padding: 16 },
  videoMetaTitle: { fontSize: 16, fontWeight: "600", lineHeight: 24 },
  videoMetaChannel: { fontSize: 13, marginTop: 6 },

  // Next Steps
  nextPath: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  nextPathQuestion: { fontSize: 15, fontWeight: "600", lineHeight: 22 },
  nextPathReason: { fontSize: 13, marginTop: 4, lineHeight: 18 },

  // Navigation Bar
  navBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 0.5,
  },
  navBtnBack: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  navBtnBackText: { fontSize: 15, fontWeight: "600" },
  navBtnNext: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  navBtnNextText: { fontSize: 15, fontWeight: "700" },

  // Input Bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sendIcon: { fontSize: 20, fontWeight: "700" },

  // XP Popup
  xpPopup: {
    position: "absolute",
    top: 80,
    alignSelf: "center",
    zIndex: 100,
    backgroundColor: "rgba(34, 197, 94, 0.18)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  xpPopupText: { fontSize: 16, fontWeight: "800" },

  // Streak Badge
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  streakBadgeIcon: { fontSize: 20 },
  streakBadgeLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  streakBadgeValue: { fontSize: 12, fontWeight: "500" },

  // Challenge Timer
  timerWrap: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  timerBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  timerFill: {
    height: "100%",
    borderRadius: 3,
  },
  timerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timerLabel: { fontSize: 12, fontWeight: "700" },
  timerValue: { fontSize: 12, fontWeight: "600" },

  // Journey Complete Card
  completeCard: {
    borderRadius: 24,
    padding: 28,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  completeHeader: { alignItems: "center", marginBottom: 24 },
  completeEmoji: { fontSize: 56, marginBottom: 12 },
  completeTitle: { fontSize: 24, fontWeight: "800", textAlign: "center" },
  completeQuestion: { fontSize: 14, textAlign: "center", marginTop: 6, lineHeight: 20 },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  statValue: { fontSize: 28, fontWeight: "800" },
  statLabel: { fontSize: 12, fontWeight: "600", marginTop: 4 },

  // Complete Streak
  completeStreak: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  completeStreakIcon: { fontSize: 24 },
  completeStreakText: { fontSize: 13, fontWeight: "600", flex: 1, lineHeight: 18 },

  // Concepts
  completeConcepts: { marginBottom: 20 },
  completeConceptsTitle: { fontSize: 14, fontWeight: "700", marginBottom: 10 },
  conceptTags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  conceptTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  conceptTagText: { fontSize: 13, fontWeight: "600" },

  // Complete Button
  completeBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  completeBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },

  // Complete Journey Button
  completeJourneyBtn: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center" as const,
  },
  completeJourneyBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },

  // XP Header Badge
  xpHeaderBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  xpHeaderText: { fontSize: 13, fontWeight: "700" },
  xpHeaderIcon: { fontSize: 14 },
  // Difficulty Badge
  difficultyBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    alignSelf: "flex-start",
  },
  difficultyBadgeEmoji: { fontSize: 14 },
  difficultyBadgeText: { fontSize: 12, fontWeight: "600" },
  // Completion Difficulty
  completeDifficulty: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
  },
  completeDifficultyEmoji: { fontSize: 24 },
  completeDifficultyLabel: { fontSize: 14, fontWeight: "700" },
  completeDifficultyName: { fontSize: 12, marginTop: 1 },
});
