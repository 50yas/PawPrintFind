
import React, { useState, useEffect } from 'react';
import { View, User } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { Appointment } from '../types';
import { VetVerificationModal } from './VetVerificationModal';
import { VetProUpgradeModal } from './VetProUpgradeModal';
import { ProFeatureTeaser } from './ui/ProFeatureTeaser';
import { PetProfile } from '../types';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { dbService, db } from '../services/firebase';

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

    // Listen to verification status in real-time
    useEffect(() => {
        if (!user?.uid) return;
        const q = query(
            collection(db, 'vet_verification_requests'),
            where('vetUid', '==', user.uid)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                // sort by submittedAt descending to get the latest
                const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                requests.sort((a: any, b: any) => (b.submittedAt || 0) - (a.submittedAt || 0));
                setVerificationRequest(requests[0]);
            } else {
                setVerificationRequest(null);
            }
        }, (error) => {
            console.error('[VetDashboard] verification listener error:', error);
        });
        return () => unsubscribe();
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

    // Hardened Verification Logic: Prioritize the latest snapshot request status.
    const latestReqStatus = verificationRequest?.status;
    const isPending = latestReqStatus === 'pending' || user.verificationStatus === 'pending';
    const isApproved = latestReqStatus === 'approved' || user.verificationStatus === 'approved' || user.isVetVerified;
    const isDeclined = !isPending && !isApproved && (latestReqStatus === 'rejected' || user.verificationStatus === 'declined');

    const currentTier = user.vetTier || 'free';
    const patientLimit = user.vetMonthlyPatientsLimit || 5;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Modals */}
            {showVerificationModal && (
                <VetVerificationModal
                    onClose={() => {
                        setShowVerificationModal(false);
                        // Status refreshes via real-time listener automatically
                    }}
                    vetUid={user.uid}
                    vetEmail={user.email}
                    initialRejectionReason={user.rejectionReason || verificationRequest?.rejectionReason}
                />
            )}
            {showUpgradeModal && (
                <VetProUpgradeModal
                    onClose={() => setShowUpgradeModal(false)}
                    vetUid={user.uid}
                    isVerified={isApproved ?? false}
                />
            )}

            {/* Verification Status Banner */}
            {!isApproved ? (
                <div className={`border rounded-2xl p-6 shadow-xl backdrop-blur-xl ${isDeclined
                    ? 'bg-red-500/10 border-red-500/30'
                    : isPending
                        ? 'bg-blue-500/10 border-blue-500/30 animate-pulse-subtle'
                        : 'bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-teal-500/30'
                    }`}>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex shrink-0 items-center justify-center text-2xl ${isDeclined ? 'bg-red-500/20 text-red-400' : isPending ? 'bg-blue-500/20 text-blue-400' : 'bg-teal-500/20 text-teal-400'
                                }`}>
                                {isDeclined ? '⚠️' : isPending ? '⏳' : '🛡️'}
                            </div>
                            <div>
                                <h3 className={`text-lg font-black uppercase tracking-tight ${isDeclined ? 'text-red-400' : isPending ? 'text-blue-400' : 'text-teal-400'
                                    }`}>
                                    {isDeclined
                                        ? t('dashboard:vet.verificationRejectedTitle', 'Verification Rejected')
                                        : isPending
                                            ? t('dashboard:vet.pendingVerificationTitle', 'Verification Under Review')
                                            : t('dashboard:vet.notVerifiedTitle', 'Verify Professional Status')}
                                </h3>
                                <p className="text-sm text-slate-300 mt-1 max-w-md">
                                    {isDeclined
                                        ? `${t('dashboard:vet.rejectionReason', 'Reason')}: ${user.rejectionReason || verificationRequest?.rejectionReason || 'Documents invalid.'}`
                                        : isPending
                                            ? t('dashboard:vet.pendingVerificationDesc', 'Our team is reviewing your credentials. You will have full access once verified.')
                                            : t('dashboard:vet.verifyToUnlockDesc', 'Submit your license and clinic documents to unlock Pro features and community badges.')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowVerificationModal(true)}
                            disabled={isPending}
                            className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${isDeclined
                                ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'
                                : isPending
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                                    : 'bg-primary text-black hover:scale-105 shadow-lg shadow-primary/20'
                                }`}
                        >
                            {isDeclined
                                ? t('dashboard:vet.retryVerification', 'Retry Verification')
                                : isPending
                                    ? t('dashboard:vet.pendingVerificationBtn', 'Awaiting Review')
                                    : t('dashboard:vet.submitDocuments', 'Submit Documents')}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="border rounded-2xl p-6 shadow-xl backdrop-blur-xl bg-emerald-500/10 border-emerald-500/30">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="w-12 h-12 rounded-full flex shrink-0 items-center justify-center text-2xl bg-emerald-500/20 text-emerald-400">
                                ✓
                            </div>
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tight text-emerald-400">
                                    {t('dashboard:vet.verifiedTitle', 'Identity Verified')}
                                </h3>
                                <p className="text-sm text-slate-300 mt-1 max-w-md">
                                    {t('dashboard:vet.verifiedDesc', 'Your professional credentials have been authenticated.')}
                                    {isPro ? ` ${t('dashboard:vet.proActiveDesc', 'You currently enjoy unlimited Pro access.')}` : ` ${t('dashboard:vet.upgradeProDesc', 'Upgrade to Pro to unlock unlimited patient tracking and advanced AI diagnostics.')}`}
                                </p>
                            </div>
                        </div>
                        {!isPro && (
                            <button
                                onClick={() => setShowUpgradeModal(true)}
                                className="px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900 hover:scale-105 shadow-lg shadow-amber-500/20 flex items-center gap-2"
                            >
                                <span>👑 Unlock Pro</span>
                            </button>
                        )}
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
                <div className="flex flex-wrap sm:flex-nowrap gap-3 relative z-10 w-full md:w-auto">
                    {isPro ? (
                        <div className="flex flex-col gap-1 items-end">
                            <button className="bg-white/10 text-white font-bold shadow-lg flex items-center gap-2 border border-white/20 backdrop-blur-md rounded-xl px-5 py-2.5 cursor-default transition-all">
                                <span className="text-yellow-400">👑</span> Pro Active
                            </button>
                            {user.vetProExpiry && <span className="text-[10px] text-teal-200/70 font-bold uppercase tracking-widest pr-2">Until {new Date(user.vetProExpiry).toLocaleDateString()}</span>}
                        </div>
                    ) : isApproved ? (
                        <button
                            onClick={() => setShowUpgradeModal(true)}
                            className="bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900 font-black shadow-lg flex items-center gap-2 transition-all rounded-xl px-5 py-2.5 hover:scale-105 hover:shadow-amber-500/20"
                        >
                            <span>👑 Upgrade PRO</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowVerificationModal(true)}
                            className="bg-white/10 border border-white/20 text-white font-black shadow-lg flex items-center gap-2 transition-all rounded-xl px-5 py-2.5 hover:bg-white/20 text-xs uppercase tracking-widest"
                            title="Complete verification to unlock Pro"
                        >
                            <span>🛡️ Verify to Unlock PRO</span>
                        </button>
                    )}
                    <button onClick={() => setView('smartCalendar')} className="bg-white text-teal-900 hover:bg-teal-50 font-black shadow-lg flex items-center gap-2 rounded-xl px-5 py-2.5 transition-all hover:scale-105 h-fit">
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
                                onClick={() => setView('myPatients')}
                                isPro={true}
                                icon={<span className="text-xl">📊</span>}
                            />
                            <ActionCard
                                title={t('dashboard:vet.prioritySupport')}
                                description={t('dashboard:vet.prioritySupportDesc')}
                                onClick={() => window.open('mailto:support@pawprintfind.com?subject=Pro Support Request', '_blank')}
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
                    )}
                </div>
            </div>
        </div>
    );
};
