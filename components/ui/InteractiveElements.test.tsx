
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GlassButton } from './GlassButton';
import { GlassCard } from './GlassCard';
import { describe, it, expect } from 'vitest';

describe('Interactive Elements - Material 3 State Layers', () => {
    describe('GlassButton', () => {
        it('has proper focus-visible styles', () => {
            render(<GlassButton>Click Me</GlassButton>);
            const button = screen.getByRole('button', { name: /click me/i });
            // Material 3 requires clear focus indication
            expect(button).toHaveClass('focus-visible:ring-2');
            expect(button).toHaveClass('focus-visible:ring-primary');
        });

        it('has proper hover state layer', () => {
             render(<GlassButton>Click Me</GlassButton>);
             const button = screen.getByRole('button', { name: /click me/i });
             // M3 Hover: State layer +8% opacity
             expect(button).toHaveClass('hover:bg-primary/90');
        });
    });

    describe('GlassCard', () => {
        it('interactive variant has hover and focus states', () => {
            render(<GlassCard variant="interactive">Content</GlassCard>);
            const card = screen.getByTestId('glass-card');
            expect(card).toHaveClass('hover:scale-[1.02]');
            expect(card).toHaveClass('focus-visible:ring-2');
        });
    });
});
