
import React, { useState, useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { Modal } from './Modal';
import { LoadingSpinner } from './LoadingSpinner';
import { dbService } from '../services/firebase';

interface DonationModalProps {
    onClose: () => void;
    isOpen: boolean;
    onSuccess?: () => void;
}

// Strategia dei "Tagli" per incentivare le donazioni (Stripe)
const getDonationTiers = (t: any) => [
    {
        id: 'tier_coffee',
        amount: 5,
        emoji: '☕',
        label: t('tierCoffeeLabel'),
        desc: t('tierCoffeeDesc'),
        perks: ['❤️ Eternal gratitude', '🎖️ Community Supporter badge']
    },
    {
        id: 'tier_supporter',
        amount: 25,
        emoji: '🌟',
        label: t('tierSupporterLabel'),
        desc: t('tierSupporterDesc'),
        perks: ['All Coffee perks', '⭐ Featured Donor status', '🎁 Early access to new features']
    },
    {
        id: 'tier_hero',
        amount: 100,
        emoji: '🦁',
        label: t('tierHeroLabel'),
        desc: t('tierHeroDesc'),
        perks: ['All Supporter perks', '👑 Hero of the Community badge', '🎯 Direct feature requests', '💝 Personal thank you from the team']
    }
];

const CryptoIcon = ({ symbol }: { symbol: string }) => {
    switch (symbol) {
        case 'BTC':
            return (
                <svg viewBox="0 0 32 32" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="16" fill="#F7931A" />
                    <path fill="#FFF" d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.402-1.594-4.212 1.132-.26 1.984-.999 2.21-2.529zm-3.962 5.617c-.542 2.175-4.206 1.001-5.393.706l.962-3.858c1.187.295 4.977.878 4.431 3.152zm.537-5.642c-.496 1.989-3.566.98-4.556.734l.872-3.496c.99.246 4.195.706 3.684 2.762z" />
                </svg>
            );
        case 'ETH':
            return (
                <svg viewBox="0 0 32 32" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="16" fill="#627EEA" />
                    <g fill="#FFF">
                        <path d="M16.498 4v8.87l7.497 3.35z" fillOpacity=".602" />
                        <path d="M16.498 4L9 16.22l7.498-3.35z" />
                        <path d="M16.498 21.968v6.027L24 17.616z" fillOpacity=".602" />
                        <path d="M16.498 27.995v-6.028L9 17.616z" />
                        <path d="M16.498 20.573l7.497-4.353-7.497-3.348z" fillOpacity=".2" />
                        <path d="M9 16.22l7.498 4.353v-7.701z" fillOpacity=".602" />
                    </g>
                </svg>
            );
        case 'SOL':
            return (
                <svg viewBox="0 0 32 32" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="16" fill="#000" />
                    <path d="M24.7 9.85a.707.707 0 00-.7-.7h-16a.707.707 0 00-.57.3.707.707 0 00-.07.64l2.56 12.8a.707.707 0 00.7.56h16a.707.707 0 00.57-.3.707.707 0 00.07-.64l-2.56-12.66z" fill="url(#sol_grad)" opacity="0" />
                    {/* Simplified Gradient Representation */}
                    <path d="M25.5 7.75h-18.1c-.4 0-.7.3-.8.7l-1.3 6.6c-.1.4.2.8.6.8h18.1c.4 0 .7-.3.8-.7l1.3-6.6c.1-.4-.2-.8-.6-.8z" fill="#14F195" />
                    <path d="M25.5 15.85h-18.1c-.4 0-.7.3-.8.7l-1.3 6.6c-.1.4.2.8.6.8h18.1c.4 0 .7-.3.8-.7l1.3-6.6c.1-.4-.2-.8-.6-.8z" fill="#9945FF" />
                    <path d="M6.5 11.85h18.1c.4 0 .7-.3.8-.7l1.3-6.6c.1-.4-.2-.8-.6-.8H8c-.4 0-.7.3-.8.7l-1.3 6.6c-.1.4.2.8.6.8z" fill="#00FFA3" transform="scale(1 -1) translate(0 -24)" />
                </svg>
            );
        case 'BNB':
            return (
                <svg viewBox="0 0 32 32" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="16" fill="#F3BA2F" />
                    <path fill="#FFF" d="M12.116 16L16 19.886 19.884 16 16 12.113 12.116 16zm-4.058 0l3.023 3.023L16 23.908l4.919-4.885L23.942 16l-3.023-3.023L16 8.092l-4.919 4.885L7.058 16zM16 4.757L4.757 16 16 27.243 27.243 16 16 4.757z" />
                </svg>
            );
        default:
            return <div className="w-8 h-8 rounded-full bg-gray-500"></div>;
    }
}

const CRYPTO_WALLETS = [
    {
        symbol: 'BTC',
        name: 'Bitcoin',
        address: 'bc1qwyyjx9xcf23h04rwd34ptepqurn2c6h4zqme55',
        color: 'border-orange-500/20 bg-orange-500/5'
    },
    {
        symbol: 'ETH',
        name: 'Ethereum',
        address: '0x8e712F2AC423C432e860AB41c20aA13fe5b4DD04',
        color: 'border-blue-500/20 bg-blue-500/5'
    },
    {
        symbol: 'SOL',
        name: 'Solana',
        address: '4Gt3VPbwWXsRWjMJxGgjuX8sVd7b2LX3nzzbbH7Hp7Uy',
        color: 'border-purple-500/20 bg-purple-500/5'
    },
    {
        symbol: 'BNB',
        name: 'BNB Chain',
        address: '0x8e712F2AC423C432e860AB41c20aA13fe5b4DD04',
        color: 'border-yellow-500/20 bg-yellow-500/5'
    }
];

const CostBreakdown = ({ t, totalRaised }: { t: any, totalRaised?: number }) => {
    const monthlyCosts = [
        { key: 'aiInferenceCosts', val: '€120.00', icon: '🤖', color: 'text-cyan-400' },
        { key: 'cloudInfrastructure', val: '€45.00', icon: '☁️', color: 'text-blue-400' },
        { key: 'developmentTime', val: '450+ hrs', icon: '👨‍💻', color: 'text-purple-400' }
    ];

    const totalMonthly = 165;
    const currentMonthDonations = 85; // This should come from real data
    const percentageCovered = Math.min((currentMonthDonations / totalMonthly) * 100, 100);

    return (
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 space-y-4 shadow-inner">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                {t('dashboard:admin.platformCostsTitle')}
            </h4>

            <div className="space-y-4">
                {monthlyCosts.map((c, i) => (
                    <div key={i} className="flex justify-between items-center group bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/10 transition-colors">
                        <span className="text-xs text-slate-300 flex items-center gap-3">
                            <span className="text-lg bg-black/20 p-2 rounded-lg">{c.icon}</span>
                            <span className="font-medium">{t(`dashboard:admin.${c.key}`)}</span>
                        </span>
                        <span className={`text-xs font-mono font-bold ${c.color} bg-black/30 px-3 py-1.5 rounded-lg shadow-inner`}>
                            {c.val}
                        </span>
                    </div>
                ))}

                <div className="pt-4 border-t border-white/10 mt-2">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black text-white uppercase">{t('dashboard:admin.totalMonthlyCosts')}</span>
                        <span className="text-sm font-black text-primary drop-shadow-[0_0_8px_rgba(20,184,166,0.4)]">€{totalMonthly}.00 / mo</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px]">
                            <span className="text-slate-500">Total Raised (All Time)</span>
                            <span className="text-primary font-bold">€{totalRaised?.toLocaleString() || '0'}</span>
                        </div>
                        {/* Visual Progress considering 5000 as a milestone for visual sake or just show infinite progress */}
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-white/10">
                            <div
                                className="h-full bg-gradient-to-r from-primary via-cyan-400 to-primary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(20,184,166,0.5)]"
                                style={{ width: `${Math.min(((totalRaised || 0) / 5000) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <p className="text-[9px] text-slate-500 italic leading-relaxed text-center">
                {t('dashboard:admin.donationsHelpCover')}
            </p>
        </div>
    );
};

export const DonationModal: React.FC<DonationModalProps> = ({ onClose, isOpen, onSuccess }) => {
    const { t } = useTranslations();
    const [totalRaised, setTotalRaised] = useState(0);

    useEffect(() => {
        if (isOpen) {
            dbService.getPublicStats().then(stats => {
                if (stats.totalDonations) setTotalRaised(stats.totalDonations);
            }).catch(console.error);
        }
    }, [isOpen]);

    // Tabs: 'stripe' (Card) or 'crypto'
    const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'crypto'>('stripe');

    // Stripe State
    const [selectedAmount, setSelectedAmount] = useState<number>(25);
    const [customAmount, setCustomAmount] = useState<string>('');
    const [isCustom, setIsCustom] = useState(false);

    // User Data (Optional for Stripe, Not needed for Crypto)
    const [donorName, setDonorName] = useState('');
    const [donorEmail, setDonorEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isPublic, setIsPublic] = useState(true);

    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Crypto State
    const [selectedCrypto, setSelectedCrypto] = useState(CRYPTO_WALLETS[0]);
    const [cryptoCopied, setCryptoCopied] = useState(false);

    // Sync custom amount
    useEffect(() => {
        if (isCustom) {
            const num = parseFloat(customAmount);
            if (!isNaN(num) && num > 0) setSelectedAmount(num);
        }
    }, [customAmount, isCustom]);

    // Pre-fill user data if logged in (convenience, not required)
    useEffect(() => {
        const user = dbService.auth.currentUser;
        if (user && !user.isAnonymous) {
            if (user.displayName) setDonorName(user.displayName);
            if (user.email) setDonorEmail(user.email);
        }
    }, [isOpen]);

    const handleTierSelect = (amount: number) => {
        setIsCustom(false);
        setSelectedAmount(amount);
        setCustomAmount('');
    };

    const handleCustomFocus = () => {
        setIsCustom(true);
        if (!customAmount) setSelectedAmount(0);
    };

    const handleCopyCrypto = () => {
        navigator.clipboard.writeText(selectedCrypto.address);
        setCryptoCopied(true);
        setTimeout(() => setCryptoCopied(false), 2000);
    };

    const donationTiers = getDonationTiers(t);

    const handleStripePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (selectedAmount < 1) {
            setErrorMsg(t('minDonationError'));
            return;
        }

        setIsProcessing(true);

        try {
            const donationId = Date.now().toString();

            await dbService.recordDonation({
                id: donationId,
                donorName: isPublic ? (donorName || t('anonymousName')) : t('anonymousName'),
                realName: donorName,
                email: donorEmail,
                amount: `€${selectedAmount.toFixed(2)}`,
                numericValue: selectedAmount,
                message: message,
                timestamp: Date.now(),
                status: 'pending_payment',
                approved: false,
                isPublic: isPublic
            });

            const { url } = await dbService.createCheckoutSession(selectedAmount, donationId, donorEmail, donorName);
            window.location.href = url;

        } catch (error: any) {
            console.error("Payment error:", error);
            let msg = t('paymentConnectionError');
            if (error.code === 'auth/admin-restricted-operation' || error.message.includes('auth')) {
                msg = t('firebaseAuthError');
            }
            setErrorMsg(msg);
            setIsProcessing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('donateTitle')}>
            <div className="flex flex-col h-full animate-fade-in">

                {/* Payment Method Tabs */}
                <div className="flex p-1.5 bg-black/40 backdrop-blur-md rounded-2xl mb-6 border border-white/10 shadow-inner">
                    <button
                        onClick={() => setPaymentMethod('stripe')}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${paymentMethod === 'stripe' ? 'bg-gradient-to-r from-primary/80 to-teal-500/80 shadow-[0_0_15px_rgba(20,184,166,0.5)] text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <span>💳</span> {t('paymentMethodCard')}
                    </button>
                    <button
                        onClick={() => setPaymentMethod('crypto')}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${paymentMethod === 'crypto' ? 'bg-gradient-to-r from-blue-500/80 to-purple-500/80 shadow-[0_0_15px_rgba(59,130,246,0.5)] text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <span>🔗</span> {t('paymentMethodCrypto')}
                    </button>
                </div>

                {/* --- STRIPE VIEW --- */}
                {paymentMethod === 'stripe' && (
                    <form onSubmit={handleStripePayment} className="space-y-6">
                        {/* Tiers */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {donationTiers.map((tier) => (
                                <button
                                    key={tier.id}
                                    type="button"
                                    onClick={() => handleTierSelect(tier.amount)}
                                    className={`relative p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-start text-center group overflow-hidden ${!isCustom && selectedAmount === tier.amount
                                        ? 'border-primary bg-primary/20 shadow-[0_0_20px_rgba(20,184,166,0.3)] scale-105 z-10'
                                        : 'border-white/10 bg-black/20 hover:border-primary/50 hover:bg-white/5'
                                        }`}
                                >
                                    {/* Active Glow Background */}
                                    {!isCustom && selectedAmount === tier.amount && (
                                        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>
                                    )}
                                    <div className="text-4xl mb-3 transform group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300">{tier.emoji}</div>
                                    <div className="font-bold text-xl text-white mb-1">€{tier.amount}</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2">{tier.label}</div>

                                    {/* Perks - shown on hover or when selected */}
                                    <div className={`text-[9px] text-left space-y-0.5 mt-2 pt-2 border-t border-white/5 transition-opacity w-full ${!isCustom && selectedAmount === tier.amount ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                        }`}>
                                        {tier.perks?.map((perk, i) => (
                                            <div key={i} className="text-slate-400 flex items-start gap-1">
                                                <span className="text-primary flex-shrink-0">✓</span>
                                                <span>{perk}</span>
                                            </div>
                                        ))}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Custom Amount */}
                        <div className={`relative transition-all duration-500 mt-6 ${isCustom ? 'opacity-100 transform translate-y-0' : 'opacity-70 hover:opacity-100 transform translate-y-1'}`}>
                            <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">{t('customAmount')}</label>
                            <div className="relative group">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-primary pointer-events-none transition-colors group-focus-within:text-white">€</span>
                                <input
                                    type="number"
                                    min="1"
                                    step="0.50"
                                    value={customAmount}
                                    onFocus={handleCustomFocus}
                                    onChange={(e) => setCustomAmount(e.target.value)}
                                    placeholder={t('donationAmountPlaceholder')}
                                    className={`w-full pl-12 pr-6 py-5 rounded-2xl border-2 font-black text-2xl bg-black/40 text-white transition-all outline-none backdrop-blur-md shadow-inner ${isCustom ? 'border-primary shadow-[0_0_20px_rgba(20,184,166,0.2)] bg-primary/5' : 'border-white/10 hover:border-primary/50'
                                        }`}
                                />
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-5 pt-6 border-t border-white/10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('yourNameLabel')} {t('optionalSuffix')}</label>
                                    <input type="text" value={donorName} onChange={e => setDonorName(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all" placeholder={t('donorNamePlaceholder')} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('emailLabel')} {t('receiptsSuffix')}</label>
                                    <input type="email" value={donorEmail} onChange={e => setDonorEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all" placeholder={t('donorEmailPlaceholder')} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('yourMessageLabel')}</label>
                                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all resize-none" placeholder={t('donationMessagePlaceholder')} />
                            </div>
                            <label className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors">
                                <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="h-5 w-5 rounded bg-black/50 border-white/20 text-primary focus:ring-primary/50 focus:ring-offset-0" />
                                <span className="text-sm font-medium text-slate-200">{t('publiclyVisible')}</span>
                            </label>
                        </div>

                        {errorMsg && <div className="p-3 bg-red-500/20 text-red-400 rounded-lg text-sm font-bold text-center animate-pulse">{errorMsg}</div>}

                        <CostBreakdown t={t} totalRaised={totalRaised} />

                        <div className="pt-4">
                            <button type="submit" disabled={isProcessing} className="w-full bg-gradient-to-r from-primary to-teal-500 text-slate-900 font-black tracking-widest uppercase rounded-2xl py-5 text-lg shadow-[0_0_30px_rgba(20,184,166,0.3)] hover:shadow-[0_0_40px_rgba(20,184,166,0.5)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isProcessing ? <LoadingSpinner /> : <><span className="text-2xl drop-shadow-md">💳</span><span>{t('payWithStripe')} {selectedAmount > 0 ? `€${selectedAmount.toFixed(2)}` : ''}</span></>}
                            </button>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-center text-slate-500 mt-4 flex items-center justify-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                                {t('securedByStripe')}
                            </p>
                        </div>
                    </form>
                )}

                {/* --- CRYPTO VIEW --- */}
                {paymentMethod === 'crypto' && (
                    <div className="space-y-6 py-2 text-center animate-slide-in-right">

                        {/* Coin Selection */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {CRYPTO_WALLETS.map((wallet) => (
                                <button
                                    key={wallet.symbol}
                                    onClick={() => { setSelectedCrypto(wallet); setCryptoCopied(false); }}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all group ${selectedCrypto.symbol === wallet.symbol
                                        ? `border-primary bg-primary/5 shadow-inner`
                                        : 'border-transparent hover:bg-white/10'
                                        }`}
                                >
                                    <div className="mb-2 transform group-hover:scale-110 transition-transform">
                                        <CryptoIcon symbol={wallet.symbol} />
                                    </div>
                                    <span className="text-[10px] font-bold text-white">{wallet.name}</span>
                                </button>
                            ))}
                        </div>

                        <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mx-auto border border-gray-200">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedCrypto.address}`}
                                alt={`${selectedCrypto.name} QR`}
                                className="w-40 h-40 mix-blend-multiply"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t('cryptoAddressLabel')} ({selectedCrypto.symbol})</p>

                                <div className="flex items-center gap-2 w-full max-w-sm mx-auto bg-black/40 rounded-xl border border-white/10 overflow-hidden shadow-inner p-1">
                                    <div className="flex-grow py-3 px-4 overflow-hidden relative group rounded-lg bg-white/5">
                                        <p className="text-xs font-mono text-primary font-bold truncate">{selectedCrypto.address}</p>
                                    </div>
                                    <button
                                        onClick={handleCopyCrypto}
                                        className="p-3 bg-white/5 border-l border-white/10 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center w-12 flex-shrink-0"
                                        title={t('copyButton')}
                                    >
                                        {cryptoCopied ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        )}
                                    </button>
                                </div>

                                {cryptoCopied && <p className="text-xs text-green-500 font-bold animate-pulse">{t('copiedButton')}</p>}
                            </div>

                            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                                {t('supportViaBlockchain')}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
