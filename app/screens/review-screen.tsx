import { ScrollView, Text, View, Pressable, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn, SlideInUp } from "react-native-reanimated";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

interface ReviewConcept {
  conceptId: number;
  conceptName: string;
  daysOverdue: number;
  mastery: number; // 0-100
  priority: "urgent" | "high" | "medium" | "low";
}

/**
 * Review Screen - Spaced Repetition Review Session
 * 
 * Shows concepts due for review using spaced repetition algorithm.
 * Users review concepts to reinforce learning and optimize retention.
 */
export default function ReviewScreen() {
  const colors = useColors();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [concepts, setConcepts] = useState<ReviewConcept[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [responses, setResponses] = useState<Array<{ conceptId: number; quality: number }>>([]);

  useEffect(() => {
    loadConceptsForReview();
  }, []);

  const loadConceptsForReview = async () => {
    try {
      setLoading(true);
      // Simulate API call to fetch concepts due for review
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Mock data - in real app, fetch from backend
      const mockConcepts: ReviewConcept[] = [
        {
          conceptId: 1,
          conceptName: "Quantum Superposition",
          daysOverdue: 2,
          mastery: 65,
          priority: "high",
        },
        {
          conceptId: 2,
          conceptName: "Wave-Particle Duality",
          daysOverdue: 0,
          mastery: 72,
          priority: "medium",
        },
        {
          conceptId: 3,
          conceptName: "Uncertainty Principle",
          daysOverdue: -1,
          mastery: 58,
          priority: "medium",
        },
      ];

      setConcepts(mockConcepts);
    } catch (error) {
      console.error("Error loading concepts for review:", error);
    } finally {
      setLoading(false);
    }
  };

  const startSession = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSessionStarted(true);
  };

  const handleQualityResponse = async (quality: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const current = concepts[currentIndex];
    if (current) {
      setResponses([...responses, { conceptId: current.conceptId, quality }]);
    }

    // Move to next concept or end session
    if (currentIndex < concepts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Session complete
      endSession();
    }
  };

  const endSession = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // In real app, save responses to backend
    console.log("Review session complete:", responses);
    router.back();
  };

  if (loading) {
    return (
      <ScreenContainer className="p-4">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.muted }}>Loading concepts for review...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (concepts.length === 0) {
    return (
      <ScreenContainer className="p-4">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <MaterialIcons name="check-circle" size={64} color={colors.success} />
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground, marginTop: 16 }}>
            All caught up!
          </Text>
          <Text style={{ fontSize: 16, color: colors.muted, marginTop: 8, textAlign: "center" }}>
            No concepts need review right now. Keep learning and we'll bring them back when it's time!
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{ marginTop: 24, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 8 }}
          >
            <Text style={{ color: colors.background, fontWeight: "600", textAlign: "center" }}>Back to Home</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  if (!sessionStarted) {
    return (
      <ScreenContainer className="p-4">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn.duration(300)} style={{ paddingTop: 24 }}>
            <Text style={{ fontSize: 28, fontWeight: "700", color: colors.foreground }}>
              Time to Review
            </Text>
            <Text style={{ fontSize: 16, color: colors.muted, marginTop: 8 }}>
              You have {concepts.length} concept{concepts.length !== 1 ? "s" : ""} ready for review
            </Text>
          </Animated.View>

          {/* Concepts Overview */}
          <Animated.View entering={SlideInUp.duration(400).delay(100)} style={{ marginTop: 24, gap: 12 }}>
            {concepts.map((concept, index) => (
              <View
                key={concept.conceptId}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  borderLeftWidth: 4,
                  borderLeftColor:
                    concept.priority === "urgent"
                      ? colors.error
                      : concept.priority === "high"
                      ? colors.warning
                      : colors.primary,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                      {concept.conceptName}
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
                      Mastery: {concept.mastery}%
                    </Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 12, color: colors.muted }}>
                      {concept.daysOverdue > 0 ? `${concept.daysOverdue}d overdue` : "Due soon"}
                    </Text>
                  </View>
                </View>

                {/* Mastery Progress Bar */}
                <View style={{ marginTop: 12, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" }}>
                  <View
                    style={{
                      height: "100%",
                      width: `${concept.mastery}%`,
                      backgroundColor: concept.mastery > 70 ? colors.success : colors.warning,
                    }}
                  />
                </View>
              </View>
            ))}
          </Animated.View>

          {/* Start Button */}
          <Animated.View entering={SlideInUp.duration(400).delay(200)} style={{ marginTop: 32, marginBottom: 24 }}>
            <Pressable
              onPress={startSession}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: "center",
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={{ color: colors.background, fontSize: 16, fontWeight: "700" }}>
                Start Review Session
              </Text>
            </Pressable>
          </Animated.View>

          {/* Info Card */}
          <View style={{ backgroundColor: colors.primary + "15", borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary, marginBottom: 8 }}>
              💡 How Spaced Repetition Works
            </Text>
            <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 20 }}>
              Review concepts at optimal intervals based on your performance. The better you know something, the longer we wait before asking again. This maximizes retention while minimizing study time.
            </Text>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Review Session Active
  const current = concepts[currentIndex];
  const progress = ((currentIndex + 1) / concepts.length) * 100;

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Progress Bar */}
        <Animated.View entering={FadeIn.duration(300)} style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
              {currentIndex + 1} of {concepts.length}
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted }}>
              {Math.round(progress)}%
            </Text>
          </View>
          <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: "hidden" }}>
            <View
              style={{
                height: "100%",
                width: `${progress}%`,
                backgroundColor: colors.primary,
              }}
            />
          </View>
        </Animated.View>

        {/* Concept Card */}
        <Animated.View
          entering={SlideInUp.duration(400)}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 24,
            marginVertical: 32,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: "700", color: colors.foreground, textAlign: "center" }}>
            {current.conceptName}
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 12 }}>
            How well do you remember this concept?
          </Text>
        </Animated.View>

        {/* Quality Response Buttons */}
        <Animated.View entering={SlideInUp.duration(400).delay(100)} style={{ gap: 12, marginBottom: 24 }}>
          <Pressable
            onPress={() => handleQualityResponse(0)}
            style={({ pressed }) => [
              {
                backgroundColor: colors.error + "20",
                borderWidth: 2,
                borderColor: colors.error,
                borderRadius: 12,
                paddingVertical: 16,
                paddingHorizontal: 12,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={{ color: colors.error, fontWeight: "600", fontSize: 16, textAlign: "center" }}>
              ❌ Blackout (forgot completely)
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleQualityResponse(1)}
            style={({ pressed }) => [
              {
                backgroundColor: colors.error + "15",
                borderWidth: 2,
                borderColor: colors.error,
                borderRadius: 12,
                paddingVertical: 16,
                paddingHorizontal: 12,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={{ color: colors.error, fontWeight: "600", fontSize: 16, textAlign: "center" }}>
              ❌ Incorrect (got it wrong)
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleQualityResponse(2)}
            style={({ pressed }) => [
              {
                backgroundColor: colors.warning + "20",
                borderWidth: 2,
                borderColor: colors.warning,
                borderRadius: 12,
                paddingVertical: 16,
                paddingHorizontal: 12,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={{ color: colors.warning, fontWeight: "600", fontSize: 16, textAlign: "center" }}>
              ⚠️ Incorrect but close
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleQualityResponse(3)}
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary + "20",
                borderWidth: 2,
                borderColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 16,
                paddingHorizontal: 12,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 16, textAlign: "center" }}>
              ✓ Correct (with difficulty)
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleQualityResponse(4)}
            style={({ pressed }) => [
              {
                backgroundColor: colors.success + "20",
                borderWidth: 2,
                borderColor: colors.success,
                borderRadius: 12,
                paddingVertical: 16,
                paddingHorizontal: 12,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={{ color: colors.success, fontWeight: "600", fontSize: 16, textAlign: "center" }}>
              ✓✓ Correct (easy)
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}
