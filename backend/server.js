const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const GameState = require('./src/gameState');

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000, // 60 seconds - how long to wait for pong before considering connection dead
  pingInterval: 25000, // 25 seconds - how often to send ping
  connectTimeout: 60000 // 60 seconds - connection timeout for initial connection
});

// Initialize game state
const gameState = new GameState();

// Simple health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Ricochet game server is running',
    currentRound: gameState.currentRound,
    players: Object.keys(gameState.players).length
  });
});

// Rate limiting map: socketId -> { lastMoveTime, moveCount }
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 1000; // 1 second
const MAX_MOVES_PER_WINDOW = 20;

function checkRateLimit(socketId) {
  const now = Date.now();
  const limit = rateLimits.get(socketId);

  if (!limit) {
    rateLimits.set(socketId, { lastMoveTime: now, moveCount: 1 });
    return true;
  }

  if (now - limit.lastMoveTime > RATE_LIMIT_WINDOW) {
    // Reset window
    rateLimits.set(socketId, { lastMoveTime: now, moveCount: 1 });
    return true;
  }

  if (limit.moveCount >= MAX_MOVES_PER_WINDOW) {
    return false; // Rate limited
  }

  limit.moveCount++;
  return true;
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle player join
  socket.on('join', (data) => {
    const { name, role = 'student', password } = data;

    // Validate role and password
    if (role === 'teacher' && password !== gameState.teacherPassword) {
      socket.emit('error', { message: 'Invalid teacher password' });
      return;
    }

    if (role === 'admin' && password !== gameState.adminPassword) {
      socket.emit('error', { message: 'Invalid admin password' });
      return;
    }

    // Add player to game
    gameState.addPlayer(socket.id, name, role);

    // Send initial state to the joining player
    socket.emit('gameState', gameState.getStateForClient(socket.id));

    // Broadcast player list update to everyone
    io.emit('playersUpdate', gameState.getAllPlayers());

    console.log(`Player joined: ${name} (${role})`);
  });

  // Handle robot move
  socket.on('moveRobot', (data) => {
    try {
      const { robotColor, direction } = data;
      const player = gameState.players[socket.id];

      if (!player) {
        socket.emit('error', { message: 'Player not found' });
        return;
      }

      // Check rate limit
      if (!checkRateLimit(socket.id)) {
        socket.emit('error', { message: 'Rate limit exceeded' });
        return;
      }

      // Validate and execute move on player's robot state
      const result = gameState.moveRobot(socket.id, robotColor, direction, player.robots);

      if (!result.valid) {
        socket.emit('error', { message: result.error });
        return;
      }

      // Update player's robot position
      player.robots[robotColor] = result.finalPosition;

      // In practice mode (round 0), use practice move count
      const isPracticeMode = gameState.currentRound === 0;
      if (isPracticeMode) {
        player.practiceMoveCount++;
      } else {
        player.currentMoves++;
      }

      // Add to trail
      player.trail.push({
        color: robotColor,
        path: result.path,
        direction
      });

      // Send updated state to the player
      socket.emit('moveResult', {
        robotColor,
        finalPosition: result.finalPosition,
        path: result.path,
        currentMoves: isPracticeMode ? player.practiceMoveCount : player.currentMoves,
        trail: player.trail
      });

      // Practice mode: check if practice target reached
      if (isPracticeMode && player.practiceTarget) {
        const targetReached = player.robots[player.practiceTarget.color].q === player.practiceTarget.position.q &&
                              player.robots[player.practiceTarget.color].r === player.practiceTarget.position.r &&
                              player.robots[player.practiceTarget.color].s === player.practiceTarget.position.s;

        if (targetReached) {
          // Respawn practice target
          const respawnResult = gameState.respawnPracticeTarget(socket.id);
          if (respawnResult.success) {
            socket.emit('practiceTargetReached', {
              newTarget: respawnResult.newTarget,
              moveCount: respawnResult.moveCount
            });
          }
        }
      }

      // Game mode: check if target reached
      if (!isPracticeMode) {
        const solutionCheck = gameState.checkSolution(
          socket.id,
          player.robots,
          player.currentMoves,
          player.trail
        );

        if (solutionCheck.solved) {
        // Send solution confirmation to player
        socket.emit('solutionFound', {
          isFirst: solutionCheck.isFirst,
          score: solutionCheck.score,
          moveCount: solutionCheck.moveCount
        });

        // Broadcast to all clients that someone found a solution
        io.emit('globalUpdate', {
          firstSolutionTime: gameState.firstSolutionTime,
          countdownStartTime: gameState.countdownStartTime,
          timeRemaining: gameState.getTimeRemaining(),
          globalShortestMoves: gameState.globalShortestMoves,
          newGlobalShortest: solutionCheck.newGlobalShortest
        });

        // If new global shortest found, broadcast updated scores to all players
        if (solutionCheck.newGlobalShortest && solutionCheck.updatedScores) {
          Object.entries(solutionCheck.updatedScores).forEach(([playerId, scoreData]) => {
            io.to(playerId).emit('scoreUpdated', {
              score: scoreData.score,
              moveCount: scoreData.moveCount,
              reason: 'New global shortest path found'
            });
          });
        }

        // If this is the first solution, start countdown checker
        if (solutionCheck.isFirst) {
          startCountdownChecker();
        }
        }
      }
    } catch (error) {
      console.error('Error handling moveRobot:', error);
      socket.emit('error', { message: 'An error occurred while moving the robot' });
    }
  });

  // Handle player reset
  socket.on('reset', () => {
    const player = gameState.players[socket.id];

    if (!player) {
      return;
    }

    // Reset player's robots to initial positions
    player.robots = JSON.parse(JSON.stringify(gameState.initialRobots));
    player.currentMoves = 0;
    player.trail = [];

    // Send updated state
    socket.emit('gameState', gameState.getStateForClient(socket.id));
  });

  // Handle start next round (teacher/admin only)
  socket.on('startNextRound', () => {
    const player = gameState.players[socket.id];

    if (!player || (player.role !== 'teacher' && player.role !== 'admin')) {
      socket.emit('error', { message: 'Unauthorized' });
      return;
    }

    // Finalize current round if there was one
    if (gameState.currentRound > 0) {
      const roundResults = gameState.finalizeRound();
      io.emit('roundEnd', roundResults);

      // Update player scores in sidebar
      io.emit('playersUpdate', gameState.getAllPlayers());
    }

    // Start new round
    const newRound = gameState.startNewRound();

    if (newRound.gameEnded) {
      // Game over, send final leaderboard
      const leaderboard = gameState.getLeaderboard();
      io.emit('gameEnd', { leaderboard });
      return;
    }

    // Send new round state to all players
    io.emit('roundStart', {
      round: newRound.round,
      target: newRound.target,
      robots: newRound.robots
    });

    // Send updated game state to each player
    Object.keys(gameState.players).forEach(playerId => {
      io.to(playerId).emit('gameState', gameState.getStateForClient(playerId));
    });
  });

  // Handle regenerate walls (admin only)
  socket.on('regenerateWalls', () => {
    const player = gameState.players[socket.id];

    if (!player || player.role !== 'admin') {
      socket.emit('error', { message: 'Unauthorized' });
      return;
    }

    gameState.regenerateWalls();

    // Broadcast new walls to everyone
    io.emit('wallsRegenerated', {
      internalWalls: Array.from(gameState.internalWalls)
    });

    // Send updated state to all players
    Object.keys(gameState.players).forEach(playerId => {
      io.to(playerId).emit('gameState', gameState.getStateForClient(playerId));
    });
  });

  // Handle toggle wall (admin only)
  socket.on('toggleWall', (data) => {
    const player = gameState.players[socket.id];

    if (!player || player.role !== 'admin') {
      socket.emit('error', { message: 'Unauthorized' });
      return;
    }

    const { edgeKey } = data;

    // Toggle the wall
    if (gameState.internalWalls.has(edgeKey)) {
      gameState.internalWalls.delete(edgeKey);
      gameState.allWalls.delete(edgeKey);
    } else {
      gameState.internalWalls.add(edgeKey);
      gameState.allWalls.add(edgeKey);
    }

    // Broadcast to everyone
    io.emit('wallsUpdated', {
      internalWalls: Array.from(gameState.internalWalls)
    });
  });

  // Handle rename player (admin only)
  socket.on('renamePlayer', (data) => {
    const { targetPlayerId, newName } = data;
    const player = gameState.players[socket.id];

    if (!player || player.role !== 'admin') {
      socket.emit('error', { message: 'Unauthorized' });
      return;
    }

    const success = gameState.renamePlayer(targetPlayerId, newName);

    if (success) {
      // Broadcast player list update
      io.emit('playersUpdate', gameState.getAllPlayers());

      // Notify the renamed player
      io.to(targetPlayerId).emit('nameChanged', { newName });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    gameState.removePlayer(socket.id);
    rateLimits.delete(socket.id);

    // Broadcast updated player list
    io.emit('playersUpdate', gameState.getAllPlayers());
  });
});

// Countdown checker
let countdownInterval = null;

function startCountdownChecker() {
  if (countdownInterval) {
    return; // Already running
  }

  countdownInterval = setInterval(() => {
    const timeRemaining = gameState.getTimeRemaining();

    // Broadcast time remaining
    io.emit('timerUpdate', {
      timeRemaining: timeRemaining
    });

    // Check if round should end (when time reaches 0)
    if (timeRemaining !== null && timeRemaining <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;

      // Finalize round
      const roundResults = gameState.finalizeRound();
      io.emit('roundEnd', roundResults);

      // Update player scores in sidebar
      io.emit('playersUpdate', gameState.getAllPlayers());
    }
  }, 1000);
}

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Ricochet server listening on port ${PORT}`);
  console.log(`Teacher password: ${gameState.teacherPassword}`);
  console.log(`Admin password: ${gameState.adminPassword}`);
});
