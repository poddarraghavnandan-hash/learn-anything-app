import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getConcept } from '../content';
import { Quiz, type QuizResult } from '../components/Quiz';
import { useLearner } from '../state/learner';
import {
  daysUntilDue,
  isDue,
  reviveCard,
} from '../engine/scheduling';
import { MASTERED_THRESHOLD } from '../engine/mastery';
import { theme } from '../theme';

/**
 * Review — today's due FSRS reviews. Short, calm, finite: clear the list
 * and you are done for the day. No streaks, no endless feed.
 */
export default function ReviewScreen() {
  const { state, recordAnswer, completeSession } = useLearner();
  const [activeConceptId, setActiveConceptId] = useState<string | null>(null);
  const [justFinished, setJustFinished] = useState<string | null>(null);

  const now = new Date();
  const entries = Object.entries(state.concepts)
    .filter(([, cs]) => cs.card)
    .map(([id, cs]) => ({ id, cs, card: reviveCard(cs.card!) }))
    .sort((a, b) => a.card.due.getTime() - b.card.due.getTime());

  const due = entries.filter((e) => isDue(e.card, now));
  const upcoming = entries.filter((e) => !isDue(e.card, now));
  const stillKnows = entries.filter(
    (e) => e.cs.mastery >= MASTERED_THRESHOLD && !isDue(e.card, now),
  );

  const active = activeConceptId ? getConcept(activeConceptId) : undefined;

  function finish(conceptId: string, results: QuizResult[]) {
    const firstTry = results.filter((r) => r.correctFirstAttempt).length;
    completeSession(conceptId, results.length ? firstTry / results.length : 0);
    setActiveConceptId(null);
    setJustFinished(conceptId);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Today&apos;s reviews</Text>
      <Text style={styles.sub}>
        Reviewing at the right moment is what turns learning into memory.
      </Text>

      {justFinished ? (
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            Review done for {getConcept(justFinished)?.title}. It has been
            rescheduled based on how it went.
          </Text>
        </View>
      ) : null}

      {active ? (
        <>
          <Text style={styles.sectionTitle}>
            Reviewing: {active.title}
          </Text>
          <Quiz
            items={active.items.slice(0, 3)}
            onAnswer={(item, correctFirst) =>
              recordAnswer(active.id, item, correctFirst)
            }
            onFinish={(results) => finish(active.id, results)}
          />
          <Pressable onPress={() => setActiveConceptId(null)} style={styles.ghost}>
            <Text style={styles.ghostText}>Stop for now</Text>
          </Pressable>
        </>
      ) : due.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nothing due today</Text>
          <Text style={styles.cardText}>
            {entries.length === 0
              ? 'Finish a step on your path and Shiro will schedule its first review here.'
              : 'Everything is scheduled for later. Come back when a review is due — or learn a new step.'}
          </Text>
        </View>
      ) : (
        due.map(({ id, cs }) => {
          const concept = getConcept(id);
          if (!concept) return null;
          return (
            <Pressable
              key={id}
              style={styles.row}
              onPress={() => setActiveConceptId(id)}
            >
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>{concept.title}</Text>
                <Text style={styles.rowSub}>
                  Mastery {Math.round(cs.mastery * 100)}% · tap to review
                </Text>
              </View>
              <Text style={styles.rowCta}>Review</Text>
            </Pressable>
          );
        })
      )}

      {upcoming.length > 0 && !active ? (
        <>
          <Text style={styles.sectionTitle}>Coming up</Text>
          {upcoming.slice(0, 5).map(({ id, card }) => {
            const concept = getConcept(id);
            if (!concept) return null;
            const days = daysUntilDue(card, now);
            return (
              <View key={id} style={styles.upcomingRow}>
                <Text style={styles.rowTitle}>{concept.title}</Text>
                <Text style={styles.rowSub}>
                  {days <= 0 ? 'tomorrow' : days === 1 ? 'in 1 day' : `in ${days} days`}
                </Text>
              </View>
            );
          })}
        </>
      ) : null}

      {stillKnows.length > 0 ? (
        <Text style={styles.footnote}>
          Still knows it: {stillKnows.length}{' '}
          {stillKnows.length === 1 ? 'step' : 'steps'} mastered and not due.
        </Text>
      ) : null}
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
  title: { fontSize: theme.font.title - 4, fontWeight: '800', color: theme.colors.ink },
  sub: { color: theme.colors.muted, fontSize: theme.font.body, marginTop: -theme.space.sm },
  sectionTitle: {
    fontSize: theme.font.heading - 3,
    fontWeight: '700',
    color: theme.colors.ink,
    marginTop: theme.space.sm,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.space.lg,
    gap: 4,
  },
  cardTitle: { fontSize: theme.font.heading - 2, fontWeight: '700', color: theme.colors.ink },
  cardText: { color: theme.colors.muted, fontSize: theme.font.small, lineHeight: 20 },
  noteCard: {
    backgroundColor: theme.colors.correctSoft,
    borderRadius: theme.radius.button,
    padding: theme.space.md,
  },
  noteText: { color: theme.colors.ink, fontSize: theme.font.small, lineHeight: 20 },
  row: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.button,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
  },
  rowMain: { flex: 1, gap: 2 },
  rowTitle: { fontSize: theme.font.body, fontWeight: '600', color: theme.colors.ink },
  rowSub: { fontSize: theme.font.small, color: theme.colors.muted },
  rowCta: { color: theme.colors.accentInk, fontWeight: '700' },
  upcomingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  footnote: { color: theme.colors.muted, fontSize: theme.font.small, marginTop: theme.space.sm },
  ghost: { paddingVertical: 8, alignItems: 'center' },
  ghostText: { color: theme.colors.muted, fontWeight: '600', fontSize: theme.font.small },
});
