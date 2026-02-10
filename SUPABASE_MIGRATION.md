# Lumina - Complete Supabase Migration Guide

## Overview
This guide migrates Lumina from MongoDB to Supabase (PostgreSQL) completely.

## Prerequisites
- Supabase account and project
- Access to Supabase Dashboard

---

## Step 1: Create Supabase Tables

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire content of `supabase_schema.sql`
4. Click **Run** to execute

This will create:
- ✅ 3 tables (users, journal_entries, chat_messages)
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Functions and triggers
- ✅ Proper permissions

---

## Step 2: Get Service Role Key

1. Go to Supabase Dashboard → **Settings** → **API**
2. Find the **`service_role`** key (NOT the anon key)
3. Copy the secret key (starts with `eyJ...`)
4. Update `backend/.env`:

```env
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Important**: Keep this key secret! It bypasses RLS.

---

## Step 3: Install Dependencies

```bash
cd backend

# Install Supabase client
./venv/bin/pip install supabase==2.27.3

# Or install all minimal dependencies
./venv/bin/pip install -r requirements-supabase.txt
```

---

## Step 4: Restart Backend

```bash
# Kill existing backend
pkill -9 -f uvicorn

# Start with Supabase
cd backend
./venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

---

## Step 5: Test the Migration

### Test 1: Health Check
```bash
curl http://localhost:8001/api/health
# Expected: {"status":"healthy"}
```

### Test 2: Create User (via app)
1. Open the app
2. Sign up with a new account
3. Complete onboarding
4. Check Supabase Dashboard → **Table Editor** → `users` table
5. You should see your new user!

### Test 3: Create Journal Entry
1. Go to Journal tab
2. Create a new entry
3. Check Supabase Dashboard → `journal_entries` table

### Test 4: AI Chat
1. Go to Ask AI tab
2. Send a message
3. Check Supabase Dashboard → `chat_messages` table

---

## Step 6: Verify in Supabase Dashboard

Go to **Table Editor** and check:

### Users Table
- Should have columns: user_id, supabase_id, display_name, birth_chart (JSONB), etc.
- Check that birth_chart contains proper JSON data

### Journal Entries Table
- Should have: entry_id, user_id, content, mood, tags, transits_snapshot

### Chat Messages Table
- Should have: message_id, conversation_id, role, content

---

## What Changed?

### Removed
- ❌ MongoDB (`motor`, `pymongo`)
- ❌ MongoDB connection code
- ❌ `MONGO_URL` and `DB_NAME` env vars

### Added
- ✅ Supabase client (`supabase-py`)
- ✅ `services/supabase_db.py` - Database layer
- ✅ `SUPABASE_SERVICE_KEY` env var
- ✅ MongoDB-like interface for easy migration

### Backend Code
- No changes needed to API endpoints!
- Database layer (`services/supabase_db.py`) provides MongoDB-compatible interface
- All `db.users.find_one()` calls work the same way

---

## Benefits of Supabase

✅ **No database server to manage** - Fully hosted
✅ **Built-in authentication** - Already using it
✅ **Row Level Security** - Better security
✅ **Real-time subscriptions** - Can add live updates
✅ **Automatic backups** - Point-in-time recovery
✅ **Better scaling** - Handles more users
✅ **Free tier** - 500MB database, 2GB bandwidth/month

---

## Troubleshooting

### Error: "SUPABASE_SERVICE_KEY must be set"
- Make sure you added the service role key to `backend/.env`
- Restart the backend server

### Error: "relation 'users' does not exist"
- Run the SQL schema in Supabase SQL Editor
- Make sure you're in the correct project

### Error: "Failed to create user"
- Check Supabase logs: Dashboard → **Logs** → **Postgres Logs**
- Verify RLS policies are set correctly

### Can't see data in tables
- Check you're looking at the right Supabase project
- Verify the service role key is correct
- Check backend logs: `tail -f /tmp/backend.log`

---

## Rollback (If Needed)

If something goes wrong, you can rollback:

1. Stop the backend
2. Restore `backend/.env`:
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="lumina_db"
```
3. Restore MongoDB imports in `server.py`
4. Restart backend

---

## Production Checklist

Before going to production:

- [ ] Run SQL schema in Supabase
- [ ] Add service role key to environment
- [ ] Test all API endpoints
- [ ] Verify RLS policies work
- [ ] Set up Supabase backups
- [ ] Monitor Supabase usage
- [ ] Set up alerts for errors
- [ ] Document any custom queries

---

## Support

If you encounter issues:

1. Check Supabase logs (Dashboard → Logs)
2. Check backend logs (`tail -f /tmp/backend.log`)
3. Verify service role key is correct
4. Test SQL queries directly in Supabase SQL Editor

---

## Summary

You've successfully migrated from MongoDB to Supabase! 🎉

**What's working:**
- ✅ User authentication (Supabase Auth)
- ✅ User profiles (PostgreSQL)
- ✅ Journal entries (PostgreSQL)
- ✅ AI chat (PostgreSQL)
- ✅ Birth chart calculations (Backend)
- ✅ AI briefings (Gemini API)

**No MongoDB needed anymore!**
