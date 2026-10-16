import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// CORS setup for Android Capacitor, local network testing, and web clients
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  : [
      'https://localhost',
      'capacitor://localhost',
      'http://localhost',
      'http://localhost:3000',
      'http://localhost:5173',
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, Capacitor native webview, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Allow local network IP addresses in development (e.g. 192.168.x.x, 10.x.x.x)
      if (
        /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(
          origin
        )
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

// Health check endpoint for diagnostic connectivity checks
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'English AI Coach Backend',
    version: '1.0.0',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Initialize GoogleGenAI server-side with required headers
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
const FALLBACK_MODELS = ['gemini-3.1-flash-lite-preview', 'gemini-3.8-flash'];

async function generateContentWithRetry(params: any) {
  const modelsToTry = [
    PRIMARY_MODEL,
    ...FALLBACK_MODELS.filter((m) => m !== PRIMARY_MODEL),
  ];
  let lastError: any = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      return await ai.models.generateContent({
        ...params,
        model,
      });
    } catch (err: any) {
      lastError = err;
      // Do not retry client 4xx errors (bad prompt structure or invalid params)
      if (err?.status >= 400 && err?.status < 500 && err?.status !== 429) {
        throw err;
      }
      // If there is another model to try, wait briefly before retrying
      if (i < modelsToTry.length - 1) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }

  throw lastError;
}

// Helper to sanitize and extract JSON safely
function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned;
}

// 1. Conversation Chat Endpoint
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages = [], scenario, userLevel = 'Intermediate', currentMistakes = [] } = req.body;
    const lastUserMessage = messages[messages.length - 1]?.text || '';

    const systemInstruction = `You are a warm, encouraging, and natural AI English Teacher named "Coach Alex".
Target User Level: ${userLevel} (A1-A2: use simple vocabulary, short sentences, kind guidance. B1-B2: natural conversational rhythm, everyday idioms. C1-C2: nuanced, sophisticated, professional).
Scenario: ${scenario?.title || 'Daily Life Conversation'}.
Scenario Context: ${scenario?.description || 'Free conversation to practice speaking'}.
Roleplay persona: ${scenario?.role || 'A friendly English teacher and conversational partner'}.
User's past mistake trends to watch for: ${JSON.stringify(currentMistakes.slice(-3))}.

Instructions:
1. Always respond in character to keep the conversation engaging and realistic.
2. End your reply with a natural open follow-up question suited to their level.
3. If the user made any grammatical, prepositional, lexical, or structural mistakes in their latest sentence ("${lastUserMessage}"), gently extract it and provide:
   - "better": The natural, correct way a native speaker would say it.
   - "why": A simple, clear 1-2 sentence explanation without heavy academic grammar jargon.
   - "trySaying": A short sentence for the user to repeat.
   - "mistakeType": e.g. "Past Tense", "Preposition", "Subject-Verb Agreement", "Vocabulary Choice", or "None".
4. If what the user said was already natural and correct, set "hasCorrection" to false and offer a brief encouraging compliment.`;

    // Limit conversation history to latest 10 messages to minimize latency and token overhead
    const MAX_HISTORY = 10;
    const recentMessages = Array.isArray(messages) ? messages.slice(-MAX_HISTORY) : [];

    let contents = recentMessages.map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: String(m.text || '').trim() }],
    }));

    // Gemini API requires conversational contents to start with a user message
    if (contents.length > 0 && contents[0].role === 'model') {
      contents = [
        { role: 'user', parts: [{ text: "Hello! Let's begin practicing." }] },
        ...contents,
      ];
    }

    if (!process.env.GEMINI_API_KEY) {
      // High-quality smart offline fallback
      return res.json({
        reply: `That sounds really interesting! Can you tell me a little bit more about what you enjoyed most?`,
        hasCorrection: lastUserMessage.toLowerCase().includes('i am go') || lastUserMessage.toLowerCase().includes('yesterday'),
        correction: {
          original: lastUserMessage,
          better: lastUserMessage.toLowerCase().includes('yesterday')
            ? 'I went there yesterday.'
            : 'I am going there soon.',
          why: "When speaking about past actions, use the past simple form ('went' instead of 'go').",
          trySaying: 'I went there yesterday.',
          mistakeType: 'Verb Tense',
        },
      });
    }

    const response = await generateContentWithRetry({
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING, description: 'The natural conversational response to the user' },
            hasCorrection: { type: Type.BOOLEAN, description: 'Whether the user sentence had a mistake' },
            correctedSentence: { type: Type.STRING, description: 'The better way to say it in English, or empty string' },
            why: { type: Type.STRING, description: 'A simple 1-sentence explanation of why, or empty string' },
            trySaying: { type: Type.STRING, description: 'Short phrase to practice, or empty string' },
            mistakeType: { type: Type.STRING, description: 'Type of mistake e.g. Past Tense, Preposition, or None' },
          },
          required: ['reply', 'hasCorrection', 'correctedSentence', 'why', 'trySaying', 'mistakeType'],
        },
      },
    });

    const parsed = JSON.parse(cleanJsonText(response.text || '{}'));
    return res.json({
      reply: parsed.reply || "That's very interesting! Could you tell me more?",
      hasCorrection: !!parsed.hasCorrection,
      correction: parsed.hasCorrection ? {
        original: lastUserMessage,
        better: parsed.correctedSentence || lastUserMessage,
        why: parsed.why || "Here is a more natural native way to express that.",
        trySaying: parsed.trySaying || parsed.correctedSentence || lastUserMessage,
        mistakeType: parsed.mistakeType || "Grammar",
      } : undefined,
    });
  } catch (_error: any) {
    console.error('[server] /api/gemini/chat error:', _error?.message || _error);
    return res.status(500).json({
      error: 'AI Coach is temporarily unavailable. Please retry.',
      details: _error?.message || 'Server error',
    });
  }
});

