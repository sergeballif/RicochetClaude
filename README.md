# Ricochet - Hexagonal Puzzle Game

A real-time multiplayer puzzle game inspired by Ricochet Robots, played on a hexagonal grid.

## Project Structure

```
├── backend/          # Node.js + Socket.io server
│   ├── src/
│   └── server.js
├── frontend/         # React frontend
│   ├── src/
│   └── index.html
└── AGENTS.md        # Complete game specification
```

## Getting Started

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## How to Play

1. **Join the game** by entering your name
2. **Click on a robot** to select it (colored circles)
3. **Click on a highlighted hex** to move the robot in that direction
4. **Reach the target** (colored star) with the matching robot color
5. **Compete for the best score** based on speed and efficiency

### Game Roles

- **Student (Player)**: Default role, can play and solve puzzles
- **Teacher**: Can start new rounds (password: `teacher123`)
- **Admin**: Full control including wall regeneration and player management (password: `admin456`)

### Scoring

- **+5 points**: Reach the target
- **Time bonus**: Up to +3 points for solving quickly
- **Efficiency bonus**: Up to +2 points for using fewer moves

## Deployment (Recommended: Render.com Free Tier)

**Best for classroom use:**
- ✅ Free forever
- ✅ Permanent URL (deploy once, use anytime)
- ✅ Auto-deploys from GitHub
- ⚠️ First load takes 30-60 seconds (backend wakes up)

### 📖 Complete Deployment Guide

See **[RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)** for detailed step-by-step instructions.

### Quick Overview

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```

2. **Deploy Backend to Render.com**
   - Sign up at https://render.com (free)
   - Create new Web Service
   - Connect GitHub repo
   - Set Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Deploy!

3. **Copy Backend URL** (e.g., `https://ricochet-backend-xyz.onrender.com`)

4. **Update Frontend** (`frontend/.env.production`):
   ```
   VITE_SOCKET_URL=https://your-backend-url.onrender.com
   ```

5. **Deploy Frontend to GitHub Pages**
   ```bash
   cd frontend
   npm install
   npm run build
   npm run deploy
   ```

6. **Share with students**: `https://YOUR-USERNAME.github.io/YOUR-REPO/`

**That's it!** Backend auto-updates when you push to GitHub, frontend deploys manually.

---

### Alternative: Run Backend Locally

If you prefer running backend on your computer only when playing:

See [HOSTING_GUIDE.md](./HOSTING_GUIDE.md) for ngrok setup (requires redeployment each session).

## Tech Stack

- Frontend: React + Vite + Socket.io Client + Canvas API
- Backend: Node.js + Express + Socket.io
- Hexagonal grid using cube coordinates
- Real-time multiplayer synchronization

## Game Features

- ✅ Hexagonal grid (127 hexes, radius 6)
- ✅ 4 colored robots with sliding mechanics
- ✅ Random wall generation
- ✅ Real-time multiplayer sync
- ✅ 15 rounds per game
- ✅ Move trails visualization
- ✅ Time-based and efficiency-based scoring
- ✅ Role-based access (Student/Teacher/Admin)
- ✅ Anti-cheat with server-side validation
- ✅ Mobile and desktop responsive
