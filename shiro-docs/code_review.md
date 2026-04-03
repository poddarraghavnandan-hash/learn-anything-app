# Shiro (Learn Anything App) Code Review

Here is the code review for the `learn-anything-app` based on a deep dive into its architecture and core files.

## 🏗️ 1. Architecture & Tech Stack

**Rating:** ⭐️⭐️⭐️⭐️⭐️ 

**Overview:** The project is well-thought-out, utilizing an excellent and modern monorepo stack:
- **Frontend**: React Native, Expo 54, React Native 0.81, Expo Router, NativeWind V4, and TanStack Query.
- **Backend**: Express + tRPC (v11.7) running via TSX, Drizzle ORM, MySQL.
- **AI Integrations**: Deep integration with `@anthropic-ai/sdk` and `@google/generative-ai`.

**Strengths:**
- **End-to-End Type Safety**: Unifying the mobile frontend and the backend logic using **tRPC** is a fantastic choice. It eliminates an entire class of serialization/typing bugs between the client and API.
- **Cross-Platform Readiness**: By implementing `app/_layout.tsx` safely around `SafeAreaProvider`, `GestureHandlerRootView`, and using NativeWind, the app correctly spans iOS, Android, and Web effortlessly.
- **Ambitious Pedagogical Design**: The knowledge graph modeling in `server/db.ts` (e.g., `concepts`, `conceptRelationships`, `conceptPrerequisites`, `stuckPointBaselines`) and adaptive algorithms described in your architectural docs are incredibly well-modeled.

## ⚠️ 2. Areas for Improvement (Code Organization)

While the feature density is impressive, there is a major architectural anti-pattern that needs attention: **The "God Object" Router**.

### The `server/routers.ts` Monolith
The `server/routers.ts` file is **almost 2,000 lines long (96 KB)**. It contains routing logic, raw systemic AI prompts, direct LLM invocations, fallbacks, and YouTube search integrations all in one file. 

**Why this is an issue:**
1. **Testability**: You cannot unit-test the prompt generation or fallback logic without spinning up an entire tRPC context.
2. **Maintainability**: If multiple developers work on this, merge conflicts in `routers.ts` will become a nightmare. 
3. **Readability**: Finding a specific router means scrolling through hundreds of lines of string templates (e.g., `LEARNLM_SYSTEM` prompt, `getLevelPrompt` switch statement, etc.).

*Note: It looks like an effort to split the router has already begun (e.g., `routers-adaptive`, `routers-content`, `routers-chat`). Finishing this migration should be a top priority.*

### Embedded LLM Prompts
AI Prompt engineering is tightly coupled with your API endpoints. For example, `LEARNLM_SYSTEM` and specific JSON response format prompts are hardcoded inside `.mutation` blocks inside `routers.ts`. 

## 🛠️ 3. Targeted Recommendations

### Refactor LLM Services & Prompts
Move the AI logic outside of the tRPC router and into a dedicated `services` or `prompts` folder.

**Before (Current State):**
```typescript
generate: publicProcedure
  .input(z.object({...}))
  .mutation(async ({ input }) => {
    const response = await invokeLLM({
      messages: [{ role: "system", content: "You are designing a LEARNING JOURNEY..." }]
    });
    // JSON Parsing...
  })
```

**After (Proposed Structure):**
```typescript
// server/prompts/learn-lm.ts
export const LEARNLM_SYSTEM = \`...\`;
export function buildLearningJourneyPrompt(learnerContext) { return \`...\`; }

// server/services/learning-journey.service.ts
export async function generateLearningJourney(input) {
  // Call LLM, parse JSON, execute fallback logic...
  return parsedResult;
}

// server/routers/chat.router.ts
generate: publicProcedure
  .input(z.object({...}))
  .mutation(async ({ input }) => generateLearningJourney(input))
```

### Static Fallback Refactoring
In routes like `curiosityCheck`, if the `invokeLLM` throws, the system returns a static JSON fallback. While handling failure gracefully is great, these heavy static objects clutter the router. Move fallbacks to a dedicated constant mapping (e.g., `server/fallbacks/curiosityCheck.ts`).

### Code Formatting & Imports
Consider using barrels (i.e. `index.ts` files) inside your `server/_core` and `server/services` to clean up the import headers. Since `server/db.ts` acts as a central access file, it should export individual repositories to avoid having one gigantic database wrapper.

## 🏁 Conclusion

You are building an incredibly sophisticated educational tool. The database schemas are resilient, your choice of technologies ensures high performance and type safety, and the vision detailed in the Architecture docs is extremely robust. 

Dedicating a quick sprint to decouple your LLM Prompting Logic from your API Routing (resolving the massive `server/routers.ts` file) will make the project much simpler to scale and maintain as you continue to iterate.
