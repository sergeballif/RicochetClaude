# New Features - Authentication & Teacher Modal

## Overview
Two major features have been added to improve the game flow and role management.

## 1. URL-Based Role Authentication ✅

### How It Works
- **All users default to Student role** when accessing the base URL
- **Teacher role**: Access via `?role=teacher` query parameter
- **Admin role**: Access via `?role=admin` query parameter

### URLs
```
Student:  http://localhost:3000/
Teacher:  http://localhost:3000/?role=teacher
Admin:    http://localhost:3000/?role=admin
```

### Join Screen Changes
**For Students (Default):**
- Shows "Joining as: Student"
- Only asks for name
- Includes hint about how to join as Teacher/Admin

**For Teacher:**
- Shows "Joining as: Teacher" in blue
- Requires password: `teacher123`
- Password field auto-focuses

**For Admin:**
- Shows "Joining as: Admin" in blue
- Requires password: `admin456`
- Password field auto-focuses

### Security
- Role is determined by URL query parameter only
- Cannot change role without reloading page with different URL
- Password required before joining (not just before certain actions)
- Invalid password prevents joining entirely

## 2. Teacher Round-End Modal ✅

### When It Appears
- **Triggers**: When a round's 60-second timer expires
- **Who sees it**: Teacher and Admin only (not students)
- **Frequency**: Every round end (15 times per game)

### Modal Features

**Layout:**
- Two-column grid layout (responsive: single column on mobile)
- Left column: Round Leaders
- Right column: Overall Leaders
- Top 5 players shown in each column

**Round Leaders Column:**
- Title: "Round Leaders"
- Sorted by round score (highest to lowest)
- Shows: Rank, Name, Round Score
- Format: `+X.XX` (e.g., "+7.50")

**Overall Leaders Column:**
- Title: "Overall Leaders"
- Sorted by total score (highest to lowest)
- Shows: Rank, Name, Total Score
- Format: `X.XX` (e.g., "42.75")

**Header Info:**
- Round number: "Round X Complete!"
- Shortest solution: "Shortest Solution: X moves" (in green)

**Actions:**
- **"Start Next Round"** button (green) - Advances to next round
- **"Close"** button (blue) - Dismisses modal
- **Click outside modal** - Also dismisses

**Styling:**
- Dark background with semi-transparent overlay
- Blue headings matching game theme
- Leaderboard items with rank badges
- Responsive grid (2 columns on desktop, 1 on mobile)

### Modal Behavior

**Opening:**
```javascript
roundEnd event → Check if user is teacher/admin → Show modal
```

**Closing:**
- Click "Close" button
- Click "Start Next Round" button (also advances round)
- Click anywhere on dark overlay background
- Modal auto-closes when next round starts

**Data Flow:**
```
Backend sends roundEnd event
↓
Frontend receives roundScores data
↓
If user is teacher/admin: Show modal
↓
Display sorted leaderboards
```

## Implementation Details

### Frontend Changes

**App.jsx:**
- Added `urlParams` detection for role
- Changed role from state with dropdown to constant from URL
- Added `roundResults` state to store round-end data
- Added `showTeacherModal` state to control modal visibility
- Updated `roundEnd` event handler to show modal for teachers
- Created teacher modal JSX with two-column layout
- Made all modals dismissible by clicking overlay

**Join Form:**
- Removed role dropdown
- Added role indicator badge (colored by role)
- Only show password field for teacher/admin
- Added helpful text for students

### Backend Changes
None required - already sending proper `roundEnd` event with `roundScores`

## User Experience

### For Students
1. Access base URL
2. Enter name
3. Join immediately
4. Play game normally
5. **Never see** teacher modal

### For Teachers
1. Access URL with `?role=teacher`
2. Enter name and password
3. Join game
4. Play normally
5. **At round end**: Modal appears with leaderboards
6. Review scores
7. Click "Start Next Round" or "Close"
8. Repeat for each round

### For Admins
- Same as teachers, plus:
  - Can edit walls
  - Can rename players
  - Can regenerate walls

## Testing Checklist

### URL Authentication
- [ ] Base URL defaults to student
- [ ] `?role=teacher` shows teacher join screen
- [ ] `?role=admin` shows admin join screen
- [ ] Wrong password prevents joining
- [ ] Correct password allows joining
- [ ] Role indicator shows correct role

### Teacher Modal
- [ ] Modal appears for teacher when round ends
- [ ] Modal appears for admin when round ends
- [ ] Modal does NOT appear for students
- [ ] Round leaders sorted correctly
- [ ] Overall leaders sorted correctly
- [ ] Top 5 shown in each column
- [ ] Scores formatted correctly
- [ ] "Start Next Round" button works
- [ ] "Close" button dismisses modal
- [ ] Clicking overlay dismisses modal
- [ ] Modal responsive on mobile (single column)
- [ ] Starting next round auto-closes modal

## Mobile Responsiveness

**Desktop (>600px width):**
```
┌─────────────────────────────┐
│   Round X Complete!         │
│   Shortest: X moves         │
│ ┌───────────┬──────────────┐│
│ │  Round    │   Overall    ││
│ │  Leaders  │   Leaders    ││
│ └───────────┴──────────────┘│
│  [Start] [Close]            │
└─────────────────────────────┘
```

**Mobile (<600px width):**
```
┌─────────────────┐
│ Round X Complete│
│ Shortest: X     │
│ ┌─────────────┐ │
│ │ Round       │ │
│ │ Leaders     │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ Overall     │ │
│ │ Leaders     │ │
│ └─────────────┘ │
│ [Start][Close]  │
└─────────────────┘
```

## Future Enhancements (Not Implemented)

Possible additions:
- Export leaderboard data (CSV/JSON)
- Highlight improving/declining players
- Show move count for each player in round
- Animation when scores update
- Sound effects for modal open/close
- Persistent URL params across page reloads
- Custom password configuration via environment variables

## Files Modified

### Frontend
- `frontend/src/App.jsx`
  - Added URL query parameter detection
  - Updated join screen UI
  - Added teacher modal component
  - Made modals dismissible by overlay click
  - Added roundResults state management

### Backend
- No changes required

## Breaking Changes

⚠️ **Users can no longer select their role from a dropdown**
- Must use URL query parameters
- Existing bookmarks/links may need updating
- Students don't need to change anything (default is student)

## Passwords

**Default Credentials:**
- Teacher: `teacher123`
- Admin: `admin456`

These are hardcoded in `backend/server.js` and can be changed there.
