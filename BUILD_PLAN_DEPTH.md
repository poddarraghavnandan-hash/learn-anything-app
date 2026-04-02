# Shiro — Content Depth System BUILD_PLAN

## Vision
Build a comprehensive content depth system that delivers **Foundation → Deep Dive → Expert** layers with **implicit knowledge graph generation**, **adaptive prerequisite assessment**, and **parallel presentation** across Ask/Ladder/Summaries.

**Core Principle**: Real understanding through context, not superficial facts. The system infers knowledge gaps from user responses and adapts content depth accordingly.

---

## Architecture Overview

### 1. Knowledge Graph Layer
- **LLM-generated prerequisite maps**: For each concept, generate implicit prerequisites (X + Y knowledge needed)
- **Concept relationships**: Bidirectional links (e.g., "Gravity ↔ Orbital Mechanics ↔ General Relativity")
- **Dependency tracking**: Store in database for fast lookup and adaptive triggering

### 2. Adaptive Assessment Engine
- **Implicit knowledge inference**: Analyze quiz answers, chat responses, time spent, reactions
- **Gap detection**: Identify missing prerequisites without explicit testing
- **Confidence scoring**: Track user's demonstrated understanding per concept

### 3. Multi-Layer Content Generation
- **Foundation**: ELI5 explanation, core intuition, one key example
- **Deep Dive**: Mechanisms, why it works, connections to other concepts, real-world applications
- **Expert**: Advanced theory, edge cases, research frontiers, open questions

### 4. Parallel Presentation UI
- **Expandable cards**: Show Foundation by default, tap to expand Deep Dive/Expert
- **Dependency badges**: "Needs: Algebra + Functions" with quick-access primers
- **Context markers**: Highlight when prerequisites are missing vs. mastered

### 5. Integration Points
- **Ask/Chat**: Conversational depth progression, adaptive follow-ups
- **Learning Ladder**: Step descriptions in all three layers, prerequisite suggestions
- **Content Summaries**: Rich context cards with expandable sections

---

## BUILD_PLAN: 8 Phases × ~300 Units Each

### PHASE 1: Knowledge Graph & Prerequisite Generation (Cycles 1-2, ~300 units)

**Goal**: Build the foundation for implicit knowledge mapping and prerequisite inference.

**Deliverables**:
1. **Backend API: Prerequisite Generation Endpoint**
   - Input: Topic + Concept
   - Output: List of prerequisites with confidence scores
   - Implementation: LLM prompt engineering + caching
   - Endpoint: `POST /api/learn/prerequisites`

2. **Database Schema Updates**
   - New table: `ConceptPrerequisites` (concept_id, prerequisite_id, confidence, relationship_type)
   - New table: `ConceptRelationships` (concept_a_id, concept_b_id, relationship_type, strength)
   - Indexes for fast lookup

3. **Prerequisite Caching System**
   - Cache generated prerequisites to avoid repeated LLM calls
   - TTL: 30 days (refresh on user request)
   - Fallback: Return cached results if generation fails

4. **Knowledge Graph Visualization (Backend)**
   - Build graph traversal logic (BFS/DFS for prerequisite chains)
   - API: `GET /api/learn/concept-graph/:conceptId` → returns full dependency tree

**Testing**:
- Unit tests: Prerequisite generation for 10 sample concepts
- Integration tests: Database schema and caching layer
- All 194+ existing tests pass

**Acceptance Criteria**:
- ✓ Prerequisite endpoint returns valid JSON with confidence scores
- ✓ Database stores and retrieves prerequisites efficiently
- ✓ Caching reduces LLM API calls by 80%+
- ✓ Graph traversal handles circular dependencies gracefully

---

### PHASE 2: Adaptive Assessment Engine (Cycles 3-4, ~300 units)

**Goal**: Infer knowledge gaps from user behavior without explicit testing.

