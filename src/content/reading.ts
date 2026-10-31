import { fill, mcq, type Ladder } from './types';

/** Ladder 3 — Reading & Understanding (roughly ages 9–14). */
export const readingLadder: Ladder = {
  id: 'reading',
  title: 'Reading & Understanding',
  tagline: 'Go deeper into stories: main ideas, order, and reading between the lines.',
  ageRange: 'Ages 9–14',
  concepts: [
    {
      id: 're-main-idea',
      title: 'Finding the Main Idea',
      summary: 'What a passage is mostly about, in one sentence.',
      teach: {
        heading: 'The main idea is the umbrella',
        body: 'The main idea is what a whole passage is mostly about. Details are like raindrops — they all fit under the umbrella of the main idea. Ask: "If I could keep only one sentence, which would it be?"',
        example: 'A passage listing how bees find flowers, tell other bees, and carry pollen is mostly about how bees collect food — not about one single bee.',
      },
      items: [
        mcq('re-mi-1', 're-main-idea', '"Bees visit flowers to drink nectar. As they move, pollen sticks to their bodies. They carry the pollen to other flowers, helping new plants grow." What is the main idea?', ['Bees are small insects', 'Bees help plants grow by carrying pollen', 'Flowers are colourful', 'Nectar tastes sweet'], 'Bees help plants grow by carrying pollen', -0.6, 'Which sentence covers the whole passage, not just one detail?'),
        mcq('re-mi-2', 're-main-idea', '"Before a race, Ana stretches her legs. She drinks water and ties her shoes tightly. She takes three deep breaths at the start line." What is the main idea?', ['Ana likes water', 'Ana gets ready for her race', 'Shoes are important', 'Breathing is healthy'], 'Ana gets ready for her race', -0.3, 'Every detail is about one thing Ana is doing. What is it?'),
        mcq('re-mi-3', 're-main-idea', '"Penguins cannot fly, but they are excellent swimmers. Their flippers work like paddles. A layer of fat keeps them warm in icy water." The main idea is…', ['Penguins live in cold places', 'Penguins are built for swimming, not flying', 'Fat keeps animals warm', 'Flippers look like paddles'], 'Penguins are built for swimming, not flying', 0.2, 'Look for the sentence every detail supports.'),
        mcq('re-mi-4', 're-main-idea', '"The library added longer evening hours. It also opened a homework room and started weekend story time." What is the main idea?', ['The library is helping more people use it', 'Story time is on weekends', 'Evenings are quiet', 'Homework is hard'], 'The library is helping more people use it', 0.6, 'Three changes, one purpose. What is the purpose?'),
      ],
    },
    {
      id: 're-sequencing',
      title: 'Sequencing Events',
      summary: 'Putting story events in the order they happened.',
      teach: {
        heading: 'Stories have an order',
        body: 'Sequence words — first, next, then, finally — tell you the order of events. When a question asks what happened first or last, scan the passage in order and track each event as it appears.',
        example: '"First the egg cracked. Next a chick stepped out. Finally it followed its mother." The chick stepping out happened second.',
      },
      items: [
        mcq('re-sq-1', 're-sequencing', '"First, Tom planted a seed. Next, he watered it every day. Finally, a green sprout pushed through the soil." What happened second?', ['A sprout grew', 'Tom planted a seed', 'Tom watered the seed', 'The soil dried out'], 'Tom watered the seed', -1.0, 'First = planting. What did Tom do next?'),
        fill('re-sq-2', 're-sequencing', 'Complete with a sequence word: "_ , the egg cracked and a chick appeared."', 'First', ['Then', 'Next'], -0.7, 'The cracking starts the story, so it needs an opening sequence word.'),
        mcq('re-sq-3', 're-sequencing', '"Sara packed her bag after breakfast. She had woken up early and brushed her teeth before eating." What did Sara do first?', ['Packed her bag', 'Ate breakfast', 'Woke up early', 'Brushed her teeth'], 'Woke up early', -0.1, 'Stories sometimes tell events out of order — track the time words.'),
        mcq('re-sq-4', 're-sequencing', '"The cake went into the oven. Before that, Dan had mixed the batter. Even earlier, he had measured the flour." What happened last?', ['Dan measured the flour', 'Dan mixed the batter', 'The cake went into the oven', 'Dan bought flour'], 'The cake went into the oven', 0.4, '"Before that" and "even earlier" push events backwards in time.'),
      ],
    },
    {
      id: 're-inference',
      title: 'Reading Between the Lines',
      summary: 'Figuring out what the text suggests but does not say.',
      teach: {
        heading: 'Inference = clues + what you know',
        body: 'Authors do not say everything. When a text says "Leo grabbed his umbrella and boots", you can infer rain is coming — the clues (umbrella, boots) plus what you know (we use them in rain) give the answer.',
        example: '"Her hands shook as she opened the letter." She is probably nervous — shaking hands are the clue.',
      },
      items: [
        mcq('re-in-1', 're-inference', '"Leo grabbed his umbrella and pulled on his rain boots before leaving." What can you infer?', ['Leo loves boots', 'It is probably raining', 'Leo is going swimming', 'It is snowing'], 'It is probably raining', -0.8, 'Umbrella + rain boots — what weather are they for?'),
        mcq('re-in-2', 're-inference', '"Ana\'s hands shook as she opened the exam results." How does Ana most likely feel?', ['Bored', 'Nervous', 'Angry', 'Sleepy'], 'Nervous', -0.4, 'Shaking hands are a clue about feelings.'),
        mcq('re-in-3', 're-inference', '"The puppy hid under the sofa, whimpering, while thunder crashed outside." Why is the puppy hiding?', ['It wants to play', 'It is frightened by the thunder', 'It is hungry', 'It is sleeping'], 'It is frightened by the thunder', 0.1, 'Whimpering + thunder. Put the clues together.'),
        mcq('re-in-4', 're-inference', '"Without a word, he took off his own jacket and put it around his little sister\'s shoulders." What does this suggest about him?', ['He is careless', 'He is kind and protective', 'He is in a hurry', 'He feels hot'], 'He is kind and protective', 0.7, 'Actions show character. What does giving up his jacket tell you?'),
      ],
    },
    {
      id: 're-fact-opinion',
      title: 'Fact or Opinion?',
      summary: 'Telling things that can be checked from things people believe.',
      teach: {
        heading: 'Facts can be checked; opinions are views',
        body: 'A fact can be proven or measured: "The Amazon is the largest rainforest." An opinion is a belief or judgement: "Rainforests are the most beautiful places." Words like best, worst, should and beautiful often signal opinions.',
        example: '"Dogs are the best pets" is an opinion — "dogs have four legs" is a fact.',
      },
      items: [
        mcq('re-fo-1', 're-fact-opinion', 'Which sentence is an OPINION?', ['The Moon orbits the Earth', 'Winter is the most beautiful season', 'Water boils at 100°C', 'A week has seven days'], 'Winter is the most beautiful season', -0.9, 'Which one cannot be proven — it depends on what someone thinks?'),
        mcq('re-fo-2', 're-fact-opinion', 'Which sentence is a FACT?', ['Cats are better than dogs', 'Everyone should read more', 'The Earth has one moon', 'School is boring'], 'The Earth has one moon', -0.5, 'Which statement could you check and prove?'),
        mcq('re-fo-3', 're-fact-opinion', '"Our school library has 4,000 books." This is…', ['An opinion', 'A fact that can be checked', 'A prediction', 'A question'], 'A fact that can be checked', 0.0, 'Could you count and check this number?'),
        mcq('re-fo-4', 're-fact-opinion', 'Which word in this sentence signals an opinion? "This is the tastiest soup in the world."', ['soup', 'world', 'tastiest', 'this'], 'tastiest', 0.5, 'Superlative taste words (tastiest, best, worst) usually show a judgement.'),
      ],
    },
  ],
};
