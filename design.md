# Learn Anything — Mobile App Interface Design

## Design Philosophy

This app merges **TikTok-style engagement mechanics** with **evidence-based learning science** to create an addictive yet genuinely educational experience. The core insight: TikTok's infinite scroll creates flow state through variable-ratio reinforcement and micro-content — we repurpose this for learning by inserting active recall checkpoints, spaced repetition reviews, and interleaved topics into a vertical swipe feed.

**Key Principles:**
- Ebbinghaus Forgetting Curve: Review content at optimal intervals (1d → 3d → 7d → 14d → 30d)
- Bjork's Desirable Difficulties: Spacing, interleaving, retrieval practice, generation effect
- Csikszentmihalyi's Flow State: Balance challenge/skill, clear goals, immediate feedback
- Vygotsky's ZPD: Content just beyond current knowledge level
- Duolingo's Habit Loop: Streaks, XP, loss aversion, social proof

---

## Brand Identity
- **App Name:** Learn Anything
- **Tagline:** "Swipe. Learn. Remember."
- **Color Palette:**

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| primary | `#6C63FF` | `#8B83FF` | Indigo-Violet — curiosity, intelligence |
| background | `#F8F9FF` | `#0A0A14` | Near-white / deep navy |
| surface | `#FFFFFF` | `#16162A` | Cards, elevated surfaces |
| foreground | `#1A1A2E` | `#E8E8F0` | Primary text |
| muted | `#6B7280` | `#9CA3AF` | Secondary text |
| border | `#E5E7EB` | `#2D2D44` | Dividers |
| success | `#10B981` | `#34D399` | Correct answers, streaks |
| warning | `#F59E0B` | `#FBBF24` | Streak at risk |
| error | `#EF4444` | `#F87171` | Wrong answers |
| accent | `#FF6584` | `#FF6584` | XP, rewards, highlights |
| streak | `#FF9500` | `#FFB340` | Streak flame |

---

## Screen List

| # | Screen | Route | Description |
|---|--------|-------|-------------|
| 1 | Onboarding | `/onboarding` | 3-step: interests → goal → style |
| 2 | Swipe Feed | `/(tabs)/index` | TikTok-style vertical swipe learning feed |
| 3 | Discover | `/(tabs)/discover` | Browse topics, trending, search |
| 4 | Progress | `/(tabs)/progress` | Streaks, stats, memory strength, achievements |
| 5 | Profile | `/(tabs)/profile` | Settings, interests, preferences |
| 6 | Content Detail | `/content/[id]` | Full video/article with notes |
| 7 | Quiz Card | (inline in feed) | Active recall checkpoint between content |
| 8 | Review Session | `/review` | Spaced repetition review deck |
| 9 | Topic Detail | `/topic/[slug]` | Deep dive into a specific topic |

---

## The Swipe Feed — Core Innovation

The main screen is a **full-screen vertical swipe feed** (like TikTok) but for learning. Each "card" fills the entire screen and is one of these types:

### Card Types in the Feed

| Card Type | Frequency | Purpose (Learning Science) |
|-----------|-----------|---------------------------|
| **Video Card** | 40% | YouTube micro-content (3-10 min), primary learning |
| **Article Card** | 20% | Web article summary + link, reading comprehension |
| **Quiz Card** | 20% | Active recall — test what was just learned |
| **Review Card** | 10% | Spaced repetition — revisit past content at optimal interval |
| **Insight Card** | 10% | AI-generated "Did you know?" connecting topics (interleaving) |

### Feed Algorithm (Engagement + Learning Science)

The feed ordering combines TikTok-style engagement signals with learning science:

1. **Variable Ratio Schedule** — Mix content quality/difficulty unpredictably (not all bangers, not all reviews)
2. **Interleaving** — Never show 3+ cards from the same topic in a row; mix subjects
3. **Spaced Insertion** — Review cards appear at SM-2 calculated intervals based on user's forgetting curve
4. **Active Recall Gates** — After every 3-4 content cards, insert a quiz card testing recent content
5. **ZPD Calibration** — Track quiz accuracy; if >85%, increase difficulty; if <60%, decrease
6. **Time-of-Day Optimization** — Show harder content during user's peak hours, lighter content at other times
7. **Completion Momentum** — Start sessions with an easy win (high-confidence review) to build momentum

### Swipe Interactions

| Gesture | Action |
|---------|--------|
| Swipe Up | Next card |
| Swipe Down | Previous card |
| Tap | Pause/play video, expand article |
| Long Press | Save to collection |
| Double Tap | Mark as "Got it" (affects spaced repetition) |
| Swipe Right | Open full content detail |

---

## Screen Details

### 1. Onboarding (3 Steps)

**Step 1 — "What fascinates you?"**
Grid of topic chips with emojis. User selects 3-10 interests. Chips animate on selection with haptic feedback. Topics organized by category (Science, Tech, Arts, Business, Health, etc.).

**Step 2 — "How much time per day?"**
Visual time selector: 5 / 10 / 15 / 20 / 30 minutes. Shows "That's about X cards per day" preview. Streak calendar preview shows what consistency looks like.

**Step 3 — "How do you learn best?"**
Three cards: Videos (play icon), Articles (book icon), Mix of Both (shuffle icon). Brief explanation of each. This sets the initial content type ratio in the feed.

### 2. Swipe Feed (Home Tab)

