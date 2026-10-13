import React, { useState } from 'react';
import { X, Smartphone, Download, ShieldCheck, Terminal, Check, Copy } from 'lucide-react';

interface AndroidBuildGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidBuildGuideModal: React.FC<AndroidBuildGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Android APK & AAB Guide
              </h2>
              <p className="text-[11px] text-slate-500">
                Install on Android & package for Google Play
              </p>
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
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Method 1: Instant PWA on Phone */}
          <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-100 space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-bold">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">
                1
              </span>
              <span>Fastest: Install Directly on Android (PWA)</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Open this web app in <strong>Google Chrome on your Android phone</strong>:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-700 font-medium pl-1">
              <li>Tap Chrome menu (<strong>⋮</strong> three dots top-right).</li>
              <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
              <li>The app installs with its icon, splash screen, and offline capabilities!</li>
            </ol>
          </div>

            {/* Method 2: Build Native APK / AAB with Capacitor */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px]">
                2
              </span>
              <span>Build Native Android APK & AAB (Capacitor)</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              The project is pre-configured with <code>com.englishaicoach.app</code> and an <code>android/</code> directory.
            </p>

            {/* Step 1: Sync Assets */}
            <div className="space-y-1.5">
              <span className="font-semibold text-slate-800">Step 1: Build & Sync Web Assets</span>
              <div className="relative bg-slate-900 text-emerald-400 p-2.5 rounded-xl font-mono text-[11px]">
                <code>npm run build && npx cap sync android</code>
                <button
                  onClick={() =>
                    copyToClipboard('npm run build && npx cap sync android', 'c1')
                  }
                  className="absolute right-2 top-2 text-slate-400 hover:text-white"
                >
                  {copiedCode === 'c1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Step 2: Build APK via Terminal or Android Studio */}
            <div className="space-y-1.5">
              <span className="font-semibold text-slate-800">Step 2: Build APK with Gradle CLI</span>
              <div className="relative bg-slate-900 text-emerald-400 p-2.5 rounded-xl font-mono text-[11px]">
                <code>cd android && ./gradlew assembleDebug</code>
                <button
                  onClick={() =>
                    copyToClipboard('cd android && ./gradlew assembleDebug', 'c2')
                  }
                  className="absolute right-2 top-2 text-slate-400 hover:text-white"
                >
                  {copiedCode === 'c2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Generated APK is at: <code>android/app/build/outputs/apk/debug/app-debug.apk</code>
              </p>
            </div>

            {/* Step 3: Install APK */}
            <div className="space-y-1.5">
              <span className="font-semibold text-slate-800">Step 3: Install APK on Android Phone</span>
              <div className="relative bg-slate-900 text-emerald-400 p-2.5 rounded-xl font-mono text-[11px]">
                <code>adb install android/app/build/outputs/apk/debug/app-debug.apk</code>
                <button
                  onClick={() =>
                    copyToClipboard('adb install android/app/build/outputs/apk/debug/app-debug.apk', 'c3')
                  }
                  className="absolute right-2 top-2 text-slate-400 hover:text-white"
                >
                  {copiedCode === 'c3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Or transfer the <code>.apk</code> file via USB, WhatsApp, or Google Drive and tap to install!
              </p>
            </div>

            {/* Step 4: Open in Android Studio (for AAB Play Store release) */}
            <div className="space-y-1.5">
              <span className="font-semibold text-slate-800">Step 4: Build Play Store AAB or open in Android Studio</span>
              <div className="relative bg-slate-900 text-emerald-400 p-2.5 rounded-xl font-mono text-[11px]">
                <code>npx cap open android</code>
                <button
                  onClick={() => copyToClipboard('npx cap open android', 'c4')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-white"
                >
                  {copiedCode === 'c4' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                In Android Studio: <strong>Build &gt; Generate Signed Bundle / APK &gt; Android App Bundle</strong>, or run <code>cd android && ./gradlew bundleRelease</code>.
              </p>
            </div>
          </div>

          {/* Backend Connection for APK */}
          <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-100 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-purple-950">
              <Terminal className="w-4 h-4 text-purple-600" />
              <span>Connecting the APK to your Backend</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              1. Start the Node.js backend on your computer:
              <br />
              <code className="font-mono bg-purple-100/60 px-1 py-0.5 rounded text-purple-900 font-semibold">npm start</code>
              <br />
              2. In the app's <strong>Profile & Settings</strong>, enter your computer's Wi-Fi IP address (e.g. <code>http://192.168.1.45:3000</code>) and tap <strong>Test Connection</strong>.
              <br />
              3. For the Android Studio Emulator, use <code>http://10.0.2.2:3000</code>.
            </p>
          </div>

          {/* Microphone & Gemini Configuration */}
          <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-emerald-950">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Permissions & Gemini API Security</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              - <strong>Microphone:</strong> Handled in Android via <code>RECORD_AUDIO</code> and <code>MODIFY_AUDIO_SETTINGS</code>.
              <br />
              - <strong>Gemini API:</strong> Calls are routed securely via the backend server proxy (`/api/gemini/*`). Your secret API key is never exposed to the client!
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs active:scale-95"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
