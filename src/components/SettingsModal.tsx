import React, { useState } from 'react';
import { UserProfile, UserLevel, LearningGoal, DailyMinuteGoal } from '../types';
import { saveUserProfile, getStoredBackendUrl, saveStoredBackendUrl } from '../services/storageService';
import { SpeechService } from '../services/speechService';
import { testBackendConnection } from '../services/geminiService';
import {
  X,
  User,
  Volume2,
  Clock,
  RotateCcw,
  Smartphone,
  Shield,
  Check,
  AlertTriangle,
  Award,
  Server,
  Wifi,
  Mic,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Radio,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSaveProfile: (updated: UserProfile) => void;
  onOpenAndroidGuide: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSaveProfile,
  onOpenAndroidGuide,
}) => {
  const [name, setName] = useState<string>(profile.name);
  const [level, setLevel] = useState<UserLevel>(profile.level);
  const [goal, setGoal] = useState<LearningGoal>(profile.goal);
  const [dailyMinutes, setDailyMinutes] = useState<DailyMinuteGoal>(profile.dailyGoalMinutes);
  const [voiceRate, setVoiceRate] = useState<number>(profile.voiceRate || 1.0);
  const [backendUrl, setBackendUrl] = useState<string>(getStoredBackendUrl());
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  // Backend test state
  const [isTestingBackend, setIsTestingBackend] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    geminiConfigured?: boolean;
    message: string;
  } | null>(null);

  // Microphone test state
  const [isTestingMic, setIsTestingMic] = useState<boolean>(false);
  const [micStatus, setMicStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    const updated: UserProfile = {
      ...profile,
      name: name.trim() || 'Friend',
      level,
      goal,
      dailyGoalMinutes: dailyMinutes,
      voiceRate,
    };
    saveUserProfile(updated);
    saveStoredBackendUrl(backendUrl);
    onSaveProfile(updated);
    onClose();
  };

  const handleResetProgress = () => {
    localStorage.clear();
    window.location.reload();
  };

  const testVoice = () => {
    SpeechService.speak(
      `Hello ${name || 'there'}! This is your English AI Coach speaking at ${voiceRate}x speed.`,
      voiceRate
    );
  };

  const handleTestBackend = async () => {
    setIsTestingBackend(true);
    setTestResult(null);
    try {
      const res = await testBackendConnection(backendUrl.trim());
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        success: false,
        message: `Failed to test connection: ${e.message || 'Network error'}`,
      });
    } finally {
      setIsTestingBackend(false);
    }
  };

  const handleTestMic = async () => {
    setIsTestingMic(true);
    setMicStatus(null);
    const granted = await SpeechService.requestMicrophonePermission();
    setIsTestingMic(false);
    if (granted) {
      setMicStatus('Microphone permission granted! Ready for speaking practice.');
    } else {
      setMicStatus('Microphone permission was denied. Please allow audio access in system settings.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Profile & Settings</h2>
              <p className="text-[11px] text-slate-500">Configure your English coach</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          {/* Level */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800">English Level</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                    level === lvl
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Goal */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800">Daily Goal Commitment</label>
            <div className="grid grid-cols-4 gap-1.5">
              {([5, 10, 15, 30] as const).map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDailyMinutes(mins)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    dailyMinutes === mins
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          {/* Voice Speed */}
          <div className="space-y-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-blue-600" />
                <span>Coach Voice Speed</span>
              </label>
              <button
                type="button"
                onClick={testVoice}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
              >
                Test Voice
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { r: 0.8, label: '0.8x (Slow)' },
                { r: 1.0, label: '1.0x (Normal)' },
                { r: 1.2, label: '1.2x (Fast)' },
              ].map((item) => (
                <button
                  key={item.r}
                  type="button"
                  onClick={() => setVoiceRate(item.r)}
                  className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    voiceRate === item.r
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Backend Server & Network (Android APK & Remote) */}
          <div className="space-y-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-800">Backend Server (Android APK)</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {backendUrl ? 'Custom API' : 'Web / Default'}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              When running the standalone Android APK, specify where your Node/Express backend is running.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700">Server URL (HTTPS / HTTP)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={backendUrl}
                  onChange={(e) => {
                    setBackendUrl(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="e.g. http://192.168.1.50:3000 or empty for web"
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={handleTestBackend}
                  disabled={isTestingBackend}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 active:scale-95 disabled:opacity-50 transition-all"
                >
                  {isTestingBackend ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wifi className="w-3.5 h-3.5" />
                  )}
                  <span>Test</span>
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setBackendUrl('');
                    setTestResult(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                    !backendUrl ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🌐 Web Host (Relative)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBackendUrl('http://10.0.2.2:3000');
                    setTestResult(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                    backendUrl === 'http://10.0.2.2:3000' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  📱 Android Emulator (10.0.2.2:3000)
                </button>
              </div>
            </div>

            {/* Test Connection Result Box */}
            {testResult && (
              <div
                className={`p-2.5 rounded-xl border text-[11px] flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{testResult.message}</p>
                  {!testResult.success && (
                    <p className="text-[10px] text-red-600 mt-0.5">
                      Ensure your computer and phone are connected to the same Wi-Fi, the backend is running (`npm start`), and the port is 3000.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Microphone Permission Diagnostic */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-blue-600" />
              <div>
                <span className="font-bold text-slate-800 text-xs block">Microphone Access</span>
                <span className="text-[11px] text-slate-500">Required for speaking practice</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestMic}
              disabled={isTestingMic}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl font-bold text-xs active:scale-95 transition-all shadow-xs"
            >
              {isTestingMic ? 'Testing...' : 'Check Permission'}
            </button>
          </div>

          {micStatus && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-[11px] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{micStatus}</span>
            </div>
          )}

          {/* Android APK & AAB Guide Button */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAndroidGuide();
            }}
            className="w-full p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl text-left flex items-center justify-between hover:border-emerald-300 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">
                  Android APK & Play Store (AAB) Guide
                </h4>
                <p className="text-[11px] text-slate-500">
                  Build and install on your phone
                </p>
              </div>
            </div>
            <span className="text-emerald-700 font-bold text-xs">View</span>
          </button>

          {/* Privacy & Safety Note */}
          <div className="flex items-start gap-2 p-3 bg-blue-50/60 rounded-xl text-slate-500 text-[11px] leading-relaxed">
            <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              All learning progress, practice history, and vocabulary are stored locally on your device.
            </span>
          </div>

          {/* Reset progress */}
          <div className="pt-2 border-t border-slate-100">
            {!isResetConfirmOpen ? (
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset all progress</span>
              </button>
            ) : (
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-2">
                <p className="text-xs text-red-900 font-semibold">
                  Are you sure you want to reset your streak and learning history?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleResetProgress}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg font-bold text-xs"
                  >
                    Confirm Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsResetConfirmOpen(false)}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-transform"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
