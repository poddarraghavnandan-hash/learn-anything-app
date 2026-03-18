# Comprehensive Bug Audit — March 18, 2026

## Code Review of ask.tsx (2537 lines)

### Bug 1: CRITICAL — "Complete Journey" button text on last stage nav bar is misleading
**Location:** Lines 2051-2055
**Issue:** The nav bar shows "Complete Journey" when `isLastStage` is true, but the actual completion is handled by the NextStepsCard's `onComplete` button. When the last stage is `next_steps`, the nav bar is hidden (line 2015), so this is only a problem if `next_steps` isn't the last stage. However, if the LLM returns stages in a different order, the nav bar "Complete Journey" button calls `goNext` which does nothing (no next stage). This is a dead-end.
**Fix:** The nav bar "Complete Journey" should call `handleCompleteJourney` instead of `goNext` when `isLastStage`.

### Bug 2: MEDIUM — Prior knowledge stage allows Back button
**Location:** Lines 2015-2019
**Issue:** The nav bar is hidden for `prior_knowledge` and `next_steps` stages. But `goPrev` (line 1494) allows going back to index 0 (the prior_knowledge stage) from stage 1 (hook). Once back on prior_knowledge, the user sees the card again but the questions are already answered — the `onComplete` callback won't re-trigger the journey generation.
**Fix:** Prevent going back to prior_knowledge stage — set minimum back index to 1 when prior_knowledge is stage 0.

### Bug 3: MEDIUM — goToStage skips XP for hook stage
**Location:** Lines 1446-1450
**Issue:** `goToStage` skips XP for `hook`, `check`, and `video` stages when advancing. But hook XP is never awarded anywhere else — the comment says "hook is awarded at start" but there's no code that awards hook XP at journey start. Only `awardStageXp("prior_knowledge")` is called in `handlePriorKnowledgeComplete`.
**Fix:** Award hook XP when the hook stage is first displayed (when journey starts or after prior knowledge completes).

### Bug 4: LOW — Challenge timer restarts on stage re-entry
**Location:** Lines 1476-1480
**Issue:** If user goes to check stage, starts answering, goes back, then returns to check stage, the timer restarts. The `checkAnswered` state is also reset (line 1454). This means the user could exploit going back and forth to reset the timer.
**Fix:** Track which check stages have been answered and don't reset timer/answered state on re-entry.

### Bug 5: LOW — depthMap persists across stage regeneration but not journey resume
**Location:** handleResumeJourney (line 1665)
**Issue:** When resuming a journey, `depthMap` is not restored — it starts empty. If the user had Tell Me More depth on a stage, it's lost on resume.
**Fix:** Either persist depthMap in the journey or accept this as expected behavior (minor).

### Bug 6: LOW — Stale closure in pause timer useEffect
**Location:** Lines 1694-1715
**Issue:** The useEffect depends on `currentStageIdx`, `activeJourney?.id`, and `showCompletion`, but references `currentStage` which is derived. If `currentStage` changes without `currentStageIdx` changing (e.g., after regen), the timer won't restart. This is actually fine since regen restarts the timer manually (line 1769-1770).
**Status:** Not a bug — handled correctly.

### Bug 7: MEDIUM — XP popup multiplier shows stale value
**Location:** Line 2906 (XpPopup rendering)
**Issue:** `currentMultiplierRef.current` is used for the popup, but the multiplier is based on `state.profile.checkStreak`. After `RECORD_CHECK_RESULT` dispatch, the state updates asynchronously, so the ref might show the old multiplier during the popup.
**Status:** Minor visual glitch — the XP amount itself is correct since it's computed before dispatch.

### Bug 8: LOW — videoContext margin style missing
**Location:** VideoCard component
**Issue:** `videoContext` style is referenced in the VideoCard but may not be defined in StyleSheet. Need to verify.
**Fix:** Check and add if missing.

## Code Review of Other Files

### shared/types.ts — No bugs found
- Types are consistent
- computeDifficultyLevel and calculateMasteryScore look correct
- JOURNEY_STAGE_XP includes all stage types including prior_knowledge

### server/routers.ts — No bugs found
- priorKnowledge endpoint generates questions correctly
- learn endpoint accepts priorKnowledgeContext
- regenStage endpoint handles depthLevel

### lib/learning-store.tsx — No bugs found
- COMPLETE_JOURNEY, RECORD_CHECK_RESULT, UPDATE_JOURNEY all look correct
- Persistence includes journeys

## Summary of Fixes Needed

| # | Severity | Bug | Fix |
|---|----------|-----|-----|
| 1 | CRITICAL | Nav bar "Complete Journey" calls goNext (dead-end) | Call handleCompleteJourney when isLastStage |
| 2 | MEDIUM | Can go back to prior_knowledge stage (broken re-entry) | Prevent goPrev from going to prior_knowledge |
| 3 | MEDIUM | Hook XP never awarded | Award hook XP when hook stage first displays |
| 4 | LOW | Challenge timer resets on check stage re-entry | Track answered check stages |
| 5 | LOW | depthMap lost on journey resume | Accept or persist |
| 8 | LOW | Possible missing videoContext style | Verify and add |
