import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import React, { useContext } from 'react';
import { SnackbarProvider, SnackbarContext } from './SnackbarContext';
import '@testing-library/jest-dom';

const TestComponent = () => {
  const { addSnackbar } = useContext(SnackbarContext)!;
  return (
    <button onClick={() => addSnackbar('Test Message', 'success')}>
      Trigger Snackbar
    </button>
  );
};

describe('SnackbarContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders children correctly', () => {
    render(
      <SnackbarProvider>
        <div data-testid="child">Child</div>
      </SnackbarProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('shows snackbar when addSnackbar is called', async () => {
    render(
      <SnackbarProvider>
        <TestComponent />
      </SnackbarProvider>
    );

    const button = screen.getByText('Trigger Snackbar');
    fireEvent.click(button);

    expect(screen.getByText('Test Message')).toBeInTheDocument();
  });

  it('removes snackbar after duration', async () => {
    render(
      <SnackbarProvider>
        <TestComponent />
      </SnackbarProvider>
    );

    fireEvent.click(screen.getByText('Trigger Snackbar'));
    expect(screen.getByText('Test Message')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByText('Test Message')).not.toBeInTheDocument();
  });
});
