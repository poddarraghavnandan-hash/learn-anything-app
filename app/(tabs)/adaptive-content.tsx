import { useState, useEffect } from "react";
import { ScrollView, View, Pressable, ActivityIndicator, Text } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { ResponsiveLayout, ResponsiveText } from "@/components/responsive-layout";
import { ResponsiveCard, ResponsiveSection, ResponsiveHeader } from "@/components/responsive-patterns";
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
        <ResponsiveText size="base" className="mt-4 text-muted">
          Generating personalized lesson...
        </ResponsiveText>
      </ScreenContainer>
    );
  }

  if (!lesson) {
    return (
      <ScreenContainer className="flex items-center justify-center">
        <ResponsiveText size="lg" weight="bold">
          Failed to load lesson
        </ResponsiveText>
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
    <ResponsiveLayout scrollable={true} className="bg-background">
      {/* Header */}
      <ResponsiveHeader
        title={lesson.title}
        subtitle={lesson.topic}
        rightElement={
          <View className="flex-row items-center gap-2">
            <View className="w-24 h-2 bg-border rounded-full overflow-hidden">
              <View
                className="h-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </View>
            <Text className="text-xs text-muted">
              {currentSectionIndex + 1}/{lesson.sections.length}
            </Text>
          </View>
        }
      />

      {/* Content Section */}
      <View className="flex-1 gap-4">
        {/* Section Type Badge */}
        <View className="flex-row items-center gap-2">
          {currentSection.type === "text" && (
            <>
              <MaterialIcons name="description" size={20} color={colors.primary} />
              <ResponsiveText size="sm" weight="semibold" color="text-primary">
                Lesson
              </ResponsiveText>
            </>
          )}
          {currentSection.type === "concept-check" && (
            <>
              <MaterialIcons name="lightbulb" size={20} color={colors.warning} />
              <ResponsiveText size="sm" weight="semibold" color="text-warning">
                Concept Check
              </ResponsiveText>
            </>
          )}
          {currentSection.type === "assessment" && (
            <>
              <MaterialIcons name="quiz" size={20} color={colors.primary} />
              <ResponsiveText size="sm" weight="semibold" color="text-primary">
                Assessment
              </ResponsiveText>
            </>
          )}
          {currentSection.type === "example" && (
            <>
              <MaterialIcons name="lightbulb-outline" size={20} color={colors.success} />
              <ResponsiveText size="sm" weight="semibold" color="text-success">
                Example
              </ResponsiveText>
            </>
          )}
        </View>

        {/* Section Title */}
        <ResponsiveText size="xl" weight="bold">
          {currentSection.title}
        </ResponsiveText>

        {/* Section Content */}
        <ResponsiveText size="base" className="leading-relaxed">
          {currentSection.content}
        </ResponsiveText>

        {/* Multiple Choice Options (for assessments and concept checks) */}
        {(currentSection.type === "assessment" || currentSection.type === "concept-check") &&
          currentSection.metadata?.options && (
            <View className="gap-3">
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
                      <ResponsiveText
                        size="base"
                        weight={isSelected ? "semibold" : "normal"}
                        color={isSelected && !isCorrect ? "text-error" : "text-foreground"}
                        className="flex-1"
                      >
                        {option}
                      </ResponsiveText>
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
                <ResponsiveCard>
                  <ResponsiveText size="sm" weight="semibold" className="mb-2">
                    Explanation:
                  </ResponsiveText>
                  <ResponsiveText size="sm" color="text-muted">
                    {currentSection.metadata.explanation}
                  </ResponsiveText>
                </ResponsiveCard>
              )}
            </View>
          )}

        {/* Mastery Score */}
        {masteryScore > 0 && (
          <ResponsiveCard className="bg-success/10 border-success">
            <View className="flex-row items-center justify-between">
              <View>
                <ResponsiveText size="sm" color="text-muted">
                  Mastery Progress
                </ResponsiveText>
                <ResponsiveText size="2xl" weight="bold" color="text-success">
                  {masteryScore}%
                </ResponsiveText>
              </View>
              <MaterialIcons name="trending-up" size={32} color={colors.success} />
            </View>
          </ResponsiveCard>
        )}
      </View>

      {/* Navigation Buttons */}
      <View className="flex-row gap-3 pt-4 border-t border-border">
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
              color={currentSectionIndex === 0 ? colors.muted : colors.primary}
            />
            <Text className="font-semibold text-primary">Previous</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={handleNextSection}
          disabled={currentSectionIndex === lesson.sections.length - 1}
          className={`flex-1 py-3 px-4 rounded-lg ${
            currentSectionIndex === lesson.sections.length - 1
              ? "bg-primary/50"
              : "bg-primary"
          }`}
        >
          <View className="flex-row items-center justify-center gap-2">
            <Text className="font-semibold text-background">
              {currentSectionIndex === lesson.sections.length - 1 ? "Complete" : "Next"}
            </Text>
            <MaterialIcons
              name={currentSectionIndex === lesson.sections.length - 1 ? "check" : "arrow-forward"}
              size={20}
              color="#FFFFFF"
            />
          </View>
        </Pressable>
      </View>
    </ResponsiveLayout>
  );
}
