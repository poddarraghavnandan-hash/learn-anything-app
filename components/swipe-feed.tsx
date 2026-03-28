import React, { useState, useRef, useEffect } from "react";
import { View, Animated, PanResponder, Dimensions, Text } from "react-native";
import { FeedCard, type FeedCardData } from "./feed-card";
import { useColors } from "@/hooks/use-colors";

export interface SwipeFeedProps {
  cards: FeedCardData[];
  onCardComplete?: (cardId: string, data?: any) => void;
  onCardSave?: (cardId: string) => void;
  isLoading?: boolean;
  onLoadMore?: () => void;
}

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

/**
 * SwipeFeed - TikTok-style vertical swipe feed for learning
 * 
 * Supports:
 * - Swipe up/down to navigate cards
 * - Swipe right to open full content detail
 * - Double tap to mark as "Got it"
 * - Long press to save to collection
 * - Smooth animations between cards
 */
export function SwipeFeed({
  cards,
  onCardComplete,
  onCardSave,
  isLoading,
  onLoadMore,
}: SwipeFeedProps) {
  const colors = useColors();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, { dy }) => {
        animatedValue.setValue(dy);
      },
      onPanResponderRelease: (evt, { dy, vy }) => {
        const threshold = screenHeight * 0.2;
        const shouldSwipe = Math.abs(dy) > threshold || Math.abs(vy) > 0.5;

        if (shouldSwipe) {
          if (dy > 0) {
            // Swiped down - go to previous card
            if (currentIndex > 0) {
              handleSwipeDown();
            } else {
              resetPosition();
            }
          } else {
            // Swiped up - go to next card
            if (currentIndex < cards.length - 1) {
              handleSwipeUp();
            } else {
              resetPosition();
              onLoadMore?.();
            }
          }
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const resetPosition = () => {
    Animated.spring(animatedValue, {
      toValue: 0,
      useNativeDriver: false,
      speed: 10,
      bounciness: 5,
    }).start();
  };

  const handleSwipeUp = () => {
    Animated.timing(animatedValue, {
      toValue: -screenHeight,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setCurrentIndex(currentIndex + 1);
      setNextIndex(currentIndex + 2);
      animatedValue.setValue(0);
    });
  };

  const handleSwipeDown = () => {
    Animated.timing(animatedValue, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setCurrentIndex(currentIndex - 1);
      setNextIndex(currentIndex);
      animatedValue.setValue(0);
    });
  };

  if (!cards || cards.length === 0) {
    return (
      <View
        style={{
          height: screenHeight,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.muted, fontSize: 16 }}>
          {isLoading ? "Loading cards..." : "No cards available"}
        </Text>
      </View>
    );
  }

  const currentCard = cards[currentIndex];
  const nextCard = cards[nextIndex];

  return (
    <View
      style={{ height: screenHeight, backgroundColor: colors.background }}
      {...panResponder.panHandlers}
    >
      {/* Current Card */}
      <Animated.View
        style={{
          height: screenHeight,
          transform: [{ translateY: animatedValue }],
        }}
      >
        <FeedCard
          {...currentCard}
          onComplete={onCardComplete}
          onSave={onCardSave}
        />
      </Animated.View>

      {/* Next Card (preloaded below) */}
      {nextCard && (
        <Animated.View
          style={{
            position: "absolute",
            top: screenHeight,
            left: 0,
            right: 0,
            height: screenHeight,
            transform: [{ translateY: animatedValue }],
          }}
        >
          <FeedCard
            {...nextCard}
            onComplete={onCardComplete}
            onSave={onCardSave}
          />
        </Animated.View>
      )}

      {/* Previous Card (preloaded above) */}
      {currentIndex > 0 && (
        <Animated.View
          style={{
            position: "absolute",
            top: -screenHeight,
            left: 0,
            right: 0,
            height: screenHeight,
            transform: [{ translateY: animatedValue }],
          }}
        >
          <FeedCard
            {...cards[currentIndex - 1]}
            onComplete={onCardComplete}
            onSave={onCardSave}
          />
        </Animated.View>
      )}

      {/* Card Counter */}
      <View
        style={{
          position: "absolute",
          bottom: 20,
          right: 16,
          backgroundColor: colors.primary + "80",
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
        }}
      >
        <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>
          {currentIndex + 1} / {cards.length}
        </Text>
      </View>
    </View>
  );
}
