
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveAssistant } from './LiveAssistant';
import { LanguageProvider } from '../contexts/LanguageContext';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
      dir: vi.fn(() => 'ltr'),
    },
  }),
}));

// Mock GoogleGenAI
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(function() {
    const mockSession = {
      sendRealtimeInput: vi.fn(),
      close: vi.fn(),
    };
    return {
      live: {
        connect: vi.fn().mockReturnValue({
          ...mockSession,
          then: (cb: any) => Promise.resolve(cb(mockSession)),
        }),
      },
    };
  }),
  Type: { OBJECT: 'OBJECT', STRING: 'STRING' },
  Modality: { AUDIO: 'AUDIO' },
}));

describe('LiveAssistant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <LanguageProvider>
        <LiveAssistant />
      </LanguageProvider>
    );
  };

  it('renders correctly', () => {
    renderComponent();
    expect(screen.getByText(/liveAssistantTitle/i)).toBeInTheDocument();
    expect(screen.getByText(/aiLabel/i)).toBeInTheDocument();
  });
});
