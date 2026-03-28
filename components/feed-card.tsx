import React, { useState } from "react";
import { View, Text, Pressable, Image, ScrollView, Dimensions } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "./ui/icon-symbol";
import * as Haptics from "expo-haptics";

/**
 * Feed card types based on design.md
 * - Video: YouTube micro-content (3-10 min), 40% frequency
 * - Article: Web article summary + link, 20% frequency
 * - Quiz: Active recall checkpoint, 20% frequency
 * - Review: Spaced repetition, 10% frequency
 * - Insight: AI-generated topic connection, 10% frequency
 */

export type FeedCardType = "video" | "article" | "quiz" | "review" | "insight";

export interface FeedCardData {
  id: string;
  type: FeedCardType;
  topic: string;
  topicEmoji?: string;
  source?: string; // YouTube channel or website
  duration?: number; // minutes for video, reading time for article
  title: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  articleUrl?: string;
  // Quiz specific
  question?: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
  // Review specific
  confidenceRating?: 1 | 2 | 3 | 4 | 5;
  lastReviewDate?: string;
  // Insight specific
  relatedTopics?: string[];
}

export interface FeedCardProps extends FeedCardData {
  onSave?: (id: string) => void;
  onComplete?: (id: string, data?: any) => void;
  onAnswer?: (id: string, answerIndex: number) => void;
  onConfidenceRate?: (id: string, rating: 1 | 2 | 3 | 4 | 5) => void;
}

const { height: screenHeight } = Dimensions.get("window");

/**
 * VideoCard - YouTube micro-content
 */
