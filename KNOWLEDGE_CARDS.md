# Shiro Knowledge Cards: The Learning Framework

## What Are Knowledge Cards?

Knowledge cards are the fundamental building blocks of learning in Shiro. Each card represents a discrete, learnable concept—a single idea that can be understood, practiced, and mastered. Knowledge cards are not flashcards; they are rich, multi-modal learning objects that contain everything needed to understand a concept deeply.

## Anatomy of a Knowledge Card

### 1. **Core Concept**

The heart of every knowledge card is a single, clearly-defined concept. Examples:

- "Newton's First Law of Motion"
- "The Concept of Recursion in Programming"
- "Renaissance Perspective in Painting"
- "Gradient Descent in Machine Learning"

The core concept should be specific enough to be learnable in 5-15 minutes, but broad enough to be meaningful.

### 2. **Prerequisite Knowledge**

Every concept builds on prior knowledge. The knowledge card explicitly lists its prerequisites—the concepts that must be understood before this one makes sense. This creates a **dependency graph** that guides the learner's journey.

Example prerequisites for "Newton's First Law":
- Understanding of force
- Understanding of motion
- Understanding of mass

### 3. **Intuitive Explanation**

Before diving into technical details, the knowledge card provides an **intuitive explanation**—a clear, simple description of what the concept is and why it matters. This explanation uses everyday language and avoids jargon.

Example: "Newton's First Law says that objects don't change their motion unless something pushes or pulls on them. A ball rolling on a table keeps rolling until friction slows it down. A stationary ball stays put until you kick it."

### 4. **Technical Definition**

After building intuition, the card provides a precise, technical definition. This is where rigor matters.

Example: "An object at rest remains at rest, and an object in motion remains in motion at constant velocity, unless acted upon by an external force."

### 5. **Real-World Examples**

Abstract concepts become concrete through examples. Each knowledge card includes 2-3 real-world applications that show why the concept matters.

Examples for Newton's First Law:
- **Seatbelts in Cars** — Without seatbelts, passengers continue moving forward when a car stops suddenly
- **Sliding on Ice** — On frictionless ice, you continue moving in the same direction even though you're trying to change direction
- **Space Missions** — Spacecraft continue moving at constant velocity through space with no fuel because there's no friction

### 6. **Visual Representation**

Concepts are easier to understand when visualized. Each knowledge card includes diagrams, animations, or interactive visualizations that show the concept in action.

### 7. **Common Misconceptions**

Learners often arrive with incorrect mental models. The knowledge card explicitly addresses common misconceptions and explains why they're wrong.

Example misconception: "An object needs a constant force to maintain constant motion."
Correction: "Once an object is moving at constant velocity, no force is needed to maintain that motion. A force is only needed to *change* the velocity."

### 8. **Practice Problems**

Understanding is demonstrated through practice. Each knowledge card includes 3-5 practice problems that require applying the concept. Problems progress from simple application to more complex reasoning.

### 9. **Connections to Other Concepts**

Knowledge is not isolated; concepts connect to each other. The knowledge card explicitly shows how this concept relates to other concepts in the learning path and beyond.

Example connections for Newton's First Law:
- Connects to: Newton's Second Law (F=ma)
- Connects to: Newton's Third Law (action-reaction pairs)
- Connects to: Friction (a force that opposes motion)
- Connects to: Momentum (mass × velocity)

### 10. **Depth Levels**

Not all learners need the same depth. Each knowledge card includes multiple depth levels:

- **Level 1: Intuitive** — Basic understanding, suitable for general knowledge
- **Level 2: Applied** — Enough to apply the concept to practical problems
- **Level 3: Deep** — Rigorous understanding, suitable for specialists
- **Level 4: Research** — Cutting-edge understanding, including recent research

The learner's baseline evaluation and learning profile determine which depth levels are presented.

## Knowledge Card Taxonomy

### By Subject Domain

Shiro organizes knowledge cards into subject domains:

- **Physics** — Mechanics, thermodynamics, electromagnetism, quantum mechanics
- **Computer Science** — Algorithms, data structures, programming paradigms, AI/ML
- **Mathematics** — Algebra, calculus, linear algebra, discrete math
- **History** — Ancient history, medieval history, modern history, contemporary history
- **Art** — Visual arts, music, literature, performing arts
- **Biology** — Cell biology, genetics, ecology, evolution
- **Economics** — Microeconomics, macroeconomics, behavioral economics

### By Cognitive Level

Knowledge cards are also classified by the cognitive level required to understand them:

- **Foundational** — Basic concepts that form the foundation of a domain
- **Intermediate** — Concepts that build on foundational knowledge
- **Advanced** — Concepts that require deep understanding of multiple intermediate concepts
- **Specialist** — Concepts at the frontier of a field, requiring research-level understanding

