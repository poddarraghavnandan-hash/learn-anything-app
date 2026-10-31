/**
 * Diagnosis.tsx — the adaptive placement check.
 *
 * Six questions, chosen one at a time by maximum Fisher information at the
 * learner's current ability estimate (see engine/diagnose.ts). Responses
 * are graded with the deterministic key only. At the end we hand back the
 * ability estimate and a recommended starting concept: the unmastered
 * concept whose item difficulty sits just above the estimate — the zone
 * where learning happens.
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  ALL_CONCEPTS,
  ALL_ITEMS,
  conceptMeanDifficulty,
  type QuizItem,
} from '../content';
import { checkAnswer } from '../ai/qa';
import {
  selectNextItem,
  updateAbility,
} from '../engine/diagnose';
import { theme } from '../theme';

const QUESTION_COUNT = 6;

interface DiagnosisProps {
  onDone: (ability: number, recommendedConceptId: string) => void;
}

export function recommendConcept(ability: number): string {
  const sorted = [...ALL_CONCEPTS].sort(
    (a, b) => conceptMeanDifficulty(a) - conceptMeanDifficulty(b),
  );
  const target = sorted.find((c) => conceptMeanDifficulty(c) >= ability - 0.25);
  return (target ?? sorted[sorted.length - 1]).id;
}

export function Diagnosis({ onDone }: DiagnosisProps) {
  const [theta, setTheta] = useState(0);
  const [used, setUsed] = useState<ReadonlySet<string>>(new Set());
  const [answered, setAnswered] = useState(0);
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const item: QuizItem | null = useMemo(
    () => selectNextItem(theta, ALL_ITEMS, used),
    [theta, used],
  );

  if (!item) {
    return (
      <View style={styles.card}>
        <Text style={styles.text}>Warm-up finished.</Text>
      </View>
    );
  }

  const response = item.type === 'mcq' ? selected : input;

  function submit() {
    if (!item || !response) return;
    const correct = checkAnswer(item, response);
    const nextTheta = updateAbility(theta, item, correct);
    const nextUsed = new Set(used);
    nextUsed.add(item.id);
    const nextAnswered = answered + 1;
    setFlash(correct ? 'Good — noted.' : 'Okay — noted. Let us try another.');
    setTimeout(() => {
      setFlash(null);
      setInput('');
      setSelected(null);
      if (nextAnswered >= QUESTION_COUNT) {
        onDone(nextTheta, recommendConcept(nextTheta));
      } else {
        setTheta(nextTheta);
        setUsed(nextUsed);
        setAnswered(nextAnswered);
      }
    }, 650);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.progress}>
        Warm-up · {answered + 1} of {QUESTION_COUNT}
      </Text>
      <Text style={styles.prompt}>{item.prompt}</Text>
      {item.type === 'mcq' ? (
        <View style={styles.options}>
          {item.options?.map((opt) => (
            <Pressable
              key={opt}
              onPress={() => setSelected(opt)}
              style={[
                styles.option,
                selected === opt && styles.optionPicked,
              ]}
            >
              <Text style={styles.optionText}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your answer"
          placeholderTextColor={theme.colors.faint}
          autoCapitalize="none"
          autoCorrect={false}
        />
      )}
      {flash ? <Text style={styles.flash}>{flash}</Text> : null}
      <Pressable
        style={[styles.button, !response && styles.buttonDisabled]}
        onPress={submit}
      >
        <Text style={styles.buttonText}>Answer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: theme.space.lg,
    gap: theme.space.md,
  },
  progress: {
    fontSize: theme.font.tiny,
    color: theme.colors.faint,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  prompt: {
    fontSize: theme.font.heading - 2,
    lineHeight: 27,
    fontWeight: '600',
    color: theme.colors.ink,
  },
  text: { fontSize: theme.font.body, color: theme.colors.ink },
  options: { gap: theme.space.sm },
  option: {
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.button,
    paddingVertical: 12,
    paddingHorizontal: theme.space.md,
    backgroundColor: theme.colors.bg,
  },
  optionPicked: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  optionText: { fontSize: theme.font.body, color: theme.colors.ink },
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
  flash: { fontSize: theme.font.small, color: theme.colors.muted },
  button: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.button,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: theme.font.body },
});
