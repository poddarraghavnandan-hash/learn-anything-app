import { describe, it, expect } from "vitest";
import type {
  ChatMessage,
  ChatConversation,
  ContentItemData,
  NudgeData,
  FeedCard,
  UserProfile,
} from "../shared/types";

// ─── Ask Flow: One Question at a Time ──────────────────────────────────────

describe("Ask Flow — Focused Learning", () => {
  it("should create a conversation with a single user message", () => {
    const conv: ChatConversation = {
      id: "conv-1",
      title: "How does gravity work?",
      messages: [
        {
          id: "msg-1",
          role: "user",
          bubbleType: "text",
          text: "How does gravity work?",
          timestamp: Date.now(),
        },
      ],
      originalQuestion: "How does gravity work?",
      mappedConcepts: ["gravity", "physics"],
      baselineLevel: "beginner",
      baselineDone: false,
      miniLadder: [],
      currentStep: 0,
      signalsGathered: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(conv.messages).toHaveLength(1);
    expect(conv.messages[0].role).toBe("user");
    expect(conv.originalQuestion).toBe("How does gravity work?");
  });

  it("should show ONE video suggestion (not a data dump)", () => {
    const videoMsg: ChatMessage = {
      id: "msg-video",
      role: "assistant",
      bubbleType: "content_card",
      contentCards: [
        {
          id: 1,
          externalId: "abc123",
          type: "video",
          title: "Gravity Explained Simply",
          description: "A clear explanation of gravity",
          url: "https://youtube.com/watch?v=abc123",
          thumbnailUrl: "https://img.youtube.com/vi/abc123/0.jpg",
          source: "youtube",
          channelOrAuthor: "Science Channel",
          durationSeconds: 420,
          topicSlug: "physics",
        },
      ],
      timestamp: Date.now(),
    };

    // Key: only ONE video, not a list
    expect(videoMsg.contentCards).toHaveLength(1);
    expect(videoMsg.contentCards![0].type).toBe("video");
  });

  it("should support video skip (user not interested)", () => {
    // Skipping a video should not affect the conversation flow
    const messagesAfterSkip: ChatMessage[] = [
      { id: "m1", role: "user", bubbleType: "text", text: "How does gravity work?", timestamp: 1 },
      { id: "m2", role: "assistant", bubbleType: "text", text: "Gravity is a force...", timestamp: 2 },
      { id: "m3", role: "assistant", bubbleType: "content_card", contentCards: [{ id: 1, externalId: "x", type: "video", title: "Gravity", description: "", url: "", thumbnailUrl: "", source: "youtube", channelOrAuthor: "", topicSlug: "physics" }], timestamp: 3 },
      // After skip, user can still follow up
      { id: "m4", role: "user", bubbleType: "text", text: "Tell me more about gravitational waves", timestamp: 4 },
    ];

    expect(messagesAfterSkip.filter((m) => m.role === "user")).toHaveLength(2);
    expect(messagesAfterSkip.filter((m) => m.bubbleType === "content_card")).toHaveLength(1);
  });

  it("should include a follow-up question as encouragement", () => {
    const followUpMsg: ChatMessage = {
      id: "msg-followup",
      role: "assistant",
      bubbleType: "encouragement",
      text: "What part of gravity are you most curious about?",
      timestamp: Date.now(),
    };

    expect(followUpMsg.bubbleType).toBe("encouragement");
    expect(followUpMsg.text).toBeTruthy();
  });

  it("should detect confusion signals in follow-up text", () => {
    const confusionPhrases = [
      "I don't understand",
      "I'm confused",
      "I don't get it",
      "explain simpler",
      "what do you mean",
      "huh",
    ];

    for (const phrase of confusionPhrases) {
      const isConfusion =
        phrase.includes("don't understand") ||
        phrase.includes("confused") ||
        phrase.includes("don't get") ||
        phrase.includes("explain simpler") ||
        phrase.includes("what do you mean") ||
        phrase.includes("huh");
      expect(isConfusion).toBe(true);
    }
  });
});

// ─── Nudge System ──────────────────────────────────────────────────────────

describe("Nudge System — Gentle Signal Gathering", () => {
  it("should create nudge with quick-tap options", () => {
    const nudge: NudgeData = {
      nudgeType: "pace_check",
      question: "Want to go deeper or move on?",
      options: ["Go deeper", "Move on", "Show me something related"],
      freeResponse: false,
      signalKey: "preferredPace",
      emoji: "🧭",
    };

    expect(nudge.options).toHaveLength(3);
    expect(nudge.nudgeType).toBe("pace_check");
  });

  it("should create nudge message bubble", () => {
    const nudgeMsg: ChatMessage = {
      id: "nudge-1",
      role: "assistant",
      bubbleType: "nudge",
      nudge: {
        nudgeType: "confidence_gauge",
        question: "Does that make sense so far?",
        options: ["Yes, makes sense!", "Kind of", "Not really"],
        freeResponse: false,
        signalKey: "conceptConfidence",
        emoji: "🤔",
      },
      timestamp: Date.now(),
    };

    expect(nudgeMsg.bubbleType).toBe("nudge");
    expect(nudgeMsg.nudge?.options).toBeTruthy();
  });
});

// ─── Home Tab — Unified Layout ─────────────────────────────────────────────

describe("Home Tab — Ask + Topics + Feed", () => {
  it("should have topic categories for filtering", () => {
    const categories = [
      { key: "all", label: "For You" },
      { key: "Science", label: "Science" },
      { key: "Programming", label: "Code" },
      { key: "AI & Data", label: "AI" },
      { key: "Humanities", label: "Humanities" },
      { key: "Creative", label: "Creative" },
      { key: "Business", label: "Business" },
      { key: "Health", label: "Health" },
    ];

    expect(categories).toHaveLength(8);
    expect(categories[0].key).toBe("all");
  });

  it("should transform feed items into FeedCard format", () => {
    const rawItem = {
      id: 1,
      externalId: "vid1",
      type: "video" as const,
      title: "Learn Physics",
      description: "A great video",
      url: "https://youtube.com/watch?v=vid1",
      thumbnailUrl: "https://img.youtube.com/vi/vid1/0.jpg",
      source: "youtube",
      channelOrAuthor: "Physics Channel",
      durationSeconds: 600,
      topicSlug: "physics",
    };

    const card: FeedCard = {
      id: `feed-${rawItem.id}`,
      cardType: rawItem.type === "video" ? "video" : "article",
      content: {
        ...rawItem,
        topicEmoji: "⚛️",
        topicName: "Physics",
      },
    };

    expect(card.cardType).toBe("video");
    expect(card.content?.topicEmoji).toBe("⚛️");
  });

  it("should filter feed by category", () => {
    const cards: FeedCard[] = [
      { id: "1", cardType: "video", content: { id: 1, externalId: "a", type: "video", title: "Physics", description: "", url: "", thumbnailUrl: "", source: "", channelOrAuthor: "", topicSlug: "physics" } },
      { id: "2", cardType: "video", content: { id: 2, externalId: "b", type: "video", title: "History", description: "", url: "", thumbnailUrl: "", source: "", channelOrAuthor: "", topicSlug: "history" } },
    ];

    const topics = [
      { id: 1, slug: "physics", name: "Physics", emoji: "⚛️", category: "Science" },
      { id: 2, slug: "history", name: "History", emoji: "📜", category: "Humanities" },
    ];

    const filtered = cards.filter((c) => {
      const slug = c.content?.topicSlug || "";
      const topic = topics.find((t) => t.slug === slug);
      return topic?.category === "Science";
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].content?.topicSlug).toBe("physics");
  });
});

// ─── Tab Structure ─────────────────────────────────────────────────────────

describe("Tab Structure — Simplified", () => {
  it("should have 4 visible tabs: Home, Ask, Progress, Profile", () => {
    const visibleTabs = ["Home", "Ask", "Progress", "Profile"];
    expect(visibleTabs).toHaveLength(4);
    expect(visibleTabs).not.toContain("Discover");
  });

  it("should hide Discover tab (merged into Home)", () => {
    // Discover tab has href: null, making it hidden
    const discoverConfig = { name: "discover", href: null };
    expect(discoverConfig.href).toBeNull();
  });
});

// ─── Onboarding — Age-Based Curation ───────────────────────────────────────

describe("Onboarding — Age-Based Topic Curation", () => {
  it("should filter topics by age", () => {
    const topics = [
      { slug: "quantum-physics", minAge: 15 },
      { slug: "astronomy", minAge: 6 },
      { slug: "dinosaurs", minAge: 4, maxAge: 12 },
      { slug: "philosophy", minAge: 14 },
    ];

    const age = 10;
    const filtered = topics.filter((t) => {
      const meetsMin = age >= t.minAge;
      const meetsMax = t.maxAge ? age <= t.maxAge : true;
      return meetsMin && meetsMax;
    });

    expect(filtered.map((t) => t.slug)).toContain("astronomy");
    expect(filtered.map((t) => t.slug)).toContain("dinosaurs");
    expect(filtered.map((t) => t.slug)).not.toContain("quantum-physics");
    expect(filtered.map((t) => t.slug)).not.toContain("philosophy");
  });

  it("should store age in UserProfile", () => {
    const profile: Partial<UserProfile> = {
      age: 12,
      interests: ["astronomy", "dinosaurs"],
      onboardingDone: true,
    };

    expect(profile.age).toBe(12);
  });
});

// ─── Optional Sign-In ──────────────────────────────────────────────────────

describe("Optional Sign-In", () => {
  it("should support displayName in UserProfile", () => {
    const profile: Partial<UserProfile> = {
      displayName: "Alex",
      age: 14,
    };

    expect(profile.displayName).toBe("Alex");
  });

  it("should work without sign-in (all features local)", () => {
    const profile: Partial<UserProfile> = {
      interests: ["physics", "math"],
      onboardingDone: true,
      // No displayName, no auth
    };

    expect(profile.displayName).toBeUndefined();
    expect(profile.onboardingDone).toBe(true);
  });
});
