import { ScrollView, View, Text, Pressable, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface AdaptiveLesson {
  title: string;
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  sections: LessonSection[];
  estimatedMinutes: number;
  misconceptionsAddressed: string[];
}

interface LessonSection {
  type: "text" | "concept-check" | "assessment" | "example" | "video-summary";
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

export default function AdaptiveContentScreen() {
  const colors = useColors();
  const [lesson, setLesson] = useState<AdaptiveLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [masteryScore, setMasteryScore] = useState(0);

  // Mock learner profile - in real app, would come from context/auth
  const learnerProfile = {
    learnerId: "learner-123",
    topic: "Newton's Second Law",
    learningStyle: "visual" as const,
    currentDifficulty: "intermediate" as const,
    learningPace: "moderate" as const,
    engagementScore: 75,
    motivationLevel: "high" as const,
  };

  useEffect(() => {
    loadAdaptiveContent();
  }, []);

  const loadAdaptiveContent = async () => {
    setLoading(true);
    try {
      // Mock lesson data - in real app would call tRPC endpoint
      const mockLesson: AdaptiveLesson = {
        title: "Newton's Second Law: F = ma",
        topic: "Physics - Classical Mechanics",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        misconceptionsAddressed: [
          "Force and velocity are the same thing",
          "Heavier objects always fall faster",
          "Acceleration requires constant force",
        ],
        sections: [
          {
            type: "text",
            title: "Intuition: Why Things Move",
            content:
              "Imagine pushing a shopping cart. The harder you push, the faster it accelerates. But if the cart is full of groceries, the same push produces less acceleration. This is Newton's Second Law in action.\n\nF = ma tells us that acceleration depends on two things: the force applied and the mass of the object.",
          },
          {
            type: "concept-check",
            title: "Quick Check: Understanding Force",
            content: "If you push a 2kg object with 10N of force, what is its acceleration?",
            metadata: {
              options: ["2 m/s²", "5 m/s²", "10 m/s²", "20 m/s²"],
              correctAnswer: "5 m/s²",
              explanation: "F = ma, so a = F/m = 10/2 = 5 m/s²",
            },
          },
          {
            type: "text",
            title: "The Mathematical Formulation",
            content:
              "Newton's Second Law states: F = ma\n\nWhere:\n- F is the net force in Newtons (N)\n- m is the mass in kilograms (kg)\n- a is the acceleration in meters per second squared (m/s²)\n\nThis equation shows a direct relationship: force is proportional to both mass and acceleration.",
          },
          {
            type: "example",
            title: "Real-World Example: Rocket Launch",
            content:
              "A rocket with mass 1000 kg needs to accelerate upward at 20 m/s². What force must the engines provide (ignoring gravity)?\n\nUsing F = ma:\nF = 1000 kg × 20 m/s² = 20,000 N\n\nThe rocket engines must produce 20,000 Newtons of thrust.",
          },
          {
            type: "assessment",
            title: "Mastery Check",
            content: "A car with mass 1500 kg accelerates from 0 to 100 km/h in 10 seconds. What is the average force applied?",
            metadata: {
              options: ["150 N", "1500 N", "4167 N", "15000 N"],
              correctAnswer: "4167 N",
              explanation: "First convert 100 km/h = 27.8 m/s. Acceleration = 27.8/10 = 2.78 m/s². Force = 1500 × 2.78 ≈ 4167 N",
            },
          },
        ],
      };

      setLesson(mockLesson);
    } catch (error) {
      console.error("Failed to load adaptive content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextSection = () => {
    if (lesson && currentSectionIndex < lesson.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };

  const handlePreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  const handleAnswer = (sectionIndex: number, answer: string) => {
    setUserAnswers({
      ...userAnswers,
      [`section-${sectionIndex}`]: answer,
    });

    // Calculate mastery based on correct answers
    if (lesson) {
      const section = lesson.sections[sectionIndex];
      if (section.type === "assessment" && section.metadata?.correctAnswer === answer) {
        setMasteryScore(Math.min(100, masteryScore + 20));
      }
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="flex items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-muted">Generating personalized lesson...</Text>
      </ScreenContainer>
    );
  }

  if (!lesson) {
    return (
      <ScreenContainer className="flex items-center justify-center">
        <Text className="text-foreground text-lg font-semibold">Failed to load lesson</Text>
        <Pressable
          onPress={loadAdaptiveContent}
          className="mt-4 bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-background font-semibold">Try Again</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  const currentSection = lesson.sections[currentSectionIndex];
  const progress = ((currentSectionIndex + 1) / lesson.sections.length) * 100;

  return (
    <ScreenContainer className="bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="px-4 py-4 border-b border-border">
          <Text className="text-xs text-muted uppercase font-semibold">{lesson.topic}</Text>
          <Text className="text-2xl text-foreground font-bold mt-2">{lesson.title}</Text>
          <View className="flex-row items-center justify-between mt-3">
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="schedule" size={16} color={colors.muted} />
              <Text className="text-sm text-muted">{lesson.estimatedMinutes} min</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="w-24 h-2 bg-border rounded-full overflow-hidden">
                <View
                  className="h-full bg-primary"
                  style={{ width: `${progress}%` }}
                />
              </View>
              <Text className="text-xs text-muted">{currentSectionIndex + 1}/{lesson.sections.length}</Text>
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View className="px-4 py-6 flex-1">
          {/* Section Type Badge */}
          <View className="flex-row items-center gap-2 mb-4">
            {currentSection.type === "text" && (
              <>
                <MaterialIcons name="description" size={20} color={colors.primary} />
                <Text className="text-sm font-semibold text-primary">Lesson</Text>
              </>
            )}
            {currentSection.type === "concept-check" && (
              <>
                <MaterialIcons name="lightbulb" size={20} color={colors.warning} />
                <Text className="text-sm font-semibold text-warning">Concept Check</Text>
              </>
            )}
            {currentSection.type === "assessment" && (
              <>
                <MaterialIcons name="quiz" size={20} color={colors.primary} />
                <Text className="text-sm font-semibold text-primary">Assessment</Text>
              </>
            )}
            {currentSection.type === "example" && (
              <>
                <MaterialIcons name="lightbulb-outline" size={20} color={colors.success} />
                <Text className="text-sm font-semibold text-success">Example</Text>
              </>
            )}
          </View>

          {/* Section Title */}
          <Text className="text-xl text-foreground font-bold mb-4">{currentSection.title}</Text>

          {/* Section Content */}
          <Text className="text-base text-foreground leading-relaxed mb-6">{currentSection.content}</Text>

          {/* Multiple Choice Options (for assessments and concept checks) */}
          {(currentSection.type === "assessment" || currentSection.type === "concept-check") &&
            currentSection.metadata?.options && (
              <View className="gap-3 mb-6">
                {currentSection.metadata.options.map((option: string, idx: number) => {
                  const isSelected =
                    userAnswers[`section-${currentSectionIndex}`] === option;
                  const isCorrect = option === currentSection.metadata?.correctAnswer;
                  const showCorrect = userAnswers[`section-${currentSectionIndex}`] !== undefined;

                  return (
                    <Pressable
                      key={idx}
                      onPress={() => handleAnswer(currentSectionIndex, option)}
                      className={`p-4 rounded-lg border-2 ${
                        isSelected
                          ? isCorrect
                            ? "border-success bg-success/10"
                            : "border-error bg-error/10"
                          : showCorrect && isCorrect
                          ? "border-success bg-success/10"
                          : "border-border bg-surface"
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className={`flex-1 text-base ${isSelected ? "font-semibold" : ""} ${
                          isSelected && !isCorrect ? "text-error" : "text-foreground"
                        }`}>
                          {option}
                        </Text>
                        {showCorrect && isCorrect && (
                          <MaterialIcons name="check-circle" size={24} color={colors.success} />
                        )}
                        {isSelected && !isCorrect && showCorrect && (
                          <MaterialIcons name="cancel" size={24} color={colors.error} />
                        )}
                      </View>
                    </Pressable>
                  );
                })}

                {/* Explanation */}
                {userAnswers[`section-${currentSectionIndex}`] && currentSection.metadata?.explanation && (
                  <View className="mt-4 p-4 bg-surface rounded-lg border border-border">
                    <Text className="text-sm font-semibold text-foreground mb-2">Explanation:</Text>
                    <Text className="text-sm text-muted">{currentSection.metadata.explanation}</Text>
                  </View>
                )}
              </View>
            )}

          {/* Mastery Score */}
          {masteryScore > 0 && (
            <View className="p-4 bg-success/10 rounded-lg border border-success mb-6">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-sm text-muted">Mastery Progress</Text>
                  <Text className="text-2xl font-bold text-success">{masteryScore}%</Text>
                </View>
                <MaterialIcons name="trending-up" size={32} color={colors.success} />
              </View>
            </View>
          )}
        </View>

        {/* Navigation Buttons */}
        <View className="px-4 py-4 border-t border-border flex-row gap-3">
          <Pressable
            onPress={handlePreviousSection}
            disabled={currentSectionIndex === 0}
            className={`flex-1 py-3 px-4 rounded-lg border border-border ${
              currentSectionIndex === 0 ? "opacity-50" : ""
            }`}
          >
            <View className="flex-row items-center justify-center gap-2">
              <MaterialIcons
                name="arrow-back"
                size={20}
                color={currentSectionIndex === 0 ? colors.muted : colors.foreground}
              />
              <Text className={`font-semibold ${
                currentSectionIndex === 0 ? "text-muted" : "text-foreground"
              }`}>
                Previous
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={handleNextSection}
            disabled={currentSectionIndex === lesson.sections.length - 1}
            className={`flex-1 py-3 px-4 rounded-lg ${
              currentSectionIndex === lesson.sections.length - 1
                ? "bg-success"
                : "bg-primary"
            } ${currentSectionIndex === lesson.sections.length - 1 ? "opacity-50" : ""}`}
          >
            <View className="flex-row items-center justify-center gap-2">
              <Text className="font-semibold text-background">
                {currentSectionIndex === lesson.sections.length - 1 ? "Complete" : "Next"}
              </Text>
              <MaterialIcons
                name={currentSectionIndex === lesson.sections.length - 1 ? "check" : "arrow-forward"}
                size={20}
                color="white"
              />
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