**Deliverables**:
1. **Assessment Signals Collector**
   - Track: Quiz accuracy per concept, time spent, reactions, chat message patterns
   - Store in `UserConceptMetrics` table (user_id, concept_id, accuracy, time_spent, confidence_inferred)
   - Real-time updates as user interacts

2. **Knowledge Gap Detection Algorithm**
   - Input: User's concept metrics + prerequisite graph
   - Output: List of missing prerequisites with gap severity (low/medium/high)
   - Logic: If user scores low on concept C, flag prerequisites of C as potential gaps
   - Implementation: Python service + caching

3. **Confidence Scoring System**
   - Per-concept confidence: 0-100% based on quiz performance, time spent, consistency
   - Prerequisite confidence: Inferred from concept confidence + relationship strength
   - Update frequency: Real-time (on quiz completion, after 5 min of learning)

4. **Backend API: Knowledge Assessment**
   - Endpoint: `GET /api/learn/user/:userId/knowledge-gaps`
   - Returns: List of gaps with severity, suggested primers, and learning path adjustments

5. **Adaptive Triggering Logic**
   - Rule: If user accuracy < 60% on concept C, suggest prerequisites
   - Rule: If user spends > 10 min on concept C, offer "Deep Dive" layer
   - Rule: If user completes 3+ concepts in a domain, suggest "Expert" layer

**Testing**:
- Unit tests: Gap detection algorithm with mock user data
- Integration tests: Real quiz data → gap detection
- Scenario tests: User learns Calculus without Algebra → system detects gap

**Acceptance Criteria**:
- ✓ Gap detection identifies missing prerequisites with >80% accuracy
- ✓ Confidence scoring aligns with actual user performance
- ✓ Adaptive triggers fire at appropriate times
- ✓ All 194+ existing tests pass

---

### PHASE 3: Multi-Layer Content Generation (Cycles 5-6, ~300 units)

**Goal**: Generate Foundation/Deep Dive/Expert content for all concepts.

**Deliverables**:
1. **Content Generation Prompts**
   - Foundation prompt: "Explain [concept] in simple terms for a 10-year-old. Use one analogy."
   - Deep Dive prompt: "Explain [concept] with mechanisms, real-world applications, and connections to [prerequisites]."
   - Expert prompt: "Explain [concept] at research frontier level. Include open questions and advanced theory."

2. **Backend API: Multi-Layer Content Generation**
   - Endpoint: `POST /api/learn/content/generate-layers`
   - Input: Topic, concept, user_skill_level
   - Output: { foundation, deepDive, expert } with caching
   - Caching: Store generated content for 30 days

3. **Content Enrichment**
   - Add to Foundation: Key intuition, one example, why it matters
   - Add to Deep Dive: Mechanisms, connections, real-world applications, why it's hard
   - Add to Expert: Research frontiers, edge cases, open questions, advanced resources

4. **Database Updates**
   - New table: `ConceptContent` (concept_id, layer, content_text, generated_at, version)
   - Store all three layers for each concept
   - Version tracking for A/B testing

5. **Batch Generation Job**
   - Generate content for all 500+ concepts in database
   - Run nightly, prioritize high-traffic concepts
   - Fallback: Generate on-demand if not cached

**Testing**:
- Unit tests: Content generation for 20 sample concepts
- Quality tests: Human review of Foundation/Deep Dive/Expert samples
- Consistency tests: Ensure layers build on each other logically

**Acceptance Criteria**:
- ✓ All 500+ concepts have Foundation/Deep Dive/Expert content
- ✓ Content quality passes human review (spot-check 10 concepts)
- ✓ Caching reduces LLM API calls by 90%+
- ✓ All 194+ existing tests pass

---

### PHASE 4: Parallel Presentation UI (Cycles 7-8, ~300 units)

**Goal**: Build UI components for Foundation/Deep Dive/Expert layers with dependency markers.

