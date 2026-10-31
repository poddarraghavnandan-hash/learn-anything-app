import { fill, mcq, type Ladder } from './types';

/** Ladder 1 — Sounds & Phonics (early literacy, roughly ages 6–9). */
export const phonicsLadder: Ladder = {
  id: 'phonics',
  title: 'Sounds & Phonics',
  tagline: 'Hear it, say it, read it — the sounds inside words.',
  ageRange: 'Ages 6–9',
  concepts: [
    {
      id: 'ph-short-vowels',
      title: 'Short Vowel Sounds',
      summary: 'The quick sounds of a, e, i, o, u in short words.',
      teach: {
        heading: 'Vowels can sound short',
        body: 'In short words, vowels make a quick, short sound: a in "cat", e in "bed", i in "pig", o in "hot", u in "sun". Listen for the middle sound when you read a new word.',
        example: 'c-a-t → "cat". The middle sound is the short a.',
      },
      items: [
        mcq('ph-sv-1', 'ph-short-vowels', 'Which word has the short "a" sound?', ['cake', 'cat', 'car', 'call'], 'cat', -1.6, 'Say each word slowly and listen to the middle sound.'),
        mcq('ph-sv-2', 'ph-short-vowels', 'Which word has the short "e" sound?', ['bee', 'bed', 'bear', 'bead'], 'bed', -1.2, 'Short e sounds like the start of "elephant".'),
        fill('ph-sv-3', 'ph-short-vowels', 'Fill in the missing vowel: The c _ t sat on the mat.', 'a', undefined, -0.9, 'The word names a pet that says "meow".'),
        mcq('ph-sv-4', 'ph-short-vowels', 'Which word rhymes with "pig"?', ['peg', 'big', 'pug', 'page'], 'big', -0.5, 'Rhyming words end with the same sound: -ig.'),
      ],
    },
    {
      id: 'ph-blends',
      title: 'Consonant Blends',
      summary: 'Two letters whose sounds slide together: bl, st, tr, nd.',
      teach: {
        heading: 'Blends slide together',
        body: 'A blend is two (or three) consonants side by side where you can still hear both sounds sliding together: bl in "blue", st in "stop", tr in "tree", nd at the end of "hand".',
        example: 's + t + op → "stop". You can hear the s melt into the t.',
      },
      items: [
        mcq('ph-bl-1', 'ph-blends', 'Which word starts with the blend "bl"?', ['blue', 'bus', 'ball', 'bee'], 'blue', -1.1, 'Say the start of each word slowly. Which one has two sounds sliding?'),
        mcq('ph-bl-2', 'ph-blends', 'Which two letters begin the word "tree"?', ['th', 'tr', 'ch', 'dr'], 'tr', -0.8, 'Say "tree" slowly: t-r-ee.'),
        fill('ph-bl-3', 'ph-blends', 'Complete the word "flag": f + _ + ag. Which letter is missing?', 'l', undefined, -0.4, 'The blend in "flag" is fl.'),
        mcq('ph-bl-4', 'ph-blends', 'Which word ends with the blend "nd"?', ['hop', 'hand', 'hat', 'hen'], 'hand', -0.2, 'Listen to the last two sounds of each word.'),
      ],
    },
    {
      id: 'ph-digraphs',
      title: 'Digraphs: sh, ch, th',
      summary: 'Two letters that team up to make one new sound.',
      teach: {
        heading: 'Two letters, one sound',
        body: 'A digraph is two letters that make a single new sound together: sh in "ship", ch in "cheese", th in "thumb". You cannot hear the letters separately — they work as a team.',
        example: 'sh + eep → "sheep". The s and h together say "shhh".',
      },
      items: [
        mcq('ph-dg-1', 'ph-digraphs', 'Which word starts with the "sh" sound?', ['sun', 'ship', 'sit', 'sand'], 'ship', -1.0, 'Shhh — which word starts with that quiet sound?'),
        mcq('ph-dg-2', 'ph-digraphs', 'Which word starts with the "ch" sound?', ['shoe', 'cheese', 'see', 'soup'], 'cheese', -0.7, 'Ch is the sound at the start of "choo-choo".'),
        fill('ph-dg-3', 'ph-digraphs', 'Complete the word: _ _ + eep = a farm animal that gives wool.', 'sh', undefined, -0.3, 'The animal is a sheep. Which two letters start it?'),
        mcq('ph-dg-4', 'ph-digraphs', 'Which word has the "th" sound?', ['ten', 'thumb', 'tub', 'top'], 'thumb', 0.0, 'Stick your tongue out a little — that is the th sound.'),
      ],
    },
    {
      id: 'ph-silent-e',
      title: 'Silent e & Long Vowels',
      summary: 'A silent e at the end makes the vowel say its name.',
      teach: {
        heading: 'Silent e is a vowel power-up',
        body: 'When a word ends in silent e, the vowel before it becomes long — it says its own name. "cap" becomes "cape", "kit" becomes "kite", "hop" becomes "hope". The e itself makes no sound.',
        example: 'cap + e → cape. The a now says "ay", its name.',
      },
      items: [
        mcq('ph-se-1', 'ph-silent-e', 'What does adding silent e to "cap" make?', ['cap', 'cape', 'cup', 'caps'], 'cape', -0.6, 'Silent e makes the a say its name.'),
        mcq('ph-se-2', 'ph-silent-e', 'Which word has a long "i" sound?', ['pin', 'pig', 'bike', 'bin'], 'bike', -0.3, 'Long i says "eye" — the letter name.'),
        fill('ph-se-3', 'ph-silent-e', 'Add silent e to "kit" to name a toy that flies in the wind: _', 'kite', undefined, 0.1, 'kit + e = a word that rhymes with "night".'),
        mcq('ph-se-4', 'ph-silent-e', 'Which word rhymes with "cake"?', ['cat', 'lake', 'cup', 'cot'], 'lake', 0.3, 'Cake and its rhyme both end with the long-a sound "ake".'),
      ],
    },
  ],
};
