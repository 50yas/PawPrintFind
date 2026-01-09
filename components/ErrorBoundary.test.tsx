import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { logger } from '../services/loggerService';

// Mock logger
vi.mock('../services/loggerService', () => ({
    logger: {
        error: vi.fn(),
    },
}));

const ProblematicComponent = () => {
    throw new Error('Test Error');
};

describe('ErrorBoundary Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Prevent React from logging the error to console during test
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should catch errors and log them using the structured logger', () => {
        render(
            <ErrorBoundary>
                <ProblematicComponent />
            </ErrorBoundary>
        );

        expect(screen.getByText('System Anomaly Detected')).toBeInTheDocument();
        expect(logger.error).toHaveBeenCalledWith(
            'CRITICAL_SYSTEM_ANOMALY',
            expect.objectContaining({
                error: 'Test Error',
            })
        );
    });
});
