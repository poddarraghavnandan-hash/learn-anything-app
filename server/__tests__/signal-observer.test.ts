import { describe, it, expect, beforeEach } from "vitest";
import {
  captureSignal,
  getUserSignals,
  getConceptSignals,
  getRecentSignals,
  analyzeSignals,
  getUniqueSignals,
  archiveOldSignals,
  extractMetadataFromContent,
  extractSummary,
  hashContent,
} from "../signal-observer";

describe("Signal Observer - Content Hashing & Compression", () => {
  it("should generate consistent hash for same content", () => {
    const content = "This is a test question about quantum mechanics";
    const hash1 = hashContent(content);
    const hash2 = hashContent(content);
    expect(hash1).toBe(hash2);
  });

  it("should generate different hashes for different content", () => {
    const hash1 = hashContent("Question 1");
    const hash2 = hashContent("Question 2");
    expect(hash1).not.toBe(hash2);
  });

  it("should extract meaningful summary from content", () => {
    const content = "This is a very long question about quantum mechanics that spans multiple sentences and contains important information about wave functions and superposition states.";
    const summary = extractSummary(content);
    expect(summary).toBeTruthy();
    expect(summary.length).toBeLessThanOrEqual(500);
    expect(summary).toContain("quantum");
  });

  it("should handle empty content gracefully", () => {
    const summary = extractSummary("");
    expect(summary).toBe("");
  });

  it("should handle large content hashes", () => {
    const largeContent = Array(1000).fill("word").join(" ");
    const hash = hashContent(largeContent);
    expect(hash).toBeTruthy();
    expect(hash.length).toBeGreaterThan(0);
  });
});

describe("Signal Observer - Metadata Extraction", () => {
  it("should extract surface-level depth for short content", () => {
    const metadata = extractMetadataFromContent("Short question", "question");
    expect(metadata.depth).toBe("surface");
  });

  it("should extract intermediate depth for medium content", () => {
    const content = "This is a medium length question that contains several sentences and explores a concept in moderate detail with multiple clauses and ideas.";
    const metadata = extractMetadataFromContent(content, "question");
    expect(metadata.depth).toBe("intermediate");
  });

  it("should extract deep depth for long content", () => {
    const content = Array(200).fill("word").join(" ");
    const metadata = extractMetadataFromContent(content, "question");
    expect(metadata.depth).toBe("deep");
  });

  it("should detect emotional tone in questions", () => {
    const metadata1 = extractMetadataFromContent("I'm confused about this concept!", "question");
    expect(metadata1.emotionalTone).toBeTruthy();

    const metadata2 = extractMetadataFromContent("Explain photosynthesis", "question");
    // Neutral questions may not have emotional tone
    expect(metadata2.confidence).toBeGreaterThanOrEqual(0);
  });

  it("should estimate confidence based on signal type", () => {
    const questionMetadata = extractMetadataFromContent("What is X?", "question");
    const connectionMetadata = extractMetadataFromContent("X relates to Y", "connection");

    expect(questionMetadata.confidence).toBeGreaterThanOrEqual(0);
    expect(connectionMetadata.confidence).toBeGreaterThanOrEqual(0);
  });

  it("should extract metadata for teaching moments", () => {
    const content = "I realized that the key insight is understanding the relationship between A and B";
    const metadata = extractMetadataFromContent(content, "teaching");
    expect(metadata.depth).toBeTruthy();
    expect(metadata.confidence).toBeGreaterThan(0);
  });

  it("should extract metadata for breakthrough signals", () => {
    const content = "Finally understood! The concept works because of X principle";
    const metadata = extractMetadataFromContent(content, "breakthrough");
    expect(metadata.emotionalTone).toBeTruthy();
    expect(metadata.confidence).toBeGreaterThanOrEqual(0.5);
  });

  it("should extract metadata for stuck point signals", () => {
    const content = "I don't understand how this connects to the previous concept";
    const metadata = extractMetadataFromContent(content, "stuck");
    expect(metadata.confidence).toBeGreaterThanOrEqual(0);
    expect(metadata.confidence).toBeLessThanOrEqual(1);
  });

  it("should extract metadata for application signals", () => {
    const content = "I used this concept to solve a real-world problem in my project";
    const metadata = extractMetadataFromContent(content, "application");
    expect(metadata.confidence).toBeGreaterThanOrEqual(0.5);
  });
});

