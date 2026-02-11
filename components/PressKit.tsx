
import React, { useState } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { Modal } from './Modal';

interface PressKitProps {
    goBack: () => void;
}

// --------------------------------------------------------
// ASSET COMPONENTS (SVG Definitions)
// --------------------------------------------------------

const IconSVG = ({ fill = "white" }: { fill?: string }) => (
    <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(28, 20) scale(0.9)">
            <path fill={fill} d="M490.39,182.75c-5.55-13.19-14.77-22.7-26.67-27.49l-.16-.06a46.46,46.46,0,0,0-17-3.2h-.64c-27.24.41-55.05,23.56-69.19,57.61-10.37,24.9-11.56,51.68-3.18,71.64,5.54,13.2,14.78,22.71,26.73,27.5l.13.05a46.53,46.53,0,0,0,17,3.2c27.5,0,55.6-23.15,70-57.65C497.65,229.48,498.78,202.72,490.39,182.75Z"/>
            <path fill={fill} d="M381.55,329.61c-15.71-9.44-30.56-18.37-40.26-34.41C314.53,250.8,298.37,224,256,224s-58.57,26.8-85.39,71.2c-9.72,16.06-24.6,25-40.36,34.48-18.07,10.86-36.74,22.08-44.8,44.16a66.93,66.93,0,0,0-4.65,25c0,35.95,28,65.2,62.4,65.2,17.75,0,36.64-6.15,56.63-12.66,19.22-6.26,39.09-12.73,56.27-12.73s37,6.47,56.15,12.73C332.2,457.85,351,464,368.8,464c34.35,0,62.3-29.25,62.3-65.2a67,67,0,0,0-4.75-25C418.29,351.7,399.61,340.47,381.55,329.61Z"/>
            <path fill={fill} d="M150,188.85c11.9,14.93,27,23.15,42.52,23.15a42.88,42.88,0,0,0,6.33-.47c32.37-4.76,52.54-44.26,45.92-90C242,102.3,234.6,84.39,224,71.11,212.12,56.21,197,48,181.49,48a42.88,42.88,0,0,0-6.33.47c-32.37,4.76-52.54,44.26-45.92,90C132,157.67,139.4,175.56,150,188.85Z"/>
            <path fill={fill} d="M313.16,211.53a42.88,42.88,0,0,0,6.33.47c15.53,0,30.62-8.22,42.52-23.15,10.59-13.29,17.95-31.18,20.75-50.4h0c6.62-45.72-13.55-85.22-45.92-90a42.88,42.88,0,0,0-6.33-.47C315,48,299.88,56.21,288,71.11c-10.6,13.28-18,31.19-20.76,50.44C260.62,167.27,280.79,206.77,313.16,211.53Z"/>
            <path fill={fill} d="M111.59,308.8l.14-.05c11.93-4.79,21.16-14.29,26.69-27.48,8.38-20,7.2-46.75-3.15-71.65C120.94,175.16,92.85,152,65.38,152a46.4,46.4,0,0,0-17,3.2l-.14.05C36.34,160,27.11,169.54,21.58,182.73c-8.38,20-7.2,46.75,3.15,71.65C39.06,288.84,67.15,312,94.62,312A46.4,46.4,0,0,0,111.59,308.8Z"/>
        </g>
    </svg>
);

const WordmarkSVG = ({ fill = "white" }: { fill?: string }) => (
    <svg viewBox="0 0 600 80" xmlns="http://www.w3.org/2000/svg">
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" fontSize="42" fill={fill} letterSpacing="-0.02em">
            PAWPRINT<tspan fill="#00f3ff">FIND</tspan>
        </text>
    </svg>
);

