import { useCallback, useEffect, useState, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Platform, Modal, Dimensions } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  FadeIn,
  SlideInDown,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Confetti Particle ───────────────────────────────────────────────────────

const CONFETTI_COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A78BFA", "#34D399", "#F472B6", "#60A5FA", "#FBBF24"];

function ConfettiParticle({ index, total }: { index: number; total: number }) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  const startX = (index / total) * SCREEN_WIDTH - SCREEN_WIDTH / 2;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = 6 + (index % 4) * 2;

  useEffect(() => {
    const drift = (Math.random() - 0.5) * 120;
    const duration = 1500 + Math.random() * 1000;
    translateY.value = withDelay(index * 30, withTiming(500, { duration, easing: Easing.out(Easing.quad) }));
    translateX.value = withDelay(index * 30, withTiming(drift, { duration }));
    rotate.value = withDelay(index * 30, withTiming(360 * (Math.random() > 0.5 ? 1 : -1), { duration }));
    opacity.value = withDelay(index * 30 + duration * 0.6, withTiming(0, { duration: duration * 0.4 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: "absolute",
    top: 0,
    left: SCREEN_WIDTH / 2 + startX,
    width: size,
    height: size * 1.5,
    backgroundColor: color,
    borderRadius: 2,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return <Animated.View style={style} />;
}

// ─── Celebration Types ───────────────────────────────────────────────────────

export type CelebrationType = "badge" | "streak_milestone" | "level_up" | "streak_freeze";

export interface CelebrationData {
  type: CelebrationType;
  emoji: string;
  title: string;
  subtitle: string;
  detail?: string;
}

// ─── Celebration Overlay ─────────────────────────────────────────────────────

interface CelebrationOverlayProps {
  celebration: CelebrationData | null;
  onDismiss: () => void;
}

export function CelebrationOverlay({ celebration, onDismiss }: CelebrationOverlayProps) {
  const colors = useColors();
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (celebration) {
      scale.value = withSequence(
        withTiming(0.5, { duration: 0 }),
        withSpring(1, { damping: 8, stiffness: 120 })
      );
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [celebration]);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!celebration) return null;

  const showConfetti = celebration.type === "badge" || celebration.type === "level_up" || celebration.type === "streak_milestone";
  const confettiCount = celebration.type === "level_up" ? 30 : 20;

  return (
    <Modal transparent visible={!!celebration} animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        {/* Confetti */}
        {showConfetti && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {Array.from({ length: confettiCount }).map((_, i) => (
              <ConfettiParticle key={i} index={i} total={confettiCount} />
            ))}
          </View>
        )}

        <Animated.View
          entering={SlideInDown.duration(400).springify()}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Animated.View style={emojiStyle}>
            <Text style={styles.emoji}>{celebration.emoji}</Text>
          </Animated.View>

          <Text style={[styles.title, { color: colors.foreground }]}>{celebration.title}</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>{celebration.subtitle}</Text>

          {celebration.detail && (
            <View style={[styles.detailPill, { backgroundColor: colors.primary + "12" }]}>
              <Text style={[styles.detailText, { color: colors.primary }]}>{celebration.detail}</Text>
            </View>
          )}

          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onDismiss();
            }}
            style={({ pressed }) => [
              styles.dismissBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.dismissBtnText}>
              {celebration.type === "level_up" ? "Keep going!" : "Awesome!"}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Celebration Queue Hook ──────────────────────────────────────────────────

export function useCelebrationQueue() {
  const [queue, setQueue] = useState<CelebrationData[]>([]);
  const [current, setCurrent] = useState<CelebrationData | null>(null);

  const enqueue = useCallback((celebration: CelebrationData) => {
    setQueue((prev) => [...prev, celebration]);
  }, []);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((prev) => prev.slice(1));
    }
  }, [current, queue]);

  const dismiss = useCallback(() => {
    setCurrent(null);
  }, []);

  return { current, enqueue, dismiss };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 28,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
  },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 20 },
  detailPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginBottom: 20 },
  detailText: { fontSize: 14, fontWeight: "700", textAlign: "center" },
  dismissBtn: { width: "100%", paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  dismissBtnText: { color: "#FFF", fontSize: 17, fontWeight: "800" },
});