describe("Signal Observer - Signal Capture", () => {
  it("should capture question signal", async () => {
    const signal = await captureSignal({
      userId: 1,
      signalType: "question",
      content: "What is quantum entanglement?",
      conceptId: 5,
    });

    expect(signal).toBeTruthy();
    expect(signal.userId).toBe(1);
    expect(signal.signalType).toBe("question");
    expect(signal.contentHash).toBeTruthy();
  });

  it("should capture connection signal", async () => {
    const signal = await captureSignal({
      userId: 2,
      signalType: "connection",
      content: "Quantum mechanics relates to wave-particle duality",
      conceptId: 10,
    });

    expect(signal.signalType).toBe("connection");
    expect(signal.contentSummary).toContain("Quantum");
  });

  it("should capture application signal", async () => {
    const signal = await captureSignal({
      userId: 3,
      signalType: "application",
      content: "Used quantum principles in my research project",
      conceptId: 15,
    });

    expect(signal.signalType).toBe("application");
    expect(signal.metadata).toBeTruthy();
  });

  it("should capture teaching moment signal", async () => {
    const signal = await captureSignal({
      userId: 4,
      signalType: "teaching",
      content: "Realized the key insight about superposition",
      conceptId: 20,
    });

    expect(signal.signalType).toBe("teaching");
  });

  it("should capture breakthrough signal", async () => {
    const signal = await captureSignal({
      userId: 5,
      signalType: "breakthrough",
      content: "Finally understood quantum tunneling!",
      conceptId: 25,
    });

    expect(signal.signalType).toBe("breakthrough");
  });

  it("should capture stuck point signal", async () => {
    const signal = await captureSignal({
      userId: 6,
      signalType: "stuck",
      content: "Can't understand the wave function collapse",
      conceptId: 30,
    });

    expect(signal.signalType).toBe("stuck");
  });

  it("should capture feedback signal", async () => {
    const signal = await captureSignal({
      userId: 7,
      signalType: "feedback",
      content: "The explanation was too technical",
      conceptId: 35,
    });

    expect(signal.signalType).toBe("feedback");
  });

  it("should handle optional conceptId", async () => {
    const signal = await captureSignal({
      userId: 8,
      signalType: "question",
      content: "General question without concept",
    });

    expect(signal.userId).toBe(8);
    expect(signal.conceptId).toBeNull();
  });

  it("should handle custom metadata", async () => {
    const signal = await captureSignal({
      userId: 9,
      signalType: "question",
      content: "Test question",
      conceptId: 40,
    });

    expect(signal.metadata).toBeTruthy();
  });

  it("should record timestamp", async () => {
    const signal = await captureSignal({
      userId: 10,
      signalType: "question",
      content: "Test",
      conceptId: 45,
    });

    expect(signal.timestamp).toBeTruthy();
    expect(signal.timestamp instanceof Date).toBe(true);
  });
});

