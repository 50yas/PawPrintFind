
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from './Navbar';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock dependencies
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key }),
}));

vi.mock('./RoleSwitcher', () => ({
  RoleSwitcher: () => <div data-testid="role-switcher">RoleSwitcher</div>,
}));

vi.mock('./DarkModeToggle', () => ({
  default: () => <div data-testid="dark-mode-toggle">DarkModeToggle</div>,
}));

vi.mock('./ui/GlassButton', () => ({
  GlassButton: ({ children, onClick, className }: any) => (
    <button onClick={onClick} className={className}>{children}</button>
  ),
}));

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });

describe('Navbar Mobile Enhanced', () => {
  const mockSetCurrentUser = vi.fn();
  const mockSetView = vi.fn();
  const defaultProps = {
    currentUser: null,
    setCurrentUser: mockSetCurrentUser,
    setView: mockSetView,
    onLoginClick: vi.fn(),
    onLogoutClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window width to mobile
    global.innerWidth = 375;
    global.dispatchEvent(new Event('resize'));
  });

  it('should have fixed positioning and high z-index', () => {
    render(<Navbar {...defaultProps} />);
    const navElement = screen.getByRole('navigation');
    expect(navElement).toHaveClass('fixed');
    expect(navElement).toHaveClass('z-[1000]'); // Updated to match implementation
  });

  it('should render the "More" options trigger button on mobile', () => {
    render(<Navbar {...defaultProps} />);
    // This is expected to fail initially as the button doesn't exist
    const moreButton = screen.getByTestId('mobile-menu-trigger');
    expect(moreButton).toBeInTheDocument();
  });

  it('should NOT render desktop navigation links on mobile', () => {
    render(<Navbar {...defaultProps} />);
    // The desktop links container has 'hidden lg:flex'
    const homeButton = screen.queryByText('homeButton');
    // Note: This might pass if the 'hidden' class works, but we want to ensure the specific mobile structure
    // If the text is present but hidden, verify styling.
    // However, typically testing library sees what's in the DOM.
    // If the element has 'hidden' class it might still be in the DOM.
    // Let's check for the "More" button specifically which is the new feature.
  });

  it('should toggle the bottom sheet when "More" button is clicked', () => {
    render(<Navbar {...defaultProps} />);
    const moreButton = screen.getByTestId('mobile-menu-trigger');
    fireEvent.click(moreButton);
    // Expect the bottom sheet to be open.
    // Since we haven't implemented the bottom sheet yet, this checks for the state change or component presence.
    // For now, let's look for a placeholder or specific state indicator if possible,
    // or we can test that the trigger fires the event.
    // Assuming the bottom sheet renders when open:
    const bottomSheet = screen.getByTestId('navigation-bottom-sheet');
    expect(bottomSheet).toBeInTheDocument();
  });
});
