# Dynamic Score Recalculation Feature

## Overview

Implemented automatic score recalculation when a shorter solution path is discovered, ensuring all players' scores accurately reflect the current global shortest path.

## The Problem

The scoring formula includes a **length bonus** component:
```
Length Bonus = 2 - (0.2 × moves beyond global shortest), minimum 0
```

Previously, when a player found a solution:
1. Their score was calculated using the current `globalShortestMoves`
2. If another player later found a shorter path, `globalShortestMoves` would update
3. **But previous players' scores were NOT recalculated**
4. This meant early players had inflated scores based on an outdated "shortest path"

## The Solution

When a new global shortest path is discovered:
1. **Recalculate ALL existing solution scores** using the new shortest path
2. **Broadcast updated scores** to all affected players
3. **Show notifications** so players understand their score changed

## Implementation Details

### Backend Changes

**`backend/src/gameState.js` - `checkSolution()` method:**
```javascript
// Track if this is a new global shortest
let newGlobalShortest = false;

// When new shortest is found, recalculate ALL player scores
if (newGlobalShortest) {
  Object.entries(this.players).forEach(([pId, p]) => {
    if (p.currentSolution) {
      const recalculatedScore = this.calculateScore(
        p.currentSolution.moveCount,
        p.currentSolution.time
      );
      p.currentSolution.score = recalculatedScore;
      updatedScores[pId] = {
        score: recalculatedScore,
        moveCount: p.currentSolution.moveCount
      };
    }
  });
}

return {
  // ... other fields
  newGlobalShortest,
  updatedScores: newGlobalShortest ? updatedScores : null
};
```

**`backend/server.js` - moveRobot handler:**
```javascript
// Broadcast updated scores when new shortest found
if (solutionCheck.newGlobalShortest && solutionCheck.updatedScores) {
  Object.entries(solutionCheck.updatedScores).forEach(([playerId, scoreData]) => {
    io.to(playerId).emit('scoreUpdated', {
      score: scoreData.score,
      moveCount: scoreData.moveCount,
      reason: 'New global shortest path found'
    });
  });
}
```

### Frontend Changes

**`frontend/src/App.jsx` - New socket event handlers:**

1. **Handle score updates:**
```javascript
socket.on('scoreUpdated', (data) => {
  // Update player's displayed score
  setGameState(prev => ({
    ...prev,
    playerState: {
      ...prev.playerState,
      roundScore: data.score
    }
  }));

  // Show notification modal
  setShowModal({
    type: 'scoreUpdate',
    data: { score: data.score, reason: data.reason }
  });
  setTimeout(() => setShowModal(null), 2000);
});
```

2. **Enhanced globalUpdate handler:**
```javascript
socket.on('globalUpdate', (data) => {
  setGameState(prev => ({ ...prev, ...data }));

  // Notify about new global shortest
  if (data.newGlobalShortest) {
    setError('New shortest path found! Scores updated.');
    setTimeout(() => setError(null), 3000);
  }
});
```

3. **New modal type for score updates:**
```jsx
{showModal.type === 'scoreUpdate' && (
  <>
    <h2>📊 Score Updated!</h2>
    <p>New Score: {showModal.data.score.toFixed(2)}</p>
    <p style={{ fontSize: '14px', color: '#aaa' }}>
      {showModal.data.reason}
    </p>
  </>
)}
```

## How It Works

### Example Scenario

1. **Player A** finds solution in 10 moves
   - `globalShortestMoves = 10`
   - Player A's length bonus = 2.0 (full bonus)
   - Player A's score = 5 + timeBonus + 2.0

2. **Player B** finds solution in 12 moves
   - `globalShortestMoves = 10` (unchanged)
   - Player B's length bonus = 2 - (0.2 × 2) = 1.6
   - Player B's score = 5 + timeBonus + 1.6

3. **Player C** finds solution in 8 moves ⭐
   - `globalShortestMoves = 8` (NEW SHORTEST!)
   - Player C's length bonus = 2.0
   - Player C's score = 5 + timeBonus + 2.0

   **Automatic Recalculation Triggered:**
   - Player A recalculated: 2 - (0.2 × 2) = 1.6 (down from 2.0)
   - Player B recalculated: 2 - (0.2 × 4) = 1.2 (down from 1.6)
   - Both receive `scoreUpdated` event with new scores

4. **Player A and B see notifications:**
   - Top-right: "New shortest path found! Scores updated."
   - Modal: "📊 Score Updated! New Score: X.XX"

## Benefits

✅ **Fair Scoring**: All scores are always relative to the actual shortest path found
✅ **Real-time Updates**: Players see their scores change immediately
✅ **Transparent**: Clear notifications explain why scores changed
✅ **Competitive**: Encourages finding shorter paths (affects everyone's scores)
✅ **Accurate**: Final round scores reflect true performance

## Testing

To test this feature:

1. Open 3 browser tabs
2. Join as different players
3. **Tab 1**: Find a solution (e.g., 10 moves)
   - Note your score
4. **Tab 2**: Find a solution with more moves (e.g., 12 moves)
   - Note your score
5. **Tab 3**: Find a shorter solution (e.g., 7 moves)
   - **Tabs 1 & 2 should see:**
     - Notification: "New shortest path found! Scores updated."
     - Modal: "📊 Score Updated!"
     - Updated score in sidebar

## Files Modified

### Backend
- `backend/src/gameState.js`:
  - Modified `checkSolution()` to track new global shortest
  - Added score recalculation for all players
  - Returns `newGlobalShortest` and `updatedScores`

- `backend/server.js`:
  - Added score broadcast when new shortest found
  - Sends individual `scoreUpdated` events to affected players

### Frontend
- `frontend/src/App.jsx`:
  - Added `scoreUpdated` event handler
  - Enhanced `globalUpdate` handler with notification
  - Added `scoreUpdate` modal type
  - Update `roundScore` in player state
  - Added cleanup for `scoreUpdated` listener

## Edge Cases Handled

✅ First solution sets initial global shortest
✅ Multiple players with same move count (all get full bonus)
✅ Players who haven't found a solution yet (not affected)
✅ Score only updates if recalculated score is different
✅ Time bonus remains unchanged (based on original solution time)
