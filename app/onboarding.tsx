import { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, Dimensions, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useLearning } from "@/lib/learning-store";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

const TOPICS = [
  { slug: "python", emoji: "🐍", name: "Python" },
  { slug: "javascript", emoji: "⚡", name: "JavaScript" },
  { slug: "machine-learning", emoji: "🤖", name: "Machine Learning" },
  { slug: "data-science", emoji: "📊", name: "Data Science" },
  { slug: "web-development", emoji: "🌐", name: "Web Dev" },
  { slug: "physics", emoji: "⚛️", name: "Physics" },
  { slug: "astronomy", emoji: "🔭", name: "Astronomy" },
  { slug: "biology", emoji: "🧬", name: "Biology" },
  { slug: "mathematics", emoji: "🔢", name: "Mathematics" },
  { slug: "history", emoji: "📜", name: "History" },
  { slug: "philosophy", emoji: "💭", name: "Philosophy" },
  { slug: "psychology", emoji: "🧠", name: "Psychology" },
  { slug: "economics", emoji: "💰", name: "Economics" },
  { slug: "entrepreneurship", emoji: "🚀", name: "Startups" },
  { slug: "marketing", emoji: "📣", name: "Marketing" },
  { slug: "design", emoji: "🎨", name: "Design" },
  { slug: "photography", emoji: "📷", name: "Photography" },
  { slug: "music-theory", emoji: "🎵", name: "Music Theory" },
  { slug: "fitness", emoji: "💪", name: "Fitness" },
  { slug: "nutrition", emoji: "🥗", name: "Nutrition" },
  { slug: "productivity", emoji: "⏱️", name: "Productivity" },
  { slug: "public-speaking", emoji: "🎤", name: "Public Speaking" },
  { slug: "finance", emoji: "💵", name: "Personal Finance" },
  { slug: "chemistry", emoji: "🧪", name: "Chemistry" },
];

