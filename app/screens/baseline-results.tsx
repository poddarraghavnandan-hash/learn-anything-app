import { ScrollView, Text, View, Pressable } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn, SlideInUp } from "react-native-reanimated";
import { useRouter, useLocalSearchParams } from "expo-router";

interface BaselineProfile {
  priorKnowledgeLevel: "novice" | "beginner" | "intermediate" | "advanced";
  learningStyle: "visual" | "kinesthetic" | "auditory" | "reading";
  confidenceLevel: "low" | "medium" | "high";
  recommendedDifficulty: "beginner" | "intermediate" | "advanced";
  recommendedPace: "slow" | "moderate" | "fast";
  insights: string[];
}

/**
 * Baseline Results Screen
 * 
 * Shows personalized assessment results and recommendations
 * for starting the learning path
 */
export default function BaselineResultsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { topic = "Physics Fundamentals" } = useLocalSearchParams<{ topic: string }>();

  // Mock profile - in real app, this comes from backend analysis
  const profile: BaselineProfile = {
    priorKnowledgeLevel: "beginner",
    learningStyle: "visual",
    confidenceLevel: "medium",
    recommendedDifficulty: "beginner",
    recommendedPace: "moderate",
    insights: [
      "You're starting fresh—that's great! We'll build a strong foundation.",
      "Your learning style is visual—we'll tailor content to match.",
      "You're confident enough to learn, but take it step-by-step.",
    ],
  };

  const getEmoji = (value: string): string => {
    const emojiMap: Record<string, string> = {
      novice: "🌱",
      beginner: "🌱",
      intermediate: "🌿",
      advanced: "🌳",
      visual: "👁️",
      kinesthetic: "🤲",
      auditory: "👂",
      reading: "📖",
      low: "😟",
      medium: "😊",
      high: "🚀",
      slow: "🐢",
      moderate: "🚶",
      fast: "🏃",
    };
    return emojiMap[value] || "✨";
  };

  const startLearning = () => {
    // Navigate to learning path with personalization
    router.push({
      pathname: "/screens/learning-path-detail",
      params: {
        topic,
        difficulty: profile.recommendedDifficulty,
        pace: profile.recommendedPace,
      },
    });
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <MaterialIcons name="check-circle" size={32} color={colors.success} />
            <View>
              <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground }}>
                Assessment Complete!
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
                Here's your personalized profile
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Profile Cards */}
        <Animated.View entering={SlideInUp.duration(400).delay(100)} style={{ gap: 12, marginBottom: 24 }}>
          {/* Prior Knowledge */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: colors.primary,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 14, color: colors.muted, fontWeight: "600" }}>
                Prior Knowledge
              </Text>
              <Text style={{ fontSize: 24 }}>
                {getEmoji(profile.priorKnowledgeLevel)}
              </Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginTop: 8, textTransform: "capitalize" }}>
              {profile.priorKnowledgeLevel}
            </Text>
          </View>

          {/* Learning Style */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: colors.primary,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 14, color: colors.muted, fontWeight: "600" }}>
                Learning Style
              </Text>
              <Text style={{ fontSize: 24 }}>
                {getEmoji(profile.learningStyle)}
              </Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginTop: 8, textTransform: "capitalize" }}>
              {profile.learningStyle}
            </Text>
          </View>

          {/* Confidence */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: colors.primary,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 14, color: colors.muted, fontWeight: "600" }}>
                Confidence Level
              </Text>
              <Text style={{ fontSize: 24 }}>
                {getEmoji(profile.confidenceLevel)}
              </Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginTop: 8, textTransform: "capitalize" }}>
              {profile.confidenceLevel}
            </Text>
          </View>
        </Animated.View>

        {/* Recommendations */}
        <Animated.View entering={SlideInUp.duration(400).delay(150)} style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            📋 Recommendations
          </Text>
          <View style={{ gap: 8 }}>
            <View style={{ backgroundColor: colors.primary + "15", borderRadius: 12, padding: 12 }}>
              <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "600" }}>
                Difficulty Level
              </Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary, marginTop: 4, textTransform: "capitalize" }}>
                {profile.recommendedDifficulty}
              </Text>
            </View>
            <View style={{ backgroundColor: colors.primary + "15", borderRadius: 12, padding: 12 }}>
              <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "600" }}>
                Learning Pace
              </Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary, marginTop: 4, textTransform: "capitalize" }}>
                {profile.recommendedPace}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Insights */}
        <Animated.View entering={SlideInUp.duration(400).delay(200)} style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            💡 Personalized Insights
          </Text>
          <View style={{ gap: 8 }}>
            {profile.insights.map((insight, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 12,
                  borderLeftWidth: 3,
                  borderLeftColor: colors.success,
                }}
              >
                <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 20 }}>
                  {insight}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Start Button */}
        <Animated.View entering={SlideInUp.duration(400).delay(250)} style={{ marginBottom: 24 }}>
          <Pressable
            onPress={startLearning}
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={{ color: colors.background, fontSize: 16, fontWeight: "700" }}>
              Start Learning {topic}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Info */}
        <View style={{ backgroundColor: colors.border + "30", borderRadius: 12, padding: 12, marginBottom: 24 }}>
          <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 20 }}>
            You can always adjust your preferences later. We'll learn more about your style as you progress!
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
