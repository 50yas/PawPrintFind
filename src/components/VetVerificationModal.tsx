import React, { useState } from 'react';
import { dbService } from '../services/firebase';
import type { VetVerificationRequest } from '../types';
import { GlassButton } from './ui/GlassButton';

interface VetVerificationModalProps {
    onClose: () => void;
    vetUid: string;
    vetEmail: string;
    initialRejectionReason?: string;
}

export const VetVerificationModal: React.FC<VetVerificationModalProps> = ({ onClose, vetUid, vetEmail, initialRejectionReason }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form state
    const [clinicName, setClinicName] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [specialization, setSpecialization] = useState<string[]>([]);
    const [uploadedDocs, setUploadedDocs] = useState<{ url: string; type: string; name: string }[]>([]);
    const [uploading, setUploading] = useState(false);

    const specializations = [
        'General Practice', 'Surgery', 'Radiology', 'Cardiology',
        'Dermatology', 'Oncology', 'Emergency Medicine', 'Dentistry'
    ];

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            const newDocs: { url: string; type: string; name: string }[] = [];
            for (const file of Array.from(files)) {
                // Check file size (10MB)
                if (file.size > 10 * 1024 * 1024) {
                    alert(`File ${file.name} is too large. Max size is 10MB.`);
                    continue;
                }
                const url = await dbService.uploadVerificationDoc(file, vetUid);
                newDocs.push({ url, type: 'Medical License', name: file.name });
            }
            setUploadedDocs(prev => [...prev, ...newDocs]);
        } catch (error: any) {
            console.error('[Upload Error]', error);
            alert(`Failed to upload documents: ${error.message || 'Unknown error'}. Please try again.`);
        } finally {
            setUploading(false);
        }
    };

    const updateDocType = (index: number, type: string) => {
        setUploadedDocs(prev => {
            const next = [...prev];
            next[index] = { ...next[index], type };
            return next;
        });
    };

    const handleSubmit = async () => {
        if (!clinicName || !licenseNumber || specialization.length === 0 || uploadedDocs.length === 0) {
            alert('Please complete all fields and upload at least one document.');
            return;
        }

        setLoading(true);
        try {
            const documentTypes: Record<string, string> = {};
            uploadedDocs.forEach(d => {
                documentTypes[d.url] = d.type;
            });

            const request: Omit<VetVerificationRequest, 'id'> = {
                vetUid,
                vetEmail,
                clinicName,
                licenseNumber,
                specialization,
                documentUrls: uploadedDocs.map(d => d.url),
                documentTypes,
                status: 'pending',
                submittedAt: Date.now()
            };

            await dbService.submitVetVerification(request);
            alert('Verification request submitted! We\'ll review it within 24-48 hours.');
            onClose();
        } catch (error: any) {
            alert('Failed to submit verification request: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900/95 border border-primary/30 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-primary/20">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <span className="text-primary">📄</span>
                        Professional Verification
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6  6l12 12" />
                        </svg>
                    </button>
                </div>

                {initialRejectionReason && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex gap-3">
                        <span className="text-xl">⚠️</span>
                        <div>
                            <p className="text-red-400 text-sm font-bold uppercase tracking-tight">Previous Request Declined</p>
                            <p className="text-red-200/70 text-xs mt-1">Reason: {initialRejectionReason}</p>
                            <p className="text-slate-400 text-[10px] mt-2 italic">Please update your information or documents and resubmit for review.</p>
                        </div>
                    </div>
                )}

                {/* Progress Indicator */}
                <div className="flex items-center gap-2 mb-8">
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className={`flex-1 h-2 rounded-full ${s <= step ? 'bg-primary' : 'bg-slate-700'} transition-all duration-300`} />
                    ))}
                </div>

                {/* Step 1: Clinic Info */}
                {step === 1 && (
                    <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Clinic Information</h3>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">Clinic Name*</label>
                            <input
                                type="text"
                                autoFocus
                                value={clinicName}
                                onChange={(e) => setClinicName(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:border-primary focus:outline-none"
                                placeholder="e.g. Happy Paws Veterinary Clinic"
                            />
                        </div>

                        <GlassButton type="submit" disabled={!clinicName} className="w-full mt-6">
                            Next: License Info →
                        </GlassButton>
                    </form>
                )}

                {/* Step 2: License */}
                {step === 2 && (
                    <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Professional License</h3>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">License Number*</label>
                            <input
                                type="text"
                                autoFocus
                                value={licenseNumber}
                                onChange={(e) => setLicenseNumber(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:border-primary focus:outline-none"
                                placeholder="e.g. VET123456"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">Specializations* (select all that apply)</label>
                            <div className="grid grid-cols-2 gap-2">
                                {specializations.map((spec) => (
                                    <button
                                        type="button"
                                        key={spec}
                                        onClick={() => setSpecialization(prev =>
                                            prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
                                        )}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${specialization.includes(spec)
                                                ? 'bg-primary text-black'
                                                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'
                                            }`}
                                    >
                                        {specialization.includes(spec) && '✓ '}
                                        {spec}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <GlassButton type="button" onClick={() => setStep(1)} variant="secondary" className="flex-1">
                                ← Back
                            </GlassButton>
                            <GlassButton type="submit" disabled={!licenseNumber || specialization.length === 0} className="flex-1">
                                Next: Upload Documents →
                            </GlassButton>
                        </div>
                    </form>
                )}

                {/* Step 3: Document Upload */}
                {step === 3 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Upload Documents</h3>

                        <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-primary transition-colors">
                            <input
                                type="file"
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="doc-upload"
                            />
                            <label htmlFor="doc-upload" className="cursor-pointer">
                                <div className="text-5xl mb-3">📎</div>
                                <p className="text-white font-bold mb-1">Click to upload or drag & drop</p>
                                <p className="text-sm text-slate-400">PDF, JPG, PNG (max 10MB each)</p>
                                <p className="text-xs text-slate-500 mt-2">Required: Medical License, Credentials, ID</p>
                            </label>
                        </div>

                        {uploading && (
                            <div className="text-center text-primary animate-pulse">
                                Uploading documents...
                            </div>
                        )}

                        {uploadedDocs.length > 0 && (
                            <div className="space-y-4">
                                <p className="text-sm font-bold text-slate-300">Categorize Uploaded Documents ({uploadedDocs.length})</p>
                                {uploadedDocs.map((doc, i) => (
                                    <div key={i} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <span className="text-primary text-xl">📄</span>
                                                <span className="text-sm text-slate-300 truncate" title={doc.name}>{doc.name}</span>
                                            </div>
                                            <button
                                                onClick={() => setUploadedDocs(prev => prev.filter((_, idx) => idx !== i))}
                                                className="text-red-400 hover:text-red-300 text-xs font-bold"
                                            >
                                                REMOVE
                                            </button>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Document Type</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['Medical License', 'Clinic Accreditation', 'Identity Document', 'Insurance', 'Other'].map(type => (
                                                    <button
                                                        key={type}
                                                        onClick={() => updateDocType(i, type)}
                                                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                                            doc.type === type 
                                                            ? 'bg-primary text-black' 
                                                            : 'bg-slate-700 text-slate-400 hover:text-white'
                                                        }`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-3 mt-6">
                            <GlassButton onClick={() => setStep(2)} variant="secondary" className="flex-1">
                                ← Back
                            </GlassButton>
                            <GlassButton onClick={() => setStep(4)} disabled={uploadedDocs.length === 0} className="flex-1">
                                Review & Submit →
                            </GlassButton>
                        </div>
                    </div>
                )}

                {/* Step 4: Review */}
                {step === 4 && (
                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Review Your Submission</h3>

                        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs text-slate-400 uppercase font-bold">Clinic Name</span>
                                    <p className="text-white font-medium">{clinicName}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400 uppercase font-bold">License Number</span>
                                    <p className="text-white font-medium">{licenseNumber}</p>
                                </div>
                            </div>
                            
                            <div>
                                <span className="text-xs text-slate-400 uppercase font-bold">Specializations</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {specialization.map(s => (
                                        <span key={s} className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded-full border border-primary/30">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span className="text-xs text-slate-400 uppercase font-bold">Verified Documents</span>
                                <div className="mt-2 space-y-2">
                                    {uploadedDocs.map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-slate-700/50">
                                            <div className="flex items-center gap-2">
                                                <span className="text-primary text-sm">✓</span>
                                                <span className="text-xs text-white font-medium truncate max-w-[150px]">{doc.name}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-500 uppercase px-2 py-0.5 bg-slate-800 rounded">
                                                {doc.type}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mt-4">
                            <p className="text-xs text-yellow-200">
                                ⏱️ <strong>Review Time:</strong> Your submission will be reviewed within 24-48 hours. You'll receive an email notification once approved.
                            </p>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <GlassButton type="button" onClick={() => setStep(3)} variant="secondary" className="flex-1" disabled={loading}>
                                ← Back
                            </GlassButton>
                            <GlassButton type="submit" className="flex-1" isLoading={loading}>
                                Submit for Verification ✓
                            </GlassButton>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
