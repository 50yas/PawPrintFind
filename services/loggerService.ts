
import { LogEntry } from '../types';

class LoggerService {
    private logs: LogEntry[] = [];
    private listeners: ((logs: LogEntry[]) => void)[] = [];

    constructor() {
        // Capture original console methods to prevent infinite loops if we were to override them directly in this class
        // In this architecture, we will manually call logger.info/error, or use the interceptor in index.tsx
    }

    private notify() {
        this.listeners.forEach(listener => listener([...this.logs]));
    }

    public addLog(level: 'info' | 'warn' | 'error', message: string, data?: any) {
        const entry: LogEntry = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            level,
            message,
            data
        };
        this.logs.push(entry);
        // Keep log size manageable
        if (this.logs.length > 500) {
            this.logs.shift();
        }
        this.notify();
    }

    public info(message: string, data?: any) {
        this.addLog('info', message, data);
    }

    public warn(message: string, data?: any) {
        this.addLog('warn', message, data);
    }

    public error(message: string, data?: any) {
        this.addLog('error', message, data);
    }

    public getLogs() {
        return [...this.logs];
    }

    public clearLogs() {
        this.logs = [];
        this.notify();
    }

    public subscribe(listener: (logs: LogEntry[]) => void) {
        this.listeners.push(listener);
        listener([...this.logs]); // Initial emit
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
}

export const logger = new LoggerService();
