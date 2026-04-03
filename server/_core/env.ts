export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

/**
 * Validate required environment variables at startup.
 * Call this once from the server entrypoint.
 */
export function validateEnv(): void {
  const required: Array<[string, string]> = [
    ["BUILT_IN_FORGE_API_URL", ENV.forgeApiUrl],
    ["BUILT_IN_FORGE_API_KEY", ENV.forgeApiKey],
  ];

  const missing = required.filter(([, val]) => !val).map(([name]) => name);

  if (missing.length > 0) {
    console.warn(`[ENV] Missing recommended env vars: ${missing.join(", ")}. LLM calls will fail.`);
  }

  // Warn about legacy direct SDK keys (should use Forge proxy instead)
  const legacyKeys = ["ANTHROPIC_API_KEY", "CLAUDE_API_KEY", "GEMINI_API_KEY"];
  const activeLegacy = legacyKeys.filter((k) => process.env[k]);
  if (activeLegacy.length > 0) {
    console.warn(`[ENV] Legacy direct SDK keys detected: ${activeLegacy.join(", ")}. Prefer routing through ai-orchestrator.ts → Forge proxy.`);
  }
}
