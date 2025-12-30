import React, { useEffect, useRef, useState } from 'react';
import { HexUtils } from '../utils/hexUtils';

// Color mapping for robots and targets - muted versions
const COLOR_MAP = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308'
};

const HexBoard = ({
  gameState,
  onHexClick,
  onWallClick,
  selectedRobot,
  possibleMoves,
  trail,
  isAdmin
}) => {
  const canvasRef = useRef(null);
  const [hexSize, setHexSize] = useState(30);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      const container = canvas.parentElement;
      const size = Math.min(container.clientWidth, container.clientHeight);
      canvas.width = size;
      canvas.height = size;

      // Calculate hex size to fit the board
      const newHexSize = (size * 0.9) / (2 * gameState.radius * 1.8);
      setHexSize(newHexSize);
      setOffset({ x: size / 2, y: size / 2 });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [gameState.radius]);

  useEffect(() => {
    drawBoard();
  }, [gameState, hexSize, offset, selectedRobot, possibleMoves, trail]);

  const drawBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(offset.x, offset.y);

    // Draw hexes first
    const hexes = HexUtils.hexesInRadius(gameState.radius);
    hexes.forEach(hex => {
      drawHex(ctx, hex, false);
    });

    // Draw possible moves if robot selected
    if (possibleMoves && possibleMoves.length > 0) {
      possibleMoves.forEach(move => {
        drawHex(ctx, move.position, true, move.direction);
      });
    }

    // Draw trails (on top of hexes, below walls)
    if (trail && trail.length > 0) {
      drawTrails(ctx);
    }

    // Draw walls
    drawWalls(ctx);

    // Only draw target and robots if game has started (round > 0)
    if (gameState.round > 0) {
      // Draw target
      if (gameState.target) {
        drawTarget(ctx, gameState.target);
      }

      // Draw robots from player's state
      if (gameState.playerState && gameState.playerState.robots) {
        Object.entries(gameState.playerState.robots).forEach(([color, position]) => {
          drawRobot(ctx, position, color, color === selectedRobot);
        });
      }
    }

    ctx.restore();
  };

  const drawHex = (ctx, hex, highlighted = false, direction = null) => {
    const center = HexUtils.hexToPixel(hex, hexSize);
    const corners = HexUtils.hexCorners(center, hexSize);

    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 6; i++) {
      ctx.lineTo(corners[i].x, corners[i].y);
    }
    ctx.closePath();

    if (highlighted) {
      ctx.fillStyle = 'rgba(106, 155, 195, 0.3)'; /* Muted blue */
      ctx.fill();

      // Draw direction indicator
      if (direction !== null) {
        const dirHex = HexUtils.neighbor(hex, direction);
        const dirCenter = HexUtils.hexToPixel(dirHex, hexSize);
        const angle = Math.atan2(dirCenter.y - center.y, dirCenter.x - center.x);

        ctx.strokeStyle = 'rgba(106, 155, 195, 0.6)'; /* Muted blue */
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(
          center.x + hexSize * 0.4 * Math.cos(angle),
          center.y + hexSize * 0.4 * Math.sin(angle)
        );
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = '#0b0b0bff';
      ctx.lineWidth = 1;
      ctx.fillStyle = 'rgba(54, 54, 54, 1)'; /* Dark Gray */
      ctx.fill();
      ctx.stroke();
    }
  };

  const drawWalls = (ctx) => {
    ctx.lineCap = 'round';

    // Draw perimeter walls (border) in muted orange
    if (gameState.perimeterWalls) {
      ctx.strokeStyle = '#c8834a'; /* Muted orange */
      ctx.lineWidth = 5;

      gameState.perimeterWalls.forEach(edgeKey => {
        const [keyA, keyB] = edgeKey.split('|');
        const hexA = HexUtils.fromKey(keyA);
        const hexB = HexUtils.fromKey(keyB);

        const edge = HexUtils.edgeEndpoints(hexA, hexB, hexSize);

        ctx.beginPath();
        ctx.moveTo(edge.x1, edge.y1);
        ctx.lineTo(edge.x2, edge.y2);
        ctx.stroke();
      });
    }

    // Draw internal walls in muted orange
    if (gameState.internalWalls) {
      ctx.strokeStyle = '#c8834a'; /* Muted orange */
      ctx.lineWidth = 4;

      gameState.internalWalls.forEach(edgeKey => {
        const [keyA, keyB] = edgeKey.split('|');
        const hexA = HexUtils.fromKey(keyA);
        const hexB = HexUtils.fromKey(keyB);

        const edge = HexUtils.edgeEndpoints(hexA, hexB, hexSize);

        ctx.beginPath();
        ctx.moveTo(edge.x1, edge.y1);
        ctx.lineTo(edge.x2, edge.y2);
        ctx.stroke();
      });
    }
  };

  const drawRobot = (ctx, hex, color, selected = false) => {
    const center = HexUtils.hexToPixel(hex, hexSize);
    const radius = hexSize * 0.35;

    // Map color name to hex color
    const hexColor = COLOR_MAP[color] || color;

    // Draw selection ring
    if (selected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw robot body
    ctx.fillStyle = hexColor;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const drawTarget = (ctx, target) => {
    const center = HexUtils.hexToPixel(target.position, hexSize);
    const size = hexSize * 0.4;

    // Map color name to hex color
    const hexColor = COLOR_MAP[target.color] || target.color;

    // Draw solid star - no outline, just fill
    ctx.fillStyle = hexColor;

    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const x = center.x + size * Math.cos(angle);
      const y = center.y + size * Math.sin(angle);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();

    // Draw subtle pulsing outline for emphasis
    const pulseSize = size + 3 + Math.sin(Date.now() / 300) * 2;
    ctx.strokeStyle = hexColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const x = center.x + pulseSize * Math.cos(angle);
      const y = center.y + pulseSize * Math.sin(angle);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const drawTrails = (ctx) => {
    const colorOffsets = {
      red: { x: -2, y: -2 },
      blue: { x: 2, y: -2 },
      green: { x: -2, y: 2 },
      yellow: { x: 2, y: 2 }
    };

    trail.forEach((move) => {
      const offset = colorOffsets[move.color] || { x: 0, y: 0 };

      // Map color name to hex color
      const hexColor = COLOR_MAP[move.color] || move.color;

      ctx.strokeStyle = hexColor;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (move.path && move.path.length > 1) {
        ctx.beginPath();
        const start = HexUtils.hexToPixel(move.path[0], hexSize);
        ctx.moveTo(start.x + offset.x, start.y + offset.y);

        for (let i = 1; i < move.path.length; i++) {
          const point = HexUtils.hexToPixel(move.path[i], hexSize);
          ctx.lineTo(point.x + offset.x, point.y + offset.y);
        }

        ctx.stroke();
      }
    });

    ctx.globalAlpha = 1;
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left - offset.x;
    const clickY = e.clientY - rect.top - offset.y;

    const hex = HexUtils.pixelToHex(clickX, clickY, hexSize);

    // Check if hex is within board
    if (!HexUtils.isWithinRadius(hex, gameState.radius)) {
      return;
    }

    // For admin, check if click is near an edge (for wall editing)
    if (isAdmin && onWallClick) {
      const hexCenter = HexUtils.hexToPixel(hex, hexSize);
      const distanceFromCenter = Math.sqrt(
        Math.pow(clickX - hexCenter.x, 2) + Math.pow(clickY - hexCenter.y, 2)
      );

      // If click is near the edge of the hex (not in center), check which edge
      if (distanceFromCenter > hexSize * 0.4) {
        // Find nearest neighbor
        let closestEdge = null;
        let closestDistance = Infinity;

        for (let dir = 0; dir < 6; dir++) {
          const neighbor = HexUtils.neighbor(hex, dir);
          const edge = HexUtils.edgeEndpoints(hex, neighbor, hexSize);

          // Calculate distance from click to edge line segment
          const distance = pointToLineDistance(
            clickX, clickY,
            edge.x1, edge.y1,
            edge.x2, edge.y2
          );

          if (distance < closestDistance) {
            closestDistance = distance;
            closestEdge = { hex, neighbor, dir };
          }
        }

        // If click is close enough to an edge (within 10 pixels), toggle wall
        if (closestDistance < 10 && closestEdge) {
          const edgeKey = HexUtils.edgeKey(closestEdge.hex, closestEdge.neighbor);
          onWallClick(edgeKey);
          return;
        }
      }
    }

    // Normal hex click (robot selection/movement)
    onHexClick(hex);
  };

  // Helper function to calculate distance from point to line segment
  const pointToLineDistance = (px, py, x1, y1, x2, y2) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;

    return Math.sqrt(dx * dx + dy * dy);
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      style={{
        cursor: 'pointer',
        maxWidth: '100%',
        maxHeight: '100%',
        border: '2px solid #333',
        borderRadius: '10px',
        background: '#232323ff' /* gray board */
      }}
    />
  );
};

export default HexBoard;
