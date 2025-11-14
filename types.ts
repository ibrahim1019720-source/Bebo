
export interface WordFeedback {
  word: string;
  isCorrect: boolean;
  userPronunciation: string;
  nativePronunciation: string;
  tip: string;
  userWaveform?: number[];
  nativeWaveform?: number[];
  problemPhonemeUser?: string;
  problemPhonemeNative?: string;
  intonationFeedback?: string;
  rhythmFeedback?: string;
}

export interface PracticeExercise {
  type: 'Minimal Pair' | 'Tongue Twister' | 'Repetition Phrase' | 'Fill in the Blanks' | 'Sentence Stress Practice';
  sentence: string;
}

export interface AnalysisResult {
  overallScore: number;
  fluencyScore: number;
  feedbackSummary: string;
  detailedFeedback: WordFeedback[];
  personalizedWorkout: PracticeExercise[];
  detectedLanguage?: string;
}

export interface LanguageOption {
    id: string;
    name: string;
    voice: string;
}

export interface Exercise {
  sentence: string;
}

export interface ExerciseCategory {
  title: string;
  exercises: Exercise[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface TranscriptEntry {
  source: 'user' | 'model';
  text: string;
  isFinal: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface SimpleLanguageOption {
    id: string;
    name: string;
}

export interface PracticeSession {
  id: string;
  date: string;
  score: number;
  fluencyScore: number;
  language: string;
  referenceText: string;
  incorrectWords: WordFeedback[];
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string; // The first letter of the name
  createdAt: string;
  practiceHistory: PracticeSession[];
  lastSelectedLanguageId: string;
  lastExplanationLanguageId: string;
}