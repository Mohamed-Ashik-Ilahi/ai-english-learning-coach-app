import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Scenario, Message, Correction, ConversationReport } from '../types';
import { SCENARIOS, recordMistake, addPracticeMinutes } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import { SpeechService } from '../services/speechService';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Award,
  AlertCircle,
  Keyboard,
  Compass,
  Briefcase,
  Coffee,
  Plane,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SpeakScreenProps {
  profile: UserProfile;
  onUpdateProfile: () => void;
}

export const SpeakScreen: React.FC<SpeakScreenProps> = ({ profile, onUpdateProfile }) => {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [activeCategory, setActiveCategory] = useState<'All' | 'Daily Life' | 'Work' | 'Travel' | 'Social'>('All');

  // Conversation state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechTranscript, setSpeechTranscript] = useState<string>('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  // Report modal state
  const [conversationReport, setConversationReport] = useState<ConversationReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, speechTranscript]);

  // Start a scenario conversation
  const handleStartScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setSessionStartTime(Date.now());
    setConversationReport(null);

    const initialAiMessage: Message = {
      id: `ai-${Date.now()}`,
      sender: 'model',
      text: scenario.initialMessage,
      timestamp: Date.now(),
    };

    setMessages([initialAiMessage]);

    // Speak initial welcome message
    setTimeout(() => {
      SpeechService.speak(scenario.initialMessage, profile.voiceRate || 1.0);
    }, 400);
  };

  // Send user message (voice or typed)
  const handleSendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || isLoading || !selectedScenario) return;

    // Stop microphone if currently listening
    if (isListening) {
      SpeechService.stopListening();
      setIsListening(false);
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setSpeechTranscript('');
    setIsLoading(true);

    try {
      const response = await geminiService.sendChatMessage(
        newMessages,
        selectedScenario,
        profile.level,
        profile.mistakeHistory
      );

      // Attach correction if any to user's message
      if (response.hasCorrection && response.correction) {
        userMessage.correction = response.correction;
        recordMistake(response.correction);
      }

      const aiReplyMessage: Message = {
        id: `ai-${Date.now()}`,
        sender: 'model',
        text: response.reply,
        timestamp: Date.now(),
      };

      setMessages([...newMessages, aiReplyMessage]);

      // Automatically speak the AI response
      SpeechService.speak(response.reply, profile.voiceRate || 1.0);
    } catch (e) {
      console.error(e);
      const fallbackMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'model',
        text: "That was very clear! Could you tell me more about that?",
        timestamp: Date.now(),
      };
      setMessages([...newMessages, fallbackMsg]);
      SpeechService.speak(fallbackMsg.text, profile.voiceRate || 1.0);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle voice recognition
  const handleToggleVoice = async () => {
    setSpeechError(null);
    if (isListening) {
      SpeechService.stopListening();
      setIsListening(false);
      if (speechTranscript.trim().length > 0) {
        handleSendMessage(speechTranscript);
      }
    } else {
      setSpeechTranscript('');

      // Check and request microphone permission before starting
      const hasPermission = await SpeechService.requestMicrophonePermission();
      if (!hasPermission) {
        setSpeechError(
          'Microphone permission is required for speaking practice. Please allow microphone access or check Android App Permissions in Settings.'
        );
        return;
      }

      if (!SpeechService.isRecognitionSupported()) {
        setSpeechError(
          'Speech recognition is not supported in this browser or WebView. You can type your response instead!'
        );
        setInputMode('text');
        return;
      }

      const started = SpeechService.startListening(
        (transcript, isFinal) => {
          setSpeechTranscript(transcript);
          if (isFinal) {
            handleSendMessage(transcript);
          }
        },
        (errorMsg) => {
          setSpeechError(errorMsg);
          setIsListening(false);
        },
        (status) => {
          setIsListening(status);
        }
      );

      if (!started) {
        setInputMode('text');
      }
    }
  };

  // End conversation & generate report
  const handleEndConversation = async () => {
    SpeechService.stopSpeaking();
    SpeechService.stopListening();
    setIsListening(false);

    // Calculate minutes spent
    if (sessionStartTime) {
      const elapsedMinutes = Math.max(1, Math.round((Date.now() - sessionStartTime) / 60000));
      addPracticeMinutes(elapsedMinutes);
      onUpdateProfile();
    }

    // If user exchanged messages, generate full report
    const userMessageCount = messages.filter((m) => m.sender === 'user').length;
    if (userMessageCount > 0 && selectedScenario) {
      setIsGeneratingReport(true);
      try {
        const report = await geminiService.getConversationReport(
          messages,
          selectedScenario,
          profile.level
        );
        setConversationReport(report);
        try {
          confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
        } catch {}
      } catch (err) {
        console.error(err);
      } finally {
        setIsGeneratingReport(false);
      }
    } else {
      setSelectedScenario(null);
    }
  };

  const filteredScenarios =
    activeCategory === 'All'
      ? SCENARIOS
      : SCENARIOS.filter((s) => s.category === activeCategory);

  // VIEW 1: Scenario Selector
  if (!selectedScenario) {
    return (
      <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-5 animate-in fade-in duration-300">
        <header className="space-y-1">
          <span className="text-xs font-semibold text-blue-600 tracking-wide uppercase">
            AI Speaking Practice
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Choose a Scenario
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Select a realistic roleplay situation to practice speaking with your AI teacher.
          </p>
        </header>

        {/* Free Talk Quick Launcher Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white shadow-md shadow-blue-500/15 flex items-center justify-between">
          <div className="space-y-1 pr-3">
            <span className="text-[10px] font-bold px-2 py-0.5 bg-white/20 rounded-full uppercase tracking-wider">
              Open Practice
            </span>
            <h2 className="text-base font-extrabold">Free Conversation</h2>
            <p className="text-xs text-blue-100">
              Talk freely about any topic with Coach Alex.
            </p>
          </div>
          <button
            onClick={() =>
              handleStartScenario({
                id: 'free-talk',
                category: 'Daily Life',
                title: 'Free Conversation with AI Coach',
                description: 'Open conversational practice on any topic you like.',
                role: 'Your patient and encouraging AI English Coach',
                iconName: 'Sparkles',
                initialMessage:
                  "Hi! I'm Coach Alex. What's on your mind today? We can talk about your day, your goals, or anything you'd like to share.",
                suggestedPrompts: [
                  "Today was a productive day because...",
                  "I watched a really interesting movie recently...",
                  "Could you teach me how to express opinions politely?",
                ],
              })
            }
            className="px-3.5 py-2 bg-white text-blue-700 rounded-xl text-xs font-bold shrink-0 shadow-sm active:scale-95 transition-transform flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Start Free Talk</span>
          </button>
        </div>

        {/* Categories Tab Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(['All', 'Daily Life', 'Work', 'Travel', 'Social'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Scenarios Grid */}
        <div className="space-y-2.5">
          {filteredScenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => handleStartScenario(scenario)}
              className="w-full text-left p-4 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-between group"
            >
              <div className="flex items-start gap-3.5 pr-2">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 group-hover:scale-105 transition-transform">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-blue-600 tracking-wide uppercase">
                      {scenario.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{scenario.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                    {scenario.description}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // VIEW 2: Conversation Screen
  return (
    <div className="fixed inset-0 z-40 bg-slate-50 flex flex-col max-w-md mx-auto">
      {/* Top Conversation Header */}
      <header className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between shadow-xs">
        <button
          onClick={handleEndConversation}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 p-1.5 -ml-1 rounded-xl active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit</span>
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Coach Alex</h2>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            {selectedScenario.title}
          </span>
        </div>

        <button
          onClick={handleEndConversation}
          className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold border border-blue-100 active:scale-95"
        >
          Done
        </button>
      </header>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5 animate-in fade-in duration-200`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-br-xs shadow-sm shadow-blue-500/20'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-xs'
                }`}
              >
                <p className="font-medium text-[13.5px]">{msg.text}</p>
                {!isUser && (
                  <button
                    onClick={() => SpeechService.speak(msg.text, profile.voiceRate || 1.0)}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-[11px] font-semibold flex items-center gap-1 pt-1 border-t border-slate-100"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Listen again</span>
                  </button>
                )}
              </div>

              {/* Instant Native Correction Card */}
              {isUser && msg.correction && (
                <div className="max-w-[88%] bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-950 space-y-1.5 shadow-xs">
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold text-[11px] uppercase tracking-wide">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Better English Tip</span>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[11px] block">You said:</span>
                    <span className="line-through text-slate-600 font-medium">
                      "{msg.correction.original}"
                    </span>
                  </div>

                  <div className="bg-white/80 p-2 rounded-xl border border-amber-100">
                    <span className="text-emerald-700 font-bold block text-[11px]">Better:</span>
                    <span className="font-semibold text-slate-900 text-xs">
                      "{msg.correction.better}"
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-900 leading-snug">
                    <strong className="font-semibold">Why: </strong>
                    {msg.correction.why}
                  </p>

                  <div className="pt-1 flex items-center justify-between">
                    <button
                      onClick={() =>
                        SpeechService.speak(msg.correction!.better, profile.voiceRate || 1.0)
                      }
                      className="text-blue-700 hover:text-blue-900 font-bold text-[11px] flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-amber-200 active:scale-95"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Hear correct way</span>
                    </button>
                    <span className="text-[10px] text-amber-700 font-medium">
                      {msg.correction.mistakeType}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white px-3 py-2 rounded-2xl border border-slate-100 w-fit">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span className="font-medium">Coach Alex is thinking...</span>
          </div>
        )}

        {/* Live Speech Recognition Transcript Indicator */}
        {isListening && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl animate-pulse">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-xs mb-1">
              <Mic className="w-4 h-4 text-blue-600" />
              <span>Listening to your speech...</span>
            </div>
            <p className="text-xs text-slate-800 font-medium italic">
              {speechTranscript || 'Speak clearly in English now...'}
            </p>
          </div>
        )}

        {speechError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="flex-1 font-medium">{speechError}</p>
            </div>
            <div className="flex items-center gap-2 pl-6 pt-0.5">
              <button
                onClick={handleToggleVoice}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-lg font-semibold text-xs shadow-xs transition-colors"
              >
                Retry / Request Permission
              </button>
              <button
                onClick={() => {
                  setSpeechError(null);
                  setInputMode('text');
                }}
                className="px-2 py-1 text-slate-600 hover:text-slate-800 text-xs font-medium underline"
              >
                Type instead
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Prompts */}
      {messages.length <= 3 && selectedScenario.suggestedPrompts && (
        <div className="px-4 py-2 bg-slate-100/70 border-t border-slate-200/60 overflow-x-auto flex items-center gap-2 scrollbar-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Suggested:
          </span>
          {selectedScenario.suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-xs text-slate-700 bg-white px-3 py-1.5 rounded-full border border-slate-200 whitespace-nowrap hover:border-blue-300 active:scale-95 shadow-2xs font-medium"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Controls Bar */}
      <footer className="p-4 bg-white border-t border-slate-100 pb-safe shadow-lg">
        {inputMode === 'voice' ? (
          <div className="flex flex-col items-center justify-center space-y-3">
            {/* Large Microphone Button */}
            <div className="relative flex items-center justify-center">
              <button
                onClick={handleToggleVoice}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl active:scale-90 ${
                  isListening
                    ? 'bg-red-500 text-white mic-active-pulse shadow-red-500/40 ring-4 ring-red-200'
                    : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/30 hover:scale-105'
                }`}
                aria-label={isListening ? 'Stop Listening' : 'Start Speaking'}
              >
                {isListening ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between w-full px-2">
              <span className="text-xs text-slate-500 font-medium text-center flex-1">
                {isListening ? 'Tap to finish speaking' : 'Tap mic and speak English'}
              </span>

              <button
                onClick={() => setInputMode('text')}
                className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline p-1"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>Type instead</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your English sentence..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                autoFocus
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="w-11 h-11 bg-blue-600 disabled:bg-slate-300 text-white rounded-2xl flex items-center justify-center shadow-sm active:scale-95 transition-transform"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex justify-end">
              <button
                onClick={() => setInputMode('voice')}
                className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline p-1"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Switch to voice</span>
              </button>
            </div>
          </div>
        )}
      </footer>

      {/* Conversation Report Modal */}
      {(isGeneratingReport || conversationReport) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {isGeneratingReport ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto animate-spin">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  Analyzing Your Conversation...
                </h3>
                <p className="text-xs text-slate-500">
                  Calculating scores for grammar, vocabulary, and fluency.
                </p>
              </div>
            ) : conversationReport ? (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    Conversation Report
                  </h3>
                  <p className="text-xs text-slate-500">
                    {conversationReport.overallSummary}
                  </p>
                </div>

                {/* Scores Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-3 bg-blue-50/70 rounded-2xl text-center border border-blue-100">
                    <span className="text-[10px] font-bold text-blue-600 uppercase">Speaking</span>
                    <p className="text-xl font-black text-slate-900">
                      {conversationReport.speakingScore}%
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50/70 rounded-2xl text-center border border-purple-100">
                    <span className="text-[10px] font-bold text-purple-600 uppercase">Fluency</span>
                    <p className="text-xl font-black text-slate-900">
                      {conversationReport.fluencyScore}%
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50/70 rounded-2xl text-center border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Grammar</span>
                    <p className="text-xl font-black text-slate-900">
                      {conversationReport.grammarScore}%
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50/70 rounded-2xl text-center border border-amber-100">
                    <span className="text-[10px] font-bold text-amber-600 uppercase">Vocabulary</span>
                    <p className="text-xl font-black text-slate-900">
                      {conversationReport.vocabularyScore}%
                    </p>
                  </div>
                </div>

                {/* New Words Learned */}
                {conversationReport.newWordsLearned.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-800">
                      Words Learned This Session:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {conversationReport.newWordsLearned.map((w, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700"
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Practice */}
                <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 text-xs text-indigo-950 space-y-1">
                  <span className="font-bold flex items-center gap-1 text-indigo-800">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Recommended Next Step:
                  </span>
                  <p className="text-indigo-900/90 leading-relaxed">
                    {conversationReport.recommendedPractice}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setConversationReport(null);
                    setSelectedScenario(null);
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs active:scale-95 transition-transform"
                >
                  Save & Continue
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
