/**
 * jobs.ts — JOB ASSIGNMENT for AI work (not a runtime router).
 *
 * Call sites ask for a *job* ("teach this step", "give feedback") and never
 * name a model. This module maps each job to a provider + model, resolved
 * from environment variables so keys can be dropped in from wherever they
 * actually live (a local .env today; a server-side secret store later).
 *
 * PRODUCTION PROVIDERS (founder decision, Oct 30 2026): Anthropic (Claude)
 * and Google (Gemini), both on the founder's paid accounts.
 *   ladder_planning → Anthropic   teaching        → Anthropic
 *   item_generation → Gemini      feedback        → Gemini
 *   embeddings      → local/open (never a paid API; see provider.ts)
 *
 * FREE-FIRST DEFAULT: with no keys configured, every job is assigned to the
 * built-in demo provider — zero cost, zero signups, works offline. Real
 * providers are a switch, never a requirement to run.
 *
 * Env vars (Expo inlines EXPO_PUBLIC_*; the names below are matched against
 * both the bare name and the EXPO_PUBLIC_-prefixed name):
 *   ANTHROPIC_API_KEY        Anthropic API key
 *   ANTHROPIC_MODEL          default claude-sonnet-5-5
 *   ANTHROPIC_BASE_URL       default https://api.anthropic.com/v1
 *   GEMINI_API_KEY           Google Gemini API key (GOOGLE_API_KEY works too)
 *   GEMINI_MODEL             default gemini-3.8-flash
 *   GEMINI_BASE_URL          default https://generativelanguage.googleapis.com/v1beta
 *
 * SECURITY NOTE: keys in a client app are extractable. This wiring is for
 * development and demo. Production must proxy model calls through a small
 * backend that holds the keys server-side (see README → Deploy). Keys are
 * supplied by the founder through secure entry — never commit a .env.
 */

export type AiJob =
  | 'ladder_planning'
  | 'teaching'
  | 'item_generation'
  | 'feedback'
  | 'embeddings';

export type ProviderKind = 'demo' | 'anthropic' | 'gemini';

export interface JobAssignment {
  job: AiJob;
  provider: ProviderKind;
  model: string;
}

export interface AnthropicConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface GeminiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

/**
 * Static env snapshot, rebuilt on every call. Expo inlines EXPO_PUBLIC_*
 * vars at build time and the lint rule (expo/no-dynamic-env-var) forbids
 * dynamic process.env access, so every var is read by literal name here.
 */
function readEnv(): Record<string, string | undefined> {
  if (typeof process === 'undefined' || !process.env) return {};
  return {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
    ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    GEMINI_BASE_URL: process.env.GEMINI_BASE_URL,
    EXPO_PUBLIC_ANTHROPIC_API_KEY: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
    EXPO_PUBLIC_ANTHROPIC_MODEL: process.env.EXPO_PUBLIC_ANTHROPIC_MODEL,
    EXPO_PUBLIC_ANTHROPIC_BASE_URL: process.env.EXPO_PUBLIC_ANTHROPIC_BASE_URL,
    EXPO_PUBLIC_GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
    EXPO_PUBLIC_GOOGLE_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
    EXPO_PUBLIC_GEMINI_MODEL: process.env.EXPO_PUBLIC_GEMINI_MODEL,
    EXPO_PUBLIC_GEMINI_BASE_URL: process.env.EXPO_PUBLIC_GEMINI_BASE_URL,
  };
}

function env(name: string): string | undefined {
  const all = readEnv();
  for (const key of [name, `EXPO_PUBLIC_${name}`]) {
    const v = all[key];
    if (v && v.trim().length > 0) return v.trim();
  }
  return undefined;
}

export function anthropicConfig(): AnthropicConfig | null {
  const apiKey = env('ANTHROPIC_API_KEY');
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: env('ANTHROPIC_BASE_URL') ?? 'https://api.anthropic.com/v1',
    model: env('ANTHROPIC_MODEL') ?? 'claude-sonnet-5-5',
  };
}

export function geminiConfig(): GeminiConfig | null {
  const apiKey = env('GEMINI_API_KEY') ?? env('GOOGLE_API_KEY');
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl:
      env('GEMINI_BASE_URL') ??
      'https://generativelanguage.googleapis.com/v1beta',
    model: env('GEMINI_MODEL') ?? 'gemini-3.8-flash',
  };
}

/** True when at least one production provider key is configured. */
export function hasRealProvider(): boolean {
  return anthropicConfig() !== null || geminiConfig() !== null;
}

/**
 * The static assignment table. Reasoning-heavy, low-volume jobs go to
 * Claude; high-volume, structured jobs go to Gemini; embeddings stay
 * local. Any tier without a key falls back to the other configured
 * provider, then to the demo provider.
 */
export function resolveAssignments(): Record<AiJob, JobAssignment> {
  const anthropic = anthropicConfig();
  const gemini = geminiConfig();

  const pick = (
    job: AiJob,
    preferred: Exclude<ProviderKind, 'demo'>,
  ): JobAssignment => {
    if (preferred === 'anthropic' && anthropic) {
      return { job, provider: 'anthropic', model: anthropic.model };
    }
    if (preferred === 'gemini' && gemini) {
      return { job, provider: 'gemini', model: gemini.model };
    }
    if (anthropic) return { job, provider: 'anthropic', model: anthropic.model };
    if (gemini) return { job, provider: 'gemini', model: gemini.model };
    return { job, provider: 'demo', model: 'shiro-demo-seed' };
  };

  return {
    ladder_planning: pick('ladder_planning', 'anthropic'),
    teaching: pick('teaching', 'anthropic'),
    item_generation: pick('item_generation', 'gemini'),
    feedback: pick('feedback', 'gemini'),
    // Embeddings never leave the device in the MVP: a local hashing
    // embedding now, a self-hosted open model (BGE-M3 / Qwen3-Embedding)
    // in production. No paid embeddings API, no child text to a third party.
    embeddings: { job: 'embeddings', provider: 'demo', model: 'local' },
  };
}
