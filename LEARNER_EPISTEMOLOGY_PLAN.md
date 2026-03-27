# Learner-Centric Epistemology System: Implementation Plan

## Vision
Transform Learn Anything from a content delivery app into a **wisdom transmission platform** that:
- Adapts to each learner's unique cognitive style, problem frame, and meaning-making pattern
- Captures continuous signals to infer understanding without explicit testing
- Uses real-world application (butterfly effects) as proof of understanding
- Generates culturally aware, non-stereotyping content hooks
- Learns adaptive thresholds per learner (no hard rules)
- Integrates seamlessly end-to-end into existing screens

---

## Core Principles

1. **Continuous Profiling** — Ask questions throughout app lifecycle, not just onboarding
2. **Adaptive Thresholds** — Learn stuck points per learner using median + anomaly detection
3. **Efficient Storage** — Compress granular data; retrieve on-demand; store only what matters
4. **Multi-Signal Inference** — Cultural context from language, IP, Wi-Fi, Google Sign-In
5. **Contextual Feedback** — Ask when stuck, explicitly requested, or learning path suggests it
6. **Butterfly Effect as Proof** — Real-world application = evidence of understanding
7. **End-to-End Integration** — Weave into Ask/Chat, Learning Ladder, Progress, Profile screens

---

## Phase 1: Database Schema Extensions + Google Sign-In

### New Tables