### By Learning Difficulty

Each knowledge card has an estimated learning difficulty:

- **Easy** — Can be learned in 5-10 minutes by most learners
- **Medium** — Requires 15-30 minutes and some prior knowledge
- **Hard** — Requires 30-60 minutes and significant prior knowledge
- **Very Hard** — Requires 60+ minutes and deep prior knowledge

## Building a Learning Path from Knowledge Cards

A **learning path** is a carefully sequenced collection of knowledge cards designed to build mastery in a topic. The sequence matters—each card builds on the previous ones.

### Example Learning Path: "Physics Fundamentals"

1. **Motion and Forces** (Foundational, Easy)
   - What is motion?
   - What is force?
   - Newton's First Law

2. **Acceleration and Mass** (Foundational, Easy)
   - What is acceleration?
   - What is mass?
   - Newton's Second Law (F=ma)

3. **Action and Reaction** (Foundational, Medium)
   - Newton's Third Law
   - Momentum and conservation
   - Collisions

4. **Energy and Work** (Intermediate, Medium)
   - What is energy?
   - Kinetic and potential energy
   - Work and power

5. **Waves and Oscillation** (Intermediate, Hard)
   - Simple harmonic motion
   - Wave properties
   - Sound and light as waves

6. **Relativity** (Advanced, Hard)
   - Special relativity
   - Time dilation
   - E=mc²

7. **Quantum Mechanics** (Advanced, Very Hard)
   - Wave-particle duality
   - Uncertainty principle
   - Quantum superposition

## The Knowledge Graph

All knowledge cards in Shiro form a **knowledge graph**—a network where nodes are concepts and edges are prerequisite relationships. This graph enables:

1. **Intelligent Path Planning** — The system can recommend learning paths that respect prerequisite relationships
2. **Gap Identification** — If a learner struggles with a concept, the system can identify missing prerequisites
3. **Personalized Recommendations** — The system can recommend next topics based on what the learner has mastered
4. **Transfer Learning** — The system can identify concepts from other domains that might help with current learning

## Knowledge Card Metadata

Each knowledge card includes rich metadata that enables personalization:

| Metadata | Purpose | Example |
|----------|---------|---------|
| **Concept ID** | Unique identifier | `physics_mechanics_newtons_first_law` |
| **Domain** | Subject area | `physics` |
| **Subdomain** | Specific area within domain | `mechanics` |
| **Cognitive Level** | Bloom's taxonomy level | `understand` |
| **Learning Difficulty** | Estimated difficulty | `medium` |
| **Estimated Time** | Time to master | `20 minutes` |
| **Prerequisites** | Required prior knowledge | `[force, motion, mass]` |
| **Learning Approaches** | Optimal pedagogical methods | `[socratic, case_study, experiential]` |
| **Misconceptions** | Common wrong beliefs | `[needs_constant_force, ...]` |
| **Connections** | Related concepts | `[newtons_second_law, momentum, ...]` |
| **Depth Levels** | Available depth options | `[intuitive, applied, deep, research]` |

## Creating New Knowledge Cards

To create a new knowledge card, follow this template:

```markdown
# [Concept Name]

## Intuitive Explanation
[Simple, everyday explanation]

## Technical Definition
[Precise, rigorous definition]

## Why It Matters
[Why this concept is important]

## Real-World Examples
- [Example 1]
- [Example 2]
- [Example 3]

## Visual Representation
[Diagram or animation description]

## Common Misconceptions
- Misconception 1: [Wrong idea] → Correction: [Right idea]
- Misconception 2: [Wrong idea] → Correction: [Right idea]

## Practice Problems
1. [Easy problem]
2. [Medium problem]
3. [Hard problem]

## Connections
- Prerequisite: [Concept X]
- Related: [Concept Y]
- Leads to: [Concept Z]

## Depth Levels
- **Level 1 (Intuitive):** [Basic explanation]
- **Level 2 (Applied):** [Application-focused explanation]
- **Level 3 (Deep):** [Rigorous explanation]
- **Level 4 (Research):** [Cutting-edge explanation]
```

## Knowledge Card Quality Standards

Every knowledge card in Shiro must meet these quality standards:

1. **Clarity** — The concept is explained clearly without unnecessary jargon
2. **Accuracy** — The content is factually correct and up-to-date
3. **Completeness** — All necessary components are present
4. **Relevance** — Examples and applications are relevant to learners
5. **Engagement** — The content is engaging and maintains learner interest
6. **Accessibility** — The content is accessible to learners of different backgrounds
7. **Depth** — Multiple depth levels are available for different learner needs

---

**Knowledge cards are the foundation of Shiro's learning experience. Each card is crafted to enable deep understanding, practical application, and long-term mastery.**
