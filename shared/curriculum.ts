/**
 * Comprehensive Learning Curriculum Structure
 * Defines the deep learning content architecture
 */

export interface LearningObjective {
  id: string;
  text: string;
  bloomLevel: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
}

export interface ContentSection {
  id: string;
  type: "intuition" | "explanation" | "mathematical" | "application" | "extension";
  title: string;
  content: string; // Rich text/markdown
  examples?: WorkedExample[];
}

export interface WorkedExample {
  id: string;
  title: string;
  problem: string;
  solution: string;
  steps: string[]; // Step-by-step breakdown
  difficulty: "easy" | "medium" | "hard";
}

export interface ConceptCheck {
  id: string;
  question: string;
  type: "multiple-choice" | "short-answer" | "prediction";
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: "conceptual" | "calculation" | "application" | "synthesis";
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  difficulty: 1 | 2 | 3 | 4; // 1=easy, 4=hard
  bloomLevel: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
}

export interface Lesson {
  id: string;
  unitId: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  sequenceNumber: number;

  // Learning objectives
  objectives: LearningObjective[];

  // Prerequisites
  prerequisites: string[]; // IDs of lessons that must be completed first

  // Content
  contentSections: ContentSection[];
  misconceptions: {
    incorrect: string;
    correct: string;
    explanation: string;
  }[];

  // Interactive elements
  conceptChecks: ConceptCheck[];

  // Assessment
  assessmentQuestions: AssessmentQuestion[];
  masteryThreshold: number; // % required to pass (default 80)

  // Review
  reviewSchedule: number[]; // Days for spaced repetition (1, 3, 7, 14, 30)
}

export interface Unit {
  id: string;
  topicId: string;
  title: string;
  description: string;
  sequenceNumber: number;
  lessons: Lesson[];
}

export interface Topic {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  units: Unit[];
}

/**
 * Example: Physics - Newton's Second Law
 */
