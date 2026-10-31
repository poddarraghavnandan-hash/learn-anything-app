import { fill, mcq, type Ladder } from './types';

/** Ladder 2 — Word Power / Vocabulary (roughly ages 8–12). */
export const vocabularyLadder: Ladder = {
  id: 'word-power',
  title: 'Word Power',
  tagline: 'More words, used well — synonyms, opposites and clever clues.',
  ageRange: 'Ages 8–12',
  concepts: [
    {
      id: 'vo-synonyms',
      title: 'Synonyms: Same Meaning',
      summary: 'Different words that mean nearly the same thing.',
      teach: {
        heading: 'Synonyms are word twins',
        body: 'Synonyms are words with the same or nearly the same meaning: happy/glad, big/huge, fast/quick. Swapping in a synonym can make your writing fresher without changing what you mean.',
        example: '"The dog is big" → "The dog is huge." Same meaning, stronger picture.',
      },
      items: [
        mcq('vo-sy-1', 'vo-synonyms', 'Which word is a synonym for "happy"?', ['sad', 'glad', 'angry', 'tired'], 'glad', -1.4, 'A synonym means almost the same thing as happy.'),
        mcq('vo-sy-2', 'vo-synonyms', 'Which word is a synonym for "big"?', ['tiny', 'huge', 'thin', 'short'], 'huge', -1.1, 'Think: very, very big.'),
        fill('vo-sy-3', 'vo-synonyms', 'Write a synonym for "fast": _', 'quick', ['speedy', 'rapid', 'swift'], -0.6, 'Fast and ___ both describe a speedy runner.'),
        mcq('vo-sy-4', 'vo-synonyms', 'Which word is a synonym for "begin"?', ['finish', 'start', 'stop', 'end'], 'start', -0.4, 'Begin and its synonym both mean to get going.'),
      ],
    },
    {
      id: 'vo-antonyms',
      title: 'Antonyms: Opposites',
      summary: 'Words that mean the opposite of each other.',
      teach: {
        heading: 'Antonyms face opposite ways',
        body: 'Antonyms are pairs of words with opposite meanings: hot/cold, brave/afraid, ancient/modern. Knowing opposites helps you describe things precisely and spot contrasts in stories.',
        example: 'The opposite of "generous" (happy to share) is "selfish".',
      },
      items: [
        mcq('vo-an-1', 'vo-antonyms', 'What is the opposite of "hot"?', ['warm', 'cold', 'dry', 'soft'], 'cold', -1.5, 'Think about temperature words on a line: hot … warm … ?'),
        mcq('vo-an-2', 'vo-antonyms', 'What is the opposite of "brave"?', ['strong', 'proud', 'afraid', 'quick'], 'afraid', -0.9, 'A brave person faces danger; the opposite person feels ___.'),
        fill('vo-an-3', 'vo-antonyms', 'The opposite of "ancient" is _', 'modern', ['new'], -0.5, 'Ancient means very old. The opposite is very ___.'),
        mcq('vo-an-4', 'vo-antonyms', 'What is the opposite of "generous"?', ['kind', 'selfish', 'funny', 'gentle'], 'selfish', -0.1, 'A generous person shares. The opposite keeps everything.'),
      ],
    },
    {
      id: 'vo-homophones',
      title: 'Homophones: Sound-Alike Words',
      summary: 'Words that sound the same but are spelled differently: hear/here.',
      teach: {
        heading: 'Same sound, different word',
        body: 'Homophones sound identical but have different meanings and spellings: hear/here, bear/bare, their/there/they\'re, night/knight. The right choice depends on the meaning of the sentence.',
        example: '"I can hear the bell" — hear is about listening, with an ear in the middle!',
      },
      items: [
        mcq('vo-ho-1', 'vo-homophones', 'Which word names the big furry animal?', ['bare', 'bear'], 'bear', -0.8, 'One word means an animal; the other means uncovered.'),
        mcq('vo-ho-2', 'vo-homophones', 'Choose the right word: "I can _ the music playing."', ['here', 'hear'], 'hear', -0.5, 'Listening uses the word with "ear" inside it.'),
        fill('vo-ho-3', 'vo-homophones', 'Complete the sentence: "The knight rode his horse through the _ ."', 'night', undefined, -0.2, 'The dark time of day sounds like "knight" without the k sound at the start.'),
        mcq('vo-ho-4', 'vo-homophones', 'Choose the right word: "_ house is the blue one."', ['There', 'Their', "They're"], 'Their', 0.2, 'The house belongs to them — you need the belonging word.'),
      ],
    },
    {
      id: 'vo-context-clues',
      title: 'Context Clues',
      summary: 'Work out a new word from the words around it.',
      teach: {
        heading: 'The sentence leaves clues',
        body: 'When you meet a new word, the words around it usually hint at its meaning. "Mia was famished after skipping lunch, so she ate two sandwiches" — famished must mean very hungry. Detectives read sentences this way.',
        example: '"The desert is arid and nothing grows there" → arid means dry.',
      },
      items: [
        mcq('vo-cc-1', 'vo-context-clues', '"Mia was famished after skipping lunch, so she ate two sandwiches." Famished means…', ['very tired', 'very hungry', 'very happy', 'very cold'], 'very hungry', -0.7, 'What would make someone eat two sandwiches?'),
        mcq('vo-cc-2', 'vo-context-clues', '"The desert is arid — no rain falls and nothing grows." Arid means…', ['wet', 'dry', 'dark', 'noisy'], 'dry', -0.4, 'No rain, nothing grows. What is the land like?'),
        fill('vo-cc-3', 'vo-context-clues', '"After the rain, the path was soggy and our shoes squelched." Soggy means _', 'wet', ['soaked', 'very wet'], 0.0, 'Rain plus squelching shoes — the path must be ___.'),
        mcq('vo-cc-4', 'vo-context-clues', '"The nocturnal owl sleeps all day and hunts when the moon is out." Nocturnal means…', ['active at night', 'very loud', 'colourful', 'hungry'], 'active at night', 0.4, 'When does the owl hunt? That is the clue.'),
      ],
    },
  ],
};
