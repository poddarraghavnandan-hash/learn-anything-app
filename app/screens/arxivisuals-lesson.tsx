/**
 * ArxiVisuals Lesson Player Screen
 * Displays animated video explanation and interactive quiz for each step
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export default function ArxivisualsLessonScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams();

  const step = parseInt(params.step as string) || 1;
  const totalSteps = parseInt(params.totalSteps as string) || 5;

  const [videoPlaying, setVideoPlaying] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);

  // Mock quiz questions
  const quizQuestions: QuizQuestion[] = [
    {
      id: "q1",
      question: "What is the primary concept introduced in this step?",
      options: [
        "Option A - Correct answer",
        "Option B - Incorrect",
        "Option C - Incorrect",
        "Option D - Incorrect",
      ],
      correctAnswer: 0,
      explanation:
        "This is correct because... [detailed explanation of why this is the right answer]",
    },
    {
      id: "q2",
      question: "How does this concept apply in real-world scenarios?",
      options: [
        "Application 1",
        "Application 2 - Correct",
        "Application 3",
        "Application 4",
      ],
      correctAnswer: 1,
      explanation: "The correct application is... [detailed explanation]",
    },
    {
      id: "q3",
      question: "What is the relationship between this and previous concepts?",
      options: [
        "Relationship A",
        "Relationship B",
        "Relationship C - Correct",
        "Relationship D",
      ],
      correctAnswer: 2,
      explanation: "The correct relationship is... [detailed explanation]",
    },
  ];

  const handlePlayVideo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVideoPlaying(!videoPlaying);
  };

  const handleAnswerSelect = (optionIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAnswers([...selectedAnswers, optionIndex]);
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowExplanation(false);
    } else {
      handleCompleteStep();
    }
  };

  const handleCompleteStep = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (step < totalSteps) {
      router.push({
        pathname: "./arxivisuals-lesson",
        params: {
          step: (step + 1).toString(),
          totalSteps: totalSteps.toString(),
        },
      });
    } else {
      router.push("../arxivisuals-completion");
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      router.push({
        pathname: "./arxivisuals-lesson",
        params: {
          step: (step - 1).toString(),
          totalSteps: totalSteps.toString(),
        },
      });
    }
  };

  const isAnswerCorrect = selectedAnswers[currentQuestion] === quizQuestions[currentQuestion].correctAnswer;

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Step Progress */}
        <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-muted">Step {step} of {totalSteps}</Text>
            <Text className="text-xl font-bold text-foreground">
              Foundations & Core Concepts
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-2xl">✕</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View className="px-6 py-2">
          <View className="bg-surface rounded-full h-1 overflow-hidden">
            <View
              className="bg-primary h-full"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </View>
        </View>

        {/* Video Section */}
        {!quizStarted && (
          <View className="px-6 py-4">
            <View
              className="bg-surface rounded-lg overflow-hidden mb-4"
              style={{ aspectRatio: 16 / 9 }}
            >
              {videoPlaying ? (
                <View className="flex-1 bg-black items-center justify-center">
                  <Text className="text-6xl mb-4">🎬</Text>
                  <Text className="text-white text-center">
                    Animated Explanation Video
                  </Text>
                  <Text className="text-gray-400 text-xs mt-2">8 min 32 sec</Text>
                </View>
              ) : (
                <View className="flex-1 bg-surface items-center justify-center">
                  <TouchableOpacity
                    onPress={handlePlayVideo}
                    className="w-16 h-16 bg-primary rounded-full items-center justify-center"
                  >
                    <Text className="text-2xl">▶</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Video Controls */}
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity
                onPress={handlePlayVideo}
                className="flex-1 flex-row items-center justify-center gap-2 bg-primary py-3 rounded-lg mr-2"
              >
                <Text className="text-background font-semibold">
                  {videoPlaying ? "⏸ Pause" : "▶ Play"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setQuizStarted(true)}
                className="flex-1 flex-row items-center justify-center gap-2 bg-surface border border-border py-3 rounded-lg ml-2"
              >
                <Text className="text-foreground font-semibold">Take Quiz →</Text>
              </TouchableOpacity>
            </View>

            {/* Lesson Content */}
            <View className="bg-surface border border-border rounded-lg p-4 mb-4">
              <Text className="text-sm font-semibold text-muted mb-2">Key Insight</Text>
              <Text className="text-foreground leading-relaxed">
                Master the building blocks before advancing to complex topics. This foundation
                will make everything else click into place.
              </Text>
            </View>

            <View className="bg-surface border border-border rounded-lg p-4">
              <Text className="text-sm font-semibold text-muted mb-3">Concepts Covered</Text>
              <View className="flex-row gap-2 flex-wrap">
                {["Concept A", "Concept B", "Concept C"].map((concept) => (
                  <View
                    key={concept}
                    className="bg-primary bg-opacity-10 border border-primary rounded-full px-3 py-1"
                  >
                    <Text className="text-xs text-primary font-medium">{concept}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Quiz Section */}
        {quizStarted && (
          <View className="px-6 py-4 flex-1">
            <View className="mb-6">
              <Text className="text-sm text-muted mb-2">
                Question {currentQuestion + 1} of {quizQuestions.length}
              </Text>
              <View className="bg-surface rounded-full h-1 overflow-hidden">
                <View
                  className="bg-primary h-full"
                  style={{
                    width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%`,
                  }}
                />
              </View>
            </View>

            {/* Question */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-foreground mb-6">
                {quizQuestions[currentQuestion].question}
              </Text>

              {/* Answer Options */}
              <View className="gap-3">
                {quizQuestions[currentQuestion].options.map((option, index) => {
                  const isSelected = selectedAnswers[currentQuestion] === index;
                  const isCorrect = index === quizQuestions[currentQuestion].correctAnswer;
                  const showResult = showExplanation && isSelected;

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => !showExplanation && handleAnswerSelect(index)}
                      disabled={showExplanation}
                      className={cn(
                        "p-4 rounded-lg border-2 flex-row items-center",
                        showResult && isCorrect
                          ? "bg-success bg-opacity-10 border-success"
                          : showResult && !isCorrect
                            ? "bg-error bg-opacity-10 border-error"
                            : isSelected
                              ? "bg-primary bg-opacity-10 border-primary"
                              : "bg-surface border-border"
                      )}
                    >
                      <View
                        className={cn(
                          "w-6 h-6 rounded-full border-2 items-center justify-center mr-3",
                          showResult && isCorrect
                            ? "bg-success border-success"
                            : showResult && !isCorrect
                              ? "bg-error border-error"
                              : isSelected
                                ? "bg-primary border-primary"
                                : "bg-surface border-border"
                        )}
                      >
                        {showResult && isCorrect && (
                          <Text className="text-white font-bold text-sm">✓</Text>
                        )}
                        {showResult && !isCorrect && (
                          <Text className="text-white font-bold text-sm">✕</Text>
                        )}
                      </View>
                      <Text
                        className={cn(
                          "flex-1 font-medium",
                          showResult && isCorrect
                            ? "text-success"
                            : showResult && !isCorrect
                              ? "text-error"
                              : isSelected
                                ? "text-primary"
                                : "text-foreground"
                        )}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Explanation */}
            {showExplanation && (
              <View className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <Text className="text-xs font-semibold text-blue-900 mb-2">
                  {isAnswerCorrect ? "✓ Correct!" : "✕ Not quite"}
                </Text>
                <Text className="text-xs text-blue-900 leading-relaxed">
                  {quizQuestions[currentQuestion].explanation}
                </Text>
              </View>
            )}

            {/* Navigation Buttons */}
            {showExplanation && (
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={handleNextQuestion}
                  className="flex-1 bg-primary py-4 px-6 rounded-lg items-center"
                >
                  <Text className="text-background font-bold">
                    {currentQuestion === quizQuestions.length - 1
                      ? "Complete Step →"
                      : "Next Question →"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Navigation Footer */}
        <View className="px-6 py-4 border-t border-border flex-row gap-3">
          <TouchableOpacity
            onPress={handlePreviousStep}
            disabled={step === 1}
            className={cn(
              "flex-1 py-3 px-4 rounded-lg items-center border border-border",
              step === 1 && "opacity-50"
            )}
          >
            <Text className="text-foreground font-semibold">← Previous</Text>
          </TouchableOpacity>

          {!quizStarted && (
            <TouchableOpacity
              onPress={handleCompleteStep}
              className="flex-1 py-3 px-4 rounded-lg items-center bg-primary"
            >
              <Text className="text-background font-semibold">Skip to Next →</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
