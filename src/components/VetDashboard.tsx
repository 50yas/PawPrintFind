
import React, { useState, useEffect } from 'react';
import { View, User } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { Appointment } from '../types';
import { VetVerificationModal } from './VetVerificationModal';
import { VetProUpgradeModal } from './VetProUpgradeModal';
import { ProFeatureTeaser } from './ui/ProFeatureTeaser';
import { PetProfile } from '../types';
import { dbService } from '../services/firebase';

interface VetDashboardProps {
    user: User;
    setView: (view: View) => void;
    pendingPatientCount: number;
    pendingAppointmentCount: number;
    confirmedPatientCount: number;
    todaysAppointments: Appointment[];
    patients?: PetProfile[]; // Pass patients for analytics
}

const StatWidget: React.FC<{ title: string; value: number; icon: React.ReactNode; colorClass: string; onClick: () => void }> = ({ title, value, icon, colorClass, onClick }) => (
    <div onClick={onClick} className="glass-panel p-6 rounded-2xl cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-white/20 bg-white/10 backdrop-blur-xl flex items-center justify-center md:justify-between group text-center md:text-left">
        <div>
            <p className="text-slate-200 text-xs font-bold uppercase tracking-wider mb-2 drop-shadow-sm">{title}</p>
            <h3 className="text-4xl font-bold text-white tracking-tight drop-shadow-md">{value}</h3>
        </div>
        <div className={`p-4 rounded-xl ${colorClass} group-hover:scale-110 transition-transform hidden md:block shadow-lg`}>
            {icon}
        </div>
    </div>
);

const ActionCard: React.FC<{ title: string; description: string; onClick: () => void; icon: React.ReactNode; isPro?: boolean }> = ({ title, description, onClick, icon, isPro }) => (
    <div onClick={onClick} className={`bg-white/5 backdrop-blur-xl p-5 rounded-2xl border cursor-pointer hover:bg-primary/10 transition-all flex items-center gap-4 group scan-hover ${isPro ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/10'}`}>
        <div className={`p-3 rounded-xl ${isPro ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'} group-hover:bg-primary group-hover:text-white transition-colors`}>
            {icon}
        </div>
        <div>
            <div className="flex items-center gap-2">
                <h4 className="font-bold text-white text-sm">{title}</h4>
                {isPro && <span className="text-[10px] font-black bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded uppercase border border-amber-500/20">PRO</span>}
            </div>
            <p className="text-xs text-slate-400">{description}</p>
        </div>
        <div className="ml-auto text-slate-500 group-hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
        </div>
    </div>
);

