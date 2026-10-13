import { UserProfile, Scenario, Word, GrammarExercise, PronunciationItem } from '../types';

const PROFILE_KEY = 'english_ai_coach_profile';
const VOCAB_KEY = 'english_ai_coach_vocab';
const MISTAKES_KEY = 'english_ai_coach_mistakes';

export const SCENARIOS: Scenario[] = [
  // Daily Life
  {
    id: 'daily-intro',
    category: 'Daily Life',
    title: 'Introducing Yourself',
    description: 'Practice sharing where you are from, what you do, and your interests.',
    role: 'A friendly international friend asking to know you better',
    iconName: 'UserCheck',
    initialMessage: "Hi there! It's so nice to meet you. My name is Alex. Could you tell me a little bit about yourself?",
    suggestedPrompts: [
      "Hi Alex, I'm happy to meet you too! My name is...",
      "I live in a bustling city and work as...",
      "In my free time, I really enjoy...",
    ],
  },
  {
    id: 'daily-food',
    category: 'Daily Life',
    title: 'Ordering at a Restaurant',
    description: 'Order your favorite meal, ask about specials, and ask for the bill.',
    role: 'A polite waiter at an American bistro',
    iconName: 'Utensils',
    initialMessage: "Welcome to The Olive Branch! Can I start you off with something refreshing to drink?",
    suggestedPrompts: [
      "Could I have a sparkling water with lemon, please?",
      "What is your chef's special today?",
      "Can I see the dinner menu, please?",
    ],
  },
  {
    id: 'daily-hobbies',
    category: 'Daily Life',
    title: 'Talking About Hobbies',
    description: 'Chat about sports, books, movies, music, or cooking.',
    role: 'A curious conversational partner interested in fun activities',
    iconName: 'Sparkles',
    initialMessage: "I love exploring new hobbies on weekends. What do you like doing when you have free time?",
    suggestedPrompts: [
      "I really enjoy reading books and listening to podcasts.",
      "Lately, I have been trying to cook new recipes.",
      "I love playing outdoor sports whenever the weather is nice.",
    ],
  },
  {
    id: 'daily-shopping',
    category: 'Daily Life',
    title: 'Shopping at a Store',
    description: 'Ask for sizes, discounts, and return policies.',
    role: 'A helpful retail store assistant',
    iconName: 'ShoppingBag',
    initialMessage: "Hello! Let me know if you are looking for any particular style or size today.",
    suggestedPrompts: [
      "Do you have this jacket in a medium size?",
      "Where is the fitting room located?",
      "Are there any sales or promotions going on right now?",
    ],
  },

  // Work
  {
    id: 'work-interview',
    category: 'Work',
    title: 'Job Interview Practice',
    description: 'Answer common behavioral interview questions with confidence.',
    role: 'A supportive senior hiring manager conducting an interview',
    iconName: 'Briefcase',
    initialMessage: "Thanks for coming in today! To begin, could you walk me through your background and why you're interested in this role?",
    suggestedPrompts: [
      "Thank you for this opportunity. Over the past few years, I have worked on...",
      "My strongest skill is collaborating with diverse teams to solve complex problems.",
      "I am excited about this company because of your innovative culture.",
    ],
  },
  {
    id: 'work-meeting',
    category: 'Work',
    title: 'Office Meeting & Updates',
    description: 'Give a status update, express agreement, and share opinions politely.',
    role: 'A project leader running the weekly team sync',
    iconName: 'Users',
    initialMessage: "Good morning team! Let's do a quick round-robin. How are your current tasks progressing this week?",
    suggestedPrompts: [
      "Our sprint tasks are on track to wrap up by Thursday.",
      "I agree with that direction, but we should also consider the timeline.",
      "I'd like to propose a quick demo later this afternoon.",
    ],
  },
  {
    id: 'work-manager',
    category: 'Work',
    title: '1-on-1 with Your Manager',
    description: 'Discuss career growth, feedback, and workload balance.',
    role: 'An empathetic team manager',
    iconName: 'UserCheck',
    initialMessage: "Hey, thanks for syncing up! How has your workload been feeling lately, and what's on your mind?",
    suggestedPrompts: [
      "I've been learning a lot, though prioritizing tasks has been a bit challenging.",
      "I'd love to take on more responsibility in leading presentations.",
      "Could we discuss potential professional development opportunities?",
    ],
  },

  // Travel
  {
    id: 'travel-airport',
    category: 'Travel',
    title: 'Airport Check-in & Security',
    description: 'Check in baggage, request window or aisle seat, and clear customs.',
    role: 'An airline check-in agent at the international terminal',
    iconName: 'Plane',
    initialMessage: "Good day! May I please see your passport and flight confirmation number?",
    suggestedPrompts: [
      "Here is my passport and e-ticket.",
      "Could I please get a window seat if one is available?",
      "Is this bag within the carry-on weight limit?",
    ],
  },
  {
    id: 'travel-hotel',
    category: 'Travel',
    title: 'Hotel Check-in & Requests',
    description: 'Check into your hotel room, ask for Wi-Fi, breakfast, and extra amenities.',
    role: 'A warm hotel front desk concierge',
    iconName: 'Building',
    initialMessage: "Welcome to The Grand Orchid! Are you checking in today?",
    suggestedPrompts: [
      "Yes, I have a reservation under my name.",
      "What time is breakfast served in the morning?",
      "Could we have two extra towels sent up to the room?",
    ],
  },
  {
    id: 'travel-directions',
    category: 'Travel',
    title: 'Asking for Directions',
    description: 'Ask locals how to reach landmarks, subway stations, or tourist attractions.',
    role: 'A friendly local resident on the city street',
    iconName: 'Compass',
    initialMessage: "Excuse me, you look like you might need some help finding your way. Where are you heading?",
    suggestedPrompts: [
      "Could you tell me how to get to the central subway station?",
      "Is the art museum within walking distance from here?",
      "Which bus should I take to reach downtown?",
    ],
  },

  // Social
  {
    id: 'social-smalltalk',
    category: 'Social',
    title: 'Small Talk & Party Chat',
    description: 'Break the ice, ask casual questions, and keep a conversation flowing naturally.',
    role: 'A friendly guest at a networking evening mixer',
    iconName: 'Coffee',
    initialMessage: "Hey! The atmosphere here is lively tonight. How did you hear about this event?",
    suggestedPrompts: [
      "A colleague of mine recommended it! It's my first time here.",
      "The music and food are great, aren't they?",
      "What do you do for work around here?",
    ],
  },
  {
    id: 'social-phone',
    category: 'Social',
    title: 'Phone Conversation',
    description: 'Make plans with a friend, confirm times, and practice telephone English.',
    role: 'Your close friend calling you on a Friday afternoon',
    iconName: 'Phone',
    initialMessage: "Hey! Just wanted to catch up quickly. Are you free to grab coffee or see a movie this weekend?",
    suggestedPrompts: [
      "Hey! I would love that. Saturday afternoon works great for me.",
      "What movie were you thinking of watching?",
      "Sounds like a plan! Let's meet at 3 PM.",
    ],
  },
];

