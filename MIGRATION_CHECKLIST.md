# Supabase Migration - Complete Checklist

## ✅ What I've Done

### 1. Created Files
- ✅ `supabase_schema.sql` - Complete database schema
- ✅ `backend/services/supabase_db.py` - Supabase database service
- ✅ `backend/requirements-supabase.txt` - Minimal dependencies
- ✅ `SUPABASE_MIGRATION.md` - Migration guide
- ✅ `MIGRATION_CHECKLIST.md` - This file

### 2. Updated Backend
- ✅ Removed MongoDB imports from `server.py`
- ✅ Added Supabase import: `from services.supabase_db import db`
- ✅ Removed all `.pop('_id', None)` calls
- ✅ Removed all `{'_id': 0}` projections
- ✅ Removed MongoDB shutdown handler

### 3. Updated Environment
- ✅ Removed `MONGO_URL` and `DB_NAME` from `.env`
- ✅ Added `SUPABASE_SERVICE_KEY` to `.env`

---

## ⚠️ CRITICAL: What You MUST Do

### Step 1: Get the CORRECT Service Role Key

The key in your `.env` file looks like a publishable key, not a service role key!

**How to get the correct key:**

1. Go to https://supabase.com/dashboard
2. Select your project: `wjzkjdzunxbhrskinomm`
3. Go to **Settings** (gear icon) → **API**
4. Scroll down to **Project API keys**
5. Find the **`service_role`** key (NOT `anon` key)
6. It should start with `eyJ...` and be VERY long
7. Click **Reveal** and copy it
8. Update `backend/.env`:

```env
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind...
```

**Why this matters:**
- ❌ Publishable key: Limited access, respects RLS
- ✅ Service role key: Full access, bypasses RLS (needed for backend)

---

### Step 2: Run SQL Schema in Supabase

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New query**
3. Copy the ENTIRE content of `supabase_schema.sql`
4. Paste it into the editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Wait for "Success. No rows returned"

**Verify it worked:**
- Go to **Table Editor**
- You should see 3 tables: `users`, `journal_entries`, `chat_messages`

---

### Step 3: Install Supabase Client

```bash
cd backend
./venv/bin/pip install supabase==2.27.3
```

Or install all minimal dependencies:
```bash
./venv/bin/pip install -r requirements-supabase.txt
```

---

### Step 4: Restart Backend

```bash
# Kill any running backend
pkill -9 -f uvicorn

# Start fresh
cd backend
./venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Check for errors:**
```bash
tail -f /tmp/backend.log
```

You should see:
```
INFO: Supabase client initialized for https://wjzkjdzunxbhrskinomm.supabase.co
INFO: Application startup complete.
```

---

### Step 5: Test Everything

#### Test 1: Health Check
```bash
curl http://localhost:8001/api/health
# Expected: {"status":"healthy"}
```

#### Test 2: Create User (via app)
1. Open app in browser or device
2. Sign up with new email
3. Complete onboarding
4. Check Supabase Dashboard → Table Editor → `users`
5. You should see your user!

#### Test 3: Check Backend Logs
```bash
tail -f /tmp/backend.log
```

Look for:
- ✅ No MongoDB errors
- ✅ Supabase client initialized
- ✅ API requests succeeding

---

## 🔍 What to Check

### In Supabase Dashboard

**Table Editor:**
- [ ] `users` table exists with correct columns
- [ ] `journal_entries` table exists
- [ ] `chat_messages` table exists

**SQL Editor → Run this:**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```
All should show `rowsecurity = true`

**SQL Editor → Run this:**
```sql
-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public';
```
Should show `get_user_conversations` and `update_updated_at_column`

---

## 🐛 Troubleshooting

### Error: "SUPABASE_SERVICE_KEY must be set"
- ✅ Make sure you added the service role key to `.env`
- ✅ Restart the backend server
- ✅ Check the key starts with `eyJ...`

### Error: "relation 'users' does not exist"
- ✅ Run the SQL schema in Supabase SQL Editor
- ✅ Check you're in the correct project
- ✅ Verify tables exist in Table Editor

### Error: "Failed to create user"
- ✅ Check Supabase logs: Dashboard → Logs → Postgres Logs
- ✅ Verify service role key is correct
- ✅ Check RLS policies are set

### Backend won't start
```bash
# Check for import errors
cd backend
./venv/bin/python -c "from services.supabase_db import db; print('OK')"
```

### Can't see data in Supabase
- ✅ Check you're looking at the right project
- ✅ Verify service role key is correct
- ✅ Check backend logs for errors

---

## 📋 Final Verification

Run through this checklist:

- [ ] SQL schema executed in Supabase
- [ ] Service role key (starts with `eyJ...`) in `.env`
- [ ] Supabase client installed (`pip install supabase`)
- [ ] Backend starts without errors
- [ ] Health check returns `{"status":"healthy"}`
- [ ] Can create user via app
- [ ] User appears in Supabase Table Editor
- [ ] Can create journal entry
- [ ] Can send AI chat message
- [ ] All data visible in Supabase Dashboard

---

## 🎉 Success Criteria

You'll know it's working when:

1. ✅ Backend starts with "Supabase client initialized"
2. ✅ No MongoDB errors in logs
3. ✅ Can sign up and complete onboarding
4. ✅ User profile appears in Supabase `users` table
5. ✅ Daily briefing loads on home screen
6. ✅ Can create journal entries
7. ✅ Can chat with AI
8. ✅ All data persists in Supabase

---

## 🔄 If You Need to Rollback

If something goes wrong and you need MongoDB back:

1. Restore `backend/.env`:
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="lumina_db"
```

2. Restore MongoDB imports in `server.py`:
```python
from motor.motor_asyncio import AsyncIOMotorClient
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
```

3. Restart backend

---

## 📝 Notes

- **No MongoDB needed anymore** - You can uninstall it if you want
- **Service role key is sensitive** - Don't commit it to git
- **Supabase free tier** - 500MB database, 2GB bandwidth/month
- **RLS is enabled** - Users can only access their own data
- **Automatic backups** - Supabase handles this

---

## 🆘 Need Help?

Check these in order:

1. **Backend logs**: `tail -f /tmp/backend.log`
2. **Supabase logs**: Dashboard → Logs → Postgres Logs
3. **Frontend console**: Browser DevTools → Console
4. **Test SQL directly**: Supabase SQL Editor

Common issues are usually:
- Wrong service role key (must start with `eyJ...`)
- SQL schema not run
- Backend not restarted after changes
