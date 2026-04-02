# Shiro - Comprehensive Learning Architecture

## Vision: Deep Learning, Not Surface-Level Fun Facts

Shiro is built on the principle that **real learning requires depth, structure, and mastery-based progression**. This is NOT a gamified trivia app—it's a serious educational platform that teaches genuine understanding.

---

## Core Learning Model

### 1. **Structured Curriculum Architecture**

Each topic is organized as a **Learning Path** with multiple **Units**, each containing **Lessons**:

```
Topic (e.g., "Physics")
├── Unit 1: Foundations (Prerequisites)
│   ├── Lesson 1.1: What is Physics?
│   ├── Lesson 1.2: Scientific Method
│   └── Lesson 1.3: Units and Measurements
├── Unit 2: Kinematics
│   ├── Lesson 2.1: Motion in 1D
│   ├── Lesson 2.2: Velocity and Acceleration
│   ├── Lesson 2.3: Kinematic Equations
│   └── Lesson 2.4: Applications
├── Unit 3: Dynamics
│   ├── Lesson 3.1: Forces and Newton's Laws
│   ├── Lesson 3.2: Free Body Diagrams
│   └── Lesson 3.3: Problem Solving
└── Unit 4: Energy and Momentum
    ├── Lesson 4.1: Work and Energy
    ├── Lesson 4.2: Conservation Laws
    └── Lesson 4.3: Real-World Applications
```

**Key Principles:**
- **Sequential**: Each unit builds on previous understanding
- **Prerequisite-aware**: Can't skip foundational concepts
- **Mastery-gated**: Must demonstrate understanding before advancing
- **Comprehensive**: Covers breadth and depth, not just highlights

### 2. **Lesson Structure: Multi-Layered Learning**

Each lesson follows this structure:

```
Lesson: "Newton's Second Law"
├── Learning Objectives
│   ├── Understand force, mass, and acceleration relationship
│   ├── Apply F=ma to real-world problems
│   └── Distinguish between mass and weight
├── Prerequisites Check (Quick diagnostic)
├── Core Content (Explanation + Examples)
│   ├── Conceptual explanation with analogies
│   ├── Mathematical formulation
│   ├── Worked examples (step-by-step)
│   └── Common misconceptions addressed
├── Interactive Elements
│   ├── Concept checks (formative assessment)
│   ├── Guided practice problems
│   └── Real-world applications
├── Mastery Assessment
│   ├── Problem set (5-10 problems of increasing difficulty)
│   ├── Conceptual questions
│   └── Application scenarios
└── Reflection & Next Steps
    ├── Summary of key concepts
    ├── Connection to next lesson
    └── Recommended review schedule
```

### 3. **Content Depth Levels**

Each lesson includes content at multiple depth levels:

| Level | Purpose | Example |
|-------|---------|---------|
| **Intuition** | Build conceptual understanding | "Force is a push or pull that changes motion" |
| **Explanation** | Provide reasoning and mechanisms | "F=ma means acceleration is proportional to force and inversely proportional to mass" |
| **Mathematical** | Formal representation | Derivation of kinematic equations from F=ma |
| **Application** | Real-world problem solving | Calculate forces in a car crash scenario |
| **Extension** | Advanced connections | Relativistic corrections to F=ma |

Learners progress through levels based on demonstrated mastery.

### 4. **Assessment Strategy: Mastery-Based**

Instead of arbitrary point systems, assessment measures **actual understanding**:

**Formative Assessment (During Learning):**
- Concept checks: "What does this equation tell us?"
- Prediction questions: "What happens if we increase force?"
- Misconception probes: "Is weight the same as mass?"

**Summative Assessment (After Learning):**
- Problem sets with increasing difficulty
- Conceptual reasoning questions
- Application scenarios requiring synthesis
- Mastery threshold: 80%+ on diverse question types

**Mastery Levels:**
- 🔴 **Novice**: 0-40% - Needs significant review
- 🟡 **Developing**: 40-70% - Understands basics, needs practice
- 🟢 **Proficient**: 70-85% - Solid understanding, ready for applications
- 🔵 **Mastery**: 85%+ - Deep understanding, ready for advanced topics

### 5. **Spaced Repetition: SM-2 Algorithm**

Not random reviews—scientifically-optimized review scheduling:

```
First review: 1 day after learning
Second review: 3 days after first review
Third review: 7 days after second review
Fourth review: 14 days after third review
Fifth review: 30 days after fourth review
```

**Adaptive adjustments:**
- If learner struggles: Review interval shortens
- If learner masters: Review interval lengthens
- Difficulty increases: More challenging review questions

### 6. **Adaptive Learning Path**

The system adapts to each learner:

**Baseline Assessment:**
- Diagnostic quiz at topic start (identifies gaps)
- Prerequisite check (ensures readiness)
- Learning style assessment (visual, kinesthetic, etc.)

