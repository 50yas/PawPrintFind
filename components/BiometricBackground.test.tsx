
import { render, screen } from '@testing-library/react';
import { BiometricBackground } from './BiometricBackground';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock Canvas and hooks
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="three-canvas">{children}</div>,
  useFrame: vi.fn(),
  useThree: () => ({ size: { width: 100, height: 100 }, viewport: { width: 100, height: 100 } }),
  extend: vi.fn(),
}));

// Mock Drei components
vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Float: ({ children }: any) => <div data-testid="three-float">{children}</div>,
  Stars: () => <div data-testid="three-stars">Stars</div>,
  Points: ({ children }: any) => <div data-testid="three-points">{children}</div>,
  PointMaterial: () => <div data-testid="three-point-material" />,
  shaderMaterial: vi.fn(() => function MockMaterial() {}),
}));

// Mock useTheme
vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#22d3ee',
      background: '#020617',
      secondary: '#c084fc',
    }
  }),
}));

describe('BiometricBackground', () => {
  it('renders the canvas container', () => {
    render(<BiometricBackground />);
    expect(screen.getByTestId('three-canvas')).toBeInTheDocument();
  });

  it('renders cinematic overlay gradients', () => {
    const { container } = render(<BiometricBackground />);
    // There should be at least two overlay divs (gradient-to-t and radial-gradient)
    const overlays = container.querySelectorAll('div.absolute.inset-0');
    expect(overlays.length).toBeGreaterThanOrEqual(2);
  });
});
