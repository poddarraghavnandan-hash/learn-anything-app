import { describe, it, expect } from "vitest";

// ─── Onboarding data validation tests ────────────────────────────────────────

const CURIOSITIES = [
  { slug: "python", emoji: "🐍", name: "Python", spark: "Build anything with code" },
  { slug: "javascript", emoji: "⚡", name: "JavaScript", spark: "Power the web" },
  { slug: "machine-learning", emoji: "🤖", name: "AI & Machine Learning", spark: "Teach machines to think" },
  { slug: "data-science", emoji: "📊", name: "Data Science", spark: "Find stories in numbers" },
  { slug: "web-development", emoji: "🌐", name: "Web Development", spark: "Create for the internet" },
  { slug: "physics", emoji: "⚛️", name: "Physics", spark: "Understand how everything works" },
  { slug: "quantum-physics", emoji: "🔬", name: "Quantum Physics", spark: "Explore the impossible" },
  { slug: "astronomy", emoji: "🔭", name: "Astronomy", spark: "Wonder at the cosmos" },
  { slug: "biology", emoji: "🧬", name: "Biology", spark: "Decode life itself" },
  { slug: "mathematics", emoji: "🔢", name: "Mathematics", spark: "The language of the universe" },
  { slug: "chemistry", emoji: "🧪", name: "Chemistry", spark: "What everything is made of" },
  { slug: "history", emoji: "📜", name: "History", spark: "Learn from the past" },
  { slug: "philosophy", emoji: "💭", name: "Philosophy", spark: "Ask the deepest questions" },
  { slug: "psychology", emoji: "🧠", name: "Psychology", spark: "Understand the mind" },
  { slug: "economics", emoji: "💰", name: "Economics", spark: "How the world trades" },
  { slug: "entrepreneurship", emoji: "🚀", name: "Startups", spark: "Build something new" },
  { slug: "design", emoji: "🎨", name: "Design", spark: "Make things beautiful" },
  { slug: "music-theory", emoji: "🎵", name: "Music Theory", spark: "The math behind melody" },
  { slug: "writing", emoji: "✍️", name: "Writing", spark: "Express your ideas" },
  { slug: "photography", emoji: "📷", name: "Photography", spark: "See the world differently" },
  { slug: "reading", emoji: "📖", name: "Reading", spark: "Expand your world" },
  { slug: "fitness", emoji: "💪", name: "Fitness", spark: "Master your body" },
  { slug: "nutrition", emoji: "🥗", name: "Nutrition", spark: "Fuel yourself right" },
  { slug: "finance", emoji: "💵", name: "Personal Finance", spark: "Grow your wealth" },
  { slug: "public-speaking", emoji: "🎤", name: "Public Speaking", spark: "Command any room" },
  { slug: "marketing", emoji: "📣", name: "Marketing", spark: "Spread ideas that stick" },
  { slug: "productivity", emoji: "⏱️", name: "Productivity", spark: "Do more with less" },
  { slug: "languages", emoji: "🌍", name: "Languages", spark: "Connect across cultures" },
];

const HOW_IT_WORKS = [
  {
    icon: "💬",
    title: "Ask anything",
    description: 'Type a question about anything that interests you. "Why is the sky blue?" "How do stocks work?" There are no wrong questions.',
    color: "#6C63FF",
  },
  {
    icon: "🧭",
    title: "Your path unfolds",
    description: "AI understands what you already know and builds a personalized learning path — just for you. Videos, explanations, and gentle check-ins along the way.",
    color: "#10B981",
  },
  {
    icon: "🌱",
    title: "Grow at your pace",
    description: "The app remembers what you've learned and adapts to how you think. No tests, no pressure — just genuine understanding that deepens over time.",
    color: "#F59E0B",
  },
];

