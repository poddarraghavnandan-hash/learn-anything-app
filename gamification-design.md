# Gamification as Teaching Strategy — Design Document

## Philosophy

Gamification here is not cosmetic. It is not "add points to make learning feel fun." It is a **teaching strategy** — game mechanics that actively drive comprehension, retention, and motivation. Every game element must serve a pedagogical purpose.

The core insight: games are powerful learning environments because they provide **immediate feedback**, **progressive challenge**, **visible growth**, and **intrinsic motivation through mastery**. We apply these same principles directly into the learning journey.

---

## 1. Journey XP System — Visible Progress Within Each Journey

**What:** Each stage in a learning journey awards XP, visible in real-time in the journey header. The learner sees their XP accumulate as they progress through stages.

**Why it teaches:** Visible progress creates a sense of momentum. The learner feels they are "building" something as they move through stages, which reduces drop-off and encourages completion.

| Stage Type | Base XP | Purpose |
|---|---|---|
| Hook | 5 | Reward for starting — low barrier |
| Foundation | 10 | Reward for building context |
| Explanation | 15 | Core learning — highest passive XP |
| Real World | 10 | Connecting to reality |
| Check (correct) | 25 | Active recall — highest reward |
| Check (incorrect) | 10 | Still rewarded for trying |
| Video | 15 | Deeper engagement |
| Next Steps | 5 | Reward for planning ahead |

**UI:** Animated XP counter in the journey header. Each stage completion triggers a "+XP" burst animation that floats up and merges into the counter.

---

## 2. Streak Multiplier — Momentum Rewards

**What:** Consecutive correct check answers across journeys build a streak multiplier: 1x → 1.5x → 2x → 3x. The multiplier applies to all XP earned in the current journey.

**Why it teaches:** Streaks encourage consistency and careful thinking. The learner is motivated to truly understand (not guess) because getting it wrong resets the multiplier.

**UI:** Small multiplier badge next to the XP counter (e.g., "×1.5"). Pulses when it increases. Subtle shake when it resets.

---

## 3. Challenge Mode — Timed Check Stages

**What:** Check stages optionally include a countdown timer. Answering correctly within the time limit awards bonus XP. The timer is generous (30 seconds) — it's about engagement, not pressure.

**Why it teaches:** Time pressure activates retrieval practice more intensely. It also makes the check feel like a game moment, not a test. The bonus is small enough that missing it doesn't feel punishing.

**UI:** Circular countdown ring around the check card. Bonus XP badge appears if answered in time. No penalty for running out — just no bonus.

---

## 4. Journey Mastery Score — End-of-Journey Summary

**What:** When a journey is completed, show an animated summary card with:
- Total XP earned (with breakdown per stage)
- Mastery score (0-100%) based on: check accuracy (60%), stage completion (30%), video watched (10%)
- Concepts mastered (listed with confidence indicators)
- Streak status
- "Perfect Journey" indicator if all stages completed + check correct

**Why it teaches:** The summary reinforces what was learned. Seeing concepts listed with confidence levels helps metacognition — the learner reflects on what they actually understood.

**UI:** Full-screen animated card with confetti for high scores. Mastery ring fills up. Concepts appear one by one. Share button for social motivation.

---

## 5. Concept Constellation — Knowledge Graph

**What:** On the Progress tab, show a visual constellation/skill tree of all concepts the learner has encountered across journeys. Connected concepts have visible links. Brightness indicates confidence level.

**Why it teaches:** This is metacognition made visual. The learner can see their knowledge growing, identify gaps (dim nodes), and discover connections between topics they didn't expect.

**UI:** Interactive node graph. Tapping a concept shows related journeys and confidence level. Dim/bright nodes for low/high confidence. Lines between related concepts.

---

## 6. Daily Challenge — Curated Learning Journey

**What:** One special journey per day, marked with a golden border. Completing it awards 2x XP. The topic is chosen based on the learner's interests and gaps.

**Why it teaches:** Daily challenges create a habit loop. The curated topic fills knowledge gaps the learner might not seek on their own, broadening their understanding.

**UI:** Golden card on the welcome screen. "Daily Challenge" badge. Timer showing hours remaining.

---

## 7. Perfect Journey Badge

**What:** A special achievement for completing a journey with 100% — all stages viewed, check answered correctly on first try, video watched.

**Why it teaches:** It sets a quality bar. The learner knows that rushing through or guessing won't earn the badge. It encourages genuine engagement with each stage.

---

## Implementation Priority

For this iteration, we implement:
1. **Journey XP system** with animated counter (highest impact, most visible)
2. **Stage completion XP bursts** with haptic feedback
3. **Streak multiplier** for consecutive correct checks
4. **Challenge timer** on check stages
5. **Journey completion summary** with mastery score
6. **Perfect Journey badge**

Deferred to next iteration:
- Concept constellation (complex UI, needs multiple journeys of data)
- Daily challenge (needs curation logic)
- Social sharing

---

## Data Model Changes

### JourneyStage additions
```typescript
// No changes needed — XP is calculated client-side based on stage type and performance
```

### LearningJourney additions
```typescript
interface LearningJourney {
  // ... existing fields ...
  xpEarned: number;          // Total XP earned in this journey
  masteryScore: number;       // 0-100 mastery percentage
  perfectJourney: boolean;    // All stages + correct check
  checkTimeMs?: number;       // Time taken to answer check (for challenge mode)
}
```

### Profile additions
```typescript
interface UserProfile {
  // ... existing fields ...
  checkStreak: number;        // Consecutive correct check answers
  bestCheckStreak: number;    // All-time best streak
  perfectJourneys: number;    // Count of perfect journeys
  totalJourneysCompleted: number;
}
```
