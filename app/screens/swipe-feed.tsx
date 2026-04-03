import { View, Text, ScrollView, Pressable, RefreshControl, Dimensions, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { useState, useCallback, useRef } from "react";
import * as Haptics from "expo-haptics";
import { GestureHandlerRootView, PanGestureHandler, State } from "react-native-gesture-handler";
import { FeedCardData, FeedCardType } from "@/components/feed-card";

const { height: screenHeight } = Dimensions.get("window");

// Mock feed data - in production, this would come from API
const MOCK_FEED_DATA: FeedCardData[] = [
  {
    id: "1",
    type: "video",
    topic: "Physics",
    topicEmoji: "⚛️",
    title: "Understanding Quantum Entanglement",
    description: "Einstein called it 'spooky action at a distance'. Learn how particles can be connected across vast distances.",
    source: "Kurzgesagt",
    duration: 8,
    imageUrl: "https://via.placeholder.com/400x300?text=Quantum+Entanglement",
  },
  {
    id: "2",
    type: "quiz",
    topic: "Physics",
    topicEmoji: "⚛️",
    title: "Quick Check: Quantum Basics",
    question: "What is the Planck constant used for?",
    options: [
      "Measuring energy at quantum scale",
      "Calculating gravitational force",
      "Determining speed of light",
      "Measuring temperature",
    ],
    correctAnswer: 0,
    explanation: "The Planck constant (h) relates energy to frequency in quantum mechanics: E = hf",
  },
  {
    id: "3",
    type: "article",
    topic: "Physics",
    topicEmoji: "⚛️",
    title: "The Double-Slit Experiment Explained",
    description: "One of the most mind-bending experiments in physics that reveals the wave-particle duality of light.",
    source: "Physics Today",
    duration: 5,
    imageUrl: "https://via.placeholder.com/400x300?text=Double+Slit",
  },
  {
    id: "4",
    type: "video",
    topic: "Physics",
    topicEmoji: "⚛️",
    title: "Black Holes: Gravity's Ultimate Test",
    description: "Explore the most extreme objects in the universe where spacetime itself breaks down.",
    source: "PBS Space Time",
    duration: 12,
    imageUrl: "https://via.placeholder.com/400x300?text=Black+Holes",
  },
  {
    id: "5",
    type: "quiz",
    topic: "Physics",
    topicEmoji: "⚛️",
    title: "Quick Check: Relativity",
    question: "What happens to time near a massive object?",
    options: [
      "Time slows down",
      "Time speeds up",
      "Time stays the same",
      "Time becomes non-linear",
    ],
    correctAnswer: 0,
    explanation: "Gravitational time dilation: time moves slower in stronger gravitational fields.",
  },
];

interface CardReaction {
  id: string;
  type: "mind-blown" | "knew-this" | "save" | "skip";
}

export default function SwipeFeedScreen() {
  const colors = useColors();
  const [feedData, setFeedData] = useState<FeedCardData[]>(MOCK_FEED_DATA);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [reactions, setReactions] = useState<CardReaction[]>([]);

  const translateY = useSharedValue(0);
  const panRef = useRef(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
      // In production, fetch new feed data from API
    }, 1000);
  }, []);

  const handleReaction = async (type: CardReaction["type"]) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const currentCard = feedData[currentIndex];
    if (!currentCard) return;

    // Record reaction
    setReactions([...reactions, { id: currentCard.id, type }]);

    // Move to next card with animation
    if (currentIndex < feedData.length - 1) {
      setCurrentIndex(currentIndex + 1);
      translateY.value = withTiming(0, { duration: 300 });
    } else {
      // End of feed - show message
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handlePanGesture = (event: any) => {
    const { translationY, state } = event.nativeEvent;

    if (state === State.ACTIVE) {
      translateY.value = translationY;
    } else if (state === State.END) {
      // Swipe up to next card
      if (translationY < -50 && currentIndex < feedData.length - 1) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setCurrentIndex(currentIndex + 1);
        translateY.value = withTiming(0, { duration: 300 });
      } else {
        // Reset position
        translateY.value = withSpring(0);
      }
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: interpolate(
        Math.abs(translateY.value),
        [0, 200],
        [1, 0.5],
        Extrapolate.CLAMP
      ),
    };
  });

  const currentCard = feedData[currentIndex];

  if (!currentCard) {
    return (
      <ScreenContainer className="p-4">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            🎉 You've reached the end!
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center" }}>
            Great job reviewing all the content. Come back later for more!
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScreenContainer className="p-0">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(300)} style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground }}>
              📚 Learning Feed
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
              Card {currentIndex + 1} of {feedData.length}
            </Text>
          </Animated.View>

          {/* Progress Bar */}
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: "hidden" }}>
              <View
                style={{
                  height: "100%",
                  backgroundColor: colors.primary,
                  width: `${((currentIndex + 1) / feedData.length) * 100}%`,
                }}
              />
            </View>
          </View>

          {/* Feed Card */}
          <PanGestureHandler onHandlerStateChange={handlePanGesture} ref={panRef}>
            <Animated.View style={[{ paddingHorizontal: 16, marginBottom: 20 }, animatedStyle]}>
              <FeedCardRenderer card={currentCard} colors={colors} />
            </Animated.View>
          </PanGestureHandler>

          {/* Reaction Buttons */}
          <Animated.View entering={SlideInUp.duration(400).delay(200)} style={{ paddingHorizontal: 16, marginBottom: 32 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 12, textAlign: "center" }}>
              How did this help?
            </Text>
            <View style={{ flexDirection: "row", gap: 12, justifyContent: "center" }}>
              <ReactionButton
                icon="🤯"
                label="Mind Blown"
                onPress={() => handleReaction("mind-blown")}
                colors={colors}
              />
              <ReactionButton
                icon="✅"
                label="Knew This"
                onPress={() => handleReaction("knew-this")}
                colors={colors}
              />
              <ReactionButton
                icon="💾"
                label="Save"
                onPress={() => handleReaction("save")}
                colors={colors}
              />
              <ReactionButton
                icon="⏭️"
                label="Skip"
                onPress={() => handleReaction("skip")}
                colors={colors}
              />
            </View>
          </Animated.View>

          {/* Navigation Hint */}
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 11, color: colors.muted, textAlign: "center" }}>
              Swipe up or tap a reaction to continue
            </Text>
          </View>
        </ScrollView>
      </ScreenContainer>
    </GestureHandlerRootView>
  );
}

