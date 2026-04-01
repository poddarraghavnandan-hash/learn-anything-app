/**
 * Learning Behavior Tracker
 *
 * Records and analyzes user learning behavior signals in real-time
 * Tracks engagement, comprehension, confidence, and pacing
 */

export interface BehaviorSignal {
  userId: string;
  lessonId: string;
  topic: string;
  approach: string;
  timestamp: Date;
  signalType: "engagement" | "comprehension" | "confidence" | "pacing" | "interaction";
  value: number; // 0-100 scale
  metadata?: Record<string, any>;
}

export interface LearningSession {
  userId: string;
  lessonId: string;
  topic: string;
  approach: string;
  startTime: Date;
  endTime?: Date;
  timeSpentSeconds: number;
  signals: BehaviorSignal[];
  engagementScore: number; // 0-100
  comprehensionScore: number; // 0-100
  confidenceScore: number; // 0-100
  pacingScore: number; // 0-100 (1 = too slow, 50 = optimal, 100 = too fast)
}

export interface BehaviorProfile {
  userId: string;
  totalLessonsCompleted: number;
  averageEngagement: number;
  averageComprehension: number;
  averageConfidence: number;
  preferredPacing: "slow" | "moderate" | "fast";
  peakLearningHours: number[]; // 0-23
  engagementType: "visual" | "kinesthetic" | "auditory" | "reading";
  strugglingTopics: string[];
  strongTopics: string[];
  lastUpdated: Date;
}

export class BehaviorTracker {
  private sessions: Map<string, LearningSession> = new Map();
  private profiles: Map<string, BehaviorProfile> = new Map();

  /**
   * Start a new learning session
   */
  startSession(userId: string, lessonId: string, topic: string, approach: string): LearningSession {
    const sessionKey = `${userId}-${lessonId}-${Date.now()}`;
    const session: LearningSession = {
      userId,
      lessonId,
      topic,
      approach,
      startTime: new Date(),
      timeSpentSeconds: 0,
      signals: [],
      engagementScore: 0,
      comprehensionScore: 0,
      confidenceScore: 0,
      pacingScore: 50,
    };

    this.sessions.set(sessionKey, session);
    return session;
  }

  /**
   * Record a behavior signal during a learning session
   */
  recordSignal(
    userId: string,
    lessonId: string,
    signalType: BehaviorSignal["signalType"],
    value: number,
    metadata?: Record<string, any>
  ): void {
    const sessions = Array.from(this.sessions.values()).filter(
      (s) => s.userId === userId && s.lessonId === lessonId && !s.endTime
    );

    if (sessions.length === 0) {
      console.warn(`No active session found for user ${userId}, lesson ${lessonId}`);
      return;
    }

    const session = sessions[0];
    const signal: BehaviorSignal = {
      userId,
      lessonId,
      topic: session.topic,
      approach: session.approach,
      timestamp: new Date(),
      signalType,
      value: Math.max(0, Math.min(100, value)), // Clamp 0-100
      metadata,
    };

    session.signals.push(signal);
    this.updateSessionScores(session);
  }

  /**
   * End a learning session and persist behavior data
   */
  endSession(userId: string, lessonId: string): LearningSession | null {
    const sessions = Array.from(this.sessions.values()).filter(
      (s) => s.userId === userId && s.lessonId === lessonId && !s.endTime
    );

    if (sessions.length === 0) {
      return null;
    }

    const session = sessions[0];
    session.endTime = new Date();
    session.timeSpentSeconds = Math.round(
      (session.endTime.getTime() - session.startTime.getTime()) / 1000
    );

    // Update user profile
    this.updateUserProfile(userId, session);

    return session;
  }

  /**
   * Update session scores based on signals
   */
  private updateSessionScores(session: LearningSession): void {
    if (session.signals.length === 0) return;

    // Calculate average scores by signal type
    const engagementSignals = session.signals.filter((s) => s.signalType === "engagement");
    const comprehensionSignals = session.signals.filter((s) => s.signalType === "comprehension");
    const confidenceSignals = session.signals.filter((s) => s.signalType === "confidence");
    const pacingSignals = session.signals.filter((s) => s.signalType === "pacing");

    if (engagementSignals.length > 0) {
      session.engagementScore =
        engagementSignals.reduce((sum, s) => sum + s.value, 0) / engagementSignals.length;
    }

    if (comprehensionSignals.length > 0) {
      session.comprehensionScore =
        comprehensionSignals.reduce((sum, s) => sum + s.value, 0) / comprehensionSignals.length;
    }

    if (confidenceSignals.length > 0) {
      session.confidenceScore =
        confidenceSignals.reduce((sum, s) => sum + s.value, 0) / confidenceSignals.length;
    }

    if (pacingSignals.length > 0) {
      session.pacingScore = pacingSignals.reduce((sum, s) => sum + s.value, 0) / pacingSignals.length;
    }
  }

