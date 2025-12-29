# Secure Password Setup

## 🔒 How It Works

Your passwords are **NOT stored in GitHub**. Instead:
- GitHub code has **placeholder passwords** (`teacher123` and `admin456`)
- **Real passwords** are stored securely in Render.com environment variables
- Only you can see/edit the real passwords in Render dashboard

## ✅ Setting Your Passwords in Render

### Step 1: Deploy to Render First

Follow the deployment guide to get your backend on Render.com first.

### Step 2: Add Environment Variables

1. **Go to Render Dashboard**: https://dashboard.render.com

2. **Select your web service** (`ricochet-backend`)

3. **Click "Environment"** (left sidebar)

4. **Click "Add Environment Variable"**

5. **Add Teacher Password**:
   - **Key**: `TEACHER_PASSWORD`
   - **Value**: `outside4me`
   - Click "Save Changes"

6. **Add Admin Password**:
   - Click "Add Environment Variable" again
   - **Key**: `ADMIN_PASSWORD`
   - **Value**: `outside4me`
   - Click "Save Changes"

7. **Wait for redeploy** (automatic, takes ~2 minutes)

### Step 3: Verify Passwords Work

1. Visit your game URL
2. Add `?role=teacher` to the URL
3. Try logging in with `outside4me`
4. Should work! ✅

---

## 🚨 Security Best Practices

### ✅ DO:
- Keep real passwords in Render environment variables
- Use strong, unique passwords
- Keep default passwords (`teacher123`, `admin456`) in GitHub code
- Push code to GitHub without worry

### ❌ DON'T:
- Hardcode real passwords in `gameState.js`
- Share your Render dashboard login
- Commit `.env` files with real passwords to GitHub

---

## 📝 How It Works Technically

**In `backend/src/gameState.js`:**
```javascript
this.teacherPassword = process.env.TEACHER_PASSWORD || 'teacher123';
this.adminPassword = process.env.ADMIN_PASSWORD || 'admin456';
```

**What this means:**
- If `TEACHER_PASSWORD` environment variable exists → use it
- Otherwise → use default `teacher123`

**On Render.com:**
- You set `TEACHER_PASSWORD=outside4me` in dashboard
- Backend reads this value
- Real password is `outside4me`

**On GitHub:**
- Code shows: `|| 'teacher123'`
- This is just a fallback for local development
- Real password (`outside4me`) is **NOT** in GitHub

**On your local computer:**
- No environment variable set
- Uses default `teacher123` for testing
- To use real password locally, create `.env` file (see below)

---

## 💻 Local Development with Real Passwords

If you want to use your real passwords when testing locally:

### Option 1: Set Environment Variables (Mac/Linux)

```bash
export TEACHER_PASSWORD=outside4me
export ADMIN_PASSWORD=outside4me
npm start
```

### Option 2: Create .env file (Any OS)

**Important:** Make sure `.env` is in `.gitignore`!

1. **Create `backend/.env`**:
   ```
   TEACHER_PASSWORD=outside4me
   ADMIN_PASSWORD=outside4me
   ```

2. **Install dotenv**:
   ```bash
   cd backend
   npm install dotenv
   ```

3. **Update `backend/server.js`** (add at the very top):
   ```javascript
   require('dotenv').config();
   ```

4. **Add to `.gitignore`**:
   ```
   backend/.env
   ```

5. **Start server**:
   ```bash
   npm start
   ```

Now your local server uses `outside4me` too!

---

## 🔄 Changing Passwords Later

### In Render (Production)

1. Go to Render Dashboard
2. Select your service
3. Environment tab
4. Edit `TEACHER_PASSWORD` or `ADMIN_PASSWORD`
5. Save (auto-redeploys)

### Locally (if using .env)

1. Edit `backend/.env`
2. Restart server

---

## 🧪 Testing Different Scenarios

### Test 1: Default passwords (no env vars)
```bash
cd backend
npm start
# Uses: teacher123, admin456
```

### Test 2: Custom passwords (with env vars)
```bash
export TEACHER_PASSWORD=outside4me
export ADMIN_PASSWORD=outside4me
npm start
# Uses: outside4me, outside4me
```

### Test 3: Production (Render.com)
- Set env vars in Render dashboard
- Backend uses those values
- GitHub code never sees real passwords

---

## ❓ FAQ

**Q: Is my password visible in GitHub?**
A: No! The code shows `process.env.TEACHER_PASSWORD || 'teacher123'`. The real password (`outside4me`) is only in Render's environment variables.

**Q: What if someone looks at my GitHub repo?**
A: They'll see the default passwords (`teacher123`, `admin456`). Your real passwords are safe in Render.

**Q: Can someone inspect the frontend code to find passwords?**
A: No! Passwords are only checked on the backend server. The frontend never knows the passwords.

**Q: What if I accidentally commit .env file?**
A: Remove it from Git:
```bash
git rm --cached backend/.env
git commit -m "Remove .env file"
git push
```
Then change your passwords in Render!

**Q: Can I use different passwords for teacher and admin?**
A: Yes! Set different values:
- `TEACHER_PASSWORD=one-password`
- `ADMIN_PASSWORD=different-password`

---

## ✅ Summary

1. **Code in GitHub** = Default passwords (teacher123, admin456)
2. **Real passwords** = Set in Render dashboard environment variables
3. **Your choice** = `outside4me` for both (only you can see this in Render)
4. **Security** = ✅ Safe to push to GitHub!

Your real passwords are **never** in your GitHub repository!