export const PHYSICS_NEWTONS_SECOND_LAW: Lesson = {
  id: "physics-newtons-second-law",
  unitId: "physics-unit-3-dynamics",
  title: "Newton's Second Law: F=ma",
  description: "Understand the relationship between force, mass, and acceleration",
  estimatedMinutes: 45,
  sequenceNumber: 1,

  objectives: [
    {
      id: "obj-1",
      text: "Define force, mass, and acceleration",
      bloomLevel: "remember",
    },
    {
      id: "obj-2",
      text: "State and explain Newton's Second Law (F=ma)",
      bloomLevel: "understand",
    },
    {
      id: "obj-3",
      text: "Apply F=ma to solve real-world problems",
      bloomLevel: "apply",
    },
    {
      id: "obj-4",
      text: "Distinguish between mass and weight",
      bloomLevel: "understand",
    },
    {
      id: "obj-5",
      text: "Draw and interpret free body diagrams",
      bloomLevel: "apply",
    },
  ],

  prerequisites: ["physics-kinematics-basics", "physics-forces-introduction"],

  contentSections: [
    {
      id: "section-intuition",
      type: "intuition",
      title: "Intuitive Understanding",
      content: `Imagine pushing a shopping cart. The harder you push (more force), the faster it accelerates. But if the cart is heavier (more mass), it accelerates less for the same push. This everyday experience captures Newton's Second Law perfectly.

Think about it:
- A light cart responds quickly to a gentle push
- A heavy cart needs a harder push to move
- The same push on different carts produces different accelerations

This is the essence of F=ma: the acceleration you get depends on both the force you apply AND the mass of the object.`,
      examples: [
        {
          id: "ex-1",
          title: "Shopping Cart Example",
          problem: "You push a 10 kg cart with 20 N of force. How does the acceleration compare to pushing a 20 kg cart with the same force?",
          solution: "The 10 kg cart accelerates twice as fast because it has half the mass.",
          steps: [
            "For 10 kg cart: a = F/m = 20/10 = 2 m/s²",
            "For 20 kg cart: a = F/m = 20/20 = 1 m/s²",
            "Ratio: 2 m/s² / 1 m/s² = 2x faster",
          ],
          difficulty: "easy",
        },
      ],
    },
    {
      id: "section-explanation",
      type: "explanation",
      title: "What is Newton's Second Law?",
      content: `Newton's Second Law states: The net force acting on an object equals the object's mass multiplied by its acceleration.

In equation form: **F = ma**

Where:
- F = net force (in Newtons, N)
- m = mass (in kilograms, kg)
- a = acceleration (in m/s²)

This law tells us three important things:
1. **Force causes acceleration**: Without force, there's no acceleration
2. **More force = more acceleration**: Acceleration is proportional to force
3. **More mass = less acceleration**: Acceleration is inversely proportional to mass

This is arguably the most important equation in classical mechanics. It connects the concept of force (which we experience intuitively) to the mathematical description of motion (acceleration).`,
    },
    {
      id: "section-mathematical",
      type: "mathematical",
      title: "Mathematical Formulation",
      content: `Starting from the definition of force as the rate of change of momentum:

F = dp/dt = d(mv)/dt

For constant mass:
F = m(dv/dt) = ma

This derivation shows that F=ma is not just an arbitrary equation—it emerges naturally from the fundamental definition of force.

**Vector form**: **F** = m**a**

This emphasizes that force and acceleration are vectors (they have direction). The net force and acceleration are always in the same direction.

**Solving for acceleration**: a = F/m

**Solving for force**: F = ma

**Solving for mass**: m = F/a`,
    },
    {
      id: "section-application",
      type: "application",
      title: "Real-World Applications",
      content: `Newton's Second Law explains countless everyday phenomena:

**Car acceleration**: A 1000 kg car with 5000 N of engine force accelerates at a = 5000/1000 = 5 m/s²

**Falling objects**: A 2 kg object experiences gravitational force F = mg = 2 × 10 = 20 N (using g ≈ 10 m/s²), so it accelerates at a = 20/2 = 10 m/s² downward

**Pushing objects**: The harder you push (larger F), the faster something accelerates. The heavier the object (larger m), the less it accelerates for the same push.

**Rocket propulsion**: Rockets expel hot gases (creating force). The larger the rocket's mass, the less it accelerates for the same thrust.`,
    },
  ],

  misconceptions: [
    {
      incorrect: "Heavier objects fall faster than lighter objects",
      correct: "All objects fall at the same rate in a vacuum (ignoring air resistance)",
      explanation: "While F = mg increases with mass, so does the inertia (resistance to acceleration). These effects cancel out: a = F/m = mg/m = g, which is constant.",
    },
    {
      incorrect: "Force is needed to maintain motion",
      correct: "Force is needed to CHANGE motion, not maintain it",
      explanation: "Newton's First Law states that objects in motion stay in motion without force. F=ma tells us force causes acceleration (change in velocity), not velocity itself.",
    },
    {
      incorrect: "Weight and mass are the same thing",
      correct: "Mass is the amount of matter; weight is the gravitational force on that mass",
      explanation: "Weight = mg, so weight depends on location (g varies). An astronaut has the same mass on Earth and Moon, but different weight.",
    },
  ],

  conceptChecks: [
    {
      id: "cc-1",
      question: "If you double the force on an object, what happens to its acceleration?",
      type: "multiple-choice",
      options: ["It doubles", "It halves", "It stays the same", "It quadruples"],
      correctAnswer: 0,
      explanation: "Since a = F/m, if F doubles and m stays the same, then a doubles.",
      difficulty: "easy",
    },
    {
      id: "cc-2",
      question: "If you double the mass of an object while keeping force constant, what happens to acceleration?",
      type: "multiple-choice",
      options: ["It doubles", "It halves", "It stays the same", "It quadruples"],
      correctAnswer: 1,
      explanation: "Since a = F/m, if m doubles and F stays the same, then a halves.",
      difficulty: "easy",
    },
    {
      id: "cc-3",
      question: "Why does a feather fall at the same rate as a hammer in a vacuum?",
      type: "short-answer",
      options: [],
      correctAnswer: "Because while gravity pulls harder on the hammer (larger force), the hammer also has more inertia (larger mass). These effects cancel: a = F/m = mg/m = g.",
      explanation: "This is a key insight: gravitational force is proportional to mass, so the acceleration due to gravity is independent of mass.",
      difficulty: "hard",
    },
  ],

  assessmentQuestions: [
    {
      id: "aq-1",
      question: "A 2 kg object experiences a net force of 10 N. What is its acceleration?",
      type: "calculation",
      correctAnswer: "5 m/s²",
      explanation: "Using a = F/m = 10 N / 2 kg = 5 m/s²",
      difficulty: 1,
      bloomLevel: "apply",
    },
    {
      id: "aq-2",
      question: "Two forces act on a 5 kg object: 20 N to the right and 5 N to the left. What is the net force and acceleration?",
      type: "calculation",
      correctAnswer: "Net force = 15 N right; acceleration = 3 m/s² right",
      explanation: "Net force = 20 - 5 = 15 N. Acceleration = 15 / 5 = 3 m/s²",
      difficulty: 2,
      bloomLevel: "apply",
    },
    {
      id: "aq-3",
      question: "Explain why astronauts feel weightless in orbit, even though Earth's gravity still acts on them.",
      type: "conceptual",
      correctAnswer: "They are in free fall; gravity provides the centripetal force for circular motion, not a normal force.",
      explanation: "Weightlessness is not the absence of gravity—it's the absence of a normal force. In orbit, gravity pulls the astronaut and spacecraft equally, so there's no relative force.",
      difficulty: 3,
      bloomLevel: "understand",
    },
    {
      id: "aq-4",
      question: "A car (1500 kg) accelerates from 0 to 100 km/h in 8 seconds. Assuming constant acceleration, what is the net force? (Hint: convert 100 km/h to m/s first)",
      type: "application",
      correctAnswer: "Net force ≈ 5208 N",
      explanation: "100 km/h = 100/3.6 ≈ 27.8 m/s. Acceleration = 27.8 / 8 ≈ 3.475 m/s². Force = 1500 × 3.475 ≈ 5208 N",
      difficulty: 3,
      bloomLevel: "apply",
    },
  ],

  masteryThreshold: 80,
  reviewSchedule: [1, 3, 7, 14, 30],
};

/**
 * Curriculum Index
 */
export const CURRICULUM: Topic[] = [
  {
    id: "physics",
    title: "Physics Fundamentals",
    slug: "physics-fundamentals",
    description: "Master classical mechanics, thermodynamics, and waves",
    difficulty: "intermediate",
    estimatedHours: 20,
    units: [
      {
        id: "physics-unit-1",
        topicId: "physics",
        title: "Foundations",
        description: "Scientific method, units, and measurement",
        sequenceNumber: 1,
        lessons: [],
      },
      {
        id: "physics-unit-2",
        topicId: "physics",
        title: "Kinematics",
        description: "Motion in one and two dimensions",
        sequenceNumber: 2,
        lessons: [],
      },
      {
        id: "physics-unit-3-dynamics",
        topicId: "physics",
        title: "Dynamics",
        description: "Forces and Newton's Laws",
        sequenceNumber: 3,
        lessons: [PHYSICS_NEWTONS_SECOND_LAW],
      },
    ],
  },
];
