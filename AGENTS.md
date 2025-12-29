Project Overview

Name: Ricochet
Concept: Real-time collaborative puzzle game where players simultaneously try to move colored robots on a shared hexagonal board to reach a colored target in the fewest moves possible, with sliding/ricochet mechanics.
Players: One Teacher (host), multiple Students (patrons), and one Admin (you).
Game Mode: Simultaneous puzzle-solving (not turn-based). Everyone sees the same board state in real time.
Duration: 15 rounds per full game.
Win Condition: Player with the highest total score after 15 rounds wins. Display top 3 on a leaderboard.
Tech Goals: Responsive for desktop and mobile. Real-time sync. Light anti-cheating. No long-term persistence needed (session-based).

Views / Roles & Access

Student View: Default at /ricochet (or root path). Players join by choosing a display name.
Teacher View: /ricochet?role=teacher — Password protected (simple shared password). Can start next round (new target placement).
Admin View: /ricochet?role=admin — Password protected (different/harder password). Full controls:
Start next round
Regenerate random walls (generate until satisfied)
View full real-time scoreboard
Rename any player's display name to "Trouble" (for inappropriate names)

Join Flow: On load, prompt for display name → join active session (single global room assumed, or simple room code if expanded later).

Board & Grid

Shape: Hexagonal grid of radius 6 (127 hexes total, centered).
Coordinates: Use cube coordinates (q, r, s with q + r + s = 0) or axial (q, r) — recommend cube for easier distance/neighbor calculations (see redblobgames.com/grids/hexagons for reference implementation).
Walls/Obstacles:
Fixed perimeter walls (board edge blocks movement).
Internal random walls: placed on edges between hexes (not blocking entire hexes).
Robots act as movable obstacles — movement stops when hitting a wall or another robot.

Board State: Fixed for all rounds unless Admin regenerates walls.
Regeneration: Admin button generates new random internal wall placement (keep perimeter fixed).

Robots, Target & Movement Mechanics

Robots: 4 distinct solid-colored circles (e.g., red, blue, green, yellow).
Target: Star shape, randomly assigned one of the 4 colors + placed on a random empty hex each round.
Movement:
Click robot → select it → highlight all possible stopping positions (in all 6 directions).
Robot slides in chosen direction until it hits any obstacle (wall or another robot), then stops.
No "must ricochet at least once" rule — direct path allowed if possible.
After stopping, next move can be in any of the 6 directions.
Other robots block movement (act as walls).

Interaction:
Click selected robot again → unselect.
Show low-opacity trail behind each moved robot (reset on round start or player reset).
Trails slightly offset per color to avoid visual overlap/mess.

Player Controls:
Reset button: revert to round-start robot positions (can retry multiple times).
Auto-detect when target robot reaches target (no explicit submit).
During 60s open phase: continue moving even after solution found (for practice), but score locked.


Round Flow & Timer

Round starts → new target color + position (synced to all).
Players move freely → first player to reach target triggers 60-second countdown for everyone.
During 60s: all players can continue improving solutions.
Round ends after 60s → show shortest solution path (animated visualization).
Teacher/Admin can manually advance to next round (new target).
After 15 rounds → game ends, show final leaderboard.

Scoring (Per Round, Per Player)

Base: +5 points if reached the target before time expired (i.e., during main phase or 60s window).
Time Bonus (individual): +3 − (0.05 × seconds elapsed since first solution was found), minimum 0.
Calculated from the exact moment the global first solution occurred.

Length Bonus (global shortest): +2 − (0.2 × moves beyond the global shortest found that round), minimum 0.
If player matches the global shortest (found by anyone), full +2.
Multiple players can get full bonus if they tie the shortest.

Final per round: Take the highest possible score a player achieved (they can improve solution multiple times before time expires).
Display: Show current round score + total score + countdown.

Real-time Sync & Backend Requirements

Use WebSockets (e.g., Socket.io) for:
Robot position updates (broadcast moves instantly).
First solution timestamp.
Global shortest move count + path (updated live when better found).
Round advancement.
Timer sync.

Anti-Cheating Measures (light, client-trust with server validation):
Server validates every move: check if slide path is legal (no teleporting, correct stopping point).
Server tracks move count per player solution.
Rate-limit excessive move packets.
Obfuscate/minify client code.
Server-only calculates scores, shortest path, first-solution time.
Password protect teacher/admin views (simple HTTP basic or query param check + session).


UI/UX Details

Shared View (all roles except admin extras): Board, robots, target, trails, move count, fewest moves (global), round timer, scores (round + total), 60s countdown.
Mobile/Desktop Responsive: Use canvas or SVG for board (canvas better for performance/trails).
Shortest Solution Display: Animated step-by-step path of the global best (after round ends).
Leaderboard: At game end (or live in admin), top 3 names + scores.
Graphics: Keep simple — solid color circles for robots, colored star for target.

Edge Cases to Handle

Multiple players find solution at nearly same time → server decides first.
Player resets after finding solution → keep their best score.
No one solves in time → no +5, bonuses 0.
Target placed unreachable (rare with random) → admin can regenerate walls if needed.
Disconnections → simple reconnect with name (no state loss needed).