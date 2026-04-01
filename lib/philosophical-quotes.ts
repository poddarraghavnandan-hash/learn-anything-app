/**
 * Philosophical Quotes for Learning Screens
 * 
 * Curated quotes about learning, growth, knowledge, and wisdom
 * to inspire users during loading moments
 */

export interface PhilosophicalQuote {
  text: string;
  author: string;
  category: "learning" | "growth" | "knowledge" | "wisdom" | "perseverance" | "curiosity";
}

export const PHILOSOPHICAL_QUOTES: PhilosophicalQuote[] = [
  // Learning & Growth
  {
    text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
    author: "Brian Herbert",
    category: "learning",
  },
  {
    text: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela",
    category: "learning",
  },
  {
    text: "Learning is not attained by chance, it must be sought for with ardor and attended to with diligence.",
    author: "Abigail Adams",
    category: "learning",
  },
  {
    text: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King",
    category: "learning",
  },
  {
    text: "In learning you will teach, and in teaching you will learn.",
    author: "Phil Collins",
    category: "learning",
  },

  // Growth & Development
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    category: "growth",
  },
  {
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle",
    category: "growth",
  },
  {
    text: "The mind is everything. What you think, you become.",
    author: "Buddha",
    category: "growth",
  },
  {
    text: "Growth is painful, but nothing is as painful as staying stuck.",
    author: "Mandy Hale",
    category: "growth",
  },
  {
    text: "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar",
    category: "growth",
  },

  // Knowledge & Understanding
  {
    text: "Knowledge is power.",
    author: "Francis Bacon",
    category: "knowledge",
  },
  {
    text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
    author: "Dr. Seuss",
    category: "knowledge",
  },
  {
    text: "Knowledge is a treasure, but practice is the key to it.",
    author: "Thomas Fuller",
    category: "knowledge",
  },
  {
    text: "Understanding is the first step to acceptance, and only with acceptance can there be recovery.",
    author: "J.K. Rowling",
    category: "knowledge",
  },
  {
    text: "The greatest enemy of knowledge is not ignorance; it is the illusion of knowledge.",
    author: "Stephen Hawking",
    category: "knowledge",
  },

  // Wisdom & Perspective
  {
    text: "Wisdom is not found in books alone.",
    author: "J.K. Rowling",
    category: "wisdom",
  },
  {
    text: "The only true wisdom is in knowing you know nothing.",
    author: "Socrates",
    category: "wisdom",
  },
  {
    text: "Wisdom comes from experience. Experience is often a result of lack of wisdom.",
    author: "Terry Pratchett",
    category: "wisdom",
  },
  {
    text: "A wise man learns from the mistakes of others; a fool must make them himself.",
    author: "Latin Proverb",
    category: "wisdom",
  },
  {
    text: "The wise adapt themselves to circumstances, as water molds itself to the pitcher.",
    author: "Chinese Proverb",
    category: "wisdom",
  },

  // Perseverance & Effort
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    category: "perseverance",
  },
  {
    text: "The master has failed more times than the beginner has even tried.",
    author: "Stephen McCranie",
    category: "perseverance",
  },
  {
    text: "It does not matter how slowly you go as long as you do not stop.",
    author: "Confucius",
    category: "perseverance",
  },
  {
    text: "Perseverance is not a long race; it is many short races one after the other.",
    author: "Walter Elliot",
    category: "perseverance",
  },
  {
    text: "The only guarantee for failure is to stop trying.",
    author: "John C. Maxwell",
    category: "perseverance",
  },

  // Curiosity & Wonder
  {
    text: "Curiosity is the wick in the candle of learning.",
    author: "William Arthur Ward",
    category: "curiosity",
  },
  {
    text: "The important thing is not to stop questioning. Curiosity has its own reason for existing.",
    author: "Albert Einstein",
    category: "curiosity",
  },
  {
    text: "Curiosity is the engine of achievement.",
    author: "Ken Robinson",
    category: "curiosity",
  },
  {
    text: "Wonder is the beginning of wisdom.",
    author: "Socrates",
    category: "curiosity",
  },
  {
    text: "The cure for boredom is curiosity. There is no cure for curiosity.",
    author: "Dorothy Parker",
    category: "curiosity",
  },

  // Additional Inspirational Quotes
  {
    text: "Every expert was once a beginner.",
    author: "Unknown",
    category: "learning",
  },
  {
    text: "The journey of a thousand miles begins with a single step.",
    author: "Lao Tzu",
    category: "growth",
  },
  {
    text: "What we learn becomes a part of who we are.",
    author: "Unknown",
    category: "knowledge",
  },
  {
    text: "The more you know, the more you realize how much you don't know.",
    author: "Aristotle",
    category: "wisdom",
  },
  {
    text: "Challenges are what make life interesting; overcoming them is what makes life meaningful.",
    author: "Joshua J. Marine",
    category: "perseverance",
  },
];

/**
 * Get a random philosophical quote
 */
export function getRandomQuote(): PhilosophicalQuote {
  return PHILOSOPHICAL_QUOTES[Math.floor(Math.random() * PHILOSOPHICAL_QUOTES.length)];
}

/**
 * Get a random quote from a specific category
 */
export function getRandomQuoteByCategory(category: PhilosophicalQuote["category"]): PhilosophicalQuote {
  const filtered = PHILOSOPHICAL_QUOTES.filter((q) => q.category === category);
  return filtered[Math.floor(Math.random() * filtered.length)] || getRandomQuote();
}

/**
 * Get multiple random quotes (without duplicates)
 */
export function getRandomQuotes(count: number): PhilosophicalQuote[] {
  const shuffled = [...PHILOSOPHICAL_QUOTES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
