# Ricochet Backend Server

## Quick Start (Local Development)

```bash
npm install
npm start
```

Server runs on http://localhost:3001

---

## 🚀 Deploy to Render.com (Recommended)

**For permanent, free hosting:**

See **[RENDER_DEPLOYMENT.md](../RENDER_DEPLOYMENT.md)** for complete instructions.

**Quick steps:**
1. Push code to GitHub
2. Create Web Service on Render.com
3. Connect GitHub repo
4. Set Root Directory: `backend`
5. Deploy!

**Checklist**: [DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md)

---

## Running Locally for Online Play (with ngrok)

### Prerequisites
1. Install ngrok from https://ngrok.com/download
2. Sign up and authenticate ngrok

### Easy Way - Use Startup Script

**Mac/Linux:**
```bash
./start-server.sh
```

**Windows:**
```
start-server.bat
```

The script will:
1. Start the backend server
2. Start ngrok tunnel
3. Display your public HTTPS URL

### Manual Way

**Terminal 1 - Start Backend:**
```bash
npm start
```

**Terminal 2 - Start ngrok:**
```bash
ngrok http 3001
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

## After Starting Server

1. Copy the ngrok HTTPS URL from the terminal
2. Update `frontend/.env.production` with this URL:
   ```
   VITE_SOCKET_URL=https://your-ngrok-url.ngrok.io
   ```
3. Build and deploy frontend:
   ```bash
   cd ../frontend
   npm run build
   npm run deploy
   ```

---

## Default Passwords

- **Teacher**: `teacher123`
- **Admin**: `admin456`

Change these in `src/gameState.js` if needed.

## Stopping the Server

Press `Ctrl+C` in the terminal to stop.

---

## See Also

- **[RENDER_DEPLOYMENT.md](../RENDER_DEPLOYMENT.md)** - Deploy to Render.com (recommended)
- [DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md) - Step-by-step checklist
- [HOSTING_GUIDE.md](../HOSTING_GUIDE.md) - Alternative hosting options
- [Main README](../README.md) - Project overview
