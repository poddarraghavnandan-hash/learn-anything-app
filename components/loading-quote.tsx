import { View, Text, ActivityIndicator } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutDown } from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";
import { useEffect, useState } from "react";
import { getRandomQuote, PhilosophicalQuote } from "@/lib/philosophical-quotes";

interface LoadingQuoteProps {
  message?: string;
  rotateQuotes?: boolean; // Rotate quotes every few seconds
  rotationInterval?: number; // ms between quote rotations
}

/**
 * Animated Loading Quote Component
 * 
 * Displays philosophical quotes with smooth animations during loading.
 * Optionally rotates through multiple quotes to keep users engaged.
 */
export function LoadingQuote({
  message = "Loading...",
  rotateQuotes = true,
  rotationInterval = 5000,
}: LoadingQuoteProps) {
  const colors = useColors();
  const [quote, setQuote] = useState<PhilosophicalQuote | null>(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    // Set initial quote
    setQuote(getRandomQuote());

    if (!rotateQuotes) return;

    // Rotate quotes periodically
    const interval = setInterval(() => {
      setKey((prev) => prev + 1);
      setQuote(getRandomQuote());
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [rotateQuotes, rotationInterval]);

  if (!quote) {
    return (
      <View style={{ alignItems: "center", justifyContent: "center", gap: 24 }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.muted, fontSize: 14 }}>{message}</Text>
      </View>
    );
  }

  return (
    <View style={{ alignItems: "center", justifyContent: "center", gap: 32 }}>
      {/* Loading Indicator */}
      <ActivityIndicator size="large" color={colors.primary} />

      {/* Message */}
      <Text style={{ color: colors.muted, fontSize: 14, fontWeight: "500" }}>
        {message}
      </Text>

      {/* Animated Quote */}
      <Animated.View
        key={key}
        entering={SlideInUp.duration(600).delay(200)}
        exiting={SlideOutDown.duration(400)}
        style={{
          maxWidth: "90%",
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 20,
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
          }}
        >
          {/* Quote Text */}
          <Text
            style={{
              fontSize: 15,
              fontStyle: "italic",
              color: colors.foreground,
              lineHeight: 24,
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            "{quote.text}"
          </Text>

          {/* Author */}
          <Text
            style={{
              fontSize: 12,
              color: colors.muted,
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            — {quote.author}
          </Text>
        </View>
      </Animated.View>

      {/* Rotating Indicator (if rotating quotes) */}
      {rotateQuotes && (
        <Animated.View
          entering={FadeIn.duration(400).delay(800)}
          style={{
            flexDirection: "row",
            gap: 6,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.primary,
              opacity: 0.3,
            }}
          />
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.primary,
              opacity: 0.6,
            }}
          />
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.primary,
            }}
          />
        </Animated.View>
      )}
    </View>
  );
}

/**
 * Minimal Loading Quote (for compact spaces)
 */
export function MinimalLoadingQuote() {
  const colors = useColors();
  const [quote, setQuote] = useState<PhilosophicalQuote | null>(null);

  useEffect(() => {
    setQuote(getRandomQuote());
  }, []);

  if (!quote) {
    return <ActivityIndicator size="small" color={colors.primary} />;
  }

  return (
    <Animated.View entering={FadeIn.duration(400)}>
      <Text
        style={{
          fontSize: 13,
          fontStyle: "italic",
          color: colors.muted,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        "{quote.text}"
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: colors.muted,
          textAlign: "center",
          marginTop: 8,
          opacity: 0.7,
        }}
      >
        — {quote.author}
      </Text>
    </Animated.View>
  );
}
