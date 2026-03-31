/**
 * Delightful Interactions Library
 * 
 * Micro-interactions, haptics, and animations that make the app feel alive and joyful
 */

import * as Haptics from "expo-haptics";
import { Easing } from "react-native-reanimated";

/**
 * Haptic feedback patterns for different interactions
 */
export const hapticPatterns = {
  // Soft tap for minor interactions
  softTap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  // Medium tap for confirmations
  mediumTap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  // Strong tap for major actions
  strongTap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

  // Success celebration
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  // Warning alert
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),

  // Error alert
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),

  // Double tap pattern
  doubleTap: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  // Triple tap pattern (celebration)
  tripleTap: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise((resolve) => setTimeout(resolve, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise((resolve) => setTimeout(resolve, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
};

/**
 * Animation configurations for common interactions
 */
export const animationConfigs = {
  // Quick press feedback
  quickPress: {
    duration: 80,
    scale: 0.95,
    easing: Easing.out(Easing.cubic),
  },

  // Smooth transition
  smoothTransition: {
    duration: 300,
    easing: Easing.out(Easing.cubic),
  },

  // Bounce effect
  bounce: {
    damping: 8,
    mass: 1,
    stiffness: 100,
  },

  // Gentle spring
  gentleSpring: {
    damping: 10,
    mass: 1,
    stiffness: 80,
  },

  // Playful spring
  playfulSpring: {
    damping: 6,
    mass: 1,
    stiffness: 120,
  },

  // Entrance animation
  entrance: {
    duration: 400,
    easing: Easing.out(Easing.cubic),
  },

  // Exit animation
  exit: {
    duration: 300,
    easing: Easing.in(Easing.cubic),
  },
};

/**
 * Interaction feedback combinations
 */
export const interactions = {
  // Button press with haptic and visual feedback
  buttonPress: async () => {
    await hapticPatterns.softTap();
  },

  // Achievement unlock
  achievementUnlock: async () => {
    await hapticPatterns.tripleTap();
  },

  // Correct answer
  correctAnswer: async () => {
    await hapticPatterns.success();
  },

  // Incorrect answer
  incorrectAnswer: async () => {
    await hapticPatterns.warning();
  },

  // Streak milestone
  streakMilestone: async () => {
    await hapticPatterns.tripleTap();
  },

  // Level up
  levelUp: async () => {
    await hapticPatterns.success();
  },

  // Swipe gesture
  swipeGesture: async () => {
    await hapticPatterns.softTap();
  },

  // Long press
  longPress: async () => {
    await hapticPatterns.mediumTap();
  },

  // Scroll bounce
  scrollBounce: async () => {
    // Subtle haptic at scroll boundary
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  // Notification arrival
  notificationArrival: async () => {
    await hapticPatterns.mediumTap();
  },

  // Error/failure
  failure: async () => {
    await hapticPatterns.error();
  },

  // Completion/success
  completion: async () => {
    await hapticPatterns.success();
  },
};

/**
 * Easing functions for smooth animations
 */
export const easings = {
  // Smooth entrance
  easeInOutCubic: Easing.inOut(Easing.cubic),

  // Quick entrance
  easeOutQuad: Easing.out(Easing.quad),

  // Bouncy entrance
  easeOutBounce: Easing.bounce,

  // Natural deceleration
  easeOutCubic: Easing.out(Easing.cubic),

  // Accelerating
  easeInCubic: Easing.in(Easing.cubic),

  // Back effect
  easeOutBack: Easing.out(Easing.back(1.2)),
};

/**
 * Timing configurations
 */
export const timings = {
  // Instant feedback
  instant: 0,

  // Quick (micro-interaction)
  quick: 150,

  // Normal (standard transition)
  normal: 300,

  // Slow (emphasis)
  slow: 500,

  // Very slow (dramatic)
  verySlow: 800,

  // Delay before action
  delayShort: 100,
  delayMedium: 300,
  delayLong: 500,
};

/**
 * Color transitions for feedback
 */
export const colorFeedback = {
  // Success state
  success: "#10B981",

  // Error state
  error: "#EF4444",

  // Warning state
  warning: "#F59E0B",

  // Info state
  info: "#3B82F6",

  // Neutral state
  neutral: "#64748B",
};

/**
 * Scale values for animations
 */
export const scales = {
  // Tiny
  tiny: 0.8,

  // Small
  small: 0.9,

  // Normal
  normal: 1,

  // Large
  large: 1.1,

  // Huge
  huge: 1.2,

  // Press effect
  press: 0.95,

  // Hover effect
  hover: 1.05,
};

/**
 * Opacity values for fade effects
 */
export const opacities = {
  // Invisible
  hidden: 0,

  // Very faint
  veryFaint: 0.2,

  // Faint
  faint: 0.4,

  // Semi-transparent
  semiTransparent: 0.6,

  // Mostly visible
  mostlyVisible: 0.8,

  // Fully visible
  visible: 1,

  // Disabled state
  disabled: 0.5,

  // Hover state
  hover: 0.9,

  // Press state
  press: 0.7,
};

/**
 * Rotation values for animations
 */
export const rotations = {
  // Quarter turn
  quarter: 90,

  // Half turn
  half: 180,

  // Three quarters
  threeQuarters: 270,

  // Full turn
  full: 360,

  // Slight tilt
  tilt: 5,

  // Gentle spin
  gentleSpin: 360,
};

/**
 * Combine multiple interactions for complex feedback
 */
export async function complexInteraction(
  hapticType: "success" | "error" | "warning" | "tap",
  delayMs: number = 0
) {
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  switch (hapticType) {
    case "success":
      await interactions.correctAnswer();
      break;
    case "error":
      await interactions.incorrectAnswer();
      break;
    case "warning":
      await interactions.failure();
      break;
    case "tap":
      await interactions.buttonPress();
      break;
  }
}
