/**
 * ArxiVisuals Content Input Screen
 * Allows users to input content in multiple ways:
 * - Paste dense text
 * - Generate with Gemini on any topic (coming soon)
 * - Provide URL
 * - Upload PDF
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";
import * as Haptics from "expo-haptics";

type InputMode = "paste" | "gemini" | "url" | "pdf";

export default function ArxivisualsInputScreen() {
  const router = useRouter();
  const colors = useColors();

  const [inputMode, setInputMode] = useState<InputMode>("paste");
  const [type, setType] = useState<"pasted_text" | "url" | "gemini_generated" | "pdf">("pasted_text");
  const [pastedText, setPastedText] = useState("");
  const [geminiTopic, setGeminiTopic] = useState("");
  const [geminiPrompt, setGeminiPrompt] = useState("");
  const [url, setUrl] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">(
    "intermediate"
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handleModeChange = (mode: InputMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputMode(mode);
    const typeMap: Record<InputMode, "pasted_text" | "url" | "gemini_generated" | "pdf"> = {
      paste: "pasted_text",
      gemini: "gemini_generated",
      url: "url",
      pdf: "pdf",
    };
    setType(typeMap[mode]);
  };

  const handleProcess = async () => {
    try {
      Keyboard.dismiss();
      setIsProcessing(true);

      let content = "";
      let type: "pasted_text" | "url" | "pdf" | "gemini_generated" = "pasted_text";
      let topic = "";

      // Validate input
      if (inputMode === "paste") {
        if (!pastedText.trim()) {
          Alert.alert("Error", "Please paste some text to process");
          setIsProcessing(false);
          return;
        }
        content = pastedText;
        type = "pasted_text";
      } else if (inputMode === "gemini") {
        if (!geminiTopic.trim()) {
          Alert.alert("Error", "Please enter a topic to generate content about");
          setIsProcessing(false);
          return;
        }
        topic = geminiTopic;
        type = "gemini_generated";
        // TODO: Integrate Gemini API for content generation
        Alert.alert("Coming Soon", "Gemini content generation will be available soon!");
        setIsProcessing(false);
        return;
      } else if (inputMode === "url") {
        if (!url.trim()) {
          Alert.alert("Error", "Please enter a URL");
          setIsProcessing(false);
          return;
        }
        type = "url";
      }

      // Navigate to processing screen with parameters
      const params: Record<string, any> = {
        type,
        difficulty,
      };

      if (type === "pasted_text") {
        params.content = pastedText;
      } else if (type === "url") {
        params.url = url;
      } else if (type === "gemini_generated") {
        params.topic = geminiTopic;
      }

      router.push({
        pathname: "./arxivisuals-processing",
        params,
      });
    } catch (error) {
      console.error("Processing error:", error);
      Alert.alert("Error", "Failed to process content");
    } finally {
      setIsProcessing(false);
    }
  };

  const isValidInput = () => {
    if (inputMode === "paste") return pastedText.trim().length > 0;
    if (inputMode === "gemini") return geminiTopic.trim().length > 0;
    if (inputMode === "url") return url.trim().length > 0;
    return false;
  };

  const inputModes = [
    { id: "paste", label: "Paste Text", icon: "📋" },
    { id: "gemini", label: "Generate", icon: "✨" },
    { id: "url", label: "From URL", icon: "🔗" },
    { id: "pdf", label: "Upload PDF", icon: "📄", disabled: true },
  ];

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-foreground mb-2">
            Create Learning Path
          </Text>
          <Text className="text-base text-muted">
            Turn any content into animated lessons
          </Text>
        </View>

        {/* Input Mode Selector */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-semibold text-muted mb-3">Input Method</Text>
          <View className="flex-row gap-2 flex-wrap">
            {inputModes.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                onPress={() => !mode.disabled && handleModeChange(mode.id as InputMode)}
                disabled={mode.disabled}
                style={{
                  opacity: mode.disabled ? 0.5 : 1,
                }}
                className={cn(
                  "flex-row items-center gap-2 px-4 py-3 rounded-full border",
                  inputMode === mode.id
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                )}
              >
                <Text className="text-lg">{mode.icon}</Text>
                <Text
                  className={cn(
                    "font-medium text-sm",
                    inputMode === mode.id ? "text-background" : "text-foreground"
                  )}
                >
                  {mode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Input Area */}
        <View className="px-6 mb-6 flex-1">
          {inputMode === "paste" && (
            <View>
              <Text className="text-sm font-semibold text-muted mb-3">Paste Content</Text>
              <TextInput
                placeholder="Paste dense learning material here... (min 500 characters)"
                placeholderTextColor={colors.muted}
                value={pastedText}
                onChangeText={setPastedText}
                multiline
                numberOfLines={8}
                className="bg-surface border border-border rounded-lg p-4 text-foreground"
                style={{
                  minHeight: 200,
                  textAlignVertical: "top",
                  fontSize: 14,
                  lineHeight: 20,
                }}
              />
              <Text className="text-xs text-muted mt-2">
                {pastedText.length} characters • {Math.ceil(pastedText.length / 5)} words
              </Text>
            </View>
          )}

          {inputMode === "gemini" && (
            <View className="gap-4">
              <View className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <Text className="text-sm font-semibold text-blue-900 mb-2">Coming Soon!</Text>
                <Text className="text-xs text-blue-900">
                  Gemini-powered content generation is being integrated. You'll soon be able to
                  generate comprehensive learning material on any topic at your chosen difficulty
                  level.
                </Text>
              </View>

              <View>
                <Text className="text-sm font-semibold text-muted mb-2">Topic (Preview)</Text>
                <TextInput
                  placeholder="e.g., Quantum Computing, Renaissance Art, Climate Science"
                  placeholderTextColor={colors.muted}
                  value={geminiTopic}
                  onChangeText={setGeminiTopic}
                  editable={false}
                  className="bg-surface border border-border rounded-lg px-4 py-3 text-muted opacity-50"
                  style={{ fontSize: 14 }}
                />
              </View>
            </View>
          )}

          {inputMode === "url" && (
            <View>
              <Text className="text-sm font-semibold text-muted mb-3">URL</Text>
              <TextInput
                placeholder="https://example.com/article"
                placeholderTextColor={colors.muted}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                keyboardType="url"
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                style={{ fontSize: 14 }}
              />
              <Text className="text-xs text-muted mt-2">
                We'll extract and process the content from this URL
              </Text>
            </View>
          )}

          {inputMode === "pdf" && (
            <View className="bg-surface border border-dashed border-border rounded-lg p-6 items-center justify-center">
              <Text className="text-3xl mb-3">📄</Text>
              <Text className="text-foreground font-semibold mb-1">PDF Upload</Text>
              <Text className="text-sm text-muted text-center">
                Coming soon! Upload PDF files to extract and process content.
              </Text>
            </View>
          )}
        </View>

        {/* Difficulty Selector */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-semibold text-muted mb-3">Target Difficulty</Text>
          <View className="flex-row gap-2">
            {(["beginner", "intermediate", "advanced"] as const).map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDifficulty(level);
                }}
                className={cn(
                  "flex-1 py-3 px-4 rounded-lg border items-center",
                  difficulty === level
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                )}
              >
                <Text
                  className={cn(
                    "font-semibold text-sm capitalize",
                    difficulty === level ? "text-background" : "text-foreground"
                  )}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Process Button */}
        <View className="px-6 pb-6">
          <TouchableOpacity
            onPress={handleProcess}
            disabled={!isValidInput() || isProcessing}
            className={cn(
              "py-4 px-6 rounded-lg items-center justify-center",
              isValidInput() && !isProcessing ? "bg-primary" : "bg-primary opacity-50"
            )}
          >
            {isProcessing ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text className="text-background font-bold text-base">
                Generate Learning Path →
              </Text>
            )}
          </TouchableOpacity>

          <Text className="text-xs text-muted text-center mt-3">
            Processing typically takes 2-5 minutes
          </Text>
        </View>

        {/* Example Topics */}
        <View className="px-6 pb-6">
          <Text className="text-sm font-semibold text-muted mb-3">Example Topics</Text>
          <View className="gap-2">
            {[
              "How Neural Networks Learn",
              "The History of Photography",
              "Photosynthesis Explained",
              "Introduction to Blockchain",
            ].map((example) => (
              <TouchableOpacity
                key={example}
                onPress={() => {
                  setInputMode("paste");
                  setPastedText(example);
                }}
                className="bg-surface border border-border rounded-lg p-3 flex-row items-center justify-between"
              >
                <Text className="text-sm text-foreground flex-1">{example}</Text>
                <Text className="text-lg">→</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
