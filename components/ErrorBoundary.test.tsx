import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';
import { logger } from '../services/loggerService';
import { LanguageProvider } from '../contexts/LanguageContext';

vi.mock('../services/loggerService', () => ({
  logger: {
    error: vi.fn(),
  },
}));

const ProblematicComponent = () => {
  throw new Error('Test Error');
};

describe('ErrorBoundary Integration', () => {
  it('should catch errors and log them using the structured logger', () => {
    // Suppress console.error for this test to keep output clean
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <LanguageProvider>
        <ErrorBoundary>
          <ProblematicComponent />
        </ErrorBoundary>
      </LanguageProvider>
    );

        expect(screen.getByText('systemAnomalyDetected')).toBeInTheDocument();
        expect(logger.error).toHaveBeenCalledWith(
            'CRITICAL_SYSTEM_ANOMALY',
            expect.objectContaining({
                error: 'Test Error',
            })
        );
    });
});
