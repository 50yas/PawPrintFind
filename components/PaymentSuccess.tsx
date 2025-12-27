
import React, { useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { Particles } from './Particles';

interface PaymentSuccessProps {
    setView: (view: any) => void;
}

export const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ setView }) => {
    const { t } = useTranslations();

    useEffect(() => {
        // Fire confetti logic could go here if using a library like canvas-confetti
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-green-500/10 to-background p-4">
            <Particles />
            
            <div className="glass-panel p-10 rounded-3xl text-center max-w-lg w-full relative z-10 animate-fade-in border border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
                    <span className="text-5xl">🎉</span>
                </div>
                
                <h1 className="text-4xl font-extrabold text-foreground mb-4">Thank You!</h1>
                <p className="text-lg text-muted-foreground mb-8">
                    Your contribution helps keep our servers running and reunites more pets with their families. You are a true hero.
                </p>

                <div className="bg-muted/50 p-4 rounded-xl mb-8 border border-white/10">
                    <p className="text-sm font-mono text-primary">Transaction ID: #PAW-{Math.floor(Math.random() * 1000000)}</p>
                    <p className="text-xs text-muted-foreground mt-1">A receipt has been sent to your email.</p>
                </div>

                <button 
                    onClick={() => setView('home')} 
                    className="btn btn-primary w-full py-4 text-lg font-bold shadow-lg"
                >
                    Return Home
                </button>
            </div>
        </div>
    );
};
