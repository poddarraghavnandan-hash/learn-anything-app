import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLearning } from "@/lib/learning-store";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from "react-native-reanimated";

const BURST_DURATION = 60; // seconds

type BurstPhase = "ready" | "concept" | "question" | "result";

interface QuickConcept {
  concept: string;
  explanation: string;
  funFact: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export default function QuickBurstScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state, dispatch } = useLearning();
  const { profile } = state;

  const [phase, setPhase] = useState<BurstPhase>("ready");
  const [timeLeft, setTimeLeft] = useState(BURST_DURATION);
  const [concepts, setConcepts] = useState<QuickConcept[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Progress bar animation
  const progress = useSharedValue(1);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  // Pick a random topic from user's interests
  const topic = useMemo(() => {
    if (profile.interests.length === 0) return "general-knowledge";
    return profile.interests[Math.floor(Math.random() * profile.interests.length)];
  }, []);

  const topicName = topic.replace(/-/g, " ");

  // Generate burst content via LLM
  const burstMutation = trpc.chat.ask.useMutation();

  const generateBurst = useCallback(async () => {
    try {
      const result = await burstMutation.mutateAsync({
        question: `Generate exactly 3 quick-burst learning concepts about "${topicName}" for a ${profile.skillLevel} learner${profile.age ? ` who is ${profile.age} years old` : ""}. For each concept, provide:
1. A concept name (2-4 words)
2. A clear, concise explanation (2-3 sentences max)
3. A surprising fun fact (1 sentence)
4. A multiple choice question with 4 options
5. The index of the correct option (0-3)

Format as JSON array: [{"concept":"...","explanation":"...","funFact":"...","question":"...","options":["a","b","c","d"],"correctIndex":0}]
Return ONLY the JSON array, no other text.`,
        learnerModel: {
          preferredPace: "moderate",
          preferredTone: "casual",
          preferredDepth: "detailed",
          conceptConfidence: {},
          confusionPoints: [],
          strengthAreas: [],
          realWorldConnections: [],
          learningStyle: "mixed",
          explainSimplerCount: 0,
          questionsAsked: 0,
        },
      });

      // Parse the LLM response
      const text = (result as any).messages?.[0]?.content || (result as any).response || "";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as QuickConcept[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConcepts(parsed.slice(0, 3));
          return;
        }
      }
      // Fallback
      setConcepts([{
        concept: topicName,
        explanation: "Quick burst content is being prepared. Try again in a moment!",
        funFact: "Learning in short bursts improves retention by up to 20%.",
        question: "What is the benefit of micro-learning?",
        options: ["Better retention", "Longer sessions", "More homework", "Less engagement"],
        correctIndex: 0,
      }]);
    } catch {
      setConcepts([{
        concept: topicName,
        explanation: "Quick burst content is being prepared. Try again in a moment!",
        funFact: "Learning in short bursts improves retention by up to 20%.",
        question: "What is the benefit of micro-learning?",
        options: ["Better retention", "Longer sessions", "More homework", "Less engagement"],
        correctIndex: 0,
      }]);
    }
  }, [topic, topicName, profile.skillLevel, profile.age, profile.interests]);

  // Start the burst
  const startBurst = useCallback(async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase("concept");
    setTimeLeft(BURST_DURATION);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setTotalAnswered(0);
    progress.value = withTiming(0, { duration: BURST_DURATION * 1000, easing: Easing.linear });

    // Start timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setPhase("result");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    if (concepts.length === 0) {
      await generateBurst();
    }
  }, [concepts, generateBurst]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Generate on mount
  useEffect(() => {
    generateBurst();
  }, []);

  const currentConcept = concepts[currentIndex];

  const handleAnswer = useCallback((index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    const isCorrect = index === currentConcept?.correctIndex;
    if (isCorrect) {
      setScore((s) => s + 1);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setTotalAnswered((t) => t + 1);

    // Move to next concept after delay
    setTimeout(() => {
      setSelectedAnswer(null);
      if (currentIndex < concepts.length - 1) {
        setCurrentIndex((i) => i + 1);
        setPhase("concept");
      } else {
        // All concepts done
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase("result");
      }
    }, 1200);
  }, [selectedAnswer, currentConcept, currentIndex, concepts.length]);

  const handleNextPhase = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhase("question");
  }, []);

  const handleFinish = useCallback(() => {
    // Award XP
    const xp = score * 15 + totalAnswered * 5;
    if (xp > 0) {
      dispatch({ type: "ADD_XP", payload: xp });
      dispatch({ type: "UPDATE_STREAK" });
      dispatch({ type: "ADD_XP", payload: 1 }); // extra XP for completing
    }
    router.back();
  }, [score, totalAnswered, dispatch, router]);

  // ─── Ready State ────────────────────────────────────────────────────────────

  if (phase === "ready") {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1 p-6">
        <View style={styles.centered}>
          <Animated.View entering={FadeInDown.duration(400)} style={styles.readyContent}>
            <Text style={styles.burstEmoji}>{"\u26A1"}</Text>
            <Text style={[styles.readyTitle, { color: colors.foreground }]}>Quick Burst</Text>
            <Text style={[styles.readySubtitle, { color: colors.muted }]}>
              60 seconds. One concept. One question.{"\n"}Learn something new right now.
            </Text>

            <View style={[styles.topicPill, { backgroundColor: colors.primary + "15" }]}>
              <Text style={[styles.topicPillText, { color: colors.primary }]}>
                {topicName}
              </Text>
            </View>

            {burstMutation.isPending ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
            ) : (
              <Pressable
                onPress={startBurst}
                style={({ pressed }) => [
                  styles.startBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={styles.startBtnText}>Start Burst</Text>
              </Pressable>
            )}
          </Animated.View>

          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, paddingVertical: 16 }]}
          >
            <Text style={[styles.backText, { color: colors.muted }]}>Maybe later</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  // ─── Result State ───────────────────────────────────────────────────────────

  if (phase === "result") {
    const xpEarned = score * 15 + totalAnswered * 5;
    const accuracy = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;

    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1 p-6">
        <View style={styles.centered}>
          <Animated.View entering={FadeInDown.duration(400)} style={styles.resultContent}>
            <Text style={styles.burstEmoji}>{score === totalAnswered ? "\u{1F389}" : "\u{1F4AA}"}</Text>
            <Text style={[styles.resultTitle, { color: colors.foreground }]}>
              {score === totalAnswered ? "Perfect!" : "Nice work!"}
            </Text>
            <Text style={[styles.resultSubtitle, { color: colors.muted }]}>
              {totalAnswered > 0
                ? `${score}/${totalAnswered} correct (${accuracy}%)`
                : "Burst complete!"}
            </Text>

            <View style={styles.resultStats}>
              <View style={[styles.resultStat, { backgroundColor: colors.primary + "12" }]}>
                <Text style={[styles.resultStatValue, { color: colors.primary }]}>+{xpEarned}</Text>
                <Text style={[styles.resultStatLabel, { color: colors.muted }]}>XP earned</Text>
              </View>
              <View style={[styles.resultStat, { backgroundColor: colors.success + "12" }]}>
                <Text style={[styles.resultStatValue, { color: colors.success }]}>{concepts.length}</Text>
                <Text style={[styles.resultStatLabel, { color: colors.muted }]}>concepts</Text>
              </View>
            </View>

            <Pressable
              onPress={handleFinish}
              style={({ pressed }) => [
                styles.startBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.startBtnText}>Done</Text>
            </Pressable>
          </Animated.View>
        </View>
      </ScreenContainer>
    );
  }

  // ─── Learning Phase (concept + question) ────────────────────────────────────

  if (!currentConcept) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1 p-6">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Preparing your burst...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1">
      {/* Timer bar */}
      <View style={[styles.timerBar, { backgroundColor: colors.border + "40" }]}>
        <Animated.View style={[styles.timerFill, { backgroundColor: timeLeft <= 10 ? colors.error : colors.primary }, progressStyle]} />
      </View>

      <View style={styles.timerRow}>
        <Text style={[styles.timerText, { color: timeLeft <= 10 ? colors.error : colors.muted }]}>
          {timeLeft}s
        </Text>
        <Text style={[styles.conceptCounter, { color: colors.muted }]}>
          {currentIndex + 1} / {concepts.length}
        </Text>
      </View>

      <View style={styles.mainContent}>
        {phase === "concept" ? (
          <Animated.View entering={FadeIn.duration(300)} style={styles.conceptSection}>
            <Text style={[styles.conceptTitle, { color: colors.primary }]}>
              {currentConcept.concept}
            </Text>
            <Text style={[styles.conceptExplanation, { color: colors.foreground }]}>
              {currentConcept.explanation}
            </Text>
            <View style={[styles.funFactCard, { backgroundColor: colors.warning + "10", borderColor: colors.warning + "30" }]}>
              <Text style={[styles.funFactLabel, { color: colors.warning }]}>Fun fact</Text>
              <Text style={[styles.funFactText, { color: colors.foreground }]}>
                {currentConcept.funFact}
              </Text>
            </View>

            <Pressable
              onPress={handleNextPhase}
              style={({ pressed }) => [
                styles.nextBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.nextBtnText}>Test yourself</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(300)} style={styles.questionSection}>
            <Text style={[styles.questionText, { color: colors.foreground }]}>
              {currentConcept.question}
            </Text>
            <View style={styles.optionsContainer}>
              {currentConcept.options.map((opt, i) => {
                const isSelected = selectedAnswer === i;
                const isCorrect = i === currentConcept.correctIndex;
                const showResult = selectedAnswer !== null;

                let bgColor = "transparent";
                let borderCol = colors.border;
                if (showResult && isCorrect) {
                  bgColor = colors.success + "15";
                  borderCol = colors.success;
                } else if (showResult && isSelected && !isCorrect) {
                  bgColor = colors.error + "15";
                  borderCol = colors.error;
                } else if (isSelected) {
                  bgColor = colors.primary + "10";
                  borderCol = colors.primary;
                }

                return (
                  <Pressable
                    key={i}
                    onPress={() => handleAnswer(i)}
                    disabled={selectedAnswer !== null}
                    style={({ pressed }) => [
                      styles.optionBtn,
                      { backgroundColor: bgColor, borderColor: borderCol, opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <Text style={[styles.optionLetter, { color: showResult && isCorrect ? colors.success : colors.muted }]}>
                      {String.fromCharCode(65 + i)}
                    </Text>
                    <Text style={[styles.optionText, { color: colors.foreground }]}>{opt}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  readyContent: { alignItems: "center", paddingHorizontal: 24 },
  burstEmoji: { fontSize: 64, marginBottom: 16 },
  readyTitle: { fontSize: 28, fontWeight: "800", marginBottom: 8 },
  readySubtitle: { fontSize: 16, textAlign: "center", lineHeight: 24, marginBottom: 24 },
  topicPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginBottom: 32 },
  topicPillText: { fontSize: 15, fontWeight: "700", textTransform: "capitalize" },
  startBtn: { width: "100%", maxWidth: 280, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  startBtnText: { color: "#FFF", fontSize: 17, fontWeight: "800" },
  backText: { fontSize: 15, fontWeight: "600" },
  timerBar: { height: 4, width: "100%", overflow: "hidden" },
  timerFill: { height: "100%", borderRadius: 2 },
  timerRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 8 },
  timerText: { fontSize: 15, fontWeight: "700", fontVariant: ["tabular-nums"] },
  conceptCounter: { fontSize: 13, fontWeight: "600" },
  mainContent: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  conceptSection: { flex: 1, gap: 16 },
  conceptTitle: { fontSize: 24, fontWeight: "800" },
  conceptExplanation: { fontSize: 17, lineHeight: 26 },
  funFactCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
  funFactLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  funFactText: { fontSize: 15, lineHeight: 22 },
  nextBtn: { paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: "auto", marginBottom: 24 },
  nextBtnText: { color: "#FFF", fontSize: 17, fontWeight: "800" },
  questionSection: { flex: 1, gap: 20 },
  questionText: { fontSize: 20, fontWeight: "700", lineHeight: 28 },
  optionsContainer: { gap: 10 },
  optionBtn: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 14, borderWidth: 1.5, gap: 12 },
  optionLetter: { fontSize: 14, fontWeight: "700", width: 24, textAlign: "center" },
  optionText: { fontSize: 16, flex: 1, lineHeight: 22 },
  resultContent: { alignItems: "center", paddingHorizontal: 24 },
  resultTitle: { fontSize: 28, fontWeight: "800", marginBottom: 8 },
  resultSubtitle: { fontSize: 16, textAlign: "center", marginBottom: 24 },
  resultStats: { flexDirection: "row", gap: 16, marginBottom: 32 },
  resultStat: { flex: 1, padding: 16, borderRadius: 14, alignItems: "center" },
  resultStatValue: { fontSize: 24, fontWeight: "800" },
  resultStatLabel: { fontSize: 12, marginTop: 4 },
  loadingText: { fontSize: 15, marginTop: 12 },
});