const GOALS = [5, 10, 15, 20, 30];
const FORMATS = [
  { key: "videos" as const, emoji: "🎬", label: "Videos", desc: "YouTube tutorials & explainers" },
  { key: "articles" as const, emoji: "📖", label: "Articles", desc: "Web articles & summaries" },
  { key: "mixed" as const, emoji: "🔀", label: "Mix of Both", desc: "Best of both worlds" },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [dailyGoal, setDailyGoal] = useState(10);
  const [format, setFormat] = useState<"videos" | "articles" | "mixed">("mixed");
  const { dispatch } = useLearning();
  const router = useRouter();
  const colors = useColors();
  const refreshMutation = trpc.feed.refresh.useMutation();

  const toggleTopic = useCallback((slug: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTopics((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  const handleFinish = useCallback(async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    dispatch({ type: "SET_INTERESTS", payload: selectedTopics });
    dispatch({ type: "SET_DAILY_GOAL", payload: dailyGoal });
    dispatch({ type: "SET_FORMAT", payload: format });
    dispatch({ type: "COMPLETE_ONBOARDING" });
    dispatch({ type: "UPDATE_STREAK" });

    // Start fetching content in background
    refreshMutation.mutate({ topicSlugs: selectedTopics.slice(0, 5) });

    router.replace("/(tabs)");
  }, [selectedTopics, dailyGoal, format, dispatch, router, refreshMutation]);

  const canProceed = step === 0 ? selectedTopics.length >= 1 : true;

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1">
      <View style={styles.container}>
        {/* Progress dots */}
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i <= step ? colors.primary : colors.border },
              ]}
            />
          ))}
        </View>

        {/* Step 0: Topics */}
        {step === 0 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.title, { color: colors.foreground }]}>What fascinates you?</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Pick topics you want to learn about. You can change these anytime.
            </Text>
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.chipGrid}
              showsVerticalScrollIndicator={false}
            >
              {TOPICS.map((t) => {
                const selected = selectedTopics.includes(t.slug);
                return (
                  <Pressable
                    key={t.slug}
                    onPress={() => toggleTopic(t.slug)}
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        backgroundColor: selected ? colors.primary : colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                        opacity: pressed ? 0.8 : 1,
                        transform: [{ scale: pressed ? 0.95 : 1 }],
                      },
                    ]}
                  >
                    <Text style={styles.chipEmoji}>{t.emoji}</Text>
                    <Text
                      style={[
                        styles.chipText,
                        { color: selected ? "#FFFFFF" : colors.foreground },
                      ]}
                    >
                      {t.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Step 1: Daily Goal */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.title, { color: colors.foreground }]}>Daily learning goal</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              How many minutes per day? Start small — consistency beats intensity.
            </Text>
            <View style={styles.goalContainer}>
              {GOALS.map((g) => (
                <Pressable
                  key={g}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDailyGoal(g);
                  }}
                  style={({ pressed }) => [
                    styles.goalCard,
                    {
                      backgroundColor: dailyGoal === g ? colors.primary : colors.surface,
                      borderColor: dailyGoal === g ? colors.primary : colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.goalNumber, { color: dailyGoal === g ? "#FFF" : colors.foreground }]}>
                    {g}
                  </Text>
                  <Text style={[styles.goalLabel, { color: dailyGoal === g ? "#FFF" : colors.muted }]}>
                    min/day
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.infoText, { color: colors.muted }]}>
                That's about {Math.ceil(dailyGoal / 4)} cards per day
              </Text>
            </View>
          </View>
        )}

        {/* Step 2: Format */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.title, { color: colors.foreground }]}>How do you learn best?</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              We'll prioritize this format in your feed. You'll still see everything.
            </Text>
            <View style={styles.formatContainer}>
              {FORMATS.map((f) => (
                <Pressable
                  key={f.key}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFormat(f.key);
                  }}
                  style={({ pressed }) => [
                    styles.formatCard,
                    {
                      backgroundColor: format === f.key ? colors.primary : colors.surface,
                      borderColor: format === f.key ? colors.primary : colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={styles.formatEmoji}>{f.emoji}</Text>
                  <Text style={[styles.formatLabel, { color: format === f.key ? "#FFF" : colors.foreground }]}>
                    {f.label}
                  </Text>
                  <Text style={[styles.formatDesc, { color: format === f.key ? "rgba(255,255,255,0.8)" : colors.muted }]}>
                    {f.desc}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Bottom button */}
        <View style={styles.bottomBar}>
          {step > 0 && (
            <Pressable
              onPress={() => setStep((s) => s - 1)}
              style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={[styles.backText, { color: colors.muted }]}>Back</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => {
              if (step < 2) setStep((s) => s + 1);
              else handleFinish();
            }}
            disabled={!canProceed}
            style={({ pressed }) => [
              styles.nextBtn,
              {
                backgroundColor: canProceed ? colors.primary : colors.border,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <Text style={styles.nextText}>{step === 2 ? "Start Learning" : "Continue"}</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, paddingTop: 16, paddingBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  stepContainer: { flex: 1, paddingTop: 24 },
  title: { fontSize: 28, fontWeight: "800", textAlign: "center", lineHeight: 34 },
  subtitle: { fontSize: 15, textAlign: "center", marginTop: 8, marginBottom: 24, lineHeight: 22, paddingHorizontal: 10 },
  scrollArea: { flex: 1 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingBottom: 20 },
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
  chipEmoji: { fontSize: 18, marginRight: 6 },
  chipText: { fontSize: 14, fontWeight: "600" },
  goalContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 16 },
  goalCard: { width: 90, height: 90, borderRadius: 16, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  goalNumber: { fontSize: 28, fontWeight: "800" },
  goalLabel: { fontSize: 12, marginTop: 2 },
  infoCard: { marginTop: 24, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  infoText: { fontSize: 14 },
  formatContainer: { gap: 12, marginTop: 16 },
  formatCard: { padding: 20, borderRadius: 16, borderWidth: 1.5, alignItems: "center" },
  formatEmoji: { fontSize: 32, marginBottom: 8 },
  formatLabel: { fontSize: 18, fontWeight: "700" },
  formatDesc: { fontSize: 13, marginTop: 4 },
  bottomBar: { flexDirection: "row", alignItems: "center", paddingVertical: 16, gap: 12 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 14 },
  backText: { fontSize: 16, fontWeight: "600" },
  nextBtn: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  nextText: { color: "#FFF", fontSize: 17, fontWeight: "700" },
});
