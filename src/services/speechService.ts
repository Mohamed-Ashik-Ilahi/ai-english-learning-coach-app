// Speech Recognition and Speech Synthesis helper for Android Capacitor & Web Browsers
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

export interface TTSVoiceOption {
  voiceURI?: string;
  name: string;
  lang: string;
  default?: boolean;
}

export class SpeechService {
  private static recognition: any = null;
  private static isListening: boolean = false;
  private static isCurrentlySpeaking: boolean = false;
  private static currentUtteranceId: number = 0;
  private static nativeVoices: TTSVoiceOption[] = [];
  private static webVoices: SpeechSynthesisVoice[] = [];
  private static voicesLoaded: boolean = false;

  // Active utterance reference to prevent Chromium garbage collection
  private static activeUtterance: SpeechSynthesisUtterance | null = null;

  /**
   * Initializes TTS engines and caches available English voices
   */
  public static async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    if (Capacitor.isNativePlatform()) {
      try {
        const result = await TextToSpeech.getSupportedVoices();
        if (result && result.voices) {
          this.nativeVoices = result.voices;
        }
        this.voicesLoaded = true;
      } catch (e) {
        console.warn('[SpeechService] Native getSupportedVoices failed:', e);
      }
    } else if ('speechSynthesis' in window) {
      const loadWebVoices = () => {
        try {
          const list = window.speechSynthesis.getVoices();
          if (list && list.length > 0) {
            this.webVoices = list;
            this.voicesLoaded = true;
          }
        } catch (e) {
          console.warn('[SpeechService] Web getVoices error:', e);
        }
      };

      loadWebVoices();
      if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = loadWebVoices;
      }
    }
  }

  public static isRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  public static isSynthesisSupported(): boolean {
    if (typeof window === 'undefined') return false;
    if (Capacitor.isNativePlatform()) return true;
    return 'speechSynthesis' in window;
  }

  /**
   * Checks whether speech synthesis is actively speaking
   */
  public static isSpeaking(): boolean {
    return this.isCurrentlySpeaking;
  }

  /**
   * Reads text aloud.
   * On native Android / Capacitor, uses the native Android TextToSpeech engine via @capacitor-community/text-to-speech.
   * On desktop/web browsers, uses window.speechSynthesis with voice caching and GC protection.
   */
  public static async speak(
    text: string,
    rate: number = 1.0,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): Promise<void> {
    const trimmed = (text || '').trim();
    if (!trimmed) {
      if (onEnd) onEnd();
      return;
    }

    // Stop previous speech before playing new audio
    this.stopSpeaking();

    // Increment utterance ID to discard callbacks from canceled utterances
    const utteranceId = ++this.currentUtteranceId;
    this.isCurrentlySpeaking = true;

    const clampedRate = Math.max(0.6, Math.min(1.5, rate || 1.0));

    // Remove markdown symbols (asterisks, bullet hashes, etc.) for smoother pronunciation
    const cleanSpokenText = trimmed
      .replace(/[*_#`~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // link formatting
      .replace(/\s+/g, ' ')
      .trim();

    // PATH 1: Native Android (Capacitor)
    if (Capacitor.isNativePlatform()) {
      try {
        await TextToSpeech.speak({
          text: cleanSpokenText,
          lang: 'en-US',
          rate: clampedRate,
          pitch: 1.0,
          volume: 1.0,
          category: 'ambient',
        });

        if (this.currentUtteranceId === utteranceId) {
          this.isCurrentlySpeaking = false;
          if (onEnd) onEnd();
        }
      } catch (err: any) {
        console.error('[SpeechService] Native TextToSpeech failed:', err);
        if (this.currentUtteranceId === utteranceId) {
          this.isCurrentlySpeaking = false;
          if (onError) onError(err);
          if (onEnd) onEnd();
        }
      }
      return;
    }

    // PATH 2: Web Browser (window.speechSynthesis)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        // Chromium resume workaround
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(cleanSpokenText);
        utterance.lang = 'en-US';
        utterance.rate = clampedRate;
        utterance.pitch = 1.0;

        // Ensure voices are fetched
        let voices = this.webVoices;
        if (!voices || voices.length === 0) {
          voices = window.speechSynthesis.getVoices();
          this.webVoices = voices;
        }

        if (voices && voices.length > 0) {
          const preferredVoice =
            voices.find(
              (v) =>
                (v.lang === 'en-US' || v.lang === 'en_US') &&
                (v.name.includes('Google') ||
                  v.name.includes('Natural') ||
                  v.name.includes('Samantha') ||
                  v.name.includes('Daniel') ||
                  v.name.includes('Alex'))
            ) ||
            voices.find((v) => v.lang.startsWith('en')) ||
            voices[0];

          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
        }

        utterance.onend = () => {
          if (this.currentUtteranceId === utteranceId) {
            this.isCurrentlySpeaking = false;
            this.activeUtterance = null;
            if (onEnd) onEnd();
          }
        };

        utterance.onerror = (e) => {
          // If canceled intentionally, do not treat as fatal error
          if (e.error === 'canceled' || e.error === 'interrupted') {
            if (this.currentUtteranceId === utteranceId) {
              this.isCurrentlySpeaking = false;
              this.activeUtterance = null;
            }
            return;
          }
          console.warn('[SpeechService] Web speech synthesis error:', e);
          if (this.currentUtteranceId === utteranceId) {
            this.isCurrentlySpeaking = false;
            this.activeUtterance = null;
            if (onError) onError(e);
            if (onEnd) onEnd();
          }
        };

        // Retain reference on class to avoid GC bug in Chromium
        this.activeUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('[SpeechService] Web speak failed:', err);
        if (this.currentUtteranceId === utteranceId) {
          this.isCurrentlySpeaking = false;
          this.activeUtterance = null;
          if (onError) onError(err);
          if (onEnd) onEnd();
        }
      }
      return;
    }

    // PATH 3: Unsupported Environment
    console.warn('[SpeechService] No speech synthesis engine available.');
    this.isCurrentlySpeaking = false;
    if (onError) onError(new Error('Speech synthesis is not supported on this device.'));
    if (onEnd) onEnd();
  }

  /**
   * Stops currently playing speech immediately
   */
  public static stopSpeaking(): void {
    this.currentUtteranceId++;
    this.isCurrentlySpeaking = false;
    this.activeUtterance = null;

    if (Capacitor.isNativePlatform()) {
      TextToSpeech.stop().catch((e) => {
        // ignore stop errors
      });
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  /**
   * Starts microphone recognition (SpeechRecognition)
   */
  public static startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (errorMsg: string) => void,
    onStatusChange?: (isListening: boolean) => void
  ): boolean {
    if (!this.isRecognitionSupported()) {
      onError('Speech recognition is not supported in this browser. You can type your response instead!');
      return false;
    }

    // When starting listening, mute any active speech output so audio won't feedback into mic
    this.stopSpeaking();

    try {
      if (this.recognition && this.isListening) {
        this.recognition.abort();
      }

      const SpeechRecognitionClass =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        this.isListening = true;
        if (onStatusChange) onStatusChange(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript.trim().length > 0) {
          onResult(finalTranscript.trim(), true);
        } else if (interimTranscript.trim().length > 0) {
          onResult(interimTranscript.trim(), false);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[SpeechService] Recognition error:', event.error);
        this.isListening = false;
        if (onStatusChange) onStatusChange(false);

        if (event.error === 'not-allowed') {
          onError('Microphone access was denied. On Android, please check App Permissions in Android Settings and grant Microphone access.');
        } else if (event.error === 'no-speech') {
          onError("No speech was detected. Tap the mic and try speaking again.");
        } else {
          onError(`Speech input issue (${event.error}). Please try again or type.`);
        }
      };

      recognition.onend = () => {
        this.isListening = false;
        if (onStatusChange) onStatusChange(false);
      };

      recognition.start();
      this.recognition = recognition;
      return true;
    } catch (e: any) {
      this.isListening = false;
      if (onStatusChange) onStatusChange(false);
      onError('Could not start microphone. You can type instead.');
      return false;
    }
  }

  public static async requestMicrophonePermission(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        return true;
      } catch (e) {
        console.warn('[SpeechService] Microphone permission request failed:', e);
        return false;
      }
    }
    return true;
  }

  public static stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.isListening = false;
    }
  }

  public static getIsListening(): boolean {
    return this.isListening;
  }
}

// Warm up voices on import
if (typeof window !== 'undefined') {
  SpeechService.init().catch((err) => {
    console.debug('[SpeechService] Initial voice warmup completed with notice:', err);
  });
}
