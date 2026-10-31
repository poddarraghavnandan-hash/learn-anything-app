import { useState } from 'react';
import { Link, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getConcept } from '../../content';
import { Quiz, type QuizResult } from '../../components/Quiz';
import { MasteryBar } from '../../components/MasteryBar';
import { useLearner } from '../../state/learner';
import { theme } from '../../theme';

type Phase = 'teach' | 'quiz' | 'done';

/**
 * Learn a step: teach card → deterministic prove-it quiz → FSRS schedules
 * the review. This screen is the core loop, end to end.
 */
export default function LearnScreen() {
  const { conceptId } = useLocalSearchParams<{ conceptId: string }>();
  const concept = conceptId ? getConcept(conceptId) : undefined;
  const { state, recordAnswer, completeSession } = useLearner();
  const [phase, setPhase] = useState<Phase>('teach');
  const [summary, setSummary] = useState<{ total: number; firstTry: number } | null>(null);

  if (!concept) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>That step could not be found.</Text>
        <Link href="/" asChild>
          <Pressable style={styles.ghost}>
            <Text style={styles.ghostText}>Back to your path</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  const cs = state.concepts[concept.id];
  const nextReview = cs?.card
    ? new Date(cs.card.due).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : null;

  function finish(results: QuizResult[]) {
    const firstTry = results.filter((r) => r.correctFirstAttempt).length;
    completeSession(concept!.id, results.length ? firstTry / results.length : 0);
    setSummary({ total: results.length, firstTry });
    setPhase('done');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{concept.title}</Text>
      <Text style={styles.summary}>{concept.summary}</Text>
      <MasteryBar value={cs?.mastery ?? 0} />

      {phase === 'teach' ? (
        <>
          <View style={styles.teachCard}>
            <Text style={styles.teachHeading}>{concept.teach.heading}</Text>
            <Text style={styles.teachBody}>{concept.teach.body}</Text>
            <View style={styles.exampleBox}>
              <Text style={styles.exampleLabel}>Example</Text>
              <Text style={styles.teachBody}>{concept.teach.example}</Text>
            </View>
          </View>
          <Pressable style={styles.cta} onPress={() => setPhase('quiz')}>
            <Text style={styles.ctaText}>I&apos;m ready — check me</Text>
          </Pressable>
        </>
      ) : null}

      {phase === 'quiz' ? (
        <Quiz
          items={concept.items}
          onAnswer={(item, correctFirst) =>
            recordAnswer(concept.id, item, correctFirst)
          }
          onFinish={finish}
        />
      ) : null}

      {phase === 'done' ? (
        <View style={styles.doneCard}>
          <Text style={styles.doneTitle}>Step complete</Text>
          <Text style={styles.doneText}>
            You answered {summary?.firstTry} of {summary?.total} questions
            right on the first try.
          </Text>
          {nextReview ? (
            <Text style={styles.doneText}>
              Shiro will bring this step back on {nextReview} — just long
              enough later that remembering it makes it stick.
            </Text>
          ) : null}
          <Link href="/" asChild>
            <Pressable style={styles.cta}>
              <Text style={styles.ctaText}>Back to your path</Text>
            </Pressable>
          </Link>
          <Link href="/review" asChild>
            <Pressable style={styles.ghost}>
              <Text style={styles.ghostText}>See my reviews</Text>
            </Pressable>
          </Link>
        </View>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.md,
    backgroundColor: theme.colors.bg,
  },
  muted: { color: theme.colors.muted, fontSize: theme.font.body },
  title: { fontSize: theme.font.title - 4, fontWeight: '800', color: theme.colors.ink },
  summary: { color: theme.colors.muted, fontSize: theme.font.body },
  teachCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.space.lg,
    gap: theme.space.md,
  },
  teachHeading: { fontSize: theme.font.heading, fontWeight: '700', color: theme.colors.ink },
  teachBody: { fontSize: theme.font.body, lineHeight: 25, color: theme.colors.ink },
  exampleBox: {
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.button,
    padding: theme.space.md,
    gap: 4,
  },
  exampleLabel: {
    fontSize: theme.font.tiny,
    fontWeight: '700',
    color: theme.colors.accentInk,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cta: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.button,
    paddingVertical: 15,
    alignItems: 'center',
  },
  ctaText: { color: '#FFFFFF', fontWeight: '700', fontSize: theme.font.body },
  ghost: { paddingVertical: 10, alignItems: 'center' },
  ghostText: { color: theme.colors.muted, fontWeight: '600', fontSize: theme.font.small },
  doneCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.space.lg,
    gap: theme.space.md,
  },
  doneTitle: { fontSize: theme.font.heading, fontWeight: '700', color: theme.colors.ink },
  doneText: { fontSize: theme.font.body, lineHeight: 24, color: theme.colors.ink },
});