#### `learnerProfiles`
```sql
CREATE TABLE learnerProfiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT UNIQUE NOT NULL,
  
  -- Cognitive style (inferred from behavior)
  cognitiveStyle VARCHAR(50), -- visual|narrative|logical|kinesthetic|mixed
  
  -- Problem frame (what they care about)
  primaryProblemFrame TEXT,
  
  -- Cultural context (inferred from signals + explicit)
  culturalContext VARCHAR(255), -- region, language, background
  culturalContextConfidence FLOAT DEFAULT 0.5, -- 0-1 confidence
  culturalContextSource VARCHAR(50), -- 'google_signin'|'language_signals'|'ip_location'|'explicit'
  
  -- Meaning-making pattern (how they make sense of things)
  meaningMakingPattern VARCHAR(50), -- ethics|systems|aesthetics|utility|creativity
  
  -- Integration style (how they apply knowledge)
  integrationStyle VARCHAR(50), -- application|teaching|creation|reflection
  
  -- Learning pace (inferred)
  learningPace VARCHAR(50), -- fast|moderate|deep
  
  -- Engagement level (current)
  engagementLevel VARCHAR(50), -- high|medium|low
  
  -- Stuck point baseline (median of all stuck points)
  stuckPointMedian INT DEFAULT 0, -- seconds
  stuckPointStdDev INT DEFAULT 0, -- for anomaly detection
  
  -- Profile completeness (0-1)
  completeness FLOAT DEFAULT 0,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `learnerSignals` (Compressed Storage)
```sql
CREATE TABLE learnerSignals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  conceptId INT,
  
  -- Signal type
  signalType ENUM('question', 'connection', 'application', 'teaching', 'stuck', 'breakthrough', 'feedback') NOT NULL,
  
  -- Compressed content (store hash + metadata, retrieve full on demand)
  contentHash VARCHAR(64), -- SHA256 of full content
  contentSummary VARCHAR(500), -- First 500 chars for quick analysis
  contentLength INT, -- For storage optimization
  
  -- Metadata (JSON, compressed)
  metadata JSON, -- { confidence, depth, stage, etc. }
  
  -- Timestamps
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- For efficient querying
  INDEX (userId, conceptId, signalType, timestamp)
);
```

#### `understandingProgression`
```sql
CREATE TABLE understandingProgression (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  conceptId INT NOT NULL,
  
  -- Understanding stage
  stage ENUM('discovery', 'exploration', 'application', 'mastery', 'teaching') DEFAULT 'discovery',
  
  -- Confidence (0-1, fluid)
  confidence FLOAT DEFAULT 0,
  
  -- When they were last stuck
  lastStuckAt TIMESTAMP,
  stuckDuration INT, -- seconds
  stuckEvidence TEXT, -- What made us think they were stuck?
  
  -- Butterfly effects (real-world applications)
  butterflyEffects JSON, -- [{ application, context, timestamp, validationScore }]
  
  -- Teaching moments (they explained it to others)
  teachingMoments JSON, -- [{ explanation, audience, timestamp }]
  
  -- Misconceptions (what they got wrong)
  misconceptions JSON, -- [{ misconception, correctedAt, stage }]
  
  -- Questions asked (compressed)
  questionsAsked INT DEFAULT 0, -- Count, not full text
  questionsAvgQuality FLOAT DEFAULT 0, -- 0-1 quality score
  
  -- Time spent
  timeSpentSeconds INT DEFAULT 0,
  
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `conceptCulturalHooks` (Cached)
```sql
CREATE TABLE conceptCulturalHooks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conceptId INT NOT NULL,
  
  -- Cultural context (region/language/background)
  culturalContext VARCHAR(255) NOT NULL,
  
  -- The hook (engaging entry point)
  hook TEXT NOT NULL,
  
  -- Example (culturally relevant)
  example TEXT,
  
  -- Sensitivity notes (what to be aware of)
  sensitivityNotes TEXT,
  
  -- Confidence (0-1)
  confidence FLOAT DEFAULT 0.7,
  
  -- Cache TTL
  generatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cachedUntil TIMESTAMP,
  
  UNIQUE KEY (conceptId, culturalContext)
);
```

#### `stuckPointBaselines` (Per-learner adaptation)
```sql
CREATE TABLE stuckPointBaselines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  conceptId INT NOT NULL,
  
  -- Baseline metrics for this learner on this concept
  timeSpentMedian INT, -- Median time before they get unstuck
  timeSpentStdDev INT, -- For anomaly detection
  
  -- Stuck detection signals
  videoRepeatsMedian INT, -- Median times they rewatch before understanding
  questionRepeatsMedian INT, -- Median similar questions before understanding
  
  -- When we last updated this
  lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY (userId, conceptId)
);
```

#### `googleSignInData` (For context inference)
```sql
CREATE TABLE googleSignInData (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT UNIQUE NOT NULL,
  
  -- From Google Sign-In
  googleId VARCHAR(255) NOT NULL,
  email VARCHAR(320),
  name VARCHAR(255),
  picture TEXT,
  locale VARCHAR(10), -- e.g., 'en_US', 'es_MX'
  
  -- Inferred context
  language VARCHAR(10), -- Primary language
  region VARCHAR(50), -- Inferred from locale
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## Phase 2: Learner Profile Service

### Key Functions

```typescript
// server/learner-profile.ts

export interface LearnerProfile {
  userId: number;
  cognitiveStyle?: 'visual' | 'narrative' | 'logical' | 'kinesthetic' | 'mixed';
  primaryProblemFrame?: string;
  culturalContext?: string;
  culturalContextConfidence: number;
  culturalContextSource?: 'google_signin' | 'language_signals' | 'ip_location' | 'explicit';
  meaningMakingPattern?: 'ethics' | 'systems' | 'aesthetics' | 'utility' | 'creativity';
  integrationStyle?: 'application' | 'teaching' | 'creation' | 'reflection';
  learningPace?: 'fast' | 'moderate' | 'deep';
  engagementLevel: 'high' | 'medium' | 'low';
  completeness: number; // 0-1
}

// Initialize profile from onboarding answers
export async function initializeProfile(
  userId: number,
  onboardingAnswers: Record<string, string>,
  googleSignInData?: GoogleSignInData
): Promise<LearnerProfile>

// Infer cognitive style from signals
export async function inferCognitiveStyle(
  userId: number,
  signals: LearnerSignal[]
): Promise<'visual' | 'narrative' | 'logical' | 'kinesthetic' | 'mixed'>

// Infer problem frame
export async function inferProblemFrame(
  userId: number,
  signals: LearnerSignal[]
): Promise<string>

// Infer cultural context from multiple sources
export async function inferCulturalContext(
  userId: number,
  signals?: LearnerSignal[],
  googleData?: GoogleSignInData,
  ipLocation?: string
): Promise<{ context: string; confidence: number; source: string }>

// Infer meaning-making pattern
export async function inferMeaningMakingPattern(
  userId: number,
  signals: LearnerSignal[]
): Promise<'ethics' | 'systems' | 'aesthetics' | 'utility' | 'creativity'>

// Continuously update profile from new signals
export async function updateProfileFromSignals(
  userId: number,
  newSignals: LearnerSignal[]
): Promise<LearnerProfile>

// Get current profile
export async function getProfile(userId: number): Promise<LearnerProfile>

// Ask a contextual question (throughout app lifecycle)
export async function getNextProfileQuestion(
  userId: number,
  currentProfile: LearnerProfile
): Promise<{
  question: string;
  context: string; // Where to ask this
  type: 'cognitive' | 'problem_frame' | 'cultural' | 'meaning_making' | 'integration';
}>
```

### Onboarding Questions (Integrated, <90 seconds)

1. **"What's one thing you've always wanted to understand?"** → Problem frame
2. **"How do you usually learn best: stories, diagrams, logic, or hands-on?"** → Cognitive style
3. **"When you learn something, do you apply it right away, teach someone, or think deeply?"** → Integration style
4. **[Optional, later] "Where are you from?"** → Cultural context (if needed)
5. **[Optional, later] "What does 'understanding' mean to you?"** → Meaning-making pattern

### Continuous Profiling Throughout App

- After 5 concepts learned: "What's your learning pace? Do you prefer going fast or going deep?"
- When they teach someone: "Tell us about it! We'd love to know how you explained it."
- When they apply something: "How did you use this in real life?"
- When they struggle: "What's making this hard? Is it the concept or the way it's explained?"

---

## Phase 3: Signal Observer (Efficient Storage)

### Key Functions

```typescript
// server/signal-observer.ts

export interface LearnerSignal {
  userId: number;
  conceptId?: number;
  signalType: 'question' | 'connection' | 'application' | 'teaching' | 'stuck' | 'breakthrough' | 'feedback';
  content?: string; // Full content (stored separately if needed)
  contentSummary: string; // First 500 chars
  metadata: {
    confidence?: number;
    depth?: number;
    stage?: string;
    [key: string]: any;
  };
  timestamp: Date;
}

// Capture signal with compression
export async function captureSignal(
  userId: number,
  signalType: string,
  content: string,
  metadata?: Record<string, any>,
  conceptId?: number
): Promise<void>

// Detect stuck point (adaptive per learner)
export async function detectStuckPoint(
  userId: number,
  conceptId: number
): Promise<{
  isStuck: boolean;
  evidence: string[];
  anomalyScore: number; // How anomalous is this for this learner?
}>

// Detect breakthrough
export async function detectBreakthrough(
  userId: number,
  conceptId: number
): Promise<{
  isBreakthrough: boolean;
  evidence: string[];
}>

// Detect connection (they linked two ideas)
export async function detectConnection(
  userId: number,
  concept1Id: number,
  concept2Id: number,
  connectionText: string
): Promise<void>

// Detect application (real-world use)
export async function detectApplication(
  userId: number,
  conceptId: number,
  applicationText: string
): Promise<void>

// Detect teaching moment
export async function detectTeachingMoment(
  userId: number,
  conceptId: number,
  explanationText: string
): Promise<void>

// Get signal timeline for concept
export async function getSignalTimeline(
  userId: number,
  conceptId: number
): Promise<LearnerSignal[]>

// Retrieve full content of signal (on-demand)
export async function getSignalContent(signalId: number): Promise<string>
```

### Storage Strategy

**Compress:**
- Store content hash + first 500 chars
- Store metadata as JSON
- Store counts (questions asked) instead of full list

**Retrieve on-demand:**
- Full question text only when analyzing for understanding
- Full explanation only when generating personalized response
- Use content hash to avoid duplicates

**Efficient Indexing:**
- Index on (userId, conceptId, signalType, timestamp)
- Query only recent signals for stuck detection
- Archive old signals after 90 days

---

## Phase 4: Adaptive Stuck Point Detector

### Key Functions

```typescript
// server/stuck-point-detector.ts

export interface StuckPointAnalysis {
  isStuck: boolean;
  anomalyScore: number; // 0-1, how anomalous for this learner
  evidence: string[];
  suggestedHelp: {
    type: 'alternative_explanation' | 'diagnostic_question' | 'different_style' | 'prerequisite_review';
    content: string;
  };
}

// Detect stuck point using median + anomaly detection
export async function detectStuckPoint(
  userId: number,
  conceptId: number
): Promise<StuckPointAnalysis>

// Get learner's stuck point baseline
export async function getStuckPointBaseline(
  userId: number,
  conceptId: number
): Promise<{
  timeSpentMedian: number;
  timeSpentStdDev: number;
  videoRepeatsMedian: number;
  questionRepeatsMedian: number;
}>

// Update baseline from new data
export async function updateStuckPointBaseline(
  userId: number,
  conceptId: number
): Promise<void>

// Suggest help for stuck learner
export async function suggestHelpForStuck(
  userId: number,
  conceptId: number,
  learnerProfile: LearnerProfile
): Promise<{
  type: string;
  content: string;
  urgency: 'low' | 'medium' | 'high';
}>
```

### Stuck Detection Algorithm

```
For learner L on concept C:

1. Get baseline for (L, C):
   - timeSpentMedian, timeSpentStdDev
   - videoRepeatsMedian, questionRepeatsMedian

2. Get recent signals for (L, C):
   - Time spent in last 24h
   - Video repeats in last 24h
   - Question repeats in last 24h

3. Calculate anomaly score:
   - If (timeSpent > median + 2*stdDev) → anomaly
   - If (videoRepeats > median + 1) → anomaly
   - If (questionRepeats > median + 1) → anomaly
   - anomalyScore = (sum of anomalies) / 3

4. Determine stuck:
   - If anomalyScore > 0.6 AND time > 30 mins → STUCK
   - If videoRepeats > 3 in 24h → STUCK
   - If similar questions > 2 in 24h → STUCK

5. Return analysis with evidence
```

---

## Phase 5: Understanding Detector + Personalization Engine

### Understanding Detector

```typescript
// server/understanding-detector.ts

export interface UnderstandingAnalysis {
  stage: 'discovery' | 'exploration' | 'application' | 'mastery' | 'teaching';
  confidence: number; // 0-1
  misconceptions: string[];
  readyFor: number[]; // concept IDs they're ready for
  nextQuestions: string[];
}

// Analyze question to detect understanding
export async function analyzeQuestion(
  userId: number,
  question: string,
  conceptId: number,
  previousQuestions?: string[]
): Promise<UnderstandingAnalysis>

// Get understanding progression
export async function getUnderstandingProgression(
  userId: number,
  conceptId: number
): Promise<{
  stage: string;
  confidence: number;
  misconceptions: string[];
  butterflyEffects: any[];
  teachingMoments: any[];
}>

// Validate understanding through butterfly effect
export async function validateUnderstandingThroughApplication(
  userId: number,
  conceptId: number,
  application: string
): Promise<{
  isValid: boolean;
  depthOfUnderstanding: number; // 0-1
  newInsights: string[];
}>
```

### Personalization Engine

```typescript
// server/personalization-engine.ts

export interface PersonalizedExplanation {
  explanation: string;
  examples: string[];
  culturalHook?: string;
  nextQuestion: string;
  estimatedReadTime: number; // seconds
}

// Generate personalized explanation
export async function generatePersonalizedExplanation(
  conceptId: number,
  learnerProfile: LearnerProfile,
  understandingStage: string
): Promise<PersonalizedExplanation>

// Select teaching style based on profile
export async function selectTeachingStyle(
  learnerProfile: LearnerProfile
): Promise<'narrative' | 'visual' | 'logical' | 'kinesthetic'>

// Generate cultural hook (only if context known with confidence)
export async function generateCulturalHook(
  conceptId: number,
  culturalContext: string,
  confidence: number
): Promise<string | null>

// Generate relevant examples
export async function generateRelevantExamples(
  conceptId: number,
  learnerProfile: LearnerProfile,
  count?: number
): Promise<string[]>

// Suggest next concept
export async function suggestNextConcept(
  userId: number,
  currentConceptId: number,
  learnerProfile: LearnerProfile
): Promise<{
  conceptId: number;
  reason: string;
  readinessScore: number; // 0-1
}>
```

---

## Phase 6: Butterfly Effect Tracker + Cultural Hooks

### Butterfly Effect Tracker

```typescript
// server/butterfly-effect-tracker.ts

export interface ButterflyEffect {
  conceptId: number;
  application: string;
  context: string;
  timestamp: Date;
  validationScore: number; // 0-1
  depthOfUnderstanding: number; // 0-1
}

// Record real-world application
export async function recordButterflyEffect(
  userId: number,
  conceptId: number,
  application: string,
  context?: string
): Promise<void>

// Validate application (LLM)
export async function validateButterflyEffect(
  conceptId: number,
  application: string
): Promise<{
  isValid: boolean;
  depthOfUnderstanding: number;
  newInsights: string[];
}>

// Get all applications for concept
export async function getButterflyEffects(
  userId: number,
  conceptId: number
): Promise<ButterflyEffect[]>

// Infer applications from signals
export async function inferButterflyEffectsFromSignals(
  userId: number,
  conceptId: number
): Promise<ButterflyEffect[]>

// Celebrate butterfly effect
export async function celebrateButterflyEffect(
  userId: number,
  conceptId: number,
  application: string
): Promise<string> // Celebration message
```

### Cultural Hooks Generator

```typescript
// server/cultural-hooks-generator.ts

// Generate hook only when cultural context known with confidence
export async function generateCulturalHook(
  conceptId: number,
  culturalContext: string,
  confidence: number = 0.7
): Promise<{
  hook: string;
  example: string;
  sensitivityNotes: string;
} | null>

// Generate multiple hooks for different contexts
export async function generateMultipleCulturalHooks(
  conceptId: number,
  contexts: string[]
): Promise<Record<string, any>>

// Validate hook (no stereotyping)
export async function validateHook(
  conceptId: number,
  culturalContext: string,
  hook: string
): Promise<{
  isRespectful: boolean;
  isAccurate: boolean;
  hasStereotypes: boolean;
  feedback: string;
}>
```

---

## Phase 7: tRPC Routers + Frontend Hooks

### Routers

```typescript
// server/routers-learner-epistemology.ts

export const learnerEpistemologyRouter = router({
  // Profile
  profile: router({
    initialize: protectedProcedure.mutation(...),
    get: protectedProcedure.query(...),
    update: protectedProcedure.mutation(...),
    getNextQuestion: protectedProcedure.query(...),
    answerQuestion: protectedProcedure.mutation(...),
  }),

  // Signals
  signals: router({
    capture: protectedProcedure.mutation(...),
    getTimeline: protectedProcedure.query(...),
    getContent: protectedProcedure.query(...),
  }),

  // Understanding
  understanding: router({
    analyzeQuestion: protectedProcedure.query(...),
    getProgression: protectedProcedure.query(...),
    detectStuck: protectedProcedure.query(...),
  }),

  // Personalization
  personalization: router({
    getExplanation: protectedProcedure.query(...),
    getCulturalHook: protectedProcedure.query(...),
    suggestNext: protectedProcedure.query(...),
  }),

  // Butterfly Effects
  butterflyEffect: router({
    record: protectedProcedure.mutation(...),
    get: protectedProcedure.query(...),
    inferFromSignals: protectedProcedure.query(...),
  }),
});
```

### Frontend Hooks

```typescript
// hooks/use-learner-profile.ts
export function useLearnerProfile() { ... }

// hooks/use-understanding.ts
export function useUnderstanding(conceptId: number) { ... }

// hooks/use-personalization.ts
export function usePersonalization(conceptId: number) { ... }

// hooks/use-butterfly-effect.ts
export function useButterflyEffect(conceptId: number) { ... }

// hooks/use-signal-capture.ts
export function useSignalCapture() { ... }
```

---

## Phase 8: Integration Points

### 1. Onboarding Screen
- Add 3-5 engaging questions in <90 seconds
- Initialize learner profile
- Capture Google Sign-In data

### 2. Ask/Chat Screen
- Capture every question as signal
- Analyze question quality in real-time
- Show personalized explanation
- Detect stuck points → suggest help
- Track butterfly effects from chat

### 3. Learning Ladder Screen
- Show understanding progression
- Detect stuck points → offer help
- Suggest next concept
- Celebrate butterfly effects

### 4. Progress Screen
- Show understanding progression per concept
- Highlight butterfly effects
- Show stuck points and recovery

### 5. Profile Screen
- Show learner profile
- Allow editing cultural context
- Show all butterfly effects
- Show teaching moments

---

## Phase 9: Testing & Optimization

### Tests to Write
- Profile initialization and updates
- Signal capture and retrieval
- Stuck point detection (median + anomaly)
- Understanding progression tracking
- Personalization generation
- Butterfly effect validation
- Cultural hook generation

### Performance Optimization
- Index optimization for signal queries
- Caching for cultural hooks (30 days)
- Compression for signal storage
- Batch processing for profile updates

---

## Success Metrics

1. **Engagement** — Users spend 30%+ more time exploring content
2. **Understanding** — Quiz accuracy improves 15%+ (better understanding)
3. **Application** — 50%+ of learners record butterfly effects
4. **Retention** — Users return 2x more frequently
5. **Personalization** — 80%+ of explanations rated as "helpful"
6. **Cultural Awareness** — 0 complaints about stereotyping; 90%+ find hooks relevant

---

## Implementation Order

1. Database schema + Google Sign-In
2. Learner profile service
3. Signal observer
4. Stuck point detector
5. Understanding detector
6. Personalization engine
7. Butterfly effect tracker
8. Cultural hooks generator
9. tRPC routers
10. Frontend hooks
11. Integration into screens
12. Testing & optimization