export const INITIAL_VOCABULARY: Word[] = [
  {
    id: 'v1',
    word: 'Confidence',
    phonetic: '[KON-fi-dens]',
    meaning: 'A feeling of self-assurance arising from appreciation of one’s abilities.',
    exampleSentence: 'With daily speaking practice, my English confidence grew rapidly.',
    simpleExplanation: 'Crucial for speaking freely without being afraid of making mistakes.',
    synonym: 'Assurance / Self-belief',
    opposite: 'Doubt / Insecurity',
    level: 'Beginner',
    mastered: false,
    reviewCount: 0,
  },
  {
    id: 'v2',
    word: 'Fluency',
    phonetic: '[FLOO-en-see]',
    meaning: 'The ability to speak or write a language easily and accurately.',
    exampleSentence: 'Fluency is about communicating clearly rather than speaking fast.',
    simpleExplanation: 'The smooth flow of your language.',
    synonym: 'Smoothness',
    opposite: 'Hesitation',
    level: 'Intermediate',
    mastered: false,
    reviewCount: 0,
  },
  {
    id: 'v3',
    word: 'Convenient',
    phonetic: '[kuhn-VEEN-yuhnt]',
    meaning: 'Fitting in well with a person’s needs, activities, or plans.',
    exampleSentence: 'Having a grocery store right next to my apartment is very convenient.',
    simpleExplanation: 'Use this whenever something is easy and saves you time.',
    synonym: 'Handy / Practical',
    opposite: 'Inconvenient',
    level: 'Intermediate',
    mastered: false,
    reviewCount: 0,
  },
  {
    id: 'v4',
    word: 'Comfortable',
    phonetic: '[KUMF-ter-bul]',
    meaning: 'Providing physical ease and relaxation; free from stress.',
    exampleSentence: 'These new running shoes are extremely comfortable.',
    simpleExplanation: 'Note the pronunciation: pronounce it with 3 syllables, not four.',
    synonym: 'Cozy / Relaxed',
    opposite: 'Uncomfortable',
    level: 'Beginner',
    mastered: false,
    reviewCount: 0,
  },
  {
    id: 'v5',
    word: 'Schedule',
    phonetic: '[SKED-jool]',
    meaning: 'A plan that lists events, tasks, or appointments with expected times.',
    exampleSentence: 'I organized my weekly schedule to include daily English practice.',
    simpleExplanation: 'Essential for office, study, and daily organization.',
    synonym: 'Timetable / Agenda',
    opposite: 'Disorganization',
    level: 'Beginner',
    mastered: false,
    reviewCount: 0,
  },
  {
    id: 'v6',
    word: 'Accomplish',
    phonetic: '[uh-KOM-plish]',
    meaning: 'To achieve or complete something successfully.',
    exampleSentence: 'You can accomplish a lot if you practice 15 minutes each day.',
    simpleExplanation: 'A strong positive verb for reaching goals.',
    synonym: 'Achieve / Fulfill',
    opposite: 'Fail / Abandon',
    level: 'Intermediate',
    mastered: false,
    reviewCount: 0,
  },
  {
    id: 'v7',
    word: 'Definitely',
    phonetic: '[DEF-uh-nit-lee]',
    meaning: 'Without doubt; certainly.',
    exampleSentence: 'I will definitely recommend this book to my friends.',
    simpleExplanation: 'Native speakers use this often instead of simply saying yes.',
    synonym: 'Certainly / Absolutely',
    opposite: 'Doubtfully',
    level: 'Intermediate',
    mastered: false,
    reviewCount: 0,
  },
  {
    id: 'v8',
    word: 'Articulate',
    phonetic: '[ahr-TIK-yuh-lit]',
    meaning: 'Having or showing the ability to speak fluently and coherently.',
    exampleSentence: 'She gave an articulate summary of the project proposal.',
    simpleExplanation: 'Used to describe someone who explains ideas with clarity.',
    synonym: 'Eloquent / Clear',
    opposite: 'Incoherent',
    level: 'Advanced',
    mastered: false,
    reviewCount: 0,
  },
];

