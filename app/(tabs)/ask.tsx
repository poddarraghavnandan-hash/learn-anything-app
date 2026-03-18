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
import { trpc } from "@/lib/trpc";
import { openVideoInApp } from "@/lib/video-utils";
import type {
  JourneyStage,
  LearningJourney,
  ContentItemData,
} from "@/shared/types";
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
        <Text style={[styles.stageContent, { color: isDark ? colors.foreground + "DD" : "#374151", marginBottom: 16 }]}>{stage.content}</Text>
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
        <Text style={[styles.stageContent, { color: isDark ? colors.foreground + "DD" : "#374151", marginBottom: 16 }]}>
          {stage.videoContext}
        </Text>
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
}: {
  stage: JourneyStage;
  isDark: boolean;
  onSelect: (question: string) => void;
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
  const isDark = colors.background === "#0A0A14" || colors.background.startsWith("#0");
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

  const learnMutation = trpc.chat.learn.useMutation();
  const fetchContentMutation = trpc.chat.fetchStepContent.useMutation();
  const suggestionsMutation = trpc.chat.suggestions.useMutation();

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

      try {
        const result = await learnMutation.mutateAsync({
          question: question.trim(),
          skillLevel: state.profile.skillLevel,
          learnerModel: getLearnerSnapshot(),
          pastConversations: getPastConversationSummaries(),
        });

        const journey: LearningJourney = {
          id: genId(),
          question: question.trim(),
          stages: result.stages as JourneyStage[],
          mappedConcepts: result.mappedConcepts,
          difficulty: result.difficulty as any,
          emoji: result.emoji,
          createdAt: new Date().toISOString(),
          currentStageIndex: 0,
          completed: false,
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

        addXp(15);
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

      setCurrentStageIdx(idx);
      setCheckAnswered(false);
      scrollRef.current?.scrollTo({ y: 0, animated: true });

      // Update journey progress
      dispatch({
        type: "UPDATE_JOURNEY",
        payload: {
          id: activeJourney.id,
          updates: {
            currentStageIndex: idx,
            completed: idx === activeJourney.stages.length - 1,
          },
        },
      });

      // Pre-fetch video if needed
      const stage = activeJourney.stages[idx];
      if (stage.type === "video") {
        fetchVideoForStage(stage);
      }
    },
    [activeJourney, dispatch, fetchVideoForStage]
  );

  const goNext = useCallback(() => {
    if (!activeJourney) return;
    const nextIdx = currentStageIdx + 1;
    if (nextIdx < activeJourney.stages.length) {
      goToStage(nextIdx);
    }
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
      addXp(correct ? 15 : 5);
      dispatch({ type: "RECORD_QUIZ", payload: { correct } });

      if (correct && activeJourney) {
        for (const concept of activeJourney.mappedConcepts) {
          dispatch({ type: "ADD_CONCEPT_CONFIDENCE", payload: { concept, confidence: 0.8 } });
        }
      }
    },
    [addXp, dispatch, activeJourney]
  );

  // ─── Handle Video Watch ─────────────────────────────────────────────────────

  const handleVideoWatch = useCallback(
    (url: string, title: string) => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      openVideoInApp(url, title);
      addXp(10);
      dispatch({ type: "INCREMENT_VIDEOS" });
    },
    [addXp, dispatch]
  );

  // ─── Handle Next Steps Selection ────────────────────────────────────────────

  const handleNextStepSelect = useCallback(
    (question: string) => {
      // Start a brand new journey
      setActiveJourney(null);
      setCurrentStageIdx(0);
      dispatch({ type: "SET_ACTIVE_JOURNEY", payload: null });
      startJourney(question);
    },
    [dispatch, startJourney]
  );

  // ─── New Journey ────────────────────────────────────────────────────────────

  const handleNewJourney = useCallback(() => {
    setActiveJourney(null);
    setCurrentStageIdx(0);
    setShowWelcome(true);
    setStageVideos([]);
    setCheckAnswered(false);
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
        return <NextStepsCard stage={currentStage} isDark={isDark} onSelect={handleNextStepSelect} />;
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
            <TouchableOpacity
              onPress={handleNewJourney}
              activeOpacity={0.7}
              style={[styles.newBtn, { backgroundColor: colors.primary + "15" }]}
            >
              <Text style={[styles.newBtnText, { color: colors.primary }]}>New</Text>
            </TouchableOpacity>
          )}
        </View>

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
        ) : activeJourney ? (
          /* Journey View */
          <View style={styles.flex1}>
            {/* Progress Dots */}
            <ProgressDots
              total={activeJourney.stages.length}
              current={currentStageIdx}
              onDotPress={goToStage}
            />

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
                  disabled={!canAdvance || isLastStage}
                  activeOpacity={0.7}
                  style={[
                    styles.navBtnNext,
                    {
                      backgroundColor: canAdvance && !isLastStage ? colors.primary : colors.surface,
                      opacity: canAdvance && !isLastStage ? 1 : 0.4,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.navBtnNextText,
                      { color: canAdvance && !isLastStage ? "#FFFFFF" : colors.muted },
                    ]}
                  >
                    {isCheckStage && !checkAnswered ? "Answer to continue" : "Continue"}
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
  stageTitle: { fontSize: 22, fontWeight: "700", lineHeight: 30, marginBottom: 12 },
  stageContent: { fontSize: 16, lineHeight: 26 },

  // Key Takeaway
  takeawayBox: {
    marginTop: 20,
    padding: 16,
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
  takeawayText: { fontSize: 15, lineHeight: 22, fontWeight: "500" },

  // Check Options
  checkOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  checkOptionText: { fontSize: 15, fontWeight: "500", lineHeight: 22 },
  checkExplanation: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
  },
  checkExplanationText: { fontSize: 14, lineHeight: 22 },

  // Video
  videoLoading: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 20 },
  videoLoadingText: { fontSize: 14 },
  videoPreview: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  videoThumbWrap: { position: "relative" },
  videoThumb: { width: "100%", height: 180, borderTopLeftRadius: 13, borderTopRightRadius: 13 },
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
  videoMeta: { padding: 14 },
  videoMetaTitle: { fontSize: 15, fontWeight: "600", lineHeight: 22 },
  videoMetaChannel: { fontSize: 13, marginTop: 4 },

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
});
