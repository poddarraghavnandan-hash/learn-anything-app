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
- [x] Build Curiosity Check generation API (fun baseline assessment questions)
- [x] Build Learning Ladder generation API (LLM-powered structured curriculum)
- [x] Build step-aware content refresh API (fetch content for specific ladder step)

## Onboarding
- [x] Onboarding Step 1: Interest selection (topic chips grid with haptic feedback)
- [x] Onboarding Step 2: Daily goal time selector (5/10/15/20/30 min)
- [x] Onboarding Step 3: Learning style preference (Videos/Articles/Mixed)
- [x] Onboarding Step 4: Skill level assessment (Beginner/Intermediate/Advanced)
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
- [x] "I don't understand" button on content cards → triggers LLM simplification
- [x] Think-about prompts before quiz answers (metacognition)
- [x] "Continue Learning" section showing active learning paths at top of feed
- [x] Step-aware feed context when inside a learning path

## Discover Tab
- [x] Search bar with filtering
- [x] Category filter pills (All, Code, AI, Science, etc.)
- [x] 2-column topic grid with emoji + follow buttons
- [x] Topic detail screen with curated content list
- [x] Follow/unfollow topics from discover and topic detail
- [x] Route through Curiosity Check on first topic tap

## Progress Tab ("Your Brain")
- [x] Level card with XP progress bar
- [x] Daily goal progress bar
- [x] Streak counter with 7-day week visualization
- [x] Stats grid (Videos, Articles, Quiz Accuracy, Minutes)
- [x] Spaced repetition review queue with memory strength bars
- [x] Longest streak record display
- [x] Achievement badges display (unlocked + locked silhouettes)
- [x] Topic mastery tracking per topic

## Profile Tab
- [x] User profile with avatar and level display
- [x] Edit interests (link to discover)
- [x] Daily goal adjustment (5/10/15/20/30 min pills)
- [x] Content format preference toggle (Videos/Articles/Mixed)
- [x] Skill level selector (Beginner/Intermediate/Advanced)
- [x] Saved content count
- [x] Badges showcase
- [x] Reset progress option with confirmation

## Gamification System
- [x] XP points system (earn on watch, read, quiz, review, daily goal)
- [x] Level system (Curious → Explorer → Learner → Scholar → Expert → Master → Sage)
- [x] Streak mechanics (daily streak tracking, longest streak)
- [x] XP badge and streak badge in feed header
- [x] 14 achievement badges with unlock tracking

## Adaptive Learning Engine
- [x] Modified SM-2 spaced repetition algorithm
- [x] Forgetting curve tracking (memory strength per item)
- [x] Active recall quiz insertion every 3 content cards
- [x] Time-of-day pattern detection (morning/midday/afternoon/evening/night)
- [x] Content scoring: Topic relevance × Format preference × Recency × Duration
- [x] Engagement analysis (type weights, peak hours, reaction patterns)
- [x] Feed interleaving engine (content + quiz + review + insight mixing)
- [x] Difficulty calibration: quiz accuracy drives level promotion/demotion
- [x] Per-topic difficulty tracking (TopicDifficulty records)
- [x] Skill-level-aware YouTube search queries

## UI Polish
- [x] Animated card entry (FadeInDown)
- [x] Haptic feedback on quiz answers, saves, reactions, topic selection
- [x] Dark mode full support via theme tokens
- [x] Quiz correct/incorrect visual feedback (green/red)
- [x] Press feedback on all interactive elements

## Zero-Friction Entry
- [x] No signup required — local-first with AsyncStorage
- [x] 4-step onboarding (interests → goal → format → skill level) then straight to feed
- [x] Content auto-fetches from YouTube on first load
- [x] Offline-first: all user state persisted locally

## Constant Interaction Model
- [x] Micro-reactions on every content card (Mind blown / Knew this / Save / Skip)
- [x] Quiz cards every 3 content cards (integrated in feed)
- [x] Haptic pulse on every interaction
- [x] XP awarded for every interaction type
- [x] Engagement tracking (card type, time spent, reaction, hour of day)