const LockupSVG = ({ fill = "white" }: { fill?: string }) => (
    <svg viewBox="0 0 900 160" xmlns="http://www.w3.org/2000/svg">
        {/* Paw icon - perfectly sized and positioned */}
        <g transform="translate(20, 20) scale(0.22)">
            <path fill={fill} d="M490.39,182.75c-5.55-13.19-14.77-22.7-26.67-27.49l-.16-.06a46.46,46.46,0,0,0-17-3.2h-.64c-27.24.41-55.05,23.56-69.19,57.61-10.37,24.9-11.56,51.68-3.18,71.64,5.54,13.2,14.78,22.71,26.73,27.5l.13.05a46.53,46.53,0,0,0,17,3.2c27.5,0,55.6-23.15,70-57.65C497.65,229.48,498.78,202.72,490.39,182.75Z"/>
            <path fill={fill} d="M381.55,329.61c-15.71-9.44-30.56-18.37-40.26-34.41C314.53,250.8,298.37,224,256,224s-58.57,26.8-85.39,71.2c-9.72,16.06-24.6,25-40.36,34.48-18.07,10.86-36.74,22.08-44.8,44.16a66.93,66.93,0,0,0-4.65,25c0,35.95,28,65.2,62.4,65.2,17.75,0,36.64-6.15,56.63-12.66,19.22-6.26,39.09-12.73,56.27-12.73s37,6.47,56.15,12.73C332.2,457.85,351,464,368.8,464c34.35,0,62.3-29.25,62.3-65.2a67,67,0,0,0-4.75-25C418.29,351.7,399.61,340.47,381.55,329.61Z"/>
            <path fill={fill} d="M150,188.85c11.9,14.93,27,23.15,42.52,23.15a42.88,42.88,0,0,0,6.33-.47c32.37-4.76,52.54-44.26,45.92-90C242,102.3,234.6,84.39,224,71.11,212.12,56.21,197,48,181.49,48a42.88,42.88,0,0,0-6.33.47c-32.37,4.76-52.54,44.26-45.92,90C132,157.67,139.4,175.56,150,188.85Z"/>
            <path fill={fill} d="M313.16,211.53a42.88,42.88,0,0,0,6.33.47c15.53,0,30.62-8.22,42.52-23.15,10.59-13.29,17.95-31.18,20.75-50.4h0c6.62-45.72-13.55-85.22-45.92-90a42.88,42.88,0,0,0-6.33-.47C315,48,299.88,56.21,288,71.11c-10.6,13.28-18,31.19-20.76,50.44C260.62,167.27,280.79,206.77,313.16,211.53Z"/>
            <path fill={fill} d="M111.59,308.8l.14-.05c11.93-4.79,21.16-14.29,26.69-27.48,8.38-20,7.2-46.75-3.15-71.65C120.94,175.16,92.85,152,65.38,152a46.4,46.4,0,0,0-17,3.2l-.14.05C36.34,160,27.11,169.54,21.58,182.73c-8.38,20-7.2,46.75,3.15,71.65C39.06,288.84,67.15,312,94.62,312A46.4,46.4,0,0,0,111.59,308.8Z"/>
        </g>
        {/* Text - vertically centered with icon */}
        <g>
            <text x="145" y="95" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" fontSize="52" fill={fill} letterSpacing="-0.03em">
                PAWPRINT<tspan fill="#00f3ff">FIND</tspan>
            </text>
        </g>
    </svg>
);

// --------------------------------------------------------
// MODAL & LOGIC
// --------------------------------------------------------

type AssetType = 'icon' | 'wordmark' | 'lockup';
type FileFormat = 'png' | 'jpg' | 'svg';

interface AssetPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: AssetType;
}

