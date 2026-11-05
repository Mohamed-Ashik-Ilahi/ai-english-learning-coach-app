import React from 'react';
import { UserProfile, DailyLesson } from '../types';
import { TabType } from './BottomNav';
import {
  MessageSquare,
  BookOpen,
  Dumbbell,
  Headphones,
  Flame,
  Sparkles,
  ArrowRight,
  Settings,
  CheckCircle2,
  Play,
  Volume2,
  CheckCheck,
  Menu,
} from 'lucide-react';
import { SpeechService } from '../services/speechService';

interface HomeScreenProps {
  profile: UserProfile;
  lastLesson: DailyLesson | null;
  onNavigate: (tab: TabType, extra?: any) => void;
  onOpenSettings: () => void;
  onOpenGrammarChecker: () => void;
  onOpenMobileMenu?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  lastLesson,
  onNavigate,
  onOpenSettings,
  onOpenGrammarChecker,
  onOpenMobileMenu,
}) => {
  // Determine greeting based on current local hour
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Progress calculations
  const goalMin = profile.dailyGoalMinutes || 15;
  const currentMin = profile.todayPracticeMinutes || 0;
  const progressPercent = Math.min(100, Math.round((currentMin / goalMin) * 100));

  // Circular progress SVG constants
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const playVoiceSample = (text: string) => {
    SpeechService.speak(text, profile.voiceRate || 1.0);
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-5 animate-in fade-in duration-300">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-blue-600 tracking-wide uppercase">
            English AI Coach
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>{greeting}, {profile.name || 'Friend'}</span>
            <span className="text-xl">👋</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Level badge */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100 text-xs font-bold shadow-xs active:scale-95 transition-transform"
          >
            <span>{profile.level}</span>
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
            aria-label="Settings and Profile"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Mobile Menu drawer toggle */}
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
              aria-label="Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Today's English Goal & Progress Ring Card */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-5 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1 pr-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
              Today's English Goal
            </span>
            <h2 className="text-lg font-extrabold leading-snug">
              Practice English for {goalMin} minutes today
            </h2>
            <p className="text-xs text-blue-100/90 font-medium">
              {currentMin >= goalMin ? 'Goal completed! Great consistency!' : `${goalMin - currentMin} minutes left to hit your goal.`}
            </p>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => onNavigate('speak')}
                className="px-3.5 py-1.5 bg-white text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Start Speaking</span>
              </button>
            </div>
          </div>

          {/* Progress Ring */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="currentColor"
                strokeWidth="7"
                className="text-blue-400/30"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="currentColor"
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="text-white transition-all duration-700 ease-out"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-sm font-black text-white">
                {currentMin} / {goalMin}
              </span>
              <span className="text-[10px] font-medium text-blue-100">min</span>
            </div>
          </div>
        </div>

        {/* Ambient subtle decorative background glow */}
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </section>

      {/* Daily Streak Card */}
      <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shadow-xs">
            <Flame className="w-6 h-6 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold text-slate-900">
                {profile.streak} Days Streak
              </span>
              <span className="text-xs">🔥</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              You are building positive momentum!
            </p>
          </div>
        </div>

        {/* 7-day mini tracker dots */}
        <div className="flex items-center gap-1">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
            const isCompleted = idx < Math.min(profile.streak, 7);
            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                <span className="text-[9px] text-slate-400 font-semibold">{day}</span>
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    isCompleted ? 'bg-amber-500' : 'bg-slate-200'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Action Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Today's Practice Activities
          </h2>
          <span className="text-xs text-blue-600 font-semibold">Recommended</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Speak with AI */}
          <button
            onClick={() => onNavigate('speak')}
            className="text-left p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-50/30 border border-blue-100/80 hover:border-blue-200 hover:shadow-md transition-all active:scale-95 group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3 shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center justify-between">
                <span>Speak with AI</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-snug">
                Have a real conversation with your AI teacher.
              </p>
            </div>
          </button>

          {/* Card 2: Learn New Words */}
          <button
            onClick={() => onNavigate('learn')}
            className="text-left p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-50/30 border border-purple-100/80 hover:border-purple-200 hover:shadow-md transition-all active:scale-95 group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-3 shadow-sm shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center justify-between">
                <span>Learn Words</span>
                <ArrowRight className="w-3.5 h-3.5 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-snug">
                Learn 5 useful English words today.
              </p>
            </div>
          </button>

          {/* Card 3: Grammar Practice */}
          <button
            onClick={() => onNavigate('practice', { section: 'grammar' })}
            className="text-left p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-50/30 border border-emerald-100/80 hover:border-emerald-200 hover:shadow-md transition-all active:scale-95 group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center justify-between">
                <span>Grammar Practice</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-snug">
                Improve your grammar with quick exercises.
              </p>
            </div>
          </button>

          {/* Card 4: Listening Practice */}
          <button
            onClick={() => onNavigate('practice', { section: 'listening' })}
            className="text-left p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-50/30 border border-amber-100/80 hover:border-amber-200 hover:shadow-md transition-all active:scale-95 group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-3 shadow-sm shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center justify-between">
                <span>Listening</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-snug">
                Listen and answer naturally.
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* Check My English Banner */}
      <section className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3 pr-2">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <CheckCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-xs">Check My English</h3>
            <p className="text-[11px] text-slate-500">
              Type or paste any sentence to get instant native corrections.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenGrammarChecker}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-xs active:scale-95 transition-transform"
        >
          Check
        </button>
      </section>

      {/* Continue Learning Card */}
      <section className="space-y-2">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">Continue Learning</h2>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between hover:border-slate-200 transition-colors">
          <div className="space-y-1 pr-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                Daily Lesson
              </span>
              <span className="text-[11px] text-slate-400">5 words • 4 min</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {lastLesson?.topic || 'Morning Routine & Daily Life'}
            </h3>
            <p className="text-xs text-slate-500 line-clamp-1">
              {lastLesson?.themeDescription || 'Master vocabulary for scheduling, preparing, and routine.'}
            </p>
          </div>

          <button
            onClick={() => onNavigate('learn')}
            className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 active:scale-95 transition-all shrink-0"
            aria-label="Resume Lesson"
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </button>
        </div>
      </section>

      {/* AI Coach Personalized Advice Note */}
      <section className="p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-purple-50/80 rounded-2xl border border-indigo-100/70 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
            <span>Coach Alex's Daily Tip</span>
            <button
              onClick={() =>
                playVoiceSample(
                  "You are improving in sentence formation! Today, let's focus on past tense and everyday conversation."
                )
              }
              className="text-indigo-600 hover:text-indigo-800"
              title="Listen to tip"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            "You are improving in sentence formation. This week, let's focus on past tense and everyday conversation. Try speaking 2 sentences aloud today!"
          </p>
        </div>
      </section>
    </div>
  );
};