## LearnLM-Inspired Pedagogy (Core Belief: Anyone Can Learn Anything)
- [x] Integrate LearnLM 5 principles into all LLM system prompts
- [x] Quiz: think-about prompts before revealing answer (metacognition)
- [x] Quiz: adaptive difficulty — calibrated by accuracy per topic
- [x] Content summaries: relevel based on skill level (ELI5 for beginners)
- [x] "I don't understand" button → LLM re-explains at simpler level with analogy
- [x] Fix all TypeScript errors (profile.tsx and test file)

## In-App Content Experience
- [x] In-app YouTube video player (WebView embed on web, WebBrowser on native)
- [x] Content detail screen with LLM-generated summaries and key points
- [x] "Explain Like I'm 5" summary section
- [x] Prerequisites and next steps suggestions
- [x] "Why It Matters" real-world relevance
- [x] "Explain Simpler" button powered by LLM
- [x] Content completion tracking (mark as watched/read)

## Achievement Badges System
- [x] 14 badge definitions (first quiz, streaks, quiz mastery, explorer, level milestones, etc.)
- [x] Badge unlock tracking in learning store
- [x] Locked badge silhouettes for motivation
- [x] Badge display on progress and profile screens

## Curiosity Check — Fun Baseline Assessment
- [x] LLM generates 5 fun "curiosity questions" per topic that feel like a game show
- [x] Questions range from easy to hard to discover actual knowledge level
- [x] Game-like UI: emoji reactions, fun facts, encouraging tone, no "wrong answer" shame
- [x] Results determine starting step on the learning ladder (skip what they already know)
- [x] Triggered on first tap of a topic (before showing learning ladder)
- [x] Stored per-topic so it's only done once per topic
- [x] Progress bar and score tracking during the check

## Structured Learning Ladders
- [x] LLM generates real curriculum per topic (e.g., Physics → Classical Mechanics → Waves → QM → String Theory)
- [x] Each step has: title, description, why it matters, specific YouTube search query, estimated time
- [x] Visual ladder/roadmap UI with current position indicator and step icons
- [x] Steps unlock progressively (watch content + pass quiz = step complete)
- [x] Step completion tracking with progress percentage
- [x] "Why this matters" context connecting each step to the bigger picture
- [x] Completing a step auto-suggests next one
- [x] Topic progress stored in local state (per-topic ladder + progress)
- [x] "Continue Learning" section in feed showing active paths

## Learning Path Generation
- [x] LLM-powered learning path API (progressive steps from basics to mastery)
- [x] Learning path generation endpoint with skill-level awareness

## Future Enhancements
- [x] Daily digest generation API
- [x] Session-end hook: "One more?" prompt
- [x] Quick burst mode: 60-second micro-sessions
- [x] Learning reminder notifications
- [x] Light/Dark/System theme toggle in profile
- [x] Optional account creation for cloud sync (sign-in available in Profile)
- [x] Article content from web scraping (non-paywall sources) — deferred, using YouTube content
- [x] Loading skeleton cards
- [x] Streak freeze and repair mechanics
- [x] Badge unlock animations and celebrations
- [x] Streak milestone celebrations (7, 30, 100, 365 days)
- [x] Level-up celebration animation
- [x] Smart reminder timing based on user's peak activity hours

