# Personal Tutor Intelligence — Signal Design

## Core Principle
A great tutor never gives a test. They read the room. They notice when you lean forward (engaged) or look away (lost). They adjust in real-time. Our system must do the same — gather intelligence through natural interaction, never through explicit assessment.

## Signal Taxonomy

### 1. Implicit Signals (Observed, Never Asked)
These are gathered silently from user behavior:

| Signal | What It Reveals | How We Use It |
|--------|----------------|---------------|
| Time on content card | Engagement level | Longer = interested, quick skip = not relevant |
| "Explain simpler" taps | Comprehension gap | Lower the difficulty for this concept |
| Re-asking similar questions | Struggling with concept | Offer different angle, more foundational content |
| Topic jumps mid-conversation | Curiosity pattern or boredom | Follow their interest, don't force a path |
| Content completion rate | Attention span for format | Prefer shorter/longer content accordingly |
| Time between sessions | Learning rhythm | Morning learner? Evening? Weekend warrior? |
| Which content cards they tap | Format preference | Video person? Article person? |
| Speed of quiz answers | Confidence level | Fast + correct = confident, slow + correct = uncertain |
| "Mind blown" reactions | Genuine engagement | More content like this |
| Conversation length | Session depth preference | Short bursts vs deep dives |

### 2. Conversational Nudges (Natural, Not Test-Like)
These are woven into the AI's natural responses — they feel like a tutor checking in, not a quiz:

| Nudge Type | Example | What It Reveals |
|------------|---------|----------------|
| Connection check | "Does that remind you of anything you've seen before?" | Prior knowledge |
| Comprehension pulse | "How does that sit with you?" | Understanding level |
| Interest probe | "What part of that surprises you most?" | Engagement direction |
| Pace check | "Want to go deeper on this, or shall we move on?" | Learning pace |
| Application prompt | "Can you think of where you'd see this in real life?" | Transfer ability |
| Confidence gauge | "On a gut level, does that feel right to you?" | Self-assessment |
| Direction check | "Where do you want to go from here?" | Autonomy/interest |
| Analogy test | "If you had to explain this to a friend, how would you?" | Deep understanding |

### 3. Conversational Memory (Feels Personal)
The AI remembers and references past interactions:

- "Last time we talked about gravity — this connects to that..."
- "You mentioned you're interested in space — here's how this relates..."
- "Remember when you asked about why the sky is blue? This is the same principle..."
- "You seem to really enjoy the visual explanations — here's a great one..."

## Learner Model (Evolves Silently)

The system maintains a hidden learner model that updates with every interaction:

```
LearnerModel {
  // Pace & Style
  preferredPace: "quick" | "moderate" | "deep"     // from session lengths, content completion
  preferredTone: "casual" | "balanced" | "formal"   // from their language style
  preferredDepth: "overview" | "detailed" | "expert" // from follow-up patterns
  
  // Comprehension Map
  conceptConfidence: Map<concept, 0-1>               // from nudge responses + implicit signals
  confusionPoints: string[]                           // concepts they've struggled with
  strengthAreas: string[]                             // concepts they grasp quickly
  
  // Engagement Pattern
  peakHours: number[]                                 // when they're most active
  avgSessionMinutes: number                           // typical session length
  contentFormatWeights: { video, article, interactive } // what they engage with most
  
  // Personal Context
  pastTopics: string[]                                // what they've explored
  interests: string[]                                 // what excites them (from reactions)
  realWorldConnections: string[]                      // analogies that worked for them
}
```

## How Signals Shape Content

1. **During conversation**: AI adjusts tone, depth, and pacing in real-time based on the last few messages
2. **Between sessions**: Feed content is re-ranked based on accumulated model
3. **Across topics**: System connects new topics to ones the learner already understands
4. **Over time**: The app learns whether you're a "why" person (wants theory) or a "how" person (wants application)

## Anti-Patterns to Avoid
- NEVER say "Let me test you on this"
- NEVER present a formal quiz unprompted
- NEVER make the learner feel evaluated
- NEVER use language like "correct" or "incorrect" — use "exactly!" or "not quite, but close"
- NEVER ask more than one check-in question in a row
- NEVER make the signal-gathering visible to the user
