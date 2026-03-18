# Adaptive Difficulty Scaling — Design Document

## Core Principle

Difficulty is not a setting — it's a **computed signal** derived from how the learner actually performs. The system silently observes behavior and adjusts content in real time, so the learner always feels challenged but never overwhelmed.

## Difficulty Levels

| Level | Label | When Applied |
|-------|-------|-------------|
| 1 | **Curious Beginner** | New learners, low concept confidence, few journeys completed |
| 2 | **Building Foundations** | Some correct checks, growing concept map, moderate confidence |
| 3 | **Making Connections** | Consistent accuracy, multiple topics explored, good check streaks |
| 4 | **Deep Understanding** | High accuracy, strong concept confidence, asks follow-up questions |
| 5 | **Expert Explorer** | Very high accuracy, broad concept map, deep follow-up patterns |

## Input Signals (from LearnerModel + UserProfile)

| Signal | Source | Weight | What It Tells Us |
|--------|--------|--------|-----------------|
| `checkStreak` | UserProfile | High | Consecutive correct answers = strong comprehension |
| `totalJourneysCompleted` | UserProfile | Medium | Experience with the learning format |
| `conceptConfidence` (avg) | LearnerModel | High | How well they grasp concepts overall |
| `confusionPoints.length` | LearnerModel | Medium | Topics they struggle with (inverse signal) |
| `strengthAreas.length` | LearnerModel | Medium | Breadth of strong understanding |
| `explainSimplerCount` | LearnerModel | High (inverse) | How often they need simpler explanations |
| `questionsAsked` | LearnerModel | Low | Engagement depth |
| `totalQuizCorrect / totalQuizAttempted` | UserProfile | High | Overall quiz accuracy |
| `preferredDepth` | LearnerModel | Medium | Self-reported preference |
| `followUpDepth` | LearnerModel | Low | How deep they go in conversations |

## Difficulty Computation Algorithm

```
function computeDifficulty(profile, learnerModel):
  score = 0  (range: 0-100)

  // Check accuracy (30% weight)
  if profile.totalQuizAttempted > 0:
    quizAccuracy = profile.totalQuizCorrect / profile.totalQuizAttempted
    score += quizAccuracy * 30

  // Check streak (20% weight)
  streakScore = min(profile.checkStreak / 10, 1) * 20
  score += streakScore

  // Concept confidence average (20% weight)
  confidences = values(learnerModel.conceptConfidence)
  if confidences.length > 0:
    avgConfidence = mean(confidences)
    score += avgConfidence * 20

  // Journey experience (10% weight)
  journeyScore = min(profile.totalJourneysCompleted / 20, 1) * 10
  score += journeyScore

  // Inverse: confusion and simpler requests (10% penalty)
  confusionPenalty = min(learnerModel.confusionPoints.length / 10, 1) * 5
  simplerPenalty = min(learnerModel.explainSimplerCount / 5, 1) * 5
  score -= (confusionPenalty + simplerPenalty)

  // Self-reported depth preference (10% weight)
  depthBonus = { overview: 0, detailed: 5, expert: 10 }
  score += depthBonus[learnerModel.preferredDepth]

  // Clamp to 0-100
  score = clamp(score, 0, 100)

  // Map to difficulty level
  if score < 20: return level 1 (Curious Beginner)
  if score < 40: return level 2 (Building Foundations)
  if score < 60: return level 3 (Making Connections)
  if score < 80: return level 4 (Deep Understanding)
  return level 5 (Expert Explorer)
```

## How Difficulty Affects Content

### Stage-by-Stage Adjustments

| Stage | Level 1-2 (Beginner) | Level 3 (Intermediate) | Level 4-5 (Advanced) |
|-------|---------------------|----------------------|---------------------|
| **Hook** | Everyday surprise, relatable | Counterintuitive fact | Cutting-edge research or paradox |
| **Foundation** | Full prerequisite explanation | Brief refresher | Skip or 1-sentence reference |
| **Explanation** | Simple analogies, short sentences, ELI5 | Technical terms with definitions, moderate depth | Precise terminology, nuance, edge cases |
| **Real World** | Common everyday example | Industry/professional example | Research or frontier application |
| **Check** | Recall-based (what is X?) | Application-based (what would happen if?) | Synthesis-based (how does X relate to Y?) |
| **Video** | "explained simply" / "for beginners" | "tutorial" / "how it works" | "deep dive" / "advanced" |

### Language Adjustments

| Aspect | Level 1-2 | Level 3 | Level 4-5 |
|--------|-----------|---------|-----------|
| Vocabulary | Everyday words | Some technical terms, always defined | Full technical vocabulary |
| Sentence length | Short (8-12 words) | Medium (12-18 words) | Longer, complex (15-25 words) |
| Analogies | "It's like..." everyday objects | Domain-relevant comparisons | Cross-domain connections |
| Tone | Warm, encouraging, playful | Conversational, confident | Collegial, precise |
| Content length | Shorter (60% of base) | Standard | Longer with more detail (130% of base) |

## Frontend Changes

1. **Difficulty Badge** — Small pill in the journey header showing current level name + icon
2. **Level-up Animation** — When difficulty increases between journeys, show a brief celebration
3. **Difficulty in Completion Card** — Show the difficulty level in the journey completion summary
4. **Post-Journey Adjustment** — After each journey, recompute difficulty and update the learner model

## Backend Changes

1. **New input field** — `difficultyLevel` (1-5) sent alongside `skillLevel`
2. **Enhanced LLM prompt** — Detailed difficulty-specific instructions injected into the system prompt
3. **Adaptive video search** — Video search query modifier changes based on difficulty
4. **Check question calibration** — Explicit instructions for question complexity per level

## Post-Journey Model Updates

After each journey completes:
- If check was correct: boost concept confidence for mapped concepts by 0.15
- If check was wrong: add to confusionPoints, reduce confidence by 0.1
- If perfect journey: boost all mapped concepts by 0.25
- Recompute difficulty level for next journey
