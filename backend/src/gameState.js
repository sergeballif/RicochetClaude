const HexUtils = require('./hexUtils');
const BoardGenerator = require('./boardGenerator');

// ========== CUSTOM WALL CONFIGURATION ==========
// To set a custom wall layout:
// 1. Use admin mode to design your wall layout
// 2. Click "Export Walls to Console" button
// 3. Copy the array from the server logs
// 4. Paste it into the CUSTOM_WALLS array below
// 5. Set USE_CUSTOM_WALLS = true

const USE_CUSTOM_WALLS = false; // Set to true to use custom walls

const CUSTOM_WALLS = [
  // Paste your exported wall configuration here
  // Example: "0,0,0|0,1,-1", "0,0,0|1,0,-1", etc.
];
// ===============================================

class GameState {
  constructor() {
    this.boardGenerator = new BoardGenerator(6);
    this.radius = 6;

    // Board state
    this.internalWalls = new Set();
    this.allWalls = new Set();

    // Game state
    this.robots = {};
    this.initialRobots = {};
    this.target = null;
    this.currentRound = 0;
    this.maxRounds = 15;

    // Player state
    this.players = {}; // socketId -> {name, role, totalScore, currentMoves, currentSolution, trail}

    // Round timing
    this.roundStartTime = null;
    this.firstSolutionTime = null;
    this.firstSolutionPlayer = null;
    this.countdownStartTime = null;
    this.globalShortestMoves = null;
    this.globalShortestPath = null;
    this.roundFinalized = false; // Track if current round has been finalized

    // Passwords - read from environment variables for security
    // NEVER commit real passwords to GitHub!
    this.teacherPassword = process.env.TEACHER_PASSWORD || 'teacher123';
    this.adminPassword = process.env.ADMIN_PASSWORD || 'admin456';

    this.initialize();
  }

  initialize() {
    this.regenerateWalls();
    this.robots = this.boardGenerator.initializeRobots();
    this.initialRobots = JSON.parse(JSON.stringify(this.robots));
  }

  regenerateWalls() {
    if (USE_CUSTOM_WALLS && CUSTOM_WALLS.length > 0) {
      // Use custom wall configuration
      this.internalWalls = new Set(CUSTOM_WALLS);
    } else {
      // Generate random walls
      this.internalWalls = this.boardGenerator.generateWalls(0.15);
    }
    this.allWalls = this.boardGenerator.getAllWalls(this.internalWalls);
  }

  resetToPracticeMode() {
    // Reset to round 0 (practice mode)
    this.currentRound = 0;
    this.target = null;
    this.roundStartTime = null;
    this.firstSolutionTime = null;
    this.firstSolutionPlayer = null;
    this.countdownStartTime = null;
    this.globalShortestMoves = null;
    this.globalShortestPath = null;
    this.roundFinalized = false;

    // Give each player their own random practice positions
    Object.keys(this.players).forEach(playerId => {
      const playerRobots = this.boardGenerator.initializeRobots();
      const occupiedHexes = Object.values(playerRobots);
      const practiceTarget = this.boardGenerator.generateTarget(occupiedHexes);

      this.players[playerId].robots = playerRobots;
      this.players[playerId].practiceTarget = practiceTarget;
      this.players[playerId].practiceMoveCount = 0;
      this.players[playerId].currentMoves = 0;
      this.players[playerId].currentSolution = null;
      this.players[playerId].trail = [];
      this.players[playerId].roundScore = 0;
      // Keep totalScore - don't reset between games
    });
  }

