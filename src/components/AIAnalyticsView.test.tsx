
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AIAnalyticsView } from './AIAnalyticsView';
import React from 'react';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

// Mock child components
vi.mock('./AIInsightCard', () => ({ AIInsightCard: ({ title, content }: any) => <div data-testid="insight-card">{title}: {content}</div> }));
vi.mock('./LoadingSpinner', () => ({ LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div> }));

describe('AIAnalyticsView Component', () => {
  const mockPatients = [
    { id: 'p1', name: 'Buddy', breed: 'Golden Retriever', medicalRecord: { lastCheckup: Date.now(), healthScore: 85 } },
    { id: 'p2', name: 'Luna', breed: 'Siamese', medicalRecord: { lastCheckup: Date.now() - 86400000, healthScore: 92 } },
  ] as any[];

  const defaultProps = {
    patients: mockPatients,
    onClose: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the analytics dashboard title', () => {
    render(<AIAnalyticsView {...defaultProps} />);
    expect(screen.getByText('aiAnalyticsDashboardTitle')).toBeInTheDocument();
  });

  it('displays aggregate stats', () => {
    render(<AIAnalyticsView {...defaultProps} />);
    expect(screen.getByText('totalPatientsAnalyzed')).toBeInTheDocument();
    // Assuming we calculate an average score or similar
    expect(screen.getByText(/88.5/)).toBeInTheDocument(); // Average of 85 and 92
  });

  it('renders a list of recent insights', () => {
    render(<AIAnalyticsView {...defaultProps} />);
    expect(screen.getAllByTestId('insight-card')).toHaveLength(2);
  });

  it('shows a "No Data" message if no patients have records', () => {
    render(<AIAnalyticsView {...defaultProps} patients={[]} />);
    expect(screen.getByText('noAnalyticsData')).toBeInTheDocument();
  });
});