export const GRAMMAR_LESSONS: GrammarExercise[] = [
  {
    id: 'g-tenses-past',
    title: 'Past Tense vs Present Continuous',
    category: 'Tenses',
    level: 'Beginner',
    wrongExample: "I am go to office yesterday.",
    correctExample: "I went to the office yesterday.",
    simpleExplanation: "Because 'yesterday' refers to a finished past time, use the simple past 'went' instead of 'am go'.",
    keyRule: "Past markers (yesterday, last week, ago) always take past tense verbs.",
    quiz: [
      {
        question: "Last weekend, I ___ my grandparents in the countryside.",
        options: ["visit", "am visiting", "visited", "have visit"],
        correctIndex: 2,
        explanation: "'Last weekend' indicates a finished past event, so we use 'visited'."
      },
      {
        question: "Two hours ago, she ___ lunch with her teammates.",
        options: ["eats", "ate", "is eating", "eating"],
        correctIndex: 1,
        explanation: "'Two hours ago' is in the past, requiring the past simple form 'ate'."
      },
      {
        question: "Which sentence is natural and correct?",
        options: [
          "I am watch a great movie yesterday night.",
          "I watched a great movie last night.",
          "I watch a great movie last night.",
          "I am watching a movie yesterday."
        ],
        correctIndex: 1,
        explanation: "'I watched a great movie last night' uses correct past tense and natural phrasing."
      }
    ]
  },
  {
    id: 'g-prepositions-time',
    title: 'Prepositions of Time: In, On, At',
    category: 'Prepositions',
    level: 'Beginner',
    wrongExample: "The meeting starts in 3 PM on Monday morning.",
    correctExample: "The meeting starts at 3 PM on Monday morning.",
    simpleExplanation: "Use 'AT' for precise clock times (at 3 PM), 'ON' for days and dates (on Monday), and 'IN' for longer periods (in July, in 2026).",
    keyRule: "At = exact time; On = days/dates; In = months, years, seasons, long periods.",
    quiz: [
      {
        question: "Our flight takes off ___ 7:30 AM tomorrow.",
        options: ["in", "on", "at", "by the"],
        correctIndex: 2,
        explanation: "Clock times take 'at'."
      },
      {
        question: "I always like to go for a run ___ Saturday mornings.",
        options: ["at", "on", "in", "to"],
        correctIndex: 1,
        explanation: "Specific days of the week take 'on'."
      },
      {
        question: "My sister was born ___ October.",
        options: ["in", "on", "at", "during to"],
        correctIndex: 0,
        explanation: "Months without a specific date take 'in'."
      }
    ]
  },
  {
    id: 'g-articles',
    title: 'Articles: A, An, or The',
    category: 'Articles',
    level: 'Beginner',
    wrongExample: "She wants to buy an car.",
    correctExample: "She wants to buy a car.",
    simpleExplanation: "Use 'an' before vowel sounds (an apple, an hour), and 'a' before consonant sounds (a car, a university).",
    keyRule: "Sound matters, not just the letter. 'Hour' starts with a silent H, so say 'an hour'.",
    quiz: [
      {
        question: "I will meet you in ___ hour at the cafe.",
        options: ["a", "an", "the a", "one of"],
        correctIndex: 1,
        explanation: "'Hour' begins with a vowel sound (ow-er), so it uses 'an'."
      },
      {
        question: "He is studying at ___ European university.",
        options: ["a", "an", "the one", "no article"],
        correctIndex: 0,
        explanation: "'European' starts with a consonant 'Y' sound (yoo-roh-pee-an), so it takes 'a'."
      },
      {
        question: "Can you please pass me ___ salt on the table?",
        options: ["a", "an", "the", "some a"],
        correctIndex: 2,
        explanation: "We use 'the' because both speakers know which specific salt on the table is meant."
      }
    ]
  },
  {
    id: 'g-modal-verbs',
    title: 'Polite Requests: Could, Would & Can',
    category: 'Modal Verbs',
    level: 'Intermediate',
    wrongExample: "Give me the salt please.",
    correctExample: "Could you please pass the salt?",
    simpleExplanation: "In English, framing requests with 'Could you' or 'Would you mind' sounds much more polite and respectful than direct commands.",
    keyRule: "Could you please + base verb = friendly, polite request.",
    quiz: [
      {
        question: "___ you mind closing the window? It's a bit chilly.",
        options: ["Could", "Would", "Can", "May"],
        correctIndex: 1,
        explanation: "'Would you mind' is the classic polite construction followed by an -ing verb."
      },
      {
        question: "___ I have a glass of water, please?",
        options: ["Could", "Will", "Should", "Must"],
        correctIndex: 0,
        explanation: "'Could I have' is standard, polite phrasing when ordering or requesting something."
      }
    ]
  }
];

