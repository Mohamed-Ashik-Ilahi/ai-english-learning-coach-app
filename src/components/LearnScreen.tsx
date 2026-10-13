import React, { useState, useEffect } from 'react';
import { UserProfile, DailyLesson, Word } from '../types';
import { geminiService } from '../services/geminiService';
import {
  loadVocabulary,
  updateWordStatus,
  addPracticeMinutes,
} from '../services/storageService';
import { SpeechService } from '../services/speechService';
import {
  BookOpen,
  Volume2,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Award,
  Search,
  Check,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LearnScreenProps {
  profile: UserProfile;
  dailyLesson: DailyLesson | null;
  onUpdateDailyLesson: (lesson: DailyLesson) => void;
  onUpdateProfile: () => void;
}

export const LearnScreen: React.FC<LearnScreenProps> = ({
  profile,
  dailyLesson,
  onUpdateDailyLesson,
  onUpdateProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'vault'>('daily');
  const [isLoadingLesson, setIsLoadingLesson] = useState<boolean>(false);

  // Quiz state for daily lesson
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);

  // Vocabulary Vault state
  const [words, setWords] = useState<Word[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'need_practice' | 'mastered'>('all');

  useEffect(() => {
    setWords(loadVocabulary());
  }, []);

  const handleFetchNewLesson = async () => {
    setIsLoadingLesson(true);
    try {
      const lesson = await geminiService.getDailyLesson(profile.level);
      onUpdateDailyLesson(lesson);
      setQuizAnswers({});
      setQuizSubmitted(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLesson(false);
    }
  };

  const handleSelectQuizOption = (qIndex: number, optionIndex: number) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  };

  const handleSubmitQuiz = () => {
    if (!dailyLesson) return;
    let score = 0;
    dailyLesson.quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctIndex) {
        score++;
      }
    });

    setQuizScore(score);
    setQuizSubmitted(true);
    addPracticeMinutes(5);
    onUpdateProfile();

    if (score === dailyLesson.quiz.length) {
      try {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      } catch {}
    }
  };

  const handleToggleWordMastery = (wordId: string, currentMastered: boolean) => {
    const updated = updateWordStatus(wordId, !currentMastered);
    setWords(updated);
    onUpdateProfile();
  };

  const playWordAudio = (word: string) => {
    SpeechService.speak(word, profile.voiceRate || 1.0);
  };

  const filteredWords = words.filter((w) => {
    const matchesSearch =
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.meaning.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterMode === 'need_practice') return !w.mastered;
    if (filterMode === 'mastered') return w.mastered;
    return true;
  });

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-5 animate-in fade-in duration-300">
      {/* Top Header */}
      <header className="space-y-1">
        <span className="text-xs font-semibold text-purple-600 tracking-wide uppercase">
          Vocabulary & Daily Lessons
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Learn English Daily
        </h1>
        <p className="text-xs text-slate-500">
          Expand your active vocabulary and master new conversational expressions.
        </p>
      </header>

      {/* Segmented Control */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'daily'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Today's Lesson
        </button>
        <button
          onClick={() => setActiveTab('vault')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'vault'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Vocabulary Vault ({words.length})
        </button>
      </div>

      {/* TAB 1: Today's Lesson */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Lesson Banner */}
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-5 text-white shadow-lg shadow-purple-500/20 relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-white/20 rounded-full uppercase tracking-wider">
                  Personalized for {profile.level}
                </span>
                <button
                  onClick={handleFetchNewLesson}
                  disabled={isLoadingLesson}
                  className="flex items-center gap-1 text-[11px] font-semibold text-purple-100 hover:text-white bg-white/10 px-2.5 py-1 rounded-xl active:scale-95 transition-transform"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingLesson ? 'animate-spin' : ''}`} />
                  <span>Generate New</span>
                </button>
              </div>

              <h2 className="text-lg font-black tracking-tight">
                {dailyLesson?.topic || 'Talking About Your Morning Routine'}
              </h2>
              <p className="text-xs text-purple-100 leading-relaxed font-medium">
                {dailyLesson?.themeDescription || 'Learn 5 practical words to describe your daily habits.'}
              </p>
            </div>
          </div>

          {/* 5 Words Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">5 New Words for Today</h3>
              <span className="text-xs text-slate-400">Tap audio to listen</span>
            </div>

            <div className="space-y-3">
              {dailyLesson?.words.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2.5 transition-all hover:border-purple-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-black text-purple-600 w-4">
                          0{idx + 1}.
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900 tracking-tight">
                          {item.word}
                        </h4>
                        <span className="text-xs text-slate-400 font-mono">
                          {item.phonetic}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 mt-1 pl-6">
                        {item.meaning}
                      </p>
                    </div>

                    <button
                      onClick={() => playWordAudio(item.word)}
                      className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center hover:bg-purple-100 active:scale-95 transition-transform shrink-0"
                      aria-label={`Listen to ${item.word}`}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Example sentence & explanation */}
                  <div className="pl-6 space-y-1.5 pt-1 border-t border-slate-100/80">
                    <p className="text-xs text-slate-600 italic">
                      "{item.exampleSentence}"
                    </p>
                    <p className="text-[11px] text-purple-900/80 bg-purple-50/60 p-2 rounded-xl border border-purple-100/50">
                      <strong>Coach Alex:</strong> {item.simpleExplanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Quiz Section */}
          {dailyLesson && dailyLesson.quiz.length > 0 && (
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Comprehension Quiz</h3>
                    <p className="text-[11px] text-slate-400">Test what you just learned</p>
                  </div>
                </div>

                {quizSubmitted && (
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">
                    Score: {quizScore}/{dailyLesson.quiz.length}
                  </span>
                )}
              </div>

              <div className="space-y-4 pt-1">
                {dailyLesson.quiz.map((q, qIdx) => {
                  const selectedOpt = quizAnswers[qIdx];
                  const isCorrect = selectedOpt === q.correctIndex;

                  return (
                    <div key={qIdx} className="space-y-2 border-b border-slate-100 pb-4 last:border-none">
                      <p className="text-xs font-bold text-slate-800 leading-snug">
                        {qIdx + 1}. {q.question}
                      </p>

                      <div className="grid grid-cols-1 gap-1.5">
                        {q.options.map((opt, optIdx) => {
                          const isOptionSelected = selectedOpt === optIdx;
                          let btnStyle = 'border-slate-200 bg-white text-slate-700 hover:border-purple-300';

                          if (quizSubmitted) {
                            if (optIdx === q.correctIndex) {
                              btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                            } else if (isOptionSelected && !isCorrect) {
                              btnStyle = 'border-red-400 bg-red-50 text-red-800 line-through';
                            }
                          } else if (isOptionSelected) {
                            btnStyle = 'border-purple-600 bg-purple-50 text-purple-900 font-semibold';
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectQuizOption(qIdx, optIdx)}
                              className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs transition-all active:scale-[0.99] ${btnStyle}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl mt-1">
                          <strong>Explanation:</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {!quizSubmitted ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(quizAnswers).length < dailyLesson.quiz.length}
                  className="w-full py-3 bg-purple-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl font-bold text-xs shadow-md shadow-purple-500/20 active:scale-95 transition-all"
                >
                  Submit Quiz Answers
                </button>
              ) : (
                <button
                  onClick={() => {
                    setQuizAnswers({});
                    setQuizSubmitted(false);
                  }}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Quiz</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Vocabulary Vault */}
      {activeTab === 'vault' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search words, meanings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 shadow-2xs"
            />
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'All Words' },
              { id: 'need_practice', label: 'Need Practice' },
              { id: 'mastered', label: 'Mastered' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterMode(f.id as any)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  filterMode === f.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Words list */}
          <div className="space-y-3">
            {filteredWords.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-base font-extrabold text-slate-900">{item.word}</h3>
                      <span className="text-xs text-slate-400 font-mono">{item.phonetic}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">{item.meaning}</p>
                  </div>

                  <button
                    onClick={() => playWordAudio(item.word)}
                    className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center hover:bg-purple-100 active:scale-95 transition-transform"
                    aria-label={`Pronounce ${item.word}`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                  <p className="text-xs text-slate-600 italic">"{item.exampleSentence}"</p>
                  {item.synonym && (
                    <p className="text-[11px] text-slate-500">
                      <strong>Synonyms:</strong> {item.synonym}
                    </p>
                  )}
                </div>

                {/* Spaced repetition action buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => handleToggleWordMastery(item.id, !!item.mastered)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                      item.mastered
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{item.mastered ? 'I Know This ✓' : 'Mark as Mastered'}</span>
                  </button>

                  <button
                    onClick={() => playWordAudio(item.exampleSentence)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 active:scale-95"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Sentence</span>
                  </button>
                </div>
              </div>
            ))}

            {filteredWords.length === 0 && (
              <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 p-4">
                <p className="text-xs text-slate-400">No words match your current filter.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
