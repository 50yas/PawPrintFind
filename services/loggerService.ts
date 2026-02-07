
import { LogEntry } from '../types';

// Capture original console methods to prevent infinite loops if console is patched (e.g. by index.tsx)
const rawConsole = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console)
};

class LoggerService {
    private logs: LogEntry[] = [];
    private listeners: ((logs: LogEntry[]) => void)[] = [];
    private currentTraceId: string | null = null;

    constructor() {
        // Initial trace ID for session start
        this.generateNewTraceId();
    }

    public generateNewTraceId(): string {
        this.currentTraceId = `tr_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        return this.currentTraceId;
    }

    public setTraceId(id: string) {
        this.currentTraceId = id;
    }

    public getTraceId(): string | null {
        return this.currentTraceId;
    }

    private notify() {
        this.listeners.forEach(listener => listener([...this.logs]));
    }

    public addLog(level: 'info' | 'warn' | 'error', message: string, data?: any) {
        // Handle Error objects in data
        let safeData = data;
        if (data instanceof Error) {
            safeData = {
                name: data.name,
                message: data.message,
                stack: data.stack,
                ...data // Capture any other properties
            };
        }

        const entry: LogEntry = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
            timestamp: Date.now(),
            level,
            message,
            data: safeData,
            traceId: this.currentTraceId || undefined
        };
        
        // NDJSON Output for Cloud Logging using raw console to avoid interceptors
        rawConsole.log(JSON.stringify(entry));

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