## Conversational AI Chat Interface (Primary Learning Mode)
- [x] Chat tab as primary interaction (replaces or augments Home feed)
- [x] User types real-world questions ("Why does Earth orbit the Sun?")
- [x] LLM maps question to underlying concepts (gravity, orbital mechanics, Newton's laws)
- [x] Inline baseline quiz in chat (2-3 fun questions to assess level before diving in)
- [x] Personalized mini-ladder generated from user's level to answering their question
- [x] YouTube content cards embedded in chat conversation
- [x] User can redirect anytime ("Wait, what's gravity?" / "Skip to black holes")
- [x] Chat history persisted locally
- [x] Real-world concept grounding — always relate theory to tangible examples
- [x] Backend: conversational AI endpoint with context-aware responses
- [x] Backend: question-to-concept mapping via LLM
- [x] Backend: inline baseline generation for chat context
- [x] Backend: mini-ladder generation from baseline to user's goal

## Conversational AI — Seamless "Ask" Experience
- [x] Chat types: ChatMessage, ChatConversation, InlineChatQuiz, MiniLadderStep
- [x] Learning store: conversations state, chat actions (ADD_MESSAGE, SAVE_CONVERSATION, etc.)
- [x] Backend: conversational AI endpoint — understands real-world questions, maps to concepts
- [x] Backend: inline baseline quiz generation (2-3 fun questions in chat flow)
- [x] Backend: mini-ladder generation from user's level to their goal question
- [x] Backend: step-aware YouTube content curation within chat
- [x] Ask tab: clean chat UI with message bubbles, typing indicator
- [x] Ask tab: inline baseline quizzes rendered as interactive cards in chat
- [x] Ask tab: YouTube content cards embedded in conversation
- [x] Ask tab: mini-ladder visualization in chat
- [x] Ask tab: "I don't get it" / redirect / follow-up support
- [x] Ask tab: conversation history with recent questions
- [x] Navigation: Add Ask tab to tab bar, update icon mappings
- [x] UX: Super intuitive, no clunky mode switching, directionally simple

## Personal Tutor Intelligence — Subtle Signal Gathering
- [x] Replace quiz-style baseline with natural conversational check-ins
- [x] Design signal taxonomy: what the system observes vs. what it asks
- [x] Embed subtle "Does that make sense?" / "Have you seen this before?" nudges in AI responses
- [x] Track implicit signals: time spent on content, re-reads, scroll-backs, "explain simpler" taps
- [x] Track conversational signals: follow-up questions indicate confusion, topic changes indicate boredom
- [x] Learner profile evolves silently based on accumulated signals (no explicit "test" moments)
- [x] AI tone adapts to individual: formal vs casual, detail-loving vs big-picture, fast vs slow pace
- [x] Content recommendations evolve mid-session based on real-time signals
- [x] "Feels personal" — AI remembers past conversations, references them naturally
- [x] Backend: signal processing layer that converts raw signals into learner model updates
- [x] Backend: AI prompts include learner context (past topics, confusion points, pace preference)
- [x] Ask screen: remove hard quiz cards, replace with soft conversational check-ins
- [x] Ask screen: AI naturally asks "What do you think?" or "Does that connect to anything you know?"
- [x] Feed: content ordering reflects accumulated intelligence, not just topic matching

## Voice Input — Hands-Free Learning
- [x] Microphone button on Ask screen next to text input
- [x] Audio recording via expo-audio
- [x] Speech-to-text via backend LLM (send audio, get transcription)
- [x] Seamless flow: tap mic → record → auto-transcribe → send as question
- [x] Visual recording indicator (pulsing mic, waveform)
- [x] Platform detection: disable on web, enable on native

## Cross-Conversation Memory
- [x] AI references past conversations naturally ("Last time you explored gravity...")
- [x] Backend: include conversation history summary in AI prompts
- [x] Learner model pastTopics updated after each conversation
- [x] AI connects new questions to previously learned concepts
- [x] "Continue where you left off" suggestions from past conversations

## Smart Quick-Start Suggestions
- [x] Show 3-4 tappable question suggestions on Ask screen when no active conversation
- [x] Suggestions based on learner model (interests, past topics, skill level, time of day)
- [x] Backend: generate personalized suggestions via LLM using learner context
- [x] Suggestions refresh on each visit to Ask tab
- [x] Suggestions feel natural and curiosity-driven, not generic

## In-App Update Check
- [x] Add "Check for Updates" link in profile screen
- [x] Build update checker that fetches latest APK version from published URL
- [x] Show update available banner with download link
- [x] Open APK download URL via Linking when update is available
- [x] Show current app version in profile screen

## Onboarding Redesign — Open, Holistic, Inviting
- [x] Redesign startup page to feel like an open invitation to learn and explore
- [x] Make onboarding more intuitive and less like a form/quiz
- [x] Add "How It Works" section explaining the learning approach
- [x] Create warm, inspiring welcome experience that feels holistic
- [x] Reduce friction — feel like exploring, not configuring
- [x] Ensure the experience works for all ages and backgrounds

## Major UX Overhaul — Real Education, Not Edutainment
- [x] Onboarding: Add age input step for cold-start curation (kid vs teen vs adult content)
- [x] Onboarding: Remove "free forever" and "no account needed" messaging
- [x] Onboarding: Add optional sign-in option (not required, but available)
- [x] Home tab: Merge Ask input bar at top of home screen
- [x] Home tab: Show topic list below Ask input
- [x] Home tab: Show content feed below topics
- [x] Ask flow: One question/info request at a time (no data dumps)
- [x] Ask flow: Play most relevant video after each concept, user can skip
- [x] Ask flow: Improve conversational flow — teach step by step
- [x] Remove Explore tab duplication — topics accessible from Home
- [x] Age-based cold start: curate initial topics and content difficulty based on age
- [x] Education quality: ensure courses deliver real mastery, not just entertainment

## Bug Fixes
- [x] Fix Explore/Home tab empty on cold start — topics and feed should appear immediately for new users
- [x] Fix cold start empty feed — auto-populate content immediately after onboarding (auto-refresh + 3s polling)
- [x] Fix all video playback to use in-app player instead of opening YouTube externally
- [x] Create in-app video player screen using WebView YouTube embed
- [x] Update Ask/chat flow video links to use in-app player
- [x] Update Home feed video cards to use in-app player
- [x] Update content detail screen to use in-app player
- [x] Fix YouTube Error 153 in video player WebView embed — switched to HTML source with baseUrl origin (confirmed fix from react-native-webview#3889)
- [x] Fix cold start feed still showing empty "Load Content" — skeleton loading on cold start with 3s polling + 30s timeout fallback

## Ask Flow Redesign — Guided Learning Strategy
- [x] Redesign Ask flow from chat bubbles to a guided learning journey
- [x] New backend endpoint: chat.learn — returns structured learning stages (not a single text block)
- [x] Stage 1: Hook — curiosity-sparking question or surprising fact to draw them in
- [x] Stage 2: Foundation — "Here's what you need to know first" context card
- [x] Stage 3: Core Explanation — the main concept, broken into digestible pieces
- [x] Stage 4: Real-World Connection — "See it in action" with a concrete example
- [x] Stage 5: Check Understanding — quick interactive check (not a quiz, more like "does this click?")
- [x] Stage 6: Go Deeper — video as the culmination, now they have context to appreciate it
- [x] Stage 7: What's Next — natural follow-up paths to continue learning
- [x] Card-based UI with smooth transitions between stages (not chat bubbles)
- [x] Visual progress dots showing current position in the learning journey
- [x] Each stage animates in one at a time as user progresses (tap to continue)
- [x] Follow-up questions create a new learning journey (not append to chat)
- [x] Maintain learner model integration for personalization

## Gamification as Teaching Strategy
- [x] Design gamification-as-teaching system (game mechanics that drive learning, not just reward it)
- [x] Journey XP system: visible XP earned per stage with animated counter in journey header
- [x] Stage completion rewards: XP burst animation + haptic when completing each stage
- [x] Journey mastery score: calculate and display a mastery percentage at journey end based on check accuracy + engagement
- [ ] Concept mastery map: visual skill tree / constellation showing learned concepts and connections (future)
- [x] Streak multiplier: consecutive correct answers boost XP multiplier (1x → 1.5x → 2x → 3x)
- [x] Challenge mode in check stages: timer-based bonus XP for quick correct answers
- [x] Journey completion celebration: animated summary card with total XP earned, concepts mastered, streak info
- [x] "Perfect Journey" badge: complete all stages + answer check correctly = special achievement
- [ ] Daily challenge: one curated learning journey per day with bonus XP (future)
- [ ] Concept connections: after multiple journeys, show how concepts link together (future)
- [ ] Progress ring on journey cards: visual completion indicator on recent journeys (future)
- [x] Backend: enhanced learn endpoint with gamification metadata (XP per stage, challenge hints, difficulty scaling)

## Bug Review — Gamification Flow, Video & Text Layout
- [x] Review and fix gamification flow consistency (XP tracking, streak multiplier, completion detection)
- [x] Review and fix video stage layout and playback
- [x] Review and fix text layout and rendering across all stages
- [x] Review and fix stage navigation (back/forward, completion)
- [x] Review and fix completion celebration card
- [x] Review and fix challenge timer behavior
- [x] Verify all stage types render correctly
- [x] End-to-end test of full journey flow
