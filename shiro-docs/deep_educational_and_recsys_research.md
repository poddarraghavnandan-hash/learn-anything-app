# Shiro: Advanced Educational Theory & Deep RecSys Architecture

The initial theories (Bloom’s Taxonomy, Ebbinghaus Forgetting Curve) serve as a good conceptual baseline, but they are insufficient for engineering a bleeding-edge algorithmic engine. To build Shiro, we must utilize advanced cognitive science and the exact mathematical architectures powering modern hyperscale recommendation systems.

This document details the deep academic and technical research required to execute the engine.

---

## PART I: Deep Educational Theory

To replace traditional schooling, Shiro must mathematically codify advanced learning theories that go far beyond rote memorization.

### 1. Cognitive Load Theory (Sweller, 1988)
Human working memory is severely limited (typically holding 4-7 discrete "chunks" of information). Sweller identified three types of cognitive load:
*   **Intrinsic Load:** The inherent difficulty of the subject itself (e.g., Quantum Mechanics has high intrinsic load).
*   **Extraneous Load:** Information or UI that distracts working memory (e.g., confusing navigation, unnecessary text).
*   **Germane Load:** The actual cognitive work required to build permanent mental models (schemas) in long-term memory.

**The Shiro Application:** The Polymorphic TikTok scroll is the ultimate weapon against Extraneous Load. By removing all navigation, menus, and choices, the UI reduces extraneous load to **zero**. This frees up 100% of the user's working memory capacity to handle the Intrinsic Load of the educational content (Germane Load). The dopamine hook (the "viral song") masks the effort required for Germane processing.

### 2. Interleaving vs. Blocked Practice (Rohrer, 2012)
Traditional curriculums use "Blocked Practice": `AAABBBCCC` (Study Gravity for 3 days, then Mass for 3 days). Studies show this leads to rapid short-term performance but catastrophic long-term forgetting, because the brain doesn't learn how to *discriminate* between concepts.
Interleaved Practice uses `ABCBCACAB`.

**The Shiro Application:** This is the scientific justification for the **Learning Overlap Constraint**. A user scrolling Shiro thinks they are watching random entertaining videos, but the algorithm is strictly Interleaving concepts. The brain is forced to retrieve the "Mass" schema while watching a video about "Black Holes", then immediately retrieve "Velocity" during a racing video. This constant contextual switching creates unshakeable long-term retrieval strength.

### 3. Deep Knowledge Tracing (Piech et al., 2015 - Stanford)
Traditional systems use Bayesian Knowledge Tracing (BKT), an outdated Hidden Markov Model tracking mastery on a per-skill basis independently.
Deep Knowledge Tracing (DKT) uses Recurrent Neural Networks (RNNs) or Transformers to model the complex biological state of the student's brain. It recognizes that failing an algebra game affects the probability of understanding a physics video.

**The Shiro Application:** Shiro will not use simple FSRS/SM-2 spaced repetition. It will employ a **Transformer-based DKT model**. The model takes the user's entire sequence of interactions (swipes, micro-game successes, hesitations) and outputs a continuous high-dimensional vector representing their overarching Knowledge State.

---

## PART II: Deep Recommendation Systems (RecSys) Architecture

To balance TikTok-level engagement (`P(Watch)`) with pedagogical necessity (`P(Mastery Gain)`), we must utilize the actual architectures of hyperscale ML systems.

### 1. The Core Infrastructure (Two-Tower to Multi-Tower)
A modern recommendation system operates in two stages: **Retrieval** (filtering 1 billion items down to 1,000) and **Ranking** (scoring those 1,000 to pick the single next item in the scroll).

**The Shiro Retrieval Towers:**
*   **User Tower (SASRec - Self-Attentive Sequential Recommendation):** A transformer model that looks at the sequence of the last 100 things the user scrolled, producing a dense vector embedding representing their exact cognitive and attentional state *right now*.
*   **Item Tower:** Produces a vector embedding for the content wrapper (e.g., a 30s video vs a JSON Game).

Instead of a simple dot product, Shiro introduces the **Pedagogical Modulator**. The output of the DKT (Knowledge State) acts as a hard filter during Retrieval. If a video requires "Calculus" and DKT calculates the user's Calculus mastery is `< 0.3`, the Item Embedding is mathematically zeroed out before ranking.

### 2. The Ranking Function: Contextual Multi-Armed Bandits (CMAB)
Standard supervised learning is too brittle for Shiro because user preferences change dynamically (Bored vs Trance states). We must formulate the feed as a reinforcement learning problem using **Contextual Bandits (e.g., LinUCB)**.

**The Math:**
In a Bandit model, the algorithm must choose between *Exploitation* (serving content we know they will engage with to keep dopamine high) and *Exploration* (pushing a new, confusing topic to expand their Knowledge Graph).

The Shiro Reward Function (`R`) for serving an item is:
`R = w_1 * P(Dwell_Time > 15s) + w_2 * Δ Master_State`

Where:
*   `P(Dwell_Time)` is calculated via a Deep Learning Recommendation Model (DLRM).
*   `Δ Master_State` is the predicted increase in the user's DKT vector if they successfully process the item.
*   `w_1` and `w_2` are the dynamic weights mapping to the Trance State.

The Bandit uses **Thompson Sampling** to select the next item. If the algorithm is uncertain about the user's understanding of "Quarks" (high variance), Thompson Sampling naturally pushes a low-friction "Quark" video to explore and gather telemetry, continuously updating its biological model of the user.

### 3. The Cold Start Solution: Zero-Shot Preference Mapping
When a user launches the app, their SASRec sequence vector is empty.
Instead of a simple questionnaire, Shiro uses **Active Learning**. The algorithm calculates the items in the total graph that have the highest *Information Gain* (i.e., the concepts that, if answered correctly, perfectly bisect the entire Knowledge Tree). 
By serving 5 extremely polarizing rapid-fire micro-games, the system mathematically forces the user's embedding vector to converge to their true intelligence baseline in seconds.

---

### Conclusion: The Unified Mathematical Architecture
Shiro is not merely tracking "right or wrong." 
It uses a **Self-Attentive Sequence Model** to predict what format will keep the user engaged, governed by a **Deep Knowledge Tracing Transformer** that maps their biological neural connections, optimized by a **Contextual Bandit** that perfectly balances dopamine kicks with the introduction of high-friction Germane load.

This is exactly how you beat TikTok. You use their math, but you alter the Reward Function from `Time-in-App` to `Cognitive_Evolution`.
