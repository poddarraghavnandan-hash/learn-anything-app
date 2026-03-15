# Deep Research: How Humans Actually Learn — Synthesis for App Architecture

## 1. The Fundamental Cognitive Architecture of Learning

### Working Memory is the Bottleneck
- Working memory can hold ~4 chunks of information at once (Cowan, 2001)
- ALL new learning must pass through working memory before being encoded into long-term memory
- **Implication:** Content must be broken into small, digestible pieces. Never overwhelm with too much at once.
- Cognitive Load Theory (Sweller): There are 3 types of load:
  - **Intrinsic** (complexity of the material itself)
  - **Extraneous** (bad UI, confusing instructions — MUST minimize)
  - **Germane** (mental effort of building schemas — MUST maximize)

### Schema Formation is How Knowledge is Organized
- Experts don't just know more — they organize knowledge into **schemas** (interconnected mental models)
- Novices see surface features; experts see deep structural patterns
- A kid learning to read doesn't just memorize words — they build schemas: letter→sound→blend→word→sentence→meaning
- An adult learning quantum physics builds schemas: classical mechanics→wave behavior→probability→quantum states→entanglement
- **Implication:** The app must help users BUILD SCHEMAS, not just consume content. This means showing connections, prerequisites, and the "why" behind each concept.

### Constructivism: Knowledge is Built, Not Transferred
- Piaget: Learners actively construct knowledge by connecting new info to existing schemas
- Vygotsky: Learning happens best in the Zone of Proximal Development (ZPD) — just beyond what you can do alone
- **Implication:** Content must be scaffolded. The app must know what the user already knows and present the NEXT thing they can learn with support.

## 2. The 6 Evidence-Based Learning Strategies

### Spaced Repetition (The Forgetting Curve)
- Ebbinghaus (1885): We forget ~70% within 24 hours without review
- Optimal review intervals: 1 day → 3 days → 7 days → 14 days → 30 days → 90 days
- Half-Life Regression (Duolingo): Each concept has a "half-life" — the time until you have a 50% chance of forgetting it
- **Implication:** The app must track what the user has learned and schedule reviews at optimal intervals

### Retrieval Practice (Testing Effect)
- Retrieving information from memory STRENGTHENS the memory more than re-reading
- Even failed retrieval attempts improve learning (as long as feedback is given)
- **Implication:** Quizzes aren't just assessment — they ARE the learning. Every quiz makes the user smarter.

### Interleaving
- Mixing different topics/problem types during practice is better than blocking (studying one topic at a time)
- Feels harder but produces better long-term retention and transfer
- **Implication:** The feed should mix topics, not show 10 physics videos in a row

### Elaborative Interrogation
- Asking "why?" and "how?" about what you're learning deepens understanding
- **Implication:** After each content piece, prompt the user: "Why do you think this works?" or "How does this connect to what you learned before?"

### Concrete Examples
- Abstract concepts become learnable when tied to concrete, relatable examples
- **Implication:** The LLM should generate real-world analogies and examples for every concept

### Dual Coding
- Combining verbal (text/audio) with visual (images/diagrams) information creates stronger memories
- **Implication:** Mix video, text summaries, and visual diagrams in the learning experience

## 3. Bloom's Taxonomy — The Ladder of Understanding

1. **Remember** — Recall facts (quiz: "What is X?")
2. **Understand** — Explain in own words (quiz: "Explain why X happens")
3. **Apply** — Use knowledge in new situations (quiz: "If X changed, what would happen?")
4. **Analyze** — Break down and examine (quiz: "Compare X and Y")
5. **Evaluate** — Judge and critique (quiz: "Is this claim correct? Why?")
6. **Create** — Generate new ideas (quiz: "Design an experiment to test X")

**Implication:** Quizzes should progress through Bloom's levels as the user advances. Beginners get "Remember" questions, advanced learners get "Analyze" and "Evaluate" questions.

## 4. Mastery Learning (Bloom, 1968)

- Students who are given enough time and appropriate instruction can ALL achieve mastery (95%+)
- The problem with traditional education: everyone gets the same time, so only some master it
- **Key insight:** The variable should be TIME, not achievement level
- Students must demonstrate mastery of each unit before moving to the next
- **Implication:** Steps in the learning ladder should require demonstrated mastery (quiz pass) before unlocking the next step. But the user controls the pace.

## 5. The Duolingo/Birdbrain Model — What Actually Works at Scale

### Core Algorithm
- For any learner + any exercise: predict probability of correct answer
- Two variables: **exercise difficulty** + **learner ability**
- Updated in real-time after every interaction (like Elo in chess)
- If learner gets hard thing right → big ability boost, small difficulty decrease
- If learner gets easy thing wrong → big ability decrease, small difficulty increase

### Key Insights
- **Engagement and learning are correlated, not opposed** — when difficulty is right, both increase
- **Mistakes are data, not failures** — Duolingo streams incomplete session data because quitting = the content was too hard
- **Real-time adaptation** — V2 updates within minutes, not daily
- **Rich learner representation** — V2 uses LSTM neural network to capture that a learner might be great at past tense but struggle with future tense

