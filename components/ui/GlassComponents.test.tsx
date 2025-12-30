import { render, screen } from '@testing-library/react';
import { GlassCard } from './GlassCard';
import { GlassButton } from './GlassButton';
import { describe, it, expect, vi } from 'vitest';

describe('GlassCard', () => {
    it('renders children correctly', () => {
        render(<GlassCard>Test Content</GlassCard>);
        expect(screen.getByText('Test Content')).toBeDefined();
    });

    it('applies the correct glassmorphism classes', () => {
        const { container } = render(<GlassCard className="extra-class">Content</GlassCard>);
        const classNames = (container.firstChild as HTMLElement).className;
        expect(classNames).toContain('backdrop-blur-xl');
        // Material 3 Refactor
        expect(classNames).toContain('bg-surface-container-low');
        expect(classNames).toContain('border-outline-variant');
        expect(classNames).toContain('extra-class');
    });

    it('renders as a holographic data slate with hover effect', () => {
         const { container } = render(<GlassCard variant="interactive">Interactive</GlassCard>);
         const classNames = (container.firstChild as HTMLElement).className;
         expect(classNames).toContain('hover:scale-[1.02]');
         expect(classNames).toContain('transition-all');
    });
});

describe('GlassButton', () => {
    it('renders button text', () => {
        render(<GlassButton onClick={() => {}}>Click Me</GlassButton>);
        expect(screen.getByText('Click Me')).toBeDefined();
    });

    it('handles click events', () => {
        const handleClick = vi.fn();
        render(<GlassButton onClick={handleClick}>Click Me</GlassButton>);
        screen.getByText('Click Me').click();
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders different variants', () => {
        const { container } = render(<GlassButton variant="primary">Primary</GlassButton>);
        const classNames = (container.firstChild as HTMLElement).className;
        // Material 3 Refactor
        expect(classNames).toContain('bg-primary');
        expect(classNames).toContain('text-on-primary');
    });
    
    it('supports loading state', () => {
        render(<GlassButton isLoading>Submit</GlassButton>);
        expect(screen.getByText('Loading...')).toBeDefined();
    });
});
