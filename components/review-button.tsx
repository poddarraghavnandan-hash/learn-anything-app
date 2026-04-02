import { View, Pressable, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";

interface ReviewButtonProps {
  pendingCount: number;
  onPress: () => void;
}

export function ReviewButton({ pendingCount, onPress }: ReviewButtonProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.95, { damping: 10 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 10 });
      onPress();
    }, 100);
  };

  if (pendingCount === 0) {
    return null; // Don't show button if no pending reviews
  }

  return (
    <Animated.View entering={FadeIn.duration(300)} style={{ paddingHorizontal: 16, marginBottom: 20 }}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          {
            backgroundColor: colors.warning,
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Text style={{ fontSize: 24, marginRight: 12 }}>🔄</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF", marginBottom: 2 }}>
              Review Time!
            </Text>
            <Text style={{ fontSize: 12, color: "#FFFFFF", opacity: 0.9 }}>
              {pendingCount} {pendingCount === 1 ? "concept" : "concepts"} need review
            </Text>
          </View>
        </View>
        
        {/* Badge with count */}
        <Animated.View
          style={{
            backgroundColor: "#DC2626",
            borderRadius: 12,
            paddingVertical: 4,
            paddingHorizontal: 8,
            marginLeft: 12,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF" }}>
            {pendingCount > 9 ? "9+" : pendingCount}
          </Text>
        </Animated.View>

        <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
      </Pressable>
    </Animated.View>
  );
}
