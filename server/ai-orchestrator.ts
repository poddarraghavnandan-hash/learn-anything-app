import { invokeLLM, InvokeParams, InvokeResult } from "./_core/llm";

type ModelStrategy = "content" | "reasoning";

/**
 * The Dual-LLM Orchestrator. 
 * Resolves which model to use based on the specific Shiro cognitive task.
 */
export async function orchestrateLLM(strategy: ModelStrategy, params: Omit<InvokeParams, "model">): Promise<InvokeResult> {
    
    // Day 0 Specification: 
    // - Gemini 2.5 Flash is our Heavy Lifter for huge content generation and JSON extraction.
    // - Claude 3.7 Sonnet is our Synapse for pedagogical logic, logic, and heuristics.
    
    // NOTE: Manus API uses standard OpenAI compatibility formats, 
    // so we change the model string depending on the strategy.
    let targetModel = "gemini-2.5-flash"; 
    
    if (strategy === "reasoning") {
        targetModel = "claude-3-7-sonnet-20250219"; // Or whatever equivalent string Manus uses for Claude
    }
    
    console.log(`[AI-Orchestrator] Routing task via ${strategy.toUpperCase()} strategy -> Model: ${targetModel}`);

    return invokeLLM({
        ...params,
        model: targetModel,
    });
}