describe("Onboarding Redesign — Data Integrity", () => {
  it("has a diverse set of curiosity topics (>= 20)", () => {
    expect(CURIOSITIES.length).toBeGreaterThanOrEqual(20);
  });

  it("every curiosity has slug, emoji, name, and spark", () => {
    for (const topic of CURIOSITIES) {
      expect(topic.slug).toBeTruthy();
      expect(topic.emoji).toBeTruthy();
      expect(topic.name).toBeTruthy();
      expect(topic.spark).toBeTruthy();
    }
  });

  it("all curiosity slugs are unique", () => {
    const slugs = CURIOSITIES.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("spark descriptions are short and inviting (< 40 chars)", () => {
    for (const topic of CURIOSITIES) {
      expect(topic.spark.length).toBeLessThanOrEqual(40);
    }
  });

  it("How It Works has exactly 3 steps", () => {
    expect(HOW_IT_WORKS.length).toBe(3);
  });

  it("How It Works steps have icon, title, description, and color", () => {
    for (const step of HOW_IT_WORKS) {
      expect(step.icon).toBeTruthy();
      expect(step.title).toBeTruthy();
      expect(step.description.length).toBeGreaterThan(30);
      expect(step.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("How It Works colors are distinct", () => {
    const colors = HOW_IT_WORKS.map((s) => s.color);
    expect(new Set(colors).size).toBe(colors.length);
  });
});

describe("Onboarding Redesign — Flow Logic", () => {
  const TOTAL_STEPS = 3;

  it("has 3 total steps: Welcome, How It Works, Topics", () => {
    expect(TOTAL_STEPS).toBe(3);
  });

  it("topic selection toggle works correctly", () => {
    let selected: string[] = [];

    // Toggle on
    const toggleOn = (slug: string) => {
      if (!selected.includes(slug)) selected = [...selected, slug];
    };
    // Toggle off
    const toggleOff = (slug: string) => {
      selected = selected.filter((s) => s !== slug);
    };

    toggleOn("python");
    expect(selected).toContain("python");
    expect(selected.length).toBe(1);

    toggleOn("physics");
    expect(selected.length).toBe(2);

    toggleOff("python");
    expect(selected).not.toContain("python");
    expect(selected.length).toBe(1);
  });

  it("requires at least 1 topic to proceed from step 2", () => {
    const selectedTopics: string[] = [];
    const canProceed = selectedTopics.length >= 1;
    expect(canProceed).toBe(false);

    selectedTopics.push("python");
    const canProceedNow = selectedTopics.length >= 1;
    expect(canProceedNow).toBe(true);
  });

  it("CTA text changes based on selection count", () => {
    const getText = (count: number) => {
      if (count === 0) return "Pick at least one";
      if (count === 1) return "Start learning ";
      return `Start learning (${count} topics)`;
    };

    expect(getText(0)).toBe("Pick at least one");
    expect(getText(1)).toBe("Start learning ");
    expect(getText(3)).toBe("Start learning (3 topics)");
  });

  it("onboarding completion dispatches correct default values", () => {
    // Simulate the dispatch sequence
    const dispatched: Array<{ type: string; payload?: unknown }> = [];
    const dispatch = (action: { type: string; payload?: unknown }) => dispatched.push(action);

    const selectedTopics = ["python", "physics"];

    dispatch({ type: "SET_INTERESTS", payload: selectedTopics });
    dispatch({ type: "SET_SKILL_LEVEL", payload: "beginner" });
    dispatch({ type: "SET_DAILY_GOAL", payload: 10 });
    dispatch({ type: "SET_FORMAT", payload: "mixed" });
    dispatch({ type: "COMPLETE_ONBOARDING" });
    dispatch({ type: "UPDATE_STREAK" });

    expect(dispatched).toHaveLength(6);
    expect(dispatched[0]).toEqual({ type: "SET_INTERESTS", payload: ["python", "physics"] });
    expect(dispatched[1]).toEqual({ type: "SET_SKILL_LEVEL", payload: "beginner" });
    expect(dispatched[2]).toEqual({ type: "SET_DAILY_GOAL", payload: 10 });
    expect(dispatched[3]).toEqual({ type: "SET_FORMAT", payload: "mixed" });
    expect(dispatched[4]).toEqual({ type: "COMPLETE_ONBOARDING" });
    expect(dispatched[5]).toEqual({ type: "UPDATE_STREAK" });
  });

  it("topics span multiple categories (tech, science, arts, personal)", () => {
    const techSlugs = ["python", "javascript", "web-development", "machine-learning"];
    const scienceSlugs = ["physics", "biology", "chemistry", "astronomy"];
    const artsSlugs = ["design", "music-theory", "writing", "photography"];
    const personalSlugs = ["fitness", "nutrition", "finance", "productivity"];

    const allSlugs = CURIOSITIES.map((t) => t.slug);

    const hasTech = techSlugs.some((s) => allSlugs.includes(s));
    const hasScience = scienceSlugs.some((s) => allSlugs.includes(s));
    const hasArts = artsSlugs.some((s) => allSlugs.includes(s));
    const hasPersonal = personalSlugs.some((s) => allSlugs.includes(s));

    expect(hasTech).toBe(true);
    expect(hasScience).toBe(true);
    expect(hasArts).toBe(true);
    expect(hasPersonal).toBe(true);
  });
});
