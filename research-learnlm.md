# LearnLM + Adaptive Learning Research Notes

## Google LearnLM Core Principles (to integrate into our LLM prompts)
1. **Inspiring active learning** — Practice + healthy struggle with timely feedback
2. **Managing cognitive load** — Present relevant, well-structured info in multiple modalities
3. **Adapting to the learner** — Dynamically adjust to goals/needs, grounding in relevant materials
4. **Stimulating curiosity** — Inspire engagement to provide motivation
5. **Deepening metacognition** — Plan, monitor, help learner reflect on progress

## Key Patterns from LearnLM
- Start simple, increase difficulty if student answers correctly
- Prompt student to explain reasoning (not just pick answer)
- After explanation, affirm correct or guide to correct mistake
- Pose ONE question per turn (don't overwhelm)
- Relevel content to match student's grade/ability
- Guide through structured activities step-by-step

## Zone of Proximal Development (Vygotsky)
- Content should be slightly above current ability
- Not too easy (boredom) or too hard (frustration)
- AI acts as "more knowledgeable other" scaffolding learning
- Gradually remove scaffolding as competence grows

## Architecture Decisions for Our App
- Use built-in LLM with LearnLM-style system prompts
- Every quiz explains WHY the answer is correct
- Content summaries adapt to skill level ("ELI5" vs "advanced")
- Track per-topic difficulty and auto-calibrate
- YouTube queries include skill-level modifiers
- Quizzes generated from actual content, not generic
- Progressive difficulty: beginner → intermediate → advanced per topic
- Core belief: "Anyone can learn anything" — never gatekeep, always scaffold
