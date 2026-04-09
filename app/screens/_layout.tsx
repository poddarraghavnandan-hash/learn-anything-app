import { Stack } from "expo-router";

export default function ScreensLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="learning-path-detail" />
      <Stack.Screen name="lesson-content" />
      <Stack.Screen name="arxivisuals-input" />
      <Stack.Screen name="arxivisuals-processing" />
      <Stack.Screen name="arxivisuals-result" />
      <Stack.Screen name="arxivisuals-lesson" />
      <Stack.Screen name="arxivisuals-completion" />
    </Stack>
  );
}
