import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { getResponsiveFontSize, getResponsiveSpacing } from "@/lib/responsive";

interface SequencingGameCardProps {
  items: string[];
  correctSequence: number[];
  instructions: string;
  onAnswer: (correct: boolean, userSequence: number[]) => void;
  disabled?: boolean;
}

export function SequencingGameCard({
  items,
  correctSequence,
  instructions,
  onAnswer,
  disabled = false,
}: SequencingGameCardProps) {
  const colors = useColors();
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [shuffledIndices] = useState(() => {
    const indices = items.map((_, i) => i);
    return indices.sort(() => Math.random() - 0.5);
  });

  const handleItemClick = (index: number) => {
    if (disabled) return;

    const newSequence = [...userSequence, index];
    setUserSequence(newSequence);

    // Check if all items are selected
    if (newSequence.length === items.length) {
      const correct = JSON.stringify(newSequence) === JSON.stringify(correctSequence);
      onAnswer(correct, newSequence);
    }
  };

  const handleUndo = () => {
    if (userSequence.length > 0) {
      setUserSequence(userSequence.slice(0, -1));
    }
  };

  const selectedSet = new Set(userSequence);

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ padding: getResponsiveSpacing(16), gap: getResponsiveSpacing(16) }}>
        <Text style={{ fontSize: getResponsiveFontSize(14), color: colors.muted }}>
          {instructions}
        </Text>

        {/* Selected sequence display */}
        {userSequence.length > 0 && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 8,
              padding: getResponsiveSpacing(12),
              minHeight: 60,
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: getResponsiveFontSize(12), color: colors.muted, marginBottom: 8 }}>
              Your order ({userSequence.length}/{items.length}):
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {userSequence.map((index, position) => (
                <View
                  key={position}
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    minWidth: 40,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: getResponsiveFontSize(12),
                      color: colors.background,
                      fontWeight: "600",
                    }}
                  >
                    {position + 1}. {items[index]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Available items */}
        <View style={{ gap: getResponsiveSpacing(8) }}>
          <Text style={{ fontSize: getResponsiveFontSize(12), color: colors.muted }}>
            Click items in order:
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: getResponsiveSpacing(8) }}>
            {shuffledIndices.map((index) => (
              <Pressable
                key={index}
                onPress={() => handleItemClick(index)}
                disabled={disabled || selectedSet.has(index)}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    minWidth: "45%",
                    padding: getResponsiveSpacing(12),
                    borderRadius: 8,
                    backgroundColor: selectedSet.has(index) ? colors.muted : colors.surface,
                    borderWidth: 2,
                    borderColor: selectedSet.has(index) ? colors.muted : colors.border,
                    opacity:
                      pressed && !disabled && !selectedSet.has(index)
                        ? 0.8
                        : selectedSet.has(index)
                          ? 0.5
                          : 1,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: getResponsiveFontSize(13),
                    color: selectedSet.has(index) ? colors.background : colors.foreground,
                    fontWeight: "500",
                    textAlign: "center",
                  }}
                >
                  {items[index]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Undo button */}
        {userSequence.length > 0 && (
          <Pressable
            onPress={handleUndo}
            disabled={disabled}
            style={({ pressed }) => [
              {
                padding: getResponsiveSpacing(10),
                borderRadius: 6,
                backgroundColor: colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text
              style={{
                fontSize: getResponsiveFontSize(13),
                color: colors.foreground,
                fontWeight: "500",
                textAlign: "center",
              }}
            >
              ← Undo last
            </Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}
