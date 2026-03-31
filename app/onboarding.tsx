import { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Dimensions,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useLearning } from "@/lib/learning-store";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Age groups for curated topics ─────────────────────────────────────────

const AGE_RANGES = [
  { label: "Under 10", value: 8, emoji: "🧒" },
  { label: "10 – 14", value: 12, emoji: "🎒" },
  { label: "15 – 18", value: 16, emoji: "🎓" },
  { label: "19 – 25", value: 22, emoji: "🚀" },
  { label: "26 – 40", value: 33, emoji: "💼" },
  { label: "40+", value: 50, emoji: "🌟" },
];

// ─── Topics curated by age group ───────────────────────────────────────────

const ALL_TOPICS = [
  // Science & Nature — universal appeal
  { slug: "physics", emoji: "⚛️", name: "Physics", spark: "How everything works", minAge: 10 },
  { slug: "quantum-physics", emoji: "🔬", name: "Quantum Physics", spark: "Explore the impossible", minAge: 15 },
  { slug: "astronomy", emoji: "🔭", name: "Astronomy", spark: "Wonder at the cosmos", minAge: 6 },
  { slug: "biology", emoji: "🧬", name: "Biology", spark: "Decode life itself", minAge: 8 },
  { slug: "chemistry", emoji: "🧪", name: "Chemistry", spark: "What everything is made of", minAge: 10 },
  { slug: "mathematics", emoji: "🔢", name: "Mathematics", spark: "The language of the universe", minAge: 6 },
  { slug: "earth-science", emoji: "🌍", name: "Earth Science", spark: "Our planet's secrets", minAge: 6 },

  // Technology & Code
  { slug: "python", emoji: "🐍", name: "Python", spark: "Build anything with code", minAge: 10 },
  { slug: "javascript", emoji: "⚡", name: "JavaScript", spark: "Power the web", minAge: 12 },
  { slug: "machine-learning", emoji: "🤖", name: "AI & Machine Learning", spark: "Teach machines to think", minAge: 14 },
  { slug: "data-science", emoji: "📊", name: "Data Science", spark: "Find stories in numbers", minAge: 15 },
  { slug: "web-development", emoji: "🌐", name: "Web Development", spark: "Create for the internet", minAge: 12 },
  { slug: "robotics", emoji: "🦾", name: "Robotics", spark: "Build machines that move", minAge: 8 },

  // Humanities & Social
  { slug: "history", emoji: "📜", name: "History", spark: "Learn from the past", minAge: 8 },
  { slug: "philosophy", emoji: "💭", name: "Philosophy", spark: "Ask the deepest questions", minAge: 14 },
  { slug: "psychology", emoji: "🧠", name: "Psychology", spark: "Understand the mind", minAge: 13 },
  { slug: "economics", emoji: "💰", name: "Economics", spark: "How the world trades", minAge: 14 },
  { slug: "geography", emoji: "🗺️", name: "Geography", spark: "Explore every corner of Earth", minAge: 6 },

  // Creative
  { slug: "design", emoji: "🎨", name: "Design", spark: "Make things beautiful", minAge: 10 },
  { slug: "music-theory", emoji: "🎵", name: "Music Theory", spark: "The math behind melody", minAge: 8 },
  { slug: "writing", emoji: "✍️", name: "Writing", spark: "Express your ideas", minAge: 8 },
  { slug: "photography", emoji: "📷", name: "Photography", spark: "See the world differently", minAge: 12 },
  { slug: "drawing", emoji: "✏️", name: "Drawing", spark: "Bring ideas to life", minAge: 6 },
  { slug: "storytelling", emoji: "📖", name: "Storytelling", spark: "Craft worlds with words", minAge: 6 },

  // Life & Practical
  { slug: "entrepreneurship", emoji: "🚀", name: "Startups", spark: "Build something new", minAge: 15 },
  { slug: "finance", emoji: "💵", name: "Personal Finance", spark: "Grow your wealth", minAge: 15 },
  { slug: "public-speaking", emoji: "🎤", name: "Public Speaking", spark: "Command any room", minAge: 12 },
  { slug: "fitness", emoji: "💪", name: "Fitness", spark: "Master your body", minAge: 10 },
  { slug: "nutrition", emoji: "🥗", name: "Nutrition", spark: "Fuel yourself right", minAge: 10 },
  { slug: "languages", emoji: "🌍", name: "Languages", spark: "Connect across cultures", minAge: 6 },
  { slug: "cooking", emoji: "🍳", name: "Cooking", spark: "Create delicious things", minAge: 8 },
  { slug: "reading", emoji: "📚", name: "Reading", spark: "Expand your world", minAge: 6 },

  // Kids-focused
  { slug: "animals", emoji: "🐾", name: "Animals", spark: "The amazing animal kingdom", minAge: 4, maxAge: 14 },
  { slug: "space", emoji: "🚀", name: "Space", spark: "Rockets, planets, and stars", minAge: 4, maxAge: 14 },
  { slug: "dinosaurs", emoji: "🦕", name: "Dinosaurs", spark: "Giants of the past", minAge: 4, maxAge: 12 },
  { slug: "inventions", emoji: "💡", name: "Inventions", spark: "Ideas that changed the world", minAge: 6, maxAge: 16 },
] as const;

