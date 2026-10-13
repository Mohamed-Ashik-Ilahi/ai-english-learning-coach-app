import React from 'react';
import { Home, MessageSquare, BookOpen, Dumbbell, BarChart2 } from 'lucide-react';

export type TabType = 'home' | 'speak' | 'learn' | 'practice' | 'progress';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'speak', label: 'Speak', icon: MessageSquare },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'practice', label: 'Practice', icon: Dumbbell },
    { id: 'progress', label: 'Progress', icon: BarChart2 },
  ] as const;

  return (
    <nav
      className="fixed sm:absolute bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
    >
      <div className="max-w-md mx-auto px-3 py-1.5 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 touch-manipulation min-h-[48px] ${
                isActive
                  ? 'text-blue-600 font-semibold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
              aria-label={tab.label}
            >
              <div
                className={`relative flex items-center justify-center w-10 h-7 rounded-full transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {isActive && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 bg-blue-600 rounded-full" />
                )}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
