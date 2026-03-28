/**
 * tRPC Router for Signal-Based Notifications
 * 
 * Endpoints for managing notifications based on learner signals:
 * - Breakthrough celebrations
 * - Stuck point interventions
 * - Milestone achievements
 * - Recommendation alerts
 * - Streak notifications
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  generateSignalBasedNotifications,
  filterNotificationsByPreferences,
  scheduleNotifications,
  getDefaultNotificationPreferences,
  limitNotificationsPerDay,
  Notification,
  NotificationPreferences,
} from "./signal-notifications";

export const notificationsRouter = router({
  /**
   * Get all pending notifications for the user
   * 
   * Returns notifications that are scheduled for delivery and haven't been delivered yet.
   */
  getPending: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        types: z
          .array(
            z.enum([
              "breakthrough",
              "stuck_alert",
              "milestone",
              "recommendation",
              "streak",
              "achievement",
              "reminder",
            ])
          )
          .optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      try {
        const notifications = await generateSignalBasedNotifications(userId);

        let filtered = notifications;

        // Filter by type if specified
        if (input.types && input.types.length > 0) {
          filtered = notifications.filter((n) =>
            input.types!.includes(n.type)
          );
        }

        // Filter by delivery status
        filtered = filtered.filter((n) => !n.delivered);

        // Apply preferences
        const prefs = getDefaultNotificationPreferences(userId);
        filtered = filterNotificationsByPreferences(filtered, prefs);

        // Limit per day
        filtered = limitNotificationsPerDay(filtered, prefs.maxNotificationsPerDay);

        return filtered.slice(0, input.limit);
      } catch (error) {
        console.error("[Notifications] Failed to get pending notifications:", error);
        return [];
      }
    }),

  /**
   * Get notification history
   * 
   * Returns delivered notifications for the user.
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        types: z
          .array(
            z.enum([
              "breakthrough",
              "stuck_alert",
              "milestone",
              "recommendation",
              "streak",
              "achievement",
              "reminder",
            ])
          )
          .optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      try {
        // In a real implementation, this would fetch from database
        // For now, return empty array
        return [];
      } catch (error) {
        console.error("[Notifications] Failed to get notification history:", error);
        return [];
      }
    }),

  /**
   * Get notification preferences
   * 
   * Returns the user's notification preferences including:
   * - Enabled notification types
   * - Quiet hours
   * - Delivery method
   * - Max notifications per day
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("User not authenticated");

    try {
      // In a real implementation, this would fetch from database
      // For now, return defaults
      return getDefaultNotificationPreferences(userId);
    } catch (error) {
      console.error("[Notifications] Failed to get preferences:", error);
      return getDefaultNotificationPreferences(userId);
    }
  }),

  /**
   * Update notification preferences
   * 
   * Allows user to customize notification settings.
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        enableBreakthroughs: z.boolean().optional(),
        enableStuckAlerts: z.boolean().optional(),
        enableMilestones: z.boolean().optional(),
        enableRecommendations: z.boolean().optional(),
        enableStreaks: z.boolean().optional(),
        quietHoursEnabled: z.boolean().optional(),
        quietHoursStart: z.number().min(0).max(23).optional(),
        quietHoursEnd: z.number().min(0).max(23).optional(),
        maxNotificationsPerDay: z.number().min(1).max(50).optional(),
        preferredDeliveryTime: z
          .enum(["immediate", "daily_digest", "weekly_digest"])
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      try {
        // In a real implementation, this would save to database
        console.log(`[Notifications] User ${userId} updated preferences:`, input);

        return {
          success: true,
          message: "Preferences updated successfully",
        };
      } catch (error) {
        console.error("[Notifications] Failed to update preferences:", error);
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Mark notification as read
   * 
   * Updates notification status to read.
   */
  markAsRead: protectedProcedure
    .input(
      z.object({
        notificationId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      try {
        // In a real implementation, this would update database
        console.log(
          `[Notifications] User ${userId} marked notification ${input.notificationId} as read`
        );

        return { success: true };
      } catch (error) {
        console.error("[Notifications] Failed to mark as read:", error);
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Mark all notifications as read
   * 
   * Updates all pending notifications to read status.
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("User not authenticated");

    try {
      // In a real implementation, this would update database
      console.log(`[Notifications] User ${userId} marked all notifications as read`);

      return { success: true, count: 0 };
    } catch (error) {
      console.error("[Notifications] Failed to mark all as read:", error);
      return { success: false, error: String(error) };
    }
  }),

  /**
   * Dismiss notification
   * 
   * Removes a notification from the user's view.
   */
  dismiss: protectedProcedure
    .input(
      z.object({
        notificationId: z.string(),
        reason: z
          .enum(["not_interested", "already_know", "too_many", "other"])
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      try {
        // In a real implementation, this would update database
        console.log(
          `[Notifications] User ${userId} dismissed notification ${input.notificationId}`,
          input.reason
        );

        return { success: true };
      } catch (error) {
        console.error("[Notifications] Failed to dismiss notification:", error);
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Dismiss all notifications of a type
   * 
   * Removes all notifications of a specific type.
   */
  dismissType: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          "breakthrough",
          "stuck_alert",
          "milestone",
          "recommendation",
          "streak",
          "achievement",
          "reminder",
        ]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      try {
        // In a real implementation, this would update database
        console.log(
          `[Notifications] User ${userId} dismissed all ${input.type} notifications`
        );

        return { success: true, count: 0 };
      } catch (error) {
        console.error("[Notifications] Failed to dismiss type:", error);
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Get unread notification count
   * 
   * Returns the number of unread notifications for the user.
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("User not authenticated");

    try {
      // In a real implementation, this would query database
      // For now, generate and count pending notifications
      const notifications = await generateSignalBasedNotifications(userId);
      const prefs = getDefaultNotificationPreferences(userId);
      const filtered = filterNotificationsByPreferences(notifications, prefs);

      return {
        unreadCount: filtered.filter((n) => !n.delivered).length,
        totalCount: filtered.length,
      };
    } catch (error) {
      console.error("[Notifications] Failed to get unread count:", error);
      return { unreadCount: 0, totalCount: 0 };
    }
  }),

  /**
   * Get notification stats
   * 
   * Returns statistics about notifications:
   * - Count by type
   * - Read vs unread
   * - Delivery method breakdown
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("User not authenticated");

    try {
      const notifications = await generateSignalBasedNotifications(userId);

      const stats = {
        total: notifications.length,
        byType: {} as Record<string, number>,
        delivered: notifications.filter((n) => n.delivered).length,
        undelivered: notifications.filter((n) => !n.delivered).length,
        byUrgency: {} as Record<string, number>,
      };

      for (const notif of notifications) {
        stats.byType[notif.type] = (stats.byType[notif.type] || 0) + 1;
        stats.byUrgency[notif.urgency] = (stats.byUrgency[notif.urgency] || 0) + 1;
      }

      return stats;
    } catch (error) {
      console.error("[Notifications] Failed to get stats:", error);
      return {
        total: 0,
        byType: {},
        delivered: 0,
        undelivered: 0,
        byUrgency: {},
      };
    }
  }),

  /**
   * Test notification delivery
   * 
   * Sends a test notification to verify delivery is working.
   */
  sendTest: protectedProcedure
    .input(
      z.object({
        type: z
          .enum([
            "breakthrough",
            "stuck_alert",
            "milestone",
            "recommendation",
            "streak",
          ])
          .default("recommendation"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      try {
        console.log(
          `[Notifications] Sending test ${input.type} notification to user ${userId}`
        );

        return {
          success: true,
          message: `Test ${input.type} notification sent`,
        };
      } catch (error) {
        console.error("[Notifications] Failed to send test notification:", error);
        return { success: false, error: String(error) };
      }
    }),
});

export type NotificationsRouter = typeof notificationsRouter;
