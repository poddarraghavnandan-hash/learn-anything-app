# Prior Knowledge Check — Design Document

## Core Philosophy

The prior knowledge check is NOT a test. It's a **conversation starter** — a warm, personal way to understand what the learner already knows so the system can calibrate everything that follows. It should feel like a thoughtful teacher asking "before we dive in, tell me..." — not a standardized assessment.

## Architecture: Two-Phase Journey Generation

Instead of generating the entire journey in one LLM call, we split into two phases:

### Phase 1: Generate Prior Knowledge Questions
A new backend endpoint `chat.priorKnowledge` generates 2-3 quick questions based on:
- The learner's question/topic
- Their age (if known) — adjusts language complexity
- Their existing learner model — skip if already high confidence in related concepts
- The topic category — different question styles per domain

### Phase 2: Generate Journey with Prior Knowledge Context
The existing `chat.learn` endpoint receives the prior knowledge answers as additional context, allowing the LLM to dynamically adjust:
- Foundation depth (skip if they already know it, expand if they don't)
- Vocabulary level (technical terms if they're familiar, plain language if not)
- Example style (age-appropriate, interest-aligned)
- Check question difficulty (based on demonstrated knowledge)

## Question Types (Category-Aware)

### Universal Types (all categories)
1. **Familiarity Scale** — "How familiar are you with [concept]?"
   - Options: "Never heard of it", "Heard the name", "Know the basics", "Pretty comfortable"
   - Warm, non-judgmental framing

2. **Connection Check** — "Have you ever [experienced/seen/used] something related to this?"
   - Yes/No with optional context
   - Builds confidence and reveals real-world connections

### Category-Specific Types

| Category | Question Style | Example |
|----------|---------------|---------|
| Science | "What do you think happens when..." | "What do you think happens when you mix oil and water?" |
| Code/Tech | "Have you ever tried..." | "Have you ever written any code, even a simple script?" |
| Math | "Quick intuition check..." | "If you double the radius of a circle, what happens to the area?" |
| History | "What comes to mind when you hear..." | "What comes to mind when you hear 'Renaissance'?" |
| Art/Music | "When you see/hear this, you think of..." | "When you hear 'impressionism,' what comes to mind?" |
| Language | "Can you recognize..." | "Can you recognize any words in this sentence: 'Bonjour, comment allez-vous?'" |
| Health/Bio | "From your experience..." | "From your experience, what do you think causes muscle soreness after exercise?" |
| Philosophy | "What's your gut feeling about..." | "What's your gut feeling — is there such a thing as free will?" |
| Business | "In your daily life..." | "In your daily life, have you noticed how prices change for the same product?" |

### Age-Aware Language Adjustments

| Age Group | Language Style | Question Framing |
|-----------|---------------|-----------------|
| Under 10 | Very simple, playful | "Do you know what [X] is? It's okay if you don't!" |
| 10-14 | Friendly, curious | "Have you learned about [X] in school?" |
| 15-18 | Peer-like, respectful | "How much do you know about [X]?" |
| 18-25 | Direct, engaging | "What's your background with [X]?" |
| 25-40 | Professional, warm | "How familiar are you with [X]?" |
| 40+ | Respectful, acknowledging experience | "You may have encountered [X] before — how much do you know?" |
| Unknown | Neutral, warm | "Before we start, how familiar are you with [X]?" |

## Prior Knowledge Stage Data Model

```typescript
// New fields on JourneyStage for prior_knowledge type
interface PriorKnowledgeQuestion {
  id: string;
  question: string;
  type: "familiarity" | "experience" | "intuition" | "recognition";
  options: string[];
  emoji: string;
  // Each option maps to a knowledge signal
  signals: {
    optionIndex: number;
    knowledgeLevel: "none" | "low" | "medium" | "high";
  }[];
}
```

## UI Design

The prior knowledge check appears as the FIRST stage of the journey (before hook), with a special card design:

1. **Warm greeting** — "Before we explore [topic], let me understand where you're starting from..."
2. **2-3 quick tap questions** — Each appears one at a time with a gentle animation
3. **No right/wrong** — Every answer is valid, just calibrating
4. **Instant feedback** — Brief encouraging response after each ("Great!", "That helps!", "Perfect, I know just where to start")
5. **Smooth transition** — After answering, the card transforms into a brief "Tailoring your journey..." loading state, then the hook appears

## Skip Logic

Skip the prior knowledge check if:
- Learner has high confidence (>0.7) in ALL mapped concepts for this topic
- Learner has completed 3+ journeys on closely related topics
- Learner explicitly taps "Skip — I'm ready to learn"

## XP Integration

- Award 5 XP for completing the prior knowledge check (small reward for engagement)
- No penalty for any answer — it's calibration, not assessment

## Learner Model Updates

After the prior knowledge check:
- Update `conceptConfidence` for the topic's concepts based on answers
- Add to `strengthAreas` if they show high familiarity
- Add to `confusionPoints` if they show no familiarity with prerequisites
- Adjust `preferredDepth` if their answers suggest a different level than current setting
