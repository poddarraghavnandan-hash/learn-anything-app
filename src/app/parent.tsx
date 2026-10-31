import { useState } from 'react';
import { Link, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LADDERS } from '../content';
import { MasteryBar } from '../components/MasteryBar';
import { useLearner } from '../state/learner';
import { isDue, reviveCard } from '../engine/scheduling';
import {
  MASTERED_THRESHOLD,
  masteryBand,
  masteryLabel,
} from '../engine/mastery';
import { abilityLabel } from '../engine/diagnose';
import { theme } from '../theme';

/**
 * Parent view — the trust surface: the child's mastery map, what they
 * still know (retention), the consent record, and a weekly digest stub.
 * Parents pay for proof, not promises; this screen is that proof.
 */
export default function ParentScreen() {
  const { state, resetAll } = useLearner();
  const profile = state.profile;
  // Captured once per mount so render stays pure; ages gracefully.
  const [mountedAt] = useState(() => new Date());

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>No learner profile yet.</Text>
        <Link href="/onboarding" asChild>
          <Pressable style={styles.cta}>
            <Text style={styles.ctaText}>Set up a learner</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  const now = mountedAt;
  const entries = Object.entries(state.concepts)
    .filter(([, cs]) => cs.card)
    .map(([id, cs]) => ({ id, cs, card: reviveCard(cs.card!) }));
  const dueNow = entries.filter((e) => isDue(e.card, now));
  const stillKnows = entries.filter(
    (e) => e.cs.mastery >= MASTERED_THRESHOLD && !isDue(e.card, now),
  );
  const masteredTotal = Object.values(state.concepts).filter(
    (cs) => cs.mastery >= MASTERED_THRESHOLD,
  ).length;

  // Weekly digest stub: computed from the response log, last 7 days.
  const weekAgo = mountedAt.getTime() - 7 * 86_400_000;
  const weekLog = state.log.filter((e) => new Date(e.at).getTime() >= weekAgo);
  const weekCorrect = weekLog.filter((e) => e.correct).length;
  const weekConcepts = new Set(weekLog.map((e) => e.conceptId)).size;
  const digest =
    weekLog.length === 0
      ? `${profile.name} has not practised in the last 7 days. A short session on the path is a good restart.`
      : `This week ${profile.name} answered ${weekLog.length} questions across ${weekConcepts} step${weekConcepts === 1 ? '' : 's'}, with ${weekCorrect} first-try correct (${weekLog.length ? Math.round((weekCorrect / weekLog.length) * 100) : 0}%). ${stillKnows.length} step${stillKnows.length === 1 ? ' is' : 's are'} currently in the "still knows it" zone. ${dueNow.length} review${dueNow.length === 1 ? ' is' : 's are'} due now.`;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{profile.name}&apos;s progress</Text>
      <Text style={styles.sub}>
        Age {profile.age} · {profile.flow === 'child' ? 'Child account' : 'Teen account'}
        {state.diagnosisDone
          ? ` · Level: ${abilityLabel(state.ability)}`
          : ' · Level check not done yet'}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{masteredTotal}</Text>
          <Text style={styles.statLabel}>steps mastered</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{stillKnows.length}</Text>
          <Text style={styles.statLabel}>still knows it</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{dueNow.length}</Text>
          <Text style={styles.statLabel}>reviews due</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weekly digest</Text>
        <Text style={styles.cardText}>{digest}</Text>
        <Text style={styles.stub}>
          Stub: in the MVP this digest is computed on-device from the
          learning log. Email delivery is wired later, to the consenting
          parent address only.
        </Text>
      </View>

      {profile.flow === 'child' && profile.consent ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Parental consent on record</Text>
          <Text style={styles.cardText}>
            Given by {profile.consent.parentEmail} on{' '}
            {new Date(profile.consent.consentedAt).toLocaleDateString()} via{' '}
            {profile.consent.method} (policy {profile.consent.policyVersion}).
          </Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Mastery map</Text>
      {LADDERS.map((ladder) => (
        <View key={ladder.id} style={styles.ladder}>
          <Text style={styles.ladderTitle}>{ladder.title}</Text>
          {ladder.concepts.map((concept) => {
            const cs = state.concepts[concept.id];
            const band = masteryBand(cs?.mastery ?? 0, cs?.seen ?? false);
            return (
              <View key={concept.id} style={styles.row}>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>{concept.title}</Text>
                  <MasteryBar value={cs?.mastery ?? 0} />
                </View>
                <Text style={styles.rowMeta}>
                  {masteryLabel(band)}
                  {cs?.seen
                    ? ` · ${cs.correct}/${cs.attempts} first-try`
                    : ''}
                </Text>
              </View>
            );
          })}
        </View>
      ))}

      <Pressable
        style={styles.reset}
        onPress={() => {
          resetAll();
          router.replace('/onboarding');
        }}
      >
        <Text style={styles.resetText}>Reset demo data</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.space.lg,
    gap: theme.space.md,
    backgroundColor: theme.colors.bg,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.md,
    backgroundColor: theme.colors.bg,
  },
  muted: { color: theme.colors.muted, fontSize: theme.font.body },
  title: { fontSize: theme.font.title - 4, fontWeight: '800', color: theme.colors.ink },
  sub: { color: theme.colors.muted, fontSize: theme.font.body, marginTop: -theme.space.sm },
  statsRow: { flexDirection: 'row', gap: theme.space.sm },
  stat: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.space.md,
    alignItems: 'center',
    gap: 2,
  },
  statNumber: { fontSize: 26, fontWeight: '800', color: theme.colors.accentInk },
  statLabel: { fontSize: theme.font.tiny, color: theme.colors.muted, textAlign: 'center' },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.space.lg,
    gap: theme.space.sm,
  },
  cardTitle: { fontSize: theme.font.heading - 2, fontWeight: '700', color: theme.colors.ink },
  cardText: { fontSize: theme.font.body - 1, lineHeight: 23, color: theme.colors.ink },
  stub: { fontSize: theme.font.tiny, color: theme.colors.faint, lineHeight: 17 },
  sectionTitle: {
    fontSize: theme.font.heading - 2,
    fontWeight: '700',
    color: theme.colors.ink,
    marginTop: theme.space.sm,
  },
  ladder: { gap: theme.space.sm },
  ladderTitle: { fontSize: theme.font.body, fontWeight: '700', color: theme.colors.ink },
  row: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.button,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.space.md,
    gap: 6,
  },
  rowMain: { gap: 8 },
  rowTitle: { fontSize: theme.font.body - 1, fontWeight: '600', color: theme.colors.ink },
  rowMeta: { fontSize: theme.font.tiny, color: theme.colors.muted },
  cta: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.button,
    paddingVertical: 13,
    paddingHorizontal: 22,
  },
  ctaText: { color: '#FFFFFF', fontWeight: '700' },
  reset: { alignItems: 'center', paddingVertical: theme.space.md },
  resetText: { color: theme.colors.wrong, fontSize: theme.font.small, fontWeight: '600' },
});