**Dynamic Adaptation:**
- Struggling learners get extra examples and simpler problems
- Advanced learners get extension problems and deeper theory
- Pacing adjusts based on mastery speed
- Content difficulty increases with demonstrated understanding

**Personalized Review:**
- Weak concepts reviewed more frequently
- Strong concepts reviewed less often
- Review questions become progressively harder

---

## Content Specifications

### Example: Physics - Newton's Second Law

**Learning Objectives:**
1. Define force, mass, and acceleration
2. State and explain Newton's Second Law (F=ma)
3. Apply F=ma to solve real-world problems
4. Distinguish between mass and weight
5. Draw and interpret free body diagrams

**Core Content (800-1200 words):**

**Intuition:**
"Imagine pushing a shopping cart. The harder you push (more force), the faster it accelerates. But if the cart is heavier (more mass), it accelerates less for the same push. Newton's Second Law quantifies this relationship: F=ma."

**Explanation:**
"Force is any interaction that changes an object's motion. Mass is the amount of matter in an object. Acceleration is the rate of change of velocity. Newton's Second Law states that the net force on an object equals its mass times its acceleration. This is the foundation of classical mechanics."

**Mathematical Derivation:**
[Step-by-step derivation from first principles]

**Worked Examples:**
1. Simple: "A 2 kg object experiences a 10 N force. What is its acceleration?"
2. Intermediate: "Two forces act on a 5 kg object: 20 N right, 5 N left. Find acceleration."
3. Complex: "A car (1000 kg) accelerates from 0 to 100 km/h in 8 seconds. What is the net force?"

**Common Misconceptions:**
- ❌ "Heavier objects fall faster" → ✅ All objects fall at same rate in vacuum
- ❌ "Force is needed to maintain motion" → ✅ Force is needed to change motion
- ❌ "Weight and mass are the same" → ✅ Weight is force due to gravity

**Interactive Elements:**
- Concept check: "If force doubles, acceleration..." [Choose: doubles/halves/stays same]
- Prediction: "What happens to acceleration if mass doubles?"
- Simulation: Adjust force and mass, see acceleration change in real-time

**Assessment Questions:**

*Conceptual (Difficulty 1):*
- What does Newton's Second Law tell us about the relationship between force and acceleration?

*Calculation (Difficulty 2):*
- A 3 kg object accelerates at 4 m/s². What force acts on it?

*Application (Difficulty 3):*
- A truck (3000 kg) and a car (1000 kg) experience the same engine force. Which accelerates faster? Why?

*Synthesis (Difficulty 4):*
- Explain why astronauts feel weightless in orbit, even though Earth's gravity still acts on them.

---

## Implementation Strategy

### Phase 1: Content Creation
- Create 5 comprehensive topics with 4-5 units each
- Each unit has 3-5 lessons
- Each lesson: 1000+ words, multiple examples, 10+ assessment questions
- Total: ~100 lessons covering fundamental concepts

### Phase 2: Learning Engine
- Implement SM-2 spaced repetition algorithm
- Build adaptive difficulty system
- Create prerequisite tracking
- Implement mastery-based progression

### Phase 3: User Interface
- Lesson view: Clean, distraction-free reading
- Interactive elements: Embedded simulations, concept checks
- Assessment: Progressive difficulty, immediate feedback
- Progress tracking: Mastery levels, review schedule, learning analytics

### Phase 4: Personalization
- Baseline assessment on topic entry
- Adaptive content selection based on performance
- Personalized review schedule
- Learning style adaptation (visual, text, kinesthetic)

---

## Success Metrics

✅ **Learner Outcomes:**
- Learners can explain concepts in their own words
- Learners can apply concepts to novel problems
- Learners retain knowledge long-term (measured by spaced repetition)
- Learners progress through mastery levels

✅ **Engagement:**
- Learners complete lessons (not just start them)
- Learners return for spaced repetition reviews
- Learners tackle difficult problems without giving up
- Learners provide positive feedback on content depth

✅ **Educational Quality:**
- Content accuracy verified by subject matter experts
- Assessment questions measure real understanding
- Prerequisite structure prevents knowledge gaps
- Adaptive system improves learning efficiency

---

## What This Is NOT

❌ **Not a trivia app** - No random fun facts or surface-level knowledge
❌ **Not gamified learning** - No arbitrary points, badges, or leaderboards
❌ **Not passive consumption** - Requires active problem-solving and application
❌ **Not one-size-fits-all** - Adapts to individual learner needs
❌ **Not quick fixes** - Real learning takes time and effort

---

## What This IS

✅ **A serious educational platform** - Designed for genuine understanding
✅ **Scientifically-grounded** - Based on learning science research (spaced repetition, mastery learning, adaptive learning)
✅ **Comprehensive** - Covers topics deeply, not superficially
✅ **Personalized** - Adapts to each learner's needs and pace
✅ **Effective** - Measurable learning outcomes and long-term retention
