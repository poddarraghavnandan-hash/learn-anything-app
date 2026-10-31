import { fill, mcq, type Ladder } from './types';

/** Ladder 4 — Grammar Basics (roughly ages 8–14). */
export const grammarLadder: Ladder = {
  id: 'grammar',
  title: 'Grammar Basics',
  tagline: 'Build sentences that work: words, agreement and tenses.',
  ageRange: 'Ages 8–14',
  concepts: [
    {
      id: 'gr-nouns-verbs',
      title: 'Nouns & Verbs',
      summary: 'Naming words and doing words — the two building blocks.',
      teach: {
        heading: 'Every sentence needs both',
        body: 'A noun names a person, place or thing: teacher, park, apple. A verb is a doing or being word: run, jump, is, was. Most sentences are built from a noun doing a verb: "The dog (noun) barked (verb)."',
        example: '"Maya kicked the ball." Maya and ball are nouns; kicked is the verb.',
      },
      items: [
        mcq('gr-nv-1', 'gr-nouns-verbs', 'Which word is a VERB?', ['apple', 'run', 'happy', 'table'], 'run', -1.3, 'A verb is a doing word. Which one is something you do?'),
        mcq('gr-nv-2', 'gr-nouns-verbs', 'Which word is a PROPER noun (a special name)?', ['city', 'river', 'London', 'mountain'], 'London', -0.8, 'Proper nouns are names and start with a capital letter.'),
        fill('gr-nv-3', 'gr-nouns-verbs', 'Name the noun in this sentence: "The dog barked loudly." The noun is _', 'dog', undefined, -0.5, 'Which word names an animal here?'),
        mcq('gr-nv-4', 'gr-nouns-verbs', 'Which word is the verb in "She jumped over the puddle"?', ['she', 'jumped', 'puddle', 'over'], 'jumped', -0.2, 'Find the doing word — what did she do?'),
      ],
    },
    {
      id: 'gr-sentences',
      title: 'Complete Sentences',
      summary: 'Capitals, end marks, and thoughts that finish.',
      teach: {
        heading: 'A sentence is a complete thought',
        body: 'A complete sentence starts with a capital letter, ends with a full stop, question mark or exclamation mark, and makes sense on its own. "Running through the park" is not complete — who is running? "Sam is running through the park" is.',
        example: 'Fragment: "because it rained." Complete: "We stayed inside because it rained."',
      },
      items: [
        mcq('gr-sn-1', 'gr-sentences', 'Which one is a complete sentence?', ['Running fast', 'The cat slept.', 'Because it was late', 'Under the big tree'], 'The cat slept.', -1.1, 'Which one makes sense all on its own?'),
        mcq('gr-sn-2', 'gr-sentences', 'What does every sentence start with?', ['A small letter', 'A capital letter', 'A comma', 'A number'], 'A capital letter', -0.9, 'Look at the start of any sentence in a book.'),
        fill('gr-sn-3', 'gr-sentences', '"Where is my book" is a question, so it should end with a _ mark.', 'question', undefined, -0.4, 'Questions end with a special curly mark. What is it called?'),
        mcq('gr-sn-4', 'gr-sentences', 'Which group of words is only a fragment?', ['Birds build nests', 'In the tall grass', 'She sings beautifully', 'We won the game'], 'In the tall grass', 0.2, 'A fragment is missing who or what does something.'),
      ],
    },
    {
      id: 'gr-agreement',
      title: 'Subject–Verb Agreement',
      summary: 'One or many? The verb has to match: she goes, they go.',
      teach: {
        heading: 'The verb matches the subject',
        body: 'If the subject is one (she, the dog), the verb usually takes an -s in the present tense: "She goes", "The dog barks". If the subject is many (they, the dogs), no -s: "They go", "The dogs bark". It sounds backwards, but that is the pattern.',
        example: '"The bird sings" (one bird) but "The birds sing" (many birds).',
      },
      items: [
        mcq('gr-ag-1', 'gr-agreement', 'Choose the correct verb: "She _ to school by bus."', ['go', 'goes'], 'goes', -0.7, 'The subject "she" is one person, so the verb takes -s.'),
        mcq('gr-ag-2', 'gr-agreement', 'Choose the correct verb: "They _ happy today."', ['is', 'are'], 'are', -0.5, '"They" is many, so it pairs with "are".'),
        fill('gr-ag-3', 'gr-agreement', 'Choose: bark or barks? "The dogs _ loudly."', 'bark', undefined, -0.1, 'Dogs is plural (many), so no -s on the verb.'),
        mcq('gr-ag-4', 'gr-agreement', 'Choose the correct verb: "Everyone _ a ticket."', ['have', 'has'], 'has', 0.4, 'Tricky one: "everyone" counts as one, so it takes "has".'),
      ],
    },
    {
      id: 'gr-past-tense',
      title: 'Past Tense',
      summary: 'Saying it already happened: played, went, ate, caught.',
      teach: {
        heading: 'Two ways to go back in time',
        body: 'Regular verbs add -ed: play → played, jump → jumped. Irregular verbs change in their own way and must be learned: go → went, eat → ate, catch → caught. Time words like "yesterday" are your clue that past tense is needed.',
        example: '"Today I catch the ball. Yesterday I caught the ball."',
      },
      items: [
        mcq('gr-pt-1', 'gr-past-tense', 'What is the past tense of "go"?', ['goed', 'went', 'gone to', 'going'], 'went', -0.8, '"Go" is irregular — it changes completely.'),
        mcq('gr-pt-2', 'gr-past-tense', 'What is the past tense of "play"?', ['plays', 'played', 'playing', 'plaied'], 'played', -0.6, 'Regular verbs just add -ed.'),
        fill('gr-pt-3', 'gr-past-tense', 'Yesterday we _ (eat) pizza for dinner.', 'ate', undefined, -0.2, '"Eat" is irregular: eat → ___ . It rhymes with "eight".'),
        mcq('gr-pt-4', 'gr-past-tense', 'Which sentence is correct?', ['She catched the ball', 'She caught the ball', 'She catch the ball yesterday', 'She catching the ball'], 'She caught the ball', 0.3, 'Catch is irregular: catch → caught.'),
      ],
    },
  ],
};
