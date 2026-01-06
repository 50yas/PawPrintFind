
import { describe, it, expect } from 'vitest';
import { generateSphere, generateHelix, generatePaw } from './particleGenerators';

describe('Particle Generators', () => {
  const count = 100;

  it('generateSphere should return a Float32Array of correct length', () => {
    const positions = generateSphere(count);
    expect(positions).toBeInstanceOf(Float32Array);
    expect(positions.length).toBe(count * 3);
    // Basic check to ensure it's not empty
    expect(positions.some(v => v !== 0)).toBe(true);
  });

  it('generateHelix should return a Float32Array of correct length', () => {
    const positions = generateHelix(count);
    expect(positions).toBeInstanceOf(Float32Array);
    expect(positions.length).toBe(count * 3);
    expect(positions.some(v => v !== 0)).toBe(true);
  });

  it('generatePaw should return a Float32Array of correct length', () => {
    const positions = generatePaw(count);
    expect(positions).toBeInstanceOf(Float32Array);
    expect(positions.length).toBe(count * 3);
    expect(positions.some(v => v !== 0)).toBe(true);
  });
});
