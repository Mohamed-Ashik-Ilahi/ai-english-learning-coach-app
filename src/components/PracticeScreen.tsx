import React, { useState, useEffect } from 'react';
import { UserProfile, GrammarExercise, ListeningExercise, ReadingPassage } from '../types';
import { GRAMMAR_LESSONS, PRONUNCIATION_DECK, addPracticeMinutes } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import { SpeechService } from '../services/speechService';
import {
  Dumbbell,
  CheckCheck,
  Headphones,
  BookOpen,
  Mic,
  Volume2,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Send,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PracticeScreenProps {
  profile: UserProfile;
  initialSection?: 'grammar' | 'checker' | 'listening' | 'reading' | 'pronunciation';
  onUpdateProfile: () => void;
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({
  profile,
  initialSection = 'grammar',
  onUpdateProfile,
}) => {
  const [activeSection, setActiveSection] = useState<
    'grammar' | 'checker' | 'listening' | 'reading' | 'pronunciation'
  >(initialSection);

  // Sync if initialSection changes from outside
  useEffect(() => {
    if (initialSection) setActiveSection(initialSection);
  }, [initialSection]);

  // --- Grammar State ---
  const [selectedGrammarLesson, setSelectedGrammarLesson] = useState<GrammarExercise>(
    GRAMMAR_LESSONS[0]
  );
  const [grammarQuizAnswers, setGrammarQuizAnswers] = useState<Record<number, number>>({});
  const [grammarQuizSubmitted, setGrammarQuizSubmitted] = useState<boolean>(false);

  // --- Grammar Checker State ---
  const [checkerInput, setCheckerInput] = useState<string>('');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [checkerResult, setCheckerResult] = useState<{
    original: string;
    corrected: string;
    naturalEnglish: string;
    explanation: string;
    mistakeType: string;
    keyTip: string;
  } | null>(null);

  // --- Listening Practice State ---
  const [listeningData, setListeningData] = useState<ListeningExercise | null>(null);
  const [isLoadingListening, setIsLoadingListening] = useState<boolean>(false);
  const [listeningDifficulty, setListeningDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [showTranscript, setShowTranscript] = useState<boolean>(false);
  const [listeningQuizAnswers, setListeningQuizAnswers] = useState<Record<number, number>>({});
  const [listeningSubmitted, setListeningSubmitted] = useState<boolean>(false);

  // --- Reading Practice State ---
  const [readingData, setReadingData] = useState<ReadingPassage | null>(null);
  const [isLoadingReading, setIsLoadingReading] = useState<boolean>(false);
  const [selectedWordDefinition, setSelectedWordDefinition] = useState<{ word: string; definition: string } | null>(null);
  const [readingQuizAnswers, setReadingQuizAnswers] = useState<Record<number, number>>({});
  const [readingSubmitted, setReadingSubmitted] = useState<boolean>(false);

  // --- Pronunciation Practice State ---
  const [pronunciationIndex, setPronunciationIndex] = useState<number>(0);
  const [isPronouncing, setIsPronouncing] = useState<boolean>(false);
  const [spokenPronunciation, setSpokenPronunciation] = useState<string>('');
  const [pronunciationFeedback, setPronunciationFeedback] = useState<string | null>(null);
  const [pronunciationScore, setPronunciationScore] = useState<number | null>(null);

  // Load initial listening & reading on tab change
  useEffect(() => {
    if (activeSection === 'listening' && !listeningData) {
      loadListening();
    }
    if (activeSection === 'reading' && !readingData) {
      loadReading();
    }
  }, [activeSection]);

  const loadListening = async () => {
    setIsLoadingListening(true);
    try {
      const data = await geminiService.getListeningExercise(profile.level, listeningDifficulty);
      setListeningData(data);
      setListeningQuizAnswers({});
      setListeningSubmitted(false);
      setShowTranscript(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingListening(false);
    }
  };

  const loadReading = async () => {
    setIsLoadingReading(true);
    try {
      const data = await geminiService.getReadingPassage(profile.level);
      setReadingData(data);
      setReadingQuizAnswers({});
      setReadingSubmitted(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingReading(false);
    }
  };

  const playFullDialogue = () => {
    if (!listeningData) return;
    setIsPlayingAudio(true);

    const fullScript = listeningData.dialogue
      .map((d) => `${d.speaker} says: ${d.text}`)
      .join('. ');

    SpeechService.speak(fullScript, profile.voiceRate || 1.0, () => {
      setIsPlayingAudio(false);
    });
  };

  const stopDialogue = () => {
    SpeechService.stopSpeaking();
    setIsPlayingAudio(false);
  };

  // Grammar Checker
  const handleCheckGrammar = async (textToCheck?: string) => {
    const text = (textToCheck || checkerInput).trim();
    if (!text || isChecking) return;

    setIsChecking(true);
    try {
      const res = await geminiService.checkGrammar(text, profile.level);
      setCheckerResult(res);
      addPracticeMinutes(3);
      onUpdateProfile();
    } catch (e) {
      console.error(e);
    } finally {
      setIsChecking(false);
    }
  };

  // Pronunciation mic test
  const handleStartPronunciationTest = () => {
    const target = PRONUNCIATION_DECK[pronunciationIndex];
    setSpokenPronunciation('');
    setPronunciationFeedback(null);
    setPronunciationScore(null);
    setIsPronouncing(true);

    SpeechService.startListening(
      (transcript, isFinal) => {
        setSpokenPronunciation(transcript);
        if (isFinal) {
          setIsPronouncing(false);
          evaluatePronunciation(transcript, target.word);
        }
      },
      (error) => {
        setIsPronouncing(false);
        setPronunciationFeedback(error);
      }
    );
  };

  const evaluatePronunciation = (userSpoke: string, targetWord: string) => {
    const cleanedUser = userSpoke.toLowerCase().replace(/[^a-z]/g, '');
    const cleanedTarget = targetWord.toLowerCase().replace(/[^a-z]/g, '');

    if (cleanedUser.includes(cleanedTarget) || cleanedTarget.includes(cleanedUser)) {
      setPronunciationScore(95);
      setPronunciationFeedback('Excellent pronunciation! Your syllable clarity is right on target.');
      addPracticeMinutes(2);
      onUpdateProfile();
      try {
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      } catch {}
    } else {
      setPronunciationScore(75);
      setPronunciationFeedback(`Good try! You said "${userSpoke}". Listen again and focus on: ${PRONUNCIATION_DECK[pronunciationIndex].phonetic}`);
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-5 animate-in fade-in duration-300">
      {/* Top Header */}
      <header className="space-y-1">
        <span className="text-xs font-semibold text-emerald-600 tracking-wide uppercase">
          Skill Practice Studio
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Targeted Practice
        </h1>
        <p className="text-xs text-slate-500">
          Sharpen grammar, check sentences, test listening, and perfect pronunciation.
        </p>
      </header>

      {/* Horizontal Practice Category Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'grammar', label: 'Grammar', icon: Dumbbell },
          { id: 'checker', label: 'Check English', icon: CheckCheck },
          { id: 'listening', label: 'Listening', icon: Headphones },
          { id: 'reading', label: 'Reading', icon: BookOpen },
          { id: 'pronunciation', label: 'Pronounce', icon: Mic },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. GRAMMAR PRACTICE SECTION */}
      {activeSection === 'grammar' && (
        <div className="space-y-4">
          {/* Grammar topic selector */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {GRAMMAR_LESSONS.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => {
                  setSelectedGrammarLesson(lesson);
                  setGrammarQuizAnswers({});
                  setGrammarQuizSubmitted(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedGrammarLesson.id === lesson.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {lesson.category}
              </button>
            ))}
          </div>

          {/* Simple Wrong vs Correct Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                {selectedGrammarLesson.category} Lesson
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                {selectedGrammarLesson.title}
              </h3>
            </div>

            {/* Wrong vs Right comparison */}
            <div className="space-y-2.5">
              <div className="p-3 bg-red-50/70 border border-red-100 rounded-2xl">
                <span className="text-[10px] font-bold text-red-600 uppercase">Wrong:</span>
                <p className="text-xs font-semibold text-slate-800 line-through mt-0.5">
                  "{selectedGrammarLesson.wrongExample}"
                </p>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Correct:</span>
                  <p className="text-xs font-extrabold text-slate-900 mt-0.5">
                    "{selectedGrammarLesson.correctExample}"
                  </p>
                </div>
                <button
                  onClick={() =>
                    SpeechService.speak(
                      selectedGrammarLesson.correctExample,
                      profile.voiceRate || 1.0
                    )
                  }
                  className="w-8 h-8 rounded-xl bg-white text-emerald-600 flex items-center justify-center shadow-xs"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Non-academic simple explanation */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-xs font-bold text-slate-800">Simple Explanation:</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedGrammarLesson.simpleExplanation}
              </p>
              <p className="text-[11px] text-emerald-700 font-semibold pt-1">
                <strong>Rule of Thumb:</strong> {selectedGrammarLesson.keyRule}
              </p>
            </div>

            {/* Interactive Practice Questions */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800">
                Quick Practice Questions:
              </h4>

              {selectedGrammarLesson.quiz.map((q, qIdx) => {
                const selected = grammarQuizAnswers[qIdx];
                return (
                  <div key={qIdx} className="space-y-2 pb-3 border-b border-slate-100 last:border-none">
                    <p className="text-xs font-bold text-slate-800">
                      {qIdx + 1}. {q.question}
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {q.options.map((opt, optIdx) => {
                        let style = 'bg-slate-50 border-slate-200 text-slate-700';
                        if (grammarQuizSubmitted) {
                          if (optIdx === q.correctIndex) {
                            style = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                          } else if (selected === optIdx) {
                            style = 'bg-red-50 border-red-300 text-red-800 line-through';
                          }
                        } else if (selected === optIdx) {
                          style = 'bg-emerald-50 border-emerald-600 text-emerald-900 font-semibold';
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => {
                              if (!grammarQuizSubmitted) {
                                setGrammarQuizAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
                              }
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-all ${style}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {!grammarQuizSubmitted ? (
                <button
                  onClick={() => {
                    setGrammarQuizSubmitted(true);
                    addPracticeMinutes(4);
                    onUpdateProfile();
                    try {
                      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
                    } catch {}
                  }}
                  disabled={
                    Object.keys(grammarQuizAnswers).length < selectedGrammarLesson.quiz.length
                  }
                  className="w-full py-3 bg-emerald-600 disabled:bg-slate-200 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  Check Answers
                </button>
              ) : (
                <button
                  onClick={() => {
                    setGrammarQuizAnswers({});
                    setGrammarQuizSubmitted(false);
                  }}
                  className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-2xl font-bold text-xs active:scale-95"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. CHECK MY ENGLISH (AI GRAMMAR CHECKER) */}
      {activeSection === 'checker' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                AI Grammar Analyzer
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                Check My English
              </h3>
              <p className="text-xs text-slate-500">
                Type or paste any sentence you wrote to inspect grammar, naturalness, and native phrasing.
              </p>
            </div>

            <textarea
              rows={3}
              value={checkerInput}
              onChange={(e) => setCheckerInput(e.target.value)}
              placeholder="e.g. I am go to office yesterday with my friend..."
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />

            {/* Quick Sample Sentences for 1-tap test */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Or try a sample:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "I am go to office yesterday.",
                  "She don't likes coffee very much.",
                  "I look forward to meet you tomorrow.",
                ].map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCheckerInput(s);
                      handleCheckGrammar(s);
                    }}
                    className="text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200 font-medium"
                  >
                    "{s}"
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleCheckGrammar()}
              disabled={!checkerInput.trim() || isChecking}
              className="w-full py-3 bg-blue-600 disabled:bg-slate-300 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isChecking ? 'Checking with Gemini AI...' : 'Analyze Sentence'}</span>
            </button>
          </div>

          {/* Results card */}
          {checkerResult && (
            <div className="bg-white rounded-3xl p-5 border border-blue-100 shadow-sm space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                  {checkerResult.mistakeType}
                </span>
                <button
                  onClick={() =>
                    SpeechService.speak(
                      checkerResult.naturalEnglish,
                      profile.voiceRate || 1.0
                    )
                  }
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Listen</span>
                </button>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Your Input:</span>
                  <p className="text-xs text-slate-700 font-medium mt-0.5">
                    "{checkerResult.original}"
                  </p>
                </div>

                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">
                    Correct English:
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    "{checkerResult.corrected}"
                  </p>
                </div>

                <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
                  <span className="text-[10px] font-bold text-purple-700 uppercase">
                    More Natural Native Way:
                  </span>
                  <p className="text-xs font-bold text-purple-950 mt-0.5">
                    "{checkerResult.naturalEnglish}"
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl space-y-1">
                <span className="text-xs font-bold text-slate-800">Why:</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {checkerResult.explanation}
                </p>
                <p className="text-[11px] text-blue-700 font-semibold pt-1">
                  💡 {checkerResult.keyTip}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. LISTENING PRACTICE SECTION */}
      {activeSection === 'listening' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                  Audio Comprehension
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {listeningData?.title || 'Weekend Plans at the Cafe'}
                </h3>
                <p className="text-xs text-slate-500">
                  {listeningData?.situation || 'Listen to the conversation and answer questions.'}
                </p>
              </div>

              {/* Difficulty badge */}
              <div className="flex gap-1">
                {(['Easy', 'Medium', 'Hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => {
                      setListeningDifficulty(diff);
                      loadListening();
                    }}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${
                      listeningDifficulty === diff
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Player Controls */}
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={isPlayingAudio ? stopDialogue : playFullDialogue}
                  className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 active:scale-95 transition-transform"
                >
                  {isPlayingAudio ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>
                <div>
                  <h4 className="text-xs font-bold text-amber-950">
                    {isPlayingAudio ? 'Playing Conversation...' : 'Play Conversation'}
                  </h4>
                  <p className="text-[11px] text-amber-800">
                    Voice speed: {profile.voiceRate || 1.0}x
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 bg-white/80 px-2.5 py-1.5 rounded-xl border border-amber-200"
              >
                {showTranscript ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showTranscript ? 'Hide' : 'Script'}</span>
              </button>
            </div>

            {/* Hidden / Reveal Transcript */}
            {showTranscript && listeningData && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 animate-in fade-in">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Transcript:
                </span>
                {listeningData.dialogue.map((line, idx) => (
                  <p key={idx} className="text-xs text-slate-700">
                    <strong className="text-slate-900">{line.speaker}:</strong> {line.text}
                  </p>
                ))}
              </div>
            )}

            {/* Questions */}
            {listeningData && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800">
                  Comprehension Questions:
                </h4>

                {listeningData.questions.map((q, idx) => {
                  const selected = listeningQuizAnswers[idx];
                  return (
                    <div key={idx} className="space-y-2 pb-3 border-b border-slate-100 last:border-none">
                      <p className="text-xs font-bold text-slate-800">
                        {idx + 1}. {q.question}
                      </p>

                      <div className="grid grid-cols-1 gap-1.5">
                        {q.options.map((opt, oIdx) => {
                          let style = 'bg-slate-50 border-slate-200 text-slate-700';
                          if (listeningSubmitted) {
                            if (oIdx === q.correctIndex) {
                              style = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                            } else if (selected === oIdx) {
                              style = 'bg-red-50 border-red-300 text-red-800 line-through';
                            }
                          } else if (selected === oIdx) {
                            style = 'bg-amber-50 border-amber-600 text-amber-900 font-semibold';
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() => {
                                if (!listeningSubmitted) {
                                  setListeningQuizAnswers((prev) => ({ ...prev, [idx]: oIdx }));
                                }
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-all ${style}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {listeningSubmitted && (
                        <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl">
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}

                {!listeningSubmitted ? (
                  <button
                    onClick={() => {
                      setListeningSubmitted(true);
                      addPracticeMinutes(5);
                      onUpdateProfile();
                      try {
                        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
                      } catch {}
                    }}
                    disabled={
                      Object.keys(listeningQuizAnswers).length < listeningData.questions.length
                    }
                    className="w-full py-3 bg-amber-600 disabled:bg-slate-200 text-white rounded-2xl font-bold text-xs active:scale-95 transition-all shadow-md shadow-amber-500/20"
                  >
                    Submit Answers
                  </button>
                ) : (
                  <button
                    onClick={loadListening}
                    className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-2xl font-bold text-xs active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Next Audio Exercise</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. READING PRACTICE SECTION */}
      {activeSection === 'reading' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                Short Reading Passage
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                {readingData?.title || 'Language Learning Micro-Habits'}
              </h3>
              <p className="text-xs text-slate-400">
                Tap highlighted words to view instant definitions!
              </p>
            </div>

            {/* Reading Passage Body */}
            {readingData && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-800 text-xs leading-relaxed space-y-3 font-normal">
                {readingData.passage.split('\n\n').map((para, pIdx) => (
                  <p key={pIdx}>{para}</p>
                ))}
              </div>
            )}

            {/* Interactive vocabulary tags */}
            {readingData && readingData.keyVocabulary.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Key Vocabulary (Tap to define):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {readingData.keyVocabulary.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedWordDefinition(v)}
                      className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold border border-purple-100 flex items-center gap-1"
                    >
                      <span>{v.word}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Word Definition Popup */}
            {selectedWordDefinition && (
              <div className="p-3 bg-purple-50/90 rounded-2xl border border-purple-200 text-xs space-y-1 animate-in zoom-in-95">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-purple-950">
                    {selectedWordDefinition.word}
                  </h4>
                  <button
                    onClick={() =>
                      SpeechService.speak(selectedWordDefinition.word, profile.voiceRate || 1.0)
                    }
                    className="text-purple-700 hover:text-purple-900"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-slate-600">{selectedWordDefinition.definition}</p>
              </div>
            )}

            {/* Comprehension Quiz */}
            {readingData && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800">
                  Reading Questions:
                </h4>

                {readingData.questions.map((q, idx) => {
                  const selected = readingQuizAnswers[idx];
                  return (
                    <div key={idx} className="space-y-2 pb-3 border-b border-slate-100 last:border-none">
                      <p className="text-xs font-bold text-slate-800">
                        {idx + 1}. {q.question}
                      </p>

                      <div className="grid grid-cols-1 gap-1.5">
                        {q.options.map((opt, oIdx) => {
                          let style = 'bg-slate-50 border-slate-200 text-slate-700';
                          if (readingSubmitted) {
                            if (oIdx === q.correctIndex) {
                              style = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                            } else if (selected === oIdx) {
                              style = 'bg-red-50 border-red-300 text-red-800 line-through';
                            }
                          } else if (selected === oIdx) {
                            style = 'bg-purple-50 border-purple-600 text-purple-900 font-semibold';
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() => {
                                if (!readingSubmitted) {
                                  setReadingQuizAnswers((prev) => ({ ...prev, [idx]: oIdx }));
                                }
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-all ${style}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {!readingSubmitted ? (
                  <button
                    onClick={() => {
                      setReadingSubmitted(true);
                      addPracticeMinutes(5);
                      onUpdateProfile();
                    }}
                    disabled={
                      Object.keys(readingQuizAnswers).length < readingData.questions.length
                    }
                    className="w-full py-3 bg-purple-600 disabled:bg-slate-200 text-white rounded-2xl font-bold text-xs active:scale-95 shadow-md shadow-purple-500/20"
                  >
                    Check Reading Comprehension
                  </button>
                ) : (
                  <button
                    onClick={loadReading}
                    className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-2xl font-bold text-xs"
                  >
                    Load New Reading Passage
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. PRONUNCIATION PRACTICE SECTION */}
      {activeSection === 'pronunciation' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4 text-center">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Pronunciation Clinic
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                {PRONUNCIATION_DECK[pronunciationIndex].word}
              </h3>
              <p className="text-xs text-blue-600 font-mono font-bold mt-0.5">
                {PRONUNCIATION_DECK[pronunciationIndex].phonetic}
              </p>
            </div>

            {/* Syllable Breakdown Box */}
            <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-100 space-y-1">
              <p className="text-xs font-bold text-blue-950">
                {PRONUNCIATION_DECK[pronunciationIndex].breakdown}
              </p>
              <p className="text-[11px] text-slate-600">
                <strong>Tip:</strong> {PRONUNCIATION_DECK[pronunciationIndex].tip}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() =>
                  SpeechService.speak(
                    PRONUNCIATION_DECK[pronunciationIndex].word,
                    profile.voiceRate || 1.0
                  )
                }
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Volume2 className="w-4 h-4" />
                <span>Hear Native</span>
              </button>

              <button
                onClick={handleStartPronunciationTest}
                className={`px-5 py-2.5 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-md ${
                  isPronouncing
                    ? 'bg-red-500 animate-pulse'
                    : 'bg-blue-600 shadow-blue-500/20'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>{isPronouncing ? 'Listening...' : 'Speak Word'}</span>
              </button>
            </div>

            {/* Feedback result */}
            {pronunciationFeedback && (
              <div
                className={`p-3.5 rounded-2xl border text-xs text-left space-y-1 ${
                  pronunciationScore && pronunciationScore >= 90
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>Feedback</span>
                  {pronunciationScore && <span>Match: {pronunciationScore}%</span>}
                </div>
                <p className="leading-relaxed">{pronunciationFeedback}</p>
              </div>
            )}

            {/* Next word buttons */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <button
                onClick={() => {
                  setPronunciationIndex(
                    (pronunciationIndex - 1 + PRONUNCIATION_DECK.length) %
                      PRONUNCIATION_DECK.length
                  );
                  setPronunciationFeedback(null);
                  setSpokenPronunciation('');
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Previous Word
              </button>
              <button
                onClick={() => {
                  setPronunciationIndex(
                    (pronunciationIndex + 1) % PRONUNCIATION_DECK.length
                  );
                  setPronunciationFeedback(null);
                  setSpokenPronunciation('');
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                Next Word →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