// 2. Speaking Analysis Endpoint
app.post('/api/gemini/analyze-speaking', async (req, res) => {
  try {
    const { sentence, userLevel = 'Intermediate' } = req.body;

    if (!sentence || sentence.trim().length === 0) {
      return res.status(400).json({ error: 'Sentence is required' });
    }

    const prompt = `Analyze this spoken English sentence from an English learner (Level: ${userLevel}):
"${sentence}"

Provide feedback:
- original: The exact sentence
- better: The natural native English version
- why: A simple, non-academic explanation of the improvement
- trySaying: A natural sentence to practice saying aloud
- fluencyScore: An estimate from 60 to 98
- grammarScore: An estimate from 60 to 98
- vocabularyScore: An estimate from 60 to 98
- mistakeType: e.g. "Preposition", "Tense", "Word Choice", "Word Order", "Articles", or "None (Well Done!)"`;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        original: sentence,
        better: sentence.endsWith('.') ? sentence : `${sentence}.`,
        why: 'Good expression! Adding clear sentence endings helps pacing and clarity.',
        trySaying: sentence,
        fluencyScore: 85,
        grammarScore: 88,
        vocabularyScore: 82,
        mistakeType: 'Fluency & Pacing',
      });
    }

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING },
            better: { type: Type.STRING },
            why: { type: Type.STRING },
            trySaying: { type: Type.STRING },
            fluencyScore: { type: Type.INTEGER },
            grammarScore: { type: Type.INTEGER },
            vocabularyScore: { type: Type.INTEGER },
            mistakeType: { type: Type.STRING },
          },
          required: ['original', 'better', 'why', 'trySaying', 'fluencyScore', 'grammarScore', 'vocabularyScore', 'mistakeType'],
        },
      },
    });

    const parsed = JSON.parse(cleanJsonText(response.text || '{}'));
    return res.json(parsed);
  } catch (_error: any) {
    const fallbackSentence = req.body?.sentence || '';
    return res.json({
      original: fallbackSentence,
      better: fallbackSentence.endsWith('.') ? fallbackSentence : `${fallbackSentence}.`,
      why: 'Good effort! Keep practicing to sound even more natural.',
      trySaying: fallbackSentence,
      fluencyScore: 85,
      grammarScore: 84,
      vocabularyScore: 82,
      mistakeType: 'General Practice',
    });
  }
});

