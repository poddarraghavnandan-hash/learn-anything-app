/**
 * provider.ts — the AI provider interface and its implementations.
 *
 * DemoProvider (default, free, offline): serves the seed pack and templated
 * hints-first feedback, so the entire learning loop runs with zero keys.
 *
 * CompositeProvider (when keys are configured): dispatches each job to its
 * assigned production provider — Anthropic (Claude) for ladder planning and
 * teaching, Google (Gemini) for item generation and feedback (see jobs.ts).
 * Embeddings are ALWAYS local (DemoProvider's hashing embedding in the MVP;
 * a self-hosted open model in production) — no paid embeddings API and no
 * child text sent to a third party for vectors.
 *
 * In all providers, the tutor is HINTS-FIRST: feedback never blurts the
 * answer before a learner has tried, and in the child flow it never gives
 * a direct answer at all — the UI reveals answers only after attempts, and
 * mastery is always decided by src/ai/qa.ts, not by a model.
 *
 * TODO(production): route model calls through a backend proxy that holds
 * keys server-side, enforces per-child rate limits, applies the child-data
 * retention policy, and logs prompts for safety review. Never ship real
 * child traffic direct from the client with embedded keys.
 */
import {
  ALL_CONCEPTS,
  getConcept,
  type Concept,
  type QuizItem,
  type TeachCard,
} from '../content';
import {
  anthropicConfig,
  geminiConfig,
  hasRealProvider,
  resolveAssignments,
  type AiJob,
  type ProviderKind,
} from './jobs';

export interface LadderPlan {
  ladderTitle: string;
  conceptTitles: string[];
}

export interface AiProvider {
  readonly kind: ProviderKind;
  planLadder(goal: string): Promise<LadderPlan>;
  teach(concept: Concept): Promise<TeachCard>;
  generateItem(concept: Concept): Promise<QuizItem | null>;
  feedback(item: QuizItem, response: string, correct: boolean): Promise<string>;
  embed(text: string): Promise<number[]>;
}

// --- Demo provider ----------------------------------------------------------

const ENCOURAGEMENTS = [
  'Good thinking — keep going.',
  'You are building this step by step.',
  'Nice effort. Let us look at the clue together.',
];

export class DemoProvider implements AiProvider {
  readonly kind = 'demo' as const;

  async planLadder(_goal: string): Promise<LadderPlan> {
    // The seed pack *is* the launch curriculum; a real planner would rank
    // these concepts against the learner's goal text.
    return {
      ladderTitle: 'English Foundations',
      conceptTitles: ALL_CONCEPTS.slice(0, 6).map((c) => c.title),
    };
  }

  async teach(concept: Concept): Promise<TeachCard> {
    return concept.teach;
  }

  async generateItem(_concept: Concept): Promise<QuizItem | null> {
    // Demo mode serves the curated bank only — no generated items, which is
    // also the safest mode for children (every item is human-authored).
    return null;
  }

  async feedback(
    item: QuizItem,
    _response: string,
    correct: boolean,
  ): Promise<string> {
    if (correct) {
      return ENCOURAGEMENTS[item.id.length % ENCOURAGEMENTS.length];
    }
    // Hints-first: a wrong answer earns a hint, never the answer itself.
    return `Not quite — here is a hint: ${item.hint}`;
  }

  async embed(text: string): Promise<number[]> {
    // Deterministic 32-dim local hashing embedding: stable, offline, free,
    // and no text leaves the device. Swap for a self-hosted open embedding
    // model (BGE-M3 / Qwen3-Embedding) in production — same interface.
    const vec = new Array<number>(32).fill(0);
    for (let i = 0; i < text.length; i++) {
      vec[i % 32] += text.charCodeAt(i) / 255;
    }
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }
}

// --- Raw API calls ------------------------------------------------------------

async function anthropicChat(
  system: string,
  user: string,
  model: string,
): Promise<string> {
  const cfg = anthropicConfig();
  if (!cfg) throw new Error('Anthropic is not configured');
  const res = await fetch(`${cfg.baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cfg.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic call failed: ${res.status}`);
  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  return (
    data.content
      ?.filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('') ?? ''
  );
}

