import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useLearner } from '../state/learner';
import { theme } from '../theme';

/**
 * Onboarding: a NEUTRAL age gate (we ask the learner's age, nothing more),
 * then a flow split:
 *   under 13 → child flow: a parent/guardian email + explicit consent
 *              capture before any profile is created.
 *   13–14    → teen flow: no consent step (still a minor; no open chat
 *              gives answers away in either flow).
 */
export default function OnboardingScreen() {
  const { onboard } = useLearner();
  const [name, setName] = useState('');
  const [age, setAge] = useState(9);
  const [parentEmail, setParentEmail] = useState('');
  const [consent, setConsent] = useState(false);

  const isChild = age < 13;
  const emailValid = /.+@.+\..+/.test(parentEmail.trim());
  const canContinue =
    name.trim().length > 0 && (!isChild || (emailValid && consent));

  function start() {
    if (!canContinue) return;
    onboard({
      name: name.trim(),
      age,
      flow: isChild ? 'child' : 'teen',
      createdAt: new Date().toISOString(),
      consent: isChild
        ? {
            parentEmail: parentEmail.trim(),
            consentedAt: new Date().toISOString(),
            method: 'in-app-checkbox',
            policyVersion: 'v1-demo',
          }
        : undefined,
    });
    router.replace('/');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.logo}>Shiro</Text>
      <Text style={styles.tagline}>
        Learn English one step at a time — and actually remember it.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Learner&apos;s first name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Maya"
          placeholderTextColor={theme.colors.faint}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Learner&apos;s age</Text>
        <View style={styles.ageRow}>
          <Pressable
            style={styles.ageButton}
            onPress={() => setAge(Math.max(4, age - 1))}
          >
            <Text style={styles.ageButtonText}>−</Text>
          </Pressable>
          <Text style={styles.ageValue}>{age}</Text>
          <Pressable
            style={styles.ageButton}
            onPress={() => setAge(Math.min(17, age + 1))}
          >
            <Text style={styles.ageButtonText}>+</Text>
          </Pressable>
        </View>

        {isChild ? (
          <View style={styles.consentBox}>
            <Text style={styles.consentHeading}>
              For a parent or guardian
            </Text>
            <Text style={styles.consentText}>
              Learners under 13 use Shiro with a parent or guardian&apos;s
              permission. In this demo, learning progress is stored only on
              this device and no data is sent to AI services. If AI features
              are enabled later, we will ask for your consent again before
              anything is shared.
            </Text>
            <Text style={styles.label}>Parent or guardian email</Text>
            <TextInput
              style={styles.input}
              value={parentEmail}
              onChangeText={setParentEmail}
              placeholder="parent@example.com"
              placeholderTextColor={theme.colors.faint}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Pressable
              style={styles.checkRow}
              onPress={() => setConsent(!consent)}
            >
              <View style={[styles.checkbox, consent && styles.checkboxOn]}>
                {consent ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <Text style={styles.checkLabel}>
                I am the parent or guardian and I give permission for this
                child to use Shiro.
              </Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.teenNote}>
            Teen accounts get the full tutor — still hints-first, because
            being told the answer does not teach it.
          </Text>
        )}

        <Pressable
          style={[styles.cta, !canContinue && styles.ctaDisabled]}
          onPress={start}
          disabled={!canContinue}
        >
          <Text style={styles.ctaText}>Start learning</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: theme.space.lg,
    paddingTop: 56,
    gap: theme.space.md,
    backgroundColor: theme.colors.bg,
  },
  logo: {
    fontSize: 44,
    fontWeight: '800',
    color: theme.colors.accent,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: theme.font.heading - 3,
    lineHeight: 26,
    color: theme.colors.muted,
    maxWidth: 420,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.space.lg,
    gap: theme.space.md,
    maxWidth: 560,
  },
  label: {
    fontSize: theme.font.small,
    fontWeight: '600',
    color: theme.colors.ink,
  },
  input: {
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.button,
    paddingVertical: 12,
    paddingHorizontal: theme.space.md,
    fontSize: theme.font.body,
    color: theme.colors.ink,
    backgroundColor: theme.colors.bg,
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
  },
  ageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg,
  },
  ageButtonText: { fontSize: 22, color: theme.colors.accentInk },
  ageValue: { fontSize: 26, fontWeight: '700', color: theme.colors.ink, minWidth: 40, textAlign: 'center' },
  consentBox: {
    gap: theme.space.sm,
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.button,
    padding: theme.space.md,
  },
  consentHeading: { fontWeight: '700', color: theme.colors.ink, fontSize: theme.font.body },
  consentText: { color: theme.colors.ink, fontSize: theme.font.small, lineHeight: 20 },
  checkRow: { flexDirection: 'row', gap: theme.space.sm, alignItems: 'flex-start' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    backgroundColor: '#FFFFFF',
  },
  checkboxOn: { backgroundColor: theme.colors.accent },
  checkmark: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  checkLabel: { flex: 1, fontSize: theme.font.small, lineHeight: 19, color: theme.colors.ink },
  teenNote: { color: theme.colors.muted, fontSize: theme.font.small, lineHeight: 20 },
  cta: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.button,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: theme.space.sm,
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { color: '#FFFFFF', fontSize: theme.font.body, fontWeight: '700' },
});