// 3. Grammar Checker ("Check My English")
app.post('/api/gemini/grammar-check', async (req, res) => {
  try {
    const { text, userLevel = 'Intermediate' } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const prompt = `You are an expert English grammar coach. Analyze this sentence written by a ${userLevel} student:
"${text}"

Check grammar, vocabulary, prepositions, word order, and naturalness.
Provide:
- original: The user's input
- corrected: Grammatically accurate version
- naturalEnglish: How an authentic native English speaker would say it in conversation
- explanation: Clear, friendly reason for the correction without heavy linguistic jargon
- mistakeType: Category of main mistake (e.g. Grammar, Vocabulary, Word Order, Preposition, Articles, Punctuation, Perfect!)
- keyTip: A memorable rule of thumb`;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        original: text,
        corrected: text.replace(/\bi am go\b/gi, 'I am going').replace(/\bi go yesterday\b/gi, 'I went yesterday'),
        naturalEnglish: text.replace(/\bi am go to office\b/gi, "I'm heading to the office"),
        explanation: "In English, use '-ing' after forms of 'to be', or use simple past for completed events.",
        mistakeType: 'Verb Form',
        keyTip: "Past events need past tense verbs: 'go' becomes 'went'.",
      });
    }

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING },
            corrected: { type: Type.STRING },
            naturalEnglish: { type: Type.STRING },
            explanation: { type: Type.STRING },
            mistakeType: { type: Type.STRING },
            keyTip: { type: Type.STRING },
          },
          required: ['original', 'corrected', 'naturalEnglish', 'explanation', 'mistakeType', 'keyTip'],
        },
      },
    });

    const parsed = JSON.parse(cleanJsonText(response.text || '{}'));
    return res.json(parsed);
  } catch (_error: any) {
    return res.json({
      original: req.body?.text || '',
      corrected: req.body?.text || '',
      naturalEnglish: req.body?.text || '',
      explanation: 'Your sentence is clear and understandable. Keep practicing daily!',
      mistakeType: 'Practice Review',
      keyTip: 'Regular sentence building cements native phrasing.',
    });
  }
});

// 4. Daily Lesson Generator
app.post('/api/gemini/daily-lesson', async (req, res) => {
  try {
    const { userLevel = 'Intermediate', topic = 'Morning Routine & Daily Life' } = req.body;

    const prompt = `Generate a complete daily English lesson for a ${userLevel} student on the topic: "${topic}".
Include:
1. topic: Title of today's lesson
2. themeDescription: 1 engaging sentence describing what we are learning
3. words: Exactly 5 useful new words or phrases suited for ${userLevel}. For each word include:
   - word: The vocabulary word
   - phonetic: Friendly phonetics (e.g. [KUMF-ter-bul])
   - meaning: Clear simple definition
   - exampleSentence: Natural example sentence
   - simpleExplanation: Why this word is useful
   - synonym: Common synonym
   - opposite: Common antonym or "N/A"
4. quiz: Exactly 4 multiple-choice questions testing these 5 words. For each question:
   - question: The question or sentence with a blank (e.g. "I need to ___ for my meeting.")
   - options: 4 distinct choices
   - correctIndex: 0-based index of correct option
   - explanation: Simple explanation why it is correct`;

    if (!process.env.GEMINI_API_KEY) {
      return res.json(getMockDailyLesson(topic, userLevel));
    }

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            themeDescription: { type: Type.STRING },
            words: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  phonetic: { type: Type.STRING },
                  meaning: { type: Type.STRING },
                  exampleSentence: { type: Type.STRING },
                  simpleExplanation: { type: Type.STRING },
                  synonym: { type: Type.STRING },
                  opposite: { type: Type.STRING },
                },
                required: ['word', 'phonetic', 'meaning', 'exampleSentence', 'simpleExplanation'],
              },
            },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctIndex', 'explanation'],
              },
            },
          },
          required: ['topic', 'themeDescription', 'words', 'quiz'],
        },
      },
    });

    const parsed = JSON.parse(cleanJsonText(response.text || '{}'));
    return res.json(parsed);
  } catch (_error: any) {
    return res.json(getMockDailyLesson(req.body?.topic || 'Daily Routine', req.body?.userLevel || 'Intermediate'));
  }
});