export const PRONUNCIATION_DECK: PronunciationItem[] = [
  {
    id: 'p1',
    word: 'Comfortable',
    phonetic: '[KUMF-ter-bul]',
    breakdown: 'Say "comf-ter-ble" (3 syllables). Do not say "com-for-ta-ble".',
    example: 'This chair is very comfortable.',
    tip: 'Drop the second "o" sound completely.',
    level: 'Beginner',
  },
  {
    id: 'p2',
    word: 'Schedule',
    phonetic: '[SKED-jool]',
    breakdown: 'US: "sked-jool" | UK: "shed-yool"',
    example: 'Let’s check our weekly schedule.',
    tip: 'Blend the "d" and "j" sound smoothly.',
    level: 'Beginner',
  },
  {
    id: 'p3',
    word: 'Definitely',
    phonetic: '[DEF-uh-nit-lee]',
    breakdown: 'DEF-uh-nit-lee (4 syllables, stress on DEF)',
    example: 'I will definitely practice every day.',
    tip: 'Stress the first syllable: DEF-init-ly.',
    level: 'Intermediate',
  },
  {
    id: 'p4',
    word: 'Vegetable',
    phonetic: '[VEJ-tuh-bul]',
    breakdown: 'Say "VEJ-tuh-ble" (3 syllables).',
    example: 'Fresh vegetable salad is good for health.',
    tip: 'Do not pronounce "ve-ge-ta-ble"; collapse into 3 syllables.',
    level: 'Beginner',
  },
  {
    id: 'p5',
    word: 'Enthusiastic',
    phonetic: '[en-thoo-zee-AS-tik]',
    breakdown: 'en-thoo-zee-AS-tik (5 syllables, stress on AS)',
    example: 'He is enthusiastic about learning English.',
    tip: 'Put gentle tongue tip between teeth for the "th" sound.',
    level: 'Advanced',
  },
];

export const BADGES_LIST = [
  { id: 'first_chat', title: 'First Conversation', desc: 'Completed your first AI chat session', icon: 'MessageSquare' },
  { id: 'streak_3', title: '3-Day Streak', desc: 'Practiced English 3 days in a row', icon: 'Flame' },
  { id: 'streak_7', title: '7-Day Streak', desc: 'Kept the momentum going for a full week', icon: 'Zap' },
  { id: 'words_10', title: 'Word Collector', desc: 'Learned your first 10 vocabulary words', icon: 'BookOpen' },
  { id: 'quiz_master', title: 'Quiz Master', desc: 'Scored 100% on a grammar or lesson quiz', icon: 'Award' },
  { id: 'voice_hero', title: 'Speaking Pioneer', desc: 'Practiced speaking with microphone', icon: 'Mic' },
];