const AssetPreviewModal: React.FC<AssetPreviewModalProps> = ({ isOpen, onClose, type }) => {
    const { t } = useTranslations();
    const [format, setFormat] = useState<FileFormat>('png');
    const [background, setBackground] = useState<'transparent' | 'colored'>('colored');

    if (!isOpen) return null;

    const getSvgString = (fillColor: string) => {
        const svgContent =
            type === 'icon' ? (
                `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><g transform="translate(28, 20) scale(0.9)"><path fill="${fillColor}" d="M490.39,182.75c-5.55-13.19-14.77-22.7-26.67-27.49l-.16-.06a46.46,46.46,0,0,0-17-3.2h-.64c-27.24.41-55.05,23.56-69.19,57.61-10.37,24.9-11.56,51.68-3.18,71.64,5.54,13.2,14.78,22.71,26.73,27.5l.13.05a46.53,46.53,0,0,0,17,3.2c27.5,0,55.6-23.15,70-57.65C497.65,229.48,498.78,202.72,490.39,182.75Z"/><path fill="${fillColor}" d="M381.55,329.61c-15.71-9.44-30.56-18.37-40.26-34.41C314.53,250.8,298.37,224,256,224s-58.57,26.8-85.39,71.2c-9.72,16.06-24.6,25-40.36,34.48-18.07,10.86-36.74,22.08-44.8,44.16a66.93,66.93,0,0,0-4.65,25c0,35.95,28,65.2,62.4,65.2,17.75,0,36.64-6.15,56.63-12.66,19.22-6.26,39.09-12.73,56.27-12.73s37,6.47,56.15,12.73C332.2,457.85,351,464,368.8,464c34.35,0,62.3-29.25,62.3-65.2a67,67,0,0,0-4.75-25C418.29,351.7,399.61,340.47,381.55,329.61Z"/><path fill="${fillColor}" d="M150,188.85c11.9,14.93,27,23.15,42.52,23.15a42.88,42.88,0,0,0,6.33-.47c32.37-4.76,52.54-44.26,45.92-90C242,102.3,234.6,84.39,224,71.11,212.12,56.21,197,48,181.49,48a42.88,42.88,0,0,0-6.33.47c-32.37,4.76-52.54,44.26-45.92,90C132,157.67,139.4,175.56,150,188.85Z"/><path fill="${fillColor}" d="M313.16,211.53a42.88,42.88,0,0,0,6.33.47c15.53,0,30.62-8.22,42.52-23.15,10.59-13.29,17.95-31.18,20.75-50.4h0c6.62-45.72-13.55-85.22-45.92-90a42.88,42.88,0,0,0-6.33-.47C315,48,299.88,56.21,288,71.11c-10.6,13.28-18,31.19-20.76,50.44C260.62,167.27,280.79,206.77,313.16,211.53Z"/><path fill="${fillColor}" d="M111.59,308.8l.14-.05c11.93-4.79,21.16-14.29,26.69-27.48,8.38-20,7.2-46.75-3.15-71.65C120.94,175.16,92.85,152,65.38,152a46.4,46.4,0,0,0-17,3.2l-.14.05C36.34,160,27.11,169.54,21.58,182.73c-8.38,20-7.2,46.75,3.15,71.65C39.06,288.84,67.15,312,94.62,312A46.4,46.4,0,0,0,111.59,308.8Z"/></g></svg>`
            ) : type === 'wordmark' ? (
                `<svg viewBox="0 0 600 80" xmlns="http://www.w3.org/2000/svg"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="42" fill="${fillColor}" letter-spacing="-0.02em">PAWPRINT<tspan fill="#00f3ff">FIND</tspan></text></svg>`
            ) : (
                `<svg viewBox="0 0 900 160" xmlns="http://www.w3.org/2000/svg"><g transform="translate(20, 20) scale(0.22)"><path fill="${fillColor}" d="M490.39,182.75c-5.55-13.19-14.77-22.7-26.67-27.49l-.16-.06a46.46,46.46,0,0,0-17-3.2h-.64c-27.24.41-55.05,23.56-69.19,57.61-10.37,24.9-11.56,51.68-3.18,71.64,5.54,13.2,14.78,22.71,26.73,27.5l.13.05a46.53,46.53,0,0,0,17,3.2c27.5,0,55.6-23.15,70-57.65C497.65,229.48,498.78,202.72,490.39,182.75Z"/><path fill="${fillColor}" d="M381.55,329.61c-15.71-9.44-30.56-18.37-40.26-34.41C314.53,250.8,298.37,224,256,224s-58.57,26.8-85.39,71.2c-9.72,16.06-24.6,25-40.36,34.48-18.07,10.86-36.74,22.08-44.8,44.16a66.93,66.93,0,0,0-4.65,25c0,35.95,28,65.2,62.4,65.2,17.75,0,36.64-6.15,56.63-12.66,19.22-6.26,39.09-12.73,56.27-12.73s37,6.47,56.15,12.73C332.2,457.85,351,464,368.8,464c34.35,0,62.3-29.25,62.3-65.2a67,67,0,0,0-4.75-25C418.29,351.7,399.61,340.47,381.55,329.61Z"/><path fill="${fillColor}" d="M150,188.85c11.9,14.93,27,23.15,42.52,23.15a42.88,42.88,0,0,0,6.33-.47c32.37-4.76,52.54-44.26,45.92-90C242,102.3,234.6,84.39,224,71.11,212.12,56.21,197,48,181.49,48a42.88,42.88,0,0,0-6.33.47c-32.37,4.76-52.54,44.26-45.92,90C132,157.67,139.4,175.56,150,188.85Z"/><path fill="${fillColor}" d="M313.16,211.53a42.88,42.88,0,0,0,6.33.47c15.53,0,30.62-8.22,42.52-23.15,10.59-13.29,17.95-31.18,20.75-50.4h0c6.62-45.72-13.55-85.22-45.92-90a42.88,42.88,0,0,0-6.33-.47C315,48,299.88,56.21,288,71.11c-10.6,13.28-18,31.19-20.76,50.44C260.62,167.27,280.79,206.77,313.16,211.53Z"/><path fill="${fillColor}" d="M111.59,308.8l.14-.05c11.93-4.79,21.16-14.29,26.69-27.48,8.38-20,7.2-46.75-3.15-71.65C120.94,175.16,92.85,152,65.38,152a46.4,46.4,0,0,0-17,3.2l-.14.05C36.34,160,27.11,169.54,21.58,182.73c-8.38,20-7.2,46.75,3.15,71.65C39.06,288.84,67.15,312,94.62,312A46.4,46.4,0,0,0,111.59,308.8Z"/></g><g><text x="145" y="95" font-family="sans-serif" font-weight="800" font-size="52" fill="${fillColor}" letter-spacing="-0.03em">PAWPRINT<tspan fill="#00f3ff">FIND</tspan></text></g></svg>`
            );
        return svgContent;
    };

    const handleDownload = () => {
        const fillColor = background === 'transparent' ? '#0d9488' : 'white'; // Teal if transparent bg, White if colored bg
        let svgString = getSvgString(fillColor);

        // Wrap if background color is selected
        if (background === 'colored') {
            const width = type === 'icon' ? 512 : type === 'wordmark' ? 400 : 600;
            const height = type === 'icon' ? 512 : type === 'wordmark' ? 100 : 200;
            // Inject background rect
            const bgRect = `<rect width="100%" height="100%" fill="#0d9488" rx="20" />`;
            // Regex to insert after first <svg ... >
            svgString = svgString.replace('>', `>${bgRect}`);
        }

        if (format === 'svg') {
            const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `pawprint-${type}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            // Rasterize for PNG/JPG
            const canvas = document.createElement('canvas');
            const sizeMap = { icon: 1024, wordmark: 800, lockup: 1200 };
            const aspectMap = { icon: 1, wordmark: 0.25, lockup: 0.33 };
            
            canvas.width = sizeMap[type];
            canvas.height = sizeMap[type] * aspectMap[type];
            
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);

            img.onload = () => {
                if (ctx) {
                    if (format === 'jpg') {
                        // JPG needs solid background, if user selected transparent, force white for jpg
                        if (background === 'transparent') {
                            ctx.fillStyle = "#FFFFFF";
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                        }
                    }
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
                    const dataUrl = canvas.toDataURL(mime, 0.9);
                    
                    const link = document.createElement('a');
                    link.href = dataUrl;
                    link.download = `pawprint-${type}.${format}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }
            };
            img.src = url;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('downloadAsset')}>
            <div className="space-y-6">
                {/* Preview */}
                <div className={`w-full aspect-[2/1] rounded-2xl flex items-center justify-center border-2 border-dashed ${background === 'colored' ? 'bg-primary border-primary/30' : 'bg-white/5 border-white/10 hud-grid-bg'}`}>
                    <div className="w-2/3 h-2/3 flex items-center justify-center">
                        {type === 'icon' && <IconSVG fill={background === 'colored' ? 'white' : '#0d9488'} />}
                        {type === 'wordmark' && <WordmarkSVG fill={background === 'colored' ? 'white' : '#0d9488'} />}
                        {type === 'lockup' && <LockupSVG fill={background === 'colored' ? 'white' : '#0d9488'} />}
                    </div>
                </div>

                {/* Configuration */}
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('formatLabel')}</label>
                        <div className="flex gap-2">
                            {(['png', 'jpg', 'svg'] as FileFormat[]).map(f => (
                                <button 
                                    key={f} 
                                    onClick={() => setFormat(f)}
                                    className={`px-3 py-2 rounded-xl text-sm font-bold border transition-all ${format === f ? 'bg-primary text-white border-primary neon-glow-teal' : 'border-white/10 text-slate-400 hover:border-primary/50 hover:text-white'}`}
                                >
                                    {f.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('bgLabel')}</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setBackground('transparent')}
                                className={`px-3 py-2 rounded-xl text-sm font-bold border transition-all ${background === 'transparent' ? 'bg-primary text-white border-primary neon-glow-teal' : 'border-white/10 text-slate-400 hover:border-primary/50 hover:text-white'}`}
                            >
                                {t('transparentBg')}
                            </button>
                            <button
                                onClick={() => setBackground('colored')}
                                className={`px-3 py-2 rounded-xl text-sm font-bold border transition-all ${background === 'colored' ? 'bg-primary text-white border-primary neon-glow-teal' : 'border-white/10 text-slate-400 hover:border-primary/50 hover:text-white'}`}
                            >
                                {t('coloredBg')}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                    <button onClick={handleDownload} className="w-full btn btn-primary rounded-xl neon-glow-teal">
                        {t('downloadButton')} {type.toUpperCase()}
                    </button>
                </div>
            </div>
        </Modal>
    )
}

