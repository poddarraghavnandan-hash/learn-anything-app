import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, Pressable, StyleSheet, Linking, Platform, ScrollView } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLearning } from "@/lib/learning-store";
import { XP_VALUES } from "@/shared/types";
import * as Haptics from "expo-haptics";
import { useCallback } from "react";

export default function ContentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { dispatch, addXp } = useLearning();

  const handleOpenExternal = useCallback(async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Linking.openURL(`https://www.youtube.com/watch?v=${id}`);
      addXp(XP_VALUES.videoComplete);
      dispatch({ type: "INCREMENT_VIDEOS" });
    } catch (e) {
      // fallback
    }
  }, [id, addXp, dispatch]);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 8 }]}
        >
          <Text style={[styles.backArrow, { color: colors.primary }]}>Back</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🎬</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Watch Content</Text>
        <Text style={[styles.desc, { color: colors.muted }]}>
          Tap below to open this video in YouTube. Your progress will be tracked automatically.
        </Text>
        <Pressable
          onPress={handleOpenExternal}
          style={({ pressed }) => [
            styles.openBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
        >
          <Text style={styles.openBtnText}>Open in YouTube</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backArrow: { fontSize: 16, fontWeight: "600" },
  content: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12, textAlign: "center" },
  desc: { fontSize: 15, textAlign: "center", marginBottom: 24, lineHeight: 22 },
  openBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  openBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
