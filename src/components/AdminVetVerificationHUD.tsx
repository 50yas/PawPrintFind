
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/firebase';
import { VetVerificationRequest } from '../types';
import { GlassButton } from './ui/GlassButton';
import { GlassCard } from './ui/GlassCard';
import { useTranslation } from 'react-i18next';

export const AdminVetVerificationHUD: React.FC = () => {
    const { t } = useTranslation('common');
    const [requests, setRequests] = useState<VetVerificationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<VetVerificationRequest | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const fetchRequests = async () => {
            const pending = await dbService.getPendingVerifications();
            setRequests(pending);
            setLoading(false);
        };
        fetchRequests();
    }, []);

    const handleApprove = async (grantPro: boolean) => {
        if (!selectedRequest) return;
        setProcessing(true);
        try {
            await dbService.approveVetVerification(selectedRequest.id, grantPro);
            setRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
            setSelectedRequest(null);
            // Optional: Add toast or snackbar here if available in context
        } catch (error) {
            console.error("Approval failed", error);
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest || !rejectionReason) return;
        setProcessing(true);
        try {
            await dbService.rejectVetVerification(selectedRequest.id, rejectionReason);
            setRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
            setSelectedRequest(null);
            setRejectionReason('');
        } catch (error) {
            console.error("Rejection failed", error);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="text-primary font-mono animate-pulse p-8 flex items-center justify-center gap-2"><span>🛡️</span> {t('loadingVerifications')}</div>;

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(20,184,166,0.3)]">🛡️</div>
                    <div className="flex flex-col">
                        <span className="text-sm text-primary font-mono tracking-widest uppercase">Security Protocol</span>
                        <span>Vet Verification HUD</span>
                    </div>
                </h2>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-mono text-slate-400 border border-white/10">
                        PENDING: <span className="text-white font-bold">{requests.length}</span>
                    </span>
                </div>
            </div>

            {requests.length === 0 ? (
                <GlassCard className="flex-1 flex flex-col items-center justify-center p-12 text-center border-dashed border-white/10 bg-black/20">
                    <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center text-4xl mb-4 grayscale opacity-50">✅</div>
                    <h3 className="text-xl font-bold text-white mb-2">All Clear</h3>
                    <p className="text-slate-400 max-w-md">No pending verification requests. The queue is empty.</p>
                </GlassCard>
            ) : (
                <div className="grid lg:grid-cols-3 gap-6 flex-1 min-h-0">
                    {/* Request List */}
                    <div className="lg:col-span-1 space-y-3 overflow-y-auto custom-scrollbar pr-2 h-[calc(100vh-300px)]">
                        {requests.map(req => (
                            <div 
                                key={req.id} 
                                onClick={() => setSelectedRequest(req)}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                                    selectedRequest?.id === req.id 
                                    ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(20,184,166,0.1)]' 
                                    : 'bg-slate-900/40 border-white/5 hover:border-white/20 hover:bg-white/5'
                                }`}
                            >
                                {selectedRequest?.id === req.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className={`font-bold text-sm line-clamp-1 ${selectedRequest?.id === req.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{req.clinicName}</h4>
                                    <span className="text-[9px] font-black bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-wider">EXP-{new Date(req.submittedAt).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                                </div>
                                <p className="text-xs text-slate-500 truncate mb-3">{req.vetEmail}</p>
                                <div className="flex flex-wrap gap-1">
                                    {req.specialization.slice(0, 3).map(s => (
                                        <span key={s} className="text-[8px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-white/5">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Details Panel */}
                    <div className="lg:col-span-2 h-[calc(100vh-300px)]">
                        {selectedRequest ? (
                            <GlassCard className="h-full flex flex-col p-0 overflow-hidden border-primary/20">
                                {/* Header */}
                                <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-start">
                                    <div>
                                        <h3 className="text-2xl font-black text-white tracking-tight">{selectedRequest.clinicName}</h3>
                                        <div className="flex items-center gap-3 mt-2 text-sm">
                                            <span className="text-slate-400">License: <span className="font-mono text-white bg-slate-800 px-2 py-0.5 rounded ml-1">{selectedRequest.licenseNumber}</span></span>
                                            <span className="text-slate-600">•</span>
                                            <span className="text-primary">{selectedRequest.vetEmail}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Submitted</p>
                                        <p className="text-white font-mono text-sm">{new Date(selectedRequest.submittedAt).toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                                    {/* Documents */}
                                    <section>
                                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <span>📂 Evidence Locker</span>
                                            <span className="bg-slate-800 text-white px-1.5 rounded-full text-[9px]">{selectedRequest.documentUrls.length}</span>
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            {selectedRequest.documentUrls.map((url, i) => (
                                                <a 
                                                    key={i} 
                                                    href={url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="group relative aspect-[4/3] bg-slate-900 rounded-xl border border-white/10 hover:border-primary/50 transition-all overflow-hidden flex flex-col items-center justify-center p-4 hover:shadow-lg hover:shadow-primary/5"
                                                >
                                                    <div className="absolute inset-0 bg-slate-800 transition-opacity group-hover:opacity-0 flex items-center justify-center">
                                                        <span className="text-3xl opacity-50">📄</span>
                                                    </div>
                                                    {/* Attempt to show preview if image, else generic icon */}
                                                    <img src={url} alt="Doc" className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-40 transition-opacity" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                                    
                                                    <div className="relative z-10 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                                        <span className="text-xs font-bold text-white mb-1">Document {i + 1}</span>
                                                        <span className="text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 uppercase">OPEN</span>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Specialization */}
                                    <section>
                                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">⚕️ Medical Capabilities</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedRequest.specialization.map(s => (
                                                <span key={s} className="px-3 py-1.5 bg-slate-800 rounded-lg text-xs text-slate-300 border border-white/5 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </section>
                                </div>

                                {/* Footer / Actions */}
                                <div className="p-6 bg-slate-950/50 border-t border-white/10 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 sm:col-span-1 space-y-2">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">Action Protocol</p>
                                            <div className="flex gap-2">
                                                <GlassButton 
                                                    onClick={() => handleApprove(false)} 
                                                    isLoading={processing}
                                                    className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 !py-3 !text-xs"
                                                >
                                                    Verify Basic
                                                </GlassButton>
                                                <GlassButton 
                                                    onClick={() => handleApprove(true)} 
                                                    isLoading={processing}
                                                    className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30 !py-3 !text-xs"
                                                >
                                                    Verify + PRO
                                                </GlassButton>
                                            </div>
                                        </div>
                                        <div className="col-span-2 sm:col-span-1 space-y-2">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">Rejection Protocol</p>
                                            <div className="flex gap-2">
                                                <input 
                                                    value={rejectionReason}
                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                    placeholder="Reason..."
                                                    className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 text-xs text-white focus:border-red-500 outline-none"
                                                />
                                                <GlassButton 
                                                    onClick={handleReject} 
                                                    disabled={!rejectionReason || processing}
                                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30 !py-3 !text-xs"
                                                >
                                                    Reject
                                                </GlassButton>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        ) : (
                            <GlassCard className="h-full flex flex-col items-center justify-center text-center p-12 border-dashed border-white/10 bg-white/5">
                                <span className="text-6xl mb-4 opacity-30">👈</span>
                                <h3 className="text-lg font-bold text-white mb-2">Awaiting Selection</h3>
                                <p className="text-slate-400 text-sm">Select a pending request from the sidebar to initialize review protocol.</p>
                            </GlassCard>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
