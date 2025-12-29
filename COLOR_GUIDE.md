# Color Customization Guide

All colors have been updated to a flatter, less vibrant theme. Here's where to find and customize each color.

## 🎨 Current Color Palette

### Main Theme Colors
- **Dark Background**: `#1a1a1a` (very dark gray)
- **Panels/Cards**: `#2a2a2a` (dark gray)
- **Board Background**: `#4a4a4a` (medium gray)
- **Primary Accent**: `#6a9bc3` (muted blue)
- **Walls**: `#c8834a` (muted orange)
- **Success/Green**: `#6ab880` (muted green)
- **Danger/Red**: `#c85a6a` (muted red)

---

## 📁 Color Locations by File

### `frontend/src/index.css` - UI Colors

**Background & Layout:**
- Line 13: `background: #1a1a1a` - Main page background
- Line 116: `background: linear-gradient(135deg, #1a1a1a 0%, #252525 100%)` - Join screen gradient

**Panels & Cards:**
- Line 55: `background: #2a2a2a` - Input fields
- Line 98: `background: #2a2a2a` - Side panel backgrounds
- Line 120: `background: #2a2a2a` - Join form background
- Line 221: `background: #1a1a1a` - Leaderboard item background
- Line 257: `background: #1a1a1a` - Player item background
- Line 284: `background: #2a2a2a` - Modal background

**Blue Accents:**
- Line 61: `border-color: #6a9bc3` - Input focus border
- Line 107: `color: #6a9bc3` - Panel headings
- Line 130: `color: #6a9bc3` - Join form title
- Line 148: `background: #6a9bc3` - Primary buttons
- Line 155: `background: #5a8db8` - Button hover (darker blue)
- Line 170: `color: #6a9bc3` - Score values
- Line 183: `background: linear-gradient(135deg, #6a9bc3 0%, #5a8db8 100%)` - Timer waiting state
- Line 204: `background: #6a9bc3` - Control buttons
- Line 228: `color: #6a9bc3` - Leaderboard rank numbers
- Line 294: `color: #6a9bc3` - Modal headings
- Line 299: `background: #6a9bc3` - Modal buttons

**Red/Danger:**
- Line 177: `background: linear-gradient(135deg, #c85a6a 0%, #b85060 100%)` - Timer countdown
- Line 209: `background: #c85a6a` - Danger buttons
- Line 266: `background: #c85a6a` - Player rename button

**Green/Success:**
- Line 238: `color: #6ab880` - Score numbers in leaderboard

---

### `frontend/src/components/HexBoard.jsx` - Canvas/Board Colors

**Board Background:**
- Line 375: `background: '#4a4a4a'` - Medium gray board

**Hex Highlighting (Possible Moves):**
- Line 103: `ctx.fillStyle = 'rgba(106, 155, 195, 0.3)'` - Highlighted hex fill (muted blue, 30% opacity)
- Line 112: `ctx.strokeStyle = 'rgba(106, 155, 195, 0.6)'` - Direction arrow (muted blue, 60% opacity)

**Hex Outlines:**
- Line 123: `ctx.strokeStyle = '#333'` - Normal hex borders

**Walls:**
- Line 134: `ctx.strokeStyle = '#c8834a'` - Perimeter walls (muted orange)
- Line 153: `ctx.strokeStyle = '#c8834a'` - Internal walls (muted orange)

**Robot Colors (Muted Versions):**
- **Line 5-10**: `COLOR_MAP` object - Defines all robot/target colors:
  - Red: `#ef4444`
  - Blue: `#3b82f6`
  - Green: `#22c55e`
  - Yellow: `#eab308`
- Line 186: Color mapping applied to robots
- Line 190: `ctx.strokeStyle = '#ffffff'` - Selection ring (white)
- Line 198: `ctx.fillStyle = hexColor` - Robot body (uses COLOR_MAP)
- Line 204: `ctx.strokeStyle = '#000'` - Robot outline (black)

**Target Star:**
- Line 214: Color mapping applied (uses COLOR_MAP)
- Line 217: `ctx.fillStyle = hexColor` - Solid star fill (no outline)
- Line 236: `ctx.strokeStyle = hexColor` - Pulsing outline (subtle)

**Move Trails:**
- Line 268: Color mapping applied (uses COLOR_MAP)
- Line 270: `ctx.strokeStyle = hexColor` - Trail color (muted versions)

