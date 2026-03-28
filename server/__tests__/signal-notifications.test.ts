import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createBreakthroughNotification,
  createStuckNotification,
  createMilestoneNotification,
  createRecommendationNotification,
  createStreakNotification,
  generateSignalBasedNotifications,
  filterNotificationsByPreferences,
  scheduleNotifications,
  getDefaultNotificationPreferences,
  limitNotificationsPerDay,
  Notification,
  NotificationPreferences,
} from "../signal-notifications";
import * as learnerProfileModule from "../learner-profile";
import * as signalObserverModule from "../signal-observer";

vi.mock("../learner-profile");
vi.mock("../signal-observer");

describe("Signal-Based Notifications Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createBreakthroughNotification", () => {
    it("should create breakthrough notification with correct structure", () => {
      const notification = createBreakthroughNotification(1, "Closures", 1);

      expect(notification.userId).toBe(1);
      expect(notification.type).toBe("breakthrough");
      expect(notification.urgency).toBe("high");
      expect(notification.conceptId).toBe(1);
      expect(notification.conceptName).toBe("Closures");
      expect(notification.title).toContain("Closures");
      expect(notification.body).toContain("Ready for the next challenge");
      expect(notification.actionUrl).toBe("/learn/1/next");
      expect(notification.delivered).toBe(false);
    });

    it("should include metadata", () => {
      const metadata = { source: "test" };
      const notification = createBreakthroughNotification(1, "Closures", 1, metadata);

      expect(notification.metadata.celebrationType).toBe("breakthrough");
      expect(notification.metadata.source).toBe("test");
    });

    it("should set expiration to 1 week", () => {
      const now = new Date();
      const notification = createBreakthroughNotification(1, "Closures", 1);

      const weekInMs = 7 * 24 * 60 * 60 * 1000;
      const timeDiff = notification.expiresAt.getTime() - now.getTime();

      expect(timeDiff).toBeGreaterThan(weekInMs - 1000);
      expect(timeDiff).toBeLessThan(weekInMs + 1000);
    });
  });

  describe("createStuckNotification", () => {
    it("should create stuck notification with immediate urgency for 3+ stuck signals", () => {
      const notification = createStuckNotification(1, "Async/Await", 2, 3);

      expect(notification.type).toBe("stuck_alert");
      expect(notification.urgency).toBe("immediate");
      expect(notification.title).toContain("🆘");
      expect(notification.metadata.stuckCount).toBe(3);
    });

    it("should create stuck notification with high urgency for 2 stuck signals", () => {
      const notification = createStuckNotification(1, "Async/Await", 2, 2);

      expect(notification.urgency).toBe("high");
      expect(notification.title).toContain("⚠️");
    });

    it("should create stuck notification with medium urgency for 1 stuck signal", () => {
      const notification = createStuckNotification(1, "Async/Await", 2, 1);

      expect(notification.urgency).toBe("medium");
      expect(notification.title).toContain("💭");
    });

    it("should include help action URL", () => {
      const notification = createStuckNotification(1, "Async/Await", 2, 2);

      expect(notification.actionUrl).toBe("/learn/2/help");
    });

    it("should set expiration to 24 hours", () => {
      const now = new Date();
      const notification = createStuckNotification(1, "Async/Await", 2, 2);

      const dayInMs = 24 * 60 * 60 * 1000;
      const timeDiff = notification.expiresAt.getTime() - now.getTime();

      expect(timeDiff).toBeGreaterThan(dayInMs - 1000);
      expect(timeDiff).toBeLessThan(dayInMs + 1000);
    });
  });

  describe("createMilestoneNotification", () => {
    it("should create first concept mastered notification", () => {
      const notification = createMilestoneNotification(1, "first_concept");

      expect(notification.type).toBe("milestone");
      expect(notification.title).toContain("First Concept Mastered");
      expect(notification.urgency).toBe("high");
    });

    it("should create five concepts mastered notification", () => {
      const notification = createMilestoneNotification(1, "five_concepts");

      expect(notification.title).toContain("Five Concepts");
    });

    it("should create breakthrough streak notification", () => {
      const notification = createMilestoneNotification(1, "breakthrough_streak");

      expect(notification.title).toContain("Breakthrough Streak");
    });

    it("should create one week milestone notification", () => {
      const notification = createMilestoneNotification(1, "first_week");

      expect(notification.title).toContain("One Week");
    });

    it("should create one month milestone notification", () => {
      const notification = createMilestoneNotification(1, "first_month");

      expect(notification.title).toContain("One Month");
    });

    it("should set expiration to 30 days", () => {
      const now = new Date();
      const notification = createMilestoneNotification(1, "first_concept");

      const monthInMs = 30 * 24 * 60 * 60 * 1000;
      const timeDiff = notification.expiresAt.getTime() - now.getTime();

      expect(timeDiff).toBeGreaterThan(monthInMs - 1000);
      expect(timeDiff).toBeLessThan(monthInMs + 1000);
    });
  });

  describe("createRecommendationNotification", () => {
    it("should create recommendation notification", () => {
      const notification = createRecommendationNotification(
        1,
        "Advanced Closures",
        2,
        "You've mastered closures. Ready for advanced topics?"
      );

      expect(notification.type).toBe("recommendation");
      expect(notification.urgency).toBe("medium");
      expect(notification.conceptId).toBe(2);
      expect(notification.conceptName).toBe("Advanced Closures");
      expect(notification.body).toContain("You've mastered closures");
      expect(notification.actionUrl).toBe("/learn/2");
    });

    it("should include recommendation reason in metadata", () => {
      const reason = "Custom reason";
      const notification = createRecommendationNotification(1, "Topic", 1, reason);

      expect(notification.metadata.recommendationReason).toBe(reason);
    });

    it("should schedule for 2 hours in future", () => {
      const now = new Date();
      const notification = createRecommendationNotification(1, "Topic", 1, "reason");

      const twoHoursInMs = 2 * 60 * 60 * 1000;
      const timeDiff = notification.scheduledFor.getTime() - now.getTime();

      expect(timeDiff).toBeGreaterThan(twoHoursInMs - 1000);
      expect(timeDiff).toBeLessThan(twoHoursInMs + 1000);
    });
  });

  describe("createStreakNotification", () => {
    it("should create 3-day streak notification", () => {
      const notification = createStreakNotification(1, 3);

      expect(notification.type).toBe("streak");
      expect(notification.title).toContain("3-Day Streak");
      expect(notification.urgency).toBe("high");
      expect(notification.metadata.streakDays).toBe(3);
    });

    it("should create 7-day streak notification", () => {
      const notification = createStreakNotification(1, 7);

      expect(notification.title).toContain("One Week Streak");
    });

    it("should create 14-day streak notification", () => {
      const notification = createStreakNotification(1, 14);

      expect(notification.title).toContain("Two Week Streak");
    });

    it("should create 30-day streak notification", () => {
      const notification = createStreakNotification(1, 30);

      expect(notification.title).toContain("One Month Streak");
    });

    it("should create generic streak notification for other days", () => {
      const notification = createStreakNotification(1, 5);

      expect(notification.title).toContain("5-Day Streak");
    });
  });

  describe("generateSignalBasedNotifications", () => {
    it("should generate breakthrough notifications", async () => {
      const mockProfile = {
        userId: 1,
        learningStyle: "analytical" as const,
        learningVelocity: 2.5,
        confidenceTrajectory: "improving" as const,
        averageConfidence: 0.7,
        averageDepth: "intermediate" as const,
        breakthroughsThisWeek: 1,
        stuckPointsThisWeek: 0,
        totalSignalsThisWeek: 10,
        signalDistribution: {},
        topConceptsByConfidence: [{ conceptId: 1, conceptName: "Closures", confidence: 0.8 }],
        knowledgeGaps: [],
        recommendedNextSteps: [],
        lastUpdated: new Date(),
      };

      vi.mocked(learnerProfileModule.getUserLearnerProfile).mockResolvedValue(mockProfile);
      vi.mocked(signalObserverModule.getUserSignals).mockResolvedValue([
        {
          id: 1,
          userId: 1,
          conceptId: 1,
          signalType: "breakthrough",
          contentHash: null,
          contentSummary: null,
          contentLength: 100,
          metadata: {},
          timestamp: new Date(),
        } as any,
      ]);
      vi.mocked(signalObserverModule.getConceptSignals).mockResolvedValue([]);

      const notifications = await generateSignalBasedNotifications(1);

      const breakthroughNotif = notifications.find((n) => n.type === "breakthrough");
      expect(breakthroughNotif).toBeDefined();
    });

    it("should generate stuck point notifications", async () => {
      const mockProfile = {
        userId: 1,
        learningStyle: "analytical" as const,
        learningVelocity: 1.5,
        confidenceTrajectory: "struggling" as const,
        averageConfidence: 0.4,
        averageDepth: "surface" as const,
        breakthroughsThisWeek: 0,
        stuckPointsThisWeek: 3,
        totalSignalsThisWeek: 8,
        signalDistribution: {},
        topConceptsByConfidence: [],
        knowledgeGaps: [
          { conceptId: 1, conceptName: "Closures", reason: "stuck_signal" },
        ],
        recommendedNextSteps: [],
        lastUpdated: new Date(),
      };

      vi.mocked(learnerProfileModule.getUserLearnerProfile).mockResolvedValue(mockProfile);
      vi.mocked(signalObserverModule.getUserSignals).mockResolvedValue([]);
      vi.mocked(signalObserverModule.getConceptSignals).mockResolvedValue([
        { signalType: "stuck", id: 1, userId: 1, conceptId: 1, contentHash: null, contentSummary: null, contentLength: 100, metadata: {}, timestamp: new Date() } as any,
        { signalType: "stuck", id: 2, userId: 1, conceptId: 1, contentHash: null, contentSummary: null, contentLength: 100, metadata: {}, timestamp: new Date() } as any,
        { signalType: "stuck", id: 3, userId: 1, conceptId: 1, contentHash: null, contentSummary: null, contentLength: 100, metadata: {}, timestamp: new Date() } as any,
      ]);

      const notifications = await generateSignalBasedNotifications(1);

      const stuckNotif = notifications.find((n) => n.type === "stuck_alert");
      expect(stuckNotif).toBeDefined();
      if (stuckNotif) {
        expect(stuckNotif.urgency).toBe("immediate");
      }
    });

    it("should generate milestone notifications", async () => {
      const mockProfile = {
        userId: 1,
        learningStyle: "analytical" as const,
        learningVelocity: 2.5,
        confidenceTrajectory: "improving" as const,
        averageConfidence: 0.7,
        averageDepth: "intermediate" as const,
        breakthroughsThisWeek: 3,
        stuckPointsThisWeek: 0,
        totalSignalsThisWeek: 10,
        signalDistribution: {},
        topConceptsByConfidence: [],
        knowledgeGaps: [],
        recommendedNextSteps: [],
        lastUpdated: new Date(),
      };

      vi.mocked(learnerProfileModule.getUserLearnerProfile).mockResolvedValue(mockProfile);
      vi.mocked(signalObserverModule.getUserSignals).mockResolvedValue([]);
      vi.mocked(signalObserverModule.getConceptSignals).mockResolvedValue([]);

      const notifications = await generateSignalBasedNotifications(1);

      const milestoneNotif = notifications.find((n) => n.type === "milestone");
      expect(milestoneNotif).toBeDefined();
    });

    it("should return empty array if profile not found", async () => {
      vi.mocked(learnerProfileModule.getUserLearnerProfile).mockResolvedValue(null);

      const notifications = await generateSignalBasedNotifications(999);

      expect(notifications).toEqual([]);
    });
  });

  describe("filterNotificationsByPreferences", () => {
    it("should filter by notification type preferences", () => {
      const notifications: Notification[] = [
        createBreakthroughNotification(1, "Closures", 1),
        createStuckNotification(1, "Async/Await", 2, 2),
        createMilestoneNotification(1, "first_concept"),
      ];

      const preferences: NotificationPreferences = {
        userId: 1,
        enableBreakthroughs: true,
        enableStuckAlerts: false,
        enableMilestones: true,
        enableRecommendations: true,
        enableStreaks: true,
        quietHours: { enabled: false, startHour: 22, endHour: 8 },
        maxNotificationsPerDay: 10,
        preferredDeliveryTime: "immediate",
      };

      const filtered = filterNotificationsByPreferences(notifications, preferences);

      expect(filtered.length).toBe(2);
      expect(filtered.every((n) => n.type !== "stuck_alert")).toBe(true);
    });

    it("should respect quiet hours for non-immediate notifications", () => {
      const notifications: Notification[] = [
        createRecommendationNotification(1, "Topic", 1, "reason"),
      ];

      const preferences: NotificationPreferences = {
        userId: 1,
        enableBreakthroughs: true,
        enableStuckAlerts: true,
        enableMilestones: true,
        enableRecommendations: true,
        enableStreaks: true,
        quietHours: { enabled: true, startHour: 22, endHour: 8 },
        maxNotificationsPerDay: 10,
        preferredDeliveryTime: "immediate",
      };

      // Mock current time to be within quiet hours (e.g., 2 AM)
      const originalDate = Date;
      const mockDate = new Date("2026-03-28T02:00:00");
      vi.spyOn(global, "Date").mockImplementation(() => mockDate as any);

      const filtered = filterNotificationsByPreferences(notifications, preferences);

      // Recommendation has medium urgency, should be filtered during quiet hours
      expect(filtered.length).toBe(0);

      vi.restoreAllMocks();
    });

    it("should allow immediate notifications during quiet hours", () => {
      const notifications: Notification[] = [
        createStuckNotification(1, "Async/Await", 2, 3), // immediate urgency
      ];

      const preferences: NotificationPreferences = {
        userId: 1,
        enableBreakthroughs: true,
        enableStuckAlerts: true,
        enableMilestones: true,
        enableRecommendations: true,
        enableStreaks: true,
        quietHours: { enabled: true, startHour: 22, endHour: 8 },
        maxNotificationsPerDay: 10,
        preferredDeliveryTime: "immediate",
      };

      // Mock current time to be within quiet hours
      const originalDate = Date;
      const mockDate = new Date("2026-03-28T02:00:00");
      vi.spyOn(global, "Date").mockImplementation(() => mockDate as any);

      const filtered = filterNotificationsByPreferences(notifications, preferences);

      // Immediate notifications should pass through
      expect(filtered.length).toBe(1);

      vi.restoreAllMocks();
    });
  });

  describe("scheduleNotifications", () => {
    it("should schedule for immediate delivery", () => {
      const notifications: Notification[] = [
        createBreakthroughNotification(1, "Closures", 1),
      ];

      const preferences: NotificationPreferences = {
        userId: 1,
        enableBreakthroughs: true,
        enableStuckAlerts: true,
        enableMilestones: true,
        enableRecommendations: true,
        enableStreaks: true,
        quietHours: { enabled: false, startHour: 22, endHour: 8 },
        maxNotificationsPerDay: 10,
        preferredDeliveryTime: "immediate",
      };

      const scheduled = scheduleNotifications(notifications, preferences);

      expect(scheduled[0].scheduledFor).toBeDefined();
      expect(scheduled[0].scheduledFor.getTime()).toBeLessThanOrEqual(new Date().getTime() + 1000);
    });

    it("should schedule for daily digest at 8 AM", () => {
      const notifications: Notification[] = [
        createBreakthroughNotification(1, "Closures", 1),
      ];

      const preferences: NotificationPreferences = {
        userId: 1,
        enableBreakthroughs: true,
        enableStuckAlerts: true,
        enableMilestones: true,
        enableRecommendations: true,
        enableStreaks: true,
        quietHours: { enabled: false, startHour: 22, endHour: 8 },
        maxNotificationsPerDay: 10,
        preferredDeliveryTime: "daily_digest",
      };

      const scheduled = scheduleNotifications(notifications, preferences);

      expect(scheduled[0].scheduledFor.getHours()).toBe(8);
      expect(scheduled[0].scheduledFor.getMinutes()).toBe(0);
    });

    it("should schedule for weekly digest on Monday 8 AM", () => {
      const notifications: Notification[] = [
        createBreakthroughNotification(1, "Closures", 1),
      ];

      const preferences: NotificationPreferences = {
        userId: 1,
        enableBreakthroughs: true,
        enableStuckAlerts: true,
        enableMilestones: true,
        enableRecommendations: true,
        enableStreaks: true,
        quietHours: { enabled: false, startHour: 22, endHour: 8 },
        maxNotificationsPerDay: 10,
        preferredDeliveryTime: "weekly_digest",
      };

      const scheduled = scheduleNotifications(notifications, preferences);

      expect(scheduled[0].scheduledFor.getDay()).toBe(1); // Monday
      expect(scheduled[0].scheduledFor.getHours()).toBe(8);
    });
  });

  describe("getDefaultNotificationPreferences", () => {
    it("should return default preferences", () => {
      const prefs = getDefaultNotificationPreferences(1);

      expect(prefs.userId).toBe(1);
      expect(prefs.enableBreakthroughs).toBe(true);
      expect(prefs.enableStuckAlerts).toBe(true);
      expect(prefs.enableMilestones).toBe(true);
      expect(prefs.enableRecommendations).toBe(true);
      expect(prefs.enableStreaks).toBe(true);
      expect(prefs.quietHours.enabled).toBe(true);
      expect(prefs.quietHours.startHour).toBe(22);
      expect(prefs.quietHours.endHour).toBe(8);
      expect(prefs.maxNotificationsPerDay).toBe(10);
      expect(prefs.preferredDeliveryTime).toBe("immediate");
    });
  });

  describe("limitNotificationsPerDay", () => {
    it("should limit notifications to max per day", () => {
      const notifications: Notification[] = Array.from({ length: 15 }, (_, i) =>
        createRecommendationNotification(1, `Topic ${i}`, i, "reason")
      );

      const limited = limitNotificationsPerDay(notifications, 5);

      expect(limited.length).toBe(5);
    });

    it("should prioritize by urgency", () => {
      const notifications: Notification[] = [
        createRecommendationNotification(1, "Topic 1", 1, "reason"), // medium
        createStuckNotification(1, "Topic 2", 2, 3), // immediate
        createBreakthroughNotification(1, "Topic 3", 3), // high
      ];

      const limited = limitNotificationsPerDay(notifications, 2);

      expect(limited[0].urgency).toBe("immediate");
      expect(limited[1].urgency).toBe("high");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty notification list", () => {
      const preferences = getDefaultNotificationPreferences(1);
      const filtered = filterNotificationsByPreferences([], preferences);

      expect(filtered).toEqual([]);
    });

    it("should handle notification with no metadata", () => {
      const notification = createBreakthroughNotification(1, "Closures", 1);
      notification.metadata = {};

      expect(notification.metadata).toBeDefined();
      expect(typeof notification.metadata).toBe("object");
    });

    it("should generate unique notification IDs", async () => {
      const notif1 = createBreakthroughNotification(1, "Closures", 1);
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      const notif2 = createBreakthroughNotification(1, "Closures", 1);

      expect(notif1.id).not.toBe(notif2.id);
    });
  });
});
