---
description: How to start the Lumina application (backend + frontend)
---

# Start Lumina

## Prerequisites
- Python 3.12+ with virtualenv set up in `backend/venv`
- Node.js 20+ with dependencies installed in `frontend/node_modules`
- `.env` files configured in both `backend/` and `frontend/` (see `.env.example` files)
- Supabase schema applied (run `supabase_schema.sql` in Supabase Dashboard → SQL Editor)

## Steps

// turbo-all

1. Start the backend API server:
```bash
cd /mnt/E230EB0F30EAEA0D/Projects/react-native/Lumina/backend && source venv/bin/activate && python3 main.py
```
This runs the FastAPI server on `http://localhost:8001`.

2. In a **new terminal**, start the Expo frontend dev server:
```bash
cd /mnt/E230EB0F30EAEA0D/Projects/react-native/Lumina/frontend && npx expo start
```
Then press `a` for Android, `i` for iOS, or scan the QR code with Expo Go.

## Notes
- Both servers must run simultaneously
- If testing on a physical device, update `EXPO_PUBLIC_BACKEND_URL` in `frontend/.env` to your machine's local IP (e.g., `http://192.168.1.x:8001`)
- Backend Swagger docs are available at `http://localhost:8001/docs` when `DEBUG=true`
