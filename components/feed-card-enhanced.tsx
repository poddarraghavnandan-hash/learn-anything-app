import { View, Text, Pressable, Image, Dimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import Animated, { FadeIn, SlideInUp } from "react-native-reanimated";
import type { FeedCardData } from "./feed-card";

interface EnhancedFeedCardProps {
  card: FeedCardData;
  onPress?: () => void;
  onSave?: () => void;
  onReact?: (reaction: string) => void;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;

export function EnhancedFeedCard({ card, onPress, onSave, onReact }: EnhancedFeedCardProps) {
  const colors = useColors();

  const getCardBackground = () => {
    switch (card.type) {
      case "video":
        return { gradient: ["#6C63FF", "#8B7FFF"], icon: "play-circle" };
      case "article":
        return { gradient: ["#3B82F6", "#60A5FA"], icon: "article" };
      case "quiz":
        return { gradient: ["#F59E0B", "#FBBF24"], icon: "quiz" };
      case "review":
        return { gradient: ["#10B981", "#6EE7B7"], icon: "refresh" };
      default:
        return { gradient: ["#EC4899", "#F472B6"], icon: "lightbulb" };
    }
  };

  const { gradient, icon } = getCardBackground();

  if (card.type === "video") {
    return (
      <Animated.View entering={FadeIn.duration(300).delay(100)}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            {
              backgroundColor: colors.surface,
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 16,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          {/* Video Thumbnail */}
          <View style={{ position: "relative", height: 200, backgroundColor: gradient[0] }}>
            <Image
              source={{ uri: card.imageUrl }}
              style={{ width: "100%", height: "100%", opacity: 0.3 }}
            />
            <View
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: `${gradient[0]}80`,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MaterialIcons name="play-circle" size={64} color="#FFFFFF" />
            </View>

            {/* Duration Badge */}
            <View
              style={{
                position: "absolute",
                bottom: 12,
                right: 12,
                backgroundColor: "#000000CC",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "600" }}>
                {card.duration}m
              </Text>
            </View>
          </View>

          {/* Content */}
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
                  {card.topic} • {card.source}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }} numberOfLines={2}>
                  {card.title}
                </Text>
              </View>
              <Pressable onPress={onSave} style={{ marginLeft: 8 }}>
                <MaterialIcons name="bookmark-border" size={24} color={colors.muted} />
              </Pressable>
            </View>

            {/* Reaction Buttons */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => onReact?.("mind_blown")}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={{ fontSize: 16, marginRight: 6 }}>🤯</Text>
                <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 13 }}>Mind Blown</Text>
              </Pressable>
              <Pressable
                onPress={() => onReact?.("knew_this")}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={{ fontSize: 16, marginRight: 6 }}>✅</Text>
                <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 13 }}>Knew This</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  if (card.type === "quiz") {
    return (
      <Animated.View entering={SlideInUp.duration(400).delay(150)}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            {
              backgroundColor: colors.surface,
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 16,
              borderWidth: 2,
              borderColor: gradient[0],
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: gradient[0],
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12,
                }}
              >
                <MaterialIcons name="quiz" size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: colors.muted }}>Quick Quiz</Text>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                  {card.topic}
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
              {card.question}
            </Text>

            <View style={{ gap: 8, marginBottom: 12 }}>
              {card.options?.map((option, idx) => (
                <Pressable
                  key={idx}
                  style={({ pressed }) => [
                    {
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: pressed ? colors.border : "transparent",
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={{ color: colors.foreground, fontSize: 13 }}>{option}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={{ fontSize: 12, color: colors.muted, fontStyle: "italic" }}>
              Tap an option to answer
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // Default card for article, review, insight
  return (
    <Animated.View entering={FadeIn.duration(300).delay(100)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          {
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
              {card.topic}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
              {card.title}
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 18 }}>
              {card.description}
            </Text>
          </View>
          <Pressable onPress={onSave} style={{ marginLeft: 8 }}>
            <MaterialIcons name="bookmark-border" size={24} color={colors.muted} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}