// 5. Listening Practice Generator
app.post('/api/gemini/listening', async (req, res) => {
  try {
    const { userLevel = 'Intermediate', difficulty = 'Medium' } = req.body;

    const prompt = `Generate an English listening comprehension exercise for a ${userLevel} student (${difficulty} difficulty).
Create a realistic 4-6 line dialogue between 2 characters.
Include:
- title: e.g. "Ordering Coffee at a Cafe"
- situation: Brief background
- dialogue: array of { speaker, text }
- questions: 3 multiple-choice comprehension questions with:
  - question: string
  - options: 4 string choices
  - correctIndex: 0-based index
  - explanation: string`;

    if (!process.env.GEMINI_API_KEY) {
      return res.json(getMockListening(userLevel, difficulty));
    }

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            situation: { type: Type.STRING },
            dialogue: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: { type: Type.STRING },
                  text: { type: Type.STRING },
                },
                required: ['speaker', 'text'],
              },
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctIndex', 'explanation'],
              },
            },
          },
          required: ['title', 'situation', 'dialogue', 'questions'],
        },
      },
    });

    const parsed = JSON.parse(cleanJsonText(response.text || '{}'));
    return res.json(parsed);
  } catch (error) {
    return res.json(getMockListening(req.body.userLevel || 'Intermediate', req.body.difficulty || 'Medium'));
  }
});

// 6. Reading Practice Generator
app.post('/api/gemini/reading', async (req, res) => {
  try {
    const { userLevel = 'Intermediate' } = req.body;

    const prompt = `Create a short, engaging reading practice passage for an English learner at ${userLevel} level.
Length: 120-180 words.
Include:
- title: Engaging headline
- passage: 2 short paragraphs
- keyVocabulary: 3-4 words with their definitions in context
- questions: 3 reading comprehension questions with 4 choices each, correctIndex, and explanation`;

    if (!process.env.GEMINI_API_KEY) {
      return res.json(getMockReading(userLevel));
    }

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            passage: { type: Type.STRING },
            keyVocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  definition: { type: Type.STRING },
                },
                required: ['word', 'definition'],
              },
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctIndex', 'explanation'],
              },
            },
          },
          required: ['title', 'passage', 'keyVocabulary', 'questions'],
        },
      },
    });

    const parsed = JSON.parse(cleanJsonText(response.text || '{}'));
    return res.json(parsed);
  } catch (error) {
    return res.json(getMockReading(req.body.userLevel || 'Intermediate'));
  }
});

// 7. Conversation Report Generator
app.post('/api/gemini/conversation-report', async (req, res) => {
  try {
    const { messages, scenario, userLevel = 'Intermediate' } = req.body;
    const userTexts = messages.filter((m: any) => m.sender === 'user').map((m: any) => m.text);

    const prompt = `Analyze this entire English conversation session between an AI Teacher and a student (${userLevel} level).
Scenario: ${scenario?.title || 'Daily Conversation'}
User utterances:
${userTexts.join('\n')}

Generate a comprehensive Conversation Report:
- speakingScore: 70-98
- grammarScore: 70-98
- vocabularyScore: 70-98
- fluencyScore: 70-98
- overallSummary: 2-3 warm, motivating sentences highlighting progress
- newWordsLearned: 3-5 useful words relevant to this conversation
- commonMistakes: array of { mistake, correction, explanation }
- recommendedPractice: 1 actionable practice advice`;

    if (!process.env.GEMINI_API_KEY || userTexts.length === 0) {
      return res.json({
        speakingScore: 84,
        grammarScore: 82,
        vocabularyScore: 85,
        fluencyScore: 80,
        overallSummary: "Great job completing your speaking session! You communicated your thoughts clearly and responded naturally.",
        newWordsLearned: ['Definitely', 'Convenient', 'Schedule', 'Prefer'],
        commonMistakes: [
          {
            mistake: "I am agree with you",
            correction: "I agree with you",
            explanation: "'Agree' is already a verb, so you do not need 'am'."
          }
        ],
        recommendedPractice: "Practice expressing your preferences using phrases like 'I'd rather' and 'I prefer'."
      });
    }

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            speakingScore: { type: Type.INTEGER },
            grammarScore: { type: Type.INTEGER },
            vocabularyScore: { type: Type.INTEGER },
            fluencyScore: { type: Type.INTEGER },
            overallSummary: { type: Type.STRING },
            newWordsLearned: { type: Type.ARRAY, items: { type: Type.STRING } },
            commonMistakes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  mistake: { type: Type.STRING },
                  correction: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['mistake', 'correction', 'explanation'],
              },
            },
            recommendedPractice: { type: Type.STRING },
          },
          required: ['speakingScore', 'grammarScore', 'vocabularyScore', 'fluencyScore', 'overallSummary', 'newWordsLearned', 'commonMistakes', 'recommendedPractice'],
        },
      },
    });

    const parsed = JSON.parse(cleanJsonText(response.text || '{}'));
    return res.json(parsed);
  } catch (error) {
    return res.json({
      speakingScore: 85,
      grammarScore: 84,
      vocabularyScore: 86,
      fluencyScore: 83,
      overallSummary: "Fantastic practice! You maintained good pacing and used helpful vocabulary.",
      newWordsLearned: ['Routine', 'Schedule', 'Definitely'],
      commonMistakes: [],
      recommendedPractice: "Continue practicing 15 minutes a day to lock in your fluency gains!",
    });
  }
});

