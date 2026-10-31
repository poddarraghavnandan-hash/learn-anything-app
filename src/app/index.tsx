import { Link, Redirect } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LADDERS, getConcept } from '../content';
import { MasteryBar } from '../components/MasteryBar';
import { useLearner } from '../state/learner';
import { isDue, reviveCard } from '../engine/scheduling';
import { masteryBand, masteryLabel } from '../engine/mastery';
import { theme } from '../theme';

/**
 * Path — the home surface. The ladder IS the home screen: every concept,
 * its mastery, and what is due, in one calm list.
 */
export default function PathScreen() {
  const { state, hydrated } = useLearner();

  if (!hydrated) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading your path…</Text>
      </View>
    );
  }
  if (!state.profile) return <Redirect href="/onboarding" />;

  const now = new Date();
  const dueConcepts = Object.entries(state.concepts).filter(
    ([, cs]) => cs.card && isDue(reviveCard(cs.card), now),
  );
  const recommended = state.recommendedConceptId
    ? getConcept(state.recommendedConceptId)
    : undefined;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>Hello, {state.profile.name}</Text>
      <Text style={styles.sub}>
        Pick a step on your path. Small steps, remembered for good.
      </Text>

      {dueConcepts.length > 0 ? (
        <Link href="/review" asChild>
          <Pressable style={styles.banner}>
            <Text style={styles.bannerTitle}>
              {dueConcepts.length}{' '}
              {dueConcepts.length === 1 ? 'review is' : 'reviews are'} ready
            </Text>
            <Text style={styles.bannerText}>
              A few minutes now keeps these steps in memory.
            </Text>
          </Pressable>
        </Link>
      ) : null}

      {!state.diagnosisDone ? (
        <Link href={{ pathname: '/ask', params: { mode: 'diagnosis' } }} asChild>
          <Pressable style={styles.card}>
            <Text style={styles.cardTitle}>Find your level</Text>
            <Text style={styles.cardText}>
              Six quick questions so Shiro can start at the right step for
              you — not too easy, not too hard.
            </Text>
          </Pressable>
        </Link>
      ) : recommended ? (
        <Link
          href={{
            pathname: '/learn/[conceptId]',
            params: { conceptId: recommended.id },
          }}
          asChild
        >
          <Pressable style={styles.card}>
            <Text style={styles.cardKicker}>Start here</Text>
            <Text style={styles.cardTitle}>{recommended.title}</Text>
            <Text style={styles.cardText}>{recommended.summary}</Text>
          </Pressable>
        </Link>
      ) : null}

      {LADDERS.map((ladder) => (
        <View key={ladder.id} style={styles.ladder}>
          <View style={styles.ladderHead}>
            <Text style={styles.ladderTitle}>{ladder.title}</Text>
            <Text style={styles.ageChip}>{ladder.ageRange}</Text>
          </View>
          <Text style={styles.ladderTagline}>{ladder.tagline}</Text>
          {ladder.concepts.map((concept) => {
            const cs = state.concepts[concept.id];
            const band = masteryBand(cs?.mastery ?? 0, cs?.seen ?? false);
            const due = cs?.card ? isDue(reviveCard(cs.card), now) : false;
            return (
              <Link
                key={concept.id}
                href={{
                  pathname: '/learn/[conceptId]',
                  params: { conceptId: concept.id },
                }}
                asChild
              >
                <Pressable style={styles.conceptRow}>
                  <View style={styles.conceptMain}>
                    <Text style={styles.conceptTitle}>{concept.title}</Text>
                    <MasteryBar value={cs?.mastery ?? 0} />
                  </View>
                  <View style={styles.conceptMeta}>
                    <Text style={styles.band}>{masteryLabel(band)}</Text>
                    {due ? <Text style={styles.dueChip}>Review due</Text> : null}
                  </View>
                </Pressable>
              </Link>
            );
          })}
        </View>
      ))}

      <View style={styles.footerRow}>
        <Link href="/ask" asChild>
          <Pressable style={styles.footerButton}>
            <Text style={styles.footerButtonText}>Ask Shiro a question</Text>
          </Pressable>
        </Link>
        <Link href="/parent" asChild>
          <Pressable style={styles.footerGhost}>
            <Text style={styles.footerGhostText}>For parents</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.space.lg,
    gap: theme.space.lg,
    backgroundColor: theme.colors.bg,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg,
  },
  muted: { color: theme.colors.muted, fontSize: theme.font.body },
  greeting: {
    fontSize: theme.font.title,
    fontWeight: '800',
    color: theme.colors.ink,
  },
  sub: { color: theme.colors.muted, fontSize: theme.font.body, marginTop: -theme.space.md },
  banner: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.card,
    padding: theme.space.lg,
    gap: 4,
  },
  bannerTitle: { color: '#FFFFFF', fontSize: theme.font.heading, fontWeight: '700' },
  bannerText: { color: '#FFE9E0', fontSize: theme.font.small },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.space.lg,
    gap: 4,
  },
  cardKicker: {
    color: theme.colors.accentInk,
    fontSize: theme.font.tiny,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardTitle: { fontSize: theme.font.heading, fontWeight: '700', color: theme.colors.ink },
  cardText: { color: theme.colors.muted, fontSize: theme.font.small, lineHeight: 20 },
  ladder: { gap: theme.space.sm },
  ladderHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ladderTitle: { fontSize: theme.font.heading, fontWeight: '700', color: theme.colors.ink },
  ageChip: {
    fontSize: theme.font.tiny,
    color: theme.colors.accentInk,
    backgroundColor: theme.colors.accentSoft,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: theme.radius.chip,
    overflow: 'hidden',
    fontWeight: '600',
  },
  ladderTagline: { color: theme.colors.muted, fontSize: theme.font.small },
  conceptRow: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.button,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
  },
  conceptMain: { flex: 1, gap: 8 },
  conceptTitle: { fontSize: theme.font.body, fontWeight: '600', color: theme.colors.ink },
  conceptMeta: { alignItems: 'flex-end', gap: 4 },
  band: { fontSize: theme.font.tiny, color: theme.colors.muted, fontWeight: '600' },
  dueChip: {
    fontSize: theme.font.tiny,
    color: '#FFFFFF',
    backgroundColor: theme.colors.accent,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: theme.radius.chip,
    overflow: 'hidden',
    fontWeight: '700',
  },
  footerRow: { gap: theme.space.sm, marginTop: theme.space.sm },
  footerButton: {
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  footerButtonText: { color: theme.colors.accentInk, fontWeight: '700', fontSize: theme.font.body },
  footerGhost: { paddingVertical: 10, alignItems: 'center' },
  footerGhostText: { color: theme.colors.muted, fontSize: theme.font.small, fontWeight: '600' },
});
