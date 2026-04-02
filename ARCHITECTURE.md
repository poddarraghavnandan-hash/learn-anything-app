# Shiro Architecture: Technical Design

## System Overview

Shiro is a full-stack mobile learning application built with React Native, Expo, and a Node.js backend. The system is designed for scalability, personalization, and real-time adaptation.

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile App (React Native)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Home Tab   │  │   Gaia Chat  │  │  Profile Tab │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ↓                  ↓                  ↓              │
│  ┌──────────────────────────────────────────────────┐       │
│  │         Lesson Content & Review Screens          │       │
│  └──────────────────────────────────────────────────┘       │
│         ↓                                                     │
│  ┌──────────────────────────────────────────────────┐       │
│  │  Behavior Tracking & Session Management          │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    tRPC API Client
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Node.js/Express)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Claude API   │  │ Gemini API   │  │ User Auth    │      │
│  │ Integration  │  │ Integration  │  │ (OAuth)      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ↓                  ↓                  ↓              │
│  ┌──────────────────────────────────────────────────┐       │
│  │  tRPC Routers (Content, Behavior, Profile)       │       │
│  └──────────────────────────────────────────────────┘       │
│         ↓                                                     │
│  ┌──────────────────────────────────────────────────┐       │
│  │  Core Services                                   │       │
│  │  - Meta-Learning Selector                        │       │
│  │  - Adaptive Difficulty Engine                    │       │
│  │  - Spaced Repetition Engine                      │       │
│  │  - Behavior Tracker                              │       │
│  │  - Baseline Evaluator                            │       │
│  └──────────────────────────────────────────────────┘       │
│         ↓                                                     │
│  ┌──────────────────────────────────────────────────┐       │
│  │  Database (PostgreSQL + Drizzle ORM)             │       │
│  │  - Users & Sessions                              │       │
│  │  - Learning Paths & Concepts                     │       │
│  │  - User Behavior & Metrics                       │       │
│  │  - Baseline Evaluations                          │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### Frontend Architecture

The frontend is built with React Native and Expo, enabling deployment to iOS, Android, and web platforms from a single codebase.

#### Key Technologies

| Technology | Purpose | Version |
|-----------|---------|---------|
| React Native | Cross-platform mobile UI | 0.81 |
| Expo | Development framework | 54 |
| React 19 | UI library | 19.1 |
| Expo Router | Navigation | 6 |
| NativeWind | Tailwind CSS for React Native | 4 |
| react-native-reanimated | Animations | 4.x |
| TanStack Query | Server state management | 5.x |
| tRPC | Type-safe API client | 11.7 |

#### Screen Architecture

The app follows a tab-based navigation structure:

```
(tabs)/
├── index.tsx (Home Screen)
│   ├── Header with app title
│   ├── Review button (conditional)
│   ├── Chat with Gaia quick action
│   └── Learning paths list
├── ask.tsx (Gaia Chat)
│   ├── Chat history
│   ├── Message input
│   └── Gaia responses
└── profile.tsx (Profile Tab)
    ├── Learning statistics
    ├── Mastery timeline
    └── Settings

screens/
├── learning-path-detail.tsx
│   ├── Path overview
│   ├── Lesson list (8 lessons)
│   └── Progress indicator
├── lesson-content.tsx
│   ├── Lesson content (from Claude)
│   ├── Interactive quiz
│   ├── Gaia guidance
│   └── Continue button
├── review-screen.tsx
│   ├── Pending reviews list
│   ├── Review cards
│   └── Spaced repetition scheduling
└── baseline-evaluation.tsx
    ├── Adaptive questions
    ├── Learning style assessment
    └── Results screen
```

### Backend Architecture

The backend is built with Node.js, Express, and tRPC, providing a type-safe API for the frontend.

#### tRPC Routers

| Router | Purpose | Key Endpoints |
|--------|---------|---------------|
| `claudeContent` | AI content generation | `generateLessonContent` |
| `behaviorTracking` | Learning signal recording | `recordSignal`, `endSession` |
| `userProfile` | User data & preferences | `getLearnerProfile`, `updateProfile` |
| `spaceRepetition` | Review scheduling | `getReviewQueue`, `recordReview` |

#### Core Services

**Meta-Learning Selector** (`server/services/meta-learning-selector.ts`)

Selects the optimal pedagogical approach for each lesson based on:
- User's learning profile (learning style, approach effectiveness)
- Topic characteristics (domain, difficulty, prerequisites)
- Current performance (recent quiz scores, engagement)

Implements 9 pedagogical approaches:
1. Socratic Method
2. Case Study
3. Problem-First
4. Analogical
5. Experiential
6. Narrative
7. Conceptual Mapping
8. Debate
9. Scaffolded

**Adaptive Difficulty Engine** (`server/services/adaptive-difficulty.ts`)

Adjusts lesson difficulty in real-time based on:
- Quiz performance (target: 70-80% accuracy)
- Time spent on concepts
- Engagement signals
- Struggle detection

Difficulty levels: Easy, Medium, Hard, Very Hard

**Spaced Repetition Engine** (`server/services/spaced-repetition.ts`)

Implements SM-2 algorithm for optimal review scheduling:
- Tracks ease factor (difficulty of concept for learner)
- Calculates optimal review intervals
- Schedules reviews just before forgetting

**Behavior Tracker** (`server/services/behavior-tracker.ts`)

