
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { LanguageProvider, LanguageContext } from './LanguageContext';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
      dir: (lng: string) => (lng === 'ar' ? 'rtl' : 'ltr'),
    },
  }),
}));

describe('LanguageContext', () => {
  it('provides the current locale and translation function', () => {
    const TestComponent = () => {
      const context = React.useContext(LanguageContext);
      return (
        <div>
          <span data-testid="locale">{context?.locale}</span>
          <span data-testid="t">{context?.t('test_key')}</span>
        </div>
      );
    };

    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('locale').textContent).toBe('en');
    expect(screen.getByTestId('t').textContent).toBe('test_key');
  });
});