**Deliverables**:
1. **Expandable Content Card Component**
   - Default: Show Foundation layer
   - Tap to expand: Reveal Deep Dive layer
   - Long-press: Show Expert layer
   - Smooth animations (FadeIn/FadeOut)
   - Implementation: React Native component with state management

2. **Prerequisite Badge Component**
   - Display: "Needs: Algebra + Functions"
   - Color coding: Green (mastered), Yellow (learning), Red (gap)
   - Tap: Show quick primer or redirect to prerequisite
   - Implementation: Reusable badge with navigation

3. **Knowledge Gap Alert**
   - Trigger: When user attempts concept with missing prerequisites
   - UI: Modal with "Learn prerequisites first?" or "Continue anyway?"
   - Action: Offer quick primer (2-3 min) or full learning path
   - Implementation: Modal component with conditional rendering

4. **Content Summary Enhancement**
   - Update existing content detail screen
   - Add Foundation/Deep Dive/Expert tabs
   - Show prerequisite dependencies at top
   - Add "Why this matters" context section

5. **Learning Ladder Step Enhancement**
   - Update step cards to show all three layers
   - Add prerequisite suggestions below step title
   - Highlight completed prerequisites with checkmarks

**Testing**:
- Component tests: Expandable card, badge, alert components
- Integration tests: Navigation between layers
- Responsive tests: UI works on small screens (Pixel) and tablets
- Accessibility tests: Screen reader support for layers

**Acceptance Criteria**:
- ✓ Expandable cards render all three layers correctly
- ✓ Prerequisite badges display with correct color coding
- ✓ Gap alerts trigger appropriately
- ✓ All UI components responsive on 320px–768px+ screens
- ✓ All 194+ existing tests pass

---

### PHASE 5: Ask/Chat Integration (Cycles 9-10, ~300 units)

**Goal**: Integrate depth layers into conversational Ask/Chat experience.

**Deliverables**:
1. **Conversational Depth Progression**
   - User asks: "What is gravity?"
   - System responds with Foundation layer
   - Follow-up: "Tell me more" → Deep Dive layer
   - Follow-up: "How does this relate to black holes?" → Expert layer + context

2. **Adaptive Follow-Up Generation**
   - After Foundation response, generate 2-3 contextual follow-up suggestions
   - Suggestions based on user's knowledge gaps + question intent
   - Implementation: LLM prompt with context injection

3. **Prerequisite Handling in Chat**
   - Detect if user is missing prerequisites
   - Offer inline primer: "Quick: What's Newton's Laws?" (1-min explainer)
   - Or suggest: "Learn Algebra first" with link to learning path

4. **Chat Message Enhancement**
   - Add metadata to messages: layer_type (foundation/deepDive/expert)
   - Add "Expand" button for Deep Dive/Expert layers
   - Add prerequisite tags below message

5. **Backend API: Conversational Content**
   - Endpoint: `POST /api/learn/chat/response`
   - Input: user_message, conversation_context, user_knowledge_profile
   - Output: { foundation_response, suggested_follow_ups, prerequisites_needed }

6. **Knowledge Profile Tracking**
   - Build user profile from chat interactions
   - Track: Concepts asked about, demonstrated understanding, learning style
   - Use for adaptive layer selection (show Deep Dive if user asks advanced questions)

**Testing**:
- Chat flow tests: Foundation → Deep Dive → Expert progression
- Prerequisite tests: System detects gaps and offers primers
- Follow-up tests: Suggestions are contextually relevant
- Integration tests: Chat messages store layer metadata correctly

**Acceptance Criteria**:
- ✓ Chat responses include Foundation/Deep Dive/Expert layers
- ✓ Follow-up suggestions are contextually relevant
- ✓ Prerequisite detection works in chat context
- ✓ User knowledge profile updates in real-time
- ✓ All 194+ existing tests pass

---

### PHASE 6: Learning Ladder Enhancement (Cycles 11-12, ~300 units)

