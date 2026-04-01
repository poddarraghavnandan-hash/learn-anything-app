import { ScrollView, Text, View, Pressable, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn, SlideInUp } from "react-native-reanimated";

interface ReviewItem {
  id: string;
  title: string;
  topic: string;
  memoryStrength: number;
  nextReviewDate: string;
  interval: number;
  repetitions: number;
}

const reviewItems: ReviewItem[] = [
  {
    id: "1",
    title: "Quantum Superposition Principle",
    topic: "Physics",
    memoryStrength: 45,
    nextReviewDate: "Today",
    interval: 1,
    repetitions: 2,
  },
  {
    id: "2",
    title: "Neural Network Backpropagation",
    topic: "AI",
    memoryStrength: 62,
    nextReviewDate: "Tomorrow",
    interval: 3,
    repetitions: 3,
  },
  {
    id: "3",
    title: "Renaissance Art Movements",
    topic: "Art",
    memoryStrength: 78,
    nextReviewDate: "In 3 days",
    interval: 7,
    repetitions: 4,
  },
  {
    id: "4",
    title: "Photosynthesis Process",
    topic: "Biology",
    memoryStrength: 35,
    nextReviewDate: "Today",
    interval: 1,
    repetitions: 1,
  },
  {
    id: "5",
    title: "Python List Comprehensions",
    topic: "Code",
    memoryStrength: 88,
    nextReviewDate: "In 7 days",
    interval: 14,
    repetitions: 5,
  },
];

const getMemoryColor = (strength: number) => {
  if (strength >= 70) return "#10B981";
  if (strength >= 50) return "#F59E0B";
  return "#EF4444";
};

const getMemoryLabel = (strength: number) => {
  if (strength >= 70) return "Strong";
  if (strength >= 50) return "Moderate";
  return "Weak";
};

export default function ReviewScreen() {
  const colors = useColors();

  const dueCount = reviewItems.filter((item) => item.nextReviewDate === "Today").length;
  const totalCount = reviewItems.length;

  const renderReviewItem = (item: ReviewItem) => (
    <Animated.View key={item.id} entering={SlideInUp.duration(400).delay(100)}>
      <Pressable
        style={({ pressed }) => [
          {
            backgroundColor: colors.surface,
            borderRadius: 14,
            padding: 14,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: item.nextReviewDate === "Today" ? "#EF4444" : colors.border,
            opacity: pressed ? 0.8 : 1,
            flexDirection: "row",
            alignItems: "center",
          },
        ]}
      >
        {/* Status Indicator */}
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: item.nextReviewDate === "Today" ? "#EF4444" : "#10B981",
            marginRight: 12,
          }}
        />

        {/* Content */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
            {item.title}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Text style={{ fontSize: 12, color: colors.muted }}>{item.topic}</Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>•</Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>{item.repetitions} reviews</Text>
          </View>

          {/* Memory Strength Bar */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" }}>
              <View
                style={{
                  height: "100%",
                  width: `${item.memoryStrength}%`,
                  backgroundColor: getMemoryColor(item.memoryStrength),
                }}
              />
            </View>
            <Text style={{ fontSize: 11, color: colors.muted, minWidth: 40 }}>
              {item.memoryStrength}%
            </Text>
          </View>
        </View>

        {/* Next Review */}
        <View style={{ marginLeft: 12, alignItems: "flex-end" }}>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Next</Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: item.nextReviewDate === "Today" ? "#EF4444" : "#6C63FF",
            }}
          >
            {item.nextReviewDate}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground, marginBottom: 4 }}>
            Review Queue
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted }}>
            Strengthen your memory with spaced repetition
          </Text>
        </Animated.View>

        {/* Stats Cards */}
        <Animated.View entering={SlideInUp.duration(400).delay(50)} style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>Due Today</Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#EF4444" }}>{dueCount}</Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>Total Items</Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#6C63FF" }}>{totalCount}</Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>Avg Strength</Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#10B981" }}>
                {Math.round(reviewItems.reduce((sum, item) => sum + item.memoryStrength, 0) / totalCount)}%
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Priority Section */}
        {dueCount > 0 && (
          <Animated.View entering={SlideInUp.duration(400).delay(100)} style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <View
              style={{
                backgroundColor: "#EF444420",
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: "#EF4444",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <MaterialIcons name="priority-high" size={20} color="#EF4444" />
              <Text style={{ color: "#EF4444", fontWeight: "600", fontSize: 13, marginLeft: 8, flex: 1 }}>
                {dueCount} item{dueCount > 1 ? "s" : ""} due today for review
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Review Items */}
        <Animated.View entering={SlideInUp.duration(400).delay(150)} style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            Items to Review
          </Text>
          {reviewItems.map(renderReviewItem)}
        </Animated.View>

        {/* Spaced Repetition Info */}
        <Animated.View entering={SlideInUp.duration(400).delay(200)} style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <MaterialIcons name="info" size={20} color="#3B82F6" />
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginLeft: 8 }}>
                How Spaced Repetition Works
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>
              We use the SM-2 algorithm to optimize review timing based on your memory strength. Items with weaker memory are reviewed more frequently, while strong memories are reviewed less often. This maximizes retention with minimal effort.
            </Text>
          </View>
        </Animated.View>

        {/* Memory Strength Legend */}
        <Animated.View entering={SlideInUp.duration(400).delay(250)} style={{ paddingHorizontal: 16, marginBottom: 32 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            Memory Strength Levels
          </Text>

          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#EF4444",
                  marginRight: 10,
                }}
              />
              <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: "500" }}>Weak (0-50%)</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 8 }}>Review frequently</Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#F59E0B",
                  marginRight: 10,
                }}
              />
              <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: "500" }}>Moderate (50-70%)</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 8 }}>Review regularly</Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#10B981",
                  marginRight: 10,
                }}
              />
              <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: "500" }}>Strong (70%+)</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 8 }}>Review occasionally</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}
