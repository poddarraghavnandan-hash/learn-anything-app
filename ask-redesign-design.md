# Ask Flow Redesign — Guided Learning Journey

## The Problem

The current Ask flow is a traditional chat interface: user types a question, AI dumps a text response, then a video card appears. This feels like talking to a chatbot, not learning. There's no strategy, no progression, no sense of building understanding. The video feels tacked on rather than earned.

## The Vision

When a user asks "Why is the sky blue?", they shouldn't get a text wall and a video link. They should experience a **learning journey** — a carefully structured sequence of stages that builds understanding from curiosity to mastery. The video becomes the **culmination**, not an interruption. By the time they reach the video, they have enough context to truly appreciate and learn from it.

Think of it like a great teacher: they don't just answer your question. They hook you, give you context, explain the core idea, connect it to your world, check that it landed, and THEN show you the deep dive.

## The Learning Journey Structure

Each question triggers a **Learning Journey** — a full-screen, card-based experience with 5-7 progressive stages:

### Stage Flow

```
[Question Input] → Journey Begins
    ↓
[1. HOOK] — "Did you know..." / surprising fact / counterintuitive question
    ↓  (tap to continue)
[2. FOUNDATION] — "First, let's understand..." / prerequisite context
    ↓  (tap to continue)  
[3. THE ANSWER] — Core explanation, broken into 2-3 digestible pieces
    ↓  (auto-advance between pieces)
[4. SEE IT] — Real-world example / analogy / "imagine this..."
    ↓  (tap to continue)
[5. CHECK] — Quick understanding check (not a quiz — "Does this click?")
    ↓  (respond, then continue)
[6. GO DEEPER] — Video recommendation with context ("Now watch this — you'll understand why...")
    ↓  (watch or skip)
[7. WHAT'S NEXT] — 2-3 natural follow-up paths to continue learning
```

### UI Design

**Full-screen cards, not chat bubbles.** Each stage is a card that takes up most of the screen. The user taps/swipes to progress. A subtle progress indicator (dots) shows where they are in the journey.

**Card anatomy:**
- Stage icon/emoji at top
- Stage label (small, muted: "The Hook", "Foundation", "The Answer", etc.)
- Main content area (text, with markdown formatting)
- Action area at bottom (Continue button, or interactive element)

**Transitions:** Cards fade in from bottom with a gentle slide. Previous cards slide out to the left. Feels like turning pages in a beautifully designed book.

**Colors per stage:**
- Hook: warm amber/gold accent
- Foundation: cool blue accent  
- The Answer: primary color (indigo)
- See It: green accent
- Check: purple accent
- Go Deeper: red/video accent
- What's Next: primary color

### Key Design Principles

1. **One thing at a time.** Never show two concepts simultaneously.
2. **Earned progression.** Each stage builds on the previous one. The video is earned, not dumped.
3. **Active, not passive.** The Check stage ensures the user is engaged, not just scrolling.
4. **Context before content.** By the time they see the video, they know WHY it matters.
5. **Natural branching.** "What's Next" creates new journeys, not appended messages.

### Interaction Model

- **Tap to advance:** Primary interaction is tapping "Continue" or the card itself
- **Swipe back:** Can revisit previous stages by swiping right
- **Check stage:** Tappable options ("Yes, that clicks" / "Not quite" / "Tell me more")
  - "Not quite" → inserts a simpler re-explanation card before continuing
  - "Tell me more" → inserts a deeper dive card
- **Video stage:** "Watch Now" opens in-app player, "Skip for now" continues to What's Next
- **What's Next:** Tapping a follow-up question starts a NEW journey (not appended to current)

### Backend Changes

New endpoint: `chat.learn` — replaces `chat.ask`

**Input:** Same as current (question, skillLevel, learnerModel, pastConversations)

**Output:** Structured stages array:
```json
{
  "stages": [
    {
      "type": "hook",
      "emoji": "🤯",
      "title": "Did you know?",
      "content": "The sky isn't actually blue...",
      "accentColor": "amber"
    },
    {
      "type": "foundation", 
      "emoji": "🧱",
      "title": "First, let's understand light",
      "content": "Light isn't just one thing...",
      "accentColor": "blue"
    },
    {
      "type": "explanation",
      "emoji": "💡",
      "title": "Here's why the sky is blue",
      "content": "When sunlight hits...",
      "keyTakeaway": "Blue light scatters more because...",
      "accentColor": "primary"
    },
    {
      "type": "real_world",
      "emoji": "🌅",
      "title": "See it in action",
      "content": "Next time you see a sunset...",
      "accentColor": "green"
    },
    {
      "type": "check",
      "emoji": "🤔",
      "question": "So if blue light scatters the most, why isn't the sky violet?",
      "options": ["Violet scatters even more, but our eyes are less sensitive to it", "Violet light is absorbed by the atmosphere", "The sun doesn't emit violet light"],
      "correctIndex": 0,
      "explanation": "Great thinking! Our eyes are actually more sensitive to blue...",
      "accentColor": "purple"
    },
    {
      "type": "video",
      "emoji": "🎬",
      "title": "Now watch this — it'll all click",
      "context": "This video shows actual light scattering experiments...",
      "searchQuery": "why is the sky blue light scattering explained",
      "accentColor": "red"
    },
    {
      "type": "next_steps",
      "emoji": "🚀",
      "title": "Where to go from here",
      "paths": [
        { "question": "Why are sunsets red?", "reason": "Same physics, different angle" },
        { "question": "What makes rainbows?", "reason": "Light splitting in action" },
        { "question": "Why is space black?", "reason": "No atmosphere to scatter light" }
      ],
      "accentColor": "primary"
    }
  ],
  "mappedConcepts": ["light scattering", "Rayleigh scattering", "electromagnetic spectrum"],
  "difficulty": "beginner"
}
```

### Follow-up Handling

When user taps a "What's Next" path or types a new question:
- Current journey fades out
- New journey begins fresh (not appended)
- Previous journey saved to history
- Learner model updated with concepts from completed journey

### Journey History

- Recent journeys shown on the welcome screen (replacing "Recent Conversations")
- Each journey shows: question, emoji, number of stages completed, timestamp
- Tapping reopens the journey at the last viewed stage

### Learner Model Integration

- Hook stage: adapted based on what surprises this learner (visual vs. verbal)
- Foundation stage: skipped or shortened if learner model shows strength in prerequisites
- Explanation: depth adjusted by preferredDepth
- Check: difficulty calibrated by past quiz accuracy
- Video: search query refined by skill level
- Next steps: personalized based on past topics and confusion points
