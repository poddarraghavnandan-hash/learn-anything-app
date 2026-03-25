import React from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from "react-native";
import Animated, { FadeIn, SlideInRight } from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";
import { getResponsiveFontSize, getResponsiveSpacing, isSmallScreen } from "@/lib/responsive";
import type { JourneyStage } from "@/shared/types";

interface FillInTheBlankCardProps {
  stage: JourneyStage;
  onAnswer: (answer: string) => void;
  isAnswered: boolean;
  isCorrect?: boolean;
  userAnswer?: string;
}

export function FillInTheBlankCard({
  stage,
  onAnswer,
  isAnswered,
  isCorrect,
  userAnswer = "",
}: FillInTheBlankCardProps) {
  const colors = useColors();
  const [answer, setAnswer] = React.useState(userAnswer);

  const handleSubmit = () => {
    if (answer.trim()) {
      onAnswer(answer.trim());
    }
  };

  const stageAccentColors: Record<string, string> = {
    foundation: "#6366F1",
    explanation: "#8B5CF6",
    real_world: "#EC4899",
    check: "#F59E0B",
    "fill-in-the-blank": "#F59E0B",
  };

  const accentColor = stageAccentColors[stage.type] || "#6366F1";

  return (
    <Animated.View entering={SlideInRight.duration(300)} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.cardScroll,
          { paddingHorizontal: getResponsiveSpacing(20), paddingTop: getResponsiveSpacing(8) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stage Label */}
        <Text style={[styles.stageLabel, { color: accentColor }]}>Challenge</Text>

        {/* Question */}
        <Text
          style={[
            styles.question,
            {
              fontSize: getResponsiveFontSize(isSmallScreen() ? 16 : 18),
              lineHeight: getResponsiveFontSize(isSmallScreen() ? 24 : 28),
              color: colors.foreground,
              marginBottom: getResponsiveSpacing(24),
            },
          ]}
        >
          {stage.question}
        </Text>

        {/* Hint (if available) */}
        {stage.hints && stage.hints.length > 0 && !isAnswered && (
          <Animated.View entering={FadeIn.duration(300)}>
            <View
              style={[
                styles.hintBox,
                {
                  backgroundColor: `${accentColor}15`,
                  borderColor: `${accentColor}40`,
                  borderWidth: 1,
                  padding: getResponsiveSpacing(12),
                  borderRadius: 12,
                  marginBottom: getResponsiveSpacing(16),
                },
              ]}
            >
              <Text style={[styles.hintLabel, { color: accentColor }]}>💡 Hint</Text>
              <Text style={[styles.hintText, { color: colors.foreground, marginTop: getResponsiveSpacing(6) }]}>
                {stage.hints[0]}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Text Input */}
        {!isAnswered ? (
          <View style={styles.inputSection}>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                  fontSize: getResponsiveFontSize(16),
                  paddingHorizontal: getResponsiveSpacing(16),
                  paddingVertical: getResponsiveSpacing(14),
                },
              ]}
              placeholder="Type your answer..."
              placeholderTextColor={colors.muted}
              value={answer}
              onChangeText={setAnswer}
              editable={!isAnswered}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            <Pressable
              onPress={handleSubmit}
              disabled={!answer.trim()}
              style={({ pressed }) => [
                styles.submitBtn,
                {
                  backgroundColor: answer.trim() ? accentColor : colors.surface,
                  opacity: pressed && answer.trim() ? 0.9 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.submitBtnText,
                  { color: answer.trim() ? "#FFF" : colors.muted },
                ]}
              >
                Check Answer
              </Text>
            </Pressable>
          </View>
        ) : (
          <Animated.View entering={FadeIn.duration(300)}>
            {/* Answer Result */}
            <View
              style={[
                styles.resultBox,
                {
                  backgroundColor: isCorrect ? "#10B98115" : "#EF444415",
                  borderColor: isCorrect ? "#10B981" : "#EF4444",
                  borderWidth: 1,
                  padding: getResponsiveSpacing(16),
                  borderRadius: 12,
                  marginBottom: getResponsiveSpacing(16),
                },
              ]}
            >
              <Text style={[styles.resultLabel, { color: isCorrect ? "#10B981" : "#EF4444" }]}>
                {isCorrect ? "✓ Correct!" : "✗ Not quite"}
              </Text>
              <Text
                style={[
                  styles.userAnswerText,
                  {
                    color: colors.foreground,
                    marginTop: getResponsiveSpacing(8),
                    fontSize: getResponsiveFontSize(14),
                  },
                ]}
              >
                Your answer: <Text style={{ fontWeight: "600" }}>{userAnswer}</Text>
              </Text>
            </View>

            {/* Explanation */}
            <ScrollView
              nestedScrollEnabled
              contentContainerStyle={{ flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.explanationBox,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    padding: getResponsiveSpacing(16),
                    borderRadius: 12,
                  },
                ]}
              >
                <Text style={[styles.explanationLabel, { color: accentColor }]}>Why?</Text>
                <Text
                  style={[
                    styles.explanationText,
                    {
                      color: colors.foreground,
                      marginTop: getResponsiveSpacing(8),
                      fontSize: getResponsiveFontSize(14),
                      lineHeight: getResponsiveFontSize(22),
                    },
                  ]}
                >
                  {stage.explanation}
                </Text>
              </View>
            </ScrollView>
          </Animated.View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cardScroll: { flexGrow: 1, paddingBottom: 100 },
  stageLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  question: { fontWeight: "600", marginBottom: 24 },
  hintBox: { marginBottom: 16 },
  hintLabel: { fontSize: 12, fontWeight: "700" },
  hintText: { fontSize: 13, lineHeight: 20 },
  inputSection: { gap: 12, marginBottom: 24 },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    fontWeight: "500",
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: { fontSize: 16, fontWeight: "700" },
  resultBox: { marginBottom: 16 },
  resultLabel: { fontSize: 16, fontWeight: "700" },
  userAnswerText: { fontWeight: "400" },
  explanationBox: { marginBottom: 24 },
  explanationLabel: { fontSize: 13, fontWeight: "700", textTransform: "uppercase" },
  explanationText: { fontWeight: "400" },
});