interface FeedCardRendererProps {
  card: FeedCardData;
  colors: any;
}

function FeedCardRenderer({ card, colors }: FeedCardRendererProps) {
  if (card.type === "video") {
    return (
      <View style={{ backgroundColor: colors.surface, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
        {/* Thumbnail */}
        <View style={{ height: 200, backgroundColor: colors.border, justifyContent: "center", alignItems: "center" }}>
          <MaterialIcons name="play-circle-filled" size={64} color={colors.primary} />
        </View>
        {/* Content */}
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontSize: 20, marginRight: 8 }}>{card.topicEmoji}</Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted }}>{card.topic}</Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginLeft: "auto" }}>⏱️ {card.duration}m</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
            {card.title}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 18, marginBottom: 12 }}>
            {card.description}
          </Text>
          <Text style={{ fontSize: 11, color: colors.muted }}>
            📺 {card.source}
          </Text>
        </View>
      </View>
    );
  }

  if (card.type === "quiz") {
    return (
      <View style={{ backgroundColor: colors.primary + "10", borderRadius: 16, padding: 16, borderWidth: 2, borderColor: colors.primary }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Text style={{ fontSize: 20, marginRight: 8 }}>❓</Text>
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>Quick Check</Text>
        </View>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 16 }}>
          {card.question}
        </Text>
        <View style={{ gap: 8 }}>
          {card.options?.map((option, idx) => (
            <Pressable
              key={idx}
              style={{
                backgroundColor: colors.background,
                borderRadius: 10,
                padding: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 13, color: colors.foreground }}>
                {String.fromCharCode(65 + idx)}) {option}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  if (card.type === "article") {
    return (
      <View style={{ backgroundColor: colors.surface, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
        {/* Thumbnail */}
        <View style={{ height: 180, backgroundColor: colors.border, justifyContent: "center", alignItems: "center" }}>
          <MaterialIcons name="article" size={64} color={colors.primary} />
        </View>
        {/* Content */}
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontSize: 20, marginRight: 8 }}>{card.topicEmoji}</Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted }}>{card.topic}</Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginLeft: "auto" }}>📖 {card.duration} min read</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
            {card.title}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 18, marginBottom: 12 }}>
            {card.description}
          </Text>
          <Text style={{ fontSize: 11, color: colors.muted }}>
            📰 {card.source}
          </Text>
        </View>
      </View>
    );
  }

  return null;
}

interface ReactionButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  colors: any;
}

function ReactionButton({ icon, label, onPress, colors }: ReactionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          alignItems: "center",
          opacity: pressed ? 0.6 : 1,
          transform: [{ scale: pressed ? 0.9 : 1 }],
        },
      ]}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </View>
      <Text style={{ fontSize: 10, color: colors.muted, textAlign: "center" }}>
        {label}
      </Text>
    </Pressable>
  );
}
