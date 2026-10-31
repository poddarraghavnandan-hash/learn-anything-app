import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LearnerProvider } from '../state/learner';
import { theme } from '../theme';

export default function RootLayout() {
  return (
    <LearnerProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.bg },
          headerTintColor: theme.colors.ink,
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Shiro' }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, title: 'Welcome' }}
        />
        <Stack.Screen name="ask" options={{ title: 'Ask Shiro' }} />
        <Stack.Screen name="review" options={{ title: 'Review' }} />
        <Stack.Screen name="parent" options={{ title: 'For Parents' }} />
        <Stack.Screen
          name="learn/[conceptId]"
          options={{ title: 'Learn a Step' }}
        />
      </Stack>
    </LearnerProvider>
  );
}
