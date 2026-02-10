# Lumina - Quick Start

## ✅ Status: Running

### Backend API
- **URL**: http://localhost:8001
- **Status**: ✅ Running
- **Health Check**: http://localhost:8001/api/health

### Frontend App
- **Expo Dev Server**: ✅ Running on port 8081
- **Web Preview**: http://localhost:8081
- **Mobile**: Scan QR code with Expo Go app

## 🚀 Access the App

### Option 1: Web Browser (Quickest)
Open: http://localhost:8081

### Option 2: Mobile Device (Best Experience)
1. Install "Expo Go" app from App Store or Google Play
2. Scan the QR code shown in the terminal
3. App will load on your device

### Option 3: Tunnel URL (Remote Access)
https://lumina-cosmic.preview.emergentagent.com

## 📱 Test Flow

1. **Sign Up**
   - Email: test@example.com
   - Password: password123

2. **Enter Birth Data**
   - Name: Test User
   - Birth Date: 1990-01-15
   - Birth Time: 14:30
   - City: New York
   - Latitude: 40.7128
   - Longitude: -74.0060

3. **Explore Features**
   - Home: Daily AI briefing
   - Journal: Write entries
   - Ask AI: Chat about astrology
   - Chart: View birth chart

## 🛠️ Development Commands

### Frontend
```bash
cd frontend
yarn start          # Start dev server
yarn android        # Run on Android
yarn ios            # Run on iOS
yarn web            # Open in browser
```

### Backend
```bash
cd backend
./venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

## 📊 Tech Stack

- **Frontend**: React Native + Expo + TypeScript
- **State**: Zustand
- **Backend**: FastAPI + Python
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase
- **AI**: Google Gemini (gemini-2.0-flash-exp)
- **Astrology**: Swiss Ephemeris

## 🎯 Features Implemented

✅ Supabase authentication
✅ Birth chart calculation (Swiss Ephemeris)
✅ AI daily briefings (Gemini)
✅ Journal with AI prompts
✅ AI chat for guidance
✅ Transit calculations
✅ Full natal chart display
✅ Mood tracking
✅ Conversation history

## 📝 API Endpoints

- `POST /api/users` - Create user
- `GET /api/briefing/{user_id}` - Daily briefing
- `POST /api/journal/{user_id}` - Create entry
- `POST /api/chat/{user_id}` - Send message
- `GET /api/astrology/transits/{user_id}` - Get transits

## 🔑 Credentials

**Gemini API Key**: AIzaSyDNTj2q_4whKcL_BCzIBZgxEMdvOVHrte0

**Supabase**:
- URL: https://wjzkjdzunxbhrskinomm.supabase.co
- Key: sb_publishable_Pwg4YNkmu80yLYJUpkJK_g__tYitKri

## 🐛 Troubleshooting

**Backend not responding?**
```bash
curl http://localhost:8001/api/health
```

**Frontend not loading?**
```bash
cd frontend
rm -rf .expo node_modules/.cache
yarn start
```

**Check logs**
```bash
tail -f /tmp/backend.log
```

## 📖 Full Documentation

See `SETUP.md` for complete setup guide and architecture details.