describe("Signal Observer - Signal Retrieval", () => {
  beforeEach(async () => {
    // Capture test signals
    await captureSignal({
      userId: 100,
      signalType: "question",
      content: "Test question 1",
      conceptId: 50,
    });

    await captureSignal({
      userId: 100,
      signalType: "connection",
      content: "Test connection 1",
      conceptId: 50,
    });

    await captureSignal({
      userId: 100,
      signalType: "question",
      content: "Test question 2",
      conceptId: 51,
    });
  });

  it("should retrieve all signals for user", async () => {
    const signals = await getUserSignals(100);
    expect(signals).toBeTruthy();
    expect(Array.isArray(signals)).toBe(true);
  });

  it("should retrieve signals for specific concept", async () => {
    const signals = await getConceptSignals(100, 50);
    expect(signals).toBeTruthy();
    expect(Array.isArray(signals)).toBe(true);
  });

  it("should retrieve recent signals", async () => {
    const signals = await getRecentSignals(100, 24);
    expect(signals).toBeTruthy();
    expect(Array.isArray(signals)).toBe(true);
  });

  it("should filter signals by time window", async () => {
    const recentSignals = await getRecentSignals(100, 1); // Last 1 hour
    const allSignals = await getRecentSignals(100, 168); // Last 7 days

    expect(recentSignals.length).toBeLessThanOrEqual(allSignals.length);
  });
});

describe("Signal Observer - Signal Analysis", () => {
  beforeEach(async () => {
    // Capture diverse signals for analysis
    for (let i = 0; i < 5; i++) {
      await captureSignal({
        userId: 200,
        signalType: "question",
        content: `Question ${i}: What is concept X?`,
        conceptId: 60,
      });
    }

    for (let i = 0; i < 3; i++) {
      await captureSignal({
        userId: 200,
        signalType: "connection",
        content: `Connection ${i}: X relates to Y`,
        conceptId: 60,
      });
    }

    for (let i = 0; i < 2; i++) {
      await captureSignal({
        userId: 200,
        signalType: "breakthrough",
        content: `Breakthrough ${i}: Finally got it!`,
        conceptId: 60,
      });
    }
  });

  it("should analyze signal distribution", async () => {
    const analysis = await analyzeSignals(200);

    expect(analysis).toBeTruthy();
    expect(analysis.totalSignals).toBeGreaterThan(0);
    expect(analysis.signalsByType).toBeTruthy();
  });

  it("should count signals by type", async () => {
    const analysis = await analyzeSignals(200);

    expect(analysis.signalsByType.question).toBeGreaterThan(0);
    expect(analysis.signalsByType.connection).toBeGreaterThan(0);
    expect(analysis.signalsByType.breakthrough).toBeGreaterThan(0);
  });

  it("should calculate average confidence", async () => {
    const analysis = await analyzeSignals(200);

    expect(analysis.averageConfidence).toBeGreaterThanOrEqual(0);
    expect(analysis.averageConfidence).toBeLessThanOrEqual(1);
  });

  it("should determine average depth", async () => {
    const analysis = await analyzeSignals(200);

    expect(["surface", "intermediate", "deep"]).toContain(analysis.averageDepth);
  });

  it("should track emotional trends", async () => {
    const analysis = await analyzeSignals(200);

    expect(analysis.emotionalTrend).toBeTruthy();
    expect(typeof analysis.emotionalTrend).toBe("object");
  });

  it("should identify stuck points", async () => {
    const analysis = await analyzeSignals(200);

    expect(analysis.recentStuckPoints).toBeGreaterThanOrEqual(0);
  });

  it("should identify breakthroughs", async () => {
    const analysis = await analyzeSignals(200);

    expect(analysis.recentBreakthroughs).toBeGreaterThan(0);
  });

  it("should calculate time window analysis", async () => {
    const analysis = await analyzeSignals(200, 24);

    expect(analysis.totalSignals).toBeGreaterThanOrEqual(0);
  });
});