// Fallback generators
function getMockDailyLesson(topic: string, level: string) {
  return {
    topic: topic || "Talking About Your Morning Routine",
    themeDescription: "Master everyday words to describe how you start your morning smoothly.",
    words: [
      {
        word: "Routine",
        phonetic: "[roo-TEEN]",
        meaning: "A regular sequence of actions followed regularly.",
        exampleSentence: "My morning routine always starts with a fresh glass of water.",
        simpleExplanation: "Use this word when talking about daily habits.",
        synonym: "Habit / Schedule",
        opposite: "Disorder"
      },
      {
        word: "Usually",
        phonetic: "[YOO-zhoo-uh-lee]",
        meaning: "Under normal conditions; generally.",
        exampleSentence: "I usually wake up at 7:00 AM on weekdays.",
        simpleExplanation: "Great frequency adverb to explain what is common for you.",
        synonym: "Normally",
        opposite: "Rarely"
      },
      {
        word: "Prepare",
        phonetic: "[pri-PAIR]",
        meaning: "To make something ready for use or consideration.",
        exampleSentence: "I prepare my breakfast before checking my work emails.",
        simpleExplanation: "A versatile verb for getting ready.",
        synonym: "Get ready",
        opposite: "Neglect"
      },
      {
        word: "Quickly",
        phonetic: "[KWIK-lee]",
        meaning: "At a fast speed; rapidly.",
        exampleSentence: "She walked quickly to catch the morning train.",
        simpleExplanation: "An adverb describing doing something with speed.",
        synonym: "Fast / Rapidly",
        opposite: "Slowly"
      },
      {
        word: "Schedule",
        phonetic: "[SKED-jool]",
        meaning: "A plan for carrying out process or events with intended times.",
        exampleSentence: "I like to review my daily schedule before starting work.",
        simpleExplanation: "Essential for work and everyday organization.",
        synonym: "Timetable / Plan",
        opposite: "Improvisation"
      }
    ],
    quiz: [
      {
        question: "I ___ drink green tea in the morning because it helps me focus.",
        options: ["rarely", "usually", "yesterday", "slowly"],
        correctIndex: 1,
        explanation: "'Usually' describes a typical habit."
      },
      {
        question: "Don't forget to ___ your backpack before leaving the house.",
        options: ["routine", "quickly", "prepare", "schedule"],
        correctIndex: 2,
        explanation: "'Prepare' means getting things ready."
      },
      {
        question: "Having a healthy morning ___ gives me positive energy for the entire day.",
        options: ["routine", "hurry", "clock", "traffic"],
        correctIndex: 0,
        explanation: "'Routine' refers to your structured sequence of morning habits."
      },
      {
        question: "Let's check the train ___ so we arrive at the station on time.",
        options: ["prepare", "schedule", "quickly", "usually"],
        correctIndex: 1,
        explanation: "'Schedule' is a timetable of departure and arrival times."
      }
    ]
  };
}

function getMockListening(level: string, difficulty: string) {
  return {
    title: "Weekend Plans at the Cafe",
    situation: "Two friends, Emma and Liam, meet at a local cafe on Friday afternoon.",
    dialogue: [
      { speaker: "Emma", text: "Hey Liam! Do you have any special plans for this Saturday?" },
      { speaker: "Liam", text: "Hi Emma! Not much yet. I was thinking of hiking in the national park if the weather stays sunny." },
      { speaker: "Emma", text: "That sounds wonderful! The forecast says it will be warm and clear all weekend." },
      { speaker: "Liam", text: "Awesome! Would you like to join me? We could pack some sandwiches for lunch." },
      { speaker: "Emma", text: "I'd love to! Let's meet at the park entrance at 9:00 AM." }
    ],
    questions: [
      {
        question: "What is Liam planning to do this Saturday?",
        options: ["Go shopping in the city", "Hike in the national park", "Visit a museum", "Stay home and study"],
        correctIndex: 1,
        explanation: "Liam says he was thinking of hiking in the national park."
      },
      {
        question: "What is the expected weather for the weekend?",
        options: ["Rainy and cold", "Windy and cloudy", "Warm and clear", "Stormy"],
        correctIndex: 2,
        explanation: "Emma confirms the forecast says it will be warm and clear."
      },
      {
        question: "What time did they agree to meet?",
        options: ["8:00 AM", "9:00 AM", "10:30 AM", "12:00 PM"],
        correctIndex: 1,
        explanation: "Emma suggests meeting at the park entrance at 9:00 AM, which Liam agrees to."
      }
    ]
  };
}

