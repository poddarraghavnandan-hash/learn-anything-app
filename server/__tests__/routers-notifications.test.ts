import { describe, it, expect, beforeEach, vi } from "vitest";
import { notificationsRouter } from "../routers-notifications";
import * as signalNotifications from "../signal-notifications";

vi.mock("../signal-notifications");

describe("Notifications tRPC Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPending", () => {
    it("should return pending notifications", async () => {
      const mockNotifications = [
        {
          id: "notif-1",
          userId: 1,
          type: "breakthrough" as const,
          title: "Breakthrough!",
          body: "You've mastered Closures",
          urgency: "high" as const,
          conceptId: 1,
          conceptName: "Closures",
          actionUrl: "/learn/1",
          metadata: {},
          createdAt: new Date(),
          scheduledFor: new Date(),
          expiresAt: new Date(),
          delivered: false,
        },
      ];

      vi.mocked(
        signalNotifications.generateSignalBasedNotifications
      ).mockResolvedValue(mockNotifications);

      vi.mocked(
        signalNotifications.getDefaultNotificationPreferences
      ).mockReturnValue({
        userId: 1,
        enableBreakthroughs: true,
        enableStuckAlerts: true,
        enableMilestones: true,
        enableRecommendations: true,
        enableStreaks: true,
        quietHours: { enabled: false, startHour: 22, endHour: 8 },
        maxNotificationsPerDay: 10,
        preferredDeliveryTime: "immediate" as const,
      });

      vi.mocked(
        signalNotifications.filterNotificationsByPreferences
      ).mockReturnValue(mockNotifications);

      vi.mocked(
        signalNotifications.limitNotificationsPerDay
      ).mockReturnValue(mockNotifications);

      const caller = notificationsRouter.createCaller({
        user: { id: 1, email: "test@example.com" },
      } as any);

      const result = await caller.getPending({ limit: 10 });

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("breakthrough");
    });

    it("should filter by notification types", async () => {
      const breakthroughNotif = {
        id: "notif-1",
        userId: 1,
        type: "breakthrough" as const,
        title: "Breakthrough!",
        body: "You've mastered Closures",
        urgency: "high" as const,
        conceptId: 1,
        conceptName: "Closures",
        actionUrl: "/learn/1",
        metadata: {},
        createdAt: new Date(),
        scheduledFor: new Date(),
        expiresAt: new Date(),
        delivered: false,
      };

      const stuckNotif = {
        id: "notif-2",
        userId: 1,
        type: "stuck_alert" as const,
        title: "Stuck Alert",
        body: "You're struggling with Async/Await",
        urgency: "high" as const,
        conceptId: 2,
        conceptName: "Async/Await",
        actionUrl: "/learn/2/help",
        metadata: {},
        createdAt: new Date(),
        scheduledFor: new Date(),
        expiresAt: new Date(),
        delivered: false,
      };

      const mockNotifications = [breakthroughNotif, stuckNotif];

      vi.mocked(
        signalNotifications.generateSignalBasedNotifications
      ).mockResolvedValue(mockNotifications);

      vi.mocked(
        signalNotifications.getDefaultNotificationPreferences
      ).mockReturnValue({
        userId: 1,
        enableBreakthroughs: true,
        enableStuckAlerts: true,
        enableMilestones: true,
        enableRecommendations: true,
        enableStreaks: true,
        quietHours: { enabled: false, startHour: 22, endHour: 8 },
        maxNotificationsPerDay: 10,
        preferredDeliveryTime: "immediate" as const,
      });

      vi.mocked(
        signalNotifications.filterNotificationsByPreferences
      ).mockReturnValue([breakthroughNotif]);

      vi.mocked(
        signalNotifications.limitNotificationsPerDay
      ).mockReturnValue([breakthroughNotif]);

      const caller = notificationsRouter.createCaller({
        user: { id: 1, email: "test@example.com" },
      } as any);

      const result = await caller.getPending({
        limit: 10,
        types: ["breakthrough"],
      });

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("breakthrough");
    });

    it("should throw error if user not authenticated", async () => {
      const caller = notificationsRouter.createCaller({
        user: null,
      } as any);

      await expect(caller.getPending({ limit: 10 })).rejects.toThrow();
    });
  });

  describe("getPreferences", () => {
    it("should return notification preferences", async () => {
      const mockPrefs = {
        userId: 1,
        enableBreakthroughs: true,
        enableStuckAlerts: true,
        enableMilestones: true,
        enableRecommendations: true,
        enableStreaks: true,
        quietHours: { enabled: true, startHour: 22, endHour: 8 },
        maxNotificationsPerDay: 10,
        preferredDeliveryTime: "immediate" as const,
      };

      vi.mocked(
        signalNotifications.getDefaultNotificationPreferences
      ).mockReturnValue(mockPrefs);

      const caller = notificationsRouter.createCaller({
        user: { id: 1, email: "test@example.com" },
      } as any);

      const result = await caller.getPreferences();

      expect(result.userId).toBe(1);
      expect(result.enableBreakthroughs).toBe(true);
      expect(result.quietHours.enabled).toBe(true);
    });
  });

  describe("updatePreferences", () => {
    it("should update notification preferences", async () => {
      const caller = notificationsRouter.createCaller({
        user: { id: 1, email: "test@example.com" },
      } as any);

      const result = await caller.updatePreferences({
        enableBreakthroughs: false,
        maxNotificationsPerDay: 5,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("updated successfully");
    });
  });

  describe("markAsRead", () => {
    it("should mark notification as read", async () => {
      const caller = notificationsRouter.createCaller({
        user: { id: 1, email: "test@example.com" },
      } as any);

      const result = await caller.markAsRead({
        notificationId: "notif-1",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("markAllAsRead", () => {
    it("should mark all notifications as read", async () => {
      const caller = notificationsRouter.createCaller({
        user: { id: 1, email: "test@example.com" },
      } as any);

      const result = await caller.markAllAsRead();

      expect(result.success).toBe(true);
      expect(result.count).toBeDefined();
    });
  });

  describe("dismiss", () => {
    it("should dismiss a notification", async () => {
      const caller = notificationsRouter.createCaller({
        user: { id: 1, email: "test@example.com" },
      } as any);

      const result = await caller.dismiss({
        notificationId: "notif-1",
        reason: "not_interested",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("dismissType", () => {
    it("should dismiss all notifications of a type", async () => {
      const caller = notificationsRouter.createCaller({
        user: { id: 1, email: "test@example.com" },
      } as any);

      const result = await caller.dismissType({
        type: "recommendation",
      });

      expect(result.success).toBe(true);
      expect(result.count).toBeDefined();
    });
  });

  describe("getUnreadCount", () => {
    it("should return unread notification count", async () => {
      const mockNotifications = [
        {
          id: "notif-1",
          userId: 1,
          type: "breakthrough" as const,
          title: "Breakthrough!",
          body: "You've mastered Closures",
          urgency: "high" as const,
          conceptId: 1,
          conceptName: "Closures",
          actionUrl: "/learn/1",
          metadata: {},
          createdAt: new Date(),
          scheduledFor: new Date(),
          expiresAt: new Date(),
          delivered: false,
        },
      ];

      vi.mocked(
        signalNotifications.generateSignalBasedNotifications
      ).mockResolvedValue(mockNotifications);

      vi.mocked(
        signalNotifications.getDefaultNotificationPreferences
      ).mockReturnValue({
        userId: 1,
        enableBreakthroughs: true,
        enableStuckAlerts: true,
        enableMilestones: true,
        enableRecommendations: true,
        enableStreaks: true,
        quietHours: { enabled: true, startHour: 22, endHour: 8 },
        maxNotificationsPerDay: 10,
        preferredDeliveryTime: "immediate" as const,
      });

      vi.mocked(
        signalNotifications.filterNotificationsByPreferences
      ).mockReturnValue(mockNotifications);

      const caller = notificationsRouter.createCaller({
        user: { id: 1, email: "test@example.com" },
      } as any);

      const result = await caller.getUnreadCount();

      expect(result.unreadCount).toBe(1);
      expect(result.totalCount).toBe(1);
    });
  });

  describe("getStats", () => {
    it("should return notification statistics", async () => {
      const mockNotifications = [
        {
          id: "notif-1",
          userId: 1,
          type: "breakthrough" as const,
          title: "Breakthrough!",
          body: "You've mastered Closures",
          urgency: "high" as const,
          conceptId: 1,
          conceptName: "Closures",
          actionUrl: "/learn/1",
          metadata: {},
          createdAt: new Date(),
          scheduledFor: new Date(),
          expiresAt: new Date(),
          delivered: true,
        },
        {
          id: "notif-2",
          userId: 1,
          type: "stuck_alert" as const,
          title: "Stuck Alert",
          body: "You're struggling",
          urgency: "high" as const,
          conceptId: 2,
          conceptName: "Async/Await",
          actionUrl: "/learn/2/help",
          metadata: {},
          createdAt: new Date(),
          scheduledFor: new Date(),
          expiresAt: new Date(),
          delivered: false,
        },
      ];

      vi.mocked(
        signalNotifications.generateSignalBasedNotifications
      ).mockResolvedValue(mockNotifications);

      const caller = notificationsRouter.createCaller({
        user: { id: 1, email: "test@example.com" },
      } as any);

      const result = await caller.getStats();

      expect(result.total).toBe(2);
      expect(result.delivered).toBe(1);
      expect(result.undelivered).toBe(1);
      expect(result.byType.breakthrough).toBe(1);
      expect(result.byType.stuck_alert).toBe(1);
      expect(result.byUrgency.high).toBe(2);
    });
  });

  describe("sendTest", () => {
    it("should send test notification", async () => {
      const caller = notificationsRouter.createCaller({
        user: { id: 1, email: "test@example.com" },
      } as any);

      const result = await caller.sendTest({
        type: "recommendation",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("Test");
    });
  });

  describe("getHistory", () => {
    it("should return notification history", async () => {
      const caller = notificationsRouter.createCaller({
        user: { id: 1, email: "test@example.com" },
      } as any);

      const result = await caller.getHistory({
        limit: 20,
        offset: 0,
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