**Goal**: Enhance Learning Ladder steps with depth layers and prerequisite awareness.

**Deliverables**:
1. **Ladder Step Content Expansion**
   - Each step now has: Foundation description + Deep Dive description + Expert description
   - Update database: `LearningLadderStep` table with layer columns
   - Migration: Generate Deep Dive/Expert for existing steps

2. **Prerequisite Suggestions in Ladder**
   - Display below step title: "Prerequisites: Algebra, Functions"
   - Color-coded: Green (mastered), Yellow (learning), Red (gap)
   - Tap to show quick primer or full learning path

3. **Step Unlock Logic Enhancement**
   - Current: Watch content + pass quiz = step complete
   - New: Also consider prerequisite mastery
   - Rule: If prerequisites are not mastered, show warning but allow progression

4. **Adaptive Step Depth**
   - Show Foundation by default
   - Unlock Deep Dive after passing quiz
   - Unlock Expert after completing 2+ related steps
   - Implementation: State tracking in learning store

5. **Ladder Visualization Updates**
   - Add layer indicators on each step (Foundation ○ Deep Dive ◐ Expert ●)
   - Show prerequisite chains visually (arrows connecting related steps)
   - Highlight current user position with knowledge level badge

6. **Backend API: Enhanced Ladder Generation**
   - Update endpoint to include all three layers + prerequisites
   - Endpoint: `GET /api/learn/ladder/:topicId/full`
   - Returns: Steps with layers, prerequisites, unlock conditions

**Testing**:
- Ladder generation tests: All steps have three layers
- Prerequisite tests: Correct mastery tracking
- Unlock logic tests: Deep Dive/Expert unlock at right times
- Visualization tests: Layer indicators display correctly

**Acceptance Criteria**:
- ✓ All ladder steps have Foundation/Deep Dive/Expert content
- ✓ Prerequisite suggestions display correctly
- ✓ Layer unlock logic works as expected
- ✓ Visualization is clear and intuitive
- ✓ All 194+ existing tests pass

---

### PHASE 7: Content Summary Enrichment (Cycles 13-14, ~300 units)

**Goal**: Enhance in-app content summaries with depth layers and context.

**Deliverables**:
1. **Content Summary Redesign**
   - Current: Title + summary + key points
   - New: Foundation layer (current summary) + Deep Dive layer (mechanisms + context) + Expert layer (research + advanced)
   - UI: Tabbed interface or expandable sections

2. **Context Enrichment**
   - Add "Why This Matters" section (real-world relevance)
   - Add "How It Connects" section (related concepts + prerequisites)
   - Add "Go Deeper" section (Expert resources, research papers)

3. **Prerequisite Display**
   - Show at top: "Prerequisites: [badges]"
   - Color-coded: Green/Yellow/Red based on user mastery
   - Tap to show quick primer

4. **Interactive Elements**
   - "Explain Simpler" button → regenerate Foundation layer
   - "Tell Me More" button → show Deep Dive layer
   - "Advanced" button → show Expert layer
   - "Learn Prerequisites" button → offer quick primers

5. **Backend API: Enriched Content Summary**
   - Endpoint: `GET /api/learn/content/:contentId/summary`
   - Input: user_id (for personalized prerequisites)
   - Output: { foundation, deepDive, expert, prerequisites, relatedConcepts, whyMatters }

6. **Content Caching**
   - Cache enriched summaries for 7 days
   - Invalidate on content update or user knowledge profile change

**Testing**:
- Summary generation tests: All content has enriched summaries
- Prerequisite tests: Correct mastery display
- Interaction tests: Buttons trigger correct layers
- Caching tests: Cache invalidation works correctly

**Acceptance Criteria**:
- ✓ All content summaries have Foundation/Deep Dive/Expert layers
- ✓ Prerequisites display with correct color coding
- ✓ Interactive buttons work as expected
- ✓ Caching reduces API calls by 80%+
- ✓ All 194+ existing tests pass