**Header (minimal, overlaid):**
- Top-left: Streak flame + day count
- Top-right: XP count + daily goal ring (circular progress)
- These fade to 30% opacity after 2 seconds of inactivity (TikTok-style immersion)

**Content Area (full screen):**
- Each card fills the viewport
- Video cards: YouTube player with custom overlay controls
- Article cards: Title + hero image + 3-line summary + "Read More" CTA
- Quiz cards: Question + 4 multiple choice options with immediate feedback
- Review cards: "Remember this?" + content thumbnail + confidence rating (1-5)
- Insight cards: AI-generated connection between two topics the user has studied

**Bottom Overlay:**
- Topic pill badge
- Content source (YouTube channel / website)
- Duration / read time
- Save button (bookmark icon)

### 3. Discover Tab

**Search bar** with voice input icon. Below: trending topics as horizontal scroll chips. Category grid (2-column, large cards with gradient overlays and emojis). "New This Week" section. "Popular with learners like you" section (collaborative filtering).

### 4. Progress Tab — "Your Brain"

**Streak Section:**
- Large streak flame with day count (animated on milestone days)
- Weekly heatmap (7 boxes, filled = active day)
- "Longest streak: X days" subtitle

**Daily Goal:**
- Circular progress ring showing minutes learned today vs goal
- XP earned today

**Memory Strength:**
- Visual representation of the forgetting curve for each topic
- Topics sorted by "needs review" urgency
- Tap topic → shows individual content items and their memory strength

**Stats Grid:**
- Total learning time
- Videos watched / Articles read
- Quiz accuracy rate
- Topics explored
- Current level

**Achievements:**
- Badge grid: 7-day streak, 30-day streak, 100 quizzes, 10 topics, etc.
- Locked badges shown as silhouettes (motivation)

### 5. Profile Tab

- Avatar + display name
- Edit interests (topic chips)
- Daily goal adjustment
- Content preference (Videos / Articles / Mixed)
- Learning reminder time
- Theme toggle (Light / Dark / System)
- Review notification settings
- About / Version

---

## Key User Flows

### Flow 1: First Launch
Splash → Onboarding (3 steps) → Home Feed (first card is a welcome video explaining how the app works)

### Flow 2: Daily Learning Session
Open app → See streak reminder → Swipe through feed → Watch video → Answer quiz → See "Correct!" animation → Continue swiping → Goal ring fills → "Daily goal reached!" celebration → Optional: keep going

### Flow 3: Spaced Repetition Review
Notification: "3 items need review" → Open app → Review cards appear in feed → Rate confidence → Memory strength updates → Streak maintained

### Flow 4: Knowledge Check (Active Recall)
Watch Python video → Swipe up → Quiz card: "What does `len()` return?" → Tap answer → Immediate feedback (green/red) → Explanation shown → Swipe to next content

### Flow 5: Discovery
Discover tab → Tap "Astrophysics" → Topic detail with curated content → Tap video → Full player → Related content → Add topic to interests

---

## Tab Bar

| Tab | Icon | Label |
|-----|------|-------|
| Feed | `play.circle.fill` | Feed |
| Discover | `safari.fill` | Discover |
| Progress | `brain.head.profile` | Progress |
| Profile | `person.fill` | Profile |

---

## Gamification System

### XP (Experience Points)
| Action | XP |
|--------|----|
| Watch video (complete) | +15 XP |
| Read article (complete) | +10 XP |
| Quiz correct | +20 XP |
| Quiz incorrect | +5 XP (participation) |
| Review card rated | +10 XP |
| Daily goal reached | +50 XP bonus |
| Streak day | +10 XP × streak_length (capped at 100) |

### Streak Mechanics (Duolingo-inspired)
- Daily streak increments when user completes at least 1 learning action
- Streak freeze: earned every 7 days (max 2 stored)
- Streak repair: available for 24 hours after breaking
- Milestone celebrations: 7, 14, 30, 60, 100, 365 days
- Streak at risk notification at user's preferred time

### Levels
- Level = floor(total_xp / 500) + 1
- Level names: Curious → Explorer → Scholar → Expert → Master → Sage

---

## Spaced Repetition Algorithm (Modified SM-2)

For each content item the user has engaged with:
- **Ease Factor (EF):** starts at 2.5, adjusted by quiz performance
- **Interval:** days until next review
- **Repetition:** number of successful reviews

After each review (confidence rating 1-5):
- If rating >= 3: interval = previous_interval × EF; repetition++
- If rating < 3: interval = 1; repetition = 0 (reset)
- EF = max(1.3, EF + (0.1 - (5 - rating) × (0.08 + (5 - rating) × 0.02)))

Review cards appear in the feed when: current_date >= last_review_date + interval

---

## Adaptive Feed Algorithm

The feed is generated server-side using the LLM + scoring algorithm:

**Content Score = Relevance × Freshness × Engagement × Learning_Need**

Where:
- **Relevance** = topic_interest_score × content_quality_score
- **Freshness** = decay(days_since_published)
- **Engagement** = normalized(views + likes) from source
- **Learning_Need** = 1 + forgetting_curve_urgency + topic_diversity_bonus

**Interleaving Rule:** For every 5 cards, at most 2 can share the same topic.

**Active Recall Insertion:** After every 3-4 content cards, insert a quiz card. Quiz questions are generated by the LLM based on the content just consumed.

**Time-of-Day Adaptation:** Track user's hourly engagement patterns. During peak hours, serve challenging new content. During off-peak, serve lighter reviews and familiar topics.
