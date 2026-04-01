import { ScrollView, Text, View, Pressable, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn, SlideInUp } from "react-native-reanimated";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";

interface BaselineQuestion {
  id: string;
  question: string;
  type: "yes_no" | "multiple_choice" | "scale";
  options?: string[];
  scale?: { min: number; max: number; minLabel: string; maxLabel: string };
}

/**
 * Baseline Evaluation Screen
 * 
 * Fun, adaptive assessment that evaluates:
 * - Prior knowledge about the topic
 * - Preferred learning style
 * - Confidence level
 * - Motivation and goals
 * 
 * Results are used to personalize the learning path
 */
export default function BaselineEvaluationScreen() {
  const colors = useColors();
  const router = useRouter();
  const { topic = "Physics Fundamentals" } = useLocalSearchParams<{ topic: string }>();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<BaselineQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, any>>(new Map());
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      // Simulate API call to fetch baseline questions
      await new Promise((resolve) => setTimeout(resolve, 400));

      const mockQuestions: BaselineQuestion[] = [
        {
          id: "q1",
          question: `Have you heard of "${topic}" before?`,
          type: "yes_no",
        },
        {
          id: "q2",
          question: `How would you describe your familiarity with ${topic}?`,
          type: "multiple_choice",
          options: [
            "Never heard of it",
            "Heard the name, but not sure what it is",
            "Have a basic idea",
            "Know quite a bit about it",
            "Consider myself knowledgeable",
          ],
        },
        {
          id: "q3",
          question: "How do you prefer to learn new things?",
          type: "multiple_choice",
          options: [
            "Watching videos or visual demonstrations",
            "Hands-on practice and experimentation",
            "Listening to explanations and discussions",
            "Reading articles and detailed explanations",
          ],
        },
        {
          id: "q4",
          question: `How confident are you in your ability to learn ${topic}?`,
          type: "scale",
          scale: { min: 1, max: 5, minLabel: "Not confident", maxLabel: "Very confident" },
        },
        {
          id: "q5",
          question: "What's your main goal for learning this topic?",
          type: "multiple_choice",
          options: [
            "Personal interest and curiosity",
            "Career advancement or job requirement",
            "Academic requirement",
            "Solving a specific problem",
            "Just exploring",
          ],
        },
      ];

      setQuestions(mockQuestions);
    } catch (error) {
      console.error("Error loading baseline questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newResponses = new Map(responses);
    newResponses.set(questions[currentIndex].id, answer);
    setResponses(newResponses);

    // Move to next question or complete
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      completeAssessment();
    }
  };

  const completeAssessment = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCompleted(true);

    // In real app, send responses to backend and get profile
    setTimeout(() => {
      router.push({
        pathname: "/screens/baseline-results",
        params: { topic },
      });
    }, 1500);
  };

  if (loading) {
    return (
      <ScreenContainer className="p-4">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.muted }}>Preparing your assessment...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (completed) {
    return (
      <ScreenContainer className="p-4">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Animated.View entering={FadeIn.duration(500)}>
            <MaterialIcons name="check-circle" size={80} color={colors.success} />
            <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground, marginTop: 16, textAlign: "center" }}>
              Assessment Complete!
            </Text>
            <Text style={{ fontSize: 16, color: colors.muted, marginTop: 8, textAlign: "center" }}>
              Analyzing your responses...
            </Text>
          </Animated.View>
        </View>
      </ScreenContainer>
    );
  }

  const current = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground }}>
            Let's Get to Know You
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 8 }}>
            A few quick questions to personalize your learning experience
          </Text>
        </Animated.View>

        {/* Progress Bar */}
        <Animated.View entering={SlideInUp.duration(400).delay(50)} style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground }}>
              Question {currentIndex + 1} of {questions.length}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>
              {Math.round(progress)}%
            </Text>
          </View>
          <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" }}>
            <View
              style={{
                height: "100%",
                width: `${progress}%`,
                backgroundColor: colors.primary,
              }}
            />
          </View>
        </Animated.View>

        {/* Question Card */}
        <Animated.View
          entering={SlideInUp.duration(400).delay(100)}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 24,
            marginVertical: 24,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, lineHeight: 28 }}>
            {current.question}
          </Text>
        </Animated.View>

        {/* Answer Options */}
        <Animated.View entering={SlideInUp.duration(400).delay(150)} style={{ gap: 12, marginBottom: 24 }}>
          {current.type === "yes_no" && (
            <>
              <Pressable
                onPress={() => handleAnswer("yes")}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.primary,
                    borderRadius: 12,
                    paddingVertical: 16,
                    alignItems: "center",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={{ color: colors.background, fontSize: 16, fontWeight: "600" }}>
                  Yes
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleAnswer("no")}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.border,
                    borderRadius: 12,
                    paddingVertical: 16,
                    alignItems: "center",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600" }}>
                  No
                </Text>
              </Pressable>
            </>
          )}

          {current.type === "multiple_choice" &&
            current.options?.map((option, index) => (
              <Pressable
                key={index}
                onPress={() => handleAnswer(option)}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.surface,
                    borderWidth: 2,
                    borderColor: colors.border,
                    borderRadius: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "500" }}>
                  {option}
                </Text>
              </Pressable>
            ))}

          {current.type === "scale" && current.scale && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
              {Array.from({ length: current.scale.max - current.scale.min + 1 }).map((_, i) => {
                const value = current.scale!.min + i;
                return (
                  <Pressable
                    key={value}
                    onPress={() => handleAnswer(value)}
                    style={({ pressed }) => [
                      {
                        flex: 1,
                        backgroundColor: colors.surface,
                        borderWidth: 2,
                        borderColor: colors.border,
                        borderRadius: 10,
                        paddingVertical: 12,
                        alignItems: "center",
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600" }}>
                      {value}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Animated.View>

        {/* Scale Labels */}
        {current.type === "scale" && current.scale && (
          <Animated.View entering={SlideInUp.duration(400).delay(200)} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 24 }}>
            <Text style={{ fontSize: 12, color: colors.muted }}>
              {current.scale.minLabel}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>
              {current.scale.maxLabel}
            </Text>
          </Animated.View>
        )}

        {/* Info */}
        <View style={{ backgroundColor: colors.primary + "10", borderRadius: 12, padding: 12, marginBottom: 24 }}>
          <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 20 }}>
            💡 Your answers help us personalize your learning path. There are no right or wrong answers!
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
