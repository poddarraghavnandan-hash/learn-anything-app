# Card Queue Learning Flow — Design Spec

## Core Concept

Replace the current chat-based stage navigation with a **card queue** system. Each learning step is a self-contained card that the user swipes/taps through. The flow feels like flipping through a deck of beautifully designed cards — not scrolling a chat thread.

## Card Types

| Card Type | Visual | Content |
|-----------|--------|---------|
| **Info Card** | Full-width card with emoji header, rich text, key takeaway box | Hook, Foundation, Explanation, Real World stages |
| **Video Card** | Large thumbnail with play overlay, context text below | Video stage — opens in-app browser |
| **Challenge Card** | Question text + tappable option pills, timer bar at top | Check stage — multiple choice with instant feedback |
| **Next Steps Card** | Path options as tappable cards + "Complete Journey" button | Journey completion + follow-up suggestions |

## Layout Structure

```
┌─────────────────────────────┐
│  Header: emoji + topic      │
│  Progress bar (thin)        │
├─────────────────────────────┤
│                             │
│     ┌───────────────────┐   │
│     │                   │   │
│     │   CURRENT CARD    │   │
│     │   (scrollable     │   │
│     │    if content      │   │
│     │    is long)        │   │
│     │                   │   │
│     └───────────────────┘   │
│                             │
├─────────────────────────────┤
│  [Continue] button          │
│  (or "Answer to continue")  │
└─────────────────────────────┘
```

## Navigation

- **Continue button** at the bottom advances to the next card
- **Back** via a small back arrow in the header (not a full button)
- **Progress bar** shows position in the deck (thin horizontal bar, not dots)
- Cards animate with a subtle slide-left transition
- Prior knowledge stage is handled as a special intro sequence before the card deck

## Chat Sidebar

- A small **"Ask a question"** button floats at the bottom-right of each card
- Tapping it opens a **bottom sheet** (half-screen) with a chat thread
- The chat thread has full context of the current journey and current card content
- User types a question → gets an AI response in the thread
- Closing the sheet returns to the card
- Chat messages persist across cards within the same journey

## Key Differences from Current Flow

1. **No more stage-by-stage scroll** — each card is its own screen-like unit
2. **Clean progress bar** instead of dots
3. **Chat is optional sidebar** not the main interface
4. **Cards feel like a deck** — finite, completable, satisfying
5. **Simpler navigation** — just "Continue" and optional "Back"
6. **Stage actions (Explain Simpler / Tell Me More)** appear as buttons within the card, not below it

## Animation

- Card entry: `FadeInRight` (300ms)
- Card exit: `FadeOutLeft` (200ms)  
- Continue button: subtle scale press feedback
- Progress bar: smooth width transition
- Chat sheet: slide up from bottom

## Color Accents Per Card Type

Keep the existing stage accent colors but apply them as a subtle top border or side stripe on the card, not as full background color. The card itself should be `surface` colored for readability.
