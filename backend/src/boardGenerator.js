const HexUtils = require('./hexUtils');

class BoardGenerator {
  constructor(radius = 6) {
    this.radius = radius;
    this.hexes = HexUtils.hexesInRadius(radius);
  }

  /**
   * Generate random internal walls (edges between hexes)
   * Returns a Set of edge keys
   */
  generateWalls(density = 0.15) {
    const walls = new Set();
    const processedEdges = new Set();

    // Iterate through all hexes and their neighbors
    for (const hex of this.hexes) {
      for (let dir = 0; dir < 6; dir++) {
        const neighbor = HexUtils.neighbor(hex, dir);

        // Only process if neighbor is within the board
        if (!HexUtils.isWithinRadius(neighbor, this.radius)) {
          continue;
        }

        const edgeKey = HexUtils.edgeKey(hex, neighbor);

        // Skip if we've already processed this edge
        if (processedEdges.has(edgeKey)) {
          continue;
        }

        processedEdges.add(edgeKey);

        // Randomly add wall with given density
        if (Math.random() < density) {
          walls.add(edgeKey);
        }
      }
    }

    return walls;
  }

  /**
   * Get perimeter walls (edges at the boundary of the board)
   */
  getPerimeterWalls() {
    const walls = new Set();

    for (const hex of this.hexes) {
      for (let dir = 0; dir < 6; dir++) {
        const neighbor = HexUtils.neighbor(hex, dir);

        // If neighbor is outside the radius, this is a perimeter edge
        if (!HexUtils.isWithinRadius(neighbor, this.radius)) {
          const edgeKey = HexUtils.edgeKey(hex, neighbor);
          walls.add(edgeKey);
        }
      }
    }

    return walls;
  }

  /**
   * Get all walls (perimeter + internal)
   */
  getAllWalls(internalWalls) {
    const allWalls = new Set([...this.getPerimeterWalls(), ...internalWalls]);
    return allWalls;
  }

  /**
   * Get random empty hex (for placing robots/targets)
   */
  getRandomHex(excludeHexes = []) {
    const excludeKeys = new Set(excludeHexes.map(h => HexUtils.toKey(h)));
    const availableHexes = this.hexes.filter(h => !excludeKeys.has(HexUtils.toKey(h)));

    if (availableHexes.length === 0) {
      throw new Error('No available hexes');
    }

    return availableHexes[Math.floor(Math.random() * availableHexes.length)];
  }

  /**
   * Initialize robot positions (4 robots in random positions)
   */
  initializeRobots() {
    const colors = ['red', 'blue', 'green', 'yellow'];
    const robots = {};
    const usedHexes = [];

    for (const color of colors) {
      const hex = this.getRandomHex(usedHexes);
      robots[color] = { ...hex };
      usedHexes.push(hex);
    }

    return robots;
  }

  /**
   * Generate a random target (color + position)
   */
  generateTarget(excludeHexes = []) {
    const colors = ['red', 'blue', 'green', 'yellow'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const position = this.getRandomHex(excludeHexes);

    return { color, position };
  }
}

module.exports = BoardGenerator;
