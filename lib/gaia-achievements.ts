/**
 * Gaia Achievements Service
 * Handles learning achievements, celebrations, and progress summaries
 * Integrates with Gaia voice for celebratory announcements
 */

import { gaiaVoice } from "./gaia-voice";

export interface Achievement {
  id: string;
  type: "first_answer" | "streak" | "mastery" | "speed" | "accuracy" | "milestone";
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  timestamp: number;
}

export interface LearningSession {
  topicsLearned: number;
  correctAnswers: number;
  totalAttempts: number;
  timeSpent: number; // in minutes
  currentStreak: number;
  masteredTopics: number;
}

export interface CelebrationData {
  achievement: Achievement;
  message: string;
  voiceMessage: string;
  celebrationIntensity: "light" | "medium" | "intense";
}

class GaiaAchievementsService {
  private achievements: Achievement[] = [];
  private currentSession: LearningSession = {
    topicsLearned: 0,
    correctAnswers: 0,
    totalAttempts: 0,
    timeSpent: 0,
    currentStreak: 0,
    masteredTopics: 0,
  };

  /**
   * Record a learning session update
   */
  updateSession(updates: Partial<LearningSession>): void {
    this.currentSession = {
      ...this.currentSession,
      ...updates,
    };
  }

  /**
   * Check for and create achievements
   */
  checkAchievements(session: LearningSession): Achievement[] {
    const newAchievements: Achievement[] = [];

    // First correct answer
    if (session.correctAnswers === 1) {
      newAchievements.push(this.createAchievement("first_answer"));
    }

    // 7-day streak
    if (session.currentStreak === 7) {
      newAchievements.push(this.createAchievement("streak", { streak: 7 }));
    }

    // 30-day streak
    if (session.currentStreak === 30) {
      newAchievements.push(this.createAchievement("streak", { streak: 30 }));
    }

    // Topic mastery (90%+ accuracy)
    const accuracy = session.correctAnswers / session.totalAttempts;
    if (accuracy >= 0.9 && session.masteredTopics > 0) {
      newAchievements.push(this.createAchievement("mastery"));
    }

    // Speed achievement (correct answer in < 30 seconds)
    // This would need additional timing data in real implementation

    // Accuracy milestone (95%+)
    if (accuracy >= 0.95) {
      newAchievements.push(this.createAchievement("accuracy"));
    }

    // Learning milestone (10, 50, 100 topics)
    if (session.topicsLearned === 10 || session.topicsLearned === 50 || session.topicsLearned === 100) {
      newAchievements.push(this.createAchievement("milestone", { count: session.topicsLearned }));
    }

    this.achievements.push(...newAchievements);
    return newAchievements;
  }