  startNewRound() {
    if (this.currentRound >= this.maxRounds) {
      return { gameEnded: true };
    }

    this.currentRound++;

    // Reset robots to initial positions
    this.robots = JSON.parse(JSON.stringify(this.initialRobots));

    // Generate new target
    const occupiedHexes = Object.values(this.robots);
    this.target = this.boardGenerator.generateTarget(occupiedHexes);

    // Reset round timing
    this.roundStartTime = Date.now();
    this.firstSolutionTime = null;
    this.firstSolutionPlayer = null;
    this.countdownStartTime = null;
    this.globalShortestMoves = null;
    this.globalShortestPath = null;
    this.roundFinalized = false; // Reset for new round

    // Reset player states for new round - IMPORTANT: give all players the same robot positions
    Object.keys(this.players).forEach(playerId => {
      this.players[playerId].currentMoves = 0;
      this.players[playerId].currentSolution = null;
      this.players[playerId].trail = [];
      this.players[playerId].roundScore = 0;
      this.players[playerId].robots = JSON.parse(JSON.stringify(this.robots)); // Same starting positions for all
    });

    return {
      round: this.currentRound,
      target: this.target,
      robots: this.robots,
      gameEnded: false
    };
  }

  /**
   * Validate and execute a robot move
   */
  moveRobot(playerId, robotColor, direction, playerRobots) {
    // Validate direction
    if (direction < 0 || direction > 5) {
      return { valid: false, error: 'Invalid direction' };
    }

    // Get current robot position from player's state
    const currentPos = playerRobots[robotColor];
    if (!currentPos) {
      return { valid: false, error: 'Robot not found' };
    }

    // Simulate the slide using player's robot positions
    const result = this.simulateSlide(currentPos, direction, playerRobots);

    return result;
  }

  /**
   * Simulate a robot sliding in a direction until it hits an obstacle
   */
  simulateSlide(startPos, direction, robotPositions) {
    let current = { ...startPos };
    const path = [{ ...current }];

    // Create a set of occupied positions (other robots)
    const occupiedPositions = new Set();
    Object.entries(robotPositions).forEach(([color, pos]) => {
      const key = HexUtils.toKey(pos);
      occupiedPositions.add(key);
    });

    // Remove starting position from occupied (robot is moving from here)
    occupiedPositions.delete(HexUtils.toKey(current));

    // Slide until hitting obstacle
    while (true) {
      const next = HexUtils.neighbor(current, direction);
      const edgeKey = HexUtils.edgeKey(current, next);
      const nextKey = HexUtils.toKey(next);

      // Check if there's a wall
      if (this.allWalls.has(edgeKey)) {
        break;
      }

      // Check if next hex is outside board
      if (!HexUtils.isWithinRadius(next, this.radius)) {
        break;
      }

      // Check if there's another robot
      if (occupiedPositions.has(nextKey)) {
        break;
      }

      // Move to next hex
      current = next;
      path.push({ ...current });
    }

    return {
      valid: true,
      finalPosition: current,
      path: path
    };
  }

  /**
   * Check if a player has reached the target
   */
  checkSolution(playerId, playerRobots, moveCount, trail) {
    // No target if round hasn't started yet
    if (!this.target) {
      return { solved: false };
    }

    const targetRobot = playerRobots[this.target.color];
    const targetReached = HexUtils.equals(targetRobot, this.target.position);

    if (!targetReached) {
      return { solved: false };
    }

    const now = Date.now();
    let newGlobalShortest = false;

    // Check if this is the first solution
    if (!this.firstSolutionTime) {
      this.firstSolutionTime = now;
      this.firstSolutionPlayer = playerId;
      this.countdownStartTime = now;
      this.globalShortestMoves = moveCount;
      this.globalShortestPath = [...trail];
      newGlobalShortest = true;
    } else {
      // Update global shortest if this is better
      if (moveCount < this.globalShortestMoves) {
        this.globalShortestMoves = moveCount;
        this.globalShortestPath = [...trail];
        newGlobalShortest = true;
      }
    }

    // Calculate score for this player
    const scoreBreakdown = this.calculateScore(moveCount, now);

    // Update player's best solution if better
    const player = this.players[playerId];
    if (!player.currentSolution || scoreBreakdown.totalScore > player.currentSolution.totalScore) {
      player.currentSolution = {
        moveCount,
        totalScore: scoreBreakdown.totalScore,
        finishBonus: scoreBreakdown.finishBonus,
        speedBonus: scoreBreakdown.speedBonus,
        lengthBonus: scoreBreakdown.lengthBonus,
        time: now,
        trail: [...trail]
      };
    }

    // If a new global shortest was found, recalculate ALL players' scores
    const updatedScores = {};
    if (newGlobalShortest) {
      Object.entries(this.players).forEach(([pId, p]) => {
        if (p.currentSolution) {
          const recalculatedScore = this.calculateScore(
            p.currentSolution.moveCount,
            p.currentSolution.time
          );
          // Always update to recalculated score (can go down)
          p.currentSolution.totalScore = recalculatedScore.totalScore;
          p.currentSolution.finishBonus = recalculatedScore.finishBonus;
          p.currentSolution.speedBonus = recalculatedScore.speedBonus;
          p.currentSolution.lengthBonus = recalculatedScore.lengthBonus;
          updatedScores[pId] = {
            score: recalculatedScore.totalScore,
            moveCount: p.currentSolution.moveCount
          };
        }
      });
    }

    return {
      solved: true,
      isFirst: this.firstSolutionPlayer === playerId,
      score: scoreBreakdown.totalScore,
      moveCount,
      globalShortestMoves: this.globalShortestMoves,
      newGlobalShortest,
      updatedScores: newGlobalShortest ? updatedScores : null
    };
  }