export function getTodayDateString(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export function loadUserProfile(): UserProfile {
  const today = getTodayDateString();
  const defaultProfile: UserProfile = {
    name: 'Friend',
    level: 'Beginner',
    goal: 'Speaking',
    dailyGoalMinutes: 15,
    todayPracticeMinutes: 7, // Initial realistic progress
    streak: 5, // As requested in prompt: 5 days streak
    lastPracticeDate: today,
    totalPracticeMinutes: 65,
    wordsLearnedCount: 18,
    conversationsCount: 4,
    onboardingCompleted: true,
    voiceRate: 1.0,
    voiceGender: 'female',
    badges: ['first_chat', 'streak_3', 'voice_hero'],
    dailyHistory: {
      [today]: 7,
    },
    mistakeHistory: [
      {
        original: 'I am go to office yesterday.',
        better: 'I went to the office yesterday.',
        why: "Because 'yesterday' refers to the past, use 'went' instead of 'am go'.",
        trySaying: 'I went to the office yesterday.',
        mistakeType: 'Verb Tense',
      },
    ],
  };

  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return defaultProfile;
    const parsed = JSON.parse(raw);
    
    // Check if day changed to reset todayPracticeMinutes
    if (parsed.lastPracticeDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (parsed.lastPracticeDate === yesterdayStr) {
        // Streak continues
      } else {
        // Streak reset if missed more than 1 day
        // Keep friendly
      }
      parsed.todayPracticeMinutes = 0;
      parsed.lastPracticeDate = today;
    }
    return { ...defaultProfile, ...parsed };
  } catch (e) {
    return defaultProfile;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile', e);
  }
}

export function addPracticeMinutes(minutes: number): UserProfile {
  const profile = loadUserProfile();
  const today = getTodayDateString();
  
  profile.todayPracticeMinutes += minutes;
  profile.totalPracticeMinutes += minutes;
  profile.dailyHistory[today] = (profile.dailyHistory[today] || 0) + minutes;

  saveUserProfile(profile);
  return profile;
}

export function recordMistake(correction: { original: string; better: string; why: string; trySaying: string; mistakeType: string }): void {
  const profile = loadUserProfile();
  if (!profile.mistakeHistory) profile.mistakeHistory = [];
  
  // Avoid exact duplicates
  const exists = profile.mistakeHistory.some(m => m.original.toLowerCase() === correction.original.toLowerCase());
  if (!exists) {
    profile.mistakeHistory.unshift(correction);
    if (profile.mistakeHistory.length > 20) profile.mistakeHistory.pop();
    saveUserProfile(profile);
  }
}

export function loadVocabulary(): Word[] {
  try {
    const raw = localStorage.getItem(VOCAB_KEY);
    if (!raw) return INITIAL_VOCABULARY;
    return JSON.parse(raw);
  } catch {
    return INITIAL_VOCABULARY;
  }
}

export function saveVocabulary(words: Word[]): void {
  try {
    localStorage.setItem(VOCAB_KEY, JSON.stringify(words));
  } catch (e) {
    console.error('Failed to save vocabulary', e);
  }
}

export function updateWordStatus(wordId: string, mastered: boolean): Word[] {
  const words = loadVocabulary();
  const updated = words.map(w => {
    if (w.id === wordId) {
      return {
        ...w,
        mastered,
        reviewCount: (w.reviewCount || 0) + 1,
        lastReviewed: Date.now(),
      };
    }
    return w;
  });
  saveVocabulary(updated);
  
  // Update words learned count
  const profile = loadUserProfile();
  profile.wordsLearnedCount = updated.filter(w => w.mastered).length;
  saveUserProfile(profile);

  return updated;
}

const BACKEND_URL_KEY = 'english_ai_coach_backend_url';

export function getStoredBackendUrl(): string {
  try {
    return localStorage.getItem(BACKEND_URL_KEY) || '';
  } catch {
    return '';
  }
}

export function saveStoredBackendUrl(url: string): void {
  try {
    const trimmed = url.trim();
    if (trimmed) {
      localStorage.setItem(BACKEND_URL_KEY, trimmed.replace(/\/+$/, ''));
    } else {
      localStorage.removeItem(BACKEND_URL_KEY);
    }
  } catch (e) {
    console.error('Failed to save backend url', e);
  }
}