type TopicItem = {
  slug: string;
  emoji: string;
  name: string;
  spark: string;
  minAge: number;
  maxAge?: number;
};

// ─── How It Works steps ─────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    icon: "💬",
    title: "Ask anything",
    description: "Type a question about anything — \"Why is the sky blue?\" or \"How does gravity work?\" There are no wrong questions.",
    color: "#6C63FF",
  },
  {
    icon: "🧭",
    title: "AI builds your path",
    description: "We figure out what you already know and create a personalized course — videos, explanations, and check-ins that adapt to you.",
    color: "#10B981",
  },
  {
    icon: "🎯",
    title: "Real understanding",
    description: "This isn't edutainment. When you finish a topic here, you'll genuinely understand and be able to apply those concepts. We make sure it sticks.",
    color: "#F59E0B",
  },
];

// ─── Floating particle animation ────────────────────────────────────────────

function FloatingParticle({ delay, x, size, color }: { delay: number; x: number; size: number; color: string }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-SCREEN_HEIGHT * 0.4, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 2000 }),
          withTiming(0.2, { duration: 4000 }),
          withTiming(0, { duration: 2000 })
        ),
        -1,
        false
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          bottom: -20,
          left: x,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animStyle,
      ]}
    />
  );
}

// ─── Main Onboarding ────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const [step, setStep] = useState(0); // 0=Welcome, 1=Age, 2=HowItWorks, 3=Topics
  const [selectedAge, setSelectedAge] = useState<number | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const { dispatch } = useLearning();
  const router = useRouter();
  const colors = useColors();
  const refreshMutation = trpc.feed.refresh.useMutation();

  const TOTAL_STEPS = 4;

  // Filter topics by age
  const curatedTopics = useMemo(() => {
    if (!selectedAge) return ALL_TOPICS as unknown as TopicItem[];
    return (ALL_TOPICS as unknown as TopicItem[]).filter((t) => {
      const meetsMin = selectedAge >= t.minAge;
      const meetsMax = t.maxAge ? selectedAge <= t.maxAge : true;
      return meetsMin && meetsMax;
    });
  }, [selectedAge]);

  const toggleTopic = useCallback((slug: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTopics((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  const [isFinishing, setIsFinishing] = useState(false);

  const handleFinish = useCallback(() => {
    if (isFinishing) return;
    setIsFinishing(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (selectedAge) dispatch({ type: "SET_AGE", payload: selectedAge });
    dispatch({ type: "SET_INTERESTS", payload: selectedTopics });
    dispatch({ type: "SET_SKILL_LEVEL", payload: "beginner" });
    dispatch({ type: "SET_DAILY_GOAL", payload: 10 });
    dispatch({ type: "SET_FORMAT", payload: "mixed" });
    dispatch({ type: "COMPLETE_ONBOARDING" });
    dispatch({ type: "UPDATE_STREAK" });

    // Fire-and-forget: start fetching content in background
    // The Home tab's auto-refresh will detect empty feed and show skeleton loading
    // If this succeeds, the Home tab will pick up the data on its next refetch
    refreshMutation.mutate({ topicSlugs: selectedTopics.slice(0, 5) });

    // Navigate immediately — Home tab shows skeleton loading while content loads
    router.replace("/(tabs)");
  }, [isFinishing, selectedTopics, dispatch, router, refreshMutation]);

  const canProceed = step === 1 ? selectedAge !== null : step === 3 ? selectedTopics.length >= 1 : true;

  const goNext = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  }, [step, handleFinish]);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1">
      <View style={styles.container}>
        {/* ─── Step 0: Welcome — The Invitation ─── */}
        {step === 0 && (
          <View style={styles.fullStep}>
            <View style={styles.particleContainer}>
              <FloatingParticle delay={0} x={SCREEN_WIDTH * 0.1} size={8} color={`${colors.primary}40`} />
              <FloatingParticle delay={1200} x={SCREEN_WIDTH * 0.3} size={6} color={`${colors.primary}30`} />
              <FloatingParticle delay={2400} x={SCREEN_WIDTH * 0.5} size={10} color={`${colors.primary}20`} />
              <FloatingParticle delay={800} x={SCREEN_WIDTH * 0.7} size={7} color={`${colors.primary}35`} />
              <FloatingParticle delay={3000} x={SCREEN_WIDTH * 0.85} size={5} color={`${colors.primary}25`} />
            </View>

            <Pressable onPress={goNext} style={{ flex: 1, justifyContent: "center" }}>
            <View style={styles.welcomeContent}>
              <Animated.View entering={FadeIn.duration(800)} style={styles.brandMark}>
                <Text style={styles.brandEmoji}>✨</Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(300).duration(700)}>
                <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>
                  Anyone can learn{"\n"}anything.
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(600).duration(700)}>
                <Text style={[styles.welcomePhilosophy, { color: colors.muted }]}>
                  Your curiosity is the curriculum. Ask a question, explore an idea, follow your wonder — and we'll build a learning path that's uniquely yours.
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(900).duration(700)} style={styles.invitationContainer}>
                <View style={[styles.invitationCard, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}20` }]}>
                  <Text style={[styles.invitationText, { color: colors.foreground }]}>
                    Real education that adapts to you.{"\n"}Not a pastime — genuine understanding.
                  </Text>
                </View>
              </Animated.View>
            </View>
            </Pressable>

            <Animated.View entering={FadeInUp.delay(1200).duration(600)} style={styles.welcomeBottom}>
              <Pressable
                onPress={goNext}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <Text style={styles.primaryBtnText}>Get started</Text>
              </Pressable>
            </Animated.View>
          </View>
        )}

        {/* ─── Step 1: How old are you? ─── */}
        {step === 1 && (
          <View style={styles.fullStep}>
            <View style={styles.ageContent}>
              <Animated.View entering={FadeInDown.duration(500)}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  How old are you?
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
                  This helps us pick the right topics and teaching style for you.
                </Text>
              </Animated.View>

              <View style={styles.ageGrid}>
                {AGE_RANGES.map((range, index) => {
                  const isSelected = selectedAge === range.value;
                  return (
                    <Animated.View
                      key={range.value}
                      entering={FadeInDown.delay(100 + index * 80).duration(400)}
                    >
                      <Pressable
                        onPress={() => {
                          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedAge(range.value);
                        }}
                        style={({ pressed }) => [
                          styles.ageCard,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.surface,
                            borderColor: isSelected ? colors.primary : colors.border,
                            opacity: pressed ? 0.9 : 1,
                            transform: [{ scale: pressed ? 0.96 : 1 }],
                          },
                        ]}
                      >
                        <Text style={styles.ageEmoji}>{range.emoji}</Text>
                        <Text
                          style={[
                            styles.ageLabel,
                            { color: isSelected ? "#FFFFFF" : colors.foreground },
                          ]}
                        >
                          {range.label}
                        </Text>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
            </View>

            <View style={styles.bottomBar}>
              <Pressable
                onPress={goBack}
                style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Text style={[styles.backText, { color: colors.muted }]}>Back</Text>
              </Pressable>
              <Pressable
                onPress={goNext}
                disabled={!canProceed}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  {
                    flex: 1,
                    backgroundColor: canProceed ? colors.primary : colors.border,
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <Text style={styles.primaryBtnText}>
                  {selectedAge ? "Continue" : "Select your age"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ─── Step 2: How It Works ─── */}
        {step === 2 && (
          <View style={styles.fullStep}>
            <ScrollView
              style={styles.howItWorksScroll}
              contentContainerStyle={styles.howItWorksContent}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View entering={FadeInDown.duration(500)}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  How it works
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
                  Learning that adapts to you — not the other way around.
                </Text>
              </Animated.View>

              <View style={styles.howCardsContainer}>
                {HOW_IT_WORKS.map((item, index) => (
                  <Animated.View
                    key={index}
                    entering={FadeInDown.delay(200 + index * 200).duration(500)}
                  >
                    <View
                      style={[
                        styles.howCard,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}
                    >
                      <View style={styles.howCardHeader}>
                        <View style={[styles.howCardIconBg, { backgroundColor: `${item.color}15` }]}>
                          <Text style={styles.howCardIcon}>{item.icon}</Text>
                        </View>
                        <View style={[styles.howCardStep, { backgroundColor: `${item.color}20` }]}>
                          <Text style={[styles.howCardStepText, { color: item.color }]}>{index + 1}</Text>
                        </View>
                      </View>
                      <Text style={[styles.howCardTitle, { color: colors.foreground }]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.howCardDesc, { color: colors.muted }]}>
                        {item.description}
                      </Text>
                    </View>
                  </Animated.View>
                ))}
              </View>

              <Animated.View entering={FadeInDown.delay(900).duration(500)}>
                <View style={[styles.philosophyNote, { backgroundColor: `${colors.primary}08`, borderColor: `${colors.primary}15` }]}>
                  <Text style={styles.philosophyNoteIcon}>🎓</Text>
                  <Text style={[styles.philosophyNoteText, { color: colors.muted }]}>
                    Built on learning science — spaced repetition, active recall, and adaptive difficulty — so what you learn actually sticks.
                  </Text>
                </View>
              </Animated.View>
            </ScrollView>

            <View style={styles.bottomBar}>
              <Pressable
                onPress={goBack}
                style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Text style={[styles.backText, { color: colors.muted }]}>Back</Text>
              </Pressable>
              <Pressable
                onPress={goNext}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  {
                    flex: 1,
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <Text style={styles.primaryBtnText}>Choose your interests</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ─── Step 3: What sparks your curiosity? (Age-curated) ─── */}
        {step === 3 && (
          <View style={styles.fullStep}>
            <Animated.View entering={FadeInDown.duration(400)} style={styles.topicsHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                What sparks your curiosity?
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
                Pick a few ideas that excite you. You can always explore more later.
              </Text>
            </Animated.View>

            <ScrollView
              style={styles.topicsScroll}
              contentContainerStyle={styles.topicsGrid}
              showsVerticalScrollIndicator={false}
            >
              {curatedTopics.map((topic, index) => {
                const selected = selectedTopics.includes(topic.slug);
                return (
                  <Animated.View
                    key={topic.slug}
                    entering={FadeIn.delay(50 + Math.min(index, 12) * 40).duration(300)}
                  >
                    <Pressable
                      onPress={() => toggleTopic(topic.slug)}
                      style={({ pressed }) => [
                        styles.topicChip,
                        {
                          backgroundColor: selected ? colors.primary : colors.surface,
                          borderColor: selected ? colors.primary : colors.border,
                          opacity: pressed ? 0.85 : 1,
                          transform: [{ scale: pressed ? 0.95 : 1 }],
                        },
                      ]}
                    >
                      <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                      <View style={styles.topicTextWrap}>
                        <Text
                          style={[
                            styles.topicName,
                            { color: selected ? "#FFFFFF" : colors.foreground },
                          ]}
                          numberOfLines={1}
                        >
                          {topic.name}
                        </Text>
                        <Text
                          style={[
                            styles.topicSpark,
                            { color: selected ? "rgba(255,255,255,0.75)" : colors.muted },
                          ]}
                          numberOfLines={1}
                        >
                          {topic.spark}
                        </Text>
                      </View>
                      {selected && (
                        <View style={styles.topicCheck}>
                          <Text style={styles.topicCheckText}>✓</Text>
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Optional sign-in hint + CTA */}
            <View style={styles.bottomBar}>
              <Pressable
                onPress={goBack}
                style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Text style={[styles.backText, { color: colors.muted }]}>Back</Text>
              </Pressable>
              <Pressable
                onPress={goNext}
                disabled={!canProceed || isFinishing}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  {
                    flex: 1,
                    backgroundColor: canProceed && !isFinishing ? colors.primary : colors.border,
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <Text style={styles.primaryBtnText}>
                  {isFinishing
                    ? "Preparing your content..."
                    : selectedTopics.length === 0
                    ? "Pick at least one"
                    : `Start learning ${selectedTopics.length > 1 ? `(${selectedTopics.length} topics)` : ""}`}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  fullStep: { flex: 1 },

  // ── Welcome (Step 0) ──
  particleContainer: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  welcomeContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingBottom: 8,
  },
  brandMark: { marginBottom: 20 },
  brandEmoji: { fontSize: 48 },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  welcomePhilosophy: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 23,
    marginTop: 14,
    paddingHorizontal: 4,
  },
  invitationContainer: { marginTop: 24, width: "100%" },
  invitationCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
  },
  invitationText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
  },
  welcomeBottom: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: "center",
    gap: 10,
  },

  // ── Age Selection (Step 1) ──
  ageContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  ageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 24,
    justifyContent: "center",
  },
  ageCard: {
    width: (SCREEN_WIDTH - 72) / 2,
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    gap: 8,
  },
  ageEmoji: { fontSize: 32 },
  ageLabel: { fontSize: 16, fontWeight: "700" },

  // ── How It Works (Step 2) ──
  howItWorksScroll: { flex: 1 },
  howItWorksContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  howCardsContainer: { gap: 16 },
  howCard: { borderRadius: 20, borderWidth: 1, padding: 22 },
  howCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  howCardIconBg: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  howCardIcon: { fontSize: 28 },
  howCardStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  howCardStepText: { fontSize: 14, fontWeight: "800" },
  howCardTitle: { fontSize: 20, fontWeight: "700", marginBottom: 6 },
  howCardDesc: { fontSize: 14, lineHeight: 21 },
  philosophyNote: {
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  philosophyNoteIcon: { fontSize: 22, marginTop: 1 },
  philosophyNoteText: { flex: 1, fontSize: 13, lineHeight: 20 },

  // ── Topics (Step 3) ──
  topicsHeader: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 4 },
  topicsScroll: { flex: 1 },
  topicsGrid: { paddingHorizontal: 20, paddingTop: 8, gap: 10 },
  topicChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  topicEmoji: { fontSize: 24 },
  topicTextWrap: { flex: 1 },
  topicName: { fontSize: 16, fontWeight: "700", lineHeight: 20 },
  topicSpark: { fontSize: 12, lineHeight: 16, marginTop: 1 },
  topicCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  topicCheckText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },

  // ── Shared bottom bar ──
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  backBtn: { paddingHorizontal: 16, paddingVertical: 14 },
  backText: { fontSize: 16, fontWeight: "600" },
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    width: "100%",
  },
  primaryBtnText: { color: "#FFF", fontSize: 17, fontWeight: "700" },
});
