import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, useTheme } from './ThemeContext';
import React from 'react';

// Mock theme utility
vi.mock('../utils/theme', () => ({
    generateTheme: vi.fn().mockReturnValue({
        light: { primary: '#008080' },
        dark: { primary: '#4cdada' }
    })
}));

const TestComponent = () => {
    const { theme, isDark, setTheme, colors } = useTheme();
    return (
        <div>
            <div data-testid="theme">{theme}</div>
            <div data-testid="is-dark">{isDark.toString()}</div>
            <div data-testid="primary-color">{colors.primary}</div>
            <button onClick={() => setTheme('light')}>Light</button>
            <button onClick={() => setTheme('dark')}>Dark</button>
            <button onClick={() => setTheme('system')}>System</button>
        </div>
    );
};

describe('ThemeContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        
        // Mock window.matchMedia
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(), // Deprecated
                removeListener: vi.fn(), // Deprecated
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });
    });

    it('provides default system theme', () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
        
        expect(screen.getByTestId('theme')).toHaveTextContent('system');
        expect(screen.getByTestId('is-dark')).toHaveTextContent('false');
        expect(screen.getByTestId('primary-color')).toHaveTextContent('#008080');
    });

    it('allows changing theme to dark', () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
        
        const darkButton = screen.getByText('Dark');
        fireEvent.click(darkButton);
        
        expect(screen.getByTestId('theme')).toHaveTextContent('dark');
        expect(screen.getByTestId('is-dark')).toHaveTextContent('true');
        expect(screen.getByTestId('primary-color')).toHaveTextContent('#4cdada');
        expect(localStorage.getItem('theme')).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('follows system preference when set to system', () => {
        // Mock system dark mode active
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: true,
                media: query,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            })),
        });

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
        
        expect(screen.getByTestId('theme')).toHaveTextContent('system');
        expect(screen.getByTestId('is-dark')).toHaveTextContent('true');
        expect(screen.getByTestId('primary-color')).toHaveTextContent('#4cdada');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('throws error when used outside provider', () => {
        // Suppress console.error for this test
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        expect(() => render(<TestComponent />)).toThrow('useTheme must be used within a ThemeProvider');
        
        consoleSpy.mockRestore();
    });
});
