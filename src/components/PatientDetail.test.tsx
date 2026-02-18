
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { PatientDetail } from './PatientDetail';
import { PetProfile } from '../types';

// Mock Dependencies
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../contexts/SnackbarContext', () => ({
  useSnackbar: () => ({
    addSnackbar: vi.fn(),
  }),
}));

vi.mock('../services/geminiService', () => ({
  draftVetMessageToOwner: vi.fn(),
  generateHealthInsights: vi.fn().mockResolvedValue([
    { id: '1', title: 'Test Insight', content: 'Test Content', type: 'health', timestamp: Date.now() }
  ]),
}));

vi.mock('./AIInsightCard', () => ({
  AIInsightCard: ({ insight }: any) => <div data-testid="insight-card">{insight.title}</div>,
}));

vi.mock('./ui/CinematicImage', () => ({
  CinematicImage: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

const mockPet: PetProfile = {
  id: '1',
  name: 'Buddy',
  breed: 'Golden Retriever',
  age: '2 years',
  weight: '30kg',
  behavior: 'Friendly',
  photos: [{ url: 'buddy.jpg', marks: [], description: 'Buddy' }],
  medicalRecord: { allergies: 'None', chronicConditions: 'None', medications: 'None', vaccinations: [] },
  healthChecks: [],
  ownerEmail: 'owner@test.com',
  status: 'owned',
  isLost: false,
  vetLinkStatus: 'linked'
} as any;

describe('PatientDetail Component', () => {
  it('should render pet details and generate insights on button click', async () => {
    render(<PatientDetail patient={mockPet} goBack={() => {}} />);
    
    expect(screen.getByText('Buddy')).toBeInTheDocument();
    
    // Check if "Check Health" button exists
    const checkHealthBtn = screen.getByText(/checkHealthButton/i);
    expect(checkHealthBtn).toBeInTheDocument();
    
    // Click it
    fireEvent.click(checkHealthBtn);
    
    // Wait for insight to appear
    await waitFor(() => {
      expect(screen.getByTestId('insight-card')).toBeInTheDocument();
      expect(screen.getByText('Test Insight')).toBeInTheDocument();
    });
  });
});
