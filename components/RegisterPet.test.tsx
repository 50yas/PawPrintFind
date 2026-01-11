
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RegisterPet } from './RegisterPet';
import { LanguageProvider } from '../contexts/LanguageContext';

// Mock Leaflet
vi.stubGlobal('L', {
  map: vi.fn().mockReturnValue({
    setView: vi.fn().mockReturnThis(),
    on: vi.fn(),
    remove: vi.fn(),
  }),
  tileLayer: vi.fn().mockReturnValue({
    addTo: vi.fn(),
  }),
  circle: vi.fn().mockReturnValue({
    addTo: vi.fn(),
  }),
  marker: vi.fn().mockReturnValue({
    addTo: vi.fn(),
  }),
  FeatureGroup: vi.fn().mockImplementation(() => ({
    getBounds: vi.fn().mockReturnValue({ pad: vi.fn() }),
  })),
});

describe('RegisterPet', () => {
  const mockUser = { uid: 'u1', email: 'test@test.com' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <LanguageProvider>
        <RegisterPet 
          onRegister={vi.fn()} 
          goToDashboard={vi.fn()} 
          currentUser={mockUser as any} 
          existingPet={null} 
          mode="owned"
        />
      </LanguageProvider>
    );
  };

  it('renders correctly', () => {
    renderComponent();
    expect(screen.getByText('createImprontaTitle')).toBeInTheDocument();
  });
});
