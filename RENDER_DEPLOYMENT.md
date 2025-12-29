# Deploy Backend to Render.com (Free Tier)

## Overview

Render.com's free tier is perfect for this game:
- ✅ Free forever
- ✅ Permanent URL (never changes)
- ✅ HTTPS included
- ⚠️ "Spins down" after 15 minutes of inactivity (first load may take 30-60 seconds)

## Step-by-Step Deployment

### Prerequisites

1. **GitHub account** (to store your code)
2. **Render.com account** (free) - sign up at https://render.com

---

### Step 1: Prepare Your Code for Render

The backend is already configured correctly, but let's verify:

**Check `backend/package.json`** has these scripts:
```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

✅ This is already set up correctly!

---

### Step 2: Push Code to GitHub

If you haven't already:

```bash
cd /Users/science/Library/CloudStorage/Dropbox/Serge/RicochetClaude

# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Ricochet game"

# Create repository on GitHub, then:
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git branch -M main
git push -u origin main
```

---

### Step 3: Create Render Web Service

1. **Go to Render Dashboard**: https://dashboard.render.com

2. **Click "New +"** (top right) → **"Web Service"**

3. **Connect GitHub Repository**:
   - Click "Connect account" if first time
   - Grant Render access to your repositories
   - Find and select your Ricochet repository

4. **Configure the Service**:

   | Field | Value |
   |-------|-------|
   | **Name** | `ricochet-backend` (or your choice) |
   | **Region** | Choose closest to you |
   | **Branch** | `main` |
   | **Root Directory** | `backend` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | `Free` |

5. **Click "Create Web Service"**

6. **Wait for deployment** (2-3 minutes)
   - You'll see logs in real-time
   - Look for "Ricochet server listening on port 3001"
   - Status should turn to "Live" with a green checkmark

7. **Copy Your Backend URL**:
   - At the top, you'll see something like: `https://ricochet-backend-xyz123.onrender.com`
   - **Copy this URL!** You'll need it next.

---

### Step 3.5: Set Secure Passwords (IMPORTANT! 🔒)

**⚠️ DO THIS BEFORE SHARING YOUR GAME!**

Your passwords should **NOT** be in your GitHub code. Set them securely in Render:

1. **In Render Dashboard** → Your service → **"Environment"** tab (left sidebar)

2. **Click "Add Environment Variable"**

3. **Add Teacher Password**:
   - Key: `TEACHER_PASSWORD`
   - Value: `outside4me` (or your chosen password)
   - Click "Save Changes"

4. **Add Admin Password**:
   - Key: `ADMIN_PASSWORD`
   - Value: `outside4me` (or your chosen password)
   - Click "Save Changes"

5. **Wait for auto-redeploy** (~2 minutes)

**✅ Your real passwords are now secure!** They're stored in Render, not in GitHub.

**📖 For more details**, see [PASSWORD_SETUP.md](./PASSWORD_SETUP.md)

**Default passwords in code** (`teacher123`, `admin456`) are just fallbacks for local development. Your production passwords are only in Render's environment variables.

---

### Step 4: Update Frontend Configuration

1. **Edit `frontend/.env.production`**:
   ```bash
   VITE_SOCKET_URL=https://ricochet-backend-xyz123.onrender.com
   ```
   (Replace with YOUR actual Render URL)

2. **Commit this change**:
   ```bash
   git add frontend/.env.production
   git commit -m "Update backend URL for Render deployment"
   git push
   ```

---

### Step 5: Deploy Frontend to GitHub Pages

**Option A: Manual Deployment**

```bash
cd frontend

# Install dependencies (if not done)
npm install

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

**Option B: Automatic Deployment with GitHub Actions**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd frontend
          npm install

      - name: Build
        run: |
          cd frontend
          npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```

Then:
1. Push this file to GitHub
2. Go to your repo → Settings → Pages
3. Set Source to "Deploy from a branch"
4. Set Branch to "gh-pages" and folder to "/ (root)"
5. Save

