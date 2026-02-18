import { render, screen } from '@testing-library/react';
import { Snackbar } from './Snackbar';
import { describe, it, expect } from 'vitest';

describe('Snackbar', () => {
    it('renders message when open', () => {
        render(<Snackbar message="Operation successful" isOpen={true} onClose={() => {}} />);
        expect(screen.getByText('Operation successful')).toBeDefined();
    });

    it('does not render when closed', () => {
        render(<Snackbar message="Hidden" isOpen={false} onClose={() => {}} />);
        expect(screen.queryByText('Hidden')).toBeNull();
    });

    it('applies Material 3 styles', () => {
        render(<Snackbar message="Style Test" isOpen={true} onClose={() => {}} />);
        const snackbar = screen.getByRole('alert');
        expect(snackbar.className).toContain('bg-inverse-surface');
        expect(snackbar.className).toContain('text-inverse-on-surface');
        expect(snackbar.className).toContain('rounded-xl'); // M3 shape
    });
});
