import React from 'react';
import { UserProfile } from '../types';
import { BADGES_LIST } from '../services/storageService';
import {
  Flame,
  Award,
  Clock,
  BookOpen,
  MessageSquare,
  Sparkles,
  Zap,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

interface ProgressScreenProps {
  profile: UserProfile;
  onNavigateToPractice: () => void;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  profile,
  onNavigateToPractice,
}) => {
  // Weekly progress calculation
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  // Generate last 7 days mockup/real from dailyHistory
  const today = new Date();
  const dayIndex = (today.getDay() + 6) % 7; // 0 is Monday, 6 is Sunday

  // Skill scores estimation based on activity
  const speakingScore = Math.min(95, 75 + profile.conversationsCount * 2);
  const vocabScore = Math.min(96, 70 + profile.wordsLearnedCount);
  const grammarScore = Math.min(92, 78 + Math.floor(profile.totalPracticeMinutes / 10));
  const listeningScore = 82;
  const readingScore = 85;

  const weeklyData = [
    { day: 'Mon', minutes: 15, active: true },
    { day: 'Tue', minutes: 12, active: true },
    { day: 'Wed', minutes: 20, active: true },
    { day: 'Thu', minutes: 15, active: true },
    { day: 'Fri', minutes: profile.todayPracticeMinutes || 10, active: true },
    { day: 'Sat', minutes: 0, active: false },
    { day: 'Sun', minutes: 0, active: false },
  ];

  const maxMinutes = Math.max(...weeklyData.map((d) => d.minutes), 20);

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <header className="space-y-1">
        <span className="text-xs font-semibold text-blue-600 tracking-wide uppercase">
          Learning Analytics
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Your Progress
        </h1>
        <p className="text-xs text-slate-500">
          Track your growth, weekly habits, and fluency milestones.
        </p>
      </header>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Streak card */}
        <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl border border-amber-200/60 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Streak
            </span>
            <p className="text-lg font-black text-slate-900">{profile.streak} Days</p>
          </div>
        </div>

        {/* Practice Time */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-200/60 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
              Total Time
            </span>
            <p className="text-lg font-black text-slate-900">
              {profile.totalPracticeMinutes} min
            </p>
          </div>
        </div>

        {/* Words Learned */}
        <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50/50 rounded-2xl border border-purple-200/60 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
              Words
            </span>
            <p className="text-lg font-black text-slate-900">
              {profile.wordsLearnedCount} words
            </p>
          </div>
        </div>

        {/* Level */}
        <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-2xl border border-emerald-200/60 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Current Level
            </span>
            <p className="text-lg font-black text-slate-900">{profile.level}</p>
          </div>
        </div>
      </div>

      {/* Weekly Activity Bar Chart */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Weekly Practice Minutes</h3>
            <p className="text-[11px] text-slate-500">Monday → Sunday consistency</p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
            Goal: {profile.dailyGoalMinutes}m/day
          </span>
        </div>

        <div className="flex items-end justify-between h-32 pt-4 px-2">
          {weeklyData.map((d, i) => {
            const barHeight = Math.max(12, Math.round((d.minutes / maxMinutes) * 100));
            const isToday = i === dayIndex;

            return (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                <span className="text-[10px] font-semibold text-slate-400">
                  {d.minutes > 0 ? `${d.minutes}m` : '-'}
                </span>
                <div className="w-7 bg-slate-100 rounded-t-lg h-24 flex items-end justify-center overflow-hidden">
                  <div
                    style={{ height: `${barHeight}%` }}
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isToday
                        ? 'bg-gradient-to-t from-blue-600 to-indigo-500'
                        : d.active
                        ? 'bg-blue-400'
                        : 'bg-slate-200'
                    }`}
                  />
                </div>
                <span
                  className={`text-[11px] font-bold ${
                    isToday ? 'text-blue-600 font-extrabold' : 'text-slate-500'
                  }`}
                >
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skill Breakdown Scores */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3.5">
        <h3 className="text-sm font-bold text-slate-900">Skill Competency Breakdown</h3>

        <div className="space-y-3">
          {[
            { label: 'Speaking & Fluency', score: speakingScore, color: 'bg-blue-600' },
            { label: 'Grammar Accuracy', score: grammarScore, color: 'bg-emerald-600' },
            { label: 'Vocabulary Range', score: vocabScore, color: 'bg-purple-600' },
            { label: 'Listening Comprehension', score: listeningScore, color: 'bg-amber-500' },
            { label: 'Reading Comprehension', score: readingScore, color: 'bg-rose-500' },
          ].map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700">{item.label}</span>
                <span className="text-slate-900 font-bold">{item.score}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${item.color}`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Personal AI Coach Summary */}
      <div className="p-4 bg-gradient-to-br from-indigo-50 via-purple-50/50 to-blue-50 rounded-3xl border border-indigo-100 space-y-3">
        <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Your AI Coach Evaluation</span>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed font-normal">
          "You are improving in sentence formation. This week, let's focus on past tense and everyday conversation. Keep your streak alive with quick 5-minute speaking sessions!"
        </p>

        {profile.mistakeHistory && profile.mistakeHistory.length > 0 && (
          <div className="p-3 bg-white/90 rounded-2xl border border-indigo-100 text-xs space-y-1.5">
            <span className="font-bold text-slate-800 text-[11px] block">
              Recent Mistake Reviewed:
            </span>
            <p className="text-slate-500 line-through">
              "{profile.mistakeHistory[0].original}"
            </p>
            <p className="font-bold text-emerald-700">
              → "{profile.mistakeHistory[0].better}"
            </p>
          </div>
        )}

        <button
          onClick={onNavigateToPractice}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-sm active:scale-95 transition-transform"
        >
          Review Weak Points
        </button>
      </div>

      {/* Badges & Achievements Grid */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Achievements & Badges</h3>
          <span className="text-xs text-slate-400">
            {profile.badges.length} / {BADGES_LIST.length} unlocked
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {BADGES_LIST.map((b) => {
            const isUnlocked = profile.badges.includes(b.id);
            return (
              <div
                key={b.id}
                className={`p-3 rounded-2xl border transition-all flex items-start gap-2.5 ${
                  isUnlocked
                    ? 'bg-amber-50/60 border-amber-200/70 text-slate-900'
                    : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isUnlocked ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight">{b.title}</h4>
                  <p className="text-[10px] leading-tight text-slate-500 mt-0.5">{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
