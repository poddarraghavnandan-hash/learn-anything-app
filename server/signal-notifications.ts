/**
 * Signal-Based Notifications Service
 * 
 * Generates timely, contextual notifications based on learner signals:
 * - Breakthrough celebrations (motivation)
 * - Stuck point interventions (help)
 * - Milestone achievements (engagement)
 * - Recommendation alerts (guidance)
 */

import { getUserLearnerProfile } from "./learner-profile";
import { getConceptSignals, getUserSignals } from "./signal-observer";
import { calculateConceptMastery, detectLearningTrends } from "./learning-analytics";

export type NotificationType = 
  | "breakthrough"
  | "stuck_alert"
  | "milestone"
  | "recommendation"
  | "streak"
  | "achievement"
  | "reminder";

export type NotificationUrgency = "immediate" | "high" | "medium" | "low";

export interface Notification {
  id: string;
  userId: number;
  type: NotificationType;
  title: string;
  body: string;
  urgency: NotificationUrgency;
  conceptId?: number;
  conceptName?: string;
  actionUrl?: string; // Deep link to relevant content
  metadata: Record<string, any>;
  createdAt: Date;
  scheduledFor: Date; // When to send
  expiresAt: Date; // When notification becomes irrelevant
  delivered: boolean;
}

export interface NotificationPreferences {
  userId: number;
  enableBreakthroughs: boolean;
  enableStuckAlerts: boolean;
  enableMilestones: boolean;
  enableRecommendations: boolean;
  enableStreaks: boolean;
  quietHours: {
    enabled: boolean;
    startHour: number; // 0-23
    endHour: number; // 0-23
  };
  maxNotificationsPerDay: number;
  preferredDeliveryTime: "immediate" | "daily_digest" | "weekly_digest";
}

/**
 * Create breakthrough notification
 */
export function createBreakthroughNotification(
  userId: number,
  conceptName: string,
  conceptId: number,
  metadata: Record<string, any> = {}
): Notification {
  const now = new Date();
  const breakthroughMessages = [
    `🎉 Breakthrough! You've mastered ${conceptName}!`,
    `✨ Aha moment! You understand ${conceptName} now!`,
    `🚀 Breakthrough achieved in ${conceptName}!`,
    `💡 You've had a major insight about ${conceptName}!`,
  ];

  const title = breakthroughMessages[Math.floor(Math.random() * breakthroughMessages.length)];
  const body = `You've demonstrated deep understanding. Ready for the next challenge?`;

  return {
    id: `breakthrough-${userId}-${conceptId}-${Date.now()}`,
    userId,
    type: "breakthrough",
    title,
    body,
    urgency: "high",
    conceptId,
    conceptName,
    actionUrl: `/learn/${conceptId}/next`,
    metadata: {
      ...metadata,
      celebrationType: "breakthrough",
      nextStepSuggested: true,
    },
    createdAt: now,
    scheduledFor: now,
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week
    delivered: false,
  };
}

/**
 * Create stuck point intervention notification
 */
export function createStuckNotification(
  userId: number,
  conceptName: string,
  conceptId: number,
  stuckCount: number,
  metadata: Record<string, any> = {}
): Notification {
  const now = new Date();
  const urgency = stuckCount >= 3 ? "immediate" : stuckCount >= 2 ? "high" : "medium";

  const stuckMessages = {
    immediate: `🆘 You've been stuck on ${conceptName} multiple times. Let's get help!`,
    high: `⚠️ You're struggling with ${conceptName}. Want some guidance?`,
    medium: `💭 Having trouble with ${conceptName}? Here's some help.`,
  };

  const title = stuckMessages[urgency];
  const helpSuggestions = [
    "Try breaking it down into smaller parts",
    "Review the fundamentals first",
    "Look at some worked examples",
    "Ask a question to clarify your confusion",
  ];

  const body = `${helpSuggestions[Math.floor(Math.random() * helpSuggestions.length)]}`;

  return {
    id: `stuck-${userId}-${conceptId}-${Date.now()}`,
    userId,
    type: "stuck_alert",
    title,
    body,
    urgency: urgency as NotificationUrgency,
    conceptId,
    conceptName,
    actionUrl: `/learn/${conceptId}/help`,
    metadata: {
      ...metadata,
      stuckCount,
      interventionLevel: urgency,
      helpResourcesAvailable: true,
    },
    createdAt: now,
    scheduledFor: now,
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours
    delivered: false,
  };
}

/**
 * Create milestone achievement notification
 */
