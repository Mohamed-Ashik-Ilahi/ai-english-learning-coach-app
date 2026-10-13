// Speech Recognition and Speech Synthesis helper for Android & modern browsers

export class SpeechService {
  private static recognition: any = null;
  private static isListening: boolean = false;
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;

  public static isRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  public static isSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public static speak(text: string, rate: number = 1.0, onEnd?: () => void): void {
    if (!this.synth) return;

    try {
      this.synth.cancel(); // Stop any currently playing audio

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = Math.max(0.7, Math.min(1.4, rate));
      utterance.pitch = 1.0;

      // Select an English voice if available
      const voices = this.synth.getVoices();
      const englishVoice = voices.find(
        (v) => (v.lang === 'en-US' || v.lang.startsWith('en')) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Alex'))
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onend = () => {
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        if (onEnd) onEnd();
      };

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis failed', e);
      if (onEnd) onEnd();
    }
  }

  public static stopSpeaking(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  public static startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (errorMsg: string) => void,
    onStatusChange?: (isListening: boolean) => void
  ): boolean {
    if (!this.isRecognitionSupported()) {
      onError('Speech recognition is not supported in this browser. You can type your response instead!');
      return false;
    }

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
        console.warn('Speech recognition error:', event.error);
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
        console.warn('Microphone permission request failed:', e);
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
