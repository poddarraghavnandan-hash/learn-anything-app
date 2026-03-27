import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { getResponsiveFontSize, getResponsiveSpacing } from "@/lib/responsive";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  concept: string;
}

export interface PrerequisiteTestingQuizProps {
  questions: QuizQuestion[];
  onComplete?: (score: number, totalQuestions: number) => void;
  onSkip?: () => void;
}

export function PrerequisiteTestingQuiz({ questions, onComplete, onSkip }: PrerequisiteTestingQuizProps) {
  const colors = useColors();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = selectedAnswers[currentQuestion.id];
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  const handleSelectAnswer = (optionIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: optionIndex,
    });
    setShowExplanation(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowExplanation(false);
    } else {
      const score = Object.entries(selectedAnswers).filter(
        ([qId, answer]) => questions.find((q) => q.id === qId)?.correctAnswer === answer
      ).length;
      setQuizComplete(true);
      onComplete?.(score, questions.length);
    }
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (quizComplete) {
    const score = Object.entries(selectedAnswers).filter(
      ([qId, answer]) => questions.find((q) => q.id === qId)?.correctAnswer === answer
    ).length;
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-surface rounded-2xl p-4 m-3 border border-border items-center">
          <Text className="text-4xl font-bold text-primary mb-2" style={{ fontSize: getResponsiveFontSize(32) }}>
            {percentage}%
          </Text>
          <Text className="text-lg font-semibold text-foreground mb-1" style={{ fontSize: getResponsiveFontSize(16) }}>
            {score} of {questions.length} Correct
          </Text>
          <Text className="text-sm text-muted text-center mb-4" style={{ fontSize: getResponsiveFontSize(12) }}>
            {percentage >= 80
              ? "Great! You're ready to continue."
              : percentage >= 60
                ? "Good effort. Review the concepts below."
                : "Take time to review the prerequisites."}
          </Text>

          <Pressable
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onComplete?.(score, questions.length);
            }}
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                paddingVertical: getResponsiveSpacing(12),
                paddingHorizontal: getResponsiveSpacing(24),
                borderRadius: 8,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text className="text-background font-semibold" style={{ fontSize: getResponsiveFontSize(14) }}>
              {percentage >= 80 ? "Continue Learning" : "Review & Retry"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View className="bg-surface rounded-2xl p-3 m-3 border border-border">
        {/* Progress */}
        <View className="mb-3">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm font-semibold text-muted" style={{ fontSize: getResponsiveFontSize(12) }}>
              Question {currentQuestionIndex + 1} of {questions.length}
            </Text>
            <Text className="text-sm font-semibold text-primary" style={{ fontSize: getResponsiveFontSize(12) }}>
              {Math.round(progress)}%
            </Text>
          </View>
          <View className="h-2 bg-border rounded-full overflow-hidden">
            <View
              className="h-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>

        {/* Question */}
        <View className="mb-4">
          <Text className="text-xs font-semibold text-primary mb-2" style={{ fontSize: getResponsiveFontSize(11) }}>
            {currentQuestion.concept}
          </Text>
          <Text className="text-sm font-semibold text-foreground" style={{ fontSize: getResponsiveFontSize(13) }}>
            {currentQuestion.question}
          </Text>
        </View>

        {/* Options */}
        <View className="gap-2 mb-4">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectOption = index === currentQuestion.correctAnswer;
            const showCorrect = showExplanation && isCorrectOption;
            const showIncorrect = showExplanation && isSelected && !isCorrect;

            return (
              <Pressable
                key={index}
                onPress={() => !showExplanation && handleSelectAnswer(index)}
                disabled={showExplanation}
                style={({ pressed }) => [
                  {
                    paddingVertical: getResponsiveSpacing(12),
                    paddingHorizontal: getResponsiveSpacing(12),
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: showCorrect
                      ? "#4ADE80"
                      : showIncorrect
                        ? "#EF4444"
                        : isSelected
                          ? colors.primary
                          : colors.border,
                    backgroundColor: showCorrect
                      ? "#4ADE80" + "20"
                      : showIncorrect
                        ? "#EF4444" + "20"
                        : isSelected
                          ? colors.primary + "20"
                          : colors.background,
                    opacity: pressed && !showExplanation ? 0.7 : 1,
                  },
                ]}
              >
                <View className="flex-row items-center gap-2">
                  <View
                    className="w-5 h-5 rounded-full border-2 items-center justify-center"
                    style={{
                      borderColor: showCorrect
                        ? "#4ADE80"
                        : showIncorrect
                          ? "#EF4444"
                          : isSelected
                            ? colors.primary
                            : colors.border,
                    }}
                  >
                    {isSelected && (
                      <View
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: showCorrect
                            ? "#4ADE80"
                            : showIncorrect
                              ? "#EF4444"
                              : colors.primary,
                        }}
                      />
                    )}
                  </View>
                  <Text
                    className="flex-1 text-foreground"
                    style={{ fontSize: getResponsiveFontSize(12) }}
                    numberOfLines={2}
                  >
                    {option}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Explanation */}
        {showExplanation && (
          <View className="mb-4 p-2 bg-primary/10 rounded-lg">
            <Text className="text-xs font-semibold text-primary mb-1" style={{ fontSize: getResponsiveFontSize(11) }}>
              {isCorrect ? "✓ Correct!" : "✗ Not quite right"}
            </Text>
            <Text className="text-xs text-foreground" style={{ fontSize: getResponsiveFontSize(11) }}>
              {currentQuestion.explanation}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSkip?.();
            }}
            style={({ pressed }) => [
              {
                flex: 1,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                paddingVertical: getResponsiveSpacing(12),
                borderRadius: 8,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text className="text-foreground font-semibold text-center" style={{ fontSize: getResponsiveFontSize(12) }}>
              Skip
            </Text>
          </Pressable>

          {showExplanation && (
            <Pressable
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                handleNext();
              }}
              style={({ pressed }) => [
                {
                  flex: 1,
                  backgroundColor: colors.primary,
                  paddingVertical: getResponsiveSpacing(12),
                  borderRadius: 8,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text className="text-background font-semibold text-center" style={{ fontSize: getResponsiveFontSize(12) }}>
                {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
