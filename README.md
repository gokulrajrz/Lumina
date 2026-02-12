# Lumina 🌌

A premium, AI-powered cosmic guidance and journaling application.

## 🚀 Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini (via `google-generativeai`)
- **Auth**: JWT with ES256 asymmetric verification
- **Infrastructure**: Robust rate limiting, structured logging, and automated health checks

### Frontend
- **Framework**: React Native with Expo (Expo Router)
- **Styling**: Glassmorphism aesthetic with Vanilla CSS/StyleSheet
- **Animations**: React Native Reanimated
- **State Management**: Zustand
- **Storage**: AsyncStorage for offline persistence

## 🛠️ Development Setup

### Backend
1. `cd backend`
2. `python -m venv venv`
3. `source venv/bin/activate`
4. `pip install -r requirements.txt`
5. Create `.env` from `.env.example`
6. `python main.py`

### Frontend
1. `cd frontend`
2. `npm install`
3. Create `.env` with backend URL
4. `npm start`

## ✨ Features
- **Daily Briefing**: Personal cosmic insights based on your birth chart.
- **AI Journaling**: Reflective prompts and sentiment insights.
- **Astrology Engine**: Precise calculations of planetary placements.
- **Chat**: Intelligent celestial guidance.

---
*Created with focus on industrial-grade performance and aesthetic excellence.*
