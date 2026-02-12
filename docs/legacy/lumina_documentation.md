# Lumina - Cosmic Self Discovery App
## Complete Technical Documentation

**Version:** 1.0.0  
**Date:** February 2026  
**Platform:** iOS & Android (React Native)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision](#product-vision)
3. [Core Features](#core-features)
4. [Technical Architecture](#technical-architecture)
5. [Data Models](#data-models)
6. [API Integration](#api-integration)
7. [User Experience Flow](#user-experience-flow)
8. [Design System](#design-system)
9. [Astronomical Calculations](#astronomical-calculations)
10. [Privacy & Security](#privacy--security)
11. [Monetization Strategy](#monetization-strategy)
12. [Development Roadmap](#development-roadmap)

---

## Executive Summary

**Lumina** is a modern, AI-powered astrology application that focuses on deep self-reflection through advanced birth chart analysis, personalized daily guidance, and pattern recognition across journal entries. Unlike traditional horoscope apps, Lumina targets serious astrology enthusiasts who want to understand cosmic patterns in their life through data-driven insights powered by Google's Gemini API.

### Key Differentiators
- **Advanced birth chart analysis** (Sun, Moon, Rising, all planets, houses, aspects)
- **AI-powered pattern recognition** correlating journal entries with transits
- **Decision support system** for major life choices
- **Privacy-first** with optional offline-only mode
- **Modern, minimal design** avoiding mystical clichés

---

## Product Vision

### Mission
To help individuals achieve profound self-awareness by revealing the patterns between their inner experiences and cosmic cycles, creating a personalized map for personal growth.

### Target Audience
- **Primary:** Serious astrology enthusiasts (25-45 years old)
- **Secondary:** Self-development seekers exploring astrology
- **User personas:**
  - Sarah, 32: Uses astrology for career timing and relationship insights
  - Marcus, 28: Tracks emotional patterns with moon phases
  - Priya, 39: Interested in shadow work and deep transformation

### Success Metrics
- **Daily Active Users (DAU):** 30% of MAU
- **Average session duration:** 5+ minutes
- **Journal entries per week:** 4+ per active user
- **Retention rate (Day 30):** 40%+
- **Paid conversion rate:** 15% within 60 days

---

## Core Features

### 1. Self-Reflection Engine (Primary)

#### 1.1 Daily Cosmic Journal
**Purpose:** Main feature for deep self-awareness through daily writing practice.

**Components:**
- Daily AI-generated prompts based on current transits
- Rich text editor with mood tagging
- Voice-to-text journaling (Phase 2)
- Photo attachments for memory context
- Privacy controls (local/cloud/encrypted)

**Prompt Generation Logic:**
```
Input: User's birth chart + Current transits + Recent journal themes
Output: Personalized reflection prompt

Examples:
- Moon conjunct user's Venus: "What relationships are bringing you joy today?"
- Saturn square user's Sun: "What responsibilities feel heavy right now?"
- Mercury retrograde in user's 3rd house: "What conversations need revisiting?"
```

**Mood Tracking:**
- 5-point emoji scale (😔 😐 🙂 😊 😄)
- Custom tags: #work #relationships #health #creativity #finances
- Auto-suggested tags based on journal content (AI)

#### 1.2 AI Pattern Analysis
**Purpose:** Reveal correlations between life experiences and cosmic cycles.

**Analysis Types:**

1. **Emotional Patterns**
   - "You experience anxiety during Mercury retrograde 80% of the time"
   - "Full moons correlate with your highest energy entries"

2. **Behavioral Insights**
   - "You start new projects during waxing moons"
   - "Conflict themes appear during Mars-Pluto aspects"

3. **Growth Tracking**
   - Year-over-year comparisons during same transits
   - Personal evolution through recurring cosmic cycles

**Frequency:**
- Weekly summaries (automatic)
- Monthly deep-dive reports (premium)
- Yearly "Life Chapters" synthesis (premium)

#### 1.3 Transit Timeline
**Purpose:** Visual calendar showing personal astrological weather.

**Features:**
- Color-coded intensity levels
- Tap any date to see active transits
- Connect past journal entries to historical transits
- Upcoming significant aspects highlighted

**Views:**
- Month view (grid)
- Year view (annual wheel)
- Aspect detail view (exact dates/times)

### 2. Decision Support AI (Secondary)

#### 2.1 "Ask the Cosmos" Chat Interface
**Purpose:** AI advisor for timing major life decisions.

**Capabilities:**
- Career questions (job changes, negotiations, launches)
- Relationship guidance (proposals, difficult conversations)
- Financial timing (investments, purchases, contracts)
- Creative projects (launches, exhibitions)
- Personal goals (starting habits, travel)

**Response Structure:**
```
Question: "Should I accept this job offer?"

AI Response:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔮 Current Cosmic Climate

✓ FAVORABLE
  • Jupiter transiting your 10th house (career expansion)
  • Mars trine your Midheaven (confidence in action)

⚠ CAUTIONARY
  • Mercury retrograde starts Feb 12th
  • Contracts may require review

📋 RECOMMENDATION
Say yes in principle, but:
1. Review all details carefully
2. Delay signing until Feb 20th
3. Ask clarifying questions now

🎯 OPTIMAL TIMING
Feb 20-25: Best window for commitment
━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Ask Follow-up] [Save This Insight]
```

**Gemini Prompt Template:**
```
You are Lumina, a wise astrology advisor with a modern, grounded tone.

USER BIRTH CHART:
{full natal chart data}

CURRENT TRANSITS:
{current planetary positions + aspects to user's chart}

RECENT CONTEXT:
{last 3 journal entries + saved insights}

USER QUESTION:
"{user's question}"

Provide:
1. Direct answer (yes/no/wait when applicable)
2. Astrological reasoning (2-3 key factors)
3. Practical recommendation
4. Optimal timing window if relevant

Tone: Warm, insightful, modern (avoid mystical fluff)
Length: 150-200 words max
```

#### 2.2 Quick Decision Cards
**Purpose:** Rapid yes/no/wait guidance for minor decisions.

**UI Flow:**
1. User swipes card with question
2. AI provides immediate verdict with reasoning
3. Can tap to expand for full explanation
4. Save important decisions to revisit

### 3. Quick Daily Guidance (Hook)

#### 3.1 Morning Briefing
**Purpose:** Start the day informed about cosmic energy.

**Dashboard Components:**

```
┌─────────────────────────────────────┐
│  ☀️ Good Morning, Sarah!            │
│  February 9, 2026 • Monday          │
│  Moon in Libra ⚖️ (Waning Gibbous)  │
├─────────────────────────────────────┤
│  ⭐ TODAY'S ENERGY: ★★★★☆           │
│                                     │
│  🎯 DAILY FOCUS                     │
│  Seek balance in conversations.     │
│  Your communication planet is       │
│  harmonizing with Saturn - patience │
│  in discussions yields results.     │
├─────────────────────────────────────┤
│  ⚡ ENERGY FORECAST                 │
│  Morning:   ████████░░ High         │
│  Afternoon: █████░░░░░ Medium       │
│  Evening:   ███████░░░ Good         │
├─────────────────────────────────────┤
│  💫 FAVORS TODAY                    │
│  ✓ Important conversations          │
│  ✓ Creative collaboration           │
│  ✓ Financial planning               │
│                                     │
│  ⚠️ BE MINDFUL OF                   │
│  ✗ Impulsive decisions              │
│  ✗ Starting conflicts               │
├─────────────────────────────────────┤
│  🌈 LUCKY COLOR: Soft Blue          │
│  🔢 LUCKY NUMBER: 7                 │
├─────────────────────────────────────┤
│  [📝 Write Entry] [💬 Ask AI]       │
└─────────────────────────────────────┘
```

**Generation Frequency:** Updated daily at 5 AM local time

#### 3.2 Smart Cosmic Alerts
**Purpose:** Proactive notifications for significant astrological events.

**Alert Types:**

1. **Personal Transits** (High Priority)
   - Exact aspects to natal planets
   - Transits entering/leaving houses
   - Retrogrades affecting user's chart
   - Returns (Solar, Lunar, Saturn, Jupiter)

2. **Cosmic Events** (Medium Priority)
   - New Moons / Full Moons
   - Mercury/Venus/Mars retrogrades
   - Eclipses
   - Major planetary aspects

3. **Pattern Reminders** (Low Priority)
   - "Last time this transit occurred, you wrote about..."
   - "This is similar to the energy in March 2024"

**Alert Timing:**
- 3 days before (preparation)
- Day of (awareness)
- Day after (reflection prompt)

**Notification Copy Examples:**
```
⚡ "Mars enters your 7th house tomorrow - relationship dynamics may intensify for the next 6 weeks"

🌑 "New Moon in your 2nd house in 3 days - ideal time to set financial intentions"

☿️ "Mercury retrograde ends tomorrow - green light for signing contracts"

🎂 "Your solar return is in 7 days - perfect time to set intentions for your new year"
```

---

## Technical Architecture

### Tech Stack Overview

```
┌─────────────────────────────────────────────────────┐
│                  REACT NATIVE APP                   │
│                   (Expo Framework)                  │
├─────────────────────────────────────────────────────┤
│  UI LAYER                                           │
│  ├── Expo Router (file-based navigation)           │
│  ├── React Native Reanimated 3 (animations)        │
│  ├── React Native SVG + Victory (charts)           │
│  └── NativeWind (Tailwind for React Native)        │
├─────────────────────────────────────────────────────┤
│  STATE MANAGEMENT                                   │
│  └── Zustand (lightweight, TypeScript-first)       │
├─────────────────────────────────────────────────────┤
│  DATA LAYER                                         │
│  ├── AsyncStorage (user preferences)               │
│  ├── Expo SQLite (journal entries, local data)     │
│  └── Supabase (optional cloud sync, auth)          │
├─────────────────────────────────────────────────────┤
│  BUSINESS LOGIC                                     │
│  ├── Astronomia.js (birth chart calculations)      │
│  ├── Swiss Ephemeris (transit calculations)        │
│  └── Date-fns (date utilities)                     │
├─────────────────────────────────────────────────────┤
│  API INTEGRATION                                    │
│  ├── Google Gemini API (AI features)               │
│  ├── Expo Notifications (push alerts)              │
│  └── RevenueCat (in-app purchases)                 │
└─────────────────────────────────────────────────────┘
```

### Project Structure

```
lumina/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx             # Home dashboard
│   │   ├── journal.tsx           # Journal list & entry
│   │   ├── ask.tsx               # AI chat interface
│   │   ├── chart.tsx             # Birth chart viewer
│   │   └── calendar.tsx          # Transit calendar
│   ├── (modals)/                 # Modal screens
│   │   ├── journal-entry.tsx     # Single journal entry
│   │   ├── prompt.tsx            # Daily prompt details
│   │   └── settings.tsx          # User settings
│   ├── onboarding.tsx            # First-time user flow
│   ├── _layout.tsx               # Root layout
│   └── +not-found.tsx            # 404 screen
│
├── components/                   # Reusable components
│   ├── ui/                       # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Pill.tsx
│   ├── journal/                  # Journal-specific
│   │   ├── JournalCard.tsx
│   │   ├── MoodSelector.tsx
│   │   ├── TagInput.tsx
│   │   └── EntryEditor.tsx
│   ├── chart/                    # Chart visualizations
│   │   ├── BirthChartWheel.tsx
│   │   ├── AspectTable.tsx
│   │   ├── PlanetList.tsx
│   │   └── HouseOverlay.tsx
│   ├── chat/                     # AI chat components
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   └── SavedInsights.tsx
│   ├── calendar/                 # Transit calendar
│   │   ├── MonthView.tsx
│   │   ├── YearWheel.tsx
│   │   └── AspectDetail.tsx
│   └── home/                     # Dashboard widgets
│       ├── DailyBriefing.tsx
│       ├── EnergyForecast.tsx
│       ├── QuickActions.tsx
│       └── ActiveAlerts.tsx
│
├── services/                     # Business logic
│   ├── gemini/
│   │   ├── client.ts             # API client setup
│   │   ├── prompts.ts            # Prompt templates
│   │   ├── journal.ts            # Journal AI features
│   │   ├── chat.ts               # Decision support
│   │   └── briefing.ts           # Daily briefing
│   ├── astrology/
│   │   ├── birthChart.ts         # Chart calculations
│   │   ├── transits.ts           # Current transits
│   │   ├── aspects.ts            # Aspect calculations
│   │   ├── houses.ts             # House system
│   │   └── interpretations.ts    # Text descriptions
│   ├── notifications/
│   │   ├── scheduler.ts          # Schedule alerts
│   │   ├── triggers.ts           # Transit-based triggers
│   │   └── permissions.ts        # Push permissions
│   └── database/
│       ├── schema.ts             # SQLite schema
│       ├── journal.ts            # Journal CRUD
│       ├── chat.ts               # Chat history
│       └── sync.ts               # Cloud sync logic
│
├── stores/                       # Zustand state
│   ├── userStore.ts              # User profile & birth data
│   ├── journalStore.ts           # Journal state
│   ├── chatStore.ts              # Chat history
│   ├── transitStore.ts           # Cached transits
│   └── settingsStore.ts          # App settings
│
├── utils/                        # Helpers
│   ├── dates.ts                  # Date formatting
│   ├── zodiac.ts                 # Zodiac utilities
│   ├── formatting.ts             # Text formatting
│   └── validators.ts             # Input validation
│
├── constants/                    # Static data
│   ├── zodiac.ts                 # Signs, symbols
│   ├── planets.ts                # Planet data
│   ├── houses.ts                 # House meanings
│   ├── aspects.ts                # Aspect definitions
│   └── theme.ts                  # Design tokens
│
├── types/                        # TypeScript definitions
│   ├── astrology.ts              # Chart types
│   ├── journal.ts                # Journal types
│   ├── chat.ts                   # Chat types
│   └── index.ts                  # Main exports
│
├── assets/                       # Static assets
│   ├── images/
│   ├── fonts/
│   └── icons/
│
├── scripts/                      # Build/dev scripts
│   └── generateEphemeris.js      # Pre-compute ephemeris
│
└── config/                       # Configuration
    ├── env.ts                    # Environment variables
    └── features.ts               # Feature flags
```

---

## Data Models

### TypeScript Definitions

#### User Profile
```typescript
interface UserProfile {
  id: string;
  createdAt: Date;
  email?: string;
  displayName: string;
  
  // Birth data
  birthDate: Date;
  birthTime: string; // HH:MM format
  birthLocation: {
    latitude: number;
    longitude: number;
    timezone: string;
    city: string;
    country: string;
  };
  
  // Calculated at registration
  birthChart: BirthChart;
  
  // Settings
  preferences: {
    notifications: {
      dailyBriefing: boolean;
      transitAlerts: boolean;
      journalReminders: boolean;
      preferredTime: string; // HH:MM for morning briefing
    };
    privacy: {
      cloudSync: boolean;
      localOnly: boolean;
      encryptJournal: boolean;
    };
    theme: 'light' | 'dark' | 'auto';
  };
  
  // Subscription
  subscription: {
    tier: 'free' | 'seeker' | 'sage';
    validUntil?: Date;
  };
}
```

#### Birth Chart
```typescript
interface BirthChart {
  // Personal planets
  sun: PlanetPlacement;
  moon: PlanetPlacement;
  mercury: PlanetPlacement;
  venus: PlanetPlacement;
  mars: PlanetPlacement;
  
  // Social planets
  jupiter: PlanetPlacement;
  saturn: PlanetPlacement;
  
  // Outer planets
  uranus: PlanetPlacement;
  neptune: PlanetPlacement;
  pluto: PlanetPlacement;
  
  // Points
  northNode: PlanetPlacement;
  southNode: PlanetPlacement;
  ascendant: ZodiacPosition;
  midheaven: ZodiacPosition;
  
  // Houses (Placidus system)
  houses: [
    HouseCusp, // 1st house
    HouseCusp, // 2nd house
    // ... all 12 houses
  ];
  
  // Aspects
  aspects: Aspect[];
}

interface PlanetPlacement {
  sign: ZodiacSign;
  degree: number; // 0-29.999
  house: number; // 1-12
  retrograde: boolean;
}

interface ZodiacPosition {
  sign: ZodiacSign;
  degree: number;
}

interface HouseCusp {
  sign: ZodiacSign;
  degree: number;
}

interface Aspect {
  planet1: PlanetName;
  planet2: PlanetName;
  type: 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile' | 'quincunx';
  angle: number;
  orb: number; // Deviation from exact
  applying: boolean; // True if getting closer
}

type ZodiacSign = 
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer' 
  | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio' 
  | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

type PlanetName = 
  | 'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars'
  | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune' | 'Pluto'
  | 'North Node' | 'South Node';
```

#### Journal Entry
```typescript
interface JournalEntry {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Content
  prompt: string; // AI-generated prompt used
  content: string; // User's written reflection
  mood: 1 | 2 | 3 | 4 | 5; // 😔 to 😄
  tags: string[]; // ['work', 'relationships', etc.]
  
  // Context
  date: Date; // Day this entry is about
  transitsSnapshot: CurrentTransits; // Save transits for pattern analysis
  
  // Media (Phase 2)
  voiceRecording?: {
    uri: string;
    duration: number;
    transcription?: string;
  };
  photos?: string[]; // URIs
  
  // Privacy
  encrypted: boolean;
  syncedToCloud: boolean;
}

interface CurrentTransits {
  date: Date;
  moonSign: ZodiacSign;
  moonPhase: string;
  activeTransits: Transit[]; // Only significant ones
}

interface Transit {
  planet: PlanetName;
  type: 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';
  natalPlanet: PlanetName;
  exactDate: Date;
  orb: number;
}
```

#### AI Chat
```typescript
interface ChatConversation {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  title: string; // Auto-generated or user-edited
  messages: ChatMessage[];
  category?: 'career' | 'relationships' | 'finances' | 'personal' | 'creative';
  archived: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  
  // For assistant messages
  context?: {
    transitsUsed: CurrentTransits;
    relevantJournalEntries?: string[]; // IDs
  };
  
  // User can save important insights
  saved: boolean;
  savedAt?: Date;
}

interface SavedInsight {
  id: string;
  userId: string;
  messageId: string;
  conversationId: string;
  content: string;
  category: string;
  createdAt: Date;
  tags: string[];
}
```

#### Pattern Analysis
```typescript
interface PatternAnalysis {
  id: string;
  userId: string;
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  type: 'weekly' | 'monthly' | 'yearly';
  
  insights: {
    emotionalPatterns: EmotionalPattern[];
    behavioralPatterns: BehavioralPattern[];
    transitCorrelations: TransitCorrelation[];
    recommendations: string[];
  };
  
  // AI-generated summary
  summary: string;
  
  // User feedback
  accuracyRating?: 1 | 2 | 3 | 4 | 5;
  userNotes?: string;
}

interface EmotionalPattern {
  pattern: string; // "Anxiety during Mercury retrograde"
  frequency: number; // 0-100%
  confidence: number; // AI confidence score
  evidence: {
    journalEntryIds: string[];
    transitOccurrences: Date[];
  };
}

interface BehavioralPattern {
  behavior: string; // "Starting new projects"
  trigger: string; // "Waxing moon phases"
  frequency: number;
  evidence: {
    journalEntryIds: string[];
    dates: Date[];
  };
}

interface TransitCorrelation {
  transit: string; // "Mars square natal Pluto"
  theme: string; // "Conflict and power struggles"
  journalMentions: number;
  averageMood: number;
  keywords: string[];
}
```

### SQLite Database Schema

```sql
-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  email TEXT UNIQUE,
  display_name TEXT NOT NULL,
  birth_date INTEGER NOT NULL,
  birth_time TEXT NOT NULL,
  birth_latitude REAL NOT NULL,
  birth_longitude REAL NOT NULL,
  birth_timezone TEXT NOT NULL,
  birth_city TEXT,
  birth_country TEXT,
  birth_chart TEXT NOT NULL, -- JSON
  preferences TEXT NOT NULL, -- JSON
  subscription_tier TEXT DEFAULT 'free',
  subscription_valid_until INTEGER
);

-- Journal Entries
CREATE TABLE journal_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  date INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  content TEXT NOT NULL,
  mood INTEGER NOT NULL CHECK(mood >= 1 AND mood <= 5),
  tags TEXT NOT NULL, -- JSON array
  transits_snapshot TEXT NOT NULL, -- JSON
  voice_recording_uri TEXT,
  voice_duration INTEGER,
  voice_transcription TEXT,
  photos TEXT, -- JSON array of URIs
  encrypted INTEGER DEFAULT 0,
  synced_to_cloud INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_journal_user_date ON journal_entries(user_id, date DESC);
CREATE INDEX idx_journal_tags ON journal_entries(tags);

-- Chat Conversations
CREATE TABLE chat_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  archived INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chat Messages
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  context TEXT, -- JSON
  saved INTEGER DEFAULT 0,
  saved_at INTEGER,
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_conversation ON chat_messages(conversation_id, timestamp ASC);

-- Saved Insights
CREATE TABLE saved_insights (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  created_at INTEGER NOT NULL,
  tags TEXT, -- JSON array
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE
);

-- Pattern Analyses
CREATE TABLE pattern_analyses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  generated_at INTEGER NOT NULL,
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('weekly', 'monthly', 'yearly')),
  insights TEXT NOT NULL, -- JSON
  summary TEXT NOT NULL,
  accuracy_rating INTEGER CHECK(accuracy_rating >= 1 AND accuracy_rating <= 5),
  user_notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notification Schedule
CREATE TABLE notification_schedules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  scheduled_for INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data TEXT, -- JSON
  delivered INTEGER DEFAULT 0,
  delivered_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_scheduled ON notification_schedules(user_id, scheduled_for ASC, delivered);
```

---

## API Integration

### Gemini API Configuration

```typescript
// services/gemini/client.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getModel = (temperature: number = 0.7) => {
  return genAI.getGenerativeModel({
    model: 'gemini-pro',
    generationConfig: {
      temperature,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 1024,
    },
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE',
      },
    ],
  });
};
```

### Prompt Templates

#### Daily Briefing
```typescript
// services/gemini/briefing.ts
export const generateDailyBriefing = async (
  birthChart: BirthChart,
  currentTransits: CurrentTransits,
  date: Date
): Promise<DailyBriefing> => {
  const model = getModel(0.7);
  
  const prompt = `You are Lumina, a modern astrology advisor. Generate a personalized daily briefing.

USER BIRTH CHART:
Sun: ${birthChart.sun.sign} ${birthChart.sun.degree}°
Moon: ${birthChart.moon.sign} ${birthChart.moon.degree}°
Rising: ${birthChart.ascendant.sign} ${birthChart.ascendant.degree}°
[Include other relevant placements...]

TODAY'S TRANSITS (${date.toLocaleDateString()}):
Moon: ${currentTransits.moonSign} (${currentTransits.moonPhase})
Active Aspects:
${currentTransits.activeTransits.map(t => 
  `- ${t.planet} ${t.type} natal ${t.natalPlanet} (orb: ${t.orb}°)`
).join('\n')}

Generate a daily briefing with:
1. Energy rating (1-5 stars)
2. One-sentence daily theme/focus
3. Energy forecast (morning/afternoon/evening as High/Medium/Low)
4. 3 things favored today
5. 2 things to be mindful of
6. Lucky color and number
7. A reflection prompt for journaling

Format as JSON:
{
  "energyRating": 4,
  "theme": "Brief, actionable statement",
  "energyForecast": {
    "morning": "High",
    "afternoon": "Medium",
    "evening": "Good"
  },
  "favors": ["...", "...", "..."],
  "mindful": ["...", "..."],
  "luckyColor": "Soft Blue",
  "luckyNumber": 7,
  "journalPrompt": "Open-ended question..."
}

Tone: Warm, insightful, modern. Avoid mystical clichés.`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  
  // Parse JSON from response (handle markdown code blocks)
  const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || [null, response];
  return JSON.parse(jsonMatch[1]);
};
```

#### Journal Prompt Generation
```typescript
// services/gemini/journal.ts
export const generateJournalPrompt = async (
  birthChart: BirthChart,
  currentTransits: CurrentTransits,
  recentEntries: JournalEntry[]
): Promise<string> => {
  const model = getModel(0.8); // Higher temperature for creativity
  
  const recentThemes = recentEntries
    .slice(0, 3)
    .map(e => `- ${e.date.toLocaleDateString()}: "${e.content.substring(0, 100)}..."`)
    .join('\n');
  
  const prompt = `Generate a thoughtful journal prompt for today.

USER CONTEXT:
${birthChart.sun.sign} Sun, ${birthChart.moon.sign} Moon, ${birthChart.ascendant.sign} Rising

TODAY'S COSMIC WEATHER:
${currentTransits.activeTransits.map(t => 
  `${t.planet} ${t.type} natal ${t.natalPlanet}`
).join(', ')}

RECENT JOURNAL THEMES:
${recentThemes}

Create ONE insightful question that:
- Relates to today's transits
- Encourages self-reflection
- Avoids repetition of recent themes
- Is open-ended and thought-provoking
- Uses modern, accessible language

Return ONLY the prompt question (no preamble, no explanation).`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};
```

#### Pattern Analysis
```typescript
// services/gemini/patterns.ts
export const analyzePatterns = async (
  entries: JournalEntry[],
  birthChart: BirthChart
): Promise<PatternAnalysis['insights']> => {
  const model = getModel(0.6); // Lower temperature for analytical work
  
  const entriesText = entries.map(e => 
    `Date: ${e.date.toLocaleDateString()}
Mood: ${e.mood}/5
Content: ${e.content}
Active transits: ${e.transitsSnapshot.activeTransits.map(t => 
  `${t.planet} ${t.type} ${t.natalPlanet}`
).join(', ')}
---`
  ).join('\n\n');
  
  const prompt = `You are analyzing journal entries to find astrological patterns.

USER BIRTH CHART SUMMARY:
${formatChartSummary(birthChart)}

JOURNAL ENTRIES (${entries.length} entries):
${entriesText}

Analyze and identify:
1. EMOTIONAL PATTERNS: Recurring emotions during specific transits
2. BEHAVIORAL PATTERNS: Actions/themes aligned with astrological cycles
3. TRANSIT CORRELATIONS: How transits manifested in daily life

Return JSON:
{
  "emotionalPatterns": [
    {
      "pattern": "Brief description",
      "frequency": 75,
      "confidence": 85,
      "evidence": {
        "journalEntryIds": ["id1", "id2"],
        "transitOccurrences": ["2026-01-15", "2026-02-03"]
      }
    }
  ],
  "behavioralPatterns": [...],
  "transitCorrelations": [...],
  "recommendations": ["Actionable insight 1", "Actionable insight 2"]
}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || [null, response];
  return JSON.parse(jsonMatch[1]);
};
```

#### Decision Support Chat
```typescript
// services/gemini/chat.ts
export const getChatResponse = async (
  question: string,
  birthChart: BirthChart,
  currentTransits: CurrentTransits,
  conversationHistory: ChatMessage[],
  recentJournalEntries: JournalEntry[]
): Promise<string> => {
  const model = getModel(0.7);
  
  const history = conversationHistory
    .slice(-4) // Last 4 messages for context
    .map(m => `${m.role}: ${m.content}`)
    .join('\n\n');
  
  const journalContext = recentJournalEntries
    .slice(0, 3)
    .map(e => `${e.date.toLocaleDateString()}: ${e.content.substring(0, 150)}...`)
    .join('\n');
  
  const prompt = `You are Lumina, a wise and modern astrology advisor.

USER BIRTH CHART:
${formatChartSummary(birthChart)}

CURRENT TRANSITS:
${formatTransitsSummary(currentTransits)}

RECENT JOURNAL CONTEXT:
${journalContext}

CONVERSATION HISTORY:
${history}

USER QUESTION:
"${question}"

Provide guidance that:
- Addresses the question directly
- Uses astrological reasoning (2-3 key factors max)
- Offers practical recommendations
- Suggests optimal timing if relevant
- Maintains a warm, grounded tone

Length: 150-250 words
Style: Conversational but insightful, avoid mystical fluff

Your response:`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};
```

### API Usage Optimization

**Cost Management:**
- Cache daily briefings (regenerate only once per day)
- Batch weekly pattern analyses
- Use Gemini Flash (cheaper) for simple tasks
- Use Gemini Pro for complex analysis
- Set monthly budget alerts

**Rate Limiting:**
```typescript
// services/gemini/rateLimiter.ts
import PQueue from 'p-queue';

const queue = new PQueue({
  concurrency: 5,
  interval: 1000,
  intervalCap: 10, // Max 10 requests per second
});

export const rateLimitedGenerate = async (
  generateFn: () => Promise<any>
) => {
  return queue.add(generateFn);
};
```

---

## User Experience Flow

### Onboarding Flow

```
┌─────────────────────────────────────┐
│  SCREEN 1: Welcome                  │
│                                     │
│  ✨ Welcome to Lumina                │
│  Your cosmic self-discovery journey │
│                                     │
│  [Get Started]                      │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  SCREEN 2: Permission Explanation   │
│                                     │
│  📍 Location                        │
│  We need your birth location for    │
│  accurate chart calculations        │
│                                     │
│  🔔 Notifications                   │
│  Receive daily guidance & alerts    │
│                                     │
│  [Continue]                         │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  SCREEN 3: Birth Data               │
│                                     │
│  📅 Birth Date                      │
│  [Date Picker]                      │
│                                     │
│  ⏰ Birth Time                      │
│  [Time Picker]                      │
│  ⚠️ Unknown? We'll use noon         │
│                                     │
│  📍 Birth Location                  │
│  [City Search]                      │
│                                     │
│  [Calculate Chart] ← Loading...     │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  SCREEN 4: Chart Preview            │
│                                     │
│  🌟 Your Birth Chart                │
│  [Circular chart visualization]     │
│                                     │
│  ☀️ Sun in Taurus                   │
│  🌙 Moon in Scorpio                 │
│  ⬆️ Virgo Rising                    │
│                                     │
│  Tap to explore your chart →        │
│                                     │
│  [Start Using Lumina]               │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  SCREEN 5: Quick Tutorial           │
│                                     │
│  📝 Daily Journaling                │
│  Reflect on your experiences        │
│  [Swipe →]                          │
│                                     │
│  💬 Ask the Cosmos                  │
│  Get guidance on decisions          │
│  [Swipe →]                          │
│                                     │
│  📊 Pattern Discovery               │
│  AI reveals your cosmic cycles      │
│                                     │
│  [Let's Begin!]                     │
└─────────────────────────────────────┘
```

### Daily User Journey

**Morning (7-9 AM):**
1. Push notification: "☀️ Your cosmic forecast is ready"
2. User opens app → Home dashboard
3. Reads daily briefing (2 min)
4. Optionally writes journal entry (3-5 min)

**Midday (12-2 PM):**
1. User has a decision to make
2. Opens "Ask AI" tab
3. Types question, receives guidance (1-2 min)
4. Saves insight if valuable

**Evening (8-10 PM):**
1. User receives reflection reminder
2. Opens journal, sees today's prompt
3. Writes 200-300 words (5-7 min)
4. Selects mood and tags
5. Views brief preview of tomorrow

**Weekly (Sunday evening):**
1. Push notification: "📊 Your weekly patterns are ready"
2. User reviews pattern analysis
3. Reads AI-generated insights
4. Rates accuracy, adds notes

---

## Design System

### Color Palette

```typescript
// constants/theme.ts
export const colors = {
  // Primary colors
  primary: '#6C5CE7',        // Soft purple
  primaryDark: '#5849C8',    // Hover state
  primaryLight: '#A29BFE',   // Disabled state
  
  // Background
  background: '#0F0F1A',     // Deep space black
  surface: '#1A1A2E',        // Card background
  surfaceHover: '#252538',   // Interactive surface
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0C0',
  textTertiary: '#6B6B7B',
  
  // Accent
  accent: '#FFD93D',         // Gold highlights
  accentOrange: '#FF6B6B',   // Warnings
  accentGreen: '#4ECDC4',    // Success
  accentBlue: '#74B9FF',     // Info
  
  // Mood colors
  mood1: '#8B7E74',          // Very sad
  mood2: '#B0A199',          // Sad
  mood3: '#D4C5BA',          // Neutral
  mood4: '#A8D8EA',          // Happy
  mood5: '#6FDFDF',          // Very happy
  
  // Zodiac element colors
  fire: '#FF6B6B',           // Aries, Leo, Sagittarius
  earth: '#8BC34A',          // Taurus, Virgo, Capricorn
  air: '#74B9FF',            // Gemini, Libra, Aquarius
  water: '#6C5CE7',          // Cancer, Scorpio, Pisces
  
  // Semantic
  error: '#FF6B6B',
  warning: '#FFD93D',
  success: '#4ECDC4',
  info: '#74B9FF',
};
```

### Typography

```typescript
export const typography = {
  // Font families
  fontFamily: {
    heading: 'Inter',
    body: 'Inter',
    mono: 'SpaceGrotesk',
  },
  
  // Font sizes (React Native scale)
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  
  // Font weights
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};
```

### Spacing System

```typescript
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
};
```

### Component Styles

#### Card Component
```typescript
// components/ui/Card.tsx
const cardStyles = {
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5, // Android
  },
  glassmorphism: {
    backgroundColor: 'rgba(26, 26, 46, 0.7)',
    backdropFilter: 'blur(10px)', // Note: Limited support in RN
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
};
```

#### Button Variants
```typescript
// components/ui/Button.tsx
const buttonVariants = {
  primary: {
    backgroundColor: colors.primary,
    color: colors.textPrimary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    color: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
    color: colors.textSecondary,
  },
  danger: {
    backgroundColor: colors.error,
    color: colors.textPrimary,
  },
};
```

### Animations

```typescript
// Using React Native Reanimated 3
import { useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

// Card enter animation
export const useCardEnterAnimation = () => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  
  const animate = () => {
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withSpring(0, { damping: 15 });
  };
  
  return { opacity, translateY, animate };
};

// Micro-interactions
export const buttonPressAnimation = {
  scale: withSpring(0.95, { damping: 10 }),
};
```

---

## Astronomical Calculations

### Birth Chart Calculation

```typescript
// services/astrology/birthChart.ts
import { Astronomia } from 'astronomia';
import swisseph from 'swisseph';

export const calculateBirthChart = (
  birthDate: Date,
  birthTime: string, // "HH:MM"
  latitude: number,
  longitude: number,
  timezone: string
): BirthChart => {
  // Convert to Julian Day
  const [hours, minutes] = birthTime.split(':').map(Number);
  const jd = swisseph.julday(
    birthDate.getFullYear(),
    birthDate.getMonth() + 1,
    birthDate.getDate(),
    hours + minutes / 60,
    swisseph.SE_GREG_CAL
  );
  
  // Calculate planet positions
  const planets: PlanetPlacement[] = [];
  const planetIds = [
    swisseph.SE_SUN,
    swisseph.SE_MOON,
    swisseph.SE_MERCURY,
    swisseph.SE_VENUS,
    swisseph.SE_MARS,
    swisseph.SE_JUPITER,
    swisseph.SE_SATURN,
    swisseph.SE_URANUS,
    swisseph.SE_NEPTUNE,
    swisseph.SE_PLUTO,
    swisseph.SE_TRUE_NODE,
  ];
  
  planetIds.forEach(planetId => {
    const result = swisseph.calc_ut(jd, planetId, swisseph.SEFLG_SPEED);
    const longitude = result.longitude;
    const speed = result.longitudeSpeed;
    
    planets.push({
      sign: getZodiacSign(longitude),
      degree: longitude % 30,
      retrograde: speed < 0,
      house: 0, // Will be calculated with houses
    });
  });
  
  // Calculate houses (Placidus system)
  const houses = swisseph.houses(
    jd,
    latitude,
    longitude,
    'P' // Placidus
  );
  
  // Assign houses to planets
  planets.forEach(planet => {
    planet.house = getHouseForPlanet(planet, houses);
  });
  
  // Calculate aspects
  const aspects = calculateAspects(planets);
  
  return {
    sun: planets[0],
    moon: planets[1],
    mercury: planets[2],
    venus: planets[3],
    mars: planets[4],
    jupiter: planets[5],
    saturn: planets[6],
    uranus: planets[7],
    neptune: planets[8],
    pluto: planets[9],
    northNode: planets[10],
    southNode: {
      ...planets[10],
      degree: (planets[10].degree + 180) % 360,
    },
    ascendant: {
      sign: getZodiacSign(houses.ascendant),
      degree: houses.ascendant % 30,
    },
    midheaven: {
      sign: getZodiacSign(houses.mc),
      degree: houses.mc % 30,
    },
    houses: houses.cusps.map(cusp => ({
      sign: getZodiacSign(cusp),
      degree: cusp % 30,
    })),
    aspects,
  };
};

const getZodiacSign = (longitude: number): ZodiacSign => {
  const signs: ZodiacSign[] = [
    'Aries', 'Taurus', 'Gemini', 'Cancer',
    'Leo', 'Virgo', 'Libra', 'Scorpio',
    'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  return signs[Math.floor(longitude / 30)];
};

const calculateAspects = (planets: PlanetPlacement[]): Aspect[] => {
  const aspects: Aspect[] = [];
  const aspectDefinitions = [
    { type: 'conjunction', angle: 0, orb: 8 },
    { type: 'opposition', angle: 180, orb: 8 },
    { type: 'trine', angle: 120, orb: 8 },
    { type: 'square', angle: 90, orb: 7 },
    { type: 'sextile', angle: 60, orb: 6 },
    { type: 'quincunx', angle: 150, orb: 3 },
  ];
  
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const angle = Math.abs(planets[i].degree - planets[j].degree);
      const normalizedAngle = angle > 180 ? 360 - angle : angle;
      
      aspectDefinitions.forEach(def => {
        const difference = Math.abs(normalizedAngle - def.angle);
        if (difference <= def.orb) {
          aspects.push({
            planet1: getPlanetName(i),
            planet2: getPlanetName(j),
            type: def.type as any,
            angle: normalizedAngle,
            orb: difference,
            applying: planets[i].retrograde !== planets[j].retrograde,
          });
        }
      });
    }
  }
  
  return aspects;
};
```

### Transit Calculations

```typescript
// services/astrology/transits.ts
export const calculateCurrentTransits = (
  date: Date,
  birthChart: BirthChart
): CurrentTransits => {
  // Calculate current planetary positions
  const currentPositions = calculatePlanetaryPositions(date);
  
  // Find aspects between transiting planets and natal planets
  const activeTransits: Transit[] = [];
  
  currentPositions.forEach(transitingPlanet => {
    Object.entries(birthChart).forEach(([natalPlanetName, natalPlanet]) => {
      if (typeof natalPlanet === 'object' && 'degree' in natalPlanet) {
        const aspect = findAspect(
          transitingPlanet.degree,
          natalPlanet.degree
        );
        
        if (aspect && aspect.orb <= 3) { // Only tight orbs for transits
          activeTransits.push({
            planet: transitingPlanet.name,
            type: aspect.type,
            natalPlanet: natalPlanetName as PlanetName,
            exactDate: calculateExactDate(transitingPlanet, natalPlanet, aspect),
            orb: aspect.orb,
          });
        }
      }
    });
  });
  
  return {
    date,
    moonSign: currentPositions.find(p => p.name === 'Moon')!.sign,
    moonPhase: calculateMoonPhase(date),
    activeTransits,
  };
};

const calculateMoonPhase = (date: Date): string => {
  // Simplified moon phase calculation
  const phases = [
    'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
    'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'
  ];
  
  // Use astronomia or similar library for accurate calculation
  // This is pseudocode
  const lunation = calculateLunationCycle(date);
  const phaseIndex = Math.floor((lunation / 29.53) * 8) % 8;
  
  return phases[phaseIndex];
};
```

---

## Privacy & Security

### Data Privacy Strategy

**Three-Tier Privacy Model:**

1. **Local Only Mode** (Most Private)
   - All data stored on device only
   - Birth chart calculated locally
   - Journal entries encrypted with device key
   - No account required
   - No cloud backup

2. **Cloud Sync Mode** (Balanced)
   - Optional Supabase account
   - Journal entries encrypted end-to-end
   - Only user has decryption key
   - Birth chart synced (for multi-device)
   - Pattern analyses synced

3. **Full Cloud Mode** (Most Convenient)
   - Unencrypted journal (for AI analysis)
   - Full feature access
   - Multi-device sync
   - Account recovery possible

### Encryption Implementation

```typescript
// services/encryption.ts
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

// Generate encryption key (stored in secure enclave)
export const generateEncryptionKey = async (): Promise<string> => {
  const key = await Crypto.getRandomBytes(32);
  const keyString = Buffer.from(key).toString('base64');
  await SecureStore.setItemAsync('encryption_key', keyString);
  return keyString;
};

// Encrypt journal entry
export const encryptEntry = async (content: string): Promise<string> => {
  const key = await SecureStore.getItemAsync('encryption_key');
  if (!key) throw new Error('No encryption key found');
  
  const iv = await Crypto.getRandomBytes(16);
  const encrypted = await Crypto.encryptAsync(
    content,
    key,
    Buffer.from(iv).toString('base64')
  );
  
  return JSON.stringify({
    iv: Buffer.from(iv).toString('base64'),
    data: encrypted,
  });
};

// Decrypt journal entry
export const decryptEntry = async (encryptedData: string): Promise<string> => {
  const key = await SecureStore.getItemAsync('encryption_key');
  if (!key) throw new Error('No encryption key found');
  
  const { iv, data } = JSON.parse(encryptedData);
  const decrypted = await Crypto.decryptAsync(data, key, iv);
  
  return decrypted;
};
```

### GDPR Compliance

**User Rights Implementation:**

1. **Right to Access** - Export all user data
```typescript
export const exportUserData = async (userId: string): Promise<string> => {
  const userData = await db.getAllUserData(userId);
  const exportPackage = {
    profile: userData.profile,
    journalEntries: userData.entries,
    chatHistory: userData.chats,
    patternAnalyses: userData.patterns,
    exportedAt: new Date().toISOString(),
  };
  
  return JSON.stringify(exportPackage, null, 2);
};
```

2. **Right to Deletion** - Complete data wipe
```typescript
export const deleteUserAccount = async (userId: string): Promise<void> => {
  // Delete from local database
  await db.deleteUser(userId);
  
  // Delete from cloud (if synced)
  await supabase.from('users').delete().eq('id', userId);
  
  // Delete encryption keys
  await SecureStore.deleteItemAsync('encryption_key');
  
  // Clear all caches
  await AsyncStorage.clear();
};
```

3. **Right to Portability** - Data export in standard format

---

## Monetization Strategy

### Subscription Tiers

| Feature | Free | Seeker ($6/mo) | Sage ($12/mo) |
|---------|------|----------------|---------------|
| **Daily briefing** | ✓ | ✓ | ✓ |
| **Journal entries/month** | 7 | Unlimited | Unlimited |
| **Basic AI chat** | 10 msgs/mo | Unlimited | Unlimited |
| **Transit calendar** | 30 days | 1 year | 3 years |
| **Pattern analysis** | ✗ | Weekly | Daily |
| **Voice journaling** | ✗ | ✓ | ✓ |
| **Shadow work prompts** | ✗ | ✗ | ✓ |
| **Yearly reports** | ✗ | ✗ | ✓ |
| **Priority AI (faster)** | ✗ | ✗ | ✓ |
| **Export data** | ✗ | ✓ | ✓ |
| **Cloud sync** | ✗ | ✓ | ✓ |

### Pricing Rationale
- **Free tier:** Captures curious users, builds habit
- **Seeker ($6/mo):** Core value for committed users, covers AI costs
- **Sage ($12/mo):** Premium features for power users, profit margin

### RevenueCat Integration

```typescript
// services/subscriptions.ts
import Purchases from 'react-native-purchases';

export const configureRevenueCat = async () => {
  Purchases.configure({
    apiKey: process.env.REVENUECAT_API_KEY,
  });
};

export const getOfferings = async () => {
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages || [];
};

export const purchasePackage = async (pkg: PurchasesPackage) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    
    // Update user subscription in database
    await updateUserSubscription(customerInfo);
    
    return customerInfo;
  } catch (error) {
    if (error.userCancelled) {
      // User cancelled purchase
    } else {
      // Handle error
    }
    throw error;
  }
};

export const restorePurchases = async () => {
  const customerInfo = await Purchases.restorePurchases();
  await updateUserSubscription(customerInfo);
  return customerInfo;
};

export const checkSubscriptionStatus = async (): Promise<SubscriptionTier> => {
  const customerInfo = await Purchases.getCustomerInfo();
  
  if (customerInfo.entitlements.active['sage']) {
    return 'sage';
  } else if (customerInfo.entitlements.active['seeker']) {
    return 'seeker';
  } else {
    return 'free';
  }
};
```

---

## Development Roadmap

### Phase 1: MVP (Months 1-3)
**Goal:** Launch core features for 100 beta users

**Week 1-2: Setup**
- Initialize Expo project
- Set up development environment
- Configure TypeScript, ESLint
- Set up Supabase backend
- Configure Gemini API

**Week 3-4: Core Infrastructure**
- Implement birth chart calculations
- Set up SQLite database
- Build state management (Zustand)
- Create design system components

**Week 5-6: Onboarding & Auth**
- Birth data collection flow
- Chart calculation & display
- User profile creation
- Permission handling

**Week 7-8: Daily Briefing**
- Dashboard UI
- Gemini integration for briefings
- Notification system
- Transit calculations

**Week 9-10: Journal System**
- Journal entry UI
- Prompt generation (AI)
- Mood tracking & tags
- Local storage

**Week 11-12: Testing & Polish**
- Beta testing with 20 users
- Bug fixes
- Performance optimization
- App Store submission

### Phase 2: Growth Features (Months 4-6)
- AI chat (decision support)
- Pattern analysis (weekly)
- Transit calendar
- Cloud sync (Supabase)
- Voice journaling

### Phase 3: Advanced Features (Months 7-9)
- Shadow work prompts
- Life chapters analysis
- Yearly reports
- Social features (optional sharing)
- Apple Watch companion app

### Phase 4: Scale & Monetization (Months 10-12)
- Subscription system (RevenueCat)
- Advanced analytics
- Referral program
- Partnership integrations
- Marketing & growth

---

## Success Metrics & KPIs

### Product Metrics
- **Activation:** % users who complete onboarding
- **Engagement:** DAU/MAU ratio (target: 30%)
- **Retention:** D1, D7, D30 retention rates
- **Journal usage:** Entries per active user per week
- **AI usage:** Chat messages per user per week
- **Session duration:** Average time in app per session

### Business Metrics
- **Conversion rate:** Free → Paid (target: 15%)
- **Churn rate:** Monthly subscription churn (target: <5%)
- **LTV:** Lifetime value per user
- **CAC:** Customer acquisition cost
- **Revenue:** MRR, ARR growth

### Quality Metrics
- **Crash-free rate:** >99.5%
- **App rating:** >4.5 stars
- **Pattern accuracy:** User-rated accuracy >70%
- **Response time:** AI responses <3 seconds

---

## Appendices

### A. Glossary of Astrological Terms

**Aspect:** Angular relationship between two planets (e.g., 90° square)
**Birth Chart (Natal Chart):** Snapshot of planetary positions at birth
**House:** 12 divisions of the sky, representing life areas
**Orb:** Allowed deviation from exact aspect angle
**Retrograde:** Apparent backward motion of planet
**Transit:** Current planet's position relative to natal chart
**Synastry:** Compatibility analysis between two charts

### B. Third-Party Services

| Service | Purpose | Cost |
|---------|---------|------|
| Google Gemini API | AI features | $0.002/1K tokens |
| Supabase | Cloud database & auth | Free tier + $25/mo |
| RevenueCat | Subscription management | 1% of revenue |
| Sentry | Error tracking | Free tier |
| Mixpanel | Analytics | Free tier |

### C. Testing Checklist

**Before Launch:**
- [ ] Birth chart calculation accuracy (test 20 known charts)
- [ ] All zodiac signs render correctly
- [ ] Retrograde detection works
- [ ] Aspect calculations accurate (within 1° orb)
- [ ] House system (Placidus) validated
- [ ] Gemini API error handling
- [ ] Offline mode functional
- [ ] Encryption/decryption works
- [ ] Notification delivery reliable
- [ ] Subscription purchase flow
- [ ] Data export functionality
- [ ] Cross-platform (iOS + Android)

---

**Document Version:** 1.0
**Last Updated:** February 2026
**Author:** Product Team
**Status:** Ready for Development

