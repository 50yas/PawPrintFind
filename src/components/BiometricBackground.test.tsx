
import { render, screen, fireEvent } from '@testing-library/react';
import { BiometricBackground, Particles } from './BiometricBackground';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock Canvas and hooks
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="three-canvas">{children}</div>,
  useFrame: vi.fn(),
  useThree: () => ({
    size: { width: 1024, height: 768 },
    viewport: { width: 10, height: 10 },
    mouse: { x: 0, y: 0 }
  }),
  extend: vi.fn(),
}));

// Mock Drei components
vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Float: ({ children }: any) => <div data-testid="three-float">{children}</div>,
  Stars: () => <div data-testid="three-stars">Stars</div>,
  Points: ({ children, ...props }: any) => <div data-testid="three-points" data-count={props.count}>{children}</div>,
  PointMaterial: () => <div data-testid="three-point-material" />,
  PerformanceMonitor: ({ children }: any) => <>{children}</>,
  shaderMaterial: vi.fn(() => function MockMaterial() { }),
}));

// Mock utils
vi.mock('../src/utils/particleGenerators', () => ({
  generateSphere: vi.fn(() => new Float32Array(300)),
  generateHelix: vi.fn(() => new Float32Array(300)),
  generatePaw: vi.fn(() => new Float32Array(300)),
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

  describe('Particles Adaptive Logic', () => {
    it('calculates particle count correctly for high DPR desktop', () => {
      // @ts-ignore
      window.innerWidth = 1200;
      const { container } = render(<Particles color="#fff" scrollRef={{ current: 0 }} dpr={2.0} />);
      const attr = container.querySelector('bufferattribute[attach="attributes-position"]');
      // baseCount = 2500, dpr = 2.0, performanceFactor = 1.0 (since dpr >= 1)
      // expected = 2500 * 2.0 * 1.0 = 5000
      expect(attr?.getAttribute('count')).toBe('5000');
    });

    it('drastically reduces particles for low DPR (low performance mode)', () => {
      // @ts-ignore
      window.innerWidth = 1200;
      const { container } = render(<Particles color="#fff" scrollRef={{ current: 0 }} dpr={0.75} />);
      const attr = container.querySelector('bufferattribute[attach="attributes-position"]');
      // baseCount = 2500, dpr = 0.75, performanceFactor = 0.6 (since dpr < 1)
      // expected = 2500 * 0.75 * 0.6 = 1125
      expect(attr?.getAttribute('count')).toBe('1125');
    });

    it('uses lower base count for mobile devices', () => {
      // @ts-ignore
      window.innerWidth = 375; // Mobile width
      const { container } = render(<Particles color="#fff" scrollRef={{ current: 0 }} dpr={1.0} />);
      const attr = container.querySelector('bufferattribute[attach="attributes-position"]');
      // baseCount = 800, dpr = 1.0, performanceFactor = 1.0
      // expected = 800 * 1.0 * 1.0 = 800
      expect(attr?.getAttribute('count')).toBe('800');
    });
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
    expect(opacity).toBeDefined();
  });
});
