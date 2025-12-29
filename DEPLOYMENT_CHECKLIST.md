# Deployment Checklist

Use this checklist when deploying your Ricochet game.

## ☐ Step 1: Push to GitHub

```bash
cd /Users/science/Library/CloudStorage/Dropbox/Serge/RicochetClaude

git init
git add .
git commit -m "Initial commit - Ricochet game"

# Create a new repository on GitHub first, then:
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git branch -M main
git push -u origin main
```

**✅ Verify:** Code is visible on GitHub

---

## ☐ Step 2: Deploy Backend to Render.com

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `ricochet-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Click "Create Web Service"
6. Wait 2-3 minutes for deployment

**✅ Verify:**
- Status shows "Live" (green)
- Logs show "Ricochet server listening on port 3001"

**📝 Copy Backend URL:** `https://ricochet-backend-________.onrender.com`

---

## ☐ Step 2.5: Set Secure Passwords 🔒

**IMPORTANT: Do this before sharing your game!**

1. In Render Dashboard → Your service → "Environment" tab
2. Click "Add Environment Variable"
3. Add Teacher password:
   - Key: `TEACHER_PASSWORD`
   - Value: `outside4me` (or your choice)
4. Add Admin password:
   - Key: `ADMIN_PASSWORD`
   - Value: `outside4me` (or your choice)
5. Click "Save Changes"
6. Wait 2 minutes for redeploy

**✅ Verify:**
- Environment variables appear in Render dashboard
- Deployment completes successfully

**📖 Details:** See [PASSWORD_SETUP.md](./PASSWORD_SETUP.md)

---

## ☐ Step 3: Configure Frontend

Edit `frontend/.env.production`:

```bash
VITE_SOCKET_URL=https://ricochet-backend-________.onrender.com
```

*(Replace with YOUR actual URL from Step 2)*

**Save the file!**

---

## ☐ Step 4: Commit Environment Config

```bash
git add frontend/.env.production
git commit -m "Configure backend URL for production"
git push
```

**✅ Verify:** Changes are on GitHub

---

## ☐ Step 5: Deploy Frontend to GitHub Pages

### Option A: Enable GitHub Pages (First Time)

1. Go to your repo on GitHub
2. Settings → Pages
3. Source: "Deploy from a branch"
4. Branch: `gh-pages` → `/ (root)`
5. Save

### Option B: Deploy Frontend

```bash
cd frontend

# First time only:
npm install

# Build and deploy:
npm run build
npm run deploy
```

Wait 1-2 minutes for GitHub Pages to update.

**✅ Verify:** Visit `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`

---

## ☐ Step 6: Test Everything

1. **Visit your game URL**
2. **Join as Student**
   - Enter a name
   - Click "Join Game"
   - Should see game board
3. **Join as Teacher** (new tab)
   - Add `?role=teacher` to URL
   - Password: `teacher123`
   - Should see player list and controls
4. **Start a game**
   - Click "Start Game" as teacher
   - Robots and target should appear
   - Try moving a robot
5. **Check scores**
   - Solve the puzzle
   - Verify score appears correctly

**✅ Success!** Your game is live!

---

## 📌 Important URLs

**Save these for later:**

- **Frontend (Student)**: `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`
- **Frontend (Teacher)**: Add `?role=teacher`
- **Frontend (Admin)**: Add `?role=admin`
- **Backend**: `https://ricochet-backend-________.onrender.com`
- **GitHub Repo**: `https://github.com/YOUR-USERNAME/YOUR-REPO-NAME`
- **Render Dashboard**: https://dashboard.render.com

---

## 🔧 Common Issues

### Backend won't deploy
- Check Render logs for errors
- Verify `backend/package.json` has `"start": "node server.js"`
- Check Root Directory is set to `backend`

### Frontend can't connect
- Check `frontend/.env.production` has correct URL
- Verify URL is HTTPS (not HTTP)
- Check backend is "Live" in Render
- Wait 60 seconds if backend was asleep

### Changes not showing
- **Backend**: Just push to GitHub (auto-deploys)
- **Frontend**: Run `npm run build && npm run deploy`
- Clear browser cache (Ctrl+F5)

### First load is very slow
- Normal! Render free tier "wakes up" the backend (30-60 sec)
- Visit game URL 2 minutes before class to wake it up
- After first load, stays fast for 15 minutes

---

## 🚀 Future Updates

### Update Backend Code
```bash
# Make changes to backend files
git add .
git commit -m "Update backend"
git push
# Render auto-deploys in 2-3 minutes
```

### Update Frontend Code
```bash
# Make changes to frontend files
cd frontend
npm run build
npm run deploy
# Live in 1-2 minutes
```

### Change Passwords
See `RENDER_DEPLOYMENT.md` → Environment Variables section

---

## ✅ Deployment Complete!

Share your game URL with students:
```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```

Teacher login: `?role=teacher` (password: `teacher123`)

Enjoy! 🎉
