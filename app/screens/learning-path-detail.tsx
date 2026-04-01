import { ScrollView, Text, View, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn, SlideInUp } from "react-native-reanimated";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";

interface LessonStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  duration: number; // in minutes
  status: "locked" | "current" | "completed";
  approach?: string;
}

export default function LearningPathDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams();
  const topic = (params.topic as string) || "Learning Topic";

  const [lessons, setLessons] = useState<LessonStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLearningPath();
  }, [topic]);

  const loadLearningPath = async () => {
    try {
      setLoading(true);
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      setLessons(getDefaultSteps(topic));
    } catch (error) {
      console.error("Error loading learning path:", error);
      setLessons(getDefaultSteps(topic));
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSteps = (topic: string): LessonStep[] => [
    {
      id: "1",
      stepNumber: 1,
      title: `What is ${topic}?`,
      description: "Understand the fundamentals and core concepts",
      duration: 15,
      status: "current",
      approach: "socratic",
    },
    {
      id: "2",
      stepNumber: 2,
      title: `Why ${topic} Matters`,
      description: "Explore real-world applications and importance",
      duration: 20,
      status: "locked",
      approach: "problem-based",
    },
    {
      id: "3",
      stepNumber: 3,
      title: "Core Principles",
      description: "Deep dive into fundamental principles",
      duration: 25,
      status: "locked",
      approach: "experiential",
    },
    {
      id: "4",
      stepNumber: 4,
      title: "Practice & Apply",
      description: "Work through practical examples",
      duration: 20,
      status: "locked",
      approach: "problem-based",
    },
    {
      id: "5",
      stepNumber: 5,
      title: "Challenge Yourself",
      description: "Test your understanding with challenges",
      duration: 15,
      status: "locked",
      approach: "gamified",
    },
    {
      id: "6",
      stepNumber: 6,
      title: "Teach Others",
      description: "Explain concepts to solidify learning",
      duration: 10,
      status: "locked",
      approach: "teaching",
    },
    {
      id: "7",
      stepNumber: 7,
      title: "Synthesis & Integration",
      description: "Connect concepts across domains",
      duration: 20,
      status: "locked",
      approach: "synthesis",
    },
    {
      id: "8",
      stepNumber: 8,
      title: "Mastery Assessment",
      description: "Final evaluation of your understanding",
      duration: 15,
      status: "locked",
      approach: "assessment",
    },
  ];

  const handleStartLesson = (lesson: LessonStep) => {
    if (lesson.status === "locked") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to lesson content screen with Gaia as presenter
    router.push({
      pathname: "/screens/lesson-content",
      params: {
        topic,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        approach: lesson.approach,
      },
    });
  };

  const totalDuration = lessons.reduce((sum, l) => sum + l.duration, 0);
  const completedSteps = lessons.filter((l) => l.status === "completed").length;
  const progressPercent = lessons.length > 0 ? (completedSteps / lessons.length) * 100 : 0;

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
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, flex: 1, marginLeft: 8 }}>
            Learning Path
          </Text>
        </Animated.View>

        {/* Gaia Presenter Section */}
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
            <Text style={{ fontSize: 28, marginRight: 12 }}>🌍</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary, marginBottom: 2 }}>
                Gaia's Guide
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 16 }}>
                I'll guide you through {topic} step by step. Let's learn together!
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Topic Title */}
        <Animated.View entering={SlideInUp.duration(400).delay(100)} style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground, marginBottom: 4 }}>
            {topic}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>
            {completedSteps} of {lessons.length} steps completed · ~{totalDuration} min total
          </Text>
        </Animated.View>

        {/* Progress Bar */}
        <Animated.View entering={SlideInUp.duration(400).delay(150)} style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" }}>
            <View
              style={{
                height: "100%",
                width: `${progressPercent}%`,
                backgroundColor: colors.primary,
              }}
            />
          </View>
        </Animated.View>

        {/* Loading State */}
        {loading ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 12, color: colors.muted }}>Generating your learning path...</Text>
          </View>
        ) : (
          /* Lesson Steps */
          <Animated.View entering={SlideInUp.duration(400).delay(200)} style={{ paddingHorizontal: 16, marginBottom: 32 }}>
            <View style={{ gap: 12 }}>
              {lessons.map((lesson, idx) => (
                <Animated.View key={lesson.id} entering={SlideInUp.duration(400).delay(250 + idx * 30)}>
                  <Pressable
                    onPress={() => handleStartLesson(lesson)}
                    disabled={lesson.status === "locked"}
                    style={({ pressed }) => [
                      {
                        backgroundColor: colors.surface,
                        borderRadius: 12,
                        padding: 14,
                        borderWidth: 1.5,
                        borderColor:
                          lesson.status === "completed"
                            ? colors.primary
                            : lesson.status === "current"
                              ? colors.primary
                              : colors.border,
                        opacity: lesson.status === "locked" ? 0.5 : pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      {/* Step Number Circle */}
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor:
                            lesson.status === "completed"
                              ? colors.primary
                              : lesson.status === "current"
                                ? colors.primary + "20"
                                : colors.border,
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 12,
                        }}
                      >
                        {lesson.status === "completed" ? (
                          <MaterialIcons name="check" size={20} color="#FFFFFF" />
                        ) : lesson.status === "locked" ? (
                          <MaterialIcons name="lock" size={20} color={colors.muted} />
                        ) : (
                          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary }}>
                            {lesson.stepNumber}
                          </Text>
                        )}
                      </View>

                      {/* Content */}
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: colors.foreground,
                            marginBottom: 2,
                          }}
                        >
                          {lesson.title}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: colors.muted,
                            lineHeight: 16,
                            marginBottom: 4,
                          }}
                          numberOfLines={1}
                        >
                          {lesson.description}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.muted }}>
                          ⏱ {lesson.duration} min · {lesson.approach}
                        </Text>
                      </View>

                      {/* Arrow */}
                      {lesson.status !== "locked" && (
                        <MaterialIcons name="arrow-forward" size={20} color={colors.primary} />
                      )}
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