---

### PHASE 8: Testing, Refinement & Delivery (Cycles 15+, ~300+ units)

**Goal**: Comprehensive testing, user feedback, refinement, and final delivery.

**Deliverables**:
1. **End-to-End Testing**
   - User journey: Ask question → Get Foundation → Explore Deep Dive → Learn prerequisites → Master Expert
   - All three integration points: Ask/Chat, Learning Ladder, Content Summaries
   - Cross-platform: iOS, Android, Web

2. **Performance Testing**
   - LLM API call reduction: Target 90%+ through caching
   - Content load time: <500ms for summaries
   - Chat response time: <2s for Foundation, <3s for Deep Dive

3. **Quality Assurance**
   - Content quality review: Human spot-check of 50+ concepts across all layers
   - Prerequisite accuracy: Validate against domain experts (sample 10 topics)
   - UI/UX testing: Usability testing with 5-10 users

4. **Bug Fixes & Refinement**
   - Address any issues from QA and user testing
   - Optimize LLM prompts based on content quality feedback
   - Refine adaptive triggering rules based on user behavior

5. **Documentation**
   - API documentation for all new endpoints
   - User guide: How to explore Foundation/Deep Dive/Expert layers
   - Developer guide: How to extend knowledge graph

6. **Deployment & Monitoring**
   - Deploy to production in phases (10% → 50% → 100%)
   - Monitor: LLM API costs, cache hit rates, user engagement with layers
   - Rollback plan if issues arise

**Acceptance Criteria**:
- ✓ All end-to-end flows work correctly
- ✓ Performance targets met (LLM calls, load times, response times)
- ✓ Content quality passes human review
- ✓ All 194+ existing tests pass + new tests for depth system
- ✓ Zero critical bugs in production
- ✓ User engagement with layers >60% (users explore Deep Dive/Expert)

---

## Incremental Delivery Strategy

Each phase delivers a working feature that can be deployed independently:

| Cycle | Phase | Deliverable | Users See |
|-------|-------|-------------|-----------|
| 1-2 | 1 | Knowledge graph + prerequisite generation | (Backend only, no UI changes) |
| 3-4 | 2 | Adaptive assessment engine | (Backend only, no UI changes) |
| 5-6 | 3 | Multi-layer content generation | (Backend only, no UI changes) |
| 7-8 | 4 | Parallel presentation UI | Expandable Foundation/Deep Dive/Expert cards |
| 9-10 | 5 | Ask/Chat integration | Depth layers in chat, follow-up suggestions |
| 11-12 | 6 | Learning Ladder enhancement | Ladder steps with layers + prerequisites |
| 13-14 | 7 | Content summary enrichment | Rich context in content detail screens |
| 15+ | 8 | Testing & refinement | Bug fixes, performance optimization |

---

## Success Metrics

1. **Content Depth**: Users spend 30%+ more time on content (exploring layers)
2. **Learning Outcomes**: Quiz accuracy improves by 15%+ (better understanding)
3. **Prerequisite Awareness**: 70%+ of users follow prerequisite suggestions
4. **Engagement**: 60%+ of users explore Deep Dive/Expert layers
5. **Adaptive Accuracy**: Gap detection identifies missing prerequisites with >80% accuracy
6. **Performance**: LLM API calls reduced by 90%+ through caching

---

## Notes

- **LLM Costs**: Phases 1, 3, 5, 6, 7 involve LLM calls. Caching strategy is critical to keep costs down.
- **Database Size**: Prerequisite graph could grow large (500 concepts × 5-10 prerequisites each = 2,500-5,000 edges). Indexes are essential.
- **User Privacy**: Knowledge profiles are stored locally (AsyncStorage) by default. Cloud sync is optional.
- **Extensibility**: System is designed to support new topics/concepts without code changes (LLM-generated prerequisites).