---

### Step 6: Test Your Deployment

1. **Wait 1-2 minutes** for GitHub Pages to deploy

2. **Visit your game**:
   ```
   https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
   ```

3. **Test the connection**:
   - Enter your name and join
   - If you see the game board, it's working! 🎉
   - If you see connection errors, check the next section

---

## Troubleshooting

### "Connection Failed" Error

**Check 1: Is backend running?**
- Go to your Render dashboard
- Status should be "Live" (green)
- If "Build Failed" or "Deploying", wait for it to finish

**Check 2: Is the URL correct?**
- Check `frontend/.env.production` has the right URL
- URL should be HTTPS (not HTTP)
- No trailing slash

**Check 3: Check browser console**
- Open DevTools (F12)
- Look for errors
- Should see "Connected to server"

**Check 4: CORS issues?**
- The backend already has CORS enabled with `origin: '*'`
- If you still have issues, check Render logs

### Backend Logs

View logs in Render:
1. Go to your web service dashboard
2. Click "Logs" tab
3. Look for errors

### Free Tier "Spin Down"

After 15 minutes of no activity, Render pauses your backend:
- First request will wake it up (takes 30-60 seconds)
- Tell students the first load might be slow
- Once awake, it stays fast for 15 minutes

**To wake it up before students arrive:**
- Just visit your game URL 1-2 minutes before class
- Or make a request to: `https://your-backend.onrender.com/`

---

## Updating Your Game

### Update Backend

1. Make changes to backend code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update backend"
   git push
   ```
3. Render automatically redeploys! (2-3 minutes)

### Update Frontend

1. Make changes to frontend code
2. Build and deploy:
   ```bash
   cd frontend
   npm run build
   npm run deploy
   ```
3. Or just push to GitHub if using Actions workflow

---

## Environment Variables (Optional)

If you want to change passwords without modifying code:

1. **In Render Dashboard** → Your Service → "Environment"
2. **Add environment variables**:
   ```
   TEACHER_PASSWORD=your-custom-password
   ADMIN_PASSWORD=your-custom-password
   ```
3. **Update `backend/src/gameState.js`**:
   ```javascript
   // Passwords
   this.teacherPassword = process.env.TEACHER_PASSWORD || 'teacher123';
   this.adminPassword = process.env.ADMIN_PASSWORD || 'admin456';
   ```
4. Commit and push to trigger redeploy

---

## Costs

**Render Free Tier Limits:**
- 750 hours/month (more than enough for classroom use)
- Spins down after 15 min inactivity
- Limited to 512 MB RAM
- 0.1 CPU

**This game uses very little resources**, so free tier is perfect!

**Upgrade ($7/month)** if you want:
- No spin-down (always instant)
- More resources
- Custom domain

---

## Quick Reference

**Backend URL**: Check Render dashboard

**Frontend URL**: `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`

**Teacher Password**: `teacher123`

**Admin Password**: `admin456`

**Deploy Backend**: Push to GitHub (auto-deploys)

**Deploy Frontend**:
```bash
cd frontend && npm run build && npm run deploy
```

**View Backend Logs**: Render Dashboard → Logs tab

**Check Backend Status**: Visit `https://your-backend.onrender.com/` (should show JSON with status: "ok")

---

## Tips

1. **Bookmark your Render dashboard** for quick access to logs
2. **Test before class** by visiting the game URL to wake up the backend
3. **Share direct link** with students (they just need the GitHub Pages URL)
4. **Monitor during play** via Render logs to see connections and errors
5. **First load is slow** - warn students, it's normal for free tier

---

## Need Help?

Common issues:
- **"Cannot connect"**: Backend might be spinning down, wait 60 seconds
- **"Invalid password"**: Check you're using correct role URL
- **Blank screen**: Check browser console for errors
- **Old version showing**: Clear browser cache or hard refresh (Ctrl+F5)

Check Render status: https://status.render.com
