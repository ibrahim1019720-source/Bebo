import { ExerciseCategory } from '../types';

export const EXERCISES: Record<string, ExerciseCategory[]> = {
  'English': [
    {
      title: 'Common Greetings',
      difficulty: 'Beginner',
      exercises: [
        { sentence: 'Hello, how are you?' },
        { sentence: 'Good morning, it is a beautiful day.' },
        { sentence: 'What a pleasant surprise to see you here.' },
        { sentence: 'It is a pleasure to meet you.' },
        { sentence: 'How have you been lately?' },
        { sentence: 'A very good morning to you.' },
        { sentence: 'How do you do?' },
        { sentence: 'It’s a pleasure to make your acquaintance.' },
        { sentence: 'Lovely to see you again.' },
      ],
    },
    {
      title: 'Fill in the Blanks',
      difficulty: 'Beginner',
      exercises: [
        { sentence: 'The cat is sleeping on the ___.' },
        { sentence: 'I would like a cup of ___ please.' },
        { sentence: 'My favorite color is ___.' },
        { sentence: 'She is reading a ___.' },
      ],
    },
    {
      title: 'Minimal Pairs (e.g., ship/sheep)',
      difficulty: 'Intermediate',
      exercises: [
        { sentence: 'He hurt his chin when he fell on his shin.' },
        { sentence: 'I need to buy a new pen, not a pin.' },
        { sentence: 'She saw a large ship carrying a lot of sheep.' },
        { sentence: 'Please check your bag at the gate.' },
        { sentence: 'They live by the lake.' },
      ],
    },
    {
      title: 'Repetition Phrases',
      difficulty: 'Intermediate',
      exercises: [
        { sentence: 'The rain in Spain stays mainly in the plain.' },
        { sentence: 'Red lorry, yellow lorry.' },
        { sentence: 'A proper copper coffee pot.' },
        { sentence: 'Around the rugged rock the ragged rascal ran.' },
      ],
    },
    {
      title: 'Sentence Stress Practice',
      difficulty: 'Intermediate',
      exercises: [
        { sentence: 'I **really** want to go to the park.' },
        { sentence: 'She bought a **beautiful** blue car.' },
        { sentence: 'Is **that** your final answer?' },
        { sentence: '**Why** did you say that?' },
      ],
    },
    {
      title: 'Vowel Sound Practice',
      difficulty: 'Intermediate',
      exercises: [
        { sentence: 'I would rather have a hot bath than walk on a cold path.' },
        { sentence: 'The car park is rather far from the large barn.' },
        { sentence: 'She can\'t pass the last class, it\'s a bit of a farce.' },
        { sentence: 'The water ought to be hotter for a proper cup of tea.' },
      ],
    },
    {
      title: 'Tongue Twisters',
      difficulty: 'Advanced',
      exercises: [
        { sentence: 'She sells seashells by the seashore.' },
        { sentence: 'Peter Piper picked a peck of pickled peppers.' },
        { sentence: 'How can a clam cram in a clean cream can?' },
        { sentence: 'I saw Susie sitting in a shoeshine shop.' },
        { sentence: 'I am not a pheasant plucker, I\'m a pheasant plucker\'s son.' },
        { sentence: 'The thirty-three thieves thought that they thrilled the throne throughout Thursday.' },
        { sentence: 'Rolling red wagons roll down roads.' },
      ],
    },
  ],
  'Spanish (Castilian)': [
    {
      title: 'Saludos Comunes',
      difficulty: 'Beginner',
      exercises: [
        { sentence: 'Hola, ¿cómo estás?' },
        { sentence: 'Buenos días, ¿qué tal?' },
        { sentence: 'Encantado de conocerte.' },
        { sentence: 'Muchas gracias por todo.' },
      ],
    },
    {
        title: 'Frases de Repetición',
        difficulty: 'Intermediate',
        exercises: [
          { sentence: 'El cielo está enladrillado, ¿quién lo desenladrillará?' },
          { sentence: 'Erre con erre cigarro, erre con erre barril.' },
        ],
    },
    {
      title: 'Trabalenguas',
      difficulty: 'Advanced',
      exercises: [
        { sentence: 'Tres tristes tigres tragaban trigo en un trigal.' },
        { sentence: 'El perro de San Roque no tiene rabo porque Ramón Ramírez se lo ha cortado.' },
      ],
    },
  ],
  'Arabic (Modern Standard)': [
    {
        title: 'تحيات شائعة',
        difficulty: 'Beginner',
        exercises: [
            { sentence: 'مرحباً، كيف حالك؟' },
            { sentence: 'صباح الخير، أتمنى لك يوماً سعيداً.' },
            { sentence: 'شكراً جزيلاً لك.' },
        ],
    },
    {
        title: 'عبارات للتكرار',
        difficulty: 'Intermediate',
        exercises: [
            { sentence: 'شمسٌ مُشمسةٌ وشاطئٌ رملي واسع.' },
            { sentence: 'القطط الصغيرة تلعب في الحديقة الخضراء.' },
        ],
    },
    {
        title: 'جمل صعبة النطق',
        difficulty: 'Advanced',
        exercises: [
            { sentence: 'خيط حرير على حيط خليل.' },
            { sentence: 'شَرشَفنا مَع شريف وشَرشَف شريف شُرفنا.' },
        ],
    },
  ],
  'Italian (Standard)': [
      {
          title: 'Saluti Comuni',
          difficulty: 'Beginner',
          exercises: [
              { sentence: 'Buongiorno, come sta?' },
              { sentence: 'Piacere di conoscerla.' },
              { sentence: 'Grazie mille e arrivederci.' },
          ],
      },
      {
          title: 'Frasi di Ripetizione',
          difficulty: 'Intermediate',
          exercises: [
              { sentence: 'Paolo Pavan è un povero pittore padovano.' },
              { sentence: 'Sopra la panca la capra campa, sotto la panca la capra crepa.' },
          ],
      },
      {
          title: 'Scioglilingua',
          difficulty: 'Advanced',
          exercises: [
              { sentence: 'Trentatré trentini entrarono a Trento, tutti e trentatré trotterellando.' },
              { sentence: 'Apelle, figlio di Apollo, fece una palla di pelle di pollo.' },
          ],
      },
  ],
  'French (Standard Parisian)': [
      {
          title: 'Salutations Courantes',
          difficulty: 'Beginner',
          exercises: [
              { sentence: 'Bonjour, comment allez-vous ?' },
              { sentence: 'Enchanté de faire votre connaissance.' },
              { sentence: 'Je vous souhaite une excellente journée.' },
          ],
      },
      {
          title: 'Pratique de la Liaison',
          difficulty: 'Intermediate',
          exercises: [
              { sentence: 'Les enfants ont adoré les énormes ananas.' },
              { sentence: 'Il est huit heures et quart et nous allons y aller.' },
          ],
      },
      {
          title: 'Virelangues',
          difficulty: 'Advanced',
          exercises: [
              { sentence: 'Les chaussettes de l\'archiduchesse sont-elles sèches, archi-sèches ?' },
              { sentence: 'Un chasseur sachant chasser doit savoir chasser sans son chien.' },
          ],
      },
  ],
  'German (Standard "Hochdeutsch")': [
      {
          title: 'Alltägliche Begrüßungen',
          difficulty: 'Beginner',
          exercises: [
              { sentence: 'Guten Tag, wie geht es Ihnen?' },
              { sentence: 'Es freut mich, Sie kennenzulernen.' },
              { sentence: 'Ich wünsche Ihnen einen schönen Tag.' },
          ],
      },
      {
          title: 'Wiederholungssätze',
          difficulty: 'Intermediate',
          exercises: [
              { sentence: 'Acht alte Ameisen aßen am Abend Ananas.' },
              { sentence: 'Zwischen zwei Zweigen zwitscherten zwei Schwalben.' },
          ],
      },
      {
          title: 'Zungenbrecher',
          difficulty: 'Advanced',
          exercises: [
              { sentence: 'Fischers Fritze fischt frische Fische; frische Fische fischt Fischers Fritze.' },
              { sentence: 'Blaukraut bleibt Blaukraut und Brautkleid bleibt Brautkleid.' },
          ],
      },
  ],
};