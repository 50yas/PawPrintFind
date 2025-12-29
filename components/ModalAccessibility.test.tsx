
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Modal } from './Modal';
import React from 'react';

describe('Modal Accessibility', () => {
  it('has correct ARIA attributes', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <div>Content</div>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
    
    const title = screen.getByText('Test Modal');
    expect(title.id).toBe(dialog.getAttribute('aria-labelledby'));
  });
});
