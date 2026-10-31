/**
 * Quiz.tsx — the prove-it step of the loop, shared by Learn and Review.
 *
 * Behaviour (deliberate, evidence-based):
 *  - Answers are graded deterministically against the item key (qa.ts).
 *  - A wrong first attempt earns a HINT, never the answer, plus one retry.
 *  - The answer is revealed only after the retry, so the learner always
 *    has to produce before they are told.
 *  - Only FIRST-attempt results are reported upward: they drive BKT
 *    mastery and the FSRS session grade.
 */
import { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { QuizItem } from '../content';
import { checkAnswer } from '../ai/qa';
import { getProvider } from '../ai/provider';
import { theme } from '../theme';

export interface QuizResult {
  item: QuizItem;
  correctFirstAttempt: boolean;
}

interface QuizProps {
  items: QuizItem[];
  onAnswer?: (item: QuizItem, correctFirstAttempt: boolean) => void;
  onFinish: (results: QuizResult[]) => void;
}

type Phase =
  | { kind: 'answering'; attempt: 1 | 2; hintShown: boolean }
  | { kind: 'revealed'; wasCorrect: boolean };

export function Quiz({ items, onAnswer, onFinish }: QuizProps) {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({
    kind: 'answering',
    attempt: 1,
    hintShown: false,
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);

  const item = items[index];
  const provider = useMemo(() => getProvider(), []);

  if (!item) return null;

  const currentResponse = item.type === 'mcq' ? selected : input;

  async function submit() {
    if (phase.kind !== 'answering') return;
    if (!currentResponse || currentResponse.trim().length === 0) return;
    const correct = checkAnswer(item, currentResponse);
    if (correct) {
      const firstAttempt = phase.attempt === 1;
      const note = await provider.feedback(item, currentResponse, true);
      setFeedback(note);
      setPhase({ kind: 'revealed', wasCorrect: firstAttempt });
      const r: QuizResult = { item, correctFirstAttempt: firstAttempt };
      setResults((prev) => [...prev, r]);
      onAnswer?.(item, firstAttempt);
      return;
    }
    if (phase.attempt === 1) {
      // Hints-first: show the hint and allow exactly one retry.
      const note = await provider.feedback(item, currentResponse, false);
      setFeedback(note);
      setPhase({ kind: 'answering', attempt: 2, hintShown: true });
      setSelected(null);
      setInput('');
      return;
    }
    // Second miss: reveal and record a first-attempt miss.
    setFeedback(`The answer is: ${item.answer}. Read it, say it, and let us move on — you will meet this again soon.`);
    setPhase({ kind: 'revealed', wasCorrect: false });
    const r: QuizResult = { item, correctFirstAttempt: false };
    setResults((prev) => [...prev, r]);
    onAnswer?.(item, false);
  }

  function next() {
    const done: QuizResult[] = results;
    if (index + 1 >= items.length) {
      onFinish(done);
      return;
    }
    setIndex(index + 1);
    setInput('');
    setSelected(null);
    setFeedback(null);
    setPhase({ kind: 'answering', attempt: 1, hintShown: false });
  }

  const revealed = phase.kind === 'revealed';

  return (
    <View style={styles.card}>
      <Text style={styles.progress}>
        Question {index + 1} of {items.length}
        {phase.kind === 'answering' && phase.attempt === 2 ? ' · one more try' : ''}
      </Text>
      <Text style={styles.prompt}>{item.prompt}</Text>

      {item.type === 'mcq' ? (
        <View style={styles.options}>
          {item.options?.map((opt) => {
            const isPicked = selected === opt;
            const showRight = revealed && checkAnswer(item, opt);
            return (
              <Pressable
                key={opt}
                disabled={revealed}
                onPress={() => setSelected(opt)}
                style={[
                  styles.option,
                  isPicked && styles.optionPicked,
                  showRight && styles.optionRight,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    isPicked && styles.optionTextPicked,
                  ]}
                >
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your answer"
          placeholderTextColor={theme.colors.faint}
          editable={!revealed}
          autoCapitalize="none"
          autoCorrect={false}
        />
      )}

      {feedback ? (
        <View
          style={[
            styles.feedback,
            revealed && phase.wasCorrect
              ? styles.feedbackGood
              : styles.feedbackHint,
          ]}
        >
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      ) : null}

      {!revealed ? (
        <Pressable
          style={[
            styles.button,
            !currentResponse && styles.buttonDisabled,
          ]}
          onPress={submit}
        >
          <Text style={styles.buttonText}>Check my answer</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.button} onPress={next}>
          <Text style={styles.buttonText}>
            {index + 1 >= items.length ? 'Finish' : 'Next question'}
          </Text>
        </Pressable>
      )}
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
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  prompt: {
    fontSize: theme.font.heading - 2,
    lineHeight: 27,
    color: theme.colors.ink,
    fontWeight: '600',
  },
  options: { gap: theme.space.sm },
  option: {
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.button,
    paddingVertical: 13,
    paddingHorizontal: theme.space.md,
    backgroundColor: theme.colors.bg,
  },
  optionPicked: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  optionRight: {
    borderColor: theme.colors.correct,
    backgroundColor: theme.colors.correctSoft,
  },
  optionText: { fontSize: theme.font.body, color: theme.colors.ink },
  optionTextPicked: { fontWeight: '600' },
  input: {
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.button,
    paddingVertical: 13,
    paddingHorizontal: theme.space.md,
    fontSize: theme.font.body,
    color: theme.colors.ink,
    backgroundColor: theme.colors.bg,
  },
  feedback: {
    borderRadius: theme.radius.button,
    padding: theme.space.md,
  },
  feedbackGood: { backgroundColor: theme.colors.correctSoft },
  feedbackHint: { backgroundColor: theme.colors.accentSoft },
  feedbackText: { fontSize: theme.font.body - 1, lineHeight: 22, color: theme.colors.ink },
  button: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: {
    color: '#FFFFFF',
    fontSize: theme.font.body,
    fontWeight: '700',
  },
});
