# Bug Review — Gamification Flow, Video & Text Layout

## Bugs Found from Code Review

### 1. XP Popup shows multiplier=1 always (line 1185)
`<XpPopup amount={lastXpGain} multiplier={1} />` — multiplier is hardcoded to 1, so the popup never shows the actual multiplier. The `lastXpGain` already includes the multiplier math, so the popup would double-count if we pass `currentMultiplier`. Fix: either pass the real multiplier and use raw base XP, or show `lastXpGain` directly without multiplier display.

### 2. Double XP award on journey start
`startJourney` calls `awardStageXp("hook")` at line 886, but then `goToStage` also awards XP when advancing FROM a stage (line 906-911). When user advances from hook (stage 0) to foundation (stage 1), `goToStage` checks `prevStage.type !== "hook"` so it skips. This is correct. BUT — the logic skips both "hook" and "check" types. The check XP is handled in `handleCheckAnswer`, so that's fine. However, `goToStage` awards XP for the stage we're LEAVING, which means the last stage before completion never gets XP from `goToStage` — it's handled in `goNext` which calls `awardStageXp("next_steps")`. But what about the video stage? When advancing FROM video to next_steps, `goToStage` would award video XP. But `handleVideoWatch` ALSO awards video XP. This is a **double XP bug for video stage**.

### 3. Challenge timer only activates when streak >= 3
Line 938-942: `if ((state.profile.checkStreak ?? 0) >= 3)` — challenge timer only shows if user already has a 3+ streak. For first-time users, the timer never appears. This might be intentional as a "reward" but could be confusing. The design doc says it should be available always.

### 4. CheckCard doesn't reset when navigating back and forward
`CheckCard` uses local `useState` for `selected`. If user goes back from check stage and returns, the component remounts (because of the `key={stage-${currentStageIdx}}` on the Animated.View), so this should be OK. But `checkAnswered` state in the parent is not reset when going back to a check stage and then forward again. Actually, `goToStage` does `setCheckAnswered(false)` — so this is fine.

### 5. currentMultiplier is stale
Line 706: `const currentMultiplier = getStreakMultiplier(state.profile.checkStreak ?? 0);` — this is computed at render time from the store. But `awardStageXp` uses `currentMultiplier` via closure. After answering a check correctly, the dispatch `RECORD_CHECK_RESULT` updates the store, but `currentMultiplier` won't update until next render. So the XP awarded for stages AFTER the check will use the OLD multiplier. This is a **stale multiplier bug**.

### 6. Video stage XP double-award
As noted in #2: `handleVideoWatch` calls `awardStageXp("video")`, and then when user advances from video to next_steps, `goToStage` also calls `awardStageXp(prevStage.type)` which is "video" again. **Double XP for video**.

### 7. next_steps XP awarded twice on completion
`goNext` calls `awardStageXp("next_steps")` when completing the journey (line 964). But if the user is ON the next_steps stage and clicks "Complete Journey", the `goNext` function is called. However, the nav bar is hidden for next_steps (`currentStage?.type !== "next_steps"` at line 1277). So the user can only complete via the NextStepsCard paths or the completion card. Actually, the next_steps stage has no "Continue" button because the nav bar is hidden. So the user can only start a new journey from the paths. This means `goNext` is never called from next_steps. But wait — when advancing FROM the stage BEFORE next_steps (video) to next_steps, `goToStage` is called, not `goNext`. And `goNext` is only called when `nextIdx >= activeJourney.stages.length`. So if user is on stage 5 (video, index 5) and clicks Continue, `goNext` calls `goToStage(6)` which is next_steps. Then on next_steps, the nav bar is hidden. The user picks a path which calls `handleNextStepSelect`. But the journey is never "completed" — the user just starts a new one. The `goNext` completion logic (line 953-980) only triggers when `nextIdx >= stages.length`, which would be index 7 for a 7-stage journey. But the last stage is index 6 (next_steps). So if user is on index 5 (video) and clicks Continue, nextIdx=6 which is < 7, so it goes to next_steps. The journey never completes via goNext. **Journey completion never triggers!**

### 8. Foundation card missing keyTakeaway support
FoundationCard doesn't render `stage.keyTakeaway` even though the backend may include it. Only ExplanationCard renders it.

### 9. isDark detection is fragile
Line 677: `const isDark = colors.background === "#0A0A14" || colors.background.startsWith("#0");` — this will match any hex starting with #0 including light colors like #0a7ea4. Should use the color scheme hook instead.

### 10. XP popup position overlaps with header
XP popup at `top: 60` may overlap with the header content, especially on smaller screens.

### 11. No way to complete journey if user doesn't pick a next path
On the next_steps stage, the nav bar is hidden. The only actions are picking a follow-up path. There's no "I'm done" or "Complete Journey" button. The journey stays incomplete forever.

## Summary of Critical Bugs
1. **Double XP for video stage** (handleVideoWatch + goToStage both award)
2. **Journey never completes** (goNext completion logic unreachable)
3. **Stale multiplier** after check answer
4. **isDark detection broken** for some color values
5. **No completion path** if user doesn't want to follow up
6. **Foundation card missing keyTakeaway**
7. **XP popup always shows multiplier=1**
