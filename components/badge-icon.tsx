import React from "react";
import { View, Text, type OpaqueColorValue } from "react-native";
import { IconSymbol, type IconSymbolName } from "./ui/icon-symbol";

export interface BadgeIconProps {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  badgeCount?: number;
  badgeColor?: string;
}

/**
 * BadgeIcon component displays an icon with an optional badge counter.
 * Used for tab bar icons showing unread counts (notifications, recommendations).
 *
 * @param name - Icon name from IconSymbol mapping
 * @param size - Icon size (default: 24)
 * @param color - Icon color
 * @param badgeCount - Number to display in badge (if > 0, badge is shown)
 * @param badgeColor - Badge background color (default: red)
 */
export function BadgeIcon({
  name,
  size = 24,
  color,
  badgeCount = 0,
  badgeColor = "#EF4444",
}: BadgeIconProps) {
  const showBadge = badgeCount > 0;

  return (
    <View style={{ position: "relative", width: size, height: size }}>
      <IconSymbol name={name} size={size} color={color} />

      {showBadge && (
        <View
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            backgroundColor: badgeColor,
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 4,
            borderWidth: 2,
            borderColor: "white",
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "700",
              color: "white",
              textAlign: "center",
            }}
          >
            {badgeCount > 99 ? "99+" : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
}
