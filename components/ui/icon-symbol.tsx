import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  "house.fill": "home",
  "play.circle.fill": "play-circle-fill",
  "safari.fill": "explore",
  "chart.bar.fill": "bar-chart",
  "person.fill": "person",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "brain.head.profile": "psychology",
  "magnifyingglass": "search",
  "bookmark.fill": "bookmark",
  "bookmark": "bookmark-border",
  "flame.fill": "local-fire-department",
  "star.fill": "star",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "arrow.right": "arrow-forward",
  "clock.fill": "schedule",
  "lightbulb.fill": "lightbulb",
  "bolt.fill": "bolt",
  "heart.fill": "favorite",
  "square.and.arrow.up": "share",
  "gearshape.fill": "settings",
  "moon.fill": "dark-mode",
  "sun.max.fill": "light-mode",
  "bell.fill": "notifications",
  "trophy.fill": "emoji-events",
  "target": "track-changes",
  "bubble.left.and.text.bubble.right.fill": "question-answer",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
