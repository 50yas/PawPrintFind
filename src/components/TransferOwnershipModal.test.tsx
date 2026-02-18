
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransferOwnershipModal } from './TransferOwnershipModal';
import { LanguageProvider } from '../contexts/LanguageContext';

describe('TransferOwnershipModal', () => {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  const mockPet = { id: 'p1', name: 'Buddy' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <LanguageProvider>
        <TransferOwnershipModal pet={mockPet as any} onClose={onClose} onConfirm={onConfirm} />
      </LanguageProvider>
    );
  };

  it('renders correctly', () => {
    renderComponent();
    expect(screen.getByPlaceholderText('newOwnerPlaceholder')).toBeInTheDocument();
  });

  it('calls onConfirm with email', () => {
    renderComponent();
    fireEvent.change(screen.getByPlaceholderText('newOwnerPlaceholder'), { target: { value: 'new@test.com' } });
    fireEvent.click(screen.getByText('confirmTransferButton'));
    expect(onConfirm).toHaveBeenCalledWith('new@test.com');
  });
});