### What We Can Adapt
- We can't do per-exercise tracking at Duolingo's scale, but we CAN:
  - Track quiz accuracy per topic per step
  - Adjust content difficulty based on quiz performance
  - Use the LLM to generate harder/easier content on the fly
  - Track engagement signals (time spent, reactions, completion)

## 6. Flow State — Making Learning Feel Like Play

### Csikszentmihalyi's Flow Model
- Flow = complete absorption in an activity
- Requires: **clear goals**, **immediate feedback**, **challenge-skill balance**
- Too easy → boredom → user leaves
- Too hard → anxiety → user leaves
- Just right → flow → user stays for hours

### Self-Determination Theory (Deci & Ryan)
Three innate psychological needs:
1. **Autonomy** — "I chose to learn this" (let users pick topics, not force them)
2. **Competence** — "I'm getting better" (show progress, celebrate wins)
3. **Relatedness** — "Others are learning too" (social proof, community)

### TikTok's Engagement Psychology (applied to learning)
- **Variable reward schedule** — unpredictable rewards (surprise quizzes, random fun facts) are more engaging than fixed ones
- **Completion loops** — each piece of content should feel complete but leave a hook for the next
- **Minimal friction** — zero barriers between "I want to learn" and "I'm learning"
- **Dopamine from discovery** — the "aha!" moment IS the reward

## 7. How a Kid Actually Learns to Read (Specific Example)

### The Real Progression
1. **Phonemic Awareness** — hearing individual sounds in words ("cat" = /k/ /æ/ /t/)
2. **Letter Recognition** — matching letters to sounds (A = /æ/)
3. **Phonics** — blending sounds into words (c-a-t = "cat")
4. **Sight Words** — recognizing common words instantly ("the", "is", "and")
5. **Fluency** — reading smoothly without stopping to decode
6. **Vocabulary** — understanding what words mean in context
7. **Comprehension** — understanding what sentences and paragraphs mean

### What the App Must Do
- Detect which stage the child is at (Curiosity Check)
- Show content appropriate for that stage (YouTube phonics songs for stage 1-2, simple story read-alongs for stage 3-4)
- Quiz at each stage to verify mastery before advancing
- The LLM must understand this progression and generate appropriate questions

## 8. How an Adult Learns Quantum Physics (Specific Example)

### The Real Prerequisite Chain
1. **Basic Math** — algebra, trigonometry
2. **Classical Mechanics** — Newton's laws, energy, momentum
3. **Waves & Oscillations** — wave behavior, interference, superposition
4. **Electromagnetism** — Maxwell's equations, light as EM wave
5. **Special Relativity** — time dilation, E=mc²
6. **Quantum Concepts** — wave-particle duality, uncertainty principle, quantization
7. **Quantum Mechanics** — Schrödinger equation, quantum states, measurement
8. **Quantum Field Theory** — fields, particles as excitations
9. **String Theory** — extra dimensions, unification attempts

### What the App Must Do
- Assess where the adult is in this chain (Curiosity Check)
- Skip steps they already know (an engineer might start at step 5)
- Each step has curated YouTube content (3Blue1Brown for math, PBS Space Time for physics)
- Quizzes verify understanding before advancing
- "I don't understand" triggers simpler content or prerequisite review

## 9. Architecture Principles for the App

### The Birdbrain-Inspired Local Model
For each topic the user is learning, track:
- **Ability estimate** — starts from Curiosity Check, updated by quiz performance
- **Current step** — where they are on the learning ladder
- **Step mastery** — quiz accuracy per step (need 70%+ to advance)
- **Engagement signals** — time spent, reactions, completion rate
- **Forgetting curve** — when they last reviewed each step, when to prompt review

### The Content Curation Pipeline
1. LLM generates the **learning ladder** (prerequisite chain) for any topic
2. For each step, LLM generates a **specific YouTube search query** tuned to the user's level
3. YouTube API returns videos; LLM ranks them by educational quality
4. LLM generates **quizzes from video titles/descriptions** at appropriate Bloom's level
5. Feed shows content from the user's **current step** with context about where they are

### The Curiosity Check (Fun Baseline Assessment)
- 5 questions that feel like a game show, not a test
- Range from easy (step 1 knowledge) to hard (step 7+ knowledge)
- Fun facts after every answer (learning happens even during assessment!)
- Encouraging tone: "Wow, you already know about X! Let's see what else..."
- Result: determines starting step on the ladder
- Design: big emoji, playful language, no "score" shown — just "Here's where your journey begins!"

### The Adaptive Feed
- Shows content from current step ONLY (not random videos)
- Every 3 content items → quiz card (retrieval practice)
- Quiz difficulty matches current Bloom's level for this step
- Getting 3 quizzes right in a row → "Ready to advance?" prompt
- Getting 2 wrong → "Let's review" with simpler content
- Interleaving: if user follows multiple topics, mix them in the feed
- Spaced repetition: periodically insert review cards from completed steps
