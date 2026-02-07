
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/firebase';
import { VetVerificationRequest } from '../types';
import { GlassButton } from './ui/GlassButton';
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
            alert('Request approved successfully!');
        } catch (error) {
            alert('Approval failed.');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest || !rejectionReason) {
            alert('Please provide a reason for rejection.');
            return;
        }
        setProcessing(true);
        try {
            await dbService.rejectVetVerification(selectedRequest.id, rejectionReason);
            setRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
            setSelectedRequest(null);
            setRejectionReason('');
            alert('Request rejected.');
        } catch (error) {
            alert('Rejection failed.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="text-primary font-mono animate-pulse p-8">{t('loadingVerifications')}</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <span className="text-primary">🛡️</span>
                Vet Verification HUD
            </h2>

            {requests.length === 0 ? (
                <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-12 text-center">
                    <p className="text-slate-400">No pending verification requests. Good job!</p>
                </div>
            ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* List */}
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {requests.map(req => (
                            <div 
                                key={req.id} 
                                onClick={() => setSelectedRequest(req)}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                    selectedRequest?.id === req.id 
                                    ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' 
                                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-white">{req.clinicName}</h4>
                                        <p className="text-xs text-slate-400">{req.vetEmail}</p>
                                    </div>
                                    <span className="text-[10px] font-black bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded uppercase">
                                        PENDING
                                    </span>
                                </div>
                                <div className="mt-3 flex gap-2">
                                    {req.specialization.slice(0, 2).map(s => (
                                        <span key={s} className="text-[9px] font-bold bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                                            {s}
                                        </span>
                                    ))}
                                    {req.specialization.length > 2 && <span className="text-[9px] text-slate-500">+{req.specialization.length - 2} more</span>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Details/Actions */}
                    <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 sticky top-0">
                        {selectedRequest ? (
                            <div className="space-y-6">
                                <header>
                                    <h3 className="text-xl font-bold text-white">{selectedRequest.clinicName}</h3>
                                    <p className="text-sm text-slate-400">License: <span className="text-primary font-mono">{selectedRequest.licenseNumber}</span></p>
                                </header>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Submitted Documents</h4>
                                    <div className="grid gap-2">
                                        {selectedRequest.documentUrls.map((url, i) => (
                                            <a 
                                                key={i} 
                                                href={url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors border border-slate-700"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">📄</span>
                                                    <div>
                                                        <p className="text-xs text-white font-bold">Document {i + 1}</p>
                                                        <p className="text-[10px] text-slate-500 uppercase">{selectedRequest.documentTypes?.[url] || 'Unknown Type'}</p>
                                                    </div>
                                                </div>
                                                <span className="text-primary text-xs font-bold">VIEW →</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-800 space-y-4">
                                    <div className="flex gap-2">
                                        <GlassButton 
                                            onClick={() => handleApprove(false)} 
                                            loading={processing}
                                            className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 border-emerald-500/30"
                                        >
                                            Approve Free
                                        </GlassButton>
                                        <GlassButton 
                                            onClick={() => handleApprove(true)} 
                                            loading={processing}
                                            className="flex-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 border-amber-500/30 shadow-lg shadow-amber-500/10"
                                        >
                                            Approve + PRO 👑
                                        </GlassButton>
                                    </div>

                                    <div className="space-y-2">
                                        <textarea 
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Reason for rejection (sent to vet)..."
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-red-500 outline-none h-20"
                                        />
                                        <GlassButton 
                                            onClick={handleReject} 
                                            disabled={!rejectionReason || processing}
                                            className="w-full bg-red-500/20 hover:bg-red-500/40 text-red-400 border-red-500/30"
                                        >
                                            Reject Request ✖
                                        </GlassButton>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-50">
                                <span className="text-6xl mb-4">👈</span>
                                <p className="text-slate-400 font-medium">Select a request from the list to review details and take action.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