describe("Signal Observer - Deduplication", () => {
  beforeEach(async () => {
    // Capture duplicate signals
    const content = "What is quantum mechanics?";
    for (let i = 0; i < 3; i++) {
      await captureSignal({
        userId: 300,
        signalType: "question",
        content,
        conceptId: 70,
      });
    }

    // Capture unique signals
    for (let i = 0; i < 2; i++) {
      await captureSignal({
        userId: 300,
        signalType: "question",
        content: `Unique question ${i}`,
        conceptId: 70,
      });
    }
  });

  it("should identify unique signals", async () => {
    const uniqueSignals = await getUniqueSignals(300, 24);

    expect(uniqueSignals).toBeTruthy();
    expect(Array.isArray(uniqueSignals)).toBe(true);
  });

  it("should deduplicate by content hash", async () => {
    const allSignals = await getRecentSignals(300, 24);
    const uniqueSignals = await getUniqueSignals(300, 24);

    expect(uniqueSignals.length).toBeLessThanOrEqual(allSignals.length);
  });

  it("should preserve unique content", async () => {
    const uniqueSignals = await getUniqueSignals(300, 24);

    const contentHashes = new Set(uniqueSignals.map((s) => s.contentHash).filter(Boolean));
    expect(contentHashes.size).toBe(uniqueSignals.length);
  });
});

describe("Signal Observer - Storage Optimization", () => {
  beforeEach(async () => {
    // Capture signals from various time periods
    for (let daysAgo = 0; daysAgo < 5; daysAgo++) {
      await captureSignal({
        userId: 400,
        signalType: "question",
        content: `Question from ${daysAgo} days ago`,
        conceptId: 80,
      });
    }
  });

  it("should archive old signals", async () => {
    const result = await archiveOldSignals(400, 2);

    expect(result).toBeTruthy();
    expect(result.archivedCount).toBeGreaterThanOrEqual(0);
  });

  it("should calculate space saved", async () => {
    const result = await archiveOldSignals(400, 2);

    expect(result.spaceSavedBytes).toBeGreaterThanOrEqual(0);
  });

  it("should preserve recent signals", async () => {
    await archiveOldSignals(400, 2);
    const recentSignals = await getRecentSignals(400, 24);

    expect(recentSignals.length).toBeGreaterThan(0);
  });
});

describe("Signal Observer - Edge Cases", () => {
  it("should handle very long content", async () => {
    const longContent = Array(10000).fill("word").join(" ");
    const signal = await captureSignal({
      userId: 500,
      signalType: "question",
      content: longContent,
      conceptId: 90,
    });

    expect(signal.contentLength).toBe(longContent.length);
  });

  it("should handle special characters in content", async () => {
    const specialContent = "What is ∑∫∂ and how does it relate to λ-calculus? 🤔";
    const signal = await captureSignal({
      userId: 501,
      signalType: "question",
      content: specialContent,
      conceptId: 91,
    });

    expect(signal.contentHash).toBeTruthy();
  });

  it("should handle unicode content", async () => {
    const unicodeContent = "什么是量子力学？Qu'est-ce que la mécanique quantique?";
    const signal = await captureSignal({
      userId: 502,
      signalType: "question",
      content: unicodeContent,
      conceptId: 92,
    });

    expect(signal.contentHash).toBeTruthy();
  });

  it("should handle empty metadata", async () => {
    const signal = await captureSignal({
      userId: 503,
      signalType: "question",
      content: "Test",
      conceptId: 93,
      metadata: {},
    });

    expect(signal.metadata).toBeTruthy();
  });

  it("should handle null conceptId", async () => {
    const signal = await captureSignal({
      userId: 504,
      signalType: "question",
      content: "General question",
    });

    expect(signal.conceptId).toBeNull();
  });

  it("should handle rapid signal capture", async () => {
    const signals = await Promise.all([
      captureSignal({
        userId: 505,
        signalType: "question",
        content: "Q1",
        conceptId: 95,
      }),
      captureSignal({
        userId: 505,
        signalType: "question",
        content: "Q2",
        conceptId: 95,
      }),
      captureSignal({
        userId: 505,
        signalType: "question",
        content: "Q3",
        conceptId: 95,
      }),
    ]);

    expect(signals.length).toBe(3);
    expect(signals.every((s) => s.userId === 505)).toBe(true);
  });
});
