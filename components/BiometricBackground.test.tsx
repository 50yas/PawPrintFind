
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('updates vignette opacity on scroll', () => {
    const { container } = render(<BiometricBackground />);
    
    // Mock window scroll properties
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 500 });
    Object.defineProperty(document.documentElement, 'scrollHeight', { writable: true, configurable: true, value: 1000 });
    
    // Initial check: Opacity should be 0.4 (base) + 0 (scroll) = 0.4
    const vignette = Array.from(container.querySelectorAll('div')).find(
      el => el.style.backgroundImage && el.style.backgroundImage.includes('radial-gradient(circle')
    ) as HTMLElement;
    
    expect(vignette).toBeDefined();
    expect(vignette.style.opacity).toBe('0.4');

    // Simulate scroll to 50%
    // maxScroll = 1000 - 500 = 500.
    // scrollY = 250.
    // progress = 250 / 500 = 0.5.
    // opacity = 0.4 + 0.5 * 0.4 = 0.6.
    window.scrollY = 250;
    fireEvent.scroll(window);

    const opacity = parseFloat(vignette.style.opacity);
    expect(opacity).toBeCloseTo(0.6);
  });
});
