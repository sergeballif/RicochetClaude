/**
 * Hexagonal grid utilities for rendering
 * Using cube coordinates (q, r, s) where q + r + s = 0
 */

export class HexUtils {
  static hex(q, r, s) {
    return { q, r, s };
  }

  static axialToCube(q, r) {
    return this.hex(q, r, -q - r);
  }

  static add(a, b) {
    return this.hex(a.q + b.q, a.r + b.r, a.s + b.s);
  }

  static directions = [
    { q: 1, r: 0, s: -1 },   // 0: East
    { q: 1, r: -1, s: 0 },   // 1: Northeast
    { q: 0, r: -1, s: 1 },   // 2: Northwest
    { q: -1, r: 0, s: 1 },   // 3: West
    { q: -1, r: 1, s: 0 },   // 4: Southwest
    { q: 0, r: 1, s: -1 }    // 5: Southeast
  ];

  static neighbor(hex, direction) {
    return this.add(hex, this.directions[direction]);
  }

  static neighbors(hex) {
    return this.directions.map(dir => this.add(hex, dir));
  }

  static distance(a, b) {
    return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2;
  }

  static equals(a, b) {
    return a.q === b.q && a.r === b.r && a.s === b.s;
  }

  static toKey(hex) {
    return `${hex.q},${hex.r},${hex.s}`;
  }

  static fromKey(key) {
    const [q, r, s] = key.split(',').map(Number);
    return { q, r, s };
  }

  static hexesInRadius(radius) {
    const results = [];
    for (let q = -radius; q <= radius; q++) {
      const r1 = Math.max(-radius, -q - radius);
      const r2 = Math.min(radius, -q + radius);
      for (let r = r1; r <= r2; r++) {
        const s = -q - r;
        results.push(this.hex(q, r, s));
      }
    }
    return results;
  }

  static isWithinRadius(hex, radius) {
    return Math.abs(hex.q) <= radius &&
           Math.abs(hex.r) <= radius &&
           Math.abs(hex.s) <= radius;
  }

  static edgeKey(hexA, hexB) {
    const keyA = this.toKey(hexA);
    const keyB = this.toKey(hexB);
    return keyA < keyB ? `${keyA}|${keyB}` : `${keyB}|${keyA}`;
  }

  /**
   * Convert hex coordinates to pixel coordinates
   * Using flat-top orientation
   */
  static hexToPixel(hex, size) {
    const x = size * (3/2 * hex.q);
    const y = size * (Math.sqrt(3)/2 * hex.q + Math.sqrt(3) * hex.r);
    return { x, y };
  }

  /**
   * Convert pixel coordinates to hex coordinates
   * Using flat-top orientation
   */
  static pixelToHex(x, y, size) {
    const q = (2/3 * x) / size;
    const r = (-1/3 * x + Math.sqrt(3)/3 * y) / size;
    return this.hexRound(q, r, -q - r);
  }

  /**
   * Round fractional hex coordinates to nearest hex
   */
  static hexRound(q, r, s) {
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);

    const qDiff = Math.abs(rq - q);
    const rDiff = Math.abs(rr - r);
    const sDiff = Math.abs(rs - s);

    if (qDiff > rDiff && qDiff > sDiff) {
      rq = -rr - rs;
    } else if (rDiff > sDiff) {
      rr = -rq - rs;
    } else {
      rs = -rq - rr;
    }

    return this.hex(rq, rr, rs);
  }

  /**
   * Get the corners of a hexagon in pixel space
   * Flat-top orientation
   */
  static hexCorners(center, size) {
    const corners = [];
    for (let i = 0; i < 6; i++) {
      const angleDeg = 60 * i;
      const angleRad = Math.PI / 180 * angleDeg;
      corners.push({
        x: center.x + size * Math.cos(angleRad),
        y: center.y + size * Math.sin(angleRad)
      });
    }
    return corners;
  }

  /**
   * Get the edge center points for walls
   */
  static edgeCenter(hexA, hexB, size) {
    const centerA = this.hexToPixel(hexA, size);
    const centerB = this.hexToPixel(hexB, size);
    return {
      x: (centerA.x + centerB.x) / 2,
      y: (centerA.y + centerB.y) / 2
    };
  }

  /**
   * Get edge endpoints for drawing walls
   */
  static edgeEndpoints(hexA, hexB, size) {
    const centerA = this.hexToPixel(hexA, size);
    const centerB = this.hexToPixel(hexB, size);

    // Calculate the angle between the two hexes
    const angle = Math.atan2(centerB.y - centerA.y, centerB.x - centerA.x);

    // Perpendicular angle
    const perpAngle = angle + Math.PI / 2;

    // Edge midpoint
    const midX = (centerA.x + centerB.x) / 2;
    const midY = (centerA.y + centerB.y) / 2;

    // Edge extends half a hex width on each side
    const halfWidth = size * 0.577; // size * Math.sqrt(3)/3

    return {
      x1: midX + halfWidth * Math.cos(perpAngle),
      y1: midY + halfWidth * Math.sin(perpAngle),
      x2: midX - halfWidth * Math.cos(perpAngle),
      y2: midY - halfWidth * Math.sin(perpAngle)
    };
  }
}
