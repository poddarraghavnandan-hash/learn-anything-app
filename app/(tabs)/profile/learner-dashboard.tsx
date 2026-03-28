import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

/**
 * Learner Signal Dashboard
 * Displays learner profile, signals, insights, and personalized recommendations
 */

interface LearnerDashboardProps {
  userId: number;
}

export function LearnerSignalDashboard({ userId }: LearnerDashboardProps) {
  const colors = useColors();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch learner profile
  const profileQuery = trpc.learnerProfile.getProfile.useQuery({ userId });

  useEffect(() => {
    if (profileQuery.isLoading === false) {
      setIsLoading(false);
    }
  }, [profileQuery.isLoading]);

  // Fetch learning insights (use signal observer router for now)
  // TODO: Add getLearningInsights to learnerProfileRouter
  const insightsQuery = null; // Will implement after adding endpoint

  if (isLoading) {
    return (
      <ScreenContainer className="flex items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  const profile = profileQuery.data?.profile;
  if (!profile) {
    return (
      <ScreenContainer className="p-6">
        <Text className="text-lg font-semibold text-foreground">
          No learner profile yet
        </Text>
        <Text className="text-sm text-muted mt-2">
          Start learning to build your profile
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="p-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">
            Your Learning Profile
          </Text>
          <Text className="text-sm text-muted mt-1">
            Personalized insights from your learning journey
          </Text>
        </View>

        {/* Learning Style Card */}
        <LearningStyleCard
          learningStyle={profile.learningStyle}
          colors={colors}
        />

        {/* Confidence Trajectory Card */}
        <ConfidenceTrajectoryCard
          trajectory={profile.confidenceTrajectory}
          averageConfidence={profile.averageConfidence}
          breakthroughsThisWeek={profile.breakthroughsThisWeek}
          stuckPointsThisWeek={profile.stuckPointsThisWeek}
          colors={colors}
        />

        {/* Signal Distribution Card */}
        <SignalDistributionCard
          distribution={profile.signalDistribution}
          totalSignals={profile.totalSignalsThisWeek}
          colors={colors}
        />

        {/* Top Concepts Card */}
        <TopConceptsCard
          concepts={profile.topConceptsByConfidence}
          colors={colors}
        />

        {/* Knowledge Gaps Card */}
        <KnowledgeGapsCard gaps={profile.knowledgeGaps} colors={colors} />

        {/* Recommended Next Steps */}
        <RecommendedNextStepsCard
          steps={profile.recommendedNextSteps}
          colors={colors}
        />

        {/* Insights Card - TODO: Add getLearningInsights endpoint */}
      </ScrollView>
    </ScreenContainer>
  );
}

/**
 * Learning Style Card
 */
function LearningStyleCard({
  learningStyle,
  colors,
}: {
  learningStyle: string;
  colors: any;
}) {
  const descriptions: Record<string, string> = {
    analytical:
      "You learn by asking questions and understanding the 'why' behind concepts",
    practical:
      "You learn by applying concepts to real-world problems and seeing results",
    relational:
      "You learn by explaining concepts to others and making connections",
    progressive:
      "You learn by building connections between related concepts",
    balanced: "You have a balanced learning style across multiple approaches",
  };

  const icons: Record<string, string> = {
    analytical: "🧠",
    practical: "🔧",
    relational: "🤝",
    progressive: "🔗",
    balanced: "⚖️",
  };

  return (
    <View
      className="rounded-2xl p-4 mb-4"
      style={{ backgroundColor: colors.surface }}
    >
      <Text className="text-sm font-semibold text-muted uppercase tracking-wide">
        Learning Style
      </Text>
      <View className="flex-row items-center mt-3">
        <Text className="text-4xl mr-3">{icons[learningStyle] || "🎓"}</Text>
        <View className="flex-1">
          <Text className="text-xl font-bold text-foreground capitalize">
            {learningStyle}
          </Text>
          <Text className="text-xs text-muted mt-1">
            {descriptions[learningStyle]}
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Confidence Trajectory Card
 */
function ConfidenceTrajectoryCard({
  trajectory,
  averageConfidence,
  breakthroughsThisWeek,
  stuckPointsThisWeek,
  colors,
}: {
  trajectory: string;
  averageConfidence: number;
  breakthroughsThisWeek: number;
  stuckPointsThisWeek: number;
  colors: any;
}) {
  const trajectoryEmoji: Record<string, string> = {
    improving: "📈",
    stable: "➡️",
    struggling: "📉",
  };

  const trajectoryColor: Record<string, string> = {
    improving: colors.success,
    stable: colors.primary,
    struggling: colors.warning,
  };

  return (
    <View
      className="rounded-2xl p-4 mb-4"
      style={{ backgroundColor: colors.surface }}
    >
      <Text className="text-sm font-semibold text-muted uppercase tracking-wide">
        Confidence Trajectory
      </Text>

      <View className="flex-row items-center mt-3 mb-4">
        <Text className="text-3xl mr-2">{trajectoryEmoji[trajectory]}</Text>
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground capitalize">
            {trajectory}
          </Text>
          <View className="flex-row items-center mt-1">
            <View
              className="h-2 rounded-full flex-1"
              style={{
                backgroundColor: colors.border,
              }}
            >
              <View
                className="h-2 rounded-full"
                style={{
                  width: `${Math.round(averageConfidence * 100)}%`,
                  backgroundColor: trajectoryColor[trajectory],
                }}
              />
            </View>
            <Text className="text-xs font-semibold text-foreground ml-2">
              {Math.round(averageConfidence * 100)}%
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row gap-4">
        <View className="flex-1">
          <Text className="text-2xl font-bold text-success">
            {breakthroughsThisWeek}
          </Text>
          <Text className="text-xs text-muted mt-1">Breakthroughs</Text>
        </View>
        <View className="flex-1">
          <Text className="text-2xl font-bold text-warning">
            {stuckPointsThisWeek}
          </Text>
          <Text className="text-xs text-muted mt-1">Stuck Points</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Signal Distribution Card
 */
function SignalDistributionCard({
  distribution,
  totalSignals,
  colors,
}: {
  distribution: Record<string, number>;
  totalSignals: number;
  colors: any;
}) {
  const signalEmojis: Record<string, string> = {
    question: "❓",
    connection: "🔗",
    application: "💡",
    teaching: "📚",
    breakthrough: "🎉",
    stuck: "🤔",
    feedback: "💬",
  };

  return (
    <View
      className="rounded-2xl p-4 mb-4"
      style={{ backgroundColor: colors.surface }}
    >
      <Text className="text-sm font-semibold text-muted uppercase tracking-wide">
        Signal Distribution
      </Text>
      <Text className="text-xs text-muted mt-1">
        {totalSignals} signals this week
      </Text>

      <View className="mt-3 gap-2">
        {Object.entries(distribution).map(([type, count]) => {
          const percentage =
            totalSignals > 0 ? (count / totalSignals) * 100 : 0;
          return (
            <View key={type} className="flex-row items-center">
              <Text className="text-lg mr-2">{signalEmojis[type] || "📊"}</Text>
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-medium text-foreground capitalize">
                    {type}
                  </Text>
                  <Text className="text-xs text-muted">{count}</Text>
                </View>
                <View
                  className="h-1.5 rounded-full mt-1"
                  style={{ backgroundColor: colors.border }}
                >
                  <View
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: colors.primary,
                    }}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Top Concepts Card
 */
function TopConceptsCard({
  concepts,
  colors,
}: {
  concepts: Array<{ conceptId: number; conceptName: string; confidence: number }>;
  colors: any;
}) {
  if (concepts.length === 0) return null;

  return (
    <View
      className="rounded-2xl p-4 mb-4"
      style={{ backgroundColor: colors.surface }}
    >
      <Text className="text-sm font-semibold text-muted uppercase tracking-wide">
        Top Concepts
      </Text>

      <View className="mt-3 gap-3">
        {concepts.slice(0, 5).map((concept, index) => (
          <View key={concept.conceptId} className="flex-row items-center">
            <Text className="text-lg font-bold text-primary mr-3">
              {index + 1}
            </Text>
            <View className="flex-1">
              <Text className="text-sm font-medium text-foreground">
                {concept.conceptName}
              </Text>
              <View
                className="h-1.5 rounded-full mt-1"
                style={{ backgroundColor: colors.border }}
              >
                <View
                  className="h-1.5 rounded-full"
                  style={{
                    width: `${Math.round(concept.confidence * 100)}%`,
                    backgroundColor: colors.success,
                  }}
                />
              </View>
            </View>
            <Text className="text-xs font-semibold text-foreground ml-2">
              {Math.round(concept.confidence * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Knowledge Gaps Card
 */
function KnowledgeGapsCard({
  gaps,
  colors,
}: {
  gaps: Array<{ conceptId: number; conceptName: string; reason: string }>;
  colors: any;
}) {
  if (gaps.length === 0) return null;

  const reasonEmojis: Record<string, string> = {
    stuck_signal: "🤔",
    low_confidence: "⚠️",
    no_signals: "❌",
  };

  return (
    <View
      className="rounded-2xl p-4 mb-4"
      style={{ backgroundColor: colors.surface }}
    >
      <Text className="text-sm font-semibold text-muted uppercase tracking-wide">
        Knowledge Gaps
      </Text>
      <Text className="text-xs text-muted mt-1">
        Areas to focus on for improvement
      </Text>

      <View className="mt-3 gap-2">
        {gaps.slice(0, 3).map((gap) => (
          <View
            key={gap.conceptId}
            className="flex-row items-center p-2 rounded-lg"
            style={{ backgroundColor: colors.background }}
          >
            <Text className="text-lg mr-2">
              {reasonEmojis[gap.reason] || "📌"}
            </Text>
            <View className="flex-1">
              <Text className="text-sm font-medium text-foreground">
                {gap.conceptName}
              </Text>
              <Text className="text-xs text-muted capitalize">
                {gap.reason.replace(/_/g, " ")}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Recommended Next Steps Card
 */
function RecommendedNextStepsCard({
  steps,
  colors,
}: {
  steps: string[];
  colors: any;
}) {
  if (steps.length === 0) return null;

  return (
    <View
      className="rounded-2xl p-4 mb-4"
      style={{ backgroundColor: colors.surface }}
    >
      <Text className="text-sm font-semibold text-muted uppercase tracking-wide">
        Recommended Next Steps
      </Text>

      <View className="mt-3 gap-2">
        {steps.map((step, index) => (
          <View key={index} className="flex-row items-start">
            <View
              className="w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-xs font-bold text-background">
                {index + 1}
              </Text>
            </View>
            <Text className="text-sm text-foreground flex-1">{step}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Insights Card
 */
function InsightsCard({
  insights,
  colors,
}: {
  insights: {
    strengths: string[];
    challenges: string[];
    opportunities: string[];
    nextMilestone: string;
  };
  colors: any;
}) {
  return (
    <View className="gap-4 mb-6">
      {/* Strengths */}
      {insights.strengths.length > 0 && (
        <View
          className="rounded-2xl p-4"
          style={{ backgroundColor: colors.surface }}
        >
          <Text className="text-sm font-semibold text-success uppercase tracking-wide">
            ✨ Strengths
          </Text>
          <View className="mt-2 gap-1">
            {insights.strengths.map((strength, i) => (
              <Text key={i} className="text-sm text-foreground">
                • {strength}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Challenges */}
      {insights.challenges.length > 0 && (
        <View
          className="rounded-2xl p-4"
          style={{ backgroundColor: colors.surface }}
        >
          <Text className="text-sm font-semibold text-warning uppercase tracking-wide">
            ⚡ Challenges
          </Text>
          <View className="mt-2 gap-1">
            {insights.challenges.map((challenge, i) => (
              <Text key={i} className="text-sm text-foreground">
                • {challenge}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Opportunities */}
      {insights.opportunities.length > 0 && (
        <View
          className="rounded-2xl p-4"
          style={{ backgroundColor: colors.surface }}
        >
          <Text className="text-sm font-semibold text-primary uppercase tracking-wide">
            🚀 Opportunities
          </Text>
          <View className="mt-2 gap-1">
            {insights.opportunities.map((opportunity, i) => (
              <Text key={i} className="text-sm text-foreground">
                • {opportunity}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Next Milestone */}
      <View
        className="rounded-2xl p-4"
        style={{
          backgroundColor: colors.primary,
        }}
      >
        <Text className="text-sm font-semibold text-background uppercase tracking-wide">
          🎯 Next Milestone
        </Text>
        <Text className="text-lg font-bold text-background mt-2">
          {insights.nextMilestone}
        </Text>
      </View>
    </View>
  );
}
