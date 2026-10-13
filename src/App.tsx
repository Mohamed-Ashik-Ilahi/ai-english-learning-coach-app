import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { UserProfile, DailyLesson } from './types';
import {
  loadUserProfile,
  saveUserProfile,
  loadVocabulary,
} from './services/storageService';
import { geminiService } from './services/geminiService';
import { BottomNav, TabType } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { SpeakScreen } from './components/SpeakScreen';
import { LearnScreen } from './components/LearnScreen';
import { PracticeScreen } from './components/PracticeScreen';
import { ProgressScreen } from './components/ProgressScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { SettingsModal } from './components/SettingsModal';
import { AndroidBuildGuideModal } from './components/AndroidBuildGuideModal';
import { Smartphone, Wifi, Battery, Sparkles } from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(loadUserProfile());
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [dailyLesson, setDailyLesson] = useState<DailyLesson | null>(null);

  const isNative = Capacitor.isNativePlatform();

  // Practice sub-section navigation
  const [practiceInitialSection, setPracticeInitialSection] = useState<
    'grammar' | 'checker' | 'listening' | 'reading' | 'pronunciation'
  >('grammar');

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAndroidGuideOpen, setIsAndroidGuideOpen] = useState<boolean>(false);

  // Sync profile on mount & fetch initial daily lesson
  useEffect(() => {
    const p = loadUserProfile();
    setProfile(p);

    if (isNative) {
      // Configure native Android status bar & hide splash screen
      StatusBar.setStyle({ style: Style.Light }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#2563EB' }).catch(() => {});
      SplashScreen.hide().catch(() => {});
    }

    // Fetch initial daily lesson
    geminiService
      .getDailyLesson(p.level)
      .then((lesson) => {
        setDailyLesson(lesson);
      })
      .catch((e) => console.error(e));
  }, [isNative]);

  const handleUpdateProfile = () => {
    setProfile(loadUserProfile());
  };

  const handleCompleteOnboarding = (data: Partial<UserProfile>) => {
    const updated: UserProfile = {
      ...profile,
      ...data,
      onboardingCompleted: true,
    };
    saveUserProfile(updated);
    setProfile(updated);

    // Fetch lesson tailored to new chosen level
    geminiService
      .getDailyLesson(updated.level)
      .then((lesson) => {
        setDailyLesson(lesson);
      })
      .catch((e) => console.error(e));
  };

  const handleNavigate = (tab: TabType, extra?: { section?: any }) => {
    if (extra?.section) {
      setPracticeInitialSection(extra.section);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenGrammarChecker = () => {
    setPracticeInitialSection('checker');
    setCurrentTab('practice');
  };

  // Status bar simulated time (format HH:MM)
  const currentTime = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center font-sans antialiased text-slate-900 sm:py-6">
      {/* Mobile Frame Container */}
      <div
        className="w-full sm:max-w-md h-screen sm:h-[860px] bg-slate-50 flex flex-col sm:rounded-[36px] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] sm:border sm:border-slate-200/80 overflow-hidden relative"
        style={{
          paddingTop: isNative ? 'env(safe-area-inset-top, 0px)' : undefined,
          paddingBottom: isNative ? 'env(safe-area-inset-bottom, 0px)' : undefined,
        }}
      >
        {/* Simulated Android Status Bar (shown on desktop/web preview) */}
        {!isNative && (
          <div className="px-5 pt-2.5 pb-1 flex items-center justify-between text-slate-800 text-[11px] font-bold select-none bg-slate-50/90 backdrop-blur-xs z-30 shrink-0">
            <span>{currentTime}</span>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'home' && (
            <HomeScreen
              profile={profile}
              lastLesson={dailyLesson}
              onNavigate={handleNavigate}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenGrammarChecker={handleOpenGrammarChecker}
            />
          )}

          {currentTab === 'speak' && (
            <SpeakScreen
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
            />
          )}

          {currentTab === 'learn' && (
            <LearnScreen
              profile={profile}
              dailyLesson={dailyLesson}
              onUpdateDailyLesson={(lesson) => setDailyLesson(lesson)}
              onUpdateProfile={handleUpdateProfile}
            />
          )}

          {currentTab === 'practice' && (
            <PracticeScreen
              profile={profile}
              initialSection={practiceInitialSection}
              onUpdateProfile={handleUpdateProfile}
            />
          )}

          {currentTab === 'progress' && (
            <ProgressScreen
              profile={profile}
              onNavigateToPractice={() => {
                setPracticeInitialSection('grammar');
                setCurrentTab('practice');
              }}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav currentTab={currentTab} onSelectTab={handleNavigate} />

        {/* Onboarding Flow if not completed */}
        {!profile.onboardingCompleted && (
          <OnboardingModal onComplete={handleCompleteOnboarding} />
        )}

        {/* Profile & Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          profile={profile}
          onClose={() => setIsSettingsOpen(false)}
          onSaveProfile={(updated) => setProfile(updated)}
          onOpenAndroidGuide={() => setIsAndroidGuideOpen(true)}
        />

        {/* Android APK & AAB Instructions Modal */}
        <AndroidBuildGuideModal
          isOpen={isAndroidGuideOpen}
          onClose={() => setIsAndroidGuideOpen(false)}
        />
      </div>
    </div>
  );
}
