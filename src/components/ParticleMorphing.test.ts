import { describe, it, expect } from 'vitest';
import { generateSphere, generateHelix, generatePaw } from '../utils/particleGenerators';

describe('Particle Shape Generation', () => {
  it('generates sphere positions correctly', () => {
    const count = 100;
    const positions = generateSphere(count);
    expect(positions.length).toBe(300);
    // Sphere points should be within radius 1.5
    for (let i = 0; i < positions.length; i += 3) {
      const dist = Math.sqrt(positions[i] ** 2 + positions[i + 1] ** 2 + positions[i + 2] ** 2);
      expect(dist).toBeLessThanOrEqual(1.500001);
    }
  });

  it('generates helix positions correctly', () => {
    const count = 100;
    const positions = generateHelix(count);
    expect(positions.length).toBe(300);
    // Helix should have points spread along Y axis
    expect(positions[1]).toBeCloseTo(-1.5, 1); // first point Y
    expect(positions[positions.length - 2]).toBeCloseTo(1.5, 1); // last point Y
  });

  it('generates paw print positions correctly', () => {
    const count = 500;
    const positions = generatePaw(count);
    expect(positions.length).toBe(1500);

    // Check if we have points in different clusters (very loose check)
    let hasMainPad = false;
    let hasToe = false;
    for (let i = 0; i < positions.length; i += 3) {
      if (positions[i + 1] < 0) hasMainPad = true;
      if (positions[i + 1] > 0.4) hasToe = true;
    }
    expect(hasMainPad).toBe(true);
    expect(hasToe).toBe(true);
  });
});
