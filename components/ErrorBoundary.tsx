
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../services/loggerService';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ error, errorInfo });
        logger.error("CRITICAL_SYSTEM_ANOMALY", {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack
        });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center p-6 text-center font-mono-tech">
                    <div className="max-w-md w-full glass-panel border-red-500/30 bg-red-500/5 p-8 rounded-2xl">
                        <div className="text-6xl mb-4">😿</div>
                        <h1 className="text-2xl font-bold text-red-500 mb-2 uppercase tracking-widest">System Anomaly Detected</h1>
                        <p className="text-muted-foreground text-sm mb-6">
                            Our neural network encountered an unexpected glitch. The rescue mission has been paused.
                        </p>

                        <div className="bg-black/50 p-4 rounded-lg mb-6 text-left overflow-auto max-h-32 border border-white/5">
                            <code className="text-[10px] text-red-400 font-mono">
                                {this.state.error && this.state.error.toString()}
                            </code>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="btn btn-primary w-full py-3 shadow-[0_0_20px_rgba(20,184,166,0.2)]"
                        >
                            REBOOT SYSTEM
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