  /**
   * Calculate score for a solution with breakdown
   */
  calculateScore(moveCount, solutionTime) {
    const finishBonus = 3;

    // Time bonus (if first solution exists)
    let speedBonus = 0;
    if (this.firstSolutionTime) {
      const secondsElapsed = (solutionTime - this.firstSolutionTime) / 1000;
      speedBonus = Math.max(0, 3 - (0.05 * secondsElapsed));
    }

    // Length bonus (if global shortest exists)
    let lengthBonus = 0;
    if (this.globalShortestMoves !== null) {
      const movesAboveShortest = moveCount - this.globalShortestMoves;
      lengthBonus = Math.max(0, 4 - (0.2 * movesAboveShortest));
    }

    const totalScore = finishBonus + speedBonus + lengthBonus;

    return {
      finishBonus: Math.round(finishBonus * 100) / 100,
      speedBonus: Math.round(speedBonus * 100) / 100,
      lengthBonus: Math.round(lengthBonus * 100) / 100,
      totalScore: Math.round(totalScore * 100) / 100
    };
  }

  /**
   * Finalize round scores
   */
  finalizeRound() {
    // If round already finalized, return cached results without modifying scores
    if (this.roundFinalized) {
      const roundScores = {};
      Object.entries(this.players).forEach(([playerId, player]) => {
        roundScores[playerId] = {
          name: player.name,
          roundScore: player.roundScore,
          totalScore: player.totalScore,
          moveCount: player.currentSolution ? player.currentSolution.moveCount : null
        };
      });
      return {
        roundScores,
        globalShortestMoves: this.globalShortestMoves,
        globalShortestPath: this.globalShortestPath
      };
    }

    // First time finalizing - calculate and add scores
    const roundScores = {};

    Object.entries(this.players).forEach(([playerId, player]) => {
      const score = player.currentSolution ? player.currentSolution.totalScore : 0;
      player.totalScore = Math.round(((player.totalScore || 0) + score) * 100) / 100;
      player.roundScore = score;
      roundScores[playerId] = {
        name: player.name,
        roundScore: score,
        totalScore: player.totalScore,
        moveCount: player.currentSolution ? player.currentSolution.moveCount : null
      };
    });

    // Mark round as finalized
    this.roundFinalized = true;

    return {
      roundScores,
      globalShortestMoves: this.globalShortestMoves,
      globalShortestPath: this.globalShortestPath
    };
  }

