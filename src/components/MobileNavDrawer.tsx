import React from 'react';
import { TabType } from './BottomNav';
import { UserProfile } from '../types';
import {
  Home,
  MessageSquare,
  BookOpen,
  Dumbbell,
  BarChart2,
  Settings,
  Smartphone,
  X,
  Sparkles,
  Flame,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenSettings: () => void;
  onOpenAndroidGuide: () => void;
  profile: UserProfile;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  onOpenSettings,
  onOpenAndroidGuide,
  profile,
}) => {
  if (!isOpen) return null;

  const navItems = [
    {
      id: 'home' as TabType,
      label: 'Home',
      description: 'Daily overview & quick start',
      icon: Home,
    },
    {
      id: 'speak' as TabType,
      label: 'AI Speak Coach',
      description: 'Real-time conversation & feedback',
      icon: MessageSquare,
    },
    {
      id: 'learn' as TabType,
      label: 'Daily Lesson',
      description: 'Vocabulary & bite-sized lessons',
      icon: BookOpen,
    },
    {
      id: 'practice' as TabType,
      label: 'Practice & Grammar',
      description: 'Grammar check, listening & reading',
      icon: Dumbbell,
    },
    {
      id: 'progress' as TabType,
      label: 'Progress & Stats',
      description: 'Streaks, badges & history',
      icon: BarChart2,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200 border-r border-slate-100">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                  English AI Coach
                </h2>
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                  Personal Tutor
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors active:scale-95"
              aria-label="Close navigation drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Profile mini status */}
          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">{profile.name || 'Student'}</p>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 inline-block mt-0.5">
                {profile.level} Level
              </span>
            </div>
            <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-1 rounded-xl border border-amber-100">
              <Flame className="w-3.5 h-3.5 fill-amber-500" />
              <span>{profile.streak || 1}d</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1 block">
            Navigation
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all active:scale-[0.98] ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-none truncate">{item.label}</p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-none truncate">
                    {item.description}
                  </p>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                )}
              </button>
            );
          })}

          <div className="pt-3 pb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1 block">
              Preferences & Build
            </span>
          </div>

          {/* Settings */}
          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-left text-slate-700 hover:bg-slate-50 transition-all font-medium active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold leading-none">Settings</p>
                <p className="text-[10px] text-slate-400 mt-1 leading-none">
                  Backend, voice, & profile
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Android Guide */}
          <button
            onClick={() => {
              onClose();
              onOpenAndroidGuide();
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-left text-slate-700 hover:bg-slate-50 transition-all font-medium active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold leading-none">Android Guide</p>
                <p className="text-[10px] text-slate-400 mt-1 leading-none">
                  Capacitor build & APK
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Hostinger Cloud & Android Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
