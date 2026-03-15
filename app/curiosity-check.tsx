import { useEffect, useState, useRef } from "react";
import {
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Platform,
  StyleSheet,
  Dimensions,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  withTiming,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useLearning } from "@/lib/learning-store";
import type { CuriosityQuestion, CuriosityCheckResult, SkillLevel } from "@/shared/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function CuriosityCheckScreen() {
  const { slug, name, emoji } = useLocalSearchParams<{ slug: string; name: string; emoji: string }>();
  const router = useRouter();
  const colors = useColors();
  const { dispatch } = useLearning();

  const [questions, setQuestions] = useState<CuriosityQuestion[]>([]);
  const [topicIntro, setTopicIntro] = useState("");
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 = intro screen
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  const progressWidth = useSharedValue(0);
  const shakeX = useSharedValue(0);

  const generateCheck = trpc.curiosityCheck.generate.useMutation();

  // Generate questions on mount
  useEffect(() => {
    generateCheck.mutate(
      { topicSlug: slug || "", topicName: name || "" },
      {
        onSuccess: (data) => {
          setQuestions(data.questions);
          setTopicIntro(data.topicIntro);
          setLoading(false);
        },
        onError: () => {
          setLoading(false);
        },
      }
    );
  }, []);

  // Update progress bar
  useEffect(() => {
    if (questions.length === 0) return;
    const progress = currentIndex >= 0 ? ((currentIndex + (showResult ? 1 : 0)) / questions.length) : 0;
    progressWidth.value = withTiming(progress, { duration: 400 });
  }, [currentIndex, showResult, questions.length]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const handleStart = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentIndex(0);
  };

  const handleSelectOption = (optionIndex: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(optionIndex);

    const q = questions[currentIndex];
    const isCorrect = optionIndex === q.correctIndex;

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }

    setTimeout(() => setShowResult(true), 300);
  };

  const handleNext = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentIndex >= questions.length - 1) {
      // Done — calculate result
      setFinished(true);
      const finalCorrect = correctCount;
      const total = questions.length;
      let determinedLevel: SkillLevel = "beginner";
      let startingStep = 0;

      if (total > 0) {
        const accuracy = finalCorrect / total;
        if (accuracy >= 0.8) {
          determinedLevel = "advanced";
          startingStep = Math.min(Math.floor(total * 0.6), 5);
        } else if (accuracy >= 0.5) {
          determinedLevel = "intermediate";
          startingStep = Math.min(Math.floor(total * 0.3), 3);
        } else {
          determinedLevel = "beginner";
          startingStep = 0;
        }
      }

      const result: CuriosityCheckResult = {
        topicSlug: slug || "",
        questions,
        answeredCorrectly: finalCorrect,
        totalQuestions: total,
        determinedLevel,
        startingStep,
      };

      dispatch({ type: "SAVE_CURIOSITY_RESULT", payload: { topicSlug: slug || "", result } });

      // Navigate to topic with the determined level
      setTimeout(() => {
        router.replace({
          pathname: "/topic/[slug]",
          params: {
            slug: slug || "",
            name: name || "",
            emoji: emoji || "",
            level: determinedLevel,
            startStep: String(startingStep),
          },
        });
      }, 2500);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setShowResult(false);
    }
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  if (loading) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4 text-base">Preparing your curiosity check...</Text>
      </ScreenContainer>
    );
  }

  // ─── Intro Screen ──────────────────────────────────────────────────────────
  if (currentIndex === -1) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1 p-6">
        <View style={styles.centered}>
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={styles.introEmoji}>{emoji || "🧠"}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.introContent}>
            <Text className="text-3xl font-bold text-foreground text-center">
              Curiosity Check
            </Text>
            <Text className="text-lg text-muted text-center mt-3 leading-relaxed">
              {topicIntro || `Let's discover what you already know about ${name}!`}
            </Text>
            <Text className="text-base text-muted text-center mt-4 leading-relaxed">
              This isn't a test — it's a fun way to find your starting point.{"\n"}
              There are no wrong answers, only discoveries!
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.introFooter}>
            <Text className="text-sm text-muted text-center mb-4">
              {questions.length} quick questions
            </Text>
            <Pressable
              onPress={handleStart}
              style={({ pressed }) => [
                styles.startButton,
                { backgroundColor: colors.primary },
                pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
              ]}
            >
              <Text style={styles.startButtonText}>Let's Go!</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                // Skip curiosity check — go straight to topic as beginner
                dispatch({
                  type: "SAVE_CURIOSITY_RESULT",
                  payload: {
                    topicSlug: slug || "",
                    result: {
                      topicSlug: slug || "",
                      questions: [],
                      answeredCorrectly: 0,
                      totalQuestions: 0,
                      determinedLevel: "beginner",
                      startingStep: 0,
                    },
                  },
                });
                router.replace({
                  pathname: "/topic/[slug]",
                  params: { slug: slug || "", name: name || "", emoji: emoji || "", level: "beginner", startStep: "0" },
                });
              }}
              style={({ pressed }) => [
                styles.skipButton,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text className="text-muted text-base">I'm a complete beginner — skip this</Text>
            </Pressable>
          </Animated.View>
        </View>
      </ScreenContainer>
    );
  }

  // ─── Finished Screen ───────────────────────────────────────────────────────
  if (finished) {
    const accuracy = questions.length > 0 ? correctCount / questions.length : 0;
    const levelEmoji = accuracy >= 0.8 ? "🌟" : accuracy >= 0.5 ? "💪" : "🌱";
    const levelText = accuracy >= 0.8 ? "Advanced" : accuracy >= 0.5 ? "Intermediate" : "Beginner";
    const message = accuracy >= 0.8
      ? "Impressive! You already know a lot. We'll start you further along."
      : accuracy >= 0.5
      ? "Nice foundation! We'll build on what you know."
      : "Great starting point! We'll begin from the basics and build up.";

    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1 p-6">
        <View style={styles.centered}>
          <Animated.View entering={FadeIn.duration(500)}>
            <Text style={styles.resultEmoji}>{levelEmoji}</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Text className="text-2xl font-bold text-foreground text-center mt-4">
              {correctCount} out of {questions.length}
            </Text>
            <Text className="text-lg text-primary font-semibold text-center mt-2">
              Starting Level: {levelText}
            </Text>
            <Text className="text-base text-muted text-center mt-3 leading-relaxed px-4">
              {message}
            </Text>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(600).duration(400)}>
            <Text className="text-sm text-muted text-center mt-6">
              Building your learning path...
            </Text>
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 12 }} />
          </Animated.View>
        </View>
      </ScreenContainer>
    );
  }

  // ─── Question Screen ───────────────────────────────────────────────────────
  const q = questions[currentIndex];
  if (!q) return null;

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1">
      {/* Progress Bar */}
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <Animated.View style={[styles.progressFill, { backgroundColor: colors.primary }, progressStyle]} />
      </View>

      {/* Question Counter */}
      <View style={styles.counterRow}>
        <Text className="text-sm text-muted">
          {currentIndex + 1} of {questions.length}
        </Text>
        <Pressable
          onPress={() => {
            // Skip remaining — go as beginner
            dispatch({
              type: "SAVE_CURIOSITY_RESULT",
              payload: {
                topicSlug: slug || "",
                result: {
                  topicSlug: slug || "",
                  questions,
                  answeredCorrectly: correctCount,
                  totalQuestions: questions.length,
                  determinedLevel: "beginner",
                  startingStep: 0,
                },
              },
            });
            router.replace({
              pathname: "/topic/[slug]",
              params: { slug: slug || "", name: name || "", emoji: emoji || "", level: "beginner", startStep: "0" },
            });
          }}
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
        >
          <Text className="text-sm text-muted">Skip</Text>
        </Pressable>
      </View>

      {/* Question */}
      <Animated.View entering={FadeInDown.duration(300)} key={`q-${currentIndex}`} style={styles.questionArea}>
        <Text style={styles.questionEmoji}>{q.emoji || "🤔"}</Text>
        <Text className="text-xl font-bold text-foreground text-center leading-relaxed px-2">
          {q.question}
        </Text>
      </Animated.View>

      {/* Options */}
      <Animated.View style={[styles.optionsArea, shakeStyle]}>
        {q.options.map((option, i) => {
          const isSelected = selectedOption === i;
          const isCorrect = i === q.correctIndex;
          const showCorrectHighlight = showResult && isCorrect;
          const showWrongHighlight = showResult && isSelected && !isCorrect;

          let bgColor = colors.surface;
          let borderColor = colors.border;
          let textColor = colors.foreground;

          if (showCorrectHighlight) {
            bgColor = colors.success + "20";
            borderColor = colors.success;
          } else if (showWrongHighlight) {
            bgColor = colors.error + "20";
            borderColor = colors.error;
          } else if (isSelected && !showResult) {
            bgColor = colors.primary + "15";
            borderColor = colors.primary;
          }

          return (
            <Animated.View key={i} entering={FadeInDown.delay(i * 80).duration(250)}>
              <Pressable
                onPress={() => handleSelectOption(i)}
                style={({ pressed }) => [
                  styles.optionButton,
                  { backgroundColor: bgColor, borderColor },
                  pressed && selectedOption === null && { transform: [{ scale: 0.98 }] },
                ]}
                disabled={selectedOption !== null}
              >
                <View style={[styles.optionLetter, { backgroundColor: borderColor + "30" }]}>
                  <Text style={[styles.optionLetterText, { color: textColor }]}>
                    {String.fromCharCode(65 + i)}
                  </Text>
                </View>
                <Text style={[styles.optionText, { color: textColor }]} numberOfLines={3}>
                  {option}
                </Text>
                {showCorrectHighlight && <Text style={styles.checkmark}>✓</Text>}
                {showWrongHighlight && <Text style={styles.crossmark}>✗</Text>}
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.View>

      {/* Fun Fact (shown after answering) */}
      {showResult && (
        <Animated.View entering={FadeInUp.duration(300)} style={[styles.funFactCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <Text className="text-sm font-semibold text-primary mb-1">
            {selectedOption === q.correctIndex ? "🎉 Correct!" : "💡 Did you know?"}
          </Text>
          <Text className="text-sm text-foreground leading-relaxed">
            {q.funFact}
          </Text>
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.nextButton,
              { backgroundColor: colors.primary },
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex >= questions.length - 1 ? "See Results" : "Next"}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  introEmoji: {
    fontSize: 72,
    textAlign: "center",
  },
  introContent: {
    marginTop: 24,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  introFooter: {
    marginTop: 40,
    alignItems: "center",
    width: "100%",
  },
  startButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  skipButton: {
    marginTop: 16,
    padding: 12,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginHorizontal: 20,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  questionArea: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  questionEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  optionsArea: {
    paddingHorizontal: 20,
    gap: 10,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  optionLetterText: {
    fontSize: 14,
    fontWeight: "700",
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  checkmark: {
    fontSize: 20,
    color: "#22C55E",
    fontWeight: "700",
    marginLeft: 8,
  },
  crossmark: {
    fontSize: 20,
    color: "#EF4444",
    fontWeight: "700",
    marginLeft: 8,
  },
  funFactCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  nextButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resultEmoji: {
    fontSize: 80,
    textAlign: "center",
  },
});
