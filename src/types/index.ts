export type UserLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type LearningGoal = 
  | 'Speaking'
  | 'Work'
  | 'Interview'
  | 'Travel'
  | 'Study'
  | 'Daily conversation'
  | 'Confidence';

export type DailyMinuteGoal = 5 | 10 | 15 | 30;

export interface Correction {
  original: string;
  better: string;
  why: string;
  trySaying: string;
  mistakeType: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'model';
  text: string;
  timestamp: number;
  correction?: Correction;
}

export interface Scenario {
  id: string;
  category: 'Daily Life' | 'Work' | 'Travel' | 'Social';
  title: string;
  description: string;
  role: string;
  iconName: string;
  initialMessage: string;
  suggestedPrompts: string[];
}

export interface Word {
  id: string;
  word: string;
  phonetic: string;
  meaning: string;
  exampleSentence: string;
  simpleExplanation: string;
  synonym?: string;
  opposite?: string;
  level: UserLevel;
  mastered?: boolean;
  reviewCount?: number;
  lastReviewed?: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface DailyLesson {
  topic: string;
  themeDescription: string;
  words: Word[];
  quiz: QuizQuestion[];
}

export interface GrammarExercise {
  id: string;
  title: string;
  category: string;
  level: UserLevel;
  wrongExample: string;
  correctExample: string;
  simpleExplanation: string;
  keyRule: string;
  quiz: QuizQuestion[];
}

export interface ListeningExercise {
  title: string;
  situation: string;
  dialogue: Array<{ speaker: string; text: string }>;
  questions: QuizQuestion[];
}

export interface ReadingPassage {
  title: string;
  passage: string;
  keyVocabulary: Array<{ word: string; definition: string }>;
  questions: QuizQuestion[];
}

export interface ConversationReport {
  speakingScore: number;
  grammarScore: number;
  vocabularyScore: number;
  fluencyScore: number;
  overallSummary: string;
  newWordsLearned: string[];
  commonMistakes: Array<{ mistake: string; correction: string; explanation: string }>;
  recommendedPractice: string;
}

export interface PronunciationItem {
  id: string;
  word: string;
  phonetic: string;
  breakdown: string;
  example: string;
  tip: string;
  level: UserLevel;
}

export interface UserProfile {
  name: string;
  level: UserLevel;
  goal: LearningGoal;
  dailyGoalMinutes: DailyMinuteGoal;
  todayPracticeMinutes: number;
  streak: number;
  lastPracticeDate: string; // YYYY-MM-DD
  totalPracticeMinutes: number;
  wordsLearnedCount: number;
  conversationsCount: number;
  onboardingCompleted: boolean;
  voiceRate: number; // 0.8, 1.0, 1.2
  voiceGender: 'female' | 'male';
  badges: string[];
  dailyHistory: Record<string, number>; // date -> minutes
  mistakeHistory: Correction[];
}
