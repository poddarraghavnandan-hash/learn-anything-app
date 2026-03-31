import { ScrollView, Text, View, Pressable } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn, SlideInUp } from "react-native-reanimated";

interface LearningJourney {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  slug: string;
}

const learningJourneys: LearningJourney[] = [
  {
    id: "1",
    title: "Physics Fundamentals",
    description: "Quantum mechanics, relativity, and classical physics",
    icon: "science",
    color: "#10B981",
    slug: "physics-fundamentals",
  },
  {
    id: "2",
    title: "Machine Learning",
    description: "Neural networks, algorithms, and AI foundations",
    icon: "smart-toy",
    color: "#F59E0B",
    slug: "machine-learning",
  },
  {
    id: "3",
    title: "Web Development",
    description: "React, TypeScript, and modern web technologies",
    icon: "code",
    color: "#3B82F6",
    slug: "web-development",
  },
  {
    id: "4",
    title: "Art History",
    description: "Renaissance, impressionism, and modern art movements",
    icon: "palette",
    color: "#EC4899",
    slug: "art-history",
  },
];

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();

  const handleStartLearning = (journey: LearningJourney) => {
    router.push({
      pathname: "/topic/[slug]",
      params: {
        slug: journey.slug,
        name: journey.title,
        emoji: journey.icon,
      },
    });
  };

  const handleAskQuestion = () => {
    router.push("/(tabs)/ask");
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 }}>
          <Text style={{ fontSize: 32, fontWeight: "800", color: colors.foreground, marginBottom: 4 }}>
            Learn Anything
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted }}>
            Deepen your knowledge with structured learning paths
          </Text>
        </Animated.View>

        {/* Quick Action: Ask a Question */}
        <Animated.View entering={SlideInUp.duration(400).delay(50)} style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Pressable
            onPress={handleAskQuestion}
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                borderRadius: 14,
                paddingVertical: 16,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <MaterialIcons name="lightbulb" size={24} color="#FFFFFF" style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF", marginBottom: 2 }}>
                Ask a Question
              </Text>
              <Text style={{ fontSize: 12, color: "#FFFFFF", opacity: 0.9 }}>
                Get instant answers and explanations
              </Text>
            </View>
            <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
          </Pressable>
        </Animated.View>

        {/* Learning Journeys Section */}
        <Animated.View entering={SlideInUp.duration(400).delay(100)} style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            Learning Paths
          </Text>

          <View style={{ gap: 12 }}>
            {learningJourneys.map((journey, idx) => (
              <Animated.View
                key={journey.id}
                entering={SlideInUp.duration(400).delay(150 + idx * 50)}
              >
                <Pressable
                  onPress={() => handleStartLearning(journey)}
                  style={({ pressed }) => [
                    {
                      backgroundColor: colors.surface,
                      borderRadius: 14,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      opacity: pressed ? 0.8 : 1,
                      flexDirection: "row",
                      alignItems: "center",
                    },
                  ]}
                >
                  {/* Icon */}
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 12,
                      backgroundColor: journey.color + "20",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 14,
                    }}
                  >
                    <MaterialIcons name={journey.icon as any} size={28} color={journey.color} />
                  </View>

                  {/* Content */}
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
                      {journey.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 16 }} numberOfLines={2}>
                      {journey.description}
                    </Text>
                  </View>

                  {/* Arrow */}
                  <MaterialIcons name="arrow-forward" size={20} color={colors.muted} />
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Info Section */}
        <Animated.View entering={SlideInUp.duration(400).delay(400)} style={{ paddingHorizontal: 16, marginBottom: 32 }}>
          <View
            style={{
              backgroundColor: colors.primary + "10",
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.primary + "30",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <MaterialIcons name="info" size={20} color={colors.primary} style={{ marginRight: 10, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
                  How It Works
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 16 }}>
                  Choose a learning path, work through structured lessons, and master new skills at your own pace. Each path is designed for deep understanding, not surface-level knowledge.
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}
