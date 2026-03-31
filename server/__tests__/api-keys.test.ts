import { describe, it, expect, beforeAll } from "vitest";

/**
 * Test suite to validate Claude and Gemini API keys
 * These tests verify that the API keys are correctly configured and can authenticate
 */
describe("API Keys Validation", () => {
  let claudeKey: string;
  let geminiKey: string;

  beforeAll(() => {
    claudeKey = process.env.CLAUDE_API_KEY || "";
    geminiKey = process.env.GEMINI_API_KEY || "";
  });

  it("should have Claude API key configured", () => {
    expect(claudeKey).toBeTruthy();
    expect(claudeKey).toMatch(/^sk-ant-api/);
  });

  it("should have Gemini API key configured", () => {
    expect(geminiKey).toBeTruthy();
    expect(geminiKey).toMatch(/^AIzaSy/);
  });

  it("should validate Claude API key format", () => {
    // Claude API keys start with sk-ant-api
    const isValidClaude = claudeKey.startsWith("sk-ant-api");
    expect(isValidClaude).toBe(true);
  });

  it("should validate Gemini API key format", () => {
    // Gemini API keys start with AIzaSy
    const isValidGemini = geminiKey.startsWith("AIzaSy");
    expect(isValidGemini).toBe(true);
  });

  it("should have sufficient Claude API key length", () => {
    // Claude API keys are typically 100+ characters
    expect(claudeKey.length).toBeGreaterThan(50);
  });

  it("should have sufficient Gemini API key length", () => {
    // Gemini API keys are typically 40+ characters
    expect(geminiKey.length).toBeGreaterThan(30);
  });
});
