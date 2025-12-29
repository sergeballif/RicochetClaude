/**
 * Hexagonal grid utilities using cube coordinates (q, r, s)
 * where q + r + s = 0
 * Reference: https://www.redblobgames.com/grids/hexagons/
 */

class HexUtils {
  /**
   * Create a hex with cube coordinates
   */
  static hex(q, r, s) {
    if (Math.round(q + r + s) !== 0) {
      throw new Error('q + r + s must equal 0');
    }
    return { q, r, s };
  }

  /**
   * Convert axial (q, r) to cube (q, r, s)
   */
  static axialToCube(q, r) {
    return this.hex(q, r, -q - r);
  }

  /**
   * Add two hexes
   */
  static add(a, b) {
    return this.hex(a.q + b.q, a.r + b.r, a.s + b.s);
  }

  /**
   * Subtract two hexes
   */
  static subtract(a, b) {
    return this.hex(a.q - b.q, a.r - b.r, a.s - b.s);
  }

  /**
   * Get the six neighbor directions
   */
  static directions = [
    { q: 1, r: 0, s: -1 },   // East
    { q: 1, r: -1, s: 0 },   // Northeast
    { q: 0, r: -1, s: 1 },   // Northwest
    { q: -1, r: 0, s: 1 },   // West
    { q: -1, r: 1, s: 0 },   // Southwest
    { q: 0, r: 1, s: -1 }    // Southeast
  ];

  /**
   * Get direction by index (0-5)
   */
  static direction(index) {
    return this.directions[index];
  }

  /**
   * Get neighbor in a specific direction
   */
  static neighbor(hex, direction) {
    return this.add(hex, this.directions[direction]);
  }

  /**
   * Get all 6 neighbors
   */
  static neighbors(hex) {
    return this.directions.map(dir => this.add(hex, dir));
  }

  /**
   * Calculate distance between two hexes
   */
  static distance(a, b) {
    return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2;
  }

  /**
   * Check if two hexes are equal
   */
  static equals(a, b) {
    return a.q === b.q && a.r === b.r && a.s === b.s;
  }

  /**
   * Convert hex to string key for use in maps
   */
  static toKey(hex) {
    return `${hex.q},${hex.r},${hex.s}`;
  }

  /**
   * Convert string key back to hex
   */
  static fromKey(key) {
    const [q, r, s] = key.split(',').map(Number);
    return { q, r, s };
  }

  /**
   * Generate all hexes within a radius (including center)
   */
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

  /**
   * Check if a hex is within a given radius from center (0,0,0)
   */
  static isWithinRadius(hex, radius) {
    return Math.abs(hex.q) <= radius &&
           Math.abs(hex.r) <= radius &&
           Math.abs(hex.s) <= radius;
  }

  /**
   * Get edge key between two adjacent hexes (for walls)
   * Returns a normalized key so the same edge always has the same key
   */
  static edgeKey(hexA, hexB) {
    const keyA = this.toKey(hexA);
    const keyB = this.toKey(hexB);
    // Sort to ensure consistent edge key regardless of direction
    return keyA < keyB ? `${keyA}|${keyB}` : `${keyB}|${keyA}`;
  }

  /**
   * Check if two hexes are neighbors (adjacent)
   */
  static areNeighbors(hexA, hexB) {
    return this.distance(hexA, hexB) === 1;
  }
}

module.exports = HexUtils;
