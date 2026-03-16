import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useLearning } from "@/lib/learning-store";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import type {
  ChatMessage,
  ChatConversation,
  ContentItemData,
  NudgeData,
  NudgeType,
} from "@/shared/types";
import * as Haptics from "expo-haptics";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function genConvId() {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Suggestion Chips ─────────────────────────────────────────────────────────

const FALLBACK_SUGGESTIONS = [
  "Why does the Earth orbit the Sun?",
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
    <View style={s.suggestionsWrap}>
      {loading ? (
        <Animated.View entering={FadeIn.duration(200)} style={s.suggestionsLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[s.suggestionsLoadingText, { color: colors.muted }]}>
            Personalizing for you...
          </Text>
        </Animated.View>
      ) : (
        items.map((q, i) => (
          <Animated.View key={q} entering={FadeInUp.delay(i * 80).duration(300)}>
            <TouchableOpacity
              onPress={() => onSelect(q)}
              style={[s.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <Text style={[s.chipText, { color: colors.foreground }]}>{q}</Text>
              {reasons[i] && suggestions.length > 0 ? (
                <Text style={[s.chipReason, { color: colors.muted }]}>{reasons[i]}</Text>
              ) : null}
            </TouchableOpacity>
          </Animated.View>
        ))
      )}
    </View>
  );
}

// ─── Bubble Components ────────────────────────────────────────────────────────

function TextBubble({ msg }: { msg: ChatMessage }) {
  const colors = useColors();
  const isUser = msg.role === "user";

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      style={[
        s.bubble,
        isUser
          ? [s.userBubble, { backgroundColor: colors.primary }]
          : [s.aiBubble, { backgroundColor: colors.surface }],
      ]}
    >
      <Text
        style={[
          s.bubbleText,
          { color: isUser ? "#FFFFFF" : colors.foreground },
        ]}
      >
        {msg.text || ""}
      </Text>
    </Animated.View>
  );
}

function ThinkingBubble() {
  const colors = useColors();
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={[s.bubble, s.aiBubble, { backgroundColor: colors.surface }]}
    >
      <View style={s.thinkingDots}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[s.thinkingText, { color: colors.muted }]}>Thinking...</Text>
      </View>
    </Animated.View>
  );
}

