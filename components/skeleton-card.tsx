import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";

function ShimmerBlock({ width, height, borderRadius = 8 }: { width: string | number; height: number; borderRadius?: number }) {
  const colors = useColors();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    backgroundColor: colors.muted,
    width: width as any,
    height,
    borderRadius,
  }));

  return <Animated.View style={animatedStyle} />;
}

export function SkeletonCard() {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Thumbnail placeholder */}
      <ShimmerBlock width="100%" height={180} borderRadius={12} />
      {/* Title placeholder */}
      <View style={styles.content}>
        <ShimmerBlock width="85%" height={18} />
        <View style={{ height: 8 }} />
        <ShimmerBlock width="60%" height={14} />
        <View style={{ height: 12 }} />
        <View style={styles.metaRow}>
          <ShimmerBlock width={60} height={24} borderRadius={12} />
          <ShimmerBlock width={80} height={24} borderRadius={12} />
          <ShimmerBlock width={50} height={24} borderRadius={12} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonFeed() {
  return (
    <View style={styles.feedContainer}>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

const styles = StyleSheet.create({
  feedContainer: { gap: 16, paddingHorizontal: 16 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  content: {
    padding: 14,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
  },
});