  /**
   * Create an achievement
   */
  private createAchievement(
    type: Achievement["type"],
    metadata?: Record<string, any>
  ): Achievement {
    const achievementData: Record<Achievement["type"], Omit<Achievement, "id" | "timestamp">> = {
      first_answer: {
        type: "first_answer",
        title: "First Step",
        description: "You got your first answer correct!",
        icon: "🎯",
        xpReward: 50,
      },
      streak: {
        type: "streak",
        title: `${metadata?.streak}-Day Streak! 🔥`,
        description: `You've been learning for ${metadata?.streak} days straight!`,
        icon: "🔥",
        xpReward: metadata?.streak === 7 ? 100 : 250,
      },
      mastery: {
        type: "mastery",
        title: "Topic Mastered",
        description: "You've achieved 90%+ accuracy on this topic!",
        icon: "👑",
        xpReward: 200,
      },
      speed: {
        type: "speed",
        title: "Lightning Fast",
        description: "You answered correctly in under 30 seconds!",
        icon: "⚡",
        xpReward: 75,
      },
      accuracy: {
        type: "accuracy",
        title: "Perfect Accuracy",
        description: "95%+ accuracy achieved!",
        icon: "✨",
        xpReward: 150,
      },
      milestone: {
        type: "milestone",
        title: `${metadata?.count} Topics Explored`,
        description: `You've explored ${metadata?.count} different topics!`,
        icon: "🌟",
        xpReward: metadata?.count === 10 ? 100 : metadata?.count === 50 ? 300 : 500,
      },
    };

    const data = achievementData[type];
    return {
      ...data,
      id: `achievement-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
  }

  /**
   * Generate celebration data for an achievement
   */
  generateCelebration(achievement: Achievement): CelebrationData {
    const celebrationMessages: Record<Achievement["type"], { message: string; voice: string }> = {
      first_answer: {
        message: "🎉 First Answer Correct! You're off to a great start!",
        voice: "Fantastic! You got your first answer right. This is just the beginning!",
      },
      streak: {
        message: "🔥 On Fire! Keep the momentum going!",
        voice: "Incredible! You're on a learning streak. Keep it up!",
      },
      mastery: {
        message: "👑 Topic Mastered! You're a pro!",
        voice: "Amazing! You've mastered this topic. You're crushing it!",
      },
      speed: {
        message: "⚡ Lightning Fast! That was quick!",
        voice: "Wow! You answered that incredibly fast and correctly!",
      },
      accuracy: {
        message: "✨ Perfect Accuracy! Flawless!",
        voice: "Perfect! You've achieved 95 percent accuracy. Exceptional work!",
      },
      milestone: {
        message: "🌟 Major Milestone! You're unstoppable!",
        voice: "Congratulations! You've reached a major milestone in your learning journey!",
      },
    };

    const messages = celebrationMessages[achievement.type];
    const intensity = this.calculateCelebrationIntensity(achievement.xpReward);

    return {
      achievement,
      message: messages.message,
      voiceMessage: messages.voice,
      celebrationIntensity: intensity,
    };
  }

  /**
   * Calculate celebration intensity based on XP reward
   */
  private calculateCelebrationIntensity(xpReward: number): "light" | "medium" | "intense" {
    if (xpReward >= 200) return "intense";
    if (xpReward >= 100) return "medium";
    return "light";
  }

  /**
   * Generate learning session summary
   */
  generateSessionSummary(session: LearningSession): string {
    const accuracy = session.totalAttempts > 0 ? (session.correctAnswers / session.totalAttempts * 100).toFixed(1) : 0;
    const hours = Math.floor(session.timeSpent / 60);
    const minutes = session.timeSpent % 60;

    let timeStr = "";
    if (hours > 0) {
      timeStr = `${hours} hour${hours > 1 ? "s" : ""} and ${minutes} minutes`;
    } else {
      timeStr = `${minutes} minutes`;
    }

    return `Session Summary:\n\n📚 Topics Explored: ${session.topicsLearned}\n✅ Correct Answers: ${session.correctAnswers}/${session.totalAttempts}\n🎯 Accuracy: ${accuracy}%\n⏱️ Time Spent: ${timeStr}\n🔥 Current Streak: ${session.currentStreak} days\n👑 Topics Mastered: ${session.masteredTopics}`;
  }

  /**
   * Trigger celebration with voice
   */
  async celebrateAchievement(achievement: Achievement): Promise<void> {
    const celebration = this.generateCelebration(achievement);

    // Play voice celebration
    await gaiaVoice.speak(celebration.voiceMessage, "celebration");
  }

  /**
   * Get all achievements
   */
  getAchievements(): Achievement[] {
    return this.achievements;
  }

  /**
   * Get recent achievements
   */
  getRecentAchievements(count: number = 5): Achievement[] {
    return this.achievements.slice(-count).reverse();
  }

  /**
   * Calculate total XP from achievements
   */
  getTotalXP(): number {
    return this.achievements.reduce((sum, achievement) => sum + achievement.xpReward, 0);
  }
}

// Export singleton instance
export const gaiaAchievements = new GaiaAchievementsService();
