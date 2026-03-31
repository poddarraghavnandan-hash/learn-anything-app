import React, { useState, useCallback } from "react";
import { ScrollView, Text, View, Pressable, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn, SlideInUp } from "react-native-reanimated";
import { Lesson, ContentSection, ConceptCheck, AssessmentQuestion } from "@/shared/curriculum";

interface LessonViewerProps {
  lesson: Lesson;
  onComplete?: () => void;
  onBack?: () => void;
}

export function LessonViewer({ lesson, onComplete, onBack }: LessonViewerProps) {
  const colors = useColors();
  const [currentSection, setCurrentSection] = useState(0);
  const [conceptCheckAnswers, setConceptCheckAnswers] = useState<Record<string, any>>({});
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, any>>({});
  const [assessmentScore, setAssessmentScore] = useState<number | null>(null);

  const handleConceptCheckAnswer = useCallback((checkId: string, answer: any) => {
    setConceptCheckAnswers((prev) => ({ ...prev, [checkId]: answer }));
  }, []);

  const handleAssessmentAnswer = useCallback((questionId: string, answer: any) => {
    setAssessmentAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  const calculateAssessmentScore = useCallback(() => {
    let correct = 0;
    lesson.assessmentQuestions.forEach((q) => {
      if (assessmentAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    const score = Math.round((correct / lesson.assessmentQuestions.length) * 100);
    setAssessmentScore(score);
  }, [lesson.assessmentQuestions, assessmentAnswers]);

  const handleSubmitAssessment = useCallback(() => {
    calculateAssessmentScore();
    const score = Math.round(
      (Object.values(assessmentAnswers).filter((a) => a !== undefined).length /
        lesson.assessmentQuestions.length) *
        100
    );
    if (score >= lesson.masteryThreshold) {
      Alert.alert("Mastery Achieved! 🎉", `You scored ${score}%. Ready for the next lesson?`, [
        { text: "Continue", onPress: onComplete },
        { text: "Review", onPress: () => setShowAssessment(false) },
      ]);
    } else {
      Alert.alert(
        "Keep Learning",
        `You scored ${score}%. Review the content and try again.`,
        [{ text: "Review Content", onPress: () => setShowAssessment(false) }]
      );
    }
  }, [assessmentAnswers, lesson, calculateAssessmentScore, onComplete]);

  if (showAssessment) {
    return (
      <ScreenContainer className="p-4">
        <ScrollView showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => setShowAssessment(false)} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: "600", marginLeft: 8 }}>
                Back to Lesson
              </Text>
            </View>
          </Pressable>

          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground, marginBottom: 8 }}>
            Assessment
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 20 }}>
            Answer {lesson.assessmentQuestions.length} questions to demonstrate mastery
          </Text>

          {lesson.assessmentQuestions.map((q, idx) => (
            <Animated.View
              key={q.id}
              entering={SlideInUp.duration(300).delay(idx * 50)}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 12 }}>
                <View
                  style={{
                    backgroundColor: colors.primary + "20",
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                  }}
                >
                  <Text style={{ color: colors.primary, fontWeight: "700" }}>{idx + 1}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, flex: 1 }}>
                  {q.question}
                </Text>
              </View>

              {(q as any).type === "multiple-choice" && q.options ? (
                <View style={{ gap: 8 }}>
                  {q.options.map((option, optIdx) => (
                    <Pressable
                      key={optIdx}
                      onPress={() => handleAssessmentAnswer(q.id, optIdx)}
                      style={({ pressed }) => [
                        {
                          backgroundColor:
                            assessmentAnswers[q.id] === optIdx ? colors.primary : colors.background,
                          borderRadius: 8,
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderWidth: 1,
                          borderColor:
                            assessmentAnswers[q.id] === optIdx ? colors.primary : colors.border,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: assessmentAnswers[q.id] === optIdx ? "#FFFFFF" : colors.foreground,
                          fontSize: 13,
                        }}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  [Text input would go here]
                </Text>
              )}
            </Animated.View>
          ))}

          <Pressable
            onPress={handleSubmitAssessment}
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
                marginTop: 20,
                marginBottom: 40,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>
              Submit Assessment
            </Text>
          </Pressable>
        </ScrollView>
      </ScreenContainer>
    );
  }

  const section = lesson.contentSections[currentSection];

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          style={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Pressable onPress={onBack} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: "600", marginLeft: 8 }}>
                Back
              </Text>
            </View>
          </Pressable>

          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground, marginBottom: 4 }}>
            {lesson.title}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>
            {lesson.estimatedMinutes} min • {section?.type.charAt(0).toUpperCase() + section?.type.slice(1)}
          </Text>
        </Animated.View>

        {/* Learning Objectives */}
        {currentSection === 0 && (
          <Animated.View entering={SlideInUp.duration(400)} style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
              Learning Objectives
            </Text>
            {lesson.objectives.map((obj, idx) => (
              <View key={obj.id} style={{ flexDirection: "row", marginBottom: 8 }}>
                <MaterialIcons name="check-circle" size={20} color={colors.success} style={{ marginRight: 10 }} />
                <Text style={{ fontSize: 13, color: colors.foreground, flex: 1, lineHeight: 18 }}>
                  {obj.text}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Content Section */}
        {section && (
          <Animated.View entering={SlideInUp.duration(400)} style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
              {section.title}
            </Text>
            <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22, marginBottom: 16 }}>
              {section.content}
            </Text>

            {/* Examples */}
            {section.examples?.map((example) => (
              <View
                key={example.id}
                style={{
                  backgroundColor: colors.primary + "10",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 16,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.primary,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary, marginBottom: 8 }}>
                  Example: {example.title}
                </Text>
                <Text style={{ fontSize: 12, color: colors.foreground, marginBottom: 8, lineHeight: 18 }}>
                  <Text style={{ fontWeight: "600" }}>Problem:</Text> {example.problem}
                </Text>
                <Text style={{ fontSize: 12, color: colors.foreground, lineHeight: 18 }}>
                  <Text style={{ fontWeight: "600" }}>Solution:</Text> {example.solution}
                </Text>
              </View>
            ))}

            {/* Misconceptions */}
            {currentSection === 1 && lesson.misconceptions.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
                  Common Misconceptions
                </Text>
                {lesson.misconceptions.map((m, idx) => (
                  <View
                    key={idx}
                    style={{
                      backgroundColor: colors.error + "10",
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 12,
                      borderLeftWidth: 4,
                      borderLeftColor: colors.error,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: colors.error, fontWeight: "600", marginBottom: 4 }}>
                      ❌ {m.incorrect}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.success, fontWeight: "600", marginBottom: 4 }}>
                      ✅ {m.correct}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 16 }}>
                      {m.explanation}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Concept Checks */}
            {lesson.conceptChecks.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
                  Check Your Understanding
                </Text>
                {lesson.conceptChecks.map((check) => (
                  <View
                    key={check.id}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 10 }}>
                      {check.question}
                    </Text>
                    {check.type === "multiple-choice" && check.options ? (
                      <View style={{ gap: 8 }}>
                        {check.options.map((option, idx) => (
                          <Pressable
                            key={idx}
                            onPress={() => handleConceptCheckAnswer(check.id, idx)}
                            style={({ pressed }) => [
                              {
                                backgroundColor:
                                  conceptCheckAnswers[check.id] === idx ? colors.primary : colors.background,
                                borderRadius: 8,
                                paddingVertical: 8,
                                paddingHorizontal: 10,
                                borderWidth: 1,
                                borderColor:
                                  conceptCheckAnswers[check.id] === idx ? colors.primary : colors.border,
                                opacity: pressed ? 0.8 : 1,
                              },
                            ]}
                          >
                            <Text
                              style={{
                                color:
                                  conceptCheckAnswers[check.id] === idx ? "#FFFFFF" : colors.foreground,
                                fontSize: 12,
                              }}
                            >
                              {option}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {/* Navigation */}
        <Animated.View entering={SlideInUp.duration(400).delay(200)} style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={() => setCurrentSection(Math.max(0, currentSection - 1))}
              disabled={currentSection === 0}
              style={({ pressed }) => [
                {
                  flex: 1,
                  backgroundColor: currentSection === 0 ? colors.border : colors.surface,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: "center",
                  opacity: pressed && currentSection > 0 ? 0.8 : 1,
                  borderWidth: 1,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: currentSection === 0 ? colors.muted : colors.foreground,
                  fontWeight: "600",
                }}
              >
                Previous
              </Text>
            </Pressable>

            {currentSection < lesson.contentSections.length - 1 ? (
              <Pressable
                onPress={() => setCurrentSection(currentSection + 1)}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    backgroundColor: colors.primary,
                    borderRadius: 12,
                    paddingVertical: 12,
                    alignItems: "center",
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Next</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => setShowAssessment(true)}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    backgroundColor: colors.success,
                    borderRadius: 12,
                    paddingVertical: 12,
                    alignItems: "center",
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Take Assessment</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}
