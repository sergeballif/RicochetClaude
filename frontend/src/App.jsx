import React, { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import HexBoard from './components/HexBoard';
import { HexUtils } from './utils/hexUtils';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

function App() {
  const [socket, setSocket] = useState(null);
  const [joined, setJoined] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [players, setPlayers] = useState([]);
  const [selectedRobot, setSelectedRobot] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [statusMessage, setStatusMessage] = useState('Waiting for game to start...');
  const [lastSolution, setLastSolution] = useState(null);
  const [roundResults, setRoundResults] = useState(null);
  const [showTeacherModal, setShowTeacherModal] = useState(false);

  // Join form state
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  // Detect role from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const roleFromURL = urlParams.get('role') || 'student';
  const [role] = useState(roleFromURL);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 60000, // 60 seconds for Render.com wake-up
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');

      // Auto-rejoin if we were previously in a game
      if (joined && name) {
        console.log('Auto-rejoining game as', name);
        newSocket.emit('join', { name, role, password });
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      console.log('Cleaning up socket connection');
      newSocket.close();
    };
  }, []);

  // Memoize simulateSlide to prevent unnecessary recalculations
  const simulateSlide = useCallback((startPos, direction, robotColor = null, stateToUse = null) => {
    const state = stateToUse || gameState;
    if (!state || !state.playerState) return startPos;

    let current = { ...startPos };
    const walls = new Set([...(state.internalWalls || []), ...(state.perimeterWalls || [])]);
    const robotToExclude = robotColor || selectedRobot;

    // Get occupied positions from player's robot state
    const occupied = new Set(
      Object.entries(state.playerState.robots)
        .filter(([color]) => color !== robotToExclude)
        .map(([, pos]) => HexUtils.toKey(pos))
    );

    while (true) {
      const next = HexUtils.neighbor(current, direction);
      const edgeKey = HexUtils.edgeKey(current, next);

      // Check wall
      if (walls.has(edgeKey)) break;

      // Check boundary
      if (!HexUtils.isWithinRadius(next, state.radius)) break;

      // Check other robots
      if (occupied.has(HexUtils.toKey(next))) break;

      current = next;
    }

    return current;
  }, [gameState, selectedRobot]);

  // Recalculate possible moves whenever robot positions change or selection changes
  useEffect(() => {
    if (selectedRobot && gameState && gameState.playerState && gameState.playerState.robots) {
      const moves = [];
      const currentPos = gameState.playerState.robots[selectedRobot];

      // Try all 6 directions
      for (let dir = 0; dir < 6; dir++) {
        const result = simulateSlide(currentPos, dir, selectedRobot, gameState);
        if (result && !HexUtils.equals(result, currentPos)) {
          moves.push({
            position: result,
            direction: dir
          });
        }
      }

      setPossibleMoves(moves);
    } else {
      setPossibleMoves([]);
    }
  }, [selectedRobot, gameState?.playerState?.robots, gameState, simulateSlide]);

  useEffect(() => {
    if (!socket) return;

    socket.on('gameState', (state) => {
      setGameState(state);
    });

    socket.on('playersUpdate', (playersList) => {
      setPlayers(playersList);
    });

    socket.on('moveResult', (result) => {
      // Update local game state with move result
      setGameState(prev => {
        const isPracticeMode = prev.round === 0;
        return {
          ...prev,
          playerState: {
            ...prev.playerState,
            robots: {
              ...prev.playerState.robots,
              [result.robotColor]: result.finalPosition
            },
            // Update the correct move count field based on mode
            ...(isPracticeMode
              ? { practiceMoveCount: result.currentMoves }
              : { currentMoves: result.currentMoves }
            ),
            trail: result.trail
          }
        };
      });
      // Keep robot selected - the useEffect will automatically recalculate possible moves
    });

    socket.on('solutionFound', (data) => {
      // Update player's round score
      setGameState(prev => ({
        ...prev,
        playerState: {
          ...prev.playerState,
          roundScore: data.score
        }
      }));

      // Update status message and last solution
      setStatusMessage(data.isFirst ? '🎉 First Solution Found!' : '✓ Solution Found!');
      setLastSolution(data);
    });

    socket.on('globalUpdate', (data) => {
      setGameState(prev => ({
        ...prev,
        ...data
      }));

      // Show notification if new global shortest was found
      if (data.newGlobalShortest) {
        setError('New shortest path found! Scores updated.');
        setTimeout(() => setError(null), 3000);
      }
    });

    socket.on('scoreUpdated', (data) => {
      // Update player's score when it's recalculated due to new global shortest
      setGameState(prev => ({
        ...prev,
        playerState: {
          ...prev.playerState,
          roundScore: data.score
        }
      }));

      // Update status message
      setStatusMessage(`📊 Score Updated: ${data.score.toFixed(2)}`);
    });

    socket.on('roundStart', (data) => {
      setGameState(prev => ({
        ...prev,
        round: data.round,
        target: data.target,
        robots: data.robots,
        playerState: {
          ...prev.playerState,
          robots: data.robots, // Set player's robots to same starting positions
          currentMoves: 0,
          trail: [],
          roundScore: 0
        }
      }));
      setSelectedRobot(null);
      setPossibleMoves([]);
      setLastSolution(null);
      setShowTeacherModal(false); // Auto-close teacher modal when new round starts
      setStatusMessage(`Round ${data.round} - Move the ${data.target.color} robot to the target!`);
    });

    socket.on('roundEnd', (data) => {
      setStatusMessage(`Round Complete! Shortest: ${data.globalShortestMoves} moves`);
      setRoundResults(data);

      // Show modal for all players
      setShowTeacherModal(true);
    });

    socket.on('practiceTargetReached', (data) => {
      // Update practice target and reset move count
      setGameState(prev => ({
        ...prev,
        playerState: {
          ...prev.playerState,
          practiceTarget: data.newTarget,
          practiceMoveCount: data.moveCount,
          trail: []
        }
      }));
      setSelectedRobot(null);
      setPossibleMoves([]);
      setStatusMessage(`🎯 Target reached! New target: ${data.newTarget.color} - ${data.moveCount} moves`);
    });

    socket.on('gameEnd', (data) => {
      setLeaderboard(data.leaderboard);
      setShowModal({ type: 'gameEnd', data });
    });

    socket.on('wallsRegenerated', (data) => {
      setGameState(prev => ({
        ...prev,
        internalWalls: data.internalWalls
      }));
    });

    socket.on('wallsUpdated', (data) => {
      setGameState(prev => ({
        ...prev,
        internalWalls: data.internalWalls
      }));
    });

    socket.on('timerUpdate', (data) => {
      setGameState(prev => ({
        ...prev,
        timeRemaining: data.timeRemaining
      }));
    });

    socket.on('nameChanged', (data) => {
      // Don't notify students when their name is changed
      if (role !== 'student') {
        alert(`Your name has been changed to: ${data.newName}`);
      }
    });

    socket.on('error', (data) => {
      setError(data.message);
      setTimeout(() => setError(null), 3000);
    });

    return () => {
      socket.off('gameState');
      socket.off('playersUpdate');
      socket.off('moveResult');
      socket.off('solutionFound');
      socket.off('globalUpdate');
      socket.off('scoreUpdated');
      socket.off('roundStart');
      socket.off('roundEnd');
      socket.off('gameEnd');
      socket.off('wallsRegenerated');
      socket.off('wallsUpdated');
      socket.off('timerUpdate');
      socket.off('nameChanged');
      socket.off('error');
    };
  }, [socket]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    socket.emit('join', { name, role, password });
    setJoined(true);
  };

  const handleHexClick = (hex) => {
    if (!gameState || !gameState.playerState) return;

    // Check if clicked on a robot
    const clickedRobot = Object.entries(gameState.playerState.robots).find(
      ([color, pos]) => HexUtils.equals(pos, hex)
    );

    if (clickedRobot) {
      const [color] = clickedRobot;

      // Toggle selection
      if (selectedRobot === color) {
        setSelectedRobot(null);
        // useEffect will clear possibleMoves when selectedRobot becomes null
      } else {
        setSelectedRobot(color);
        // useEffect will calculate possibleMoves when selectedRobot changes
      }
      return;
    }

    // Check if clicked on a possible move
    if (selectedRobot && possibleMoves.length > 0) {
      const move = possibleMoves.find(m => HexUtils.equals(m.position, hex));
      if (move) {
        socket.emit('moveRobot', {
          robotColor: selectedRobot,
          direction: move.direction
        });
      }
    }
  };

  const handleWallClick = (edgeKey) => {
    if (gameState?.playerState?.role === 'admin') {
      socket.emit('toggleWall', { edgeKey });
    }
  };

  const handleReset = () => {
    socket.emit('reset');
    setSelectedRobot(null);
    setPossibleMoves([]);
  };

  const handleStartNextRound = () => {
    socket.emit('startNextRound');
    setShowModal(null);
    setShowTeacherModal(false);
  };

  const handleRegenerateWalls = () => {
    socket.emit('regenerateWalls');
  };

  const handleRenamePlayer = (playerId) => {
    socket.emit('renamePlayer', { targetPlayerId: playerId, newName: 'Trouble' });
  };

  if (!joined) {
    return (
      <div className="join-screen">
        <form className="join-form" onSubmit={handleJoin}>
          <h1>Ricochet</h1>
          <p>Hexagonal puzzle game</p>

          {/* Only show role indicator for teacher/admin */}
          {role !== 'student' && (
            <div style={{
              marginBottom: '15px',
              padding: '10px',
              background: '#4a9eff',
              borderRadius: '5px',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              Joining as: {role === 'teacher' ? 'Teacher' : 'Admin'}
            </div>
          )}

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {(role === 'teacher' || role === 'admin') && (
            <input
              type="password"
              placeholder={`Enter ${role} password`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}

          <button type="submit">Join Game</button>
        </form>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="join-screen">
        <div className="join-form">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {error && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          background: '#e94560',
          color: 'white',
          padding: '15px 20px',
          borderRadius: '5px',
          zIndex: 1000
        }}>
          {error}
        </div>
      )}

      {/* Teacher Modal for Round End */}
      {showTeacherModal && roundResults && (
        <div className="modal-overlay" onClick={() => setShowTeacherModal(false)}>
          <div className="modal" style={{ maxWidth: '1200px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <h2>Round {gameState?.round} Complete!</h2>
            <p style={{ marginBottom: '20px', color: '#4ade80' }}>
              Shortest Solution: {roundResults.globalShortestMoves} moves
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth > 900 ? '1fr 1fr 1fr' : window.innerWidth > 600 ? '1fr 1fr' : '1fr',
              gap: '20px'
            }}>
              {/* Round Leaders Column */}
              <div>
                <h3 style={{ marginBottom: '15px', color: '#4a9eff' }}>Round Leaders</h3>
                <div style={{ background: '#1a1a2e', padding: '15px', borderRadius: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                  {roundResults.roundScores && Object.values(roundResults.roundScores)
                    .sort((a, b) => b.roundScore - a.roundScore)
                    .map((score, i) => (
                      <div key={i} className="leaderboard-item" style={{ marginBottom: '8px' }}>
                        <span className="rank">#{i + 1}</span>
                        <span className="name">{score.name}</span>
                        <span className="score">+{score.roundScore.toFixed(2)}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Overall Leaders Column */}
              <div>
                <h3 style={{ marginBottom: '15px', color: '#4a9eff' }}>Overall Leaders</h3>
                <div style={{ background: '#1a1a2e', padding: '15px', borderRadius: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                  {roundResults.roundScores && Object.values(roundResults.roundScores)
                    .sort((a, b) => b.totalScore - a.totalScore)
                    .map((score, i) => (
                      <div key={i} className="leaderboard-item" style={{ marginBottom: '8px' }}>
                        <span className="rank">#{i + 1}</span>
                        <span className="name">{score.name}</span>
                        <span className="score">{score.totalScore.toFixed(2)}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Shortest Solution Board Column */}
              <div>
                <h3 style={{ marginBottom: '15px', color: '#4a9eff' }}>Shortest Solution</h3>
                <div style={{
                  background: '#1a1a2e',
                  padding: '15px',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '300px'
                }}>
                  {roundResults.globalShortestPath && gameState ? (
                    <div style={{ width: '100%', height: '350px' }}>
                      <HexBoard
                        gameState={gameState}
                        onHexClick={() => {}}
                        onWallClick={null}
                        selectedRobot={null}
                        possibleMoves={[]}
                        trail={roundResults.globalShortestPath}
                        isAdmin={false}
                      />
                    </div>
                  ) : (
                    <p style={{ color: '#aaa' }}>No solution found</p>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {(role === 'teacher' || role === 'admin') && (
                <button
                  onClick={handleStartNextRound}
                  style={{ background: '#4ade80', color: 'white', padding: '12px 30px' }}
                >
                  Start Next Round
                </button>
              )}
              <button
                onClick={() => setShowTeacherModal(false)}
                style={{ background: '#4a9eff', color: 'white', padding: '12px 30px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {showModal.type === 'solution' && (
              <>
                <h2>{showModal.data?.isFirst ? '🎉 First Solution!' : '✓ Solution Found!'}</h2>
                <p>Moves: {showModal.data?.moveCount}</p>
                <p>Score: +{showModal.data?.score?.toFixed(2)}</p>
              </>
            )}

            {showModal.type === 'scoreUpdate' && (
              <>
                <h2>📊 Score Updated!</h2>
                <p>New Score: {showModal.data?.score?.toFixed(2)}</p>
                <p style={{ fontSize: '14px', color: '#aaa' }}>{showModal.data?.reason}</p>
              </>
            )}

            {showModal.type === 'roundStart' && (
              <>
                <h2>Round {showModal.data?.round}</h2>
                <p>Move the {showModal.data?.target?.color} robot to the target!</p>
              </>
            )}

            {showModal.type === 'roundEnd' && (
              <>
                <h2>Round Complete!</h2>
                <p>Shortest solution: {showModal.data?.globalShortestMoves} moves</p>
                <div style={{ marginTop: 20 }}>
                  <h3>Scores:</h3>
                  {showModal.data?.roundScores && Object.values(showModal.data.roundScores).map((score, i) => (
                    <div key={i} style={{ marginTop: 10 }}>
                      {score.name}: +{score.roundScore.toFixed(2)} (Total: {score.totalScore.toFixed(2)})
                    </div>
                  ))}
                </div>
                {(gameState?.playerState?.role === 'teacher' || gameState?.playerState?.role === 'admin') && (
                  <button onClick={handleStartNextRound}>Next Round</button>
                )}
              </>
            )}

            {showModal.type === 'gameEnd' && (
              <>
                <h2>Game Over!</h2>
                <h3>Final Leaderboard</h3>
                {showModal.data?.leaderboard?.map((player, i) => (
                  <div key={i} className="leaderboard-item">
                    <span className="rank">#{i + 1}</span>
                    <span className="name">{player.name}</span>
                    <span className="score">{player.totalScore.toFixed(2)}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      <div className="game-container">
        <div className="board-section">
          <HexBoard
            gameState={gameState}
            onHexClick={handleHexClick}
            onWallClick={handleWallClick}
            selectedRobot={selectedRobot}
            possibleMoves={possibleMoves}
            trail={gameState.playerState?.trail || []}
            isAdmin={gameState.playerState?.role === 'admin'}
          />
        </div>

        <div className="sidebar">
          <div className="panel" style={{ background: '#1a1a2e', border: '2px solid #4a9eff' }}>
            <h3>Status</h3>
            <p style={{ marginTop: '10px', fontSize: '14px', lineHeight: '1.5' }}>{statusMessage}</p>
            {lastSolution && (
              <div style={{ marginTop: '10px', padding: '10px', background: '#2a2a3e', borderRadius: '5px' }}>
                <div style={{ fontSize: '12px', color: '#4ade80' }}>
                  Last Solution: {lastSolution.moveCount} moves
                </div>
                <div style={{ fontSize: '12px', color: '#4ade80' }}>
                  Score: +{lastSolution.score.toFixed(2)}
                </div>
              </div>
            )}
          </div>

          <div className="panel">
            <h3>Game Status</h3>
            {gameState.round === 0 ? (
              <>
                <div style={{
                  background: 'linear-gradient(135deg, #6a9bc3 0%, #5a8db8 100%)',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  marginBottom: '15px',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}>
                  🎮 Practice Mode
                </div>
                <div className="score-display">
                  <span className="score-label">Moves:</span>
                  <span className="score-value">{gameState.playerState?.practiceMoveCount || 0}</span>
                </div>
                {gameState.playerState?.practiceTarget && (
                  <div className="score-display">
                    <span className="score-label">Target:</span>
                    <span className="score-value" style={{ textTransform: 'capitalize' }}>
                      {gameState.playerState.practiceTarget.color}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="score-display">
                  <span className="score-label">Round:</span>
                  <span className="score-value">{gameState.round} / {gameState.maxRounds}</span>
                </div>
                <div className="score-display">
                  <span className="score-label">Your Score:</span>
                  <span className="score-value">{gameState.playerState?.totalScore?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="score-display">
                  <span className="score-label">Round Score:</span>
                  <span className="score-value">
                    {gameState.playerState?.currentSolution?.score?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="score-display">
                  <span className="score-label">Current Moves:</span>
                  <span className="score-value">{gameState.playerState?.currentMoves || 0}</span>
                </div>
                {gameState.globalShortestMoves !== null && (
                  <div className="score-display">
                    <span className="score-label">Best Solution:</span>
                    <span className="score-value">{gameState.globalShortestMoves}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {gameState.timeRemaining !== null && (
            <div className={`timer ${gameState.timeRemaining > 30 ? 'waiting' : ''}`}>
              <h4>{gameState.timeRemaining > 30 ? 'Time to improve' : 'Time remaining'}</h4>
              <div className="time">{gameState.timeRemaining}s</div>
            </div>
          )}

          <div className="panel">
            <h3>Controls</h3>
            <div className="controls">
              {gameState.round === 0 ? (
                // Pre-game: Show Start Game button
                (gameState.playerState?.role === 'teacher' || gameState.playerState?.role === 'admin') && (
                  <button onClick={handleStartNextRound} style={{ background: '#4ade80', fontSize: '16px' }}>
                    Start Game
                  </button>
                )
              ) : (
                // During game: Show regular controls
                <>
                  <button onClick={handleReset}>Reset Position</button>
                  {(gameState.playerState?.role === 'teacher' || gameState.playerState?.role === 'admin') && (
                    <button onClick={handleStartNextRound}>Start Next Round</button>
                  )}
                </>
              )}
              {gameState.playerState?.role === 'admin' && (
                <button onClick={handleRegenerateWalls} className="danger">
                  Regenerate Walls
                </button>
              )}
            </div>
          </div>

          {/* Only show player list for teachers and admins */}
          {(role === 'teacher' || role === 'admin') && (
            <div className="panel">
              <h3>Players ({players.length})</h3>
              <div className="player-list">
                {players.map(player => (
                  <div key={player.id} className="player-item">
                    <span>
                      {player.name} ({player.role})
                    </span>
                    <span>{player.totalScore?.toFixed(2) || '0.00'}</span>
                    {gameState.playerState?.role === 'admin' && player.role === 'student' && (
                      <button onClick={() => handleRenamePlayer(player.id)}>
                        Rename
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
