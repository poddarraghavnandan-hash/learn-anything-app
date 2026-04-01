import { ScrollView, Text, View, TextInput, Pressable, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";
import { cn } from "@/lib/utils";

interface SuggestionChip {
  id: string;
  label: string;
  icon: string;
  color: string;
}

interface JourneyCard {
  id: string;
  title: string;
  category: string;
  emoji: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedTime: number;
  progress: number;
}

const suggestionChips: SuggestionChip[] = [
  { id: "1", label: "For You", icon: "favorite", color: "#6C63FF" },
  { id: "2", label: "Science", icon: "science", color: "#10B981" },
  { id: "3", label: "Code", icon: "code", color: "#3B82F6" },
  { id: "4", label: "AI", icon: "smart-toy", color: "#F59E0B" },
  { id: "5", label: "Humanities", icon: "history-edu", color: "#EC4899" },
];

const journeyCards: JourneyCard[] = [
  {
    id: "1",
    title: "Quantum Mechanics Basics",
    category: "Physics",
    emoji: "⚛️",
    difficulty: "Intermediate",
    estimatedTime: 15,
    progress: 0.65,
  },
  {
    id: "2",
    title: "Machine Learning Fundamentals",
    category: "AI",
    emoji: "🤖",
    difficulty: "Advanced",
    estimatedTime: 20,
    progress: 0.3,
  },
  {
    id: "3",
    title: "Renaissance Art History",
    category: "Art",
    emoji: "🎨",
    difficulty: "Beginner",
    estimatedTime: 12,
    progress: 0,
  },
];

export default function HomeScreen() {
  const colors = useColors();

  const renderSuggestionChip = (chip: SuggestionChip) => (
    <Pressable
      key={chip.id}
      style={({ pressed }) => [
        {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: chip.id === "1" ? chip.color : colors.surface,
          borderWidth: 1,
          borderColor: chip.id === "1" ? chip.color : colors.border,
          marginRight: 8,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        style={{
          color: chip.id === "1" ? "#FFFFFF" : colors.foreground,
          fontSize: 13,
          fontWeight: "600",
        }}
      >
        {chip.label}
      </Text>
    </Pressable>
  );

  const renderJourneyCard = (journey: JourneyCard) => (
    <Pressable
      key={journey.id}
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 28, marginBottom: 4 }}>{journey.emoji}</Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.foreground,
              marginBottom: 4,
            }}
            numberOfLines={2}
          >
            {journey.title}
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>
            {journey.category} • {journey.estimatedTime} min
          </Text>
        </View>
        <View
          style={{
            backgroundColor: "#6C63FF",
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 6,
            marginLeft: 8,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "600", color: "#FFFFFF" }}>
            {journey.difficulty}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View
        style={{
          height: 4,
          backgroundColor: colors.border,
          borderRadius: 2,
          overflow: "hidden",
          marginBottom: 12,
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${journey.progress * 100}%`,
            backgroundColor: "#6C63FF",
          }}
        />
      </View>

      {/* Start Button */}
      <Pressable
        style={({ pressed }) => [
          {
            backgroundColor: "#6C63FF",
            borderRadius: 10,
            paddingVertical: 10,
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 14 }}>
          {journey.progress > 0 ? "Continue Learning" : "Start Journey"}
        </Text>
      </Pressable>
    </Pressable>
  );

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              color: colors.foreground,
              marginBottom: 4,
            }}
          >
            Good morning
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted }}>
            What would you like to learn about today?
          </Text>
        </View>

        {/* Ask Bar */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surface,
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <MaterialIcons name="search" size={20} color={colors.muted} />
            <TextInput
              placeholder="Ask anything..."
              placeholderTextColor={colors.muted}
              style={{
                flex: 1,
                marginLeft: 10,
                fontSize: 14,
                color: colors.foreground,
              }}
              editable={false}
            />
            <MaterialIcons name="mic" size={20} color={colors.muted} />
          </View>
        </View>

        {/* Category Chips */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: colors.muted,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              paddingHorizontal: 16,
              marginBottom: 12,
            }}
          >
            Explore Learning Journeys
          </Text>
          <FlatList
            horizontal
            data={suggestionChips}
            renderItem={({ item }) => renderSuggestionChip(item)}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            showsHorizontalScrollIndicator={false}
          />
        </View>

        {/* Journey Cards */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: colors.foreground,
              }}
            >
              Personalized for You
            </Text>
            <Pressable>
              <Text style={{ color: "#6C63FF", fontWeight: "600", fontSize: 13 }}>
                See All
              </Text>
            </Pressable>
          </View>
          {journeyCards.map(renderJourneyCard)}
        </View>

        {/* Quick Stats */}
        <View
          style={{
            paddingHorizontal: 16,
            marginBottom: 24,
            flexDirection: "row",
            gap: 12,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>
              Current Streak
            </Text>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#FF9500" }}>
              7 days
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>
              XP Earned
            </Text>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#6C63FF" }}>
              2,450
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
