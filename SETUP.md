# Lumina - Setup Guide

## Backend Setup (Already Running)

The FastAPI backend is running on port 8001 with:
- Swiss Ephemeris for astrology calculations
- Google Gemini AI (gemini-2.0-flash-exp)
- Supabase for database and auth
- PostgreSQL via Supabase

### Backend API Endpoints

- `GET /api/health` - Health check
- `POST /api/users` - Create user profile
- `GET /api/users/{user_id}` - Get user profile
- `GET /api/users/by-supabase/{supabase_id}` - Get user by Supabase ID
- `GET /api/briefing/{user_id}` - Get daily AI briefing
- `GET /api/astrology/transits/{user_id}` - Get current transits
- `POST /api/journal/{user_id}` - Create journal entry
- `GET /api/journal/{user_id}` - Get journal entries
- `GET /api/journal/prompt/{user_id}` - Get AI journal prompt
- `POST /api/chat/{user_id}` - Send chat message
- `GET /api/chat/history/{conversation_id}` - Get chat history

## Frontend Setup

### Start Development Server

```bash
cd frontend
yarn start
```

This will start Expo with:
- Web preview at http://localhost:8081
- QR code for mobile device testing
- Tunnel URL: https://lumina-cosmic.preview.emergentagent.com

### Run on Device

1. Install Expo Go app on your iOS/Android device
2. Scan the QR code from the terminal
3. App will load on your device

### Environment Variables

Already configured in `frontend/.env`:
- `EXPO_PUBLIC_BACKEND_URL` - Backend API URL
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key

## Features Implemented

### ✅ Core Features (MVP)

1. **Onboarding Flow**
   - Supabase email/password authentication
   - Birth data collection (date, time, location)
   - Automatic birth chart calculation

2. **Birth Chart System**
   - Full natal chart calculation using Swiss Ephemeris
   - Planetary placements (all 10 planets + nodes)
   - House system (Placidus)
   - Major aspects (conjunction, opposition, trine, square, sextile)
   - Visual display of chart data

3. **Daily Briefing Dashboard**
   - AI-generated daily guidance (Gemini)
   - Energy rating (1-5 stars)
   - Energy forecast (morning/afternoon/evening)
   - Things favored today
   - Things to be mindful of
   - Lucky color & number
   - Current moon sign & phase
   - Active transits

4. **Journal System**
   - Daily journal entries with AI prompts
   - Mood selector (1-5 scale)
   - Tag system support
   - Entry history with dates
   - Transits snapshot saved with each entry

5. **AI Chat (Decision Support)**
   - Chat interface with Gemini AI
   - Context-aware responses (user's chart + current transits)
   - Conversation history
   - Multiple conversation support

6. **Transit Calculations**
   - Real-time planetary positions
   - Comparison with natal chart
   - Active transit identification
   - Orb calculations

## App Structure

```
frontend/
├── app/
│   ├── _layout.tsx              # Root layout with auth routing
│   ├── onboarding.tsx           # Onboarding flow
│   └── (tabs)/
│       ├── _layout.tsx          # Tab navigation
│       ├── index.tsx            # Home dashboard
│       ├── journal.tsx          # Journal screen
│       ├── ask.tsx              # AI chat
│       └── chart.tsx            # Birth chart
├── components/
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Input.tsx
├── stores/
│   ├── userStore.ts             # User profile state
│   ├── journalStore.ts          # Journal entries state
│   └── chatStore.ts             # Chat messages state
├── services/
│   ├── api.ts                   # Backend API client
│   └── supabase.ts              # Supabase client
├── constants/
│   ├── theme.ts                 # Design system
│   └── zodiac.ts                # Astrology constants
└── types/
    └── index.ts                 # TypeScript types

backend/
└── server.py                    # FastAPI server with all endpoints
```

## Testing the App

### 1. Create an Account
- Open the app
- Enter email and password
- Click "Continue"

### 2. Enter Birth Data
- Display name
- Birth date (YYYY-MM-DD format, e.g., 1990-01-15)
- Birth time (HH:MM format, e.g., 14:30)
- Birth city
- Latitude (e.g., 40.7128 for NYC)
- Longitude (e.g., -74.0060 for NYC)

### 3. Explore Features
- **Home**: View your daily briefing with AI guidance
- **Journal**: Write entries with AI prompts
- **Ask AI**: Chat about your chart or life decisions
- **Chart**: View your complete birth chart

## Known Limitations (MVP)

- No push notifications yet (UI ready, needs device setup)
- No location autocomplete (manual lat/long entry)
- No chart wheel visualization (data display only)
- No pattern analysis or weekly reports
- No social features

## Next Steps (Post-MVP)

1. Add location autocomplete with geocoding
2. Implement push notifications
3. Add visual chart wheel with SVG
4. Pattern analysis (weekly AI reports)
5. Transit calendar view
6. Voice journaling
7. Cloud sync optimization
8. Subscription system

## Troubleshooting

### Backend Issues
```bash
# Check backend logs
tail -f /tmp/backend.log

# Restart backend
pkill -f uvicorn
cd backend && ./venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 &
```

### Frontend Issues
```bash
# Clear cache
cd frontend
rm -rf .expo node_modules/.cache

# Reinstall
yarn install
yarn start
```

### Database Issues
```bash
# Check Supabase connection in backend logs
# Look for "Supabase client initialized" message
```

## API Keys Used

- **Gemini API**: AIzaSyDNTj2q_4whKcL_BCzIBZgxEMdvOVHrte0
- **Supabase URL**: https://wjzkjdzunxbhrskinomm.supabase.co
- **Supabase Key**: sb_publishable_Pwg4YNkmu80yLYJUpkJK_g__tYitKri

## Support

For issues or questions, check:
- Backend logs: `/tmp/backend.log`
- Frontend console in Expo Dev Tools
- Supabase logs: Check Supabase dashboard