export const VetDashboard: React.FC<VetDashboardProps> = ({ user, setView, pendingPatientCount, pendingAppointmentCount, confirmedPatientCount, todaysAppointments, patients = [] }) => {
    const { t } = useTranslations();
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [patientLimitInfo, setPatientLimitInfo] = useState({ current: 0, limit: 5, reached: false });
    const [verificationRequest, setVerificationRequest] = useState<any>(null);

    // Fetch verification status
    useEffect(() => {
        if (!user?.uid) return;
        const fetchStatus = async () => {
            const req = await dbService.getVerificationStatus(user.uid);
            setVerificationRequest(req);
        };
        fetchStatus();
    }, [user.uid]);

    // Check patient limit (read-only, no state mutations)
    // Check patient limit (read-only, no state mutations)
    useEffect(() => {
        let isMounted = true;
        const checkLimit = async () => {
            if (!user?.uid) return;

            console.log(`[VetDashboard] Checking patient limit for ${user.uid}...`);
            try {
                const limitInfo = await dbService.checkPatientLimit(user.uid);
                if (isMounted) {
                    console.log('[VetDashboard] Patient limit info received:', limitInfo);
                    setPatientLimitInfo(limitInfo);
                }
            } catch (error) {
                console.error('[VetDashboard] Error checking limit:', error);
            }
        };

        checkLimit();

        return () => {
            isMounted = false;
        };
    }, [user.uid]); // strictly depend on user.uid string, not the user object

    const isPro = user.vetTier === 'pro' && (!user.vetProExpiry || user.vetProExpiry > Date.now());
    const isVerified = user.isVetVerified || false;
    const hasSubmittedDocs = user.vetDocumentsSubmitted || false;
    const isRejected = verificationRequest?.status === 'rejected';
    const currentTier = user.vetTier || 'free';
    const patientLimit = user.vetMonthlyPatientsLimit || 5;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Modals */}
            {showVerificationModal && (
                <VetVerificationModal
                    onClose={() => {
                        setShowVerificationModal(false);
                        // Refresh status
                        dbService.getVerificationStatus(user.uid).then(setVerificationRequest);
                    }}
                    vetUid={user.uid}
                    vetEmail={user.email}
                />
            )}
            {showUpgradeModal && (
                <VetProUpgradeModal
                    onClose={() => setShowUpgradeModal(false)}
                    vetUid={user.uid}
                    isVerified={isVerified}
                />
            )}

            {/* Tier Status Banner */}
            {!isPro && (
                <div className={`border rounded-xl p-4 ${
                    isRejected 
                    ? 'bg-red-500/10 border-red-500/30' 
                    : 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30'
                }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className={`font-bold flex items-center gap-2 ${isRejected ? 'text-red-400' : 'text-yellow-400'}`}>
                                <span>{isRejected ? '❌' : '🆓'}</span>
                                {isRejected ? t('dashboard:vet.verificationRejectedTitle') : t('dashboard:vet.freeTierTitle')}
                                {hasSubmittedDocs && !isRejected && <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">⏳ {t('dashboard:vet.pendingVerificationBadge')}</span>}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">
                                {isRejected 
                                    ? `Reason: ${verificationRequest.rejectionReason || 'Documents invalid or incomplete.'}`
                                    : hasSubmittedDocs
                                        ? 'Your verification is under review. Upgrade to Pro will be available once verified!'
                                        : `${patientLimitInfo.current}/${patientLimitInfo.limit} patients this month • Submit documents to unlock Pro upgrade`}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowVerificationModal(true)}
                            className={`px-4 py-2 rounded-xl font-bold text-sm hover:scale-105 transition-all ${
                                isRejected
                                ? 'bg-red-500 text-white'
                                : 'bg-gradient-to-r from-primary to-cyan-500 text-black'
                            }`}
                        >
                            {isRejected ? t('dashboard:vet.retryVerification') : (hasSubmittedDocs ? (isVerified ? t('dashboard:vet.upgradeToPro') : t('dashboard:vet.pendingVerificationBtn')) : t('dashboard:vet.submitDocuments'))}
                        </button>
                    </div>
                </div>
            )}

            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-900 to-cyan-900 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px]"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 opacity-80">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.761 2.156 18 5.402 18h9.196c3.246 0 4.585-3.239 2.707-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clipRule="evenodd" /></svg>
                        <span className="text-sm font-bold uppercase tracking-wider">{t('dashboard:vet.practicePortal')}</span>
                        {isPro && <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase ml-2 shadow-sm">👑 PRO</span>}
                    </div>
                    <h1 className="text-3xl font-bold">{t('vetDashboardTitle')}</h1>
                    <p className="text-teal-100 mt-1">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="flex gap-3 relative z-10">
                    {isPro ? (
                        <div className="flex flex-col gap-1">
                            <button className="btn bg-white/20 text-white hover:bg-white/30 font-bold shadow-lg flex items-center gap-2 border border-white/30 backdrop-blur-sm">
                                <span>👑 Pro Active</span>
                            </button>
                            <span className="text-xs text-teal-100 text-center">Until {new Date(user.vetProExpiry!).toLocaleDateString()}</span>
                        </div>
                    ) : (
                        <button onClick={() => setShowUpgradeModal(true)} className="btn bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900 hover:brightness-110 font-black shadow-lg flex items-center gap-2 transform hover:-translate-y-0.5 transition-all">
                            <span>🦁 Upgrade to Pro</span>
                        </button>
                    )}
                    <button onClick={() => setView('smartCalendar')} className="btn bg-white text-teal-800 hover:bg-teal-50 font-bold shadow-lg flex items-center gap-2">
                        <span>+ {t('newAppointmentTitle')}</span>
                    </button>
                </div>
            </header>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatWidget
                    title={t('pendingRequests')}
                    value={pendingPatientCount}
                    onClick={() => setView('myPatients')}
                    colorClass="bg-orange-500/20 text-orange-400"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
                />
                <StatWidget
                    title={t('pendingAppointmentsStat')}
                    value={pendingAppointmentCount}
                    onClick={() => setView('smartCalendar')}
                    colorClass="bg-blue-500/20 text-blue-400"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                />
                <StatWidget
                    title={t('confirmedPatients')}
                    value={confirmedPatientCount}
                    onClick={() => setView('myPatients')}
                    colorClass="bg-emerald-500/20 text-emerald-400"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Today's Schedule */}
                <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-white/20">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-2 h-6 bg-primary rounded-full"></span>
                        {t('todaysScheduleTitle')}
                        <span className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent"></span>
                    </h3>
                    {todaysAppointments.length > 0 ? (
                        <div className="space-y-3">
                            {todaysAppointments.sort((a, b) => a.time.localeCompare(b.time)).map(app => (
                                <div key={app.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-primary/30 transition-all hover:bg-primary/5">
                                    <div className="flex-shrink-0 w-20 text-center bg-primary/10 rounded-xl py-2 border border-primary/20">
                                        <p className="font-mono font-bold text-lg text-primary">{app.time}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg">{app.petName}</h4>
                                        <p className="text-sm text-slate-400">{app.notes || t('generalCheckup')}</p>
                                    </div>
                                    <div className="ml-auto">
                                        <span className="px-3 py-1 text-xs font-bold bg-green-500/20 text-green-400 rounded-full uppercase tracking-wide flex items-center gap-1 border border-green-500/20">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                            {t('confirmedStatus')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white/5 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center hud-grid-bg">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-white/10">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <p className="text-slate-300 font-medium">{t('noAppointmentsToday')}</p>
                            <p className="text-xs text-slate-500 mt-1">{t('dashboard:vet.freeTime')}</p>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white mb-4 px-2">{t('quickActionsTitle')}</h3>
                    <ActionCard
                        title={t('manageClinicNav')}
                        description={t('dashboard:vet.actionManageClinicDesc')}
                        onClick={() => setView('myClinic')}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                    />
                    <ActionCard
                        title={t('managePatientsNav')}
                        description={t('dashboard:vet.actionManagePatientsDesc')}
                        onClick={() => setView('myPatients')}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                    />
                    <ActionCard
                        title={t('smartCalendarNav')}
                        description={t('dashboard:vet.actionSmartCalendarDesc')}
                        onClick={() => setView('smartCalendar')}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    />
                    {/* Pro-only features */}
                    {isPro ? (
                        <>
                            <ActionCard
                                title={t('dashboard:vet.aiHealthAnalytics')}
                                description={t('dashboard:vet.aiHealthAnalyticsDesc')}
                                onClick={() => alert('AI Analytics coming soon!')}
                                isPro={true}
                                icon={<span className="text-xl">📊</span>}
                            />
                            <ActionCard
                                title={t('dashboard:vet.prioritySupport')}
                                description={t('dashboard:vet.prioritySupportDesc')}
                                onClick={() => alert('Priority Support coming soon!')}
                                isPro={true}
                                icon={<span className="text-xl">🚀</span>}
                            />
                        </>
                    ) : (
                        <div className="space-y-4">
                            <ProFeatureTeaser
                                title={t('dashboard:vet.aiHealthAnalytics')}
                                desc={t('dashboard:vet.aiHealthAnalyticsDesc')}
                                icon="📊"
                                onUpgrade={() => setShowUpgradeModal(true)}
                            />
                            <ProFeatureTeaser
                                title={t('dashboard:vet.prioritySupport')}
                                desc={t('dashboard:vet.prioritySupportDesc')}
                                icon="🚀"
                                onUpgrade={() => setShowUpgradeModal(true)}
                            />
                        </div>
                    ) }
                </div>
            </div>
        </div>
    );
};