async function geminiChat(
  system: string,
  user: string,
  model: string,
): Promise<string> {
  const cfg = geminiConfig();
  if (!cfg) throw new Error('Gemini is not configured');
  const res = await fetch(`${cfg.baseUrl}/models/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': cfg.apiKey,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ parts: [{ text: user }] }],
    }),
  });
  if (!res.ok) throw new Error(`Gemini call failed: ${res.status}`);
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? '')
      .join('') ?? ''
  );
}

/** Run one job on its assigned provider; throws if that provider is unset. */
async function callJob(
  job: AiJob,
  system: string,
  user: string,
): Promise<string> {
  const assignment = resolveAssignments()[job];
  if (assignment.provider === 'anthropic') {
    return anthropicChat(system, user, assignment.model);
  }
  if (assignment.provider === 'gemini') {
    return geminiChat(system, user, assignment.model);
  }
  throw new Error(`Job ${job} is assigned to the demo provider`);
}

// --- Composite production provider ---------------------------------------------

export class CompositeProvider implements AiProvider {
  readonly kind: ProviderKind;
  private readonly demo = new DemoProvider();

  constructor() {
    this.kind = anthropicConfig() ? 'anthropic' : 'gemini';
  }

  async planLadder(goal: string): Promise<LadderPlan> {
    try {
      const text = await callJob(
        'ladder_planning',
        'You plan a short English learning ladder for a child. Reply with JSON only: {"ladderTitle": string, "conceptTitles": string[]}.',
        `Goal: ${goal}`,
      );
      const parsed = JSON.parse(text) as LadderPlan;
      if (parsed.ladderTitle && Array.isArray(parsed.conceptTitles)) {
        return parsed;
      }
    } catch {
      // fall through to the curated plan
    }
    return this.demo.planLadder(goal);
  }

  async teach(concept: Concept): Promise<TeachCard> {
    // Curated teach cards win over generated ones for children; generation
    // is a gap-filler only. TODO(production): cache + human-review queue
    // for any generated card before a child sees it.
    return concept.teach;
  }

  async generateItem(concept: Concept): Promise<QuizItem | null> {
    try {
      const text = await callJob(
        'item_generation',
        'You write one multiple-choice English practice item for a child. Reply with JSON only: {"prompt": string, "options": string[4], "answer": string, "hint": string}. The answer must be exactly one of the options.',
        `Concept: ${concept.title} — ${concept.summary}`,
      );
      const p = JSON.parse(text) as {
        prompt: string;
        options: string[];
        answer: string;
        hint: string;
      };
      if (!p.options?.includes(p.answer)) return null; // key must be an option
      return {
        id: `gen-${concept.id}-${Date.now()}`,
        conceptId: concept.id,
        type: 'mcq',
        prompt: p.prompt,
        options: p.options,
        answer: p.answer,
        difficulty: 0,
        hint: p.hint ?? 'Think about the teach card for this step.',
      };
    } catch {
      return null;
    }
  }

  async feedback(
    item: QuizItem,
    response: string,
    correct: boolean,
  ): Promise<string> {
    if (!correct) {
      // Hints-first is enforced locally; never spend a model call that
      // risks the model blurting the answer to a child.
      return `Not quite — here is a hint: ${item.hint}`;
    }
    try {
      const text = await callJob(
        'feedback',
        'You are a warm tutor for a child. In ONE short sentence, praise the specific thing they did right. Never mention being an AI.',
        `Question: ${item.prompt}\nCorrect answer: ${item.answer}\nLearner answered: ${response}`,
      );
      return text.trim() || 'Well done — that is exactly right.';
    } catch {
      return this.demo.feedback(item, response, true);
    }
  }

  async embed(text: string): Promise<number[]> {
    // Always local — see the header note on embeddings.
    return this.demo.embed(text);
  }
}

// --- Provider selection -----------------------------------------------------------

let cached: AiProvider | null = null;

/**
 * The app's single entry point for AI. Demo by default (free, offline);
 * the Anthropic/Gemini composite when keys are configured. Call sites use
 * jobs (via these methods), never a raw model name.
 */
export function getProvider(): AiProvider {
  if (cached) return cached;
  cached = hasRealProvider() ? new CompositeProvider() : new DemoProvider();
  return cached;
}

export function getConceptOrThrow(conceptId: string): Concept {
  const c = getConcept(conceptId);
  if (!c) throw new Error(`Unknown concept: ${conceptId}`);
  return c;
}
