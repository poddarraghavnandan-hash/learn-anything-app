import { ScrollView, View, Text, Pressable, TextInput, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";

type OnboardingStep = "welcome" | "name" | "learning-style" | "pace" | "interests" | "goals" | "complete";

interface OnboardingData {
  name: string;
  learningStyle: "visual" | "kinesthetic" | "auditory" | "reading-writing" | null;
  pace: "slow" | "moderate" | "fast" | null;
  interests: string[];
  goals: string[];
}

const LEARNING_STYLES = [
  { id: "visual", label: "Visual", icon: "image", description: "Learn through images, diagrams, videos" },
  { id: "kinesthetic", label: "Kinesthetic", icon: "touch-app", description: "Learn by doing, hands-on" },
  { id: "auditory", label: "Auditory", icon: "volume-up", description: "Learn through listening, discussion" },
  { id: "reading-writing", label: "Reading/Writing", icon: "description", description: "Learn through text, notes" },
];

const LEARNING_PACES = [
  { id: "slow", label: "Slow & Thorough", description: "Deep dives with lots of examples" },
  { id: "moderate", label: "Balanced", description: "Mix of depth and speed" },
  { id: "fast", label: "Fast-Paced", description: "Quick overviews, jump to applications" },
];

const SAMPLE_INTERESTS = [
  "Physics",
  "Mathematics",
  "Computer Science",
  "Biology",
  "History",
  "Art",
  "Languages",
  "Business",
  "Psychology",
  "Environmental Science",
];

const SAMPLE_GOALS = [
  "Career advancement",
  "Personal growth",
  "Skill development",
  "Academic preparation",
  "Hobby exploration",
  "Certification",
];

export default function OnboardingFlow() {
  const colors = useColors();
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    name: "",
    learningStyle: null,
    pace: null,
    interests: [],
    goals: [],
  });

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    switch (step) {
      case "welcome":
        setStep("name");
        break;
      case "name":
        if (data.name.trim()) setStep("learning-style");
        break;
      case "learning-style":
        if (data.learningStyle) setStep("pace");
        break;
      case "pace":
        if (data.pace) setStep("interests");
        break;
      case "interests":
        if (data.interests.length > 0) setStep("goals");
        break;
      case "goals":
        if (data.goals.length > 0) await completeOnboarding();
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case "name":
        setStep("welcome");
        break;
      case "learning-style":
        setStep("name");
        break;
      case "pace":
        setStep("learning-style");
        break;
      case "interests":
        setStep("pace");
        break;
      case "goals":
        setStep("interests");
        break;
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      // In production, would save to database via tRPC
      console.log("Onboarding data:", data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setStep("complete");
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 2000);
    } catch (error) {
      console.error("Onboarding failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setData({
      ...data,
      interests: data.interests.includes(interest)
        ? data.interests.filter((i) => i !== interest)
        : [...data.interests, interest],
    });
  };

  const toggleGoal = (goal: string) => {
    setData({
      ...data,
      goals: data.goals.includes(goal)
        ? data.goals.filter((g) => g !== goal)
        : [...data.goals, goal],
    });
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        {/* Welcome Step */}
        {step === "welcome" && (
          <View className="flex-1 justify-center px-6 py-8">
            <View className="items-center mb-8">
              <View className="w-20 h-20 bg-primary rounded-full items-center justify-center mb-6">
                <MaterialIcons name="school" size={40} color="white" />
              </View>
              <Text className="text-3xl font-bold text-foreground text-center mb-4">Welcome to Learn Anything</Text>
              <Text className="text-lg text-muted text-center">
                Let's personalize your learning experience. This takes just 2 minutes.
              </Text>
            </View>

            <View className="space-y-4 mt-12">
              <View className="flex-row items-start gap-4">
                <MaterialIcons name="check-circle" size={24} color={colors.success} />
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">Personalized Learning</Text>
                  <Text className="text-sm text-muted">Content adapted to your style and pace</Text>
                </View>
              </View>
              <View className="flex-row items-start gap-4">
                <MaterialIcons name="check-circle" size={24} color={colors.success} />
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">Adaptive Difficulty</Text>
                  <Text className="text-sm text-muted">Challenges adjust based on your performance</Text>
                </View>
              </View>
              <View className="flex-row items-start gap-4">
                <MaterialIcons name="check-circle" size={24} color={colors.success} />
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">Real Understanding</Text>
                  <Text className="text-sm text-muted">Deep learning, not just surface facts</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Name Step */}
        {step === "name" && (
          <View className="flex-1 justify-center px-6 py-8">
            <Text className="text-2xl font-bold text-foreground mb-2">What's your name?</Text>
            <Text className="text-muted mb-6">We'll use this to personalize your experience</Text>

            <TextInput
              placeholder="Enter your name"
              value={data.name}
              onChangeText={(text) => setData({ ...data, name: text })}
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground mb-6"
              placeholderTextColor={colors.muted}
            />

            <Text className="text-sm text-muted mb-4">
              Nice to meet you, {data.name || "learner"}! 👋
            </Text>
          </View>
        )}

        {/* Learning Style Step */}
        {step === "learning-style" && (
          <View className="flex-1 px-6 py-8">
            <Text className="text-2xl font-bold text-foreground mb-2">How do you learn best?</Text>
            <Text className="text-muted mb-6">Choose your preferred learning style</Text>

            <View className="gap-3">
              {LEARNING_STYLES.map((style) => (
                <Pressable
                  key={style.id}
                  onPress={() => {
                    setData({ ...data, learningStyle: style.id as any });
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className={`p-4 rounded-lg border-2 ${
                    data.learningStyle === style.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-surface"
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <MaterialIcons
                      name={style.icon as any}
                      size={24}
                      color={data.learningStyle === style.id ? colors.primary : colors.foreground}
                    />
                    <View className="flex-1">
                      <Text
                        className={`font-semibold ${
                          data.learningStyle === style.id ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {style.label}
                      </Text>
                      <Text className="text-xs text-muted">{style.description}</Text>
                    </View>
                    {data.learningStyle === style.id && (
                      <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Learning Pace Step */}
        {step === "pace" && (
          <View className="flex-1 px-6 py-8">
            <Text className="text-2xl font-bold text-foreground mb-2">What's your learning pace?</Text>
            <Text className="text-muted mb-6">We'll adjust lesson length and depth accordingly</Text>

            <View className="gap-3">
              {LEARNING_PACES.map((pace) => (
                <Pressable
                  key={pace.id}
                  onPress={() => {
                    setData({ ...data, pace: pace.id as any });
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className={`p-4 rounded-lg border-2 ${
                    data.pace === pace.id ? "border-primary bg-primary/10" : "border-border bg-surface"
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text
                        className={`font-semibold ${
                          data.pace === pace.id ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {pace.label}
                      </Text>
                      <Text className="text-xs text-muted">{pace.description}</Text>
                    </View>
                    {data.pace === pace.id && (
                      <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Interests Step */}
        {step === "interests" && (
          <View className="flex-1 px-6 py-8">
            <Text className="text-2xl font-bold text-foreground mb-2">What interests you?</Text>
            <Text className="text-muted mb-6">Select at least one topic to get started</Text>

            <View className="flex-row flex-wrap gap-2">
              {SAMPLE_INTERESTS.map((interest) => (
                <Pressable
                  key={interest}
                  onPress={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full border ${
                    data.interests.includes(interest)
                      ? "border-primary bg-primary"
                      : "border-border bg-surface"
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      data.interests.includes(interest) ? "text-background" : "text-foreground"
                    }`}
                  >
                    {interest}
                  </Text>
                </Pressable>
              ))}
            </View>

            {data.interests.length > 0 && (
              <View className="mt-6 p-4 bg-success/10 rounded-lg border border-success">
                <Text className="text-sm text-success font-semibold">
                  {data.interests.length} topic{data.interests.length !== 1 ? "s" : ""} selected
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Goals Step */}
        {step === "goals" && (
          <View className="flex-1 px-6 py-8">
            <Text className="text-2xl font-bold text-foreground mb-2">What are your goals?</Text>
            <Text className="text-muted mb-6">Select what you want to achieve</Text>

            <View className="gap-3">
              {SAMPLE_GOALS.map((goal) => (
                <Pressable
                  key={goal}
                  onPress={() => toggleGoal(goal)}
                  className={`p-4 rounded-lg border-2 flex-row items-center ${
                    data.goals.includes(goal)
                      ? "border-primary bg-primary/10"
                      : "border-border bg-surface"
                  }`}
                >
                  <View
                    className={`w-6 h-6 rounded border-2 items-center justify-center mr-3 ${
                      data.goals.includes(goal)
                        ? "border-primary bg-primary"
                        : "border-border"
                    }`}
                  >
                    {data.goals.includes(goal) && (
                      <MaterialIcons name="check" size={16} color="white" />
                    )}
                  </View>
                  <Text
                    className={`font-semibold ${
                      data.goals.includes(goal) ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {goal}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Complete Step */}
        {step === "complete" && (
          <View className="flex-1 justify-center items-center px-6 py-8">
            <View className="w-24 h-24 bg-success rounded-full items-center justify-center mb-6">
              <MaterialIcons name="check" size={48} color="white" />
            </View>
            <Text className="text-3xl font-bold text-foreground text-center mb-4">
              You're all set, {data.name}!
            </Text>
            <Text className="text-lg text-muted text-center">
              Your personalized learning experience is ready. Let's start learning!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      {step !== "complete" && (
        <View className="px-6 py-4 border-t border-border flex-row gap-3">
          <Pressable
            onPress={handleBack}
            disabled={step === "welcome"}
            className={`flex-1 py-3 px-4 rounded-lg border border-border ${
              step === "welcome" ? "opacity-50" : ""
            }`}
          >
            <Text className="font-semibold text-foreground text-center">Back</Text>
          </Pressable>

          <Pressable
            onPress={handleNext}
            disabled={
              loading ||
              (step === "name" && !data.name.trim()) ||
              (step === "learning-style" && !data.learningStyle) ||
              (step === "pace" && !data.pace) ||
              (step === "interests" && data.interests.length === 0) ||
              (step === "goals" && data.goals.length === 0)
            }
            className={`flex-1 py-3 px-4 rounded-lg ${
              loading ? "opacity-50" : ""
            } ${
              step === "goals" && data.goals.length > 0 && !loading
                ? "bg-success"
                : "bg-primary"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="font-semibold text-background text-center">
                {step === "goals" ? "Complete Setup" : "Next"}
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </ScreenContainer>
  );
}
