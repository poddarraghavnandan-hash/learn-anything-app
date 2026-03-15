# Learn Anything — Project TODO

## Theme & Branding
- [x] Update theme colors (indigo-violet primary, deep navy dark mode)
- [x] Generate app logo and update app.config.ts
- [x] Update app name and branding in app.config.ts

## Database Schema & Backend
- [x] Define database schema (users, topics, contentItems)
- [x] Run database migrations
- [x] Seed topics table with 24 learning topics
- [x] Build content curation API (YouTube search via Data API)
- [x] Build quiz generation API (LLM-powered active recall questions)
- [x] Build spaced repetition engine (modified SM-2 algorithm)
- [x] Build adaptive feed algorithm (interleaving, time-of-day, scoring)
- [x] Build insight generation API (LLM cross-topic connections)
- [x] Build search API for content discovery

## Onboarding
- [x] Onboarding Step 1: Interest selection (topic chips grid with haptic feedback)
- [x] Onboarding Step 2: Daily goal time selector (5/10/15/20/30 min)
- [x] Onboarding Step 3: Learning style preference (Videos/Articles/Mixed)
- [x] Persist onboarding state to AsyncStorage
- [x] Skip onboarding if already completed (redirect to feed)

## Swipe Feed (Home Tab — Core Feature)
- [x] Vertical card feed with content cards
- [x] Video Card type (YouTube thumbnail + play overlay + duration badge)
- [x] Article Card type (summary card with thumbnail)
- [x] Quiz Card type (active recall with 4 options + immediate feedback)
- [x] Feed header with XP badge + streak counter
- [x] Card type interleaving in feed (quiz every 3 content cards)
- [x] Pull-to-refresh for new content
- [x] Auto-refresh on first load when no content exists
- [x] Micro-reactions on every card: "Mind blown" / "Knew this" / "Save" / "Skip"

## Discover Tab
- [x] Search bar with filtering
- [x] Category filter pills (All, Code, AI, Science, etc.)
- [x] 2-column topic grid with emoji + follow buttons
- [x] Topic detail screen with curated content list
- [x] Follow/unfollow topics from discover and topic detail

## Progress Tab ("Your Brain")
- [x] Level card with XP progress bar
- [x] Daily goal progress bar
- [x] Streak counter with 7-day week visualization
- [x] Stats grid (Videos, Articles, Quiz Accuracy, Minutes)
- [x] Spaced repetition review queue with memory strength bars
- [x] Longest streak record display

## Profile Tab
- [x] User profile with avatar and level display
- [x] Edit interests (link to discover)
- [x] Daily goal adjustment (5/10/15/20/30 min pills)
- [x] Content format preference toggle (Videos/Articles/Mixed)
- [x] Saved content count
- [x] Reset progress option with confirmation

## Gamification System
- [x] XP points system (earn on watch, read, quiz, review, daily goal)
- [x] Level system (Curious → Explorer → Learner → Scholar → Expert → Master → Sage)
- [x] Streak mechanics (daily streak tracking, longest streak)
- [x] XP badge and streak badge in feed header

## Adaptive Learning Engine
- [x] Modified SM-2 spaced repetition algorithm
- [x] Forgetting curve tracking (memory strength per item)
- [x] Active recall quiz insertion every 3 content cards
- [x] Time-of-day pattern detection (morning/midday/afternoon/evening/night)
- [x] Content scoring: Topic relevance × Format preference × Recency × Duration
- [x] Engagement analysis (type weights, peak hours, reaction patterns)
- [x] Feed interleaving engine (content + quiz + review + insight mixing)

## UI Polish
- [x] Animated card entry (FadeInDown)
- [x] Haptic feedback on quiz answers, saves, reactions, topic selection
- [x] Dark mode full support via theme tokens
- [x] Quiz correct/incorrect visual feedback (green/red)
- [x] Press feedback on all interactive elements

## Zero-Friction Entry
- [x] No signup required — local-first with AsyncStorage
- [x] 3-step onboarding (interests → goal → format) then straight to feed
- [x] Content auto-fetches from YouTube on first load
- [x] Offline-first: all user state persisted locally

## Constant Interaction Model
- [x] Micro-reactions on every content card (Mind blown / Knew this / Save / Skip)
- [x] Quiz cards every 3 content cards (integrated in feed)
- [x] Haptic pulse on every interaction
- [x] XP awarded for every interaction type
- [x] Engagement tracking (card type, time spent, reaction, hour of day)

## Future Enhancements
- [ ] Daily digest generation API
- [ ] Achievement badges (7-day, 30-day, 100 quizzes, etc.)
- [ ] Locked badge silhouettes for motivation
- [ ] Session-end hook: "One more?" prompt
- [ ] Quick burst mode: 60-second micro-sessions
- [ ] Learning reminder notifications
- [ ] Light/Dark/System theme toggle in profile
- [ ] Optional account creation for cloud sync
- [ ] Article content from web scraping (non-paywall sources)
- [ ] In-app video player (instead of external YouTube)
- [ ] Loading skeleton cards
- [ ] Streak freeze and repair mechanics
