# Shiro: Day 0 Product Specification & Technical Architecture

This document dictates the precise technical parameters and user experience for the Phase 0 Alpha Release (1,000 testers). It translates the philosophical goals of the Shiro White Paper directly into ground-truth codebase execution, explicitly resolving the ambiguities called out by the adversarial review.

---

## 1. The Day 0 User Experience (Product Flow)

### 1.1 The Frictionless Entry (Gaia First)
The user opens the application and immediately interfaces with **Gaia** (built upon the `ask.tsx` foundation). There is no static questionnaire, no rigid menus, and no intimidating diagnostic tests. 
Gaia acts as an organic conversational guide. Her primary objective in the first 45 seconds is to warmly build the user's intelligence baseline implicitly through conversation, ensuring they feel no external judgment.

### 1.2 Broad-Based Dynamic Domains
Shiro is not constraining the Alpha to a single vertical (e.g., only AP Physics). The initial ingestion loop must support a **Broad-Based Target**. 
Whether a niece wants to study for school exams, a father wants to master photography, or a mother wants to understand art history, Gaia accepts the intent and triggers the dynamic content pipeline to construct the curriculum on the fly.

### 1.3 The Polymorphic Feedback Loop
Gaia is not merely a text chatbot; she is the orchestrator of the UI. She actively overlays the Polymorphic feed elements. The user will be seamlessly transitioned from conversational text into a high-latency-free video burst, followed immediately by an interactive JSON-based UI game (the "Ah-Ha" feedback loop), and brought back into Gaia's guidance.

---

## 2. Technical Stack & Architecture Decisions

To execute this viably on Day 0 without burning massive capital, the system relies on a bifurcated AI pipeline and leverages existing bootstrapping infrastructure.

### 2.1 Dual-LLM Orchestration
Shiro will explicitly utilize a two-brain system to balance cost, speed, and complex reasoning:
*   **Gemini (The Heavy Lifter):** Responsible for high-volume content ingestion, parsing messy YouTube transcripts, summarizing context, and generating the heavy JSON schemas required for the interactive UI cards.
*   **Claude (The Synapse):** Responsible for complex pedagogical logic, maintaining conversational state, governing Gaia's personality, and evaluating the underlying Heuristic rules (deciding exactly *when* to show a video vs a game).

### 2.2 Database & Platform Infrastructure
*   **Database:** The application will retain its current database setup utilizing **Drizzle ORM** (`server/db.ts`) for managing user telemetry, mastery arrays, and content caching mapping.
*   **Deployment Pipeline:** The application will temporarily retain its dependency on the **Manus** platform. This allows the team to bypass rebuilding Authentication and deployment pipelines, accelerating the timeline to get the Alpha into the hands of the first 1,000 testers.

### 2.3 The Content Layer & Hardware Constraints
*   **Layer B Proxy:** As established in the protocol, the system will utilize the proxy to serve raw video streams directly into `expo-video`. This is non-negotiable to maintain a 60fps frame rate on cheap, lower-tier Android phones.
*   **The Heuristic Evaluation Engine:** Because a Transformer-based DKT needs thousands of interaction sequences to train its vectors, Day 0 relies on a hardcoded deterministic engine driven by Claude. *(Example: If Dwell Time < 3s OR 2 failed attempts -> Trigger Difficulty De-escalation).*
