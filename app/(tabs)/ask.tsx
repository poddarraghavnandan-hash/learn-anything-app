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
  FlatList,
  Modal,
} from "react-native";
import { getResponsiveSpacing, getKeyboardVerticalOffset, getMaxInputHeight, getResponsiveFontSize, isSmallScreen } from "@/lib/responsive";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { FillInTheBlankCard } from "@/components/fill-in-the-blank-card";
import { useLearning } from "@/lib/learning-store";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { trpc } from "@/lib/trpc";
import { openVideoInApp } from "@/lib/video-utils";
import { gaiaVoice } from "@/lib/gaia-voice";
import { gaiaAchievements } from "@/lib/gaia-achievements";
import {
  getResponsiveFontSize,
  getResponsiveSpacing,
  isSmallScreen,
  isMediumScreen,
  isLargeScreen,
  getResponsiveCardHeight,
} from "@/lib/responsive";
import type {
  JourneyStage,
  LearningJourney,
  ContentItemData,
  PriorKnowledgeQuestion,
  PriorKnowledgeResult,
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
const SWIPE_THRESHOLD = 50; // minimum swipe distance in pixels

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
  return (
    <Animated.View
      entering={FadeInUp.duration(400).springify()}
      exiting={FadeOut.delay(1200).duration(300)}
      style={styles.xpPopup}
    >
      <View style={styles.xpPopupInner}>
        <Text style={[styles.xpPopupText, { color: colors.success }]}>
          +{amount} XP{multiplier > 1 ? ` (${multiplier}x)` : ""}
        </Text>
      </View>
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
        <Text style={[styles.streakBadgeValue, { color: badgeColor }]}>{streak} correct · {multiplier}x XP</Text>
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

// ─── Difficulty Badge ─────────────────────────────────────────────────────────

const DIFFICULTY_COLORS: Record<number, string> = {
  1: "#22C55E",
  2: "#0EA5E9",
  3: "#8B5CF6",
  4: "#F59E0B",
  5: "#EF4444",
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

// ─── Card Progress Bar ──────────────────────────────────────────────────────

function CardProgressBar({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  const colors = useColors();
  return (
    <View style={styles.progressBarWrap}>
      <View style={styles.progressBarRow}>
        {Array.from({ length: total }).map((_, i) => {
          const isActive = i === current;
          const isPast = i < current;
          return (
            <View
              key={i}
              style={[
                styles.progressSegment,
                {
                  backgroundColor: isPast
                    ? colors.primary
                    : isActive
                    ? colors.primary + "80"
                    : colors.border + "60",
                  flex: isActive ? 1.5 : 1,
                },
              ]}
            />
          );
        })}
      </View>
      <Text style={[styles.progressLabel, { color: colors.muted }]}>
        {current + 1} of {total}
      </Text>
    </View>
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
      <View style={styles.completeHeader}>
        <Text style={styles.completeEmoji}>{isPerfect ? "🌟" : "🎉"}</Text>
        <Text style={[styles.completeTitle, { color: colors.foreground }]}>
          {isPerfect ? "Perfect Journey!" : "Journey Complete!"}
        </Text>
        <Text style={[styles.completeQuestion, { color: colors.muted }]}>
          {journey.question}
        </Text>
      </View>

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

      {checkStreak >= 3 && (
        <View style={[styles.completeStreak, { backgroundColor: isDark ? "#F59E0B15" : "#FFFBEB" }]}>
          <Text style={styles.completeStreakIcon}>{"⚡"}</Text>
          <Text style={[styles.completeStreakText, { color: "#F59E0B" }]}>
            {checkStreak} correct answers in a row! {getStreakMultiplier(checkStreak)}x XP multiplier active
          </Text>
        </View>
      )}

      <View style={[styles.completeDifficulty, { backgroundColor: isDark ? (DIFFICULTY_COLORS[journey.difficultyLevel] || "#8B5CF6") + "10" : (DIFFICULTY_COLORS[journey.difficultyLevel] || "#8B5CF6") + "08" }]}>
        <Text style={styles.completeDifficultyEmoji}>{DIFFICULTY_LEVELS[(journey.difficultyLevel || 1) - 1]?.emoji || "📚"}</Text>
        <View>
          <Text style={[styles.completeDifficultyLabel, { color: DIFFICULTY_COLORS[journey.difficultyLevel] || "#8B5CF6" }]}>Level {journey.difficultyLevel || 1}</Text>
          <Text style={[styles.completeDifficultyName, { color: colors.muted }]}>{journey.difficultyLabel || "Curious Beginner"}</Text>
        </View>
      </View>

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

// ─── Prior Knowledge Card ────────────────────────────────────────────────────

const ENCOURAGEMENTS = ["Great!", "That helps!", "Perfect!", "Got it!", "Thanks!"];

function PriorKnowledgeCard({
  stage,
  isDark,
  questions,
  warmGreeting,
  onComplete,
  colors,
}: {
  stage: JourneyStage;
  isDark: boolean;
  questions: PriorKnowledgeQuestion[];
  warmGreeting: string;
  onComplete: (answers: number[], overallLevel: "none" | "low" | "medium" | "high") => void;
  colors: any;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showEncouragement, setShowEncouragement] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const isSmall = isSmallScreen();

  const handleAnswer = useCallback((optionIndex: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);

    const encouragement = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
    setShowEncouragement(encouragement);

    setTimeout(() => {
      setShowEncouragement("");
      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1);
        setIsTransitioning(false);
      } else {
        setAllDone(true);
        const levels = newAnswers.map((ai, qi) => {
          const q = questions[qi];
          return q?.knowledgeLevels?.[ai] || "low";
        });
        const levelScores = { none: 0, low: 1, medium: 2, high: 3 };
        const avgScore = levels.reduce((sum, l) => sum + levelScores[l], 0) / levels.length;
        const overallLevel: "none" | "low" | "medium" | "high" =
          avgScore < 0.5 ? "none" : avgScore < 1.5 ? "low" : avgScore < 2.5 ? "medium" : "high";

        setTimeout(() => {
          onComplete(newAnswers, overallLevel);
        }, 1200);
      }
    }, 800);
  }, [currentQ, answers, questions, isTransitioning, onComplete]);

  if (!questions.length) return null;

  const q = questions[currentQ];

  return (
    <View style={[isSmall ? styles.cardBodySmall : styles.cardBody, { backgroundColor: isDark ? "#1a2332" : "#EEF2FF" }]}>
      <View style={{ marginBottom: isSmall ? 12 : 20 }}>
        <Text style={{ fontSize: isSmall ? 28 : 36, marginBottom: isSmall ? 8 : 12 }}>{stage.emoji || "👋"}</Text>
        <Text style={[styles.cardTitle, { color: isDark ? "#E0E7FF" : "#3730A3", fontSize: isSmall ? 18 : 22, marginBottom: isSmall ? 8 : 12 }]}>
          {stage.title || "Before we start..."}
        </Text>
        <Text style={[styles.cardContent, { color: isDark ? "#C7D2FE" : "#4338CA", fontStyle: "italic", fontSize: isSmall ? 13 : 15, lineHeight: isSmall ? 20 : 24 }]}>
          {warmGreeting}
        </Text>
      </View>

      {/* Progress dots */}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: isSmall ? 6 : 8, marginBottom: isSmall ? 12 : 16 }}>
        {questions.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === currentQ ? (isSmall ? 20 : 24) : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i < currentQ
                ? (isDark ? "#818CF8" : "#6366F1")
                : i === currentQ
                  ? (isDark ? "#A5B4FC" : "#818CF8")
                  : (isDark ? "#334155" : "#D1D5DB"),
            }}
          />
        ))}
      </View>

      {!allDone && q && (
        <Animated.View key={`pkq-${currentQ}`} entering={FadeInDown.duration(300)}>
          <View style={{ marginBottom: isSmall ? 8 : 12 }}>
            <Text style={{ fontSize: isSmall ? 18 : 20, marginBottom: isSmall ? 3 : 4 }}>{q.emoji}</Text>
            <Text style={[styles.cardContent, { color: isDark ? "#E2E8F0" : "#1E293B", fontWeight: "600", fontSize: isSmall ? 14 : 16, lineHeight: isSmall ? 20 : 24 }]}>
              {q.question}
            </Text>
          </View>

          <View style={{ gap: isSmall ? 8 : 10 }}>
            {q.options.map((option, oi) => (
              <TouchableOpacity
                key={oi}
                onPress={() => handleAnswer(oi)}
                disabled={isTransitioning}
                style={{
                  backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                  borderRadius: 12,
                  padding: isSmall ? 10 : 14,
                  borderWidth: 1.5,
                  borderColor: isDark ? "#475569" : "#C7D2FE",
                  opacity: isTransitioning ? 0.5 : 1,
                }}
              >
                <Text style={{ color: isDark ? "#E2E8F0" : "#1E293B", fontSize: isSmall ? 13 : 15, lineHeight: isSmall ? 18 : 22 }}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {showEncouragement !== "" && (
            <Animated.View entering={FadeIn.duration(200)} style={{ alignItems: "center", marginTop: isSmall ? 12 : 16 }}>
              <Text style={{ fontSize: isSmall ? 16 : 18, fontWeight: "700", color: isDark ? "#818CF8" : "#6366F1" }}>
                {showEncouragement}
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      )}

      {allDone && (
        <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: "center", paddingVertical: isSmall ? 16 : 24 }}>
          {/* Personalized Result Message */}
          <View style={{ marginBottom: isSmall ? 12 : 20, alignItems: "center" }}>
            <Text style={{ fontSize: isSmall ? 32 : 40, marginBottom: isSmall ? 8 : 12 }}>
              {answers.length === 0 ? "👋" : answers.some((a) => a >= 2) ? "🌟" : "💡"}
            </Text>
            <Text style={{ fontSize: isSmall ? 16 : 18, fontWeight: "700", color: isDark ? "#E0E7FF" : "#3730A3", marginBottom: isSmall ? 6 : 8, textAlign: "center" }}>
              {answers.length === 0
                ? "Let's get started!"
                : answers.some((a) => a >= 2)
                  ? "You've got a solid foundation!"
                  : "Great — let's build your knowledge!"}
            </Text>
            <Text style={{ fontSize: isSmall ? 12 : 14, color: isDark ? "#C7D2FE" : "#4338CA", marginBottom: isSmall ? 12 : 16, textAlign: "center", lineHeight: isSmall ? 18 : 20 }}>
              {answers.length === 0
                ? "We'll start from the beginning to build a strong foundation."
                : answers.some((a) => a >= 2)
                  ? "We'll skip the basics and focus on deeper concepts to challenge you."
                  : "We'll start with fundamentals and gradually build up your expertise."}
            </Text>
          </View>

          <ActivityIndicator size="small" color={isDark ? "#818CF8" : "#6366F1"} style={{ marginBottom: isSmall ? 8 : 12 }} />
          <Text style={{ fontSize: isSmall ? 12 : 14, fontWeight: "600", color: isDark ? "#94A3B8" : "#64748B" }}>
            Tailoring your journey...
          </Text>
        </Animated.View>
      )}

      {!allDone && (
        <TouchableOpacity
          onPress={() => {
            const defaultAnswers = questions.map(() => 1);
            onComplete(defaultAnswers, "low");
          }}
          style={{ alignItems: "center", marginTop: isSmall ? 12 : 20, paddingVertical: isSmall ? 6 : 8 }}
        >
          <Text style={{ fontSize: isSmall ? 11 : 13, color: isDark ? "#64748B" : "#94A3B8" }}>
            Skip — I'm ready to learn
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Card Content Renderers ──────────────────────────────────────────────────

function InfoCardContent({ stage, isDark }: { stage: JourneyStage; isDark: boolean }) {
  const colors = useColors();
  const stageType = stage.type as string;
  const accent = isDark
    ? (STAGE_ACCENTS_DARK[stageType] || STAGE_ACCENTS_DARK.explanation)
    : (STAGE_ACCENTS[stageType] || STAGE_ACCENTS.explanation);

  return (
    <LinearGradient colors={[isDark ? "#0F1419" : "#FFFFFF", accent.bg + "30"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.cardBody, { borderColor: accent.bg + "50", borderWidth: 1 }]}>
      <Text style={{ fontSize: 36, marginBottom: 12 }}>{stage.emoji}</Text>
      <Text style={[styles.cardLabel, { color: accent.text }]}>{accent.label}</Text>
      <Text style={[styles.cardTitle, { color: isDark ? colors.foreground : "#1A1A2E" }]}>{stage.title}</Text>
      <RichText text={stage.content} style={[styles.cardContent, { color: isDark ? colors.foreground + "DD" : "#374151" }]} />
      {stage.keyTakeaway ? (
        <View style={[styles.takeawayBox, { backgroundColor: isDark ? accent.text + "20" : "#FFFFFF60", borderColor: isDark ? accent.text + "40" : accent.text + "30" }]}>
          <Text style={[styles.takeawayLabel, { color: accent.text }]}>
            {stageType === "real_world" ? "Real-World Example" : stageType === "foundation" ? "Key Concept" : "Key Takeaway"}
          </Text>
          <Text style={[styles.takeawayText, { color: isDark ? colors.foreground : "#374151" }]}>{stage.keyTakeaway}</Text>
        </View>
      ) : null}
    </LinearGradient>
  );
}

function CheckCardContent({
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
    <LinearGradient colors={[isDark ? "#0F1419" : "#FFFFFF", accent.bg + "30"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.cardBody, { borderColor: accent.bg + "50", borderWidth: 1 }]}>
      <Text style={{ fontSize: 36, marginBottom: 12 }}>{stage.emoji}</Text>
      <Text style={[styles.cardLabel, { color: accent.text }]}>{accent.label}</Text>
      <Text style={[styles.cardTitle, { color: isDark ? colors.foreground : "#1A1A2E" }]}>{stage.question || stage.title}</Text>
      {stage.content ? (
        <RichText text={stage.content} style={[styles.cardContent, { color: isDark ? colors.foreground + "DD" : "#374151", marginBottom: 20 }]} />
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
        <Animated.View entering={FadeIn.duration(250)} style={[styles.checkExplanation, { backgroundColor: isDark ? colors.surface : "#FFFFFF80", maxHeight: 200 }]}>
          <ScrollView scrollEnabled={true} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
            <Text style={[styles.checkExplanationText, { color: isDark ? colors.foreground + "DD" : "#374151" }]}>
              {stage.explanation}
            </Text>
          </ScrollView>
        </Animated.View>
      ) : null}

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
    </LinearGradient>
  );
}

function VideoCardContent({
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

  const { data: proxyData, isLoading: proxyLoading } = trpc.video.getRawStreamUrl.useQuery(
    { youtubeUrl: video?.url || "" },
    { enabled: !!video?.url }
  );

  const player = useVideoPlayer(proxyData?.streamUrl || null, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <LinearGradient colors={[isDark ? "#0F1419" : "#FFFFFF", accent.bg + "30"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.cardBody, { borderColor: accent.bg + "50", borderWidth: 1 }]}>
      <Text style={{ fontSize: 36, marginBottom: 12 }}>{stage.emoji}</Text>
      <Text style={[styles.cardLabel, { color: accent.text }]}>{accent.label}</Text>
      <Text style={[styles.cardTitle, { color: isDark ? colors.foreground : "#1A1A2E" }]}>{stage.title}</Text>
      {stage.videoContext ? (
        <RichText text={stage.videoContext} style={[styles.cardContent, { color: isDark ? colors.foreground + "DD" : "#374151", marginBottom: 20 }]} />
      ) : null}

      {videosLoading ? (
        <View style={styles.videoLoading}>
          <ActivityIndicator size="small" color={accent.text} />
          <Text style={[styles.videoLoadingText, { color: isDark ? colors.muted : "#6B7280" }]}>Finding the best video...</Text>
        </View>
      ) : proxyLoading ? (
        <View style={styles.videoLoading}>
          <ActivityIndicator size="small" color={accent.text} />
          <Text style={[styles.videoLoadingText, { color: isDark ? colors.muted : "#6B7280" }]}>Optimizing stream for native playback...</Text>
        </View>
      ) : video ? (
        <View style={{ marginTop: 10 }}>
          {proxyData?.streamUrl ? (
            <View style={[styles.videoPreview, { borderColor: isDark ? colors.border : "#E5E7EB", overflow: "hidden", height: 220, position: "relative" }]}>
              <VideoView 
                player={player}
                style={{ width: "100%", height: "100%" }}
                allowsFullscreen={true}
                allowsPictureInPicture={true}
                nativeControls={true}
              />
              {duration ? (
                <View style={[styles.durationBadge, { zIndex: 10 }]}>
                  <Text style={styles.durationText}>{duration}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => onWatch(video.url, video.title)}
              activeOpacity={0.8}
              style={[styles.videoPreview, { borderColor: isDark ? colors.border : "#E5E7EB", overflow: "hidden" }]}
            >
              {video.thumbnailUrl ? (
                <View style={styles.videoThumbWrap}>
                  <Image source={{ uri: video.thumbnailUrl }} style={styles.videoThumb} contentFit="cover" />
                  <View style={styles.playOverlay}>
                    <View style={styles.playButton}>
                      <Text style={styles.playIcon}>{"▶"}</Text>
                    </View>
                  </View>
                </View>
              ) : null}
            </TouchableOpacity>
          )}

          <View style={[styles.videoMeta, { marginTop: 8 }]}>
            <Text numberOfLines={2} style={[styles.videoMetaTitle, { color: isDark ? colors.foreground : "#1A1A2E" }]}>
              {proxyData?.title || video.title}
            </Text>
            <Text numberOfLines={1} style={[styles.videoMetaChannel, { color: isDark ? colors.muted : "#6B7280" }]}>
              {video.channelOrAuthor || video.source}
            </Text>
          </View>
        </View>
      ) : (
        <Text style={[styles.cardContent, { color: isDark ? colors.muted : "#6B7280" }]}>
          No video found for this topic. Tap Continue to keep going!
        </Text>
      )}
    </LinearGradient>
  );
}

function NextStepsCardContent({
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
    <LinearGradient colors={[isDark ? "#0F1419" : "#FFFFFF", accent.bg + "30"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.cardBody, { borderColor: accent.bg + "50", borderWidth: 1 }]}>
      <Text style={{ fontSize: 36, marginBottom: 12 }}>{stage.emoji}</Text>
      <Text style={[styles.cardLabel, { color: accent.text }]}>{accent.label}</Text>
      <Text style={[styles.cardTitle, { color: isDark ? colors.foreground : "#1A1A2E" }]}>{stage.title}</Text>

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

      <Animated.View entering={FadeInUp.delay(paths.length * 100 + 100).duration(300)}>
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onComplete();
          }}
          activeOpacity={0.7}
          style={[styles.completeJourneyBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.completeJourneyBtnText}>{"✨"} Complete Journey</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

// ─── Stage Actions (Explain Simpler / Tell Me More) ─────────────────────────

const REGEN_STAGES = new Set(["foundation", "explanation", "real_world", "hook"]);
const MAX_DEPTH = 3;
const PAUSE_HINT_DELAY = 15000;

function StageActions({
  stageType,
  isRegenerating,
  regenDirection,
  onSimpler,
  onDeeper,
  isDark,
  showPulseHint,
  depthLevel,
  maxDepthReached,
}: {
  stageType: string;
  isRegenerating: boolean;
  regenDirection: "simpler" | "deeper" | null;
  onSimpler: () => void;
  onDeeper: () => void;
  isDark: boolean;
  showPulseHint: boolean;
  depthLevel: number;
  maxDepthReached: boolean;
}) {
  const colors = useColors();
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    if (showPulseHint) {
      const pulse = () => {
        pulseAnim.value = withTiming(1.04, { duration: 750, easing: Easing.inOut(Easing.ease) }, () => {
          pulseAnim.value = withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) });
        });
      };
      pulse();
      const interval = setInterval(pulse, 1600);
      return () => clearInterval(interval);
    } else {
      pulseAnim.value = withTiming(1, { duration: 200 });
    }
  }, [showPulseHint]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  if (!REGEN_STAGES.has(stageType)) return null;

  return (
    <Animated.View entering={FadeIn.delay(400).duration(300)} style={styles.stageActionsRow}>
      <Animated.View style={[{ flex: 1 }, showPulseHint ? pulseStyle : {}]}>
        <TouchableOpacity
          onPress={onSimpler}
          disabled={isRegenerating}
          activeOpacity={0.7}
          style={[
            styles.stageActionBtn,
            {
              backgroundColor: isDark ? "#3B82F620" : "#EFF6FF",
              borderColor: showPulseHint ? "#3B82F6" : isDark ? "#3B82F640" : "#BFDBFE",
              borderWidth: showPulseHint ? 1.5 : 1,
              opacity: isRegenerating && regenDirection !== "simpler" ? 0.4 : 1,
            },
          ]}
        >
          {isRegenerating && regenDirection === "simpler" ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <>
              <Text style={styles.stageActionIcon}>{"✨"}</Text>
              <Text style={[styles.stageActionText, { color: "#3B82F6" }]}>Explain Simpler</Text>
            </>
          )}
        </TouchableOpacity>
        {showPulseHint && (
          <Animated.Text
            entering={FadeIn.duration(400)}
            style={[styles.pulseHintText, { color: "#3B82F6" }]}
          >
            Need a simpler take?
          </Animated.Text>
        )}
      </Animated.View>

      <TouchableOpacity
        onPress={onDeeper}
        disabled={isRegenerating || maxDepthReached}
        activeOpacity={0.7}
        style={[
          styles.stageActionBtn,
          {
            backgroundColor: isDark ? "#8B5CF620" : "#F5F3FF",
            borderColor: isDark ? "#8B5CF640" : "#C4B5FD",
            opacity: maxDepthReached ? 0.4 : isRegenerating && regenDirection !== "deeper" ? 0.4 : 1,
          },
        ]}
      >
        {isRegenerating && regenDirection === "deeper" ? (
          <ActivityIndicator size="small" color="#8B5CF6" />
        ) : (
          <>
            <Text style={styles.stageActionIcon}>{"🔭"}</Text>
            <View style={{ flexDirection: "column", alignItems: "flex-start" }}>
              <Text style={[styles.stageActionText, { color: "#8B5CF6" }]}>
                {maxDepthReached ? "Max Depth" : "Tell Me More"}
              </Text>
              {depthLevel > 0 && (
                <View style={styles.depthDotsRow}>
                  {Array.from({ length: MAX_DEPTH }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.depthDot,
                        {
                          backgroundColor: i < depthLevel ? "#8B5CF6" : isDark ? "#8B5CF630" : "#C4B5FD50",
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Chat Sidebar (Bottom Sheet) ─────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  emoji?: string;
}

function ChatSidebar({
  visible,
  onClose,
  journeyQuestion,
  currentStage,
  isDark,
  skillLevel,
  learnerModel,
}: {
  visible: boolean;
  onClose: () => void;
  journeyQuestion: string;
  currentStage: JourneyStage | null;
  isDark: boolean;
  skillLevel: string;
  learnerModel: { preferredDepth?: string; confusionPoints?: string[]; strengthAreas?: string[] };
}) {
  const colors = useColors();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const journeyChatMutation = trpc.chat.journeyChat.useMutation();

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: ChatMessage = { id: genId(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsSending(true);

    try {
      const result = await journeyChatMutation.mutateAsync({
        question: text,
        journeyQuestion,
        currentStageType: currentStage?.type || "explanation",
        currentStageContent: currentStage?.content || "",
        currentStageTitle: currentStage?.title || "",
        chatHistory: messages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
        skillLevel: skillLevel as "beginner" | "intermediate" | "advanced",
        learnerModel: {
          preferredDepth: learnerModel.preferredDepth as "overview" | "detailed" | "expert" | undefined,
          confusionPoints: learnerModel.confusionPoints,
          strengthAreas: learnerModel.strengthAreas,
        },
      });

      const assistantMsg: ChatMessage = {
        id: genId(),
        role: "assistant",
        text: result.response,
        emoji: result.emoji,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: genId(), role: "assistant", text: "Sorry, I couldn't process that. Try again!", emoji: "🤔" },
      ]);
    } finally {
      setIsSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [inputText, isSending, messages, journeyQuestion, currentStage, skillLevel, learnerModel]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.chatOverlay]}>
        <Animated.View
          entering={SlideInDown.duration(300)}
          style={[styles.chatSheet, { backgroundColor: isDark ? "#1A1A2E" : "#FFFFFF" }]}
        >
          {/* Chat Header */}
          <View style={[styles.chatHeader, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.chatHeaderTitle, { color: colors.foreground }]}>Ask a Question</Text>
              <Text numberOfLines={1} style={[styles.chatHeaderSub, { color: colors.muted }]}>
                About: {currentStage?.title || journeyQuestion}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.chatCloseBtn}>
              <Text style={[styles.chatCloseBtnText, { color: colors.muted }]}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Chat Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.chatMessages}
            contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 && (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Text style={{ fontSize: 32, marginBottom: 12 }}>💬</Text>
                <Text style={[{ fontSize: 16, fontWeight: "600", textAlign: "center", color: colors.foreground }]}>
                  Have a question?
                </Text>
                <Text style={[{ fontSize: 14, textAlign: "center", color: colors.muted, marginTop: 4, maxWidth: 260 }]}>
                  Ask anything about what you're learning. I'll answer in context of this card.
                </Text>
              </View>
            )}
            {messages.map((msg) => (
              <Animated.View
                key={msg.id}
                entering={FadeInUp.duration(200)}
                style={[
                  styles.chatBubble,
                  msg.role === "user"
                    ? [styles.chatBubbleUser, { backgroundColor: colors.primary }]
                    : [styles.chatBubbleAssistant, { backgroundColor: isDark ? colors.surface : "#F3F4F6" }],
                ]}
              >
                {msg.role === "assistant" && msg.emoji ? (
                  <Text style={{ fontSize: 16, marginBottom: 4 }}>{msg.emoji}</Text>
                ) : null}
                <RichText
                  text={msg.text}
                  style={[
                    styles.chatBubbleText,
                    { color: msg.role === "user" ? "#FFFFFF" : colors.foreground },
                  ]}
                />
              </Animated.View>
            ))}
            {isSending && (
              <View style={[styles.chatBubble, styles.chatBubbleAssistant, { backgroundColor: isDark ? colors.surface : "#F3F4F6" }]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
          </ScrollView>

          {/* Chat I          {/* Chat Input */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={getKeyboardVerticalOffset()}
            style={{ flex: 0 }}
          >
            <View style={[styles.chatInputBar, { borderTopColor: colors.border, backgroundColor: isDark ? "#1A1A2E" : "#FFFFFF", paddingBottom: isSmallScreen() ? 8 : 12, paddingHorizontal: getResponsiveSpacing(8) }]}>
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about this card..."
                placeholderTextColor={colors.muted}
                style={[styles.chatInput, { backgroundColor: isDark ? colors.surface : "#F3F4F6", color: colors.foreground, maxHeight: getMaxInputHeight(), fontSize: getResponsiveFontSize(14) }]}
                multiline
                maxLength={500}
                returnKeyType="done"
                onSubmitEditing={handleSend}
                blurOnSubmit
                scrollEnabled
              />
              <TouchableOpacity
                onPress={handleSend}
                disabled={!inputText.trim() || isSending}
                activeOpacity={0.7}
                style={[styles.chatSendBtn, { backgroundColor: inputText.trim() && !isSending ? colors.primary : colors.surface }]}
              >
                <Text style={[styles.chatSendIcon, { color: inputText.trim() && !isSending ? "#FFFFFF" : colors.muted }]}>
                  {"↑"}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
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
                {" · "}
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
  const [totalXpGained, setTotalXpGained] = useState(0); // Track total XP for journey end summary
  const [challengeTimerActive, setChallengeTimerActive] = useState(false);
  const [challengeTimerExpired, setChallengeTimerExpired] = useState(false);
  const [checkStartTime, setCheckStartTime] = useState(0);
  const [journeyCheckCorrect, setJourneyCheckCorrect] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [videoWatched, setVideoWatched] = useState(false);
  const currentMultiplierRef = useRef(getStreakMultiplier(state.profile.checkStreak ?? 0));
  currentMultiplierRef.current = getStreakMultiplier(state.profile.checkStreak ?? 0);

  // Chat sidebar state
  const [chatVisible, setChatVisible] = useState(false);
  const journeyMutation = trpc.chat.journeyChat.useMutation();

  const learnMutation = trpc.chat.learn.useMutation();
  const fetchContentMutation = trpc.chat.fetchStepContent.useMutation();
  const suggestionsMutation = trpc.chat.suggestions.useMutation();
  const regenStageMutation = trpc.chat.regenStage.useMutation();
  const priorKnowledgeMutation = trpc.chat.priorKnowledge.useMutation();
  const seedConceptsMutation = trpc.spacedRepetition.seedFromJourney.useMutation();

  // Prior knowledge check state
  const [priorKnowledgeQuestions, setPriorKnowledgeQuestions] = useState<PriorKnowledgeQuestion[]>([]);
  const [priorKnowledgeGreeting, setPriorKnowledgeGreeting] = useState("");
  const [priorKnowledgeResult, setPriorKnowledgeResult] = useState<PriorKnowledgeResult | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState("");

  // Stage regeneration state
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenDirection, setRegenDirection] = useState<"simpler" | "deeper" | null>(null);

  // Pause hint state
  const [showPulseHint, setShowPulseHint] = useState(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Depth chain state
  const [depthMap, setDepthMap] = useState<Record<number, number>>({});
  const currentDepth = depthMap[currentStageIdx] ?? 0;
  const maxDepthReached = currentDepth >= MAX_DEPTH;

  // Swipe gesture state
  const swipeTranslateX = useSharedValue(0);
  const swipeOpacity = useSharedValue(1);
  const [showSwipeHint, setShowSwipeHint] = useState(true);

  // ─── Computed: visible stages (skip prior_knowledge for card queue) ────────

  const visibleStages = useMemo(() => {
    if (!activeJourney) return [];
    return activeJourney.stages.filter((s) => s.type !== "prior_knowledge");
  }, [activeJourney]);

  const visibleStageIdx = useMemo(() => {
    if (!activeJourney) return 0;
    const hasPK = activeJourney.stages[0]?.type === "prior_knowledge";
    return hasPK ? currentStageIdx - 1 : currentStageIdx;
  }, [activeJourney, currentStageIdx]);

  // ─── XP Award Helper ─────────────────────────────────────────────────────────

  const awardStageXp = useCallback(
    (stageType: string, bonusXp: number = 0) => {
      const mult = currentMultiplierRef.current;
      const baseXp = JOURNEY_STAGE_XP[stageType as keyof typeof JOURNEY_STAGE_XP] ?? 5;
      const total = Math.round((baseXp + bonusXp) * mult);
      setJourneyXp((prev) => prev + total);

      setTotalXpGained(prev => prev + total);
      addXp(total);
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

  const shouldSkipPriorKnowledge = useCallback(() => {
    const confidences = Object.values(state.learnerModel.conceptConfidence);
    if (confidences.length === 0) return false;
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    return avgConfidence > 0.7 && (state.profile.totalJourneysCompleted ?? 0) >= 3;
  }, [state.learnerModel.conceptConfidence, state.profile.totalJourneysCompleted]);

  const startJourney = useCallback(
    async (question: string) => {
      if (!question.trim() || isLoading) return;

      setShowWelcome(false);
      setInputText("");
      setIsLoading(true);
      setCheckAnswered(false);
      setStageVideos([]);
      setJourneyXp(0);
      setShowCompletion(false);
      setJourneyCheckCorrect(false);
      setVideoWatched(false);
      setChallengeTimerActive(false);
      setDepthMap({});
      setShowPulseHint(false);
      setChallengeTimerExpired(false);
      setPriorKnowledgeResult(null);
      setPriorKnowledgeQuestions([]);
      setPriorKnowledgeGreeting("");
      setChatVisible(false);

      const trimmedQ = question.trim();
      setPendingQuestion(trimmedQ);

      if (shouldSkipPriorKnowledge()) {
        await generateJourney(trimmedQ, "");
        return;
      }

      try {
        const pkResult = await priorKnowledgeMutation.mutateAsync({
          question: trimmedQ,
          difficultyLevel: computeDifficultyLevel(state.profile, state.learnerModel).level,
          ageGroup: "unknown",
          existingConfidence: state.learnerModel.conceptConfidence,
          pastTopics: state.learnerModel.pastTopics,
        });

        setPriorKnowledgeQuestions(pkResult.questions);
        setPriorKnowledgeGreeting(pkResult.warmGreeting);

        const pkStage: JourneyStage = {
          type: "prior_knowledge",
          emoji: "👋",
          title: "Before we start...",
          content: pkResult.warmGreeting,
          priorKnowledgeQuestions: pkResult.questions,
        };

        const tempJourney: LearningJourney = {
          id: genId(),
          question: trimmedQ,
          stages: [pkStage],
          mappedConcepts: [],
          difficulty: state.profile.skillLevel as any,
          difficultyLevel: computeDifficultyLevel(state.profile, state.learnerModel).level,
          difficultyLabel: computeDifficultyLevel(state.profile, state.learnerModel).label,
          emoji: "🧠",
          createdAt: new Date().toISOString(),
          currentStageIndex: 0,
          completed: false,
          xpEarned: 0,
          masteryScore: 0,
          perfectJourney: false,
          streakMultiplier: getStreakMultiplier(state.profile.checkStreak ?? 0),
        };

        setActiveJourney(tempJourney);
        setCurrentStageIdx(0);
        setIsLoading(false);
      } catch {
        await generateJourney(trimmedQ, "");
      }
    },
    [isLoading, state.profile, state.learnerModel, dispatch, priorKnowledgeMutation, shouldSkipPriorKnowledge]
  );

  const generateJourney = useCallback(
    async (question: string, priorKnowledgeContext: string) => {
      setIsLoading(true);

      try {
        const currentDifficulty = computeDifficultyLevel(state.profile, state.learnerModel);

        const result = await learnMutation.mutateAsync({
          question,
          skillLevel: state.profile.skillLevel,
          difficultyLevel: currentDifficulty.level,
          difficultyLabel: currentDifficulty.label,
          learnerModel: getLearnerSnapshot(),
          pastConversations: getPastConversationSummaries(),
          priorKnowledgeContext,
        });

        const journey: LearningJourney = {
          id: genId(),
          question,
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
          priorKnowledgeResult: priorKnowledgeResult ?? undefined,
        };

        setActiveJourney(journey);
        setCurrentStageIdx(0);
        dispatch({ type: "SAVE_JOURNEY", payload: journey });
        dispatch({
          type: "UPDATE_LEARNER_MODEL",
          payload: {
            questionsAsked: state.learnerModel.questionsAsked + 1,
            pastTopics: [...state.learnerModel.pastTopics, question.slice(0, 50)],
          },
        });

        for (const concept of result.mappedConcepts) {
          dispatch({ type: "ADD_CONCEPT_CONFIDENCE", payload: { concept, confidence: 0.3 } });
        }

        awardStageXp("hook");
        dispatch({ type: "UPDATE_STREAK" });
      } catch {
        setShowWelcome(true);
      } finally {
        setIsLoading(false);
      }
    },
    [state.profile, state.learnerModel, dispatch, learnMutation, getLearnerSnapshot, getPastConversationSummaries, priorKnowledgeResult, awardStageXp]
  );

  const handlePriorKnowledgeComplete = useCallback(
    async (answers: number[], overallLevel: "none" | "low" | "medium" | "high") => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const pkContext = priorKnowledgeQuestions.map((q, i) => {
        const answer = answers[i];
        const level = q.knowledgeLevels[answer] || "low";
        return `Q: ${q.question} → A: "${q.options[answer]}" (knowledge level: ${level})`;
      }).join("\n");
      const contextStr = `Overall prior knowledge: ${overallLevel}\n${pkContext}`;

      const result: PriorKnowledgeResult = {
        questions: priorKnowledgeQuestions,
        answers,
        overallLevel,
        topicCategory: "general",
      };
      setPriorKnowledgeResult(result);

      awardStageXp("prior_knowledge");

      const levelScores = { none: 0, low: 0.2, medium: 0.5, high: 0.8 };
      dispatch({
        type: "UPDATE_LEARNER_MODEL",
        payload: {
          preferredDepth: overallLevel === "high" ? "expert" : overallLevel === "medium" ? "detailed" : "overview",
        },
      });

      await generateJourney(pendingQuestion, contextStr);
    },
    [priorKnowledgeQuestions, pendingQuestion, generateJourney, awardStageXp, dispatch]
  );

  // ─── Navigate Cards ────────────────────────────────────────────────────────

  const goToStage = useCallback(
    (idx: number) => {
      if (!activeJourney || idx < 0 || idx >= activeJourney.stages.length) return;
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Award XP for the stage we're advancing FROM (only when moving forward)
      if (idx > currentStageIdx) {
        const prevStage = activeJourney.stages[currentStageIdx];
        if (prevStage && prevStage.type !== "prior_knowledge" && prevStage.type !== "check" && prevStage.type !== "video") {
          awardStageXp(prevStage.type);
        }
      }

      setCurrentStageIdx(idx);
      setCheckAnswered(false);
      setChallengeTimerActive(false);
      setChallengeTimerExpired(false);
      scrollRef.current?.scrollTo({ y: 0, animated: true });

      dispatch({
        type: "UPDATE_JOURNEY",
        payload: {
          id: activeJourney.id,
          updates: { currentStageIndex: idx },
        },
      });

      const stage = activeJourney.stages[idx];
      if (stage.type === "video") {
        fetchVideoForStage(stage);
      }
      if (stage.type === "check") {
        setCheckStartTime(Date.now());
        setChallengeTimerActive(true);
        setChallengeTimerExpired(false);
      }
    },
    [activeJourney, currentStageIdx, dispatch, fetchVideoForStage, awardStageXp]
  );

  const goNext = useCallback(() => {
    if (!activeJourney) return;
    const nextIdx = currentStageIdx + 1;
    if (nextIdx < activeJourney.stages.length) {
      goToStage(nextIdx);
    }
  }, [activeJourney, currentStageIdx, goToStage]);

  const goPrev = useCallback(() => {
    if (currentStageIdx <= 0) return;
    const prevIdx = currentStageIdx - 1;
    const prevStage = activeJourney?.stages[prevIdx];
    if (prevStage?.type === "prior_knowledge") return;
    goToStage(prevIdx);
  }, [currentStageIdx, goToStage, activeJourney]);

  // ─── Swipe Gesture Handler ────────────────────────────────────────────────────

  useEffect(() => {
    if (currentStageIdx > 0 && showSwipeHint) {
      setShowSwipeHint(false);
    }
  }, [currentStageIdx, showSwipeHint]);

  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      swipeTranslateX.value = event.translationX;
    })
    .onEnd((event) => {
      const shouldSwipe = Math.abs(event.velocityX) > 500 || Math.abs(event.translationX) > SWIPE_THRESHOLD;
      if (shouldSwipe) {
        if (event.translationX > 0) {
          runOnJS(goPrev)();
        } else {
          runOnJS(goNext)();
        }
      }
      swipeTranslateX.value = withTiming(0, { duration: 200 });
    });

  const swipeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: swipeTranslateX.value }],
  }));

  // ─── Handle Check Answer ────────────────────────────────────────────────────

  const handleCheckAnswer = useCallback(
    (correct: boolean) => {
      setCheckAnswered(true);
      setChallengeTimerActive(false);
      setJourneyCheckCorrect(correct);

      const timeMs = Date.now() - checkStartTime;
      const withinChallenge = timeMs < CHALLENGE_TIMER_SECONDS * 1000 && !challengeTimerExpired;
      const bonusXp = correct && withinChallenge ? CHALLENGE_BONUS_XP : 0;

      const checkXp = correct ? JOURNEY_STAGE_XP.check : CHECK_INCORRECT_XP;
      const total = Math.round((checkXp + bonusXp) * currentMultiplierRef.current);
      setJourneyXp((prev) => prev + total);

      setTotalXpGained(prev => prev + total);
      addXp(total);

      dispatch({ type: "RECORD_CHECK_RESULT", payload: { correct } });
      dispatch({ type: "RECORD_QUIZ", payload: { correct } });

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
        // Celebrate correct answer with Gaia voice
        const message = gaiaVoice.generateCelebrationMessage("answer");
        gaiaVoice.speak(message, "celebration");
      } else if (!correct) {
        // Encourage on wrong answer
        const message = gaiaVoice.generateEncouragementMessage("answer");
        gaiaVoice.speak(message, "encouragement");
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

    if (mastery >= 80) {
      for (const concept of activeJourney.mappedConcepts) {
        dispatch({ type: "ADD_CONCEPT_CONFIDENCE", payload: { concept, confidence: 0.95 } });
      }
      dispatch({
        type: "UPDATE_LEARNER_MODEL",
        payload: {
          strengthAreas: [
            ...new Set([...(state.learnerModel.strengthAreas || []), ...activeJourney.mappedConcepts]),
          ].slice(-20),
        },
      });
    } else if (mastery < 50) {
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

    // Fire-and-forget: seed concepts into spaced repetition for future review
    if (activeJourney.mappedConcepts.length > 0) {
      seedConceptsMutation.mutate({
        userId: 0, // Anonymous seeding — will be linked when user authenticates
        concepts: activeJourney.mappedConcepts.map((name: string) => ({
          name,
          checkCorrect: journeyCheckCorrect,
        })),
      });
    }
  }, [activeJourney, journeyCheckCorrect, videoWatched, journeyXp, awardStageXp, dispatch, state.learnerModel]);

  // ─── Handle Next Steps Selection ────────────────────────────────────────────

  const handleNextStepSelect = useCallback(
    (question: string) => {
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
    setDepthMap({});
    setShowPulseHint(false);
    setChallengeTimerExpired(false);
    setChatVisible(false);
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
  const isPriorKnowledgeStage = currentStage?.type === "prior_knowledge";
  const isNextStepsStage = currentStage?.type === "next_steps";

  // ─── Pause Hint Timer ──────────────────────────────────────────────────────

  useEffect(() => {
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    setShowPulseHint(false);

    if (currentStage && REGEN_STAGES.has(currentStage.type) && activeJourney && !showCompletion) {
      pauseTimerRef.current = setTimeout(() => {
        setShowPulseHint(true);
      }, PAUSE_HINT_DELAY);
    }

    return () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }
    };
  }, [currentStageIdx, activeJourney?.id, showCompletion]);

  // ─── Handle Stage Regeneration ────────────────────────────────────────────

  const handleRegenStage = useCallback(
    async (direction: "simpler" | "deeper") => {
      if (!activeJourney || !currentStage || isRegenerating) return;
      if (!REGEN_STAGES.has(currentStage.type)) return;
      if (direction === "deeper" && (depthMap[currentStageIdx] ?? 0) >= MAX_DEPTH) return;

      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsRegenerating(true);
      setRegenDirection(direction);

      try {
        const lm = state.learnerModel;
        const learnerCtx = [
          lm.strengthAreas?.length ? `Strengths: ${lm.strengthAreas.join(", ")}` : "",
          lm.confusionPoints?.length ? `Struggles with: ${lm.confusionPoints.join(", ")}` : "",
          lm.preferredDepth ? `Preferred depth: ${lm.preferredDepth}` : "",
          lm.learningStyle ? `Learning style: ${lm.learningStyle}` : "",
        ].filter(Boolean).join("\n");

        const result = await regenStageMutation.mutateAsync({
          stageType: currentStage.type as "hook" | "foundation" | "explanation" | "real_world",
          originalContent: currentStage.content,
          originalTitle: currentStage.title,
          question: activeJourney.question,
          direction,
          currentDifficultyLevel: activeJourney.difficultyLevel || 1,
          depthLevel: direction === "deeper" ? (depthMap[currentStageIdx] ?? 0) : 0,
          learnerContext: learnerCtx,
        });

        const updatedStages = [...activeJourney.stages];
        updatedStages[currentStageIdx] = {
          ...updatedStages[currentStageIdx],
          title: result.title,
          content: result.content,
          emoji: result.emoji,
          keyTakeaway: result.keyTakeaway,
        };

        const updatedJourney = { ...activeJourney, stages: updatedStages };
        setActiveJourney(updatedJourney);
        dispatch({
          type: "UPDATE_JOURNEY",
          payload: { id: activeJourney.id, updates: { stages: updatedStages } },
        });

        setShowPulseHint(false);
        if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = setTimeout(() => setShowPulseHint(true), PAUSE_HINT_DELAY);

        if (direction === "simpler") {
          dispatch({
            type: "UPDATE_LEARNER_MODEL",
            payload: {
              explainSimplerCount: (lm.explainSimplerCount || 0) + 1,
              confusionPoints: [
                ...new Set([...(lm.confusionPoints || []), ...activeJourney.mappedConcepts.slice(0, 1)]),
              ].slice(-10),
            },
          });
        } else {
          setDepthMap((prev) => ({
            ...prev,
            [currentStageIdx]: (prev[currentStageIdx] ?? 0) + 1,
          }));
          dispatch({
            type: "UPDATE_LEARNER_MODEL",
            payload: {
              strengthAreas: [
                ...new Set([...(lm.strengthAreas || []), ...activeJourney.mappedConcepts.slice(0, 1)]),
              ].slice(-20),
              preferredDepth: lm.preferredDepth === "overview" ? "detailed" : lm.preferredDepth === "detailed" ? "expert" : lm.preferredDepth,
            },
          });
          for (const concept of activeJourney.mappedConcepts.slice(0, 2)) {
            dispatch({ type: "ADD_CONCEPT_CONFIDENCE", payload: { concept, confidence: 0.6 } });
          }
        }

        awardStageXp("hook");
      } catch (e) {
        console.error("[RegenStage] Failed:", e);
      } finally {
        setIsRegenerating(false);
        setRegenDirection(null);
      }
    },
    [activeJourney, currentStage, currentStageIdx, isRegenerating, state.learnerModel, dispatch, regenStageMutation, awardStageXp, depthMap]
  );

  // ─── Render Card Content ─────────────────────────────────────────────────

  const renderCardContent = () => {
    if (!currentStage) return null;

    switch (currentStage.type) {
      case "prior_knowledge":
        return (
          <PriorKnowledgeCard
            stage={currentStage}
            isDark={isDark}
            questions={priorKnowledgeQuestions}
            warmGreeting={priorKnowledgeGreeting}
            onComplete={handlePriorKnowledgeComplete}
            colors={colors}
          />
        );
      case "hook":
      case "foundation":
      case "explanation":
      case "real_world":
        return <InfoCardContent stage={currentStage} isDark={isDark} />;
      case "check":
        return <CheckCardContent stage={currentStage} isDark={isDark} onAnswer={handleCheckAnswer} />;
      case "fill-in-the-blank":
        return (
          <FillInTheBlankCard
            stage={currentStage}
            onAnswer={(answer) => handleCheckAnswer(answer === currentStage.correctAnswers?.[0])}
            isAnswered={checkAnswered}
            isCorrect={journeyCheckCorrect}
          />
        );
      case "video":
        return (
          <VideoCardContent
            stage={currentStage}
            isDark={isDark}
            videos={stageVideos}
            videosLoading={videosLoading}
            onWatch={handleVideoWatch}
          />
        );
      case "next_steps":
        return <NextStepsCardContent stage={currentStage} isDark={isDark} onSelect={handleNextStepSelect} onComplete={handleCompleteJourney} />;
      default:
        return <InfoCardContent stage={currentStage} isDark={isDark} />;
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
              {activeJourney && !showWelcome ? activeJourney.emoji + " Learning Journey" : "🌍 Gaia"}
            </Text>
            {activeJourney && !showWelcome ? (
              <Text numberOfLines={1} style={[styles.headerSub, { color: colors.muted }]}>
                {activeJourney.question}
              </Text>
            ) : (
              <Text style={[styles.headerSub, { color: colors.muted }]}>
                {state.learnerModel.questionsAsked > 0
                  ? `${state.learnerModel.questionsAsked} topics explored`
                  : "Your learning companion"}
              </Text>
            )}
          </View>
          {activeJourney && !showWelcome && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={styles.xpHeaderBadge}>
                <Text style={styles.xpHeaderIcon}>{"⭐"}</Text>
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
        {/* XP popup removed — shown at journey completion instead */}

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
                Hi! I'm Gaia, your learning companion
              </Text>
              <Text style={[styles.welcomeDesc, { color: colors.muted }]}>
                I'm here to coach you through any topic, celebrate your wins, and help you master what matters. What would you like to learn today?
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
          /* ─── Card Queue View ─────────────────────────────────────── */
          <View style={styles.flex1}>
            {/* Card Progress Bar — skip prior_knowledge */}
            {!isPriorKnowledgeStage && visibleStages.length > 0 && (
              <CardProgressBar
                total={visibleStages.length}
                current={Math.max(0, visibleStageIdx)}
              />
            )}

            {/* Difficulty & Streak */}
            {!isPriorKnowledgeStage && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 4 }}>
                <DifficultyBadge level={activeJourney.difficultyLevel || 1} label={activeJourney.difficultyLabel || "Curious Beginner"} />
                <StreakBadge streak={state.profile.checkStreak ?? 0} multiplier={currentMultiplierRef.current} />
              </View>
            )}

            {/* Challenge Timer */}
            {currentStage?.type === "check" && !checkAnswered && (
              <ChallengeTimer
                key={`timer-${currentStageIdx}`}
                seconds={CHALLENGE_TIMER_SECONDS}
                onExpire={() => setChallengeTimerExpired(true)}
                active={challengeTimerActive}
              />
            )}

            {/* Swipe Hint */}
            {showSwipeHint && currentStageIdx === 0 && !isPriorKnowledgeStage && (
              <Animated.View
                entering={FadeInDown.delay(500).duration(400)}
                exiting={FadeOut.duration(300)}
                style={{
                  alignItems: "center",
                  paddingVertical: 8,
                  marginHorizontal: 16,
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 12, color: colors.muted, fontStyle: "italic" }}>
                  ← Swipe to navigate →
                </Text>
              </Animated.View>
            )}

            {/* Card Content */}
            <GestureDetector gesture={swipeGesture}>
              <Animated.View style={[styles.flex1, swipeAnimatedStyle]}>
                <ScrollView
                  ref={scrollRef}
                  style={styles.flex1}
                  contentContainerStyle={Dimensions.get('window').height < 700 ? styles.cardScrollSmall : styles.cardScroll}
                  showsVerticalScrollIndicator={false}
                >
                  <Animated.View
                    key={`card-${currentStageIdx}`}
                    entering={SlideInRight.duration(250).easing(Easing.out(Easing.cubic))}
                  >
                    {renderCardContent()}
                  </Animated.View>

                  {/* Explain Simpler / Tell Me More */}
                  {currentStage && REGEN_STAGES.has(currentStage.type) && (
                    <StageActions
                      stageType={currentStage.type}
                      isRegenerating={isRegenerating}
                      regenDirection={regenDirection}
                      onSimpler={() => handleRegenStage("simpler")}
                      onDeeper={() => handleRegenStage("deeper")}
                      isDark={isDark}
                      showPulseHint={showPulseHint}
                      depthLevel={currentDepth}
                      maxDepthReached={maxDepthReached}
                    />
                  )}
                </ScrollView>
              </Animated.View>
            </GestureDetector>

            {/* Bottom Bar — Card Navigation + Ask Button */}
            {!isPriorKnowledgeStage && !isNextStepsStage && (
              <View style={[styles.cardNavBar, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
                {/* Back */}
                <TouchableOpacity
                  onPress={goPrev}
                  disabled={currentStageIdx === 0 || activeJourney?.stages[currentStageIdx - 1]?.type === "prior_knowledge"}
                  activeOpacity={0.7}
                  style={[
                    styles.cardNavBtn,
                    {
                      backgroundColor: (currentStageIdx === 0 || activeJourney?.stages[currentStageIdx - 1]?.type === "prior_knowledge") ? "transparent" : colors.surface,
                      borderColor: colors.border,
                      opacity: (currentStageIdx === 0 || activeJourney?.stages[currentStageIdx - 1]?.type === "prior_knowledge") ? 0.3 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.cardNavBtnText, { color: colors.foreground }]}>{"‹"}</Text>
                </TouchableOpacity>

                {/* Ask a Question button */}
                <TouchableOpacity
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setChatVisible(true);
                  }}
                  activeOpacity={0.7}
                  style={[styles.askBtn, { backgroundColor: isDark ? colors.surface : "#F3F4F6", borderColor: colors.border }]}
                >
                  <Text style={{ fontSize: 16 }}>💬</Text>
                  <Text style={[styles.askBtnText, { color: colors.muted }]}>Ask a question...</Text>
                </TouchableOpacity>

                {/* Next / Complete */}
                <TouchableOpacity
                  onPress={isLastStage ? handleCompleteJourney : goNext}
                  disabled={!canAdvance}
                  activeOpacity={0.7}
                  style={[
                    styles.cardNavBtnNext,
                    {
                      backgroundColor: canAdvance ? colors.primary : colors.surface,
                      opacity: canAdvance ? 1 : 0.4,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cardNavBtnNextText,
                      { color: canAdvance ? "#FFFFFF" : colors.muted },
                    ]}
                  >
                    {isCheckStage && !checkAnswered
                      ? "Answer first"
                      : isLastStage
                      ? "Complete"
                      : "Next"}
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

        {/* Chat Sidebar */}
        <ChatSidebar
          visible={chatVisible}
          onClose={() => setChatVisible(false)}
          journeyQuestion={activeJourney?.question || ""}
          currentStage={currentStage || null}
          isDark={isDark}
          skillLevel={state.profile.skillLevel}
          learnerModel={{
            preferredDepth: state.learnerModel.preferredDepth,
            confusionPoints: state.learnerModel.confusionPoints,
            strengthAreas: state.learnerModel.strengthAreas,
          }}
        />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex1: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flex: 1, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 1 },
  newBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  newBtnText: { fontSize: 14, fontWeight: "600" },

  // Loading
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  loadingInner: { alignItems: "center", gap: 16 },
  loadingTitle: { fontSize: 18, fontWeight: "600", textAlign: "center" },
  loadingDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },

  // Welcome
  welcomeContent: { paddingHorizontal: 12, paddingTop: 30, paddingBottom: 12 },
  welcomeInner: { alignItems: "center", marginBottom: 20 },
  welcomeEmoji: { fontSize: 36, marginBottom: 12 },
  welcomeTitle: { fontSize: 20, fontWeight: "700", textAlign: "center", marginBottom: 6 },
  welcomeDesc: { fontSize: 13, textAlign: "center", lineHeight: 19, maxWidth: 280 },

  // Suggestions
  suggestionsWrap: { gap: 8, marginBottom: 24 },
  suggestionsLoading: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12 },
  suggestionsLoadingText: { fontSize: 13 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: "500", lineHeight: 18 },
  chipReason: { fontSize: 10, marginTop: 2, lineHeight: 14 },

  // Recent Journeys
  recentWrap: { marginTop: 8 },
  recentTitle: { fontSize: 13, fontWeight: "600", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  recentItem: { paddingVertical: 10, borderBottomWidth: 0.5, paddingHorizontal: 12 },
  recentItemRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  recentEmoji: { fontSize: 24 },
  recentItemContent: { flex: 1 },
  recentQuestion: { fontSize: 13, fontWeight: "600" },
  recentMeta: { fontSize: 11, marginTop: 1 },

  // Card Progress Bar
  progressBarWrap: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  progressBarRow: {
    flexDirection: "row",
    gap: 4,
    height: 4,
    borderRadius: 2,
  },
  progressSegment: {
    height: 4,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 6,
  },

  // Card Body (shared across all card types)
  cardBody: {
    borderRadius: 16,
    padding: 16,
  },
  cardBodySmall: {
    borderRadius: 14,
    padding: 10,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  cardTitle: { fontSize: getResponsiveFontSize(22), fontWeight: "700", lineHeight: getResponsiveFontSize(30), marginBottom: getResponsiveSpacing(16) },
  cardTitleSmall: { fontSize: getResponsiveFontSize(18), fontWeight: "700", lineHeight: getResponsiveFontSize(26), marginBottom: getResponsiveSpacing(12) },
  cardContent: { fontSize: getResponsiveFontSize(16), lineHeight: getResponsiveFontSize(28) },
  cardContentSmall: { fontSize: getResponsiveFontSize(14), lineHeight: getResponsiveFontSize(24) },
  cardScroll: { paddingHorizontal: getResponsiveSpacing(20), paddingTop: getResponsiveSpacing(8), paddingBottom: getResponsiveSpacing(100) },
  cardScrollSmall: { paddingHorizontal: getResponsiveSpacing(16), paddingTop: getResponsiveSpacing(4), paddingBottom: getResponsiveSpacing(80) },

  // Key Takeaway
  takeawayBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  takeawayLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  takeawayText: { fontSize: getResponsiveFontSize(15), lineHeight: getResponsiveFontSize(24), fontWeight: "500" },

  // Check Options
  checkOption: {
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(12),
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: getResponsiveSpacing(8),
  },
  checkOptionText: { fontSize: getResponsiveFontSize(15), fontWeight: "500", lineHeight: getResponsiveFontSize(24) },
  checkExplanation: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
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
  videoThumb: { width: "100%", height: isSmallScreen() ? 140 : 200, borderTopLeftRadius: 13, borderTopRightRadius: 13 },
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
    width: 48,
    height: 48,
    borderRadius: 24,
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
  videoMeta: { padding: 12 },
  videoMetaTitle: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  videoMetaChannel: { fontSize: 12, marginTop: 4 },

  // Next Steps
  nextPath: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  nextPathQuestion: { fontSize: 13, fontWeight: "600", lineHeight: 19 },
  nextPathReason: { fontSize: 11, marginTop: 2, lineHeight: 16 },

  // Card Navigation Bar
  cardNavBar: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderTopWidth: 0.5,
    alignItems: "center",
  },
  cardNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardNavBtnText: { fontSize: 24, fontWeight: "300", marginTop: -2 },
  cardNavBtnNext: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
  },
  cardNavBtnNextText: { fontSize: 13, fontWeight: "700" },

  // Ask Button (in nav bar)
  askBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
  },
  askBtnText: { fontSize: 14, fontWeight: "500" },

  // Input Bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    gap: 8,
  },
  chatInput: {
    flex: 1,
    minHeight: isSmallScreen() ? 36 : 40,
    borderRadius: 20,
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(8),
    fontSize: getResponsiveFontSize(14),
    borderWidth: 1,
  },endBtn: {
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
    left: 0,
    right: 0,
    alignItems: "center" as const,
    zIndex: 999,
    elevation: 999,
    pointerEvents: "none" as const,
  },
  xpPopupInner: {
    backgroundColor: "rgba(34, 197, 94, 0.18)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
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

  // Stage Actions
  stageActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  stageActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  stageActionIcon: { fontSize: 16 },
  stageActionText: { fontSize: 13, fontWeight: "700" },
  pulseHintText: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 4,
    opacity: 0.8,
  },
  depthDotsRow: {
    flexDirection: "row" as const,
    gap: 3,
    marginTop: 2,
  },
  depthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

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

  // Chat Sidebar (Bottom Sheet)
  chatOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  chatSheet: {
    height: "75%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  chatHeaderTitle: { fontSize: 17, fontWeight: "700" },
  chatHeaderSub: { fontSize: 13, marginTop: 2 },
  chatCloseBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  chatCloseBtnText: { fontSize: 15, fontWeight: "600" },
  chatMessages: { flex: 1 },
  chatBubble: {
    maxWidth: "85%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    marginBottom: 10,
  },
  chatBubbleUser: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  chatBubbleAssistant: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  chatBubbleText: { fontSize: 15, lineHeight: 22 },
  chatInputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: getResponsiveSpacing(10),
    paddingVertical: getResponsiveSpacing(6),
    borderTopWidth: 0.5,
    gap: getResponsiveSpacing(6),
  },
  chatInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  chatSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  chatSendIcon: { fontSize: 20, fontWeight: "700" },
});