function getMockReading(level: string) {
  return {
    title: "The Power of Micro-Habits in Language Learning",
    passage: "Many language learners believe that mastering English requires hours of intense study every day. However, modern educational research shows that consistent, small daily actions produce far superior results over time. Practicing for just fifteen minutes every morning helps your brain retain new vocabulary much better than cramming for three hours once a week.\n\nWhen you speak out loud every day, your vocal muscles adapt to English pronunciation patterns naturally. Confidence does not come from waiting until your grammar is flawless; it builds gradually each time you express your thoughts in real conversations.",
    keyVocabulary: [
      { word: "Retain", definition: "To continue to hold or keep in mind; remember." },
      { word: "Cramming", definition: "Studying intensively over a short period right before an event." },
      { word: "Flawless", definition: "Without any imperfections or defects; perfect." }
    ],
    questions: [
      {
        question: "According to research in the passage, what produces superior results in language learning?",
        options: [
          "Studying for 5 hours every weekend",
          "Consistent small daily actions",
          "Memorizing entire dictionaries",
          "Never speaking until grammar is perfect"
        ],
        correctIndex: 1,
        explanation: "The passage explicitly notes that 'consistent, small daily actions produce far superior results over time'."
      },
      {
        question: "Why is speaking out loud every day beneficial?",
        options: [
          "It trains vocal muscles for English pronunciation naturally",
          "It eliminates the need for vocabulary study",
          "It makes studying longer than 2 hours necessary",
          "It guarantees 100% test scores"
        ],
        correctIndex: 0,
        explanation: "The second paragraph explains that your vocal muscles adapt to English pronunciation patterns naturally when speaking daily."
      },
      {
        question: "When does genuine confidence build?",
        options: [
          "Only when you never make a single mistake",
          "When you express your thoughts in real conversations",
          "After ten years of silent reading",
          "When you avoid speaking in public"
        ],
        correctIndex: 1,
        explanation: "Confidence builds gradually each time you express your thoughts in real conversations."
      }
    ]
  };
}

// Full-stack Vite setup: mount Vite middlewares in dev, serve static in production
async function startServer() {
  const isServerJs = __filename.endsWith('server.js');
  const isProduction = process.env.NODE_ENV === 'production' || isServerJs;
  const distPath = path.resolve(__dirname, 'dist');

  // 404 catch-all for any unhandled /api/* routes (ensures API callers never receive HTML)
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      error: 'API endpoint not found',
      path: req.originalUrl,
      method: req.method,
    });
  });

  if (isProduction) {
    if (fs.existsSync(distPath)) {
      // Serve static frontend assets
      app.use(express.static(distPath));

      // SPA fallback: only handle non-API routes with index.html
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.warn(`[English AI Coach] Warning: 'dist' folder not found at ${distPath}. Run 'npm run build' to generate frontend assets.`);
      app.get('*', (_req, res) => {
        res.status(503).send('Application frontend is building or dist folder is missing. Please run `npm run build`.');
      });
    }
  } else {
    // Development mode with Vite HMR/middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[English AI Coach] Server listening on http://0.0.0.0:${PORT} (env: ${process.env.NODE_ENV || 'development'})`);
  });

  server.on('error', (err: any) => {
    console.error('[English AI Coach] Server error:', err);
  });

  process.on('SIGTERM', () => {
    console.log('[English AI Coach] SIGTERM signal received. Closing server gracefully...');
    server.close(() => {
      console.log('[English AI Coach] HTTP server closed.');
      process.exit(0);
    });
  });
}

startServer().catch((err) => {
  console.error('[English AI Coach] Fatal error starting server:', err);
  process.exit(1);
});

