import { describe, it, expect } from "vitest";
import type {
  ChatMessage,
  ChatConversation,
  InlineChatQuiz,
  MiniLadderStep,
} from "../shared/types";

describe("ChatMessage types", () => {
  it("creates a valid user text message", () => {
    const msg: ChatMessage = {
      id: "msg-1",
      role: "user",
      bubbleType: "text",
      text: "Why does Earth orbit the Sun?",
      timestamp: Date.now(),
    };
    expect(msg.role).toBe("user");
    expect(msg.bubbleType).toBe("text");
    expect(msg.text).toBeTruthy();
  });

  it("creates a valid assistant text message", () => {
    const msg: ChatMessage = {
      id: "msg-2",
      role: "assistant",
      bubbleType: "text",
      text: "Great question! The Earth orbits the Sun because of gravity...",
      timestamp: Date.now(),
    };
    expect(msg.role).toBe("assistant");
    expect(msg.text?.length).toBeGreaterThan(0);
  });

  it("creates a valid baseline quiz message", () => {
    const quiz: InlineChatQuiz = {
      question: "What keeps the Earth in orbit?",
      options: ["Magnetism", "Gravity", "Wind", "Dark matter"],
      correctIndex: 1,
      funFact: "Gravity travels at the speed of light!",
      emoji: "🌍",
    };
    const msg: ChatMessage = {
      id: "msg-3",
      role: "assistant",
      bubbleType: "baseline_quiz",
      quiz,
      timestamp: Date.now(),
    };
    expect(msg.bubbleType).toBe("baseline_quiz");
    expect(msg.quiz?.options).toHaveLength(4);
    expect(msg.quiz?.correctIndex).toBe(1);
  });

  it("creates a valid content card message", () => {
    const msg: ChatMessage = {
      id: "msg-4",
      role: "assistant",
      bubbleType: "content_card",
      contentCards: [
        {
          id: 1,
          externalId: "yt-abc123",
          type: "video",
          title: "Why Does Earth Orbit the Sun?",
          description: "A simple explanation of orbital mechanics",
          url: "https://www.youtube.com/watch?v=abc123",
          thumbnailUrl: "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
          source: "youtube",
          channelOrAuthor: "Science Channel",
          durationSeconds: 600,
          topicSlug: "physics",
        },
      ],
      timestamp: Date.now(),
    };
    expect(msg.contentCards).toHaveLength(1);
    expect(msg.contentCards?.[0].type).toBe("video");
  });

  it("creates a valid mini ladder message", () => {
    const steps: MiniLadderStep[] = [
      {
        order: 1,
        title: "What is Gravity?",
        description: "Understanding the force that keeps us grounded",
        realWorldConnection: "Drop a ball — it falls because of gravity",
        searchQuery: "what is gravity explained simply",
      },
      {
        order: 2,
        title: "Orbits and Circular Motion",
        description: "How objects move in circles",
        realWorldConnection: "Swing a ball on a string — that's circular motion",
        searchQuery: "orbital mechanics explained for beginners",
      },
    ];
    const msg: ChatMessage = {
      id: "msg-5",
      role: "assistant",
      bubbleType: "mini_ladder",
      miniLadder: steps,
      timestamp: Date.now(),
    };
    expect(msg.miniLadder).toHaveLength(2);
    expect(msg.miniLadder?.[0].order).toBe(1);
    expect(msg.miniLadder?.[1].realWorldConnection).toBeTruthy();
  });

  it("creates a valid encouragement message", () => {
    const msg: ChatMessage = {
      id: "msg-6",
      role: "assistant",
      bubbleType: "encouragement",
      text: "What do you think would happen if the Sun suddenly disappeared?",
      timestamp: Date.now(),
    };
    expect(msg.bubbleType).toBe("encouragement");
    expect(msg.text?.length).toBeGreaterThan(0);
  });

  it("supports all bubble types", () => {
    const types: ChatMessage["bubbleType"][] = [
      "text",
      "baseline_quiz",
      "content_card",
      "mini_ladder",
      "thinking",
      "encouragement",
    ];
    expect(types).toHaveLength(6);
  });
});

describe("ChatConversation", () => {
  it("creates a valid conversation", () => {
    const conv: ChatConversation = {
      id: "conv-1",
      title: "Why does Earth orbit the Sun?",
      messages: [],
      originalQuestion: "Why does Earth orbit the Sun?",
      mappedConcepts: ["gravity", "orbital mechanics", "centripetal force"],
      baselineLevel: "beginner",
      baselineDone: false,
      miniLadder: [],
      currentStep: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(conv.mappedConcepts).toHaveLength(3);
    expect(conv.baselineDone).toBe(false);
    expect(conv.currentStep).toBe(0);
  });

  it("tracks conversation progress", () => {
    const conv: ChatConversation = {
      id: "conv-2",
      title: "How do airplanes fly?",
      messages: [
        {
          id: "m1",
          role: "user",
          bubbleType: "text",
          text: "How do airplanes fly?",
          timestamp: Date.now(),
        },
        {
          id: "m2",
          role: "assistant",
          bubbleType: "text",
          text: "Great question! Airplanes fly because of...",
          timestamp: Date.now(),
        },
      ],
      originalQuestion: "How do airplanes fly?",
      mappedConcepts: ["lift", "aerodynamics", "Bernoulli's principle"],
      baselineLevel: "intermediate",
      baselineDone: true,
      miniLadder: [
        {
          order: 1,
          title: "Air Pressure Basics",
          description: "Understanding how air pushes on things",
          realWorldConnection: "Feel the wind on your hand out a car window",
          searchQuery: "air pressure basics explained",
        },
      ],
      currentStep: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(conv.messages).toHaveLength(2);
    expect(conv.baselineDone).toBe(true);
    expect(conv.miniLadder).toHaveLength(1);
    expect(conv.currentStep).toBe(1);
  });
});

describe("InlineChatQuiz", () => {
  it("has all required fields", () => {
    const quiz: InlineChatQuiz = {
      question: "What is the speed of light?",
      options: [
        "300,000 km/s",
        "150,000 km/s",
        "1,000,000 km/s",
        "30,000 km/s",
      ],
      correctIndex: 0,
      funFact: "Light can circle the Earth 7.5 times in one second!",
      emoji: "💡",
    };
    expect(quiz.options).toHaveLength(4);
    expect(quiz.correctIndex).toBeGreaterThanOrEqual(0);
    expect(quiz.correctIndex).toBeLessThan(4);
    expect(quiz.funFact.length).toBeGreaterThan(0);
    expect(quiz.emoji.length).toBeGreaterThan(0);
  });

  it("supports optional selectedIndex for answered state", () => {
    const quiz: InlineChatQuiz = {
      question: "Test?",
      options: ["A", "B", "C", "D"],
      correctIndex: 2,
      funFact: "Fun!",
      emoji: "🧪",
      selectedIndex: 2,
    };
    expect(quiz.selectedIndex).toBe(2);
    expect(quiz.selectedIndex).toBe(quiz.correctIndex);
  });
});

describe("MiniLadderStep", () => {
  it("has all required fields", () => {
    const step: MiniLadderStep = {
      order: 1,
      title: "Understanding Gravity",
      description: "The force that keeps everything together",
      realWorldConnection: "Why apples fall from trees",
      searchQuery: "gravity explained for beginners",
    };
    expect(step.order).toBe(1);
    expect(step.title.length).toBeGreaterThan(0);
    expect(step.searchQuery.length).toBeGreaterThan(0);
    expect(step.realWorldConnection.length).toBeGreaterThan(0);
  });
});