export function createMilestoneNotification(
  userId: number,
  milestoneType: string,
  metadata: Record<string, any> = {}
): Notification {
  const now = new Date();

  const milestoneMessages: Record<string, { title: string; body: string }> = {
    first_concept: {
      title: "🎓 First Concept Mastered!",
      body: "You've completed your first learning concept. Great start!",
    },
    five_concepts: {
      title: "🌟 Five Concepts Mastered!",
      body: "You're building impressive knowledge. Keep it up!",
    },
    ten_concepts: {
      title: "🏆 Ten Concepts Mastered!",
      body: "You're becoming an expert. Amazing progress!",
    },
    first_week: {
      title: "📅 One Week Streak!",
      body: "You've been learning consistently for a week. Awesome!",
    },
    first_month: {
      title: "🎯 One Month Milestone!",
      body: "A full month of learning. You're committed!",
    },
    breakthrough_streak: {
      title: "⚡ Breakthrough Streak!",
      body: "Multiple breakthroughs this week. You're on fire!",
    },
  };

  const message = milestoneMessages[milestoneType] || {
    title: "🎉 Milestone Achieved!",
    body: "You've reached a new milestone. Celebrate your progress!",
  };

  return {
    id: `milestone-${userId}-${milestoneType}-${Date.now()}`,
    userId,
    type: "milestone",
    title: message.title,
    body: message.body,
    urgency: "high",
    actionUrl: `/progress`,
    metadata: {
      ...metadata,
      milestoneType,
      celebrationLevel: "high",
    },
    createdAt: now,
    scheduledFor: now,
    expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
    delivered: false,
  };
}

/**
 * Create recommendation notification
 */
export function createRecommendationNotification(
  userId: number,
  conceptName: string,
  conceptId: number,
  reason: string,
  metadata: Record<string, any> = {}
): Notification {
  const now = new Date();

  const recommendationMessages = [
    `📚 Ready to learn ${conceptName}?`,
    `💡 ${conceptName} might be interesting for you.`,
    `🎯 Next step: ${conceptName}`,
    `✨ We recommend ${conceptName} next.`,
  ];

  const title = recommendationMessages[Math.floor(Math.random() * recommendationMessages.length)];

  return {
    id: `recommendation-${userId}-${conceptId}-${Date.now()}`,
    userId,
    type: "recommendation",
    title,
    body: reason,
    urgency: "medium",
    conceptId,
    conceptName,
    actionUrl: `/learn/${conceptId}`,
    metadata: {
      ...metadata,
      recommendationReason: reason,
    },
    createdAt: now,
    scheduledFor: new Date(now.getTime() + 2 * 60 * 60 * 1000), // Send in 2 hours
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
    delivered: false,
  };
}

/**
 * Create streak notification
 */
export function createStreakNotification(
  userId: number,
  streakDays: number,
  metadata: Record<string, any> = {}
): Notification {
  const now = new Date();

  let title = "";
  let body = "";

  if (streakDays === 3) {
    title = "🔥 3-Day Streak!";
    body = "You're building momentum. Keep learning!";
  } else if (streakDays === 7) {
    title = "🔥 One Week Streak!";
    body = "Incredible consistency. You're a learning machine!";
  } else if (streakDays === 14) {
    title = "🔥 Two Week Streak!";
    body = "Remarkable dedication. This is amazing!";
  } else if (streakDays === 30) {
    title = "🔥 One Month Streak!";
    body = "A full month of daily learning. You're unstoppable!";
  } else {
    title = `🔥 ${streakDays}-Day Streak!`;
    body = `You've been learning for ${streakDays} days straight. Amazing!`;
  }

  return {
    id: `streak-${userId}-${streakDays}-${Date.now()}`,
    userId,
    type: "streak",
    title,
    body,
    urgency: "high",
    actionUrl: `/progress`,
    metadata: {
      ...metadata,
      streakDays,
      celebrationLevel: "high",
    },
    createdAt: now,
    scheduledFor: now,
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours
    delivered: false,
  };
}

/**
 * Generate notifications based on recent signals
 */
