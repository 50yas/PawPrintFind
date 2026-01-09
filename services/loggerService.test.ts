import { describe, it, expect, vi, beforeEach, afterAll, beforeAll } from 'vitest';
import { LogEntry } from '../types';

// Ensure the module is not mocked
vi.unmock('./loggerService');

describe('LoggerService', () => {
    let logger: any;
    let logSpy: any;

    beforeAll(async () => {
        // Setup spy BEFORE importing the service
        logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        
        // Dynamic import to ensure spy is active when module loads
        const module = await import('./loggerService');
        logger = module.logger;
    });

    afterAll(() => {
        logSpy.mockRestore();
    });

    beforeEach(() => {
        logSpy.mockClear();
        logger.clearLogs();
    });

    it('should add logs and output NDJSON', () => {
        logger.info('Test info message', { key: 'value' });
        
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"level":"info"'));
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"message":"Test info message"'));
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"data":{"key":"value"}'));
        
        const logs: LogEntry[] = logger.getLogs();
        expect(logs.length).toBe(1);
        expect(logs[0].message).toBe('Test info message');
    });

    it('should include trace ID in logs', () => {
        const traceId = logger.generateNewTraceId();
        logger.warn('Warning with trace');
        
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(`"traceId":"${traceId}"`));
        
        const logs: LogEntry[] = logger.getLogs();
        expect(logs[0].traceId).toBe(traceId);
    });

    it('should generate different trace IDs', () => {
        const id1 = logger.generateNewTraceId();
        const id2 = logger.generateNewTraceId();
        expect(id1).not.toBe(id2);
    });

    it('should allow setting a custom trace ID', () => {
        logger.setTraceId('custom-trace');
        logger.error('Error with custom trace');
        
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"traceId":"custom-trace"'));
    });
});