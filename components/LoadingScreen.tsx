
import React, { useEffect, useState } from 'react';
import { useTranslations } from '../hooks/useTranslations';

export const LoadingScreen: React.FC = () => {
  const { t } = useTranslations();
  const [showLogo, setShowLogo] = useState(false);
  const [bootLine, setBootLine] = useState(0);
  const [pulseIntensity, setPulseIntensity] = useState(1);

  const bootSequence = [
      t('bootInitializing'),
      t('bootCalibrating'),
      t('bootConnecting'),
      t('bootSyncing'),
      t('bootLoading'),
      t('bootReady')
  ];

  useEffect(() => {
      // Staggered entrance animation
      const logoTimer = setTimeout(() => setShowLogo(true), 100);

      // Run boot text sequence with smooth progression
      const interval = setInterval(() => {
          setBootLine(prev => {
              if (prev < bootSequence.length - 1) return prev + 1;
              clearInterval(interval);
              return prev;
          });
      }, 350); // Speed of text updates

      // Subtle pulsing intensity variation for the core logo
      const pulseInterval = setInterval(() => {
          setPulseIntensity(prev => (prev === 1 ? 1.15 : 1));
      }, 2000);

      return () => {
          clearInterval(interval);
          clearInterval(pulseInterval);
          clearTimeout(logoTimer);
      };
  }, []);

  const progress = Math.round((bootLine / (bootSequence.length - 1)) * 100);

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden bg-black flex flex-col items-center justify-center font-mono-tech hud-grid-bg">
        {/* Cinematic Vignette & Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black opacity-80 pointer-events-none"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

        <div className={`relative z-10 flex flex-col items-center justify-center transition-all duration-1000 ease-out transform ${showLogo ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
            {/* Animated Logo Container */}
            <div className="relative w-40 h-40 mb-10">
                {/* Enhanced Outer Rotating Rings with Smooth GPU-Accelerated Animation */}
                <div
                    className="absolute -inset-2 border border-primary/10 rounded-full neon-glow-teal motion-reduce:animate-none will-change-transform"
                    style={{ animation: 'spin 20s linear infinite' }}
                ></div>
                <div
                    className="absolute inset-0 border border-cyan-500/20 rounded-full motion-reduce:animate-none will-change-transform"
                    style={{ animation: 'spin 10s linear infinite' }}
                ></div>
                <div
                    className="absolute inset-2 border border-purple-500/20 rounded-full motion-reduce:animate-none will-change-transform"
                    style={{ animation: 'spin 15s linear infinite reverse' }}
                ></div>

                {/* Enhanced Pulsing Glow with Dynamic Intensity */}
                <div
                    className="absolute inset-0 rounded-full animate-pulse-soft motion-reduce:animate-none pointer-events-none"
                    style={{
                        boxShadow: `0 0 ${100 * pulseIntensity}px rgba(6,182,212,${0.15 * pulseIntensity})`,
                        transition: 'box-shadow 2s cubic-bezier(0.05, 0.7, 0.1, 1)'
                    }}
                ></div>

                {/* Core Logo with Enhanced Glow and Smooth Transitions */}
                <div
                    className="absolute inset-6 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 z-10 will-change-transform motion-reduce:shadow-[0_0_30px_rgba(0,243,255,0.4)]"
                    style={{
                        boxShadow: `0 0 ${50 * pulseIntensity}px rgba(0,243,255,${0.4 * pulseIntensity})`,
                        transition: 'box-shadow 2s cubic-bezier(0.05, 0.7, 0.1, 1)'
                    }}
                >
                    <svg className="h-16 w-16 text-white fill-current drop-shadow-md" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                        <g transform="translate(0, 20) scale(0.9) translate(28, 0)">
                            <path d="M490.39,182.75c-5.55-13.19-14.77-22.7-26.67-27.49l-.16-.06a46.46,46.46,0,0,0-17-3.2h-.64c-27.24.41-55.05,23.56-69.19,57.61-10.37,24.9-11.56,51.68-3.18,71.64,5.54,13.2,14.78,22.71,26.73,27.5l.13.05a46.53,46.53,0,0,0,17,3.2c27.5,0,55.6-23.15,70-57.65C497.65,229.48,498.78,202.72,490.39,182.75Z"/>
                            <path d="M381.55,329.61c-15.71-9.44-30.56-18.37-40.26-34.41C314.53,250.8,298.37,224,256,224s-58.57,26.8-85.39,71.2c-9.72,16.06-24.6,25-40.36,34.48-18.07,10.86-36.74,22.08-44.8,44.16a66.93,66.93,0,0,0-4.65,25c0,35.95,28,65.2,62.4,65.2,17.75,0,36.64-6.15,56.63-12.66,19.22-6.26,39.09-12.73,56.27-12.73s37,6.47,56.15,12.73C332.2,457.85,351,464,368.8,464c34.35,0,62.3-29.25,62.3-65.2a67,67,0,0,0-4.75-25C418.29,351.7,399.61,340.47,381.55,329.61Z"/>
                            <path d="M150,188.85c11.9,14.93,27,23.15,42.52,23.15a42.88,42.88,0,0,0,6.33-.47c32.37-4.76,52.54-44.26,45.92-90C242,102.3,234.6,84.39,224,71.11,212.12,56.21,197,48,181.49,48a42.88,42.88,0,0,0-6.33.47c-32.37,4.76-52.54,44.26-45.92,90C132,157.67,139.4,175.56,150,188.85Z"/>
                            <path d="M313.16,211.53a42.88,42.88,0,0,0,6.33.47c15.53,0,30.62-8.22,42.52-23.15,10.59-13.29,17.95-31.18,20.75-50.4h0c6.62-45.72-13.55-85.22-45.92-90a42.88,42.88,0,0,0-6.33-.47C315,48,299.88,56.21,288,71.11c-10.6,13.28-18,31.19-20.76,50.44C260.62,167.27,280.79,206.77,313.16,211.53Z"/>
                            <path d="M111.59,308.8l.14-.05c11.93-4.79,21.16-14.29,26.69-27.48,8.38-20,7.2-46.75-3.15-71.65C120.94,175.16,92.85,152,65.38,152a46.4,46.4,0,0,0-17,3.2l-.14.05C36.34,160,27.11,169.54,21.58,182.73c-8.38,20-7.2,46.75,3.15,71.65C39.06,288.84,67.15,312,94.62,312A46.4,46.4,0,0,0,111.59,308.8Z"/>
                        </g>
                    </svg>
                </div>
            </div>

            {/* Typography with Enhanced Gradient Animation */}
            <div className="flex flex-col items-center mb-8">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white flex flex-col items-center">
                    <span className="leading-tight opacity-90">PAW PRINT</span>
                    <span
                        className="logo-print-text bg-clip-text bg-gradient-to-r from-[#00f3ff] via-[#bc13fe] to-[#00f3ff] leading-tight will-change-transform motion-reduce:animate-none"
                        style={{
                            backgroundSize: '200% auto',
                            animation: 'shimmer 3s ease-in-out infinite, pulse-soft 2s ease-in-out infinite',
                            filter: 'brightness(1.1) drop-shadow(0 0 15px rgba(188,19,254,0.6))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        FIND
                    </span>
                </h1>
                <div className="h-1.5 w-24 bg-gradient-to-r from-primary to-secondary rounded-full mt-4 animate-pulse-soft motion-reduce:animate-none"></div>
            </div>

            {/* Enhanced Loading Bar with Smooth Shimmer */}
            <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden mb-6 relative">
                <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent motion-reduce:hidden"
                    style={{
                        animation: 'shimmer 2s ease-in-out infinite',
                        backgroundSize: '200% 100%'
                    }}
                ></div>
                <div
                    className="h-full bg-gradient-to-r from-[#00f3ff] via-[#bc13fe] to-[#00f3ff] rounded-full transition-all duration-300 ease-out will-change-transform"
                    style={{
                        width: `${progress}%`,
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s linear infinite'
                    }}
                ></div>
            </div>
            <p className="text-[10px] font-mono text-primary/40 tracking-widest mt-2 tabular-nums">{progress}%</p>

            {/* Enhanced Boot Sequence Terminal with Typewriter Effect */}
            <div className="h-16 flex flex-col items-center justify-end overflow-hidden">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-cyan-600">&gt;</span>
                    <p
                        className="text-sm font-mono text-[#00f3ff] tracking-[0.1em] uppercase motion-reduce:animate-pulse"
                        style={{
                            animation: bootLine < bootSequence.length - 1
                                ? 'pulse-soft 1.5s ease-in-out infinite'
                                : 'glow-breathe 2s ease-in-out infinite'
                        }}
                    >
                        {bootSequence[bootLine]}
                    </p>
                    {bootLine < bootSequence.length - 1 && (
                        <span className="inline-block w-1.5 h-3.5 bg-[#00f3ff] animate-blink ml-1 motion-reduce:opacity-100"></span>
                    )}
                </div>
                {/* Ghost text for layout stability */}
                <p className="invisible text-xs font-mono">SYSTEM READY</p>
            </div>
        </div>

        {/* Optimized Inline Styles for Smooth Animations */}
        <style>{`
            @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }

            @keyframes blink {
                0%, 49% { opacity: 1; }
                50%, 100% { opacity: 0; }
            }

            .animate-blink {
                animation: blink 1s step-end infinite;
            }

            /* Ensure smooth 60fps animations with GPU acceleration */
            @media (prefers-reduced-motion: no-preference) {
                .will-change-transform {
                    will-change: transform;
                }
            }
        `}</style>
    </div>
  );
};
