# Setup and Testing Guide

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Start Backend Server

```bash
cd backend
npm run dev
```

The server will start on `http://localhost:3001`

**Default Passwords:**
- Teacher: `teacher123`
- Admin: `admin456`

### 3. Start Frontend Development Server

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

### 4. Test the Game

1. Open your browser to `http://localhost:3000`
2. Enter your name and select role (Student by default)
3. If testing Teacher/Admin roles, enter the password
4. Click "Join Game"

## Testing Multiplayer

1. Open multiple browser tabs/windows
2. Join with different names in each tab
3. Test the real-time synchronization:
   - Move robots in one tab
   - See updates in other tabs
   - Test first solution detection
   - Test countdown timer

## Testing Teacher Controls

1. Join as a teacher with password `teacher123`
2. Test "Start Next Round" button
3. Verify all players see the new round

## Testing Admin Controls

1. Join as admin with password `admin456`
2. Test "Regenerate Walls" button
3. Test renaming inappropriate player names to "Trouble"
4. View full player list and scores

## Game Flow Testing

1. **Join Phase**: Multiple players join
2. **Round Start**: Teacher/Admin starts first round
3. **Solving**: Players move robots to reach target
4. **First Solution**: First player triggers 60s countdown
5. **Countdown**: Other players continue improving solutions
6. **Round End**: After 60s, scores are calculated and displayed
7. **Next Round**: Repeat for 15 rounds total
8. **Game End**: Final leaderboard shows top 3 players

## Key Features to Test

- ✅ Robot selection (click robot)
- ✅ Movement calculation (shows possible destinations)
- ✅ Movement execution (click destination)
- ✅ Collision detection (robots block each other)
- ✅ Wall blocking (movement stops at walls)
- ✅ Trail visualization (see movement history)
- ✅ Target detection (auto-detect when solution found)
- ✅ Reset functionality (return to start positions)
- ✅ Real-time sync (moves visible to all players)
- ✅ Scoring system (base + time + efficiency bonuses)
- ✅ Timer countdown (60s after first solution)
- ✅ Round progression (15 rounds total)
- ✅ Role-based controls (Student/Teacher/Admin)

## Troubleshooting

### Backend won't start
- Check if port 3001 is already in use
- Verify all dependencies are installed

### Frontend can't connect to backend
- Make sure backend is running on port 3001
- Check `frontend/.env.development` has correct `VITE_SOCKET_URL`
- Check browser console for connection errors

### Robots won't move
- Make sure you click on a robot first to select it
- Then click on one of the highlighted hexes to move
- Check browser console for errors

### Build errors
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist` in frontend folder
