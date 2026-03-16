import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform, Modal } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut, SlideInDown } from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";
import { useLearning } from "@/lib/learning-store";

interface SessionEndPromptProps {
  visible: boolean;
  onContinue: () => void;
  onStop: () => void;
}

export function SessionEndPrompt({ visible, onContinue, onStop }: SessionEndPromptProps) {
  const colors = useColors();
  const { state } = useLearning();
  const { profile } = state;

  const getMessage = () => {
    const mins = state.sessionMinutes || 0;
    if (mins >= profile.dailyGoalMinutes * 2) {
      return { title: "Impressive session!", subtitle: `${mins} minutes of learning today. Ready for one more?`, emoji: "\u{1F31F}" };
    }
    if (mins >= profile.dailyGoalMinutes) {
      return { title: "Daily goal reached!", subtitle: "You've hit your target. Want to keep the momentum?", emoji: "\u{1F389}" };
    }
    return { title: "Great progress!", subtitle: `${profile.dailyGoalMinutes - mins} minutes left to hit your daily goal. One more?`, emoji: "\u{1F4AA}" };
  };

  const msg = getMessage();

  const handleContinue = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onContinue();
  }, [onContinue]);

  const handleStop = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onStop();
  }, [onStop]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View
          entering={SlideInDown.duration(300)}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={styles.emoji}>{msg.emoji}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{msg.title}</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>{msg.subtitle}</Text>

          <View style={styles.statsRow}>
            <View style={[styles.statPill, { backgroundColor: colors.primary + "15" }]}>
              <Text style={[styles.statText, { color: colors.primary }]}>
                {state.sessionMinutes || 0}m today
              </Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: colors.success + "15" }]}>
              <Text style={[styles.statText, { color: colors.success }]}>
                {profile.currentStreak} day streak
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.continueBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.continueBtnText}>One more!</Text>
          </Pressable>

          <Pressable
            onPress={handleStop}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, paddingVertical: 12 }]}
          >
            <Text style={[styles.stopText, { color: colors.muted }]}>I'm done for now</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * Hook to manage session-end prompt timing.
 * Shows the prompt when user reaches their daily goal or after extended sessions.
 */
export function useSessionEndPrompt() {
  const { state } = useLearning();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [goalPromptShown, setGoalPromptShown] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const mins = state.sessionMinutes || 0;
    const goal = state.profile.dailyGoalMinutes;

    // Show when daily goal is reached (once per session)
    if (mins >= goal && !goalPromptShown && mins > 0) {
      setShowPrompt(true);
      setGoalPromptShown(true);
    }
  }, [state.sessionMinutes, state.profile.dailyGoalMinutes, dismissed, goalPromptShown]);

  const handleContinue = useCallback(() => {
    setShowPrompt(false);
  }, []);

  const handleStop = useCallback(() => {
    setShowPrompt(false);
    setDismissed(true);
  }, []);

  return { showPrompt, handleContinue, handleStop };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "800", textAlign: "center", marginBottom: 6 },
  subtitle: { fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 20 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  statText: { fontSize: 13, fontWeight: "700" },
  continueBtn: { width: "100%", paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  continueBtnText: { color: "#FFF", fontSize: 17, fontWeight: "800" },
  stopText: { fontSize: 15, fontWeight: "600" },
});