function VideoCard({
  id,
  title,
  description,
  imageUrl,
  source,
  duration,
  topic,
  topicEmoji,
  onSave,
  onComplete,
}: FeedCardProps) {
  const colors = useColors();
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSaved(!isSaved);
    onSave?.(id);
  };

  const handlePlay = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete?.(id);
  };

  return (
    <View
      style={{
        height: screenHeight,
        backgroundColor: colors.background,
        justifyContent: "space-between",
      }}
    >
      {/* Video Thumbnail */}
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: "100%",
            height: screenHeight * 0.55,
            backgroundColor: colors.surface,
          }}
        />
      )}

      {/* Content */}
      <View style={{ flex: 1, padding: 16, justifyContent: "space-between" }}>
        <View>
          {/* Topic Badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 14, color: colors.muted }}>
              {topicEmoji} {topic}
            </Text>
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: colors.foreground,
              marginBottom: 8,
              lineHeight: 28,
            }}
            numberOfLines={3}
          >
            {title}
          </Text>

          {/* Description */}
          {description && (
            <Text
              style={{
                fontSize: 14,
                color: colors.muted,
                lineHeight: 20,
                marginBottom: 12,
              }}
              numberOfLines={2}
            >
              {description}
            </Text>
          )}

          {/* Source & Duration */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.muted }}>
              {source}
            </Text>
            {duration && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <IconSymbol name="clock.fill" size={12} color={colors.muted} />
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {duration} min
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
          <Pressable
            onPress={handlePlay}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: colors.primary,
              paddingVertical: 12,
              borderRadius: 8,
              justifyContent: "center",
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <IconSymbol name="play.circle.fill" size={18} color="white" />
              <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
                Watch
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={handleSave}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: isSaved ? colors.primary : colors.border,
              justifyContent: "center",
              alignItems: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <IconSymbol
              name={isSaved ? "bookmark.fill" : "bookmark"}
              size={18}
              color={isSaved ? colors.primary : colors.muted}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/**
 * ArticleCard - Web article summary
 */
function ArticleCard({
  id,
  title,
  description,
  imageUrl,
  source,
  duration,
  topic,
  topicEmoji,
  onSave,
  onComplete,
}: FeedCardProps) {
  const colors = useColors();
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSaved(!isSaved);
    onSave?.(id);
  };

  const handleRead = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete?.(id);
  };

  return (
    <View
      style={{
        height: screenHeight,
        backgroundColor: colors.background,
        justifyContent: "space-between",
      }}
    >
      {/* Article Image */}
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: "100%",
            height: screenHeight * 0.4,
            backgroundColor: colors.surface,
          }}
        />
      )}

      {/* Content */}
      <ScrollView
        style={{ flex: 1, padding: 16 }}
        contentContainerStyle={{ justifyContent: "space-between" }}
      >
        {/* Topic Badge */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
            gap: 6,
          }}
        >
          <Text style={{ fontSize: 14, color: colors.muted }}>
            {topicEmoji} {topic}
          </Text>
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: colors.foreground,
            marginBottom: 12,
            lineHeight: 28,
          }}
          numberOfLines={4}
        >
          {title}
        </Text>

        {/* Description */}
        {description && (
          <Text
            style={{
              fontSize: 14,
              color: colors.muted,
              lineHeight: 20,
              marginBottom: 16,
            }}
            numberOfLines={4}
          >
            {description}
          </Text>
        )}

        {/* Source & Duration */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 12, color: colors.muted }}>{source}</Text>
          {duration && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <IconSymbol name="clock.fill" size={12} color={colors.muted} />
              <Text style={{ fontSize: 12, color: colors.muted }}>
                {duration} min read
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={handleRead}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: colors.primary,
              paddingVertical: 12,
              borderRadius: 8,
              justifyContent: "center",
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <IconSymbol name="arrow.right" size={18} color="white" />
              <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
                Read
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={handleSave}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: isSaved ? colors.primary : colors.border,
              justifyContent: "center",
              alignItems: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <IconSymbol
              name={isSaved ? "bookmark.fill" : "bookmark"}
              size={18}
              color={isSaved ? colors.primary : colors.muted}
            />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * QuizCard - Active recall checkpoint
 */
function QuizCard({
  id,
  question,
  options = [],
  correctAnswer,
  explanation,
  topic,
  topicEmoji,
  onAnswer,
}: FeedCardProps) {
  const colors = useColors();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const isCorrect = selectedAnswer === correctAnswer;

  const handleAnswer = async (index: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedAnswer(index);
    setShowFeedback(true);
    onAnswer?.(id, index);
  };

  return (
    <View
      style={{
        height: screenHeight,
        backgroundColor: colors.background,
        padding: 16,
        justifyContent: "space-between",
      }}
    >
      {/* Header */}
      <View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 24,
            gap: 6,
          }}
        >
          <Text style={{ fontSize: 14, color: colors.muted }}>
            {topicEmoji} {topic}
          </Text>
          <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>
            QUIZ
          </Text>
        </View>

        {/* Question */}
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: colors.foreground,
            lineHeight: 32,
            marginBottom: 24,
          }}
        >
          {question}
        </Text>
      </View>

      {/* Options */}
      <View style={{ gap: 12, marginBottom: 24 }}>
        {options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrectOption = index === correctAnswer;
          let backgroundColor = colors.surface;
          let borderColor = colors.border;
          let textColor = colors.foreground;

          if (showFeedback) {
            if (isCorrectOption) {
              backgroundColor = colors.success + "20";
              borderColor = colors.success;
              textColor = colors.success;
            } else if (isSelected && !isCorrect) {
              backgroundColor = colors.error + "20";
              borderColor = colors.error;
              textColor = colors.error;
            }
          } else if (isSelected) {
            backgroundColor = colors.primary + "20";
            borderColor = colors.primary;
          }

          return (
            <Pressable
              key={index}
              onPress={() => !showFeedback && handleAnswer(index)}
              disabled={showFeedback}
              style={({ pressed }) => ({
                backgroundColor,
                borderWidth: 2,
                borderColor,
                borderRadius: 12,
                padding: 16,
                opacity: pressed && !showFeedback ? 0.8 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "500",
                  color: textColor,
                  lineHeight: 22,
                }}
              >
                {String.fromCharCode(65 + index)}. {option}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Feedback */}
      {showFeedback && (
        <View
          style={{
            backgroundColor: isCorrect ? colors.success + "10" : colors.error + "10",
            borderLeftWidth: 4,
            borderLeftColor: isCorrect ? colors.success : colors.error,
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: isCorrect ? colors.success : colors.error,
              marginBottom: 8,
            }}
          >
            {isCorrect ? "✓ Correct!" : "✗ Not quite"}
          </Text>
          {explanation && (
            <Text
              style={{
                fontSize: 13,
                color: colors.foreground,
                lineHeight: 18,
              }}
            >
              {explanation}
            </Text>
          )}
        </View>
      )}

      {/* CTA */}
      {showFeedback && (
        <Pressable
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            paddingVertical: 12,
            borderRadius: 8,
            justifyContent: "center",
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
            Next Card
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/**
 * ReviewCard - Spaced repetition
 */
function ReviewCard({
  id,
  title,
  topic,
  topicEmoji,
  lastReviewDate,
  onConfidenceRate,
}: FeedCardProps) {
  const colors = useColors();
  const [selectedRating, setSelectedRating] = useState<1 | 2 | 3 | 4 | 5 | null>(
    null
  );

  const handleRate = async (rating: 1 | 2 | 3 | 4 | 5) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedRating(rating);
    onConfidenceRate?.(id, rating);
  };

  const ratings = [
    { value: 1, label: "Forgot", emoji: "😞" },
    { value: 2, label: "Hard", emoji: "😕" },
    { value: 3, label: "OK", emoji: "😐" },
    { value: 4, label: "Good", emoji: "🙂" },
    { value: 5, label: "Easy", emoji: "😄" },
  ] as const;

  return (
    <View
      style={{
        height: screenHeight,
        backgroundColor: colors.background,
        padding: 16,
        justifyContent: "space-between",
      }}
    >
      {/* Header */}
      <View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 24,
            gap: 6,
          }}
        >
          <Text style={{ fontSize: 14, color: colors.muted }}>
            {topicEmoji} {topic}
          </Text>
          <Text style={{ fontSize: 12, color: colors.warning, fontWeight: "600" }}>
            REVIEW
          </Text>
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: colors.foreground,
            lineHeight: 32,
            marginBottom: 12,
          }}
        >
          Remember this?
        </Text>

        {/* Content */}
        <Text
          style={{
            fontSize: 18,
            color: colors.foreground,
            lineHeight: 26,
            marginBottom: 12,
          }}
        >
          {title}
        </Text>

        {lastReviewDate && (
          <Text
            style={{
              fontSize: 12,
              color: colors.muted,
              marginTop: 12,
            }}
          >
            Last reviewed: {lastReviewDate}
          </Text>
        )}
      </View>

      {/* Confidence Rating */}
      <View>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: colors.foreground,
            marginBottom: 16,
          }}
        >
          How confident are you?
        </Text>

        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
          {ratings.map(({ value, label, emoji }) => (
            <Pressable
              key={value}
              onPress={() => handleRate(value)}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor:
                  selectedRating === value ? colors.primary + "20" : colors.surface,
                borderWidth: selectedRating === value ? 2 : 1,
                borderColor:
                  selectedRating === value ? colors.primary : colors.border,
                borderRadius: 12,
                padding: 12,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ fontSize: 20, marginBottom: 4 }}>{emoji}</Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color:
                    selectedRating === value ? colors.primary : colors.muted,
                  textAlign: "center",
                }}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {selectedRating && (
        <Pressable
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            paddingVertical: 12,
            borderRadius: 8,
            justifyContent: "center",
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
            Next Card
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/**
 * Main FeedCard component - routes to correct card type
 */
export function FeedCard(props: FeedCardProps) {
  switch (props.type) {
    case "video":
      return <VideoCard {...props} />;
    case "article":
      return <ArticleCard {...props} />;
    case "quiz":
      return <QuizCard {...props} />;
    case "review":
      return <ReviewCard {...props} />;
    case "insight":
      // TODO: Implement InsightCard
      return <VideoCard {...props} />;
    default:
      return null;
  }
}