export const PressKit: React.FC<PressKitProps> = ({ goBack }) => {
    const { t } = useTranslations();
    const [selectedAsset, setSelectedAsset] = useState<AssetType | null>(null);

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-24">
            <AssetPreviewModal 
                isOpen={!!selectedAsset} 
                onClose={() => setSelectedAsset(null)} 
                type={selectedAsset || 'icon'} 
            />

            <button onClick={goBack} className="text-slate-400 hover:text-primary font-bold transition-colors mb-6">&larr; {t('homeButton')}</button>

            <header className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">{t('pressKitTitle')}</h1>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto">{t('pressKitDesc')}</p>
                <div className="cyber-divider max-w-xs mx-auto mt-6"></div>
            </header>

            {/* Enhanced Asset Grid with Smooth Animations */}
            <div className="grid md:grid-cols-3 gap-8">
                {/* 1. Icon Only */}
                <div
                    onClick={() => setSelectedAsset('icon')}
                    className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 cursor-pointer group scan-hover overflow-hidden will-change-transform transition-all duration-300 ease-emphasized-decelerate hover:-translate-y-2 active:scale-95"
                    style={{
                        transition: 'all 300ms cubic-bezier(0.05, 0.7, 0.1, 1)'
                    }}
                >
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-all duration-300 rounded-3xl"></div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_30px_rgba(6,182,212,0.2)] rounded-3xl pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="h-40 flex items-center justify-center mb-6 bg-white/5 rounded-2xl border border-dashed border-white/10 group-hover:border-primary/40 transition-all duration-300">
                            <div className="w-24 h-24 text-primary transform group-hover:scale-110 transition-transform duration-300 ease-emphasized-decelerate">
                                <IconSVG fill="currentColor" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors duration-300">{t('assetLogoIcon')}</h3>
                            <p className="text-sm text-slate-400 mt-2 group-hover:text-slate-300 transition-colors duration-300">Best for avatars, favicons, and app icons.</p>
                        </div>
                    </div>
                </div>

                {/* 2. Wordmark Only */}
                <div
                    onClick={() => setSelectedAsset('wordmark')}
                    className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 cursor-pointer group scan-hover overflow-hidden will-change-transform transition-all duration-300 ease-emphasized-decelerate hover:-translate-y-2 active:scale-95"
                    style={{
                        transition: 'all 300ms cubic-bezier(0.05, 0.7, 0.1, 1)'
                    }}
                >
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-all duration-300 rounded-3xl"></div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_30px_rgba(6,182,212,0.2)] rounded-3xl pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="h-40 flex items-center justify-center mb-6 bg-white/5 rounded-2xl border border-dashed border-white/10 group-hover:border-primary/40 transition-all duration-300">
                            <div className="w-48 text-primary transform group-hover:scale-110 transition-transform duration-300 ease-emphasized-decelerate">
                                <WordmarkSVG fill="currentColor" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors duration-300">{t('assetLogoText')}</h3>
                            <p className="text-sm text-slate-400 mt-2 group-hover:text-slate-300 transition-colors duration-300">The brand name in official typography.</p>
                        </div>
                    </div>
                </div>

                {/* 3. Full Lockup */}
                <div
                    onClick={() => setSelectedAsset('lockup')}
                    className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 cursor-pointer group scan-hover overflow-hidden will-change-transform transition-all duration-300 ease-emphasized-decelerate hover:-translate-y-2 active:scale-95"
                    style={{
                        transition: 'all 300ms cubic-bezier(0.05, 0.7, 0.1, 1)'
                    }}
                >
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-all duration-300 rounded-3xl"></div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_30px_rgba(6,182,212,0.2)] rounded-3xl pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="h-40 flex items-center justify-center mb-6 bg-white/5 rounded-2xl border border-dashed border-white/10 group-hover:border-primary/40 transition-all duration-300">
                            <div className="w-56 text-primary transform group-hover:scale-110 transition-transform duration-300 ease-emphasized-decelerate">
                                <LockupSVG fill="currentColor" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors duration-300">{t('assetLogoLockup')}</h3>
                            <p className="text-sm text-slate-400 mt-2 group-hover:text-slate-300 transition-colors duration-300">The standard logo for headers and partnerships.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Typography Section */}
            <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full blur-[60px] pointer-events-none"></div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                    <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                    Typography
                    <span className="flex-1 h-px bg-gradient-to-r from-purple-500/20 to-transparent"></span>
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <p className="text-sm text-slate-400 mb-2 font-mono uppercase tracking-wider">UI Font</p>
                        <h3 className="text-4xl font-extrabold mb-2 font-sans text-white">Plus Jakarta Sans</h3>
                        <p className="text-lg text-slate-300">Aa Bb Cc Dd Ee Ff Gg 123</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-400 mb-2 font-mono uppercase tracking-wider">Data/Tech Font</p>
                        <h3 className="text-4xl font-mono-tech mb-2 text-primary">Space Mono</h3>
                        <p className="text-lg font-mono-tech text-slate-300">Aa Bb Cc Dd Ee Ff Gg 123</p>
                    </div>
                </div>
            </section>
        </div>
    );
};
