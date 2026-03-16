import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const REMINDER_STORAGE_KEY = "learn_anything_reminder";
const PEAK_HOURS_KEY = "learn_anything_peak_hours";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReminderSettings {
  enabled: boolean;
  hour: number;    // 0-23
  minute: number;  // 0-59
  useSmartTiming: boolean;
}

const DEFAULT_REMINDER: ReminderSettings = {
  enabled: false,
  hour: 9,
  minute: 0,
  useSmartTiming: false,
};

// ─── Setup ────────────────────────────────────────────────────────────────────

export async function setupNotifications() {
  if (Platform.OS === "web") return;

  // Set foreground handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Setup Android channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("learning-reminders", {
      name: "Learning Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// ─── Reminder Settings ────────────────────────────────────────────────────────

export async function getReminderSettings(): Promise<ReminderSettings> {
  try {
    const stored = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_REMINDER;
}

export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(settings));
  if (settings.enabled) {
    await scheduleDailyReminder(settings);
  } else {
    await cancelAllReminders();
  }
}

// ─── Schedule Reminders ───────────────────────────────────────────────────────

const REMINDER_MESSAGES = [
  { title: "Time to learn!", body: "Your brain is ready for something new. Just 5 minutes?" },
  { title: "Curiosity calling", body: "There's a concept waiting for you. Tap to explore." },
  { title: "Keep the streak alive!", body: "Don't break your learning streak. Quick session?" },
  { title: "Your daily dose of knowledge", body: "One concept a day keeps ignorance away." },
  { title: "Ready for a quick burst?", body: "60 seconds is all it takes to learn something new." },
  { title: "Your brain will thank you", body: "A few minutes of learning goes a long way." },
];

async function scheduleDailyReminder(settings: ReminderSettings) {
  if (Platform.OS === "web") return;

  // Cancel existing reminders first
  await cancelAllReminders();

  let hour = settings.hour;
  let minute = settings.minute;

  // Smart timing: use peak activity hours if available
  if (settings.useSmartTiming) {
    const peakHour = await getSmartReminderHour();
    if (peakHour !== null) {
      hour = peakHour;
      minute = 0;
    }
  }

  // Pick a random message
  const msg = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: msg.title,
      body: msg.body,
      data: { type: "learning_reminder" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

async function cancelAllReminders() {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Smart Timing ─────────────────────────────────────────────────────────────

export async function recordActivityHour() {
  try {
    const hour = new Date().getHours();
    const stored = await AsyncStorage.getItem(PEAK_HOURS_KEY);
    const hours: number[] = stored ? JSON.parse(stored) : [];
    hours.push(hour);
    // Keep last 100 entries
    const trimmed = hours.slice(-100);
    await AsyncStorage.setItem(PEAK_HOURS_KEY, JSON.stringify(trimmed));
  } catch {}
}

async function getSmartReminderHour(): Promise<number | null> {
  try {
    const stored = await AsyncStorage.getItem(PEAK_HOURS_KEY);
    if (!stored) return null;
    const hours: number[] = JSON.parse(stored);
    if (hours.length < 5) return null; // Need enough data

    // Find the most common hour
    const counts: Record<number, number> = {};
    for (const h of hours) {
      counts[h] = (counts[h] || 0) + 1;
    }

    let peakHour = 9;
    let maxCount = 0;
    for (const [h, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        peakHour = Number(h);
      }
    }

    // Schedule reminder 1 hour before peak activity
    return (peakHour - 1 + 24) % 24;
  } catch {
    return null;
  }
}

// ─── Daily Digest ─────────────────────────────────────────────────────────────

export interface DailyDigest {
  date: string;
  minutesLearned: number;
  conceptsExplored: number;
  quizAccuracy: number;
  streak: number;
  xpEarned: number;
  topTopic: string;
  encouragement: string;
}

export function generateDailyDigest(profile: {
  totalMinutes: number;
  totalXp: number;
  currentStreak: number;
  totalQuizCorrect: number;
  totalQuizAttempted: number;
  interests: string[];
  dailyGoalMinutes: number;
}): DailyDigest {
  const today = new Date().toISOString().split("T")[0];
  const accuracy = profile.totalQuizAttempted > 0
    ? Math.round((profile.totalQuizCorrect / profile.totalQuizAttempted) * 100)
    : 0;

  const topTopic = profile.interests[0]?.replace(/-/g, " ") || "general";

  // Generate encouragement based on streak
  let encouragement: string;
  if (profile.currentStreak >= 30) {
    encouragement = "You're on an incredible streak! Your consistency is building deep knowledge.";
  } else if (profile.currentStreak >= 7) {
    encouragement = "A week-long streak! You're building a powerful learning habit.";
  } else if (profile.currentStreak >= 3) {
    encouragement = "Three days in a row — momentum is building. Keep it up!";
  } else if (profile.currentStreak >= 1) {
    encouragement = "Great job showing up today. Every session counts.";
  } else {
    encouragement = "Welcome back! Today is a fresh start. Let's learn something new.";
  }

  return {
    date: today,
    minutesLearned: profile.totalMinutes,
    conceptsExplored: profile.interests.length,
    quizAccuracy: accuracy,
    streak: profile.currentStreak,
    xpEarned: profile.totalXp,
    topTopic,
    encouragement,
  };
}
