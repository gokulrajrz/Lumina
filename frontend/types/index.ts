export type ZodiacSign =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer'
  | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio'
  | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export type PlanetName =
  | 'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars'
  | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune' | 'Pluto'
  | 'North Node' | 'South Node';

export interface PlanetPlacement {
  sign: ZodiacSign;
  degree: number;
  absolute_degree: number;
  house: number;
  retrograde: boolean;
}

export interface BirthChart {
  planets: Record<PlanetName, PlanetPlacement>;
  ascendant: { sign: ZodiacSign; degree: number };
  midheaven: { sign: ZodiacSign; degree: number };
  houses: Array<{ house: number; sign: ZodiacSign; degree: number; absolute_degree: number }>;
  aspects: Aspect[];
}

export interface Aspect {
  planet1: PlanetName;
  planet2: PlanetName;
  type: 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';
  angle: number;
  orb: number;
}

export interface JournalEntry {
  entry_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  prompt: string;
  content: string;
  mood: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  ai_insight?: string;
  audio_url?: string;
  transits_snapshot: CurrentTransits;
}

export interface CurrentTransits {
  date: string;
  moon_sign: ZodiacSign;
  moon_phase: string;
  active_transits: Transit[];
}

export interface Transit {
  planet: PlanetName;
  type: 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';
  natal_planet: PlanetName;
  orb: number;
}

export interface UserProfile {
  user_id: string;
  supabase_id?: string;
  display_name: string;
  email?: string;
  birth_date: string;
  birth_time: string;
  latitude: number;
  longitude: number;
  city: string;
  timezone_str: string;
  birth_chart: BirthChart;
  created_at: string;
  preferences: {
    notifications: {
      daily_briefing: boolean;
      transit_alerts: boolean;
      preferred_time: string;
    };
    theme: 'light' | 'dark' | 'auto';
  };
}

export interface ChatMessage {
  message_id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  saved: boolean;
  created_at: string;
}

export interface DailyBriefing {
  energyRating: number;
  theme: string;
  energyForecast: {
    morning: string;
    afternoon: string;
    evening: string;
  };
  favors: string[];
  mindful: string[];
  luckyColor: string;
  luckyNumber: number;
  journalPrompt: string;
  transits?: CurrentTransits;
}
