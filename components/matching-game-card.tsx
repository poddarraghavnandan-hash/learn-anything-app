import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { getResponsiveFontSize, getResponsiveSpacing } from "@/lib/responsive";

interface MatchingGameCardProps {
  pairs: { left: string; right: string }[];
  instructions: string;
  onAnswer: (correct: boolean, selectedMatches: Record<string, string>) => void;
  disabled?: boolean;
}

export function MatchingGameCard({
  pairs,
  instructions,
  onAnswer,
  disabled = false,
}: MatchingGameCardProps) {
  const colors = useColors();
  const [selectedMatches, setSelectedMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const handleLeftClick = (item: string) => {
    if (disabled) return;
    setSelectedLeft(selectedLeft === item ? null : item);
  };

  const handleRightClick = (item: string) => {
    if (disabled || !selectedLeft) return;
    const newMatches = { ...selectedMatches, [selectedLeft]: item };
    setSelectedMatches(newMatches);
    setSelectedLeft(null);

    // Check if all pairs are matched
    if (Object.keys(newMatches).length === pairs.length) {
      const correct = pairs.every(
        (p) => newMatches[p.left] === p.right
      );
      onAnswer(correct, newMatches);
    }
  };

  const leftItems = pairs.map((p) => p.left);
  const rightItems = pairs.map((p) => p.right);
  const shuffledRight = [...rightItems].sort(() => Math.random() - 0.5);

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ padding: getResponsiveSpacing(16), gap: getResponsiveSpacing(16) }}>
        <Text style={{ fontSize: getResponsiveFontSize(14), color: colors.muted }}>
          {instructions}
        </Text>

        <View style={{ flexDirection: "row", gap: getResponsiveSpacing(16) }}>
          {/* Left column */}
          <View style={{ flex: 1, gap: getResponsiveSpacing(8) }}>
            {leftItems.map((item) => (
              <Pressable
                key={item}
                onPress={() => handleLeftClick(item)}
                disabled={disabled}
                style={({ pressed }) => [
                  {
                    padding: getResponsiveSpacing(12),
                    borderRadius: 8,
                    backgroundColor:
                      selectedLeft === item ? colors.primary : colors.surface,
                    borderWidth: 2,
                    borderColor:
                      selectedLeft === item ? colors.primary : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: getResponsiveFontSize(13),
                    color: selectedLeft === item ? colors.background : colors.foreground,
                    fontWeight: "500",
                  }}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Right column */}
          <View style={{ flex: 1, gap: getResponsiveSpacing(8) }}>
            {shuffledRight.map((item) => (
              <Pressable
                key={item}
                onPress={() => handleRightClick(item)}
                disabled={disabled || !selectedLeft}
                style={({ pressed }) => [
                  {
                    padding: getResponsiveSpacing(12),
                    borderRadius: 8,
                    backgroundColor: colors.surface,
                    borderWidth: 2,
                    borderColor: colors.border,
                    opacity: pressed && !disabled && selectedLeft ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: getResponsiveFontSize(13),
                    color: colors.foreground,
                    fontWeight: "500",
                  }}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Matched pairs display */}
        {Object.keys(selectedMatches).length > 0 && (
          <View style={{ marginTop: getResponsiveSpacing(16) }}>
            <Text style={{ fontSize: getResponsiveFontSize(12), color: colors.muted, marginBottom: 8 }}>
              Matched: {Object.keys(selectedMatches).length}/{pairs.length}
            </Text>
            {Object.entries(selectedMatches).map(([left, right]) => (
              <View
                key={left}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <Text style={{ fontSize: getResponsiveFontSize(12), color: colors.foreground }}>
                  {left}
                </Text>
                <Text style={{ color: colors.primary }}>→</Text>
                <Text style={{ fontSize: getResponsiveFontSize(12), color: colors.foreground }}>
                  {right}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
