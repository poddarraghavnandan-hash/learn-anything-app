import { useRef, useState } from 'react';
import { Link, useLocalSearchParams } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { ALL_CONCEPTS, getConcept, type Concept } from '../content';
import { Diagnosis } from '../components/Diagnosis';
import { useLearner } from '../state/learner';
import { abilityLabel } from '../engine/diagnose';
import { theme } from '../theme';

/**
 * Ask — the tutoring conversation.
 *
 * There is deliberately NO free-form answer machine here. Shiro routes a
 * question to the matching step on the learner's path and teaches it
 * hints-first: guidance and clues, then the step itself. Evidence (Bastani
 * et al., PNAS 2025) shows answer-giving tutors raise practice scores while
 * lowering unaided performance; a hints-first tutor avoids the harm.
 *
 * In demo mode the routing is keyword-based over the seed pack; with a
 * real provider configured, the teaching job generates the guidance text
 * (provider.teach) inside the same guardrails.
 */

interface Message {
  from: 'learner' | 'shiro';
  text: string;
  conceptId?: string;
}

const KEYWORDS: Record<string, string[]> = {
  'ph-short-vowels': ['vowel', 'short a', 'short e', 'cat sound', 'middle sound'],
  'ph-blends': ['blend', 'blends', 'two letters start', 'st sound'],
  'ph-digraphs': ['digraph', 'sh sound', 'ch sound', 'th sound', 'ship'],
  'ph-silent-e': ['silent e', 'long vowel', 'cape', 'kite'],
  'vo-synonyms': ['synonym', 'same meaning', 'another word for'],
  'vo-antonyms': ['antonym', 'opposite'],
  'vo-homophones': ['homophone', 'hear or here', 'their there', 'sound alike', 'bear or bare'],
  'vo-context-clues': ['context clue', 'guess the word', 'work out a word', 'new word'],
  're-main-idea': ['main idea', 'mostly about'],
  're-sequencing': ['sequence', 'order of events', 'what happened first'],
  're-inference': ['infer', 'inference', 'between the lines', 'figure out'],
  're-fact-opinion': ['fact', 'opinion'],
  'gr-nouns-verbs': ['noun', 'verb'],
  'gr-sentences': ['sentence', 'fragment', 'capital letter', 'full stop'],
  'gr-agreement': ['agreement', 'goes or go', 'is or are', 'subject verb'],
  'gr-past-tense': ['past tense', 'yesterday', 'went', 'irregular'],
};

function routeQuestion(text: string): Concept | null {
  const q = text.toLowerCase();
  for (const concept of ALL_CONCEPTS) {
    const words = KEYWORDS[concept.id] ?? [];
    if (words.some((w) => q.includes(w))) return concept;
    if (q.includes(concept.title.toLowerCase())) return concept;
  }
  return null;
}

export default function AskScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const { state, completeDiagnosis } = useLearner();
  const [messages, setMessages] = useState<Message[]>([
    {
      from: 'shiro',
      text: 'Hello! Ask me about an English topic — like vowels, synonyms, sentences or past tense — and I will find the right step for you. I will give you clues and guidance, not just answers, because figuring it out is how it sticks.',
    },
  ]);
  const [input, setInput] = useState('');
  const [diagnosing, setDiagnosing] = useState(params.mode === 'diagnosis');
  const scrollRef = useRef<ScrollViewInstance | null>(null);

  const isChild = state.profile?.flow !== 'teen';

  function send() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    const concept = routeQuestion(text);
    const next: Message[] = [...messages, { from: 'learner', text }];
    if (concept) {
      next.push({
        from: 'shiro',
        text: isChild
          ? `Good question — that is part of "${concept.title}". Here is the key idea: ${concept.teach.example} Open the step and I will walk you through it, then check what you remember.`
          : `That sits in "${concept.title}". ${concept.teach.body} Open the step to practise it with feedback.`,
        conceptId: concept.id,
      });
    } else {
      next.push({
        from: 'shiro',
        text: 'Let us narrow it down. Is it about sounds in words, word meanings, understanding stories, or building sentences? Try asking about one of those — or take the 6-question warm-up so I can place you on the right step.',
      });
    }
    setMessages(next);
    requestAnimationFrame(() =>
      scrollRef.current?.scrollToEnd({ animated: true }),
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messages}
        keyboardShouldPersistTaps="handled"
      >
        {!state.diagnosisDone && !diagnosing ? (
          <Pressable style={styles.diagBanner} onPress={() => setDiagnosing(true)}>
            <Text style={styles.diagTitle}>Find my level</Text>
            <Text style={styles.diagText}>
              Six questions, chosen just for you as you answer.
            </Text>
          </Pressable>
        ) : null}

        {diagnosing ? (
          <Diagnosis
            onDone={(ability, recommendedConceptId) => {
              completeDiagnosis(ability, recommendedConceptId);
              setDiagnosing(false);
              const rec = getConcept(recommendedConceptId);
              setMessages((m) => [
                ...m,
                {
                  from: 'shiro',
                  text: `Warm-up complete — your starting level looks like "${abilityLabel(ability)}". I recommend starting with "${rec?.title}". It is on your path, ready when you are.`,
                  conceptId: recommendedConceptId,
                },
              ]);
            }}
          />
        ) : null}

        {messages.map((m, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              m.from === 'learner' ? styles.bubbleLearner : styles.bubbleShiro,
            ]}
          >
            <Text style={styles.bubbleText}>{m.text}</Text>
            {m.conceptId ? (
              <Link
                href={{
                  pathname: '/learn/[conceptId]',
                  params: { conceptId: m.conceptId },
                }}
                asChild
              >
                <Pressable style={styles.openStep}>
                  <Text style={styles.openStepText}>Open this step</Text>
                </Pressable>
              </Link>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about an English topic…"
          placeholderTextColor={theme.colors.faint}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <Pressable style={styles.sendButton} onPress={send}>
          <Text style={styles.sendText}>Ask</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  messages: {
    padding: theme.space.lg,
    gap: theme.space.md,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  diagBanner: {
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.card,
    padding: theme.space.lg,
    gap: 4,
  },
  diagTitle: { fontSize: theme.font.heading - 2, fontWeight: '700', color: theme.colors.accentInk },
  diagText: { color: theme.colors.ink, fontSize: theme.font.small },
  bubble: {
    borderRadius: theme.radius.card,
    padding: theme.space.md,
    maxWidth: '88%',
    gap: theme.space.sm,
  },
  bubbleShiro: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignSelf: 'flex-start',
  },
  bubbleLearner: {
    backgroundColor: theme.colors.accent,
    alignSelf: 'flex-end',
  },
  bubbleText: { fontSize: theme.font.body, lineHeight: 23, color: theme.colors.ink },
  openStep: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.button,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  openStepText: { color: theme.colors.accentInk, fontWeight: '700', fontSize: theme.font.small },
  inputRow: {
    flexDirection: 'row',
    gap: theme.space.sm,
    padding: theme.space.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.button,
    paddingVertical: 12,
    paddingHorizontal: theme.space.md,
    fontSize: theme.font.body,
    color: theme.colors.ink,
    backgroundColor: theme.colors.bg,
  },
  sendButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.button,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: '#FFFFFF', fontWeight: '700', fontSize: theme.font.body },
});
