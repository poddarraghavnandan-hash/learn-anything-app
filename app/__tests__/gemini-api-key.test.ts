/**
 * Gemini API Key Validation Test
 * Validates that the Gemini API key is correctly configured
 */

import { describe, it, expect } from "vitest";

describe("Gemini API Key Configuration", () => {
  it("should have GEMINI_API_KEY environment variable set", () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
    expect(apiKey?.length).toBeGreaterThan(10);
  });

  it("should have a valid API key format", () => {
    const apiKey = process.env.GEMINI_API_KEY;
    // Gemini API keys are alphanumeric strings
    expect(apiKey).toMatch(/^[a-zA-Z0-9_-]+$/);
  });

  it("should not be a placeholder value", () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey).not.toMatch(/^(YOUR_|TO_BE_|REPLACE_|PLACEHOLDER_|test|demo)/i);
  });

  it("should be at least 20 characters long (typical for API keys)", () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey!.length).toBeGreaterThanOrEqual(20);
  });
});
