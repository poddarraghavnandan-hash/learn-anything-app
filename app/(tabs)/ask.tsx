import { useCallback, useEffect, useRef, useState } from "react";
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function genConvId() {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Suggestion Chips ─────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "Why does the Earth orbit the Sun?",
  "How do airplanes stay in the air?",
  "What is quantum physics, really?",
  "How does the internet actually work?",
  "Why do we dream at night?",
  "How do computers think?",
  "What causes earthquakes?",
  "How does DNA make us who we are?",
];

function SuggestionChips({ onSelect }: { onSelect: (q: string) => void }) {
  const colors = useColors();
  const shuffled = useRef(
    SUGGESTIONS.sort(() => Math.random() - 0.5).slice(0, 4)
  ).current;

  return (
    <View style={s.suggestionsWrap}>
      {shuffled.map((q, i) => (
        <Animated.View key={q} entering={FadeInUp.delay(i * 80).duration(300)}>
          <TouchableOpacity
            onPress={() => onSelect(q)}
            style={[s.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <Text style={[s.chipText, { color: colors.foreground }]}>{q}</Text>
          </TouchableOpacity>
        </Animated.View>
      ))}
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
          if (isCorrect) {
            optBg = colors.success + "20";
            optBorder = colors.success;
            optTextColor = colors.success;
          } else if (isSelected && !isCorrect) {
            optBg = colors.error + "20";
            optBorder = colors.error;
            optTextColor = colors.error;
          }
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

function ContentCardBubble({ msg }: { msg: ChatMessage }) {
  const colors = useColors();
  const cards = msg.contentCards || [];
  if (cards.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      <Text style={[s.contentLabel, { color: colors.muted }]}>Videos to help you learn</Text>
      {cards.slice(0, 3).map((card, i) => (
        <TouchableOpacity
          key={card.externalId || i}
          onPress={() => { if (card.url) Linking.openURL(card.url); }}
          activeOpacity={0.7}
          style={[s.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          {card.thumbnailUrl ? (
            <Image source={{ uri: card.thumbnailUrl }} style={s.contentThumb} contentFit="cover" />
          ) : null}
          <View style={s.contentInfo}>
            <Text numberOfLines={2} style={[s.contentTitle, { color: colors.foreground }]}>
              {card.title}
            </Text>
            <Text numberOfLines={1} style={[s.contentChannel, { color: colors.muted }]}>
              {card.channelOrAuthor || card.source}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
}

function LadderBubble({ msg }: { msg: ChatMessage }) {
  const colors = useColors();
  const steps = msg.miniLadder || [];
  if (steps.length === 0) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={[s.ladderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Text style={[s.ladderTitle, { color: colors.foreground }]}>Your Learning Path</Text>
      {steps.map((step, i) => (
        <View key={i} style={s.ladderStep}>
          <View style={[s.ladderDot, { backgroundColor: colors.primary }]}>
            <Text style={s.ladderDotText}>{step.order}</Text>
          </View>
          <View style={s.ladderStepContent}>
            <Text style={[s.ladderStepTitle, { color: colors.foreground }]}>{step.title}</Text>
            <Text style={[s.ladderStepDesc, { color: colors.muted }]}>{step.description}</Text>
            {step.realWorldConnection ? (
              <Text style={[s.ladderRealWorld, { color: colors.primary }]}>
                Real world: {step.realWorldConnection}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

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

// ─── Nudge Bubble — Subtle Signal-Gathering ──────────────────────────────────

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
      <Text style={[s.recentTitle, { color: colors.muted }]}>Recent questions</Text>
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
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [messageCount, setMessageCount] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const askMutation = trpc.chat.ask.useMutation();
  const baselineMutation = trpc.chat.baseline.useMutation();
  const fetchContentMutation = trpc.chat.fetchStepContent.useMutation();
  const followUpMutation = trpc.chat.followUp.useMutation();

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

  // ─── Handle Nudge Response ───────────────────────────────────────────────────

  const handleNudgeResponse = useCallback(
    (nudge: NudgeData, response: string) => {
      // Update learner model based on nudge type and response
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

        case "confidence_gauge":
          if (response.toLowerCase().includes("yes") || response.toLowerCase().includes("click") || response.toLowerCase().includes("makes sense")) {
            // They understand — add to strengths
            const conv = state.conversations.find((c) => c.id === activeConvId);
            if (conv?.mappedConcepts.length) {
              updates.strengthAreas = [...state.learnerModel.strengthAreas, conv.mappedConcepts[0]];
            }
          } else {
            // They're confused — add to confusion points
            const conv2 = state.conversations.find((c) => c.id === activeConvId);
            if (conv2?.mappedConcepts.length) {
              updates.confusionPoints = [...state.learnerModel.confusionPoints, conv2.mappedConcepts[0]];
            }
          }
          break;

        case "familiarity_check":
          if (response.toLowerCase().includes("yes") || response.toLowerCase().includes("heard")) {
            // They know it — boost confidence
          } else {
            // New concept — note it
          }
          break;

        case "connection_check":
          if (response && response.length > 5) {
            updates.realWorldConnections = [...state.learnerModel.realWorldConnections, response];
          }
          break;

        case "interest_probe":
          // The response tells us what excites them — store for future content curation
          break;

        case "application_prompt":
          if (response && response.length > 5) {
            updates.realWorldConnections = [...state.learnerModel.realWorldConnections, response];
          }
          break;

        case "analogy_test":
          // If they can explain it, they understand it deeply
          if (response && response.length > 20) {
            const conv3 = state.conversations.find((c) => c.id === activeConvId);
            if (conv3?.mappedConcepts.length) {
              updates.strengthAreas = [...state.learnerModel.strengthAreas, conv3.mappedConcepts[0]];
            }
          }
          break;

        case "direction_check":
          // They want to go somewhere specific — note the direction
          break;
      }

      // Always increment nudge counters
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

      // Send the nudge response as a follow-up to continue the conversation naturally
      if (activeConvId && response) {
        handleFollowUp(response);
      }
    },
    [state.conversations, state.learnerModel, activeConvId, dispatch]
  );

  // ─── Handle New Question ──────────────────────────────────────────────────

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
        payload: { questionsAsked: state.learnerModel.questionsAsked + 1 },
      });
      setMessages([userMsg]);
      setIsThinking(true);
      scrollToEnd();

      try {
        // Step 1: AI understands the question, with learner model context
        const aiResponse = await askMutation.mutateAsync({
          question: question.trim(),
          skillLevel: state.profile.skillLevel,
          messageCount: 0,
          learnerModel: getLearnerSnapshot(),
        });

        setMessageCount(1);

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

        // Step 1b: If AI returned a nudge, show it
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

        // Step 2: Generate baseline quiz (fun, not test-like)
        if (aiResponse.mappedConcepts.length > 0) {
          const baselineResult = await baselineMutation.mutateAsync({
            question: question.trim(),
            mappedConcepts: aiResponse.mappedConcepts,
          });

          if (baselineResult.questions.length > 0) {
            const introMsg: ChatMessage = {
              id: genId(),
              role: "assistant",
              bubbleType: "text",
              text: "Quick curiosity check — just for fun, no pressure at all:",
              timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, introMsg]);
            dispatch({ type: "ADD_CHAT_MESSAGE", payload: { conversationId: convId, message: introMsg } });

            for (const q of baselineResult.questions) {
              const quizMsg: ChatMessage = {
                id: genId(),
                role: "assistant",
                bubbleType: "baseline_quiz",
                quiz: q,
                timestamp: Date.now(),
              };
              setMessages((prev) => [...prev, quizMsg]);
              dispatch({ type: "ADD_CHAT_MESSAGE", payload: { conversationId: convId, message: quizMsg } });
            }
            scrollToEnd();
          }
        }

        // Step 3: Fetch YouTube content
        if (aiResponse.suggestedSearchQueries.length > 0) {
          const contentResult = await fetchContentMutation.mutateAsync({
            searchQuery: aiResponse.suggestedSearchQueries[0],
          });

          if (contentResult.items.length > 0) {
            const contentMsg: ChatMessage = {
              id: genId(),
              role: "assistant",
              bubbleType: "content_card",
              contentCards: contentResult.items as ContentItemData[],
              timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, contentMsg]);
            dispatch({ type: "ADD_CHAT_MESSAGE", payload: { conversationId: convId, message: contentMsg } });
            scrollToEnd();
          }
        }

        // Step 4: Follow-up prompt
        const followUpMsg: ChatMessage = {
          id: genId(),
          role: "assistant",
          bubbleType: "encouragement",
          text: aiResponse.followUpQuestion,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, followUpMsg]);
        dispatch({ type: "ADD_CHAT_MESSAGE", payload: { conversationId: convId, message: followUpMsg } });

        addXp(15);
        dispatch({ type: "UPDATE_STREAK" });
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
    [isThinking, state.profile.skillLevel, state.learnerModel, dispatch, askMutation, baselineMutation, fetchContentMutation, addXp, scrollToEnd, getLearnerSnapshot]
  );

  // ─── Handle Follow-up ─────────────────────────────────────────────────────

  const handleFollowUp = useCallback(
    async (text: string) => {
      if (!text.trim() || isThinking || !activeConvId) return;
      setInputText("");

      const newCount = messageCount + 1;
      setMessageCount(newCount);

      // Check for "I don't understand" signals
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

        // Fetch new content if suggested
        if (result.suggestedSearchQueries.length > 0) {
          const contentResult = await fetchContentMutation.mutateAsync({
            searchQuery: result.suggestedSearchQueries[0],
          });

          if (contentResult.items.length > 0) {
            const contentMsg: ChatMessage = {
              id: genId(),
              role: "assistant",
              bubbleType: "content_card",
              contentCards: contentResult.items as ContentItemData[],
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

      // Update learner model based on quiz performance
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
  }, [dispatch]);

  // ─── Render Message ───────────────────────────────────────────────────────

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      switch (item.bubbleType) {
        case "text":
          return <TextBubble msg={item} />;
        case "baseline_quiz":
          return <QuizBubble msg={item} onAnswer={handleQuizAnswer} />;
        case "content_card":
          return <ContentCardBubble msg={item} />;
        case "mini_ladder":
          return <LadderBubble msg={item} />;
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
    [handleQuizAnswer, handleNudgeResponse]
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
                Ask any real-world question — I'll explain it at your level, check in to make sure it clicks, and find the best content to help you understand.
              </Text>
            </Animated.View>

            <SuggestionChips onSelect={handleAsk} />
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
  suggestionsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: "500" },

  // Recent
  recentWrap: { marginTop: 8 },
  recentTitle: { fontSize: 13, fontWeight: "600", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  recentItem: { paddingVertical: 12, borderBottomWidth: 0.5 },
  recentQuestion: { fontSize: 15, fontWeight: "500" },
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

  // Content Cards
  contentLabel: { fontSize: 12, fontWeight: "600", marginBottom: 8, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  contentCard: { flexDirection: "row", borderRadius: 12, borderWidth: 1, overflow: "hidden", marginBottom: 8 },
  contentThumb: { width: 100, height: 70 },
  contentInfo: { flex: 1, padding: 10, justifyContent: "center" },
  contentTitle: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  contentChannel: { fontSize: 11, marginTop: 4 },

  // Ladder
  ladderCard: { alignSelf: "flex-start", maxWidth: "90%", padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  ladderTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  ladderStep: { flexDirection: "row", marginBottom: 12 },
  ladderDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 12, marginTop: 2 },
  ladderDotText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  ladderStepContent: { flex: 1 },
  ladderStepTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  ladderStepDesc: { fontSize: 12, lineHeight: 17 },
  ladderRealWorld: { fontSize: 11, marginTop: 4, fontStyle: "italic" },

  // Encouragement
  encourageCard: { alignSelf: "flex-start", maxWidth: "85%", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, marginBottom: 8 },
  encourageText: { fontSize: 14, fontWeight: "500", fontStyle: "italic", lineHeight: 20 },

  // Nudge — Subtle check-in cards
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
