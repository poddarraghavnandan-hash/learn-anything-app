# Shiro Features: Complete Guide

## Core Features

### 1. Adaptive Learning Paths

**What it is:** Personalized sequences of lessons tailored to each learner's level and learning style.

**How it works:**
- User selects a learning topic (e.g., "Physics Fundamentals")
- Baseline evaluation assesses prior knowledge and learning style
- Meta-learning engine selects optimal pedagogical approach
- Lesson sequence adapts based on performance

**Key Benefits:**
- Respects learner's prior knowledge (no unnecessary review)
- Matches teaching style to learning style
- Optimal challenge level (not too easy, not too hard)
- Personalized pacing

### 2. AI-Generated Lesson Content

**What it is:** Dynamically generated lesson content powered by Claude and Gemini APIs.

**How it works:**
- For each lesson, the backend queries Claude with:
  - Topic and concept
  - Selected pedagogical approach
  - Learner's difficulty level
  - User's learning profile
- Claude generates personalized content including:
  - Concept explanation
  - Real-world examples
  - Key points
  - Interactive quiz questions
- Content is cached to avoid redundant API calls

**Key Benefits:**
- Infinite content variety (no fixed curriculum)
- Personalized explanations for each learner
- Content adapts to learner's level and style
- Always fresh and relevant

### 3. Gaia: AI Learning Companion

**What it is:** An intelligent chatbot that serves as a personal learning mentor.

**How it works:**
- Accessible from any screen via "Chat with Gaia" button
- Understands current lesson context
- Provides personalized explanations
- Answers questions about concepts
- Offers encouragement and guidance

**Key Features:**
- Context-aware responses
- Adapts explanations to learner's style
- Tracks conversation history
- Provides hints without giving away answers
- Celebrates progress

**Key Benefits:**
- Immediate help when stuck
- Personalized guidance
- Reduces frustration
- Increases engagement

### 4. Real-Time Behavior Tracking

**What it is:** Continuous monitoring of learning signals during lessons.

**How it works:**
- Tracks engagement: time spent, interactions, attention
- Tracks comprehension: quiz scores, mistakes, hints used
- Tracks confidence: self-reported and inferred from behavior
- Tracks pacing: speed through material, where learner slows down
- All signals recorded in real-time and stored in database

**Key Benefits:**
- Data-driven personalization
- Early detection of struggling learners
- Identification of learning patterns
- Enables continuous improvement

### 5. Adaptive Difficulty

**What it is:** Real-time adjustment of lesson difficulty based on performance.

**How it works:**
- Target accuracy: 70-80% (optimal learning zone)
- If accuracy < 70%: Difficulty decreases, more scaffolding provided
- If accuracy > 80%: Difficulty increases, more challenge provided
- Difficulty adjusts gradually to maintain engagement

**Difficulty Levels:**
- **Easy:** Basic concepts, high scaffolding, simple examples
- **Medium:** Standard concepts, moderate scaffolding
- **Hard:** Complex concepts, minimal scaffolding, advanced examples
- **Very Hard:** Cutting-edge concepts, research-level content

**Key Benefits:**
- Maintains optimal challenge level
- Prevents frustration from too-hard content
- Prevents boredom from too-easy content
- Maximizes learning efficiency

### 6. Meta-Learning System

**What it is:** AI system that learns which pedagogical approaches work best for each learner.

**How it works:**
- Tracks effectiveness of each approach for each learner
- Identifies patterns: which approaches work best for which topics/learners
- Predicts optimal approach for new topics
- Detects stagnation and triggers approach innovation
- Continuously refines predictions

**Nine Pedagogical Approaches:**
1. **Socratic Method** — Learning through guided questioning
2. **Case Study** — Learning through real-world scenarios
3. **Problem-First** — Starting with a challenge
4. **Analogical** — Learning through familiar analogies
5. **Experiential** — Learning through hands-on practice
6. **Narrative** — Learning through storytelling
7. **Conceptual Mapping** — Visualizing concept relationships
8. **Debate** — Learning through argumentation
9. **Scaffolded** — Step-by-step guided learning

**Key Benefits:**
- Personalized teaching method
- Continuous improvement over time
- Breaks through learning plateaus
- Maximizes engagement and retention

### 7. Spaced Repetition Review

**What it is:** Scientifically-proven review scheduling system for long-term retention.

**How it works:**
- Implements SM-2 algorithm
- Schedules reviews at optimal intervals
- Reviews just before forgetting, before full forgetting
- Adjusts intervals based on performance
- Tracks ease factor (difficulty of concept for learner)

**Review Schedule Example:**
- First review: 1 day after learning
- Second review: 3 days after first review
- Third review: 7 days after second review
- Fourth review: 14 days after third review
- Intervals increase with successful reviews

**Key Benefits:**
- Maximizes long-term retention
- Efficient use of study time
- Prevents forgetting
- Builds true mastery

### 8. Baseline Evaluation

**What it is:** Adaptive assessment that evaluates learner's prior knowledge and learning style.

