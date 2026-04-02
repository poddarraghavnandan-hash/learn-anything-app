import { ScrollView, Text, View, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { LoadingQuote } from "@/components/loading-quote";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn, SlideInUp } from "react-native-reanimated";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { useLessonSession } from "@/app/hooks/use-lesson-session";
import { useClaudeLessonContent } from "@/app/hooks/use-claude-lesson";

interface LessonContent {
  title: string;
  introduction: string;
  mainContent: string;
  keyPoints: string[];
  examples: string[];
  checkYourUnderstanding: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  };
  nextSteps: string;
}

export default function LessonContentScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const topic = (params.topic as string) || "Learning Topic";
  const lessonTitle = (params.lessonTitle as string) || "Lesson";
  const approach = (params.approach as string) || "mixed";
  const lessonId = (params.lessonId as string) || "1";

  const [content, setContent] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [engagementScore, setEngagementScore] = useState(0);
  const [startTime] = useState(Date.now());
  const [userId] = useState("user-123"); // In real app, get from auth context
  const { recordQuizAnswer, recordConfidence, recordInteraction } = useLessonSession({
    userId,
    lessonId,
    topic,
    approach,
  });

  // Fetch Claude-generated content
  const { content: claudeContent, loading: claudeLoading, error: claudeError, isUsingFallback } = useClaudeLessonContent({
    topic,
    lessonTitle,
    approach,
    learningStyle: "visual",
    difficulty: "beginner",
    engagementScore,
  });

  useEffect(() => {
    // Use Claude-generated content if available
    if (claudeContent) {
      setContent(claudeContent);
      setLoading(false);
    } else if (claudeLoading) {
      setLoading(true);
    }
  }, [claudeContent, claudeLoading]);

  // Claude hook now handles content generation

  const handleAnswerSelect = async (optionIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAnswer(optionIndex);
    setShowFeedback(true);
    
    // Track engagement
    const isCorrect = optionIndex === content?.checkYourUnderstanding.correctAnswer;
    const timeSpent = Math.round((Date.now() - startTime) / 1000); // seconds
    const score = isCorrect ? 100 : 50;
    setEngagementScore(score);

    // Record behavior signal
    await recordQuizAnswer(
      0,
      optionIndex,
      content?.checkYourUnderstanding.correctAnswer || 0,
      timeSpent
    );
  };

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Record final confidence
    await recordConfidence(engagementScore);
    
    // Get current lesson number from lessonId
    const currentLessonNum = parseInt(lessonId) || 1;
    const nextLessonNum = currentLessonNum + 1;
    
    // Check if there are more lessons (assume max 8 lessons per path)
    if (nextLessonNum <= 8) {
      // Navigate to next lesson
      router.push({
        pathname: "/screens/lesson-content",
        params: {
          topic,
          lessonId: nextLessonNum.toString(),
          lessonTitle: `Lesson ${nextLessonNum}`,
          approach,
        },
      });
    } else {
      // All lessons completed - navigate back to learning path
      router.back();
    }
  };

  const handleAskGaia = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Record that user is asking for help
    await recordInteraction("ask-gaia");
    // Navigate to Gaia chat with lesson context
    router.push({
      pathname: "/(tabs)/ask",
      params: {
        topic,
        lessonTitle,
        lessonId,
        approach,
      },
    });
  };

  if (loading) {
    return (
      <ScreenContainer className="p-4">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <LoadingQuote
            message="Gaia is preparing your lesson..."
            rotateQuotes={true}
            rotationInterval={6000}
          />
        </View>
      </ScreenContainer>
    );
  }

  if (!content) {
    return (
      <ScreenContainer className="p-4">
        <Text style={{ color: colors.foreground }}>Failed to load lesson content</Text>
      </ScreenContainer>
    );
  }

  const isAnswerCorrect = selectedAnswer === content.checkYourUnderstanding.correctAnswer;

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <Animated.View
          entering={FadeIn.duration(300)}
          style={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, flex: 1, marginLeft: 8 }}>
            {topic}
          </Text>
        </Animated.View>

        {/* Gaia Presenter Card */}
        <Animated.View entering={SlideInUp.duration(400).delay(50)} style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <View
            style={{
              backgroundColor: colors.primary + "15",
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.primary + "30",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 32, marginRight: 12 }}>🌍</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary, marginBottom: 2 }}>
                Gaia's Lesson
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 16 }}>
                Your AI learning companion is here to guide you through this lesson.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Lesson Title */}
        <Animated.View entering={SlideInUp.duration(400).delay(100)} style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground, marginBottom: 8 }}>
            {content.title}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 18 }}>
            {content.introduction}
          </Text>
        </Animated.View>

        {/* Main Content */}
        <Animated.View entering={SlideInUp.duration(400).delay(150)} style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
              📚 Main Concept
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 20 }}>
              {content.mainContent}
            </Text>
          </View>
        </Animated.View>

        {/* Key Points */}
        <Animated.View entering={SlideInUp.duration(400).delay(200)} style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
            🎯 Key Points
          </Text>
          <View style={{ gap: 8 }}>
            {content.keyPoints.map((point, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  backgroundColor: colors.surface,
                  borderRadius: 10,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 18, marginRight: 8 }}>•</Text>
                <Text style={{ fontSize: 12, color: colors.muted, flex: 1, lineHeight: 16 }}>
                  {point}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Examples */}
        <Animated.View entering={SlideInUp.duration(400).delay(250)} style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
            💡 Real-World Examples
          </Text>
          <View style={{ gap: 8 }}>
            {content.examples.map((example, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: colors.primary + "10",
                  borderRadius: 10,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.primary + "30",
                }}
              >
                <Text style={{ fontSize: 12, color: colors.foreground, lineHeight: 16 }}>
                  {example}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Check Your Understanding */}
        <Animated.View entering={SlideInUp.duration(400).delay(300)} style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
            ✅ Check Your Understanding
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground, marginBottom: 14 }}>
              {content.checkYourUnderstanding.question}
            </Text>

            <View style={{ gap: 8, marginBottom: 16 }}>
              {content.checkYourUnderstanding.options.map((option, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleAnswerSelect(idx)}
                  disabled={showFeedback}
                  style={({ pressed }) => [
                    {
                      borderRadius: 10,
                      padding: 12,
                      borderWidth: 2,
                      borderColor:
                        selectedAnswer === idx
                          ? isAnswerCorrect
                            ? colors.primary
                            : "#EF4444"
                          : colors.border,
                      backgroundColor:
                        selectedAnswer === idx
                          ? isAnswerCorrect
                            ? colors.primary + "15"
                            : "#EF444415"
                          : colors.surface,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 12, color: colors.foreground }}>
                    {String.fromCharCode(65 + idx)}) {option}
                  </Text>
                </Pressable>
              ))}
            </View>

            {showFeedback && (
              <Animated.View entering={FadeIn.duration(300)}>
                <View
                  style={{
                    backgroundColor: isAnswerCorrect ? colors.primary + "15" : "#EF444415",
                    borderRadius: 10,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: isAnswerCorrect ? colors.primary : "#EF4444",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: isAnswerCorrect ? colors.primary : "#EF4444",
                      marginBottom: 6,
                    }}
                  >
                    {isAnswerCorrect ? "🎉 Correct!" : "💭 Not quite right"}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 16 }}>
                    {content.checkYourUnderstanding.explanation}
                  </Text>
                </View>
              </Animated.View>
            )}
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={SlideInUp.duration(400).delay(350)} style={{ paddingHorizontal: 16, marginBottom: 32 }}>
          <View style={{ gap: 12 }}>
            {/* Ask Gaia Button */}
            <Pressable
              onPress={handleAskGaia}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF", textAlign: "center" }}>
                💬 Ask Gaia a Question
              </Text>
            </Pressable>

            {/* Continue Button */}
            <Pressable
              onPress={handleContinue}
              disabled={!showFeedback}
              style={({ pressed }) => [
                {
                  backgroundColor: showFeedback ? colors.primary + "20" : colors.border,
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: showFeedback ? colors.primary : colors.muted,
                  textAlign: "center",
                }}
              >
                → Continue to Next Step
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}
