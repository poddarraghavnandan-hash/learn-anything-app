# Shiro v2 — MVP

An AI learning app for **English, ages 6 to under 15**. One loop, done properly:

**Ask a question → diagnose → personal ladder → teach → prove it → spaced review → mastery map.**

Built Oct 30, 2026 as a fresh codebase (v1 was not carried over). Expo SDK 58 / React Native 0.88 / React 19.3, strict TypeScript, Expo Router.

## Run it

```bash
npm install
npm run start          # Expo dev server (iOS / Android / web)
npm run web            # web only
npm test               # engine + job-assignment tests (vitest)
npm run typecheck      # tsc --noEmit
npm run export:web     # static web export to dist/
```

**No API keys are needed.** With no keys configured, Shiro runs entirely on the built-in **demo provider**: the full loop works end-to-end — onboarding, diagnosis, ladders, teach cards, quizzes, FSRS reviews, parent view — using the curated seed pack, offline, at zero cost.

## The loop, screen by screen

Three surfaces, plus onboarding and a parent view:

| Route | What it does |
|---|---|
| `/onboarding` | Neutral age gate. Under 13 → child flow: parent/guardian email + explicit consent capture before a profile exists. 13–14 → teen flow. |
| `/` (Path) | The home screen is the ladder: 4 English ladders, 16 steps, each with its mastery meter and due-review flags. |
| `/ask` | The tutor conversation + the 6-question adaptive placement check. Hints-first by design — no answer machine (see "Why hints-first" below). |
| `/learn/[conceptId]` | Teach card → deterministic prove-it quiz → FSRS schedules the review. |
| `/review` | Today's due reviews, plus what's coming up and what the learner *still knows*. Finite list; clear it and you're done. |
| `/parent` | The trust surface: full mastery map, retention stats, the consent record, and a weekly digest (computed on-device from the learning log; email delivery is a stub). |

## Architecture (one page)

```
src/
  app/          Expo Router screens (the 6 routes above)
  engine/       Pure TypeScript, unit-tested, no RN imports
    scheduling.ts   FSRS-6 via ts-fsrs — when a step comes back
    mastery.ts      BKT-style per-concept mastery probability
    diagnose.ts     IRT-lite (Rasch): ability estimate + max-information item pick
  ai/
    jobs.ts         Job assignment: which provider/model owns which job
    provider.ts     DemoProvider (default) + Anthropic/Gemini composite
    qa.ts           Deterministic answer-key checking — mastery is decided HERE
  content/        Seed pack: 4 ladders × 4 concepts × 4 items, each item with
                  a Rasch difficulty, a deterministic key and a hint
  state/learner.tsx  Profile, consent, mastery, FSRS cards, response log —
                  persisted to AsyncStorage across restarts
  components/     Quiz (hints-first, first-attempt scoring), Diagnosis, MasteryBar
```

Key decisions, all deliberate:

