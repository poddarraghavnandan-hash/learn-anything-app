import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

export interface Notification {
  id: string;
  type:
    | "breakthrough"
    | "stuck_alert"
    | "milestone"
    | "recommendation"
    | "streak"
    | "achievement"
    | "reminder";
  title: string;
  body: string;
  urgency: "low" | "medium" | "high" | "critical";
  conceptId?: number;
  conceptName?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  delivered: boolean;
  read: boolean;
}

export interface NotificationCenterProps {
  notifications: Notification[];
  onNotificationPress?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onDismiss?: (notificationId: string) => void;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
  filterType?: Notification["type"] | "all";
  onFilterChange?: (type: Notification["type"] | "all") => void;
}

const typeIcons: Record<Notification["type"], string> = {
  breakthrough: "celebration",
  stuck_alert: "warning",
  milestone: "star",
  recommendation: "lightbulb",
  streak: "local-fire-department",
  achievement: "trophy",
  reminder: "notifications-active",
};

const typeColors: Record<Notification["type"], string> = {
  breakthrough: "#10B981",
  stuck_alert: "#EF4444",
  milestone: "#F59E0B",
  recommendation: "#3B82F6",
  streak: "#F97316",
  achievement: "#8B5CF6",
  reminder: "#06B6D4",
};

const urgencyColors: Record<Notification["urgency"], string> = {
  low: "#10B981",
  medium: "#3B82F6",
  high: "#F59E0B",
  critical: "#EF4444",
};

/**
 * NotificationCenter
 *
 * Displays and manages notifications with:
 * - Filtering by notification type
 * - Read/unread status tracking
 * - Urgency indicators
 * - Dismissal and action handling
 * - Pull-to-refresh support
 */
export function NotificationCenter({
  notifications,
  onNotificationPress,
  onMarkAsRead,
  onDismiss,
  onRefresh,
  isLoading = false,
  filterType = "all",
  onFilterChange,
}: NotificationCenterProps) {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  const handleNotificationPress = (notification: Notification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!notification.read) {
      onMarkAsRead?.(notification.id);
    }
    onNotificationPress?.(notification);
  };

  const handleDismiss = (notificationId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss?.(notificationId);
  };

  // Filter notifications
  const filteredNotifications =
    filterType === "all"
      ? notifications
      : notifications.filter((n) => n.type === filterType);

  // Count unread
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <Text style={[styles.unreadBadge, { color: colors.muted }]}>
              {unreadCount} unread
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <Pressable style={styles.headerButton}>
              <MaterialIcons
                name="done-all"
                size={20}
                color={colors.primary}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterTabs, { borderBottomColor: colors.border }]}>
        <FilterTab
          label="All"
          active={filterType === "all"}
          onPress={() => onFilterChange?.("all")}
          colors={colors}
        />
        <FilterTab
          label="Breakthroughs"
          active={filterType === "breakthrough"}
          onPress={() => onFilterChange?.("breakthrough")}
          colors={colors}
        />
        <FilterTab
          label="Alerts"
          active={filterType === "stuck_alert"}
          onPress={() => onFilterChange?.("stuck_alert")}
          colors={colors}
        />
        <FilterTab
          label="Achievements"
          active={filterType === "achievement"}
          onPress={() => onFilterChange?.("achievement")}
          colors={colors}
        />
      </View>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons
            name="notifications-none"
            size={48}
            color={colors.muted}
          />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No notifications
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            {filterType === "all"
              ? "You're all caught up!"
              : `No ${filterType} notifications yet`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={() => handleNotificationPress(item)}
              onDismiss={() => handleDismiss(item.id)}
              colors={colors}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

interface FilterTabProps {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: any;
}

function FilterTab({ label, active, onPress, colors }: FilterTabProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterTab,
        active && {
          borderBottomColor: colors.primary,
          borderBottomWidth: 2,
        },
      ]}
    >
      <Text
        style={[
          styles.filterTabLabel,
          {
            color: active ? colors.primary : colors.muted,
            fontWeight: active ? "600" : "400",
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
  onDismiss: () => void;
  colors: any;
}

function NotificationItem({
  notification,
  onPress,
  onDismiss,
  colors,
}: NotificationItemProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss();
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.notificationItem,
        {
          backgroundColor: notification.read
            ? colors.background
            : colors.surface,
          borderLeftColor: typeColors[notification.type],
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={styles.notificationContent}>
        {/* Icon + Title + Body */}
        <View style={styles.notificationMain}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: typeColors[notification.type] + "20" },
            ]}
          >
            <MaterialIcons
              name={typeIcons[notification.type] as any}
              size={20}
              color={typeColors[notification.type]}
            />
          </View>

          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.notificationTitle,
                  {
                    color: colors.foreground,
                    fontWeight: notification.read ? "500" : "700",
                  },
                ]}
                numberOfLines={1}
              >
                {notification.title}
              </Text>
              {!notification.read && (
                <View
                  style={[
                    styles.unreadDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
              )}
            </View>

            <Text
              style={[styles.notificationBody, { color: colors.muted }]}
              numberOfLines={2}
            >
              {notification.body}
            </Text>

            {notification.conceptName && (
              <Text
                style={[styles.conceptBadge, { color: colors.primary }]}
                numberOfLines={1}
              >
                {notification.conceptName}
              </Text>
            )}
          </View>
        </View>

        {/* Urgency Badge + Dismiss Button */}
        <View style={styles.notificationActions}>
          <View
            style={[
              styles.urgencyBadge,
              {
                backgroundColor: urgencyColors[notification.urgency] + "20",
              },
            ]}
          >
            <Text
              style={[
                styles.urgencyLabel,
                { color: urgencyColors[notification.urgency] },
              ]}
            >
              {notification.urgency}
            </Text>
          </View>

          <Pressable
            onPress={handleDismiss}
            style={({ pressed }) => [
              styles.dismissButton,
              { opacity: pressed ? 0.5 : 1 },
            ]}
          >
            <MaterialIcons name="close" size={18} color={colors.muted} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  unreadBadge: {
    fontSize: 12,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  filterTabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  filterTabLabel: {
    fontSize: 12,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  notificationItem: {
    borderLeftWidth: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
  },
  notificationContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  notificationMain: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationBody: {
    fontSize: 12,
    marginBottom: 4,
    lineHeight: 16,
  },
  conceptBadge: {
    fontSize: 11,
    fontWeight: "600",
  },
  notificationActions: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 8,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urgencyLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  dismissButton: {
    padding: 4,
  },
});