  /**
   * Update user profile based on completed session
   */
  private updateUserProfile(userId: string, session: LearningSession): void {
    let profile = this.profiles.get(userId);

    if (!profile) {
      profile = {
        userId,
        totalLessonsCompleted: 0,
        averageEngagement: 0,
        averageComprehension: 0,
        averageConfidence: 0,
        preferredPacing: "moderate",
        peakLearningHours: [],
        engagementType: "mixed" as any,
        strugglingTopics: [],
        strongTopics: [],
        lastUpdated: new Date(),
      };
    }

    // Update aggregates
    const totalSessions = profile.totalLessonsCompleted + 1;
    profile.averageEngagement =
      (profile.averageEngagement * profile.totalLessonsCompleted + session.engagementScore) /
      totalSessions;
    profile.averageComprehension =
      (profile.averageComprehension * profile.totalLessonsCompleted + session.comprehensionScore) /
      totalSessions;
    profile.averageConfidence =
      (profile.averageConfidence * profile.totalLessonsCompleted + session.confidenceScore) /
      totalSessions;
    profile.totalLessonsCompleted = totalSessions;

    // Determine pacing preference
    if (session.pacingScore < 40) {
      profile.preferredPacing = "slow";
    } else if (session.pacingScore > 60) {
      profile.preferredPacing = "fast";
    } else {
      profile.preferredPacing = "moderate";
    }

    // Track peak learning hours
    const hour = session.startTime.getHours();
    if (!profile.peakLearningHours.includes(hour)) {
      profile.peakLearningHours.push(hour);
    }

    // Track struggling vs strong topics
    if (session.comprehensionScore < 50) {
      if (!profile.strugglingTopics.includes(session.topic)) {
        profile.strugglingTopics.push(session.topic);
      }
    } else if (session.comprehensionScore > 75) {
      if (!profile.strongTopics.includes(session.topic)) {
        profile.strongTopics.push(session.topic);
      }
      // Remove from struggling if now strong
      profile.strugglingTopics = profile.strugglingTopics.filter((t) => t !== session.topic);
    }

    profile.lastUpdated = new Date();
    this.profiles.set(userId, profile);
  }

  /**
   * Get user's behavior profile
   */
  getUserProfile(userId: string): BehaviorProfile | undefined {
    return this.profiles.get(userId);
  }

  /**
   * Get all sessions for a user
   */
  getUserSessions(userId: string): LearningSession[] {
    return Array.from(this.sessions.values()).filter((s) => s.userId === userId);
  }

  /**
   * Get completed sessions for a user
   */
  getCompletedSessions(userId: string): LearningSession[] {
    return this.getUserSessions(userId).filter((s) => s.endTime !== undefined);
  }

  /**
   * Detect if user is struggling in current session
   */
  detectStruggle(userId: string, lessonId: string): boolean {
    const sessions = Array.from(this.sessions.values()).filter(
      (s) => s.userId === userId && s.lessonId === lessonId && !s.endTime
    );

    if (sessions.length === 0) return false;

    const session = sessions[0];
    const comprehensionSignals = session.signals.filter((s) => s.signalType === "comprehension");

    if (comprehensionSignals.length < 2) return false;

    const recentScore =
      comprehensionSignals.slice(-2).reduce((sum, s) => sum + s.value, 0) /
      Math.min(2, comprehensionSignals.length);

    return recentScore < 40; // Struggling if comprehension < 40
  }

  /**
   * Predict next approach based on behavior
   */
  predictNextApproach(userId: string, topic: string): string {
    const profile = this.getUserProfile(userId);
    if (!profile) return "mixed";

    // If struggling, suggest more interactive approach
    if (profile.strugglingTopics.includes(topic)) {
      return "experiential"; // Hands-on learning
    }

    // If strong, suggest more challenging approach
    if (profile.strongTopics.includes(topic)) {
      return "problem-based"; // Real-world problems
    }

    // Default to mixed
    return "mixed";
  }
}

// Singleton instance
export const behaviorTracker = new BehaviorTracker();
