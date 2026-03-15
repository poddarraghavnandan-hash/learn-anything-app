import { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, Dimensions, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useLearning } from "@/lib/learning-store";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import type { SkillLevel } from "@/shared/types";

const { width } = Dimensions.get("window");

const TOPICS = [
  { slug: "python", emoji: "\u{1F40D}", name: "Python" },
  { slug: "javascript", emoji: "\u26A1", name: "JavaScript" },
  { slug: "machine-learning", emoji: "\u{1F916}", name: "Machine Learning" },
  { slug: "data-science", emoji: "\u{1F4CA}", name: "Data Science" },
  { slug: "web-development", emoji: "\u{1F310}", name: "Web Dev" },
  { slug: "reading", emoji: "\u{1F4D6}", name: "Reading" },
  { slug: "writing", emoji: "\u270D\uFE0F", name: "Writing" },
  { slug: "physics", emoji: "\u269B\uFE0F", name: "Physics" },
  { slug: "quantum-physics", emoji: "\u{1F52C}", name: "Quantum Physics" },
  { slug: "astronomy", emoji: "\u{1F52D}", name: "Astronomy" },
  { slug: "biology", emoji: "\u{1F9EC}", name: "Biology" },
  { slug: "mathematics", emoji: "\u{1F522}", name: "Mathematics" },
  { slug: "history", emoji: "\u{1F4DC}", name: "History" },
  { slug: "philosophy", emoji: "\u{1F4AD}", name: "Philosophy" },
  { slug: "psychology", emoji: "\u{1F9E0}", name: "Psychology" },
  { slug: "economics", emoji: "\u{1F4B0}", name: "Economics" },
  { slug: "entrepreneurship", emoji: "\u{1F680}", name: "Startups" },
  { slug: "marketing", emoji: "\u{1F4E3}", name: "Marketing" },
  { slug: "design", emoji: "\u{1F3A8}", name: "Design" },
  { slug: "photography", emoji: "\u{1F4F7}", name: "Photography" },
  { slug: "music-theory", emoji: "\u{1F3B5}", name: "Music Theory" },
  { slug: "fitness", emoji: "\u{1F4AA}", name: "Fitness" },
  { slug: "nutrition", emoji: "\u{1F957}", name: "Nutrition" },
  { slug: "chemistry", emoji: "\u{1F9EA}", name: "Chemistry" },
  { slug: "finance", emoji: "\u{1F4B5}", name: "Personal Finance" },
  { slug: "public-speaking", emoji: "\u{1F3A4}", name: "Public Speaking" },
  { slug: "productivity", emoji: "\u23F1\uFE0F", name: "Productivity" },
  { slug: "languages", emoji: "\u{1F30D}", name: "Languages" },
];

const GOALS = [5, 10, 15, 20, 30];

const SKILL_LEVELS: { key: SkillLevel; emoji: string; label: string; desc: string }[] = [
  { key: "beginner", emoji: "\u{1F331}", label: "Just Starting", desc: "I'm new to most of these topics. Explain things simply." },
  { key: "intermediate", emoji: "\u{1F4DA}", label: "Some Knowledge", desc: "I know the basics. Challenge me a bit more." },
  { key: "advanced", emoji: "\u{1F680}", label: "Deep Diver", desc: "I want advanced, in-depth content. Don't hold back." },
];

