/**
 * Gaia Voice Service
 * Handles text-to-speech for Gaia companion responses
 * Provides voice feedback, achievement celebrations, and coaching guidance
 */

import * as Speech from "expo-speech";
import { Platform } from "react-native";

export interface VoiceOptions {
  rate?: number; // 0.5 - 2.0 (default: 1.0)
  pitch?: number; // 0.5 - 2.0 (default: 1.0)
  volume?: number; // 0.0 - 1.0 (default: 1.0)
}

export type GaiaVoiceType = "coaching" | "celebration" | "encouragement" | "summary" | "guidance";

class GaiaVoiceService {
  private isAvailable: boolean = Platform.OS !== "web";
  private isPlaying: boolean = false;
  private currentUtterance: string = "";

  /**
   * Initialize voice service
   */
  async initialize(): Promise<void> {
    if (!this.isAvailable) return;

    try {
      // Check if speech synthesis is available
      const voices = await Speech.getAvailableVoicesAsync();
      this.isAvailable = voices.length > 0;
    } catch (error) {
      console.warn("Speech synthesis not available:", error);
      this.isAvailable = false;
    }
  }

  /**
   * Speak text with Gaia voice
   */
  async speak(
    text: string,
    voiceType: GaiaVoiceType = "guidance",
    options?: VoiceOptions
  ): Promise<void> {
    if (!this.isAvailable || !text) return;

    try {
      // Stop any current speech
      await this.stop();

      this.currentUtterance = text;
      this.isPlaying = true;

      // Get voice options based on type
      const voiceOptions = this.getVoiceOptions(voiceType, options);

      // Speak the text
      await Speech.speak(text, {
        language: "en-US",
        rate: voiceOptions.rate,
        pitch: voiceOptions.pitch,
        volume: voiceOptions.volume,
        onDone: () => {
          this.isPlaying = false;
        },
        onError: (error: any) => {
          console.warn("Speech error:", error);
          this.isPlaying = false;
        },
      });
    } catch (error) {
      console.warn("Failed to speak:", error);
      this.isPlaying = false;
    }
  }

  /**
   * Stop current speech
   */
  async stop(): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await Speech.stop();
      this.isPlaying = false;
    } catch (error) {
      console.warn("Failed to stop speech:", error);
    }
  }

  /**
   * Check if currently speaking
   */
  isCurrentlySpeaking(): boolean {
    return this.isPlaying;
  }

  /**
   * Get voice options based on voice type
   */
  private getVoiceOptions(
    voiceType: GaiaVoiceType,
    overrides?: VoiceOptions
  ): Required<VoiceOptions> {
    const defaults: Record<GaiaVoiceType, Required<VoiceOptions>> = {
      coaching: {
        rate: 0.95, // Slightly slower for clarity
        pitch: 1.0, // Normal pitch
        volume: 0.9,
      },
      celebration: {
        rate: 1.1, // Slightly faster, energetic
        pitch: 1.1, // Slightly higher pitch for excitement
        volume: 1.0,
      },
      encouragement: {
        rate: 0.9, // Slower, warm
        pitch: 0.95, // Slightly lower for warmth
        volume: 0.95,
      },
      summary: {
        rate: 0.85, // Slower for comprehension
        pitch: 1.0, // Normal pitch
        volume: 0.9,
      },
      guidance: {
        rate: 0.9, // Slightly slower for clarity
        pitch: 1.0, // Normal pitch
        volume: 0.9,
      },
    };

    return {
      ...defaults[voiceType],
      ...overrides,
    };
  }

  /**
   * Generate coaching message
   */
  generateCoachingMessage(topic: string, difficulty: string): string {
    const messages = [
      `Let's explore ${topic} together. I'll guide you through this step by step.`,
      `Great choice! ${topic} is an exciting topic. Ready to dive in?`,
      `I'm excited to help you master ${topic}. Let's start with the fundamentals.`,
      `${topic} can be challenging, but I believe in you. Let's break it down together.`,
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Generate celebration message
   */
  generateCelebrationMessage(achievement: string, streak?: number): string {
    const messages = [
      `Fantastic! You nailed that ${achievement}!`,
      `Incredible work! You're crushing it with ${achievement}!`,
      `Yes! You got it! That ${achievement} was perfect!`,
      `Amazing! You're on fire with ${achievement}!`,
      `Brilliant! You mastered ${achievement}! Keep it up!`,
    ];

    let message = messages[Math.floor(Math.random() * messages.length)];

    if (streak && streak > 1) {
      message += ` You're on a ${streak}-day learning streak!`;
    }

    return message;
  }

  /**
   * Generate encouragement message
   */
  generateEncouragementMessage(context: string): string {
    const messages = [
      `You're doing great! Keep pushing forward.`,
      `I believe in you. You've got this!`,
      `Don't give up! You're making real progress.`,
      `Every step counts. You're getting closer!`,
      `You're learning so much. I'm proud of your effort!`,
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Generate summary message
   */
  generateSummaryMessage(
    topicsLearned: number,
    timeSpent: number,
    masteredCount: number
  ): string {
    const hours = Math.floor(timeSpent / 60);
    const minutes = timeSpent % 60;

    let timeStr = "";
    if (hours > 0) {
      timeStr = `${hours} hour${hours > 1 ? "s" : ""} and ${minutes} minutes`;
    } else {
      timeStr = `${minutes} minutes`;
    }

    return `You've explored ${topicsLearned} topics in ${timeStr}, and mastered ${masteredCount} of them. Excellent progress!`;
  }
}

// Export singleton instance
export const gaiaVoice = new GaiaVoiceService();
