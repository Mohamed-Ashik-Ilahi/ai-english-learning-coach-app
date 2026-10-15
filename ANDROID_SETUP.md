# English AI Coach - Android Build & Setup Guide

This guide explains how to build, install, and test the **English AI Coach** Android application on your PC and Android phone, as well as how to resolve microphone permissions.

---

## 🔍 Root Cause of the ADB Permission Error

When running:
```powershell
adb shell pm grant com.englishaicoach.app android.permission.RECORD_AUDIO
```
Android throws:
```
java.lang.SecurityException: Package com.englishaicoach.app has not requested permission android.permission.RECORD_AUDIO
```

### Why this happens:
1. **Android Security Model**: The `pm grant` command only works for runtime permissions that are explicitly declared in the `<uses-permission>` tags of the **currently installed APK's `AndroidManifest.xml`**.
2. If your phone has an earlier APK build that was compiled before `<uses-permission android:name="android.permission.RECORD_AUDIO" />` was added to `android/app/src/main/AndroidManifest.xml`, the Android OS package manager on your device records that the installed package never requested `RECORD_AUDIO`.
3. To resolve this, the Android manifest must contain `android.permission.RECORD_AUDIO`, the Android app code should request it at runtime, and the app must be **rebuilt and reinstalled** onto your phone with the updated APK.

---

## 🛠️ Summary of Changes Made in the Project

1. **`android/app/src/main/AndroidManifest.xml`**:
   - Added `android.permission.RECORD_AUDIO` and `android.permission.MODIFY_AUDIO_SETTINGS` at the top of the `<manifest>` tag.
   - Added `<uses-feature android:name="android.hardware.microphone" android:required="false" />` to ensure device hardware compatibility.
   - Preserved `package="com.englishaicoach.app"`, `usesCleartextTraffic="true"`, and `networkSecurityConfig`.

2. **`android/app/src/main/java/com/englishaicoach/app/MainActivity.java`**:
   - Clean `BridgeActivity` setup adhering to Capacitor standards.
   - Microphone permission is requested on-demand when the user activates voice input (avoiding annoying popups on app launch).

3. **`src/services/speechService.ts` & `src/components/SpeakScreen.tsx`**:
   - Upgraded to dual-engine Speech Synthesis: uses `@capacitor-community/text-to-speech` for native Android Text-to-Speech (calling Android OS TTS directly), and `window.speechSynthesis` on web browsers.
   - Fixed Android WebView TTS silence: Android WebViews do not bundle or forward Web Speech API `window.speechSynthesis` calls to Android TTS. The Capacitor Text-to-Speech plugin bridges directly to Android's `TextToSpeech` service.
   - Added interactive speaker toggle buttons on AI answers: taps read the answer aloud with active audio indicators, allow stopping playback mid-speech, clean markdown symbols before vocalization, and prevent overlapping duplicate audio.
   - Automatically reads the incoming AI response while respecting user voice rate and stopping speech when the user taps to record a voice message.
   - Made the microphone activation asynchronous: checks and triggers permission before starting speech recognition.
   - Added graceful error handling and an in-app **"Retry / Request Permission"** button if microphone access was initially denied.

4. **`android/app/src/main/AndroidManifest.xml`**:
   - Added `<queries><intent><action android:name="android.intent.action.TTS_SERVICE" /></intent></queries>` to guarantee Android 11+ (API 30+) package visibility for device TTS engines (Google Speech Services, Samsung TTS, etc.).

5. **`package.json`**:
   - Added `@capacitor-community/text-to-speech` (v8.0.2, aligned with Capacitor 8).
   - Added `npm run build:android` to compile the Vite web app and sync assets to Capacitor in one command.
   - Added `npm run cap:open` to launch Android Studio directly.

---

## 🚀 Step-by-Step Rebuild & Install Instructions (Windows PowerShell)

Follow these steps in your VS Code PowerShell terminal:

### Step 1: Build the Web App & Sync to Android
```powershell
npm run build:android
```
*(This builds the React app into `dist/` and runs `npx cap sync android` to copy the assets into the Android native project).*

---

### Step 2: Build the Android Debug APK

You can build the APK using either **Command Line (Gradle)** or **Android Studio**:

#### Option A: Using Command Line (Quickest)
```powershell
cd android
.\gradlew assembleDebug
cd ..
```
The compiled APK will be located at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

#### Option B: Using Android Studio
1. Open Android Studio:
   ```powershell
   npx cap open android
   ```
2. Wait for Gradle to finish indexing and syncing.
3. From the top menu, select:
   **Build > Build Bundle(s) / APK(s) > Build APK(s)**
4. Once built, click **"locate"** in the popup notification in the lower-right corner.

---

### Step 3: Install the Newly Built APK onto Your Connected Phone

Make sure your phone is connected with USB Debugging enabled:
```powershell
adb devices
```
*(Verify your device ID is listed as `device`).*

Install the updated APK (the `-r` flag reinstalls and preserves app data):
```powershell
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

### Step 4: Grant & Verify Microphone Permission via ADB

Now that the new APK with declared audio permissions is installed, run:
```powershell
adb shell pm grant com.englishaicoach.app android.permission.RECORD_AUDIO
```
**This command will now succeed with zero errors.**

To verify that the permission is granted, run:
```powershell
adb shell dumpsys package com.englishaicoach.app | Select-String -Pattern "RECORD_AUDIO"
```
You should see:
```
android.permission.RECORD_AUDIO: granted=true
```

---

## 📱 Developer Options & USB Debugging (If Phone Disconnects)

1. Open **Settings** on your Android phone.
2. Go to **About Phone** > **Software Information**.
3. Tap **Build Number** 7 times until you see *"You are now a developer!"*.
4. Go back to **Settings** > **Developer Options**.
5. Enable **USB Debugging**.
6. Connect the phone to your PC via USB cable.
7. If prompted with *"Allow USB debugging from this computer?"*, check **"Always allow"** and tap **Allow**.

---

## 🔑 Building a Signed Release APK / AAB (Google Play Store)

To create a release build:
1. Generate a keystore (run once):
   ```powershell
   keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
   ```
2. In Android Studio:
   - Select **Build > Generate Signed Bundle / APK...**
   - Choose **Android App Bundle** (for Google Play) or **APK** (for direct distribution).
   - Select your keystore file `my-release-key.jks`, enter your password and alias.
   - Select **Release** build variant.
   - Click **Finish**.
3. The signed APK or AAB will be generated in `android/app/release/`.