---

## 🎨 Quick Customization Examples

### Change Robot Colors

All robot and target colors are defined in **one place** at the top of `HexBoard.jsx`:

```javascript
// In HexBoard.jsx lines 5-10:
const COLOR_MAP = {
  red: '#ef4444',     // Change this for red robots/targets
  blue: '#3b82f6',    // Change this for blue robots/targets
  green: '#22c55e',   // Change this for green robots/targets
  yellow: '#eab308'   // Change this for yellow robots/targets
};
```

**Example - Pastel Colors:**
```javascript
const COLOR_MAP = {
  red: '#fca5a5',
  blue: '#93c5fd',
  green: '#86efac',
  yellow: '#fde047'
};
```

**Example - Neon Colors:**
```javascript
const COLOR_MAP = {
  red: '#ff006e',
  blue: '#00f5ff',
  green: '#39ff14',
  yellow: '#ffff00'
};
```

This changes robots, targets, and trails all at once!

---

### Make it Even Darker
```css
/* In index.css */
body { background: #0f0f0f; }
.panel { background: #1a1a1a; }
.leaderboard-item { background: #0f0f0f; }
```

### Change Accent Color to Purple
```css
/* In index.css - Replace all #6a9bc3 with: */
#9b7bc3 /* muted purple */

/* In HexBoard.jsx - Replace rgba(106, 155, 195, ...) with: */
rgba(155, 123, 195, ...) /* muted purple */
```

### Lighter Board
```javascript
// In HexBoard.jsx line 375:
background: '#606060' // Lighter gray
```

### Different Wall Color (e.g., Teal)
```javascript
// In HexBoard.jsx lines 134 and 153:
ctx.strokeStyle = '#5a9b9b'; // Muted teal
```

---

## 🔧 Making Color Changes

1. **Edit the files** using the line numbers above
2. **Rebuild the frontend**:
   ```bash
   cd frontend
   npm run build
   ```
3. **Copy dist contents** to your website's `/ricochet` folder
4. **Refresh browser** (hard refresh with Ctrl+F5 or Cmd+Shift+R)

---

## 💡 Color Design Tips

**For Flat Design:**
- Avoid gradients (use solid colors)
- Keep saturation low (grays with slight color tint)
- Use subtle contrast (not too dark, not too bright)

**Current Palette Works Well Because:**
- Background (#1a1a1a) is very dark but not pure black
- Panels (#2a2a2a) are slightly lighter for depth
- Board (#4a4a4a) is medium gray for contrast
- Accents (#6a9bc3, #c8834a) are muted but visible
- All colors have similar saturation levels

**Try These Combinations:**
- **Blue-Gray Theme**: Blues with gray backgrounds (current)
- **Warm Theme**: Browns/oranges with dark backgrounds
- **Cool Theme**: Teals/cyans with dark backgrounds
- **Monochrome**: All grays, no color (ultra-flat)

---

## 📊 Color Values Table

| Element | Current Color | Hex Code | RGB |
|---------|--------------|----------|-----|
| **Background Colors** | | | |
| Page Background | Very Dark Gray | #1a1a1a | (26, 26, 26) |
| Panels | Dark Gray | #2a2a2a | (42, 42, 42) |
| Board Background | Medium Gray | #4a4a4a | (74, 74, 74) |
| **UI Accent Colors** | | | |
| Blue Accent | Muted Blue | #6a9bc3 | (106, 155, 195) |
| Blue Hover | Darker Muted Blue | #5a8db8 | (90, 141, 184) |
| Walls | Muted Orange | #c8834a | (200, 131, 74) |
| Success Green | Muted Green | #6ab880 | (106, 184, 128) |
| Danger Red | Muted Red | #c85a6a | (200, 90, 106) |
| Red Hover | Darker Muted Red | #b85060 | (184, 80, 96) |
| **Robot/Target Colors** | | | |
| Red Robot | Muted Red | #ef4444 | (239, 68, 68) |
| Blue Robot | Muted Blue | #3b82f6 | (59, 130, 246) |
| Green Robot | Muted Green | #22c55e | (34, 197, 94) |
| Yellow Robot | Muted Yellow | #eab308 | (234, 179, 8) |

Enjoy your new flat, muted color scheme! 🎨
