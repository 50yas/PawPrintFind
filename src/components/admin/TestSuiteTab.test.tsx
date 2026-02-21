
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TestSuiteTab } from './TestSuiteTab';
import React from 'react';
import { dbService } from '../../services/firebase';
import { httpsCallable } from 'firebase/functions';

// Mock translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock firebase functions
vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
}));

// Mock dbService
vi.mock('../../services/firebase', () => ({
  dbService: {
    syncUserProfile: vi.fn(),
    getPublicStats: vi.fn(),
    getPendingVerifications: vi.fn(),
    auth: { currentUser: { uid: 'admin123' } },
    storage: {}
  },
  functions: {}
}));

// Mock UI components
vi.mock('../ui/GlassCard', () => ({
    GlassCard: ({ children, className }: any) => <div className={`glass-card ${className}`} data-testid="glass-card">{children}</div>
}));

vi.mock('../ui/GlassButton', () => ({
    GlassButton: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>
}));

describe('TestSuiteTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders system audit header', () => {
    render(<TestSuiteTab />);
    expect(screen.getByText('System Audit & Test Suite')).toBeInTheDocument();
  });

  it('renders all feature cards', () => {
    render(<TestSuiteTab />);
    expect(screen.getByText('Gemini AI Bridge')).toBeInTheDocument();
    expect(screen.getByText('Firestore Auth')).toBeInTheDocument();
    expect(screen.getByText('Natural Language Search')).toBeInTheDocument();
  });

  it('runs Gemini AI Bridge test successfully', async () => {
    const mockSmartSearch = vi.fn().mockResolvedValue({ data: { success: true } });
    (httpsCallable as any).mockReturnValue(mockSmartSearch);

    render(<TestSuiteTab />);
    
    // Find the test button for Gemini AI Bridge
    const geminiCard = screen.getByText('Gemini AI Bridge').closest('.glass-card');
    const testBtn = geminiCard?.querySelector('button');
    
    fireEvent.click(testBtn!);

    await waitFor(() => {
      expect(screen.getByText(/Gemini connectivity verified/)).toBeInTheDocument();
    });
  });

  it('handles test failure gracefully', async () => {
    const mockSmartSearch = vi.fn().mockRejectedValue(new Error('API Down'));
    (httpsCallable as any).mockReturnValue(mockSmartSearch);

    render(<TestSuiteTab />);
    
    const geminiCard = screen.getByText('Gemini AI Bridge').closest('.glass-card');
    const testBtn = geminiCard?.querySelector('button');
    
    fireEvent.click(testBtn!);

    await waitFor(() => {
      expect(screen.getByText(/Protocol Error/)).toBeInTheDocument();
      expect(screen.getByText(/API Down/)).toBeInTheDocument();
    });
  });
});