export async function generateSignalBasedNotifications(
  userId: number
): Promise<Notification[]> {
  try {
    const profile = await getUserLearnerProfile(userId);
    if (!profile) return [];

    const notifications: Notification[] = [];
    const now = new Date();

    // 1. Breakthrough Notifications
    const recentSignals = await getUserSignals(userId, {
      since: new Date(now.getTime() - 1 * 60 * 60 * 1000), // Last hour
    });

    const recentBreakthroughs = recentSignals?.filter((s: any) => s.signalType === "breakthrough") ?? [];
    for (const breakthrough of recentBreakthroughs) {
      notifications.push(
        createBreakthroughNotification(
          userId,
          `Concept ${breakthrough.conceptId}`,
          breakthrough.conceptId || 0,
          { signalId: breakthrough.id }
        )
      );
    }

    // 2. Stuck Point Interventions
    for (const gap of profile.knowledgeGaps.slice(0, 2)) {
      const signals = await getConceptSignals(userId, gap.conceptId);
      const stuckCount = signals?.filter((s: any) => s.signalType === "stuck").length ?? 0;

      if (stuckCount >= 2) {
        notifications.push(
          createStuckNotification(userId, gap.conceptName, gap.conceptId, stuckCount)
        );
      }
    }

    // 3. Milestone Notifications
    if (profile.totalSignalsThisWeek === 10) {
      notifications.push(createMilestoneNotification(userId, "first_week"));
    }

    if (profile.breakthroughsThisWeek >= 3) {
      notifications.push(createMilestoneNotification(userId, "breakthrough_streak"));
    }

    // 4. Recommendation Notifications
    if (profile.topConceptsByConfidence.length > 0) {
      const topConcept = profile.topConceptsByConfidence[0];
      if (topConcept.confidence > 0.75) {
        notifications.push(
          createRecommendationNotification(
            userId,
            `Advanced ${topConcept.conceptName}`,
            topConcept.conceptId + 1,
            "You've mastered the basics. Ready for advanced topics?"
          )
        );
      }
    }

    // 5. Streak Notifications (would need streak tracking in DB)
    // For now, we'll skip this as it requires persistent streak data

    return notifications;
  } catch (error) {
    console.error("[Notifications] Failed to generate signal-based notifications:", error);
    return [];
  }
}

/**
 * Filter notifications based on user preferences
 */
export function filterNotificationsByPreferences(
  notifications: Notification[],
  preferences: NotificationPreferences
): Notification[] {
  const now = new Date();
  const currentHour = now.getHours();

  return notifications.filter((notification) => {
    // Check quiet hours
    if (preferences.quietHours.enabled) {
      const inQuietHours =
        preferences.quietHours.startHour < preferences.quietHours.endHour
          ? currentHour >= preferences.quietHours.startHour && currentHour < preferences.quietHours.endHour
          : currentHour >= preferences.quietHours.startHour || currentHour < preferences.quietHours.endHour;

      if (inQuietHours && notification.urgency !== "immediate") {
        return false;
      }
    }

    // Check notification type preferences
    switch (notification.type) {
      case "breakthrough":
        return preferences.enableBreakthroughs;
      case "stuck_alert":
        return preferences.enableStuckAlerts;
      case "milestone":
        return preferences.enableMilestones;
      case "recommendation":
        return preferences.enableRecommendations;
      case "streak":
        return preferences.enableStreaks;
      default:
        return true;
    }
  });
}

/**
 * Schedule notifications for delivery
 */
export function scheduleNotifications(
  notifications: Notification[],
  preferences: NotificationPreferences
): Notification[] {
  const now = new Date();

  return notifications.map((notification) => {
    if (preferences.preferredDeliveryTime === "immediate") {
      return {
        ...notification,
        scheduledFor: now,
      };
    } else if (preferences.preferredDeliveryTime === "daily_digest") {
      // Schedule for next morning (8 AM)
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      return {
        ...notification,
        scheduledFor: tomorrow,
      };
    } else {
      // Weekly digest - schedule for next Monday 8 AM
      const nextMonday = new Date(now);
      const daysUntilMonday = (1 - nextMonday.getDay() + 7) % 7 || 7;
      nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
      nextMonday.setHours(8, 0, 0, 0);
      return {
        ...notification,
        scheduledFor: nextMonday,
      };
    }
  });
}

/**
 * Get default notification preferences
 */
export function getDefaultNotificationPreferences(userId: number): NotificationPreferences {
  return {
    userId,
    enableBreakthroughs: true,
    enableStuckAlerts: true,
    enableMilestones: true,
    enableRecommendations: true,
    enableStreaks: true,
    quietHours: {
      enabled: true,
      startHour: 22, // 10 PM
      endHour: 8, // 8 AM
    },
    maxNotificationsPerDay: 10,
    preferredDeliveryTime: "immediate",
  };
}

/**
 * Limit notifications to max per day
 */
export function limitNotificationsPerDay(
  notifications: Notification[],
  maxPerDay: number
): Notification[] {
  // Sort by urgency (immediate > high > medium > low)
  const urgencyOrder = { immediate: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...notifications].sort(
    (a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
  );

  return sorted.slice(0, maxPerDay);
}
