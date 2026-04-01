import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { NotificationCenter, type Notification } from "@/components/notification-center";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

export default function NotificationsScreen() {
  const colors = useColors();
  const [filterType, setFilterType] = useState<Notification["type"] | "all">("all");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch pending notifications
  const { data: notifications = [], isLoading, refetch } = trpc.notifications.getPending.useQuery(
    { limit: 50 },
    { enabled: true, refetchInterval: 30000 } // Refetch every 30 seconds
  );

  // Get unread count
  const { data: unreadCountData } = trpc.notifications.getUnreadCount.useQuery(
    undefined,
    { enabled: true, refetchInterval: 30000 }
  );
  const unreadCount = typeof unreadCountData === "number" ? unreadCountData : unreadCountData?.unreadCount ?? 0;

  // Mark as read mutation
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Dismiss mutation
  const dismissMutation = trpc.notifications.dismiss.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate({ notificationId: notification.id });
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate({ notificationId });
  };

  const handleDismiss = (notificationId: string) => {
    dismissMutation.mutate({ notificationId });
  };

  const handleFilterChange = (type: Notification["type"] | "all") => {
    setFilterType(type);
  };

  const handleMarkAllAsRead = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    markAllAsReadMutation.mutate();
  };

  return (
    <ScreenContainer className="p-0">
      {/* Header with Mark All as Read */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: colors.foreground,
            }}
          >
            Notifications
          </Text>
          {unreadCount > 0 && (
            <Text
              style={{
                fontSize: 12,
                color: colors.muted,
                marginTop: 4,
              }}
            >
              {String(unreadCount)} unread
            </Text>
          )}
        </View>

        {unreadCount > 0 && (
          <Pressable
            onPress={handleMarkAllAsRead}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 6,
              backgroundColor: colors.primary + "20",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: colors.primary,
              }}
            >
              Mark all read
            </Text>
          </Pressable>
        )}
      </View>

      {/* Loading State */}
      {isLoading && (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={{
              marginTop: 12,
              color: colors.muted,
              fontSize: 14,
            }}
          >
            Loading notifications...
          </Text>
        </View>
      )}

      {/* Notification Center */}
      {!isLoading && (
        <NotificationCenter
          notifications={notifications.map((n) => ({
            ...n,
            read: n.delivered, urgency: (n.urgency === "immediate" ? "high" : n.urgency) as "low" | "medium" | "high" | "critical",
          }))}
          onNotificationPress={handleNotificationPress}
          onMarkAsRead={handleMarkAsRead}
          onDismiss={handleDismiss}
          onRefresh={handleRefresh}
          isLoading={refreshing}
          filterType={filterType}
          onFilterChange={handleFilterChange}
        />
      )}
    </ScreenContainer>
  );
}
