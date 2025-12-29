# Hosting Guide: Frontend on GitHub Pages + Backend on Home Computer

## Overview

Your setup will be:
- **Frontend**: Hosted on GitHub Pages (always accessible)
- **Backend**: Running on your home computer (only when you want to play)

## Problem: Home Computer Not Publicly Accessible

By default, your home computer is **not accessible** from the internet. When someone loads the frontend from GitHub Pages, their browser can't connect to `localhost:3001` on your computer.

## Solutions

### **Option 1: ngrok (Recommended - Easiest)**

ngrok creates a secure tunnel from the internet to your home computer.

#### Setup Steps:

1. **Install ngrok**
   - Go to https://ngrok.com/download
   - Download and install for your OS
   - Sign up for a free account
   - Follow instructions to authenticate

2. **Start Your Backend Server**
   ```bash
   cd backend
   npm start
   ```
   (Server runs on http://localhost:3001)

3. **Start ngrok Tunnel**
   ```bash
   ngrok http 3001
   ```

4. **Copy the Public URL**
   - ngrok will show something like: `https://abc123.ngrok.io`
   - This is your public backend URL!

5. **Update Frontend Environment Variable**
   - Before deploying to GitHub Pages, update `.env.production`:
   ```
   VITE_SOCKET_URL=https://abc123.ngrok.io
   ```

6. **Build and Deploy Frontend**
   ```bash
   cd frontend
   npm run build
   npm run deploy
   ```

**Pros:**
- Very easy to use
- Works through firewalls
- HTTPS included (secure)
- Free tier available

**Cons:**
- URL changes each time you restart ngrok (unless you pay for a permanent URL)
- Need to update frontend env var and redeploy if URL changes

---

### **Option 2: localtunnel (Free Alternative)**

Similar to ngrok but doesn't require signup.

1. **Install localtunnel globally**
   ```bash
   npm install -g localtunnel
   ```

2. **Start Your Backend**
   ```bash
   cd backend
   npm start
   ```

3. **Start Tunnel**
   ```bash
   lt --port 3001
   ```

4. **Copy the URL** (e.g., `https://tough-foxes-56.loca.lt`)

5. **Update Frontend** (same as ngrok option)

**Pros:**
- No signup required
- Free

**Cons:**
- Less reliable than ngrok
- URL changes each time
- May have connection issues

---

### **Option 3: Port Forwarding (More Technical)**

Configure your router to forward port 3001 to your computer.

**Pros:**
- No third-party service
- Permanent solution

**Cons:**
- Complex router setup
- Need static IP or dynamic DNS service
- Security concerns (opening ports)
- May not work if ISP blocks incoming connections
- **Not recommended for beginners**

---

### **Option 4: Deploy Backend to Cloud (When Playing)**

Use a free cloud service only when you need it.

**Render.com Free Tier:**
1. Push backend code to GitHub
2. Create Render account
3. Deploy as "Web Service"
4. Stop service when not playing

**Pros:**
- Always accessible
- Professional setup
- No local computer needed

**Cons:**
- Free tier "spins down" after 15 min of inactivity (slow first load)
- Need to manage deployments

---

## Recommended Workflow

**For Quick/Easy Setup (Best for you):**

1. **Use ngrok** (Option 1)
2. Create a startup script (see below)
3. When you want to play:
   - Run the startup script
   - Get the ngrok URL
   - Update frontend if URL changed
   - Share link with students

---

## Startup Script for Mac/Linux

Create `backend/start-server.sh`:

```bash
#!/bin/bash

echo "🚀 Starting Ricochet Backend Server..."
echo ""

# Start backend in background
npm start &
BACKEND_PID=$!

echo "✅ Backend running on http://localhost:3001"
echo ""
echo "⏳ Waiting 3 seconds for server to start..."
sleep 3

echo ""
echo "🌐 Starting ngrok tunnel..."
echo ""
echo "📋 Copy the HTTPS URL below and use it in your frontend:"
echo ""

# Start ngrok (will show URL in terminal)
ngrok http 3001

# When ngrok stops (Ctrl+C), kill backend
kill $BACKEND_PID
echo ""
echo "🛑 Server stopped"
```

Make it executable:
```bash
chmod +x backend/start-server.sh
```

Run it:
```bash
cd backend
./start-server.sh
```

---

## Startup Script for Windows

Create `backend/start-server.bat`:

```batch
@echo off
echo 🚀 Starting Ricochet Backend Server...
echo.

start /B npm start
echo ✅ Backend running on http://localhost:3001
echo.
echo ⏳ Waiting for server to start...
timeout /t 3

echo.
echo 🌐 Starting ngrok tunnel...
echo.
echo 📋 Copy the HTTPS URL below and use it in your frontend:
echo.

ngrok http 3001
```

Run it:
```
cd backend
start-server.bat
```

---

## Frontend Environment Setup

### For Development (Local Testing)
`frontend/.env.development`:
```
VITE_SOCKET_URL=http://localhost:3001
```

### For Production (GitHub Pages)
`frontend/.env.production`:
```
VITE_SOCKET_URL=https://your-ngrok-url.ngrok.io
```

**Important:** Update this file with your current ngrok URL before deploying!

---

## Deployment Workflow

### Every Time You Want to Play:

1. **Start Backend + ngrok**
   ```bash
   cd backend
   ./start-server.sh   # Mac/Linux
   # OR
   start-server.bat    # Windows
   ```

2. **Copy the ngrok HTTPS URL** from terminal

3. **Update Frontend** (only if URL changed)
   ```bash
   cd frontend
   # Edit .env.production with new URL
   npm run build
   npm run deploy
   ```

4. **Share the GitHub Pages URL** with students
   - They load the frontend from GitHub Pages
   - Frontend connects to your backend via ngrok URL

5. **When Done Playing**
   - Press Ctrl+C to stop ngrok and backend
   - Server is now offline (no one can access)

---

## Tips

1. **ngrok Free Account**: The URL changes every time you restart. Consider paying $8/month for a permanent URL if you play often.

2. **Keep Backend Running**: As long as ngrok and backend are running, students can connect.

3. **Network Issues**: If students can't connect, check:
   - Is ngrok still running?
   - Is the frontend using the correct ngrok URL?
   - Is your computer/internet still working?

4. **Testing**: Before sharing with students, test the setup:
   - Open GitHub Pages URL on your phone (using cellular data, not home WiFi)
   - Try joining the game
   - If it works, your setup is correct!

---

## Quick Reference

**Start Server:**
```bash
cd backend && npm start
```

**Start ngrok:**
```bash
ngrok http 3001
```

**Update Frontend URL:**
Edit `frontend/.env.production`

**Deploy Frontend:**
```bash
cd frontend && npm run build && npm run deploy
```

**GitHub Pages URL:**
`https://your-username.github.io/your-repo-name/`

---

## Need Help?

If ngrok URL keeps changing and you don't want to redeploy frontend each time, consider:
- Pay for ngrok permanent URL ($8/month)
- Use Render.com free tier (backend stays at same URL)
- Use a Dynamic DNS service with port forwarding (advanced)