function QuizBubble({
  msg,
  onAnswer,
}: {
  msg: ChatMessage;
  onAnswer: (correct: boolean) => void;
}) {
  const colors = useColors();
  const quiz = msg.quiz;
  const [selected, setSelected] = useState<number | null>(quiz?.selectedIndex ?? null);
  const answered = selected !== null;

  if (!quiz) return null;

  const handleSelect = (idx: number) => {
    if (answered) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(idx);
    onAnswer(idx === quiz.correctIndex);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={[s.quizCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Text style={s.quizEmoji}>{quiz.emoji}</Text>
      <Text style={[s.quizQuestion, { color: colors.foreground }]}>{quiz.question}</Text>

      {quiz.options.map((opt, idx) => {
        const isCorrect = idx === quiz.correctIndex;
        const isSelected = idx === selected;
        let optBg = "transparent";
        let optBorder = colors.border;
        let optTextColor = colors.foreground;

        if (answered) {
          if (isCorrect) { optBg = colors.success + "20"; optBorder = colors.success; optTextColor = colors.success; }
          else if (isSelected && !isCorrect) { optBg = colors.error + "20"; optBorder = colors.error; optTextColor = colors.error; }
        }

        return (
          <TouchableOpacity
            key={idx}
            onPress={() => handleSelect(idx)}
            activeOpacity={0.7}
            style={[s.quizOption, { backgroundColor: optBg, borderColor: optBorder }]}
          >
            <Text style={[s.quizOptionText, { color: optTextColor }]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}

      {answered && (
        <Animated.View entering={FadeIn.duration(250)} style={s.funFactWrap}>
          <Text style={[s.funFactLabel, { color: colors.primary }]}>Did you know?</Text>
          <Text style={[s.funFactText, { color: colors.muted }]}>{quiz.funFact}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

// ─── Video Suggestion (one at a time, skippable) ─────────────────────────────

function VideoSuggestion({
  msg,
  onWatch,
  onSkip,
}: {
  msg: ChatMessage;
  onWatch: (url: string) => void;
  onSkip: () => void;
}) {
  const colors = useColors();
  const cards = msg.contentCards || [];
  const [dismissed, setDismissed] = useState(false);

  if (cards.length === 0 || dismissed) return null;

  // Show only the most relevant video (first one)
  const card = cards[0];
  const duration = card.durationSeconds
    ? `${Math.floor(card.durationSeconds / 60)}:${String(card.durationSeconds % 60).padStart(2, "0")}`
    : null;

  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      <View style={[s.videoSuggestion, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[s.videoLabel, { color: colors.primary }]}>Recommended Video</Text>

        <TouchableOpacity
          onPress={() => {
            if (card.url) onWatch(card.url);
          }}
          activeOpacity={0.7}
          style={s.videoCard}
        >
          {card.thumbnailUrl ? (
            <View style={s.videoThumbWrap}>
              <Image source={{ uri: card.thumbnailUrl }} style={s.videoThumb} contentFit="cover" />
              {duration && (
                <View style={s.videoDuration}>
                  <Text style={s.videoDurationText}>{duration}</Text>
                </View>
              )}
            </View>
          ) : null}
          <View style={s.videoInfo}>
            <Text numberOfLines={2} style={[s.videoTitle, { color: colors.foreground }]}>
              {card.title}
            </Text>
            <Text numberOfLines={1} style={[s.videoChannel, { color: colors.muted }]}>
              {card.channelOrAuthor || card.source}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={s.videoActions}>
          <TouchableOpacity
            onPress={() => {
              if (card.url) onWatch(card.url);
            }}
            activeOpacity={0.7}
            style={[s.watchBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={s.watchBtnText}>Watch</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setDismissed(true);
              onSkip();
            }}
            activeOpacity={0.7}
            style={[s.skipBtn, { borderColor: colors.border }]}
          >
            <Text style={[s.skipBtnText, { color: colors.muted }]}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Nudge Bubble ─────────────────────────────────────────────────────────────

function NudgeBubble({
  msg,
  onRespond,
}: {
  msg: ChatMessage;
  onRespond: (nudge: NudgeData, response: string) => void;
}) {
  const colors = useColors();
  const nudge = msg.nudge;
  const [responded, setResponded] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  if (!nudge) return null;

  const handleTap = (option: string) => {
    if (responded) return;
    setResponded(true);
    setSelectedOption(option);
    onRespond(nudge, option);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(350)}
      style={[s.nudgeCard, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "25" }]}
    >
      <Text style={s.nudgeEmoji}>{nudge.emoji}</Text>
      <Text style={[s.nudgeQuestion, { color: colors.foreground }]}>{nudge.question}</Text>

      {nudge.options && nudge.options.length > 0 && (
        <View style={s.nudgeOptions}>
          {nudge.options.map((opt, idx) => {
            const isSelected = opt === selectedOption;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => handleTap(opt)}
                activeOpacity={0.7}
                style={[
                  s.nudgeOption,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    s.nudgeOptionText,
                    { color: isSelected ? "#FFFFFF" : colors.foreground },
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {responded && (
        <Animated.View entering={FadeIn.duration(200)}>
          <Text style={[s.nudgeAck, { color: colors.muted }]}>
            Got it — this helps me personalize your learning
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

// ─── Encouragement Bubble ─────────────────────────────────────────────────────

function EncouragementBubble({ msg }: { msg: ChatMessage }) {
  const colors = useColors();
  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      style={[s.encourageCard, { backgroundColor: colors.primary + "15" }]}
    >
      <Text style={[s.encourageText, { color: colors.primary }]}>{msg.text}</Text>
    </Animated.View>
  );
}

// ─── Recent Conversations ─────────────────────────────────────────────────────

function RecentConversations({
  conversations,
  onSelect,
}: {
  conversations: ChatConversation[];
  onSelect: (conv: ChatConversation) => void;
}) {
  const colors = useColors();
  if (conversations.length === 0) return null;

  return (
    <View style={s.recentWrap}>
      <Text style={[s.recentTitle, { color: colors.muted }]}>Continue learning</Text>
      {conversations.slice(0, 5).map((conv) => (
        <TouchableOpacity
          key={conv.id}
          onPress={() => onSelect(conv)}
          activeOpacity={0.7}
          style={[s.recentItem, { borderColor: colors.border }]}
        >
          <Text numberOfLines={1} style={[s.recentQuestion, { color: colors.foreground }]}>
            {conv.originalQuestion}
          </Text>
          <Text style={[s.recentMeta, { color: colors.muted }]}>
            {conv.mappedConcepts.slice(0, 2).join(" · ")}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Main Ask Screen ──────────────────────────────────────────────────────────

export default function AskScreen() {
  const colors = useColors();
  const { state, dispatch, addXp } = useLearning();
  const params = useLocalSearchParams<{ q?: string }>();
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [messageCount, setMessageCount] = useState(0);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [suggestionReasons, setSuggestionReasons] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const hasAutoAsked = useRef(false);

  const askMutation = trpc.chat.ask.useMutation();
  const baselineMutation = trpc.chat.baseline.useMutation();
  const fetchContentMutation = trpc.chat.fetchStepContent.useMutation();
  const followUpMutation = trpc.chat.followUp.useMutation();
  const suggestionsMutation = trpc.chat.suggestions.useMutation();

  // ─── Load Smart Suggestions on Mount ──────────────────────────────────────

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
  }, [state.learnerModel, state.profile.interests, suggestionsMutation]);

  // Load existing conversation
  useEffect(() => {
    if (state.activeConversationId) {
      const conv = state.conversations.find((c) => c.id === state.activeConversationId);
      if (conv) {
        setMessages(conv.messages);
        setActiveConvId(conv.id);
        setShowWelcome(false);
        setMessageCount(conv.messages.length);
      }
    }
  }, []);

  // ─── Auto-ask from Home search bar (q param) ─────────────────────────────

  useEffect(() => {
    if (params.q && !hasAutoAsked.current) {
      hasAutoAsked.current = true;
      handleAsk(params.q);
    }
  }, [params.q]);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const addMsg = useCallback(
    (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      if (activeConvId) {
        dispatch({ type: "ADD_CHAT_MESSAGE", payload: { conversationId: activeConvId, message: msg } });
      }
      scrollToEnd();
    },
    [activeConvId, dispatch, scrollToEnd]
  );

  // ─── Build Learner Model Snapshot ────────────────────────────────────────────

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

  // ─── Build Past Conversation Summaries ───────────────────────────────────

  const getPastConversationSummaries = useCallback(() => {
    return state.conversations
      .filter((c) => c.id !== activeConvId)
      .slice(-5)
      .map((c) => ({
        question: c.originalQuestion,
        concepts: c.mappedConcepts,
        timestamp: c.createdAt,
      }));
  }, [state.conversations, activeConvId]);

  // ─── Handle Nudge Response ───────────────────────────────────────────────────

  const handleNudgeResponse = useCallback(
    (nudge: NudgeData, response: string) => {
      const updates: Record<string, unknown> = {};

      switch (nudge.nudgeType as NudgeType) {
        case "pace_check":
          if (response.toLowerCase().includes("deeper") || response.toLowerCase().includes("more")) {
            updates.preferredPace = "deep";
            updates.preferredDepth = "detailed";
          } else if (response.toLowerCase().includes("move") || response.toLowerCase().includes("next")) {
            updates.preferredPace = "quick";
            updates.preferredDepth = "overview";
          }
          break;
        case "confidence_gauge": {
          const conv = state.conversations.find((c) => c.id === activeConvId);
          if (response.toLowerCase().includes("yes") || response.toLowerCase().includes("click") || response.toLowerCase().includes("makes sense")) {
            if (conv?.mappedConcepts.length) {
              updates.strengthAreas = [...state.learnerModel.strengthAreas, conv.mappedConcepts[0]];
            }
          } else {
            if (conv?.mappedConcepts.length) {
              updates.confusionPoints = [...state.learnerModel.confusionPoints, conv.mappedConcepts[0]];
            }
          }
          break;
        }
        case "connection_check":
        case "application_prompt":
          if (response && response.length > 5) {
            updates.realWorldConnections = [...state.learnerModel.realWorldConnections, response];
          }
          break;
        case "analogy_test": {
          if (response && response.length > 20) {
            const conv3 = state.conversations.find((c) => c.id === activeConvId);
            if (conv3?.mappedConcepts.length) {
              updates.strengthAreas = [...state.learnerModel.strengthAreas, conv3.mappedConcepts[0]];
            }
          }
          break;
        }
        default:
          break;
      }

      dispatch({
        type: "UPDATE_LEARNER_MODEL",
        payload: {
          ...updates,
          totalNudgesAnswered: state.learnerModel.totalNudgesAnswered + 1,
          nudgeResponsePatterns: {
            ...state.learnerModel.nudgeResponsePatterns,
            [nudge.nudgeType]: (state.learnerModel.nudgeResponsePatterns[nudge.nudgeType as NudgeType] || 0) + 1,
          },
        },
      });

      if (activeConvId && response) {
        handleFollowUp(response);
      }
    },
    [state.conversations, state.learnerModel, activeConvId, dispatch]
  );

  // ─── Handle New Question (focused: one concept at a time) ──────────────────

  const handleAsk = useCallback(
    async (question: string) => {
      if (!question.trim() || isThinking) return;

      setShowWelcome(false);
      setInputText("");
      setMessageCount(0);

      const convId = genConvId();
      setActiveConvId(convId);

      const userMsg: ChatMessage = {
        id: genId(),
        role: "user",
        bubbleType: "text",
        text: question.trim(),
        timestamp: Date.now(),
      };

      const newConv: ChatConversation = {
        id: convId,
        title: question.trim(),
        messages: [userMsg],
        originalQuestion: question.trim(),
        mappedConcepts: [],
        baselineLevel: state.profile.skillLevel,
        baselineDone: false,
        miniLadder: [],
        currentStep: 0,
        signalsGathered: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: "SAVE_CONVERSATION", payload: newConv });
      dispatch({
        type: "UPDATE_LEARNER_MODEL",
        payload: {
          questionsAsked: state.learnerModel.questionsAsked + 1,
          pastTopics: [...state.learnerModel.pastTopics, question.trim().slice(0, 50)],
        },
      });
      setMessages([userMsg]);
      setIsThinking(true);
      scrollToEnd();

      try {
        // Step 1: AI explains ONE concept clearly (no data dump)
        const aiResponse = await askMutation.mutateAsync({
          question: question.trim(),
          skillLevel: state.profile.skillLevel,
          messageCount: 0,
          learnerModel: getLearnerSnapshot(),
          conversationHistory: [],
          pastConversations: getPastConversationSummaries(),
        });

        setMessageCount(1);

        // AI response — one focused explanation
        const aiMsg: ChatMessage = {
          id: genId(),
          role: "assistant",
          bubbleType: "text",
          text: aiResponse.response,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, aiMsg]);
        dispatch({ type: "ADD_CHAT_MESSAGE", payload: { conversationId: convId, message: aiMsg } });
        dispatch({
          type: "UPDATE_CONVERSATION",
          payload: { id: convId, updates: { mappedConcepts: aiResponse.mappedConcepts } },
        });
        scrollToEnd();

        // Show nudge if returned (one check-in question)
        if (aiResponse.nudge) {
          const nudgeMsg: ChatMessage = {
            id: genId(),
            role: "assistant",
            bubbleType: "nudge",
            nudge: aiResponse.nudge as NudgeData,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, nudgeMsg]);
          dispatch({ type: "ADD_CHAT_MESSAGE", payload: { conversationId: convId, message: nudgeMsg } });
          scrollToEnd();
        }

        // Step 2: Show ONE relevant video (skippable) — not a list dump
        if (aiResponse.suggestedSearchQueries.length > 0) {
          const contentResult = await fetchContentMutation.mutateAsync({
            searchQuery: aiResponse.suggestedSearchQueries[0],
          });

          if (contentResult.items.length > 0) {
            // Only show the single most relevant video
            const contentMsg: ChatMessage = {
              id: genId(),
              role: "assistant",
              bubbleType: "content_card",
              contentCards: [contentResult.items[0] as ContentItemData],
              timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, contentMsg]);
            dispatch({ type: "ADD_CHAT_MESSAGE", payload: { conversationId: convId, message: contentMsg } });
            scrollToEnd();
          }
        }

        // Step 3: Follow-up prompt to keep the conversation going
        if (aiResponse.followUpQuestion) {
          const followUpMsg: ChatMessage = {
            id: genId(),
            role: "assistant",
            bubbleType: "encouragement",
            text: aiResponse.followUpQuestion,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, followUpMsg]);
          dispatch({ type: "ADD_CHAT_MESSAGE", payload: { conversationId: convId, message: followUpMsg } });
        }

        addXp(15);
        dispatch({ type: "UPDATE_STREAK" });
        // Record activity hour for smart reminder timing
        import("@/lib/notifications").then(({ recordActivityHour }) => recordActivityHour()).catch(() => {});
      } catch {
        const errorMsg: ChatMessage = {
          id: genId(),
          role: "assistant",
          bubbleType: "text",
          text: "Hmm, I had trouble thinking about that. Could you try rephrasing your question?",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsThinking(false);
        scrollToEnd();
      }
    },
    [isThinking, state.profile.skillLevel, state.learnerModel, dispatch, askMutation, baselineMutation, fetchContentMutation, addXp, scrollToEnd, getLearnerSnapshot, getPastConversationSummaries]
  );

  // ─── Handle Follow-up (focused conversation) ─────────────────────────────

  const handleFollowUp = useCallback(
    async (text: string) => {
      if (!text.trim() || isThinking || !activeConvId) return;
      setInputText("");

      const newCount = messageCount + 1;
      setMessageCount(newCount);

      // Detect confusion signals
      const lowerText = text.toLowerCase();
      const isConfusion = lowerText.includes("don't understand") || lowerText.includes("confused") ||
        lowerText.includes("don't get") || lowerText.includes("explain simpler") ||
        lowerText.includes("what do you mean") || lowerText.includes("huh");

      if (isConfusion) {
        dispatch({
          type: "UPDATE_LEARNER_MODEL",
          payload: { explainSimplerCount: state.learnerModel.explainSimplerCount + 1 },
        });
      }

      const userMsg: ChatMessage = {
        id: genId(),
        role: "user",
        bubbleType: "text",
        text: text.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      dispatch({ type: "ADD_CHAT_MESSAGE", payload: { conversationId: activeConvId, message: userMsg } });
      setIsThinking(true);
      scrollToEnd();

      const conv = state.conversations.find((c) => c.id === activeConvId);
      const lastAiMsg = [...messages].reverse().find((m) => m.role === "assistant" && m.bubbleType === "text");

      try {
        const result = await followUpMutation.mutateAsync({
          originalQuestion: conv?.originalQuestion || "",
          followUpMessage: text.trim(),
          previousResponse: lastAiMsg?.text || "",
          skillLevel: state.profile.skillLevel,
          messageCount: newCount,
          learnerModel: {
            preferredPace: state.learnerModel.preferredPace,
            preferredTone: state.learnerModel.preferredTone,
            preferredDepth: state.learnerModel.preferredDepth,
            strengthAreas: state.learnerModel.strengthAreas.slice(-10),
            confusionPoints: state.learnerModel.confusionPoints.slice(-10),
            realWorldConnections: state.learnerModel.realWorldConnections.slice(-5),
            explainSimplerCount: state.learnerModel.explainSimplerCount,
          },
        });

        // One focused response
        const aiMsg: ChatMessage = {
          id: genId(),
          role: "assistant",
          bubbleType: "text",
          text: result.response,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, aiMsg]);
        dispatch({ type: "ADD_CHAT_MESSAGE", payload: { conversationId: activeConvId, message: aiMsg } });

        // Show nudge if returned
        if (result.nudge) {
          const nudgeMsg: ChatMessage = {
            id: genId(),
            role: "assistant",
            bubbleType: "nudge",
            nudge: result.nudge as NudgeData,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, nudgeMsg]);
          dispatch({ type: "ADD_CHAT_MESSAGE", payload: { conversationId: activeConvId, message: nudgeMsg } });
          scrollToEnd();
        }

        // Show ONE relevant video if suggested (skippable)
        if (result.suggestedSearchQueries.length > 0) {
          const contentResult = await fetchContentMutation.mutateAsync({
            searchQuery: result.suggestedSearchQueries[0],
          });

          if (contentResult.items.length > 0) {
            const contentMsg: ChatMessage = {
              id: genId(),
              role: "assistant",
              bubbleType: "content_card",
              contentCards: [contentResult.items[0] as ContentItemData],
              timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, contentMsg]);
            dispatch({ type: "ADD_CHAT_MESSAGE", payload: { conversationId: activeConvId, message: contentMsg } });
          }
        }

        addXp(10);
      } catch {
        const errorMsg: ChatMessage = {
          id: genId(),
          role: "assistant",
          bubbleType: "text",
          text: "Let me try again — could you rephrase that?",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsThinking(false);
        scrollToEnd();
      }
    },
    [isThinking, activeConvId, messages, messageCount, state.conversations, state.profile.skillLevel, state.learnerModel, dispatch, followUpMutation, fetchContentMutation, addXp, scrollToEnd]
  );

  // ─── Handle Submit ────────────────────────────────────────────────────────

  const handleSubmit = useCallback(() => {
    if (!inputText.trim()) return;
    if (showWelcome || !activeConvId) {
      handleAsk(inputText);
    } else {
      handleFollowUp(inputText);
    }
  }, [inputText, showWelcome, activeConvId, handleAsk, handleFollowUp]);

  // ─── Handle Quiz Answer ───────────────────────────────────────────────────

  const handleQuizAnswer = useCallback(
    (correct: boolean) => {
      addXp(correct ? 15 : 5);
      dispatch({ type: "RECORD_QUIZ", payload: { correct } });

      if (!correct) {
        const conv = state.conversations.find((c) => c.id === activeConvId);
        if (conv?.mappedConcepts.length) {
          const concept = conv.mappedConcepts[0];
          if (!state.learnerModel.confusionPoints.includes(concept)) {
            dispatch({
              type: "UPDATE_LEARNER_MODEL",
              payload: { confusionPoints: [...state.learnerModel.confusionPoints, concept] },
            });
          }
        }
      }
    },
    [addXp, dispatch, state.conversations, state.learnerModel, activeConvId]
  );

  // ─── Handle Video Actions ─────────────────────────────────────────────────

  const handleVideoWatch = useCallback((url: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url);
    addXp(5);
  }, [addXp]);

  const handleVideoSkip = useCallback(() => {
    // User skipped — that's fine, they can continue the conversation
  }, []);

  // ─── Load / New Conversation ──────────────────────────────────────────────

  const handleSelectConversation = useCallback(
    (conv: ChatConversation) => {
      setActiveConvId(conv.id);
      setMessages(conv.messages);
      setShowWelcome(false);
      setMessageCount(conv.messages.length);
      dispatch({ type: "SET_ACTIVE_CONVERSATION", payload: conv.id });
    },
    [dispatch]
  );

  const handleNewConversation = useCallback(() => {
    setActiveConvId(null);
    setMessages([]);
    setShowWelcome(true);
    setMessageCount(0);
    dispatch({ type: "SET_ACTIVE_CONVERSATION", payload: null });
    loadSmartSuggestions();
  }, [dispatch, loadSmartSuggestions]);

  // ─── Render Message ───────────────────────────────────────────────────────

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      switch (item.bubbleType) {
        case "text":
          return <TextBubble msg={item} />;
        case "baseline_quiz":
          return <QuizBubble msg={item} onAnswer={handleQuizAnswer} />;
        case "content_card":
          return <VideoSuggestion msg={item} onWatch={handleVideoWatch} onSkip={handleVideoSkip} />;
        case "thinking":
          return <ThinkingBubble />;
        case "encouragement":
          return <EncouragementBubble msg={item} />;
        case "nudge":
          return <NudgeBubble msg={item} onRespond={handleNudgeResponse} />;
        default:
          return <TextBubble msg={item} />;
      }
    },
    [handleQuizAnswer, handleNudgeResponse, handleVideoWatch, handleVideoSkip]
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={s.flex1}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <View style={s.headerLeft}>
            <Text style={[s.headerTitle, { color: colors.foreground }]}>Ask Anything</Text>
            <Text style={[s.headerSub, { color: colors.muted }]}>
              {state.learnerModel.questionsAsked > 0
                ? `${state.learnerModel.questionsAsked} questions explored`
                : "Your AI learning companion"}
            </Text>
          </View>
          {!showWelcome && (
            <TouchableOpacity
              onPress={handleNewConversation}
              activeOpacity={0.7}
              style={[s.newBtn, { backgroundColor: colors.primary + "15" }]}
            >
              <Text style={[s.newBtnText, { color: colors.primary }]}>New</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Messages or Welcome */}
        {showWelcome ? (
          <View style={s.welcomeWrap}>
            <Animated.View entering={FadeIn.duration(400)} style={s.welcomeInner}>
              <Text style={s.welcomeEmoji}>🧠</Text>
              <Text style={[s.welcomeTitle, { color: colors.foreground }]}>
                What do you want to learn?
              </Text>
              <Text style={[s.welcomeDesc, { color: colors.muted }]}>
                Ask any question — I'll explain one concept at a time, check that it clicks, and find the best video to help you understand.
              </Text>
            </Animated.View>

            <SuggestionChips
              onSelect={handleAsk}
              suggestions={smartSuggestions}
              reasons={suggestionReasons}
              loading={suggestionsLoading}
            />
            <RecentConversations conversations={state.conversations} onSelect={handleSelectConversation} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToEnd}
            ListFooterComponent={isThinking ? <ThinkingBubble /> : null}
          />
        )}

        {/* Input Bar */}
        <View style={[s.inputBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={
              showWelcome
                ? "Ask anything you want to learn..."
                : "Follow up, ask more, or change topic..."
            }
            placeholderTextColor={colors.muted}
            style={[
              s.input,
              { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border },
            ]}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
            blurOnSubmit
            editable={!isThinking}
          />
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!inputText.trim() || isThinking}
            activeOpacity={0.7}
            style={[
              s.sendBtn,
              {
                backgroundColor: inputText.trim() && !isThinking ? colors.primary : colors.surface,
              },
            ]}
          >
            <Text
              style={[
                s.sendIcon,
                { color: inputText.trim() && !isThinking ? "#FFFFFF" : colors.muted },
              ]}
            >
              ↑
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  flex1: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  headerLeft: {},
  headerTitle: { fontSize: 22, fontWeight: "700" },
  headerSub: { fontSize: 13, marginTop: 2 },
  newBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  newBtnText: { fontSize: 14, fontWeight: "600" },

  // Welcome
  welcomeWrap: { flex: 1, paddingHorizontal: 20, paddingTop: 40 },
  welcomeInner: { alignItems: "center", marginBottom: 32 },
  welcomeEmoji: { fontSize: 48, marginBottom: 16 },
  welcomeTitle: { fontSize: 24, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  welcomeDesc: { fontSize: 15, textAlign: "center", lineHeight: 22, maxWidth: 300 },

  // Suggestions
  suggestionsWrap: { gap: 8, marginBottom: 24 },
  suggestionsLoading: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12 },
  suggestionsLoadingText: { fontSize: 13 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1 },
  chipText: { fontSize: 14, fontWeight: "500", lineHeight: 20 },
  chipReason: { fontSize: 11, marginTop: 4, lineHeight: 15 },

  // Recent
  recentWrap: { marginTop: 8 },
  recentTitle: { fontSize: 13, fontWeight: "600", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  recentItem: { paddingVertical: 12, borderBottomWidth: 0.5 },
  recentQuestion: { fontSize: 15, fontWeight: "600" },
  recentMeta: { fontSize: 12, marginTop: 2 },

  // Messages
  messageList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },

  // Bubbles
  bubble: { maxWidth: "85%", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18, marginBottom: 8 },
  userBubble: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 22 },

  // Thinking
  thinkingDots: { flexDirection: "row", alignItems: "center", gap: 8 },
  thinkingText: { fontSize: 13 },

  // Quiz
  quizCard: { alignSelf: "flex-start", maxWidth: "90%", padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  quizEmoji: { fontSize: 28, marginBottom: 8 },
  quizQuestion: { fontSize: 15, fontWeight: "600", lineHeight: 22, marginBottom: 12 },
  quizOption: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, marginBottom: 6 },
  quizOptionText: { fontSize: 14, fontWeight: "500" },
  funFactWrap: { marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: "#E5E7EB" },
  funFactLabel: { fontSize: 12, fontWeight: "700", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  funFactText: { fontSize: 13, lineHeight: 19 },

  // Video Suggestion (one at a time, skippable)
  videoSuggestion: {
    alignSelf: "flex-start",
    maxWidth: "92%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  videoLabel: { fontSize: 12, fontWeight: "700", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  videoCard: { borderRadius: 12, overflow: "hidden" },
  videoThumbWrap: { position: "relative" },
  videoThumb: { width: "100%", height: 140, borderRadius: 10 },
  videoDuration: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoDurationText: { color: "#FFF", fontSize: 11, fontWeight: "600" },
  videoInfo: { paddingTop: 10 },
  videoTitle: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  videoChannel: { fontSize: 12, marginTop: 4 },
  videoActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  watchBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  watchBtnText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  skipBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", borderWidth: 1 },
  skipBtnText: { fontSize: 14, fontWeight: "600" },

  // Encouragement
  encourageCard: { alignSelf: "flex-start", maxWidth: "85%", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, marginBottom: 8 },
  encourageText: { fontSize: 14, fontWeight: "500", fontStyle: "italic", lineHeight: 20 },

  // Nudge
  nudgeCard: {
    alignSelf: "flex-start",
    maxWidth: "90%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  nudgeEmoji: { fontSize: 24, marginBottom: 8 },
  nudgeQuestion: { fontSize: 15, fontWeight: "500", lineHeight: 22, marginBottom: 12 },
  nudgeOptions: { gap: 6 },
  nudgeOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  nudgeOptionText: { fontSize: 14, fontWeight: "500" },
  nudgeAck: { fontSize: 12, marginTop: 10, fontStyle: "italic", textAlign: "center" },

  // Input Bar
  inputBar: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 0.5, gap: 8 },
  input: { flex: 1, minHeight: 40, maxHeight: 100, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, borderWidth: 1 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  sendIcon: { fontSize: 20, fontWeight: "700" },
});
