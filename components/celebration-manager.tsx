import { useEffect, useRef } from "react";
import { useLearning } from "@/lib/learning-store";
import { getLevel, BADGE_DEFINITIONS } from "@/shared/types";
import type { BadgeId } from "@/shared/types";
import { CelebrationOverlay, useCelebrationQueue, type CelebrationData } from "./celebration-overlay";
import { SessionEndPrompt, useSessionEndPrompt } from "./session-end-prompt";

const STREAK_MILESTONES = [7, 30, 100, 365];

const STREAK_MESSAGES: Record<number, { emoji: string; title: string; subtitle: string }> = {
  7: { emoji: "\u{1F525}", title: "One week strong!", subtitle: "7 days of learning in a row. You're building a real habit." },
  30: { emoji: "\u{1F31F}", title: "30-day streak!", subtitle: "A full month of consistent learning. That's dedication." },
  100: { emoji: "\u{1F3C6}", title: "100-day legend!", subtitle: "100 days without missing a beat. You're in the top 1% of learners." },
  365: { emoji: "\u{1F451}", title: "One year streak!", subtitle: "365 days of learning. You've transformed how you think." },
};

const BADGE_MESSAGES: Record<string, { emoji: string; title: string }> = {
  first_quiz: { emoji: "\u{1F9E0}", title: "First Quiz Complete!" },
  streak_7: { emoji: "\u{1F525}", title: "7-Day Streak!" },
  streak_30: { emoji: "\u{1F31F}", title: "30-Day Streak!" },
  streak_100: { emoji: "\u{1F3C6}", title: "100-Day Streak!" },
  quiz_master_50: { emoji: "\u{1F4AF}", title: "Quiz Master (50)!" },
  quiz_master_100: { emoji: "\u{1F9D1}\u200D\u{1F393}", title: "Quiz Master (100)!" },
  explorer_5: { emoji: "\u{1F30D}", title: "Explorer (5 Topics)!" },
  explorer_10: { emoji: "\u{1F680}", title: "Explorer (10 Topics)!" },
  video_50: { emoji: "\u{1F3AC}", title: "50 Videos Watched!" },
  article_25: { emoji: "\u{1F4DA}", title: "25 Articles Read!" },
  level_5: { emoji: "\u2B50", title: "Level 5 Reached!" },
  level_10: { emoji: "\u{1F48E}", title: "Level 10 Reached!" },
  mind_blown_10: { emoji: "\u{1F92F}", title: "Mind Blown x10!" },
  daily_goal_7: { emoji: "\u{1F3AF}", title: "7 Daily Goals!" },
};

function checkBadge(profile: any, levelInfo: any, id: BadgeId): boolean {
  switch (id) {
    case "first_quiz": return profile.totalQuizAttempted >= 1;
    case "streak_7": return profile.longestStreak >= 7;
    case "streak_30": return profile.longestStreak >= 30;
    case "streak_100": return profile.longestStreak >= 100;
    case "quiz_master_50": return profile.totalQuizCorrect >= 50;
    case "quiz_master_100": return profile.totalQuizCorrect >= 100;
    case "explorer_5": return profile.interests.length >= 5;
    case "explorer_10": return profile.interests.length >= 10;
    case "video_50": return profile.totalVideos >= 50;
    case "article_25": return profile.totalArticles >= 25;
    case "level_5": return levelInfo.level >= 5;
    case "level_10": return levelInfo.level >= 10;
    case "mind_blown_10": return profile.mindBlownCount >= 10;
    case "daily_goal_7": return profile.dailyGoalsCompleted >= 7;
    default: return false;
  }
}

/**
 * CelebrationManager monitors the learning state and triggers celebrations
 * for badge unlocks, streak milestones, and level-ups.
 * Place this component inside the LearningProvider context.
 */
export function CelebrationManager() {
  const { state, dispatch } = useLearning();
  const { profile } = state;
  const levelInfo = getLevel(profile.totalXp);
  const { current, enqueue, dismiss } = useCelebrationQueue();
  const { showPrompt, handleContinue, handleStop } = useSessionEndPrompt();
  const prevBadgesRef = useRef<Set<BadgeId>>(new Set(state.unlockedBadges));
  const initialized = useRef(false);

  // Check for new badge unlocks
  useEffect(() => {
    if (!initialized.current) {
      // Skip first render to avoid celebrating existing badges
      initialized.current = true;
      prevBadgesRef.current = new Set(state.unlockedBadges);
      return;
    }

    for (const badge of BADGE_DEFINITIONS) {
      const isUnlocked = checkBadge(profile, levelInfo, badge.id);
      const wasUnlocked = prevBadgesRef.current.has(badge.id);

      if (isUnlocked && !wasUnlocked) {
        const msg = BADGE_MESSAGES[badge.id] || { emoji: "\u{1F3C5}", title: "Badge Unlocked!" };
        enqueue({
          type: "badge",
          emoji: msg.emoji,
          title: msg.title,
          subtitle: badge.name,
          detail: badge.description,
        });
        dispatch({ type: "UNLOCK_BADGE", payload: badge.id });
        prevBadgesRef.current.add(badge.id);
      }
    }
  }, [profile.totalXp, profile.totalQuizAttempted, profile.totalQuizCorrect, profile.totalVideos, profile.totalArticles, profile.interests.length, profile.longestStreak, profile.mindBlownCount, profile.dailyGoalsCompleted]);

  // Check for streak milestones
  useEffect(() => {
    const lastCelebrated = profile.lastCelebratedStreak || 0;
    for (const milestone of STREAK_MILESTONES) {
      if (profile.currentStreak >= milestone && lastCelebrated < milestone) {
        const msg = STREAK_MESSAGES[milestone];
        enqueue({
          type: "streak_milestone",
          emoji: msg.emoji,
          title: msg.title,
          subtitle: msg.subtitle,
        });
        dispatch({ type: "MARK_CELEBRATED_STREAK", payload: milestone });
        // Award a streak freeze at 7-day milestones
        if (milestone % 7 === 0) {
          dispatch({ type: "EARN_STREAK_FREEZE" });
        }
        break; // Only celebrate one milestone at a time
      }
    }
  }, [profile.currentStreak]);

  // Check for level-ups
  useEffect(() => {
    const lastCelebratedLevel = profile.lastCelebratedLevel || 0;
    if (levelInfo.level > lastCelebratedLevel && lastCelebratedLevel > 0) {
      enqueue({
        type: "level_up",
        emoji: "\u{1F680}",
        title: `Level ${levelInfo.level}!`,
        subtitle: `You're now a ${levelInfo.name}. Keep pushing your boundaries.`,
        detail: `${profile.totalXp} XP earned`,
      });
      dispatch({ type: "MARK_CELEBRATED_LEVEL", payload: levelInfo.level });
    } else if (lastCelebratedLevel === 0 && levelInfo.level > 0) {
      // Initialize without celebrating
      dispatch({ type: "MARK_CELEBRATED_LEVEL", payload: levelInfo.level });
    }
  }, [levelInfo.level]);

  return (
    <>
      <CelebrationOverlay celebration={current} onDismiss={dismiss} />
      <SessionEndPrompt visible={showPrompt} onContinue={handleContinue} onStop={handleStop} />
    </>
  );
}