- **Mastery gates are deterministic.** Answers are checked against item keys in `qa.ts`. An LLM may phrase praise; it never decides whether an answer is right (LLM–human grading agreement is too variable to gate a child's progress on).
- **Job assignment, not a runtime router.** Jobs are fixed in advance, so each is statically assigned to the model that should own it (benchmarks show learned routers don't beat a good fixed assignment; they just add failure modes).
- **FSRS-6 with a day floor.** ts-fsrs natively schedules sub-day learning steps (minutes). For young learners, reviews happen on whole days, so sub-day results are floored to grade-ordered day counts (Again 1d, Hard 2d, Good 3d, Easy = FSRS). FSRS's stability math is untouched; it sees real elapsed time at the next review.
- **Diagnosis is 6 questions, not 60.** Rasch max-information selection adapts each next question to the running ability estimate, then recommends the concept whose difficulty sits just above it.
- **Why hints-first:** in Bastani et al. (PNAS 2025), a plain answer-giving GPT-4 tutor raised practice scores ~48% but *cut* unaided exam performance ~17%; a hints-only designed tutor eliminated the harm. So: wrong answer → hint → one retry → only then the reveal. The Ask tutor routes questions to steps and teaches; it does not blurt answers.

## AI providers & env vars

Production providers are the founder's paid accounts (decision, Oct 30 2026):

| Job | Provider | Default model |
|---|---|---|
| `ladder_planning` | Anthropic (Claude) | `claude-sonnet-5-5` |
| `teaching` | Anthropic (Claude) | `claude-sonnet-5-5` |
| `item_generation` | Google (Gemini) | `gemini-3.8-flash` |
| `feedback` | Google (Gemini) | `gemini-3.8-flash` |
| `embeddings` | **Local / open** | on-device hashing now; self-hosted BGE-M3 / Qwen3-Embedding later |

```bash
cp .env.example .env   # then fill in keys — .env is gitignored, never commit it
```

- `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` (alias: `GOOGLE_API_KEY`). Model and base-URL overrides are in `.env.example`. Bare names are preferred; `EXPO_PUBLIC_`-prefixed variants are also accepted.
- Keys are **env-var driven only**, so they can be dropped in from wherever they actually live. The founder believes the paid keys were left in the old learn-anything repo — this codebase does not read that repo; env vars are the only contract. Keys will be supplied through secure entry; do not paste them into files, issues, or chat.
- **Client-key warning:** any key in a client bundle is extractable. Local/dev use only. Before real child traffic, put a small backend proxy in front (holds keys server-side, per-child rate limits, retention policy enforcement, prompt logging for safety review). The provider layer is shaped for that swap: one module, one interface.
- **Child-data rule:** paid API tiers (Anthropic API, Gemini API) do not train on API content. Free tiers are different — see the map below.

## FREE-TIER MAP

Everything in this stack runs at zero cost by default. Paid is a switch, never a requirement.

| Service | Free option | Critical flag |
|---|---|---|
| **Shiro demo provider** (built in) | Unlimited, offline, seed-pack content | ✅ The default. No data leaves the device. Safe for real use with children. |
| Anthropic API (Claude) | No meaningful free tier — paid account required | API content is not used for training. The right tier for child data once proxied. |
| **Google AI Studio free tier** (Gemini) | Free quota via AI Studio key | ⚠️ **Google may train on free-tier content — DEV/DEMO ONLY, NEVER CHILD DATA.** Use the paid Gemini API tier for production. |
| Gemini API (paid tier) | Pay-as-you-go after free quota | API content not used for training on the paid tier. |
| Groq free tier | Free, fast, OpenAI-compatible | Dev/demo only — check current retention terms before any real learner data. |
| OpenRouter free models | Free model variants | Dev/demo only — routing/retention policies vary by upstream model. |
| Hugging Face Inference Providers | Small monthly free credits | Dev/demo only. For production embeddings, self-host an open model instead. |
| Embeddings | Local hashing (MVP) / self-hosted BGE-M3 | ✅ No third party ever sees learner text for vectors. |
| Supabase (future backend) | Free tier: Postgres + auth, 50k MAU | Fine for the production proxy + parent accounts; review DPA before child data. |
| Expo / EAS | Free tier build minutes | Enough for dev and preview builds; production build volume may need the paid tier. |
| Web hosting (demo) | Any static host free tier (Netlify/Vercel/etc.) | Demo only — the static export has no backend and no real keys. |

## Deploy checklist

`eas.json` is committed with `development` / `preview` / `production` profiles. Founder-supplied items (nobody else can provide these):

- [ ] **Apple Developer account** ($99/yr) → Apple ID + Team ID for `eas submit` (placeholders in `eas.json` marked `FOUNDER_TO_SUPPLY`)
- [ ] **Google Play Console account** ($25 one-time) → service-account JSON at `secrets/google-play-service-account.json` (gitignored path; create locally)
- [ ] **API keys** via secure entry → `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` (into EAS secrets / the backend proxy, **not** into the client bundle for production)
- [ ] **Backend proxy** deployed before real child traffic (keys server-side; see provider notes above)
- [ ] **Store child-safety requirements:** Apple Kids Category / Google Play Families declarations, privacy policy URL, data-safety form — the under-13 audience makes these mandatory, not optional
- [ ] Confirm production model IDs/pricing in the Anthropic and Google consoles at launch time (model names churn; both are env-overridable without a code change)

```bash
npx eas-cli@latest build --profile preview      # internal test build
npx eas-cli@latest build --profile production   # store build (after the checklist)
```

## Content

Seed pack (`src/content/`): **Sounds & Phonics** (6–9), **Word Power** (8–12), **Reading & Understanding** (9–14), **Grammar Basics** (8–14) — 16 concepts, 64 items, every item human-authored with a hint, a deterministic key and a difficulty parameter. Generated items (Gemini job) are a gap-filler behind the same QA gate shape: the answer key must be one of the options, and curated content always wins for teach cards.

## Known MVP limits (honest list)

- One learner profile per device; no accounts or sync yet (Supabase is the planned backend).
- The weekly parent digest is computed on-device; email delivery is a stub.
- Diagnosis recommends within the seed pack only.
- `learn` sessions use a concept's full 4-item bank; review sessions use 3 items.
- Accessibility (screen-reader labels, dynamic type) and localisations are post-MVP.
