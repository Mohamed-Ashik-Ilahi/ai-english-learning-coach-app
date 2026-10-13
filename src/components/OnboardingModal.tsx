import React, { useState } from 'react';
import { UserProfile, UserLevel, LearningGoal, DailyMinuteGoal } from '../types';
import { Sparkles, Check, ArrowRight, HelpCircle, User, Compass, Clock, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OnboardingModalProps {
  onComplete: (profile: Partial<UserProfile>) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>('');
  const [level, setLevel] = useState<UserLevel>('Beginner');
  const [goal, setGoal] = useState<LearningGoal>('Speaking');
  const [minutes, setMinutes] = useState<DailyMinuteGoal>(15);

  // Diagnostic Quiz State for "I'm not sure"
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState<boolean>(false);
  const [diagnosticIndex, setDiagnosticIndex] = useState<number>(0);
  const [diagnosticScore, setDiagnosticScore] = useState<number>(0);

  const diagnosticQuestions = [
    {
      q: 'Choose the correct sentence:',
      options: [
        'She don’t like coffee.',
        'She doesn’t likes coffee.',
        'She doesn’t like coffee.',
        'She not like coffee.',
      ],
      correct: 2,
    },
    {
      q: 'Which word best fills the blank: "If it rains tomorrow, we ___ stay indoors."',
      options: ['will', 'would have', 'did', 'are'],
      correct: 0,
    },
    {
      q: 'Choose the most natural expression for agreeing with an opinion:',
      options: [
        'I am total agree with you.',
        'I couldn’t agree more.',
        'I am agreeing complete.',
        'I have agreeing with this.',
      ],
      correct: 1,
    },
  ];

  const handleDiagnosticAnswer = (index: number) => {
    let nextScore = diagnosticScore;
    if (index === diagnosticQuestions[diagnosticIndex].correct) {
      nextScore += 1;
      setDiagnosticScore(nextScore);
    }

    if (diagnosticIndex + 1 < diagnosticQuestions.length) {
      setDiagnosticIndex(diagnosticIndex + 1);
    } else {
      // Determine level
      let assignedLevel: UserLevel = 'Beginner';
      if (nextScore === 3) assignedLevel = 'Advanced';
      else if (nextScore >= 1) assignedLevel = 'Intermediate';
      else assignedLevel = 'Beginner';

      setLevel(assignedLevel);
      setIsDiagnosticOpen(false);
    }
  };

  const handleFinish = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {}

    onComplete({
      name: name.trim() || 'Learner',
      level,
      goal,
      dailyGoalMinutes: minutes,
      onboardingCompleted: true,
    });
  };

  const goalsList: { id: LearningGoal; label: string; desc: string; emoji: string }[] = [
    { id: 'Speaking', label: 'Speaking Fluency', desc: 'Speak naturally without pausing or anxiety', emoji: '🗣' },
    { id: 'Daily conversation', label: 'Daily Conversation', desc: 'Chat comfortably with friends and locals', emoji: '☕️' },
    { id: 'Work', label: 'Work & Career', desc: 'Meetings, presentations, and email discussions', emoji: '💼' },
    { id: 'Interview', label: 'Job Interviews', desc: 'Answer questions clearly with professionalism', emoji: '🎯' },
    { id: 'Travel', label: 'Travel Abroad', desc: 'Navigate airports, hotels, and restaurants', emoji: '✈️' },
    { id: 'Confidence', label: 'General Confidence', desc: 'Overcome fear and express yourself', emoji: '🔥' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Progress */}
        <div className="px-6 pt-6 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">English AI Coach</h2>
              <p className="text-[11px] text-slate-500 font-medium">Personalized Setup</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-6 bg-blue-600'
                    : i < step
                    ? 'w-3 bg-blue-300'
                    : 'w-3 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* STEP 1: Name */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center pt-2">
                <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-2xl mb-3">
                  <User className="w-7 h-7" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  Welcome to English AI Coach!
                </h1>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                  Speak English with confidence every day. What should your AI teacher call you?
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Your Name or Nickname
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah, Alex, or Chris"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-base font-medium transition-all"
                  autoFocus
                />
              </div>

              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-start gap-3">
                <span className="text-xl">💡</span>
                <p className="text-xs text-blue-900/80 leading-relaxed font-medium">
                  Your AI Coach adapts each conversation to your personal pace, so you can practice speaking comfortably without pressure.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Level Selection */}
          {step === 2 && !isDiagnosticOpen && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  What is your English level?
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  We will calibrate vocabulary, speaking speed, and lessons for you.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: 'Beginner' as UserLevel,
                    title: 'Beginner (A1 – A2)',
                    desc: 'I know basic words, but I hesitate when making sentences.',
                    badge: 'A1–A2',
                  },
                  {
                    id: 'Intermediate' as UserLevel,
                    title: 'Intermediate (B1 – B2)',
                    desc: 'I can have everyday conversations, but need better grammar and natural idioms.',
                    badge: 'B1–B2',
                  },
                  {
                    id: 'Advanced' as UserLevel,
                    title: 'Advanced (C1 – C2)',
                    desc: 'I speak fluently, but want professional nuance and native expressions.',
                    badge: 'C1–C2',
                  },
                ].map((item) => {
                  const isSelected = level === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setLevel(item.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-sm shadow-blue-500/10'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}

                {/* "I'm not sure" Assessment Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDiagnosticOpen(true);
                    setDiagnosticIndex(0);
                    setDiagnosticScore(0);
                  }}
                  className="w-full p-3.5 rounded-2xl border border-dashed border-purple-300 bg-purple-50/50 hover:bg-purple-50 text-purple-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-purple-600" />
                  <span>I'm not sure — Take quick 1-minute test</span>
                </button>
              </div>
            </div>
          )}

          {/* Diagnostic Sub-flow */}
          {step === 2 && isDiagnosticOpen && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                  Question {diagnosticIndex + 1} of {diagnosticQuestions.length}
                </span>
                <button
                  onClick={() => setIsDiagnosticOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {diagnosticQuestions[diagnosticIndex].q}
              </h3>
              <div className="space-y-2 pt-2">
                {diagnosticQuestions[diagnosticIndex].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleDiagnosticAnswer(i)}
                    className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/40 text-xs font-medium text-slate-800 transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Learning Goal */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Why do you want to learn English?
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Choose your main goal so the AI can craft realistic practice scenarios.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {goalsList.map((item) => {
                  const isSelected = goal === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setGoal(item.id)}
                      className={`text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.emoji}</span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{item.label}</p>
                          <p className="text-[11px] text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Daily Goal Commitment */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Daily English Practice Goal
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  How many minutes can you practice every day? Small daily habits build fluency fastest.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { m: 5 as DailyMinuteGoal, label: '5 min / day', sub: 'Casual Pace' },
                  { m: 10 as DailyMinuteGoal, label: '10 min / day', sub: 'Steady Pace' },
                  { m: 15 as DailyMinuteGoal, label: '15 min / day', sub: 'Recommended ★' },
                  { m: 30 as DailyMinuteGoal, label: '30 min / day', sub: 'Intensive Pace' },
                ].map((item) => {
                  const isSelected = minutes === item.m;
                  return (
                    <button
                      key={item.m}
                      onClick={() => setMinutes(item.m)}
                      className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/80 shadow-md shadow-blue-500/10'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <Clock
                        className={`w-6 h-6 mb-2 ${
                          isSelected ? 'text-blue-600' : 'text-slate-400'
                        }`}
                      />
                      <span className="text-sm font-extrabold text-slate-900">{item.label}</span>
                      <span
                        className={`text-[10px] font-semibold mt-0.5 ${
                          isSelected ? 'text-blue-600' : 'text-slate-400'
                        }`}
                      >
                        {item.sub}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Personalized plan summary card */}
              <div className="p-4 bg-gradient-to-br from-blue-50 via-indigo-50/40 to-purple-50 rounded-2xl border border-blue-100 space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span>Your Personalized AI Plan Ready</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Learner: <strong className="text-slate-900">{name || 'Friend'}</strong> • Level:{' '}
                  <strong className="text-slate-900">{level}</strong> • Daily Goal:{' '}
                  <strong className="text-slate-900">{minutes} minutes</strong>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {step > 1 && !isDiagnosticOpen ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="ml-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="ml-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
            >
              <span>Start Learning Now</span>
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