const FORMATS = [
  { key: "videos" as const, emoji: "\u{1F3AC}", label: "Videos", desc: "YouTube tutorials & explainers" },
  { key: "articles" as const, emoji: "\u{1F4D6}", label: "Articles", desc: "Web articles & summaries" },
  { key: "mixed" as const, emoji: "\u{1F500}", label: "Mix of Both", desc: "Best of both worlds" },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("beginner");
  const [dailyGoal, setDailyGoal] = useState(10);
  const [format, setFormat] = useState<"videos" | "articles" | "mixed">("mixed");
  const { dispatch } = useLearning();
  const router = useRouter();
  const colors = useColors();
  const refreshMutation = trpc.feed.refresh.useMutation();

  const TOTAL_STEPS = 4;

  const toggleTopic = useCallback((slug: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTopics((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  const handleFinish = useCallback(async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    dispatch({ type: "SET_INTERESTS", payload: selectedTopics });
    dispatch({ type: "SET_SKILL_LEVEL", payload: skillLevel });
    dispatch({ type: "SET_DAILY_GOAL", payload: dailyGoal });
    dispatch({ type: "SET_FORMAT", payload: format });
    dispatch({ type: "COMPLETE_ONBOARDING" });
    dispatch({ type: "UPDATE_STREAK" });

    // Start fetching content in background with skill level
    refreshMutation.mutate({ topicSlugs: selectedTopics.slice(0, 5), skillLevel });

    router.replace("/(tabs)");
  }, [selectedTopics, skillLevel, dailyGoal, format, dispatch, router, refreshMutation]);

  const canProceed = step === 0 ? selectedTopics.length >= 1 : true;

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1">
      <View style={styles.container}>
        {/* Progress dots */}
        <View style={styles.dots}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i <= step ? colors.primary : colors.border, width: i === step ? 24 : 8 },
              ]}
            />
          ))}
        </View>

        {/* Step 0: Topics */}
        {step === 0 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.title, { color: colors.foreground }]}>What fascinates you?</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Pick topics you want to learn. Anyone can learn anything — we'll meet you where you are.
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
                      style={[styles.chipText, { color: selected ? "#FFFFFF" : colors.foreground }]}
                    >
                      {t.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Step 1: Skill Level Assessment */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.title, { color: colors.foreground }]}>Where are you now?</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              No wrong answer — this helps us teach at the right level. We'll adjust as you learn.
            </Text>
            <View style={styles.levelContainer}>
              {SKILL_LEVELS.map((sl) => (
                <Pressable
                  key={sl.key}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSkillLevel(sl.key);
                  }}
                  style={({ pressed }) => [
                    styles.levelCard,
                    {
                      backgroundColor: skillLevel === sl.key ? colors.primary : colors.surface,
                      borderColor: skillLevel === sl.key ? colors.primary : colors.border,
                      opacity: pressed ? 0.8 : 1,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    },
                  ]}
                >
                  <Text style={styles.levelEmoji}>{sl.emoji}</Text>
                  <View style={styles.levelTextWrap}>
                    <Text style={[styles.levelLabel, { color: skillLevel === sl.key ? "#FFF" : colors.foreground }]}>
                      {sl.label}
                    </Text>
                    <Text style={[styles.levelDesc, { color: skillLevel === sl.key ? "rgba(255,255,255,0.8)" : colors.muted }]}>
                      {sl.desc}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
            <View style={[styles.reassurance, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.reassuranceText, { color: colors.muted }]}>
                The app adapts to you in real-time. If content is too easy or too hard, we'll adjust automatically.
              </Text>
            </View>
          </View>
        )}

        {/* Step 2: Daily Goal */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.title, { color: colors.foreground }]}>Daily learning goal</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Start small — consistency beats intensity. Even 5 minutes a day builds real knowledge.
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
                That's about {Math.ceil(dailyGoal / 4)} learning cards per day
              </Text>
            </View>
          </View>
        )}

        {/* Step 3: Format */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.title, { color: colors.foreground }]}>How do you learn best?</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              We'll prioritize this format. You'll still see everything.
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
              if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
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
            <Text style={styles.nextText}>{step === TOTAL_STEPS - 1 ? "Start Learning" : "Continue"}</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, paddingTop: 16, paddingBottom: 8, alignItems: "center" },
  dot: { height: 8, borderRadius: 4 },
  stepContainer: { flex: 1, paddingTop: 24 },
  title: { fontSize: 28, fontWeight: "800", textAlign: "center", lineHeight: 34 },
  subtitle: { fontSize: 15, textAlign: "center", marginTop: 8, marginBottom: 24, lineHeight: 22, paddingHorizontal: 10 },
  scrollArea: { flex: 1 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingBottom: 20 },
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
  chipEmoji: { fontSize: 18, marginRight: 6 },
  chipText: { fontSize: 14, fontWeight: "600" },
  levelContainer: { gap: 12, marginTop: 8 },
  levelCard: { flexDirection: "row", padding: 18, borderRadius: 16, borderWidth: 1.5, alignItems: "center" },
  levelEmoji: { fontSize: 32, marginRight: 14 },
  levelTextWrap: { flex: 1 },
  levelLabel: { fontSize: 18, fontWeight: "700" },
  levelDesc: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  reassurance: { marginTop: 20, padding: 14, borderRadius: 12, borderWidth: 1 },
  reassuranceText: { fontSize: 13, textAlign: "center", lineHeight: 18 },
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