Records learning signals during lessons:
- Engagement (time spent, interactions)
- Comprehension (quiz scores, mistakes)
- Confidence (self-reported, inferred)
- Pacing (speed through material)

**Baseline Evaluator** (`server/services/baseline-evaluator.ts`)

Conducts adaptive baseline evaluation:
- Assesses prior knowledge
- Identifies learning style preferences
- Evaluates confidence and motivation
- Generates personalized recommendations

### Database Schema

The database uses PostgreSQL with Drizzle ORM for type-safe queries.

#### Key Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `users` | User accounts | `id`, `email`, `name`, `createdAt` |
| `sessions` | User sessions | `id`, `userId`, `expiresAt` |
| `learningPaths` | Learning topics | `id`, `title`, `description`, `domain` |
| `concepts` | Individual concepts | `id`, `pathId`, `title`, `difficulty` |
| `userLessonProgress` | Lesson completion | `userId`, `conceptId`, `completed`, `score` |
| `userConceptMetrics` | Spaced repetition data | `userId`, `conceptId`, `easeFactor`, `nextReviewDate` |
| `userBehaviorSignals` | Learning signals | `userId`, `conceptId`, `engagement`, `comprehension` |
| `baselineEvaluations` | Baseline assessment | `userId`, `pathId`, `priorKnowledge`, `learningStyle` |

## Data Flow

### Lesson Learning Flow

```
1. User selects learning path
   ↓
2. Baseline evaluation (if first time)
   ↓
3. Meta-learning selector chooses approach
   ↓
4. Claude API generates personalized content
   ↓
5. Lesson content displayed with LoadingQuote animation
   ↓
6. User learns through lesson content
   ↓
7. Behavior tracker records signals (engagement, comprehension, confidence)
   ↓
8. Adaptive difficulty engine adjusts difficulty
   ↓
9. User completes quiz
   ↓
10. Behavior tracker records quiz performance
    ↓
11. Concept added to spaced repetition queue
    ↓
12. User continues to next lesson or completes path
```

### Review Flow

```
1. User taps "Review Time!" button on home screen
   ↓
2. Spaced repetition engine queries concepts where nextReviewDate <= today
   ↓
3. Review screen displays pending concepts
   ↓
4. User reviews each concept
   ↓
5. Behavior tracker records review performance
   ↓
6. SM-2 algorithm updates ease factor and next review date
   ↓
7. Concept rescheduled or marked as mastered
```

## API Communication

The frontend communicates with the backend via tRPC, which provides:

- **Type Safety** — Frontend and backend share TypeScript types
- **Automatic Validation** — Input validation on both sides
- **Error Handling** — Consistent error handling across API
- **Real-Time Updates** — Subscriptions for live data updates

### Example tRPC Call

```typescript
// Frontend
const { data: lesson } = await trpc.claudeContent.generateLessonContent.query({
  topic: "Physics Fundamentals",
  approach: "socratic",
  difficulty: "medium",
  userId: currentUser.id,
});

// Backend
export const claudeContentRouter = router({
  generateLessonContent: publicProcedure
    .input(z.object({
      topic: z.string(),
      approach: z.enum([...]),
      difficulty: z.enum(["easy", "medium", "hard", "very_hard"]),
      userId: z.string(),
    }))
    .query(async ({ input }) => {
      // Generate content using Claude API
      // Record behavior signals
      // Return personalized content
    }),
});
```

## Scalability Considerations

### Horizontal Scaling

- **Stateless Backend** — All state stored in database, enabling multiple server instances
- **Load Balancing** — API requests distributed across multiple servers
- **Database Replication** — PostgreSQL replicas for read scaling
- **Caching Layer** — Redis for frequently accessed data (lesson content, user profiles)

### Performance Optimization

- **Content Caching** — Generated lesson content cached to avoid repeated API calls
- **Lazy Loading** — Lesson content loaded on-demand
- **Pagination** — Large lists paginated to reduce memory usage
- **Database Indexing** — Indexes on frequently queried fields

### Monitoring & Observability

- **Application Metrics** — Track API response times, error rates, user engagement
- **Database Monitoring** — Monitor query performance, connection pool usage
- **Error Tracking** — Capture and analyze errors for debugging
- **User Analytics** — Track learning patterns and feature usage

## Security

### Authentication & Authorization

- **OAuth 2.0** — Secure user login via OAuth providers
- **Session Management** — Secure session tokens with expiration
- **Role-Based Access Control** — Different permissions for users, educators, admins

### Data Protection

- **Encryption in Transit** — HTTPS for all API communication
- **Encryption at Rest** — Sensitive data encrypted in database
- **Data Privacy** — GDPR-compliant data handling
- **Audit Logging** — Track all data access and modifications

## Deployment

### Development Environment

- **Local Development** — Expo development server for rapid iteration
- **Hot Reloading** — Instant code updates without full rebuild
- **Metro Bundler** — JavaScript bundler for React Native

### Production Deployment

- **Mobile Apps** — Deployed via Apple App Store and Google Play Store
- **Web App** — Deployed via CDN for fast global access
- **Backend** — Deployed on cloud infrastructure (AWS, GCP, or Azure)
- **Database** — Managed PostgreSQL service with automated backups

---

**The Shiro architecture is designed for scalability, personalization, and continuous improvement through data-driven learning.**