**How it works:**
- 5-7 adaptive questions (not a traditional test)
- Questions adjust based on responses
- Assesses prior knowledge, learning style, confidence
- Takes 5-10 minutes
- Generates personalized recommendations

**Evaluation Dimensions:**
- Prior Knowledge: What does learner already know?
- Learning Style: How does learner prefer to learn?
- Confidence: How confident is learner in their abilities?
- Motivation: Why is learner interested in this topic?

**Key Benefits:**
- Personalized starting point
- Builds confidence (not intimidating)
- Identifies knowledge gaps
- Tailors initial approach selection

### 9. Philosophical Quotes on Loading Screens

**What it is:** Inspiring quotes displayed while content loads.

**How it works:**
- 30+ curated philosophical quotes about learning and growth
- Randomly selected and displayed during loading
- Smooth animations (fade in/out, slide)
- Rotates every 3-5 seconds

**Example Quotes:**
- "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice."
- "Education is the most powerful weapon which you can use to change the world."
- "Learning is not attainment of knowledge but mastery of skills."

**Key Benefits:**
- Makes loading feel less tedious
- Inspires and motivates learners
- Reinforces learning philosophy
- Improves user experience

### 10. Progress Dashboard

**What it is:** Visual dashboard showing learning progress and achievements.

**How it works:**
- Displays on Profile tab
- Shows learning streaks (consecutive days of learning)
- Mastery timeline (concepts mastered over time)
- Approach effectiveness trends
- Personalized recommendations for next topics

**Key Metrics:**
- **Learning Streak:** Days of consecutive learning
- **Concepts Mastered:** Total concepts fully learned
- **Total Study Time:** Hours spent learning
- **Average Accuracy:** Quiz performance across all lessons
- **Mastery Rate:** Percentage of concepts mastered

**Key Benefits:**
- Visualizes progress
- Celebrates achievements
- Motivates continued learning
- Guides next learning steps

## Navigation & UI

### Tab Navigation

| Tab | Purpose | Key Screens |
|-----|---------|------------|
| **Home** | Learning discovery | Learning paths, review button, quick actions |
| **Gaia** | AI assistance | Chat interface, conversation history |
| **Profile** | Personal dashboard | Progress, achievements, settings |

### Screen Flow

```
Home Screen
├── Review Button (if reviews pending)
│   └── Review Screen
│       ├── Review Cards
│       └── Spaced Repetition Scheduling
├── Chat with Gaia Button
│   └── Gaia Chat Screen
├── Learning Paths
│   └── Learning Path Detail
│       ├── Lesson List
│       └── Lesson Content
│           ├── AI-Generated Content
│           ├── Interactive Quiz
│           ├── Gaia Guidance
│           └── Continue to Next Step
└── How It Works Info
    └── Baseline Evaluation (first time)
        └── Baseline Results

Profile Screen
├── Learning Statistics
├── Mastery Timeline
├── Approach Effectiveness
├── Personalized Recommendations
└── Settings
```

## Animations & Polish

### Loading Experience

- **Philosophical Quotes** — Inspiring quotes during content loading
- **Smooth Transitions** — Fade and slide animations between screens
- **Progress Indicators** — Visual feedback during long operations
- **Haptic Feedback** — Tactile response on button presses

### Interactive Elements

- **Button Press Feedback** — Scale animation on press
- **Card Animations** — Staggered entrance animations
- **Quiz Feedback** — Immediate visual feedback on answers
- **Progress Animations** — Smooth progress bar animations

## Accessibility

### Design Principles

- **High Contrast** — Text and backgrounds have sufficient contrast
- **Large Touch Targets** — Buttons and interactive elements are large enough
- **Clear Labels** — All interactive elements clearly labeled
- **Keyboard Navigation** — All features accessible via keyboard

### Supported Features

- **Dark Mode** — Automatic dark mode support
- **Text Scaling** — Respects system text size settings
- **Screen Reader Support** — Compatible with accessibility tools
- **Reduced Motion** — Respects reduced motion preferences

## Performance

### Optimization Techniques

- **Content Caching** — Generated lesson content cached locally
- **Lazy Loading** — Content loaded on-demand
- **Image Optimization** — Images compressed and optimized
- **Code Splitting** — Large bundles split for faster loading

### Performance Metrics

- **App Load Time** — < 3 seconds
- **Lesson Load Time** — < 5 seconds (with philosophical quote)
- **Quiz Response Time** — < 100ms
- **API Response Time** — < 2 seconds (average)

## Data Privacy & Security

### User Data Protection

- **Encrypted Transmission** — All API communication encrypted (HTTPS)
- **Encrypted Storage** — Sensitive data encrypted in database
- **Session Management** — Secure session tokens with expiration
- **Data Minimization** — Only necessary data collected

### Privacy Controls

- **Data Export** — Users can export their learning data
- **Data Deletion** — Users can request data deletion
- **Privacy Settings** — Granular control over data sharing
- **Transparent Policies** — Clear privacy policy and terms

---

**Shiro's features work together to create a personalized, adaptive learning experience that respects learner autonomy and maximizes learning outcomes.**
