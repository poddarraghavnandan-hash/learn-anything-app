import { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
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
  FadeInRight,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Topics as curiosities, not checkboxes ──────────────────────────────────

const CURIOSITIES = [
  { slug: "python", emoji: "🐍", name: "Python", spark: "Build anything with code" },
  { slug: "javascript", emoji: "⚡", name: "JavaScript", spark: "Power the web" },
  { slug: "machine-learning", emoji: "🤖", name: "AI & Machine Learning", spark: "Teach machines to think" },
  { slug: "data-science", emoji: "📊", name: "Data Science", spark: "Find stories in numbers" },
  { slug: "web-development", emoji: "🌐", name: "Web Development", spark: "Create for the internet" },
  { slug: "physics", emoji: "⚛️", name: "Physics", spark: "Understand how everything works" },
  { slug: "quantum-physics", emoji: "🔬", name: "Quantum Physics", spark: "Explore the impossible" },
  { slug: "astronomy", emoji: "🔭", name: "Astronomy", spark: "Wonder at the cosmos" },
  { slug: "biology", emoji: "🧬", name: "Biology", spark: "Decode life itself" },
  { slug: "mathematics", emoji: "🔢", name: "Mathematics", spark: "The language of the universe" },
  { slug: "chemistry", emoji: "🧪", name: "Chemistry", spark: "What everything is made of" },
  { slug: "history", emoji: "📜", name: "History", spark: "Learn from the past" },
  { slug: "philosophy", emoji: "💭", name: "Philosophy", spark: "Ask the deepest questions" },
  { slug: "psychology", emoji: "🧠", name: "Psychology", spark: "Understand the mind" },
  { slug: "economics", emoji: "💰", name: "Economics", spark: "How the world trades" },
  { slug: "entrepreneurship", emoji: "🚀", name: "Startups", spark: "Build something new" },
  { slug: "design", emoji: "🎨", name: "Design", spark: "Make things beautiful" },
  { slug: "music-theory", emoji: "🎵", name: "Music Theory", spark: "The math behind melody" },
  { slug: "writing", emoji: "✍️", name: "Writing", spark: "Express your ideas" },
  { slug: "photography", emoji: "📷", name: "Photography", spark: "See the world differently" },
  { slug: "reading", emoji: "📖", name: "Reading", spark: "Expand your world" },
  { slug: "fitness", emoji: "💪", name: "Fitness", spark: "Master your body" },
  { slug: "nutrition", emoji: "🥗", name: "Nutrition", spark: "Fuel yourself right" },
  { slug: "finance", emoji: "💵", name: "Personal Finance", spark: "Grow your wealth" },
  { slug: "public-speaking", emoji: "🎤", name: "Public Speaking", spark: "Command any room" },
  { slug: "marketing", emoji: "📣", name: "Marketing", spark: "Spread ideas that stick" },
  { slug: "productivity", emoji: "⏱️", name: "Productivity", spark: "Do more with less" },
  { slug: "languages", emoji: "🌍", name: "Languages", spark: "Connect across cultures" },
];

// ─── How It Works steps ─────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    icon: "💬",
    title: "Ask anything",
    description: "Type a question about anything that interests you. \"Why is the sky blue?\" \"How do stocks work?\" There are no wrong questions.",
    color: "#6C63FF",
  },
  {
    icon: "🧭",
    title: "Your path unfolds",
    description: "AI understands what you already know and builds a personalized learning path — just for you. Videos, explanations, and gentle check-ins along the way.",
    color: "#10B981",
  },
  {
    icon: "🌱",
    title: "Grow at your pace",
    description: "The app remembers what you've learned and adapts to how you think. No tests, no pressure — just genuine understanding that deepens over time.",
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
  const [step, setStep] = useState(0);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const { dispatch } = useLearning();
  const router = useRouter();
  const colors = useColors();
  const refreshMutation = trpc.feed.refresh.useMutation();

  const TOTAL_STEPS = 3;

  const toggleTopic = useCallback((slug: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTopics((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  const handleFinish = useCallback(async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    dispatch({ type: "SET_INTERESTS", payload: selectedTopics });
    dispatch({ type: "SET_SKILL_LEVEL", payload: "beginner" }); // AI will discover real level naturally
    dispatch({ type: "SET_DAILY_GOAL", payload: 10 }); // Sensible default, adjustable later
    dispatch({ type: "SET_FORMAT", payload: "mixed" }); // Best of both worlds
    dispatch({ type: "COMPLETE_ONBOARDING" });
    dispatch({ type: "UPDATE_STREAK" });

    // Start fetching content in background
    refreshMutation.mutate({ topicSlugs: selectedTopics.slice(0, 5), skillLevel: "beginner" });

    router.replace("/(tabs)");
  }, [selectedTopics, dispatch, router, refreshMutation]);

  const canProceed = step === 2 ? selectedTopics.length >= 1 : true;

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
            {/* Floating particles background */}
            <View style={styles.particleContainer}>
              <FloatingParticle delay={0} x={SCREEN_WIDTH * 0.1} size={8} color={`${colors.primary}40`} />
              <FloatingParticle delay={1200} x={SCREEN_WIDTH * 0.3} size={6} color={`${colors.primary}30`} />
              <FloatingParticle delay={2400} x={SCREEN_WIDTH * 0.5} size={10} color={`${colors.primary}20`} />
              <FloatingParticle delay={800} x={SCREEN_WIDTH * 0.7} size={7} color={`${colors.primary}35`} />
              <FloatingParticle delay={3000} x={SCREEN_WIDTH * 0.85} size={5} color={`${colors.primary}25`} />
            </View>

            <View style={styles.welcomeContent}>
              {/* App icon / brand mark */}
              <Animated.View entering={FadeIn.duration(800)} style={styles.brandMark}>
                <Text style={styles.brandEmoji}>✨</Text>
              </Animated.View>

              {/* Main headline */}
              <Animated.View entering={FadeInDown.delay(300).duration(700)}>
                <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>
                  Anyone can learn{"\n"}anything.
                </Text>
              </Animated.View>

              {/* Philosophy statement */}
              <Animated.View entering={FadeInDown.delay(600).duration(700)}>
                <Text style={[styles.welcomePhilosophy, { color: colors.muted }]}>
                  Your curiosity is the curriculum. Ask a question, explore an idea, follow your wonder — and we'll build a learning path that's uniquely yours.
                </Text>
              </Animated.View>

              {/* Gentle invitation */}
              <Animated.View entering={FadeInDown.delay(900).duration(700)} style={styles.invitationContainer}>
                <View style={[styles.invitationCard, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}20` }]}>
                  <Text style={[styles.invitationText, { color: colors.foreground }]}>
                    No sign-ups. No tests. No wrong answers.{"\n"}Just you and your curiosity.
                  </Text>
                </View>
              </Animated.View>
            </View>

            {/* Bottom CTA */}
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
                <Text style={styles.primaryBtnText}>Begin exploring</Text>
              </Pressable>
              <Text style={[styles.welcomeFootnote, { color: colors.muted }]}>
                Free forever. No account needed.
              </Text>
            </Animated.View>
          </View>
        )}

        {/* ─── Step 1: How It Works ─── */}
        {step === 1 && (
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

              {/* How it works cards */}
              <View style={styles.howCardsContainer}>
                {HOW_IT_WORKS.map((item, index) => (
                  <Animated.View
                    key={index}
                    entering={FadeInDown.delay(200 + index * 200).duration(500)}
                  >
                    <View
                      style={[
                        styles.howCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
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

              {/* Philosophy note */}
              <Animated.View entering={FadeInDown.delay(900).duration(500)}>
                <View style={[styles.philosophyNote, { backgroundColor: `${colors.primary}08`, borderColor: `${colors.primary}15` }]}>
                  <Text style={styles.philosophyNoteIcon}>🎓</Text>
                  <Text style={[styles.philosophyNoteText, { color: colors.muted }]}>
                    Built on learning science — spaced repetition, active recall, and the forgetting curve — so what you learn actually sticks.
                  </Text>
                </View>
              </Animated.View>
            </ScrollView>

            {/* Bottom navigation */}
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

        {/* ─── Step 2: What sparks your curiosity? ─── */}
        {step === 2 && (
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
              {CURIOSITIES.map((topic, index) => {
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

            {/* Selection count + CTA */}
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
                  {selectedTopics.length === 0
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
  container: {
    flex: 1,
  },
  fullStep: {
    flex: 1,
  },

  // ── Welcome (Step 0) ──
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  welcomeContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingBottom: 8,
  },
  brandMark: {
    marginBottom: 20,
  },
  brandEmoji: {
    fontSize: 48,
  },
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
  invitationContainer: {
    marginTop: 24,
    width: "100%",
  },
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
  welcomeFootnote: {
    fontSize: 13,
    textAlign: "center",
  },

  // ── How It Works (Step 1) ──
  howItWorksScroll: {
    flex: 1,
  },
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
  howCardsContainer: {
    gap: 16,
  },
  howCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
  },
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
  howCardIcon: {
    fontSize: 28,
  },
  howCardStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  howCardStepText: {
    fontSize: 14,
    fontWeight: "800",
  },
  howCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  howCardDesc: {
    fontSize: 14,
    lineHeight: 21,
  },
  philosophyNote: {
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  philosophyNoteIcon: {
    fontSize: 22,
    marginTop: 1,
  },
  philosophyNoteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },

  // ── Topics (Step 2) ──
  topicsHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 4,
  },
  topicsScroll: {
    flex: 1,
  },
  topicsGrid: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 10,
  },
  topicChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  topicEmoji: {
    fontSize: 24,
  },
  topicTextWrap: {
    flex: 1,
  },
  topicName: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
  },
  topicSpark: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
  },
  topicCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  topicCheckText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  // ── Shared bottom bar ──
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backText: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    width: "100%",
  },
  primaryBtnText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