  /**
   * Get leaderboard (top 3)
   */
  getLeaderboard() {
    const scores = Object.entries(this.players)
      .map(([id, player]) => ({
        id,
        name: player.name,
        totalScore: player.totalScore || 0
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 3);

    return scores;
  }

  /**
   * Add a new player
   */
  addPlayer(socketId, name, role = 'student') {
    // In round 0 (practice mode), give each player random positions
    let playerRobots;
    let practiceTarget = null;
    let practiceMoveCount = 0;

    if (this.currentRound === 0) {
      // Generate random practice positions for this player
      playerRobots = this.boardGenerator.initializeRobots();
      const occupiedHexes = Object.values(playerRobots);
      practiceTarget = this.boardGenerator.generateTarget(occupiedHexes);
      practiceMoveCount = 0;
    } else {
      // In active game, use the shared robot positions
      playerRobots = JSON.parse(JSON.stringify(this.robots));
    }

    this.players[socketId] = {
      name,
      role,
      totalScore: 0,
      currentMoves: 0,
      currentSolution: null,
      trail: [],
      roundScore: 0,
      robots: playerRobots,
      practiceTarget: practiceTarget,
      practiceMoveCount: practiceMoveCount
    };
  }

  /**
   * Remove a player
   */
  removePlayer(socketId) {
    delete this.players[socketId];
  }

  /**
   * Rename a player (admin function)
   */
  renamePlayer(socketId, newName) {
    if (this.players[socketId]) {
      this.players[socketId].name = newName;
      return true;
    }
    return false;
  }

  /**
   * Respawn practice target for a player (practice mode only)
   */
  respawnPracticeTarget(playerId) {
    const player = this.players[playerId];
    if (!player || this.currentRound !== 0) {
      return { success: false };
    }

    // Generate new practice target
    const occupiedHexes = Object.values(player.robots);
    player.practiceTarget = this.boardGenerator.generateTarget(occupiedHexes);
    player.practiceMoveCount = 0;
    player.trail = [];

    return {
      success: true,
      newTarget: player.practiceTarget,
      moveCount: 0
    };
  }

  /**
   * Get time remaining in countdown (in seconds)
   */
  getTimeRemaining() {
    if (!this.countdownStartTime) {
      return null;
    }

    const elapsed = (Date.now() - this.countdownStartTime) / 1000;
    const remaining = Math.max(0, 60 - elapsed);

    return Math.round(remaining);
  }

  /**
   * Check if round should end
   */
  shouldEndRound() {
    if (!this.countdownStartTime) {
      return false;
    }

    const elapsed = (Date.now() - this.countdownStartTime) / 1000;
    return elapsed >= 60;
  }

  /**
   * Get current game state for clients
   */
  getStateForClient(socketId = null) {
    const state = {
      round: this.currentRound,
      maxRounds: this.maxRounds,
      robots: this.robots,
      initialRobots: this.initialRobots,
      target: this.target,
      internalWalls: Array.from(this.internalWalls),
      perimeterWalls: Array.from(this.boardGenerator.getPerimeterWalls()),
      radius: this.radius,
      firstSolutionTime: this.firstSolutionTime,
      countdownStartTime: this.countdownStartTime,
      timeRemaining: this.getTimeRemaining(),
      globalShortestMoves: this.globalShortestMoves
    };

    // Add player-specific state if socketId provided
    if (socketId && this.players[socketId]) {
      const player = this.players[socketId];
      state.playerState = {
        name: player.name,
        role: player.role,
        totalScore: player.totalScore,
        roundScore: player.roundScore,
        currentMoves: player.currentMoves,
        robots: player.robots, // Player's own robot state
        trail: player.trail,
        practiceTarget: player.practiceTarget, // Practice mode target
        practiceMoveCount: player.practiceMoveCount, // Practice mode moves
        currentSolution: player.currentSolution // Best solution so far this round
      };
    }

    return state;
  }

  /**
   * Get all players info (for admin/leaderboard)
   */
  getAllPlayers() {
    return Object.entries(this.players).map(([id, player]) => ({
      id,
      name: player.name,
      role: player.role,
      totalScore: player.totalScore || 0,
      roundScore: player.roundScore || 0,
      currentMoves: player.currentMoves || 0
    }));
  }
}

module.exports = GameState;
